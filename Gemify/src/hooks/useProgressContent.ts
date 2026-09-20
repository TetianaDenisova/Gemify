import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";

import type {
  FulfillmentPoint,
  FulfillmentRange,
  ProgressContent,
  TimelineMoment as ProgressTimelineMoment,
  TimelineIconKey,
} from "@/data/progressData";
import {
  getDreams,
  getDreamsWithCompleted,
  getForecastProjection,
  getHabitCompletions,
  getHabitsByDream,
  getHabitScheduleDays,
  getMilestones,
  getQuestsByDream,
  getTimelineMoments,
  saveForecastProjection,
  type Dream,
  type HabitCompletionRecord,
  type Milestone,
  type Quest,
  type TimelineMoment,
} from "@/db";
import {
  dreamWeights,
  forecastCompletion,
  type DreamForecast,
} from "@/domain/forecast";
import { useRefreshOnSync } from "@/hooks/useRefreshOnSync";
import { addDays, startOfWeek, toDateKey } from "@/utils/dates";

const TIMELINE_ICONS: readonly TimelineIconKey[] = [
  "spark",
  "code",
  "userPlus",
  "rocket",
  "chat",
  "target",
];
const VALID_TIMELINE_ICONS: readonly TimelineIconKey[] = [
  ...TIMELINE_ICONS,
  "milestoneCompleted",
];

type Bucket = {
  /** YYYY-MM-DD range, inclusive. */
  end: string;
  key: string;
  label: string;
  start: string;
};

type HabitProgress = {
  completions: HabitCompletionRecord[];
  scheduleDays: number[];
  /** First day with stored habit history; avoids inventing earlier misses. */
  trackingStart: string;
};

function weekBuckets(): Bucket[] {
  const monday = startOfWeek(new Date());
  return Array.from({ length: 7 }, (_, index) => {
    const day = addDays(monday, index);
    const key = toDateKey(day);
    return {
      end: key,
      key,
      label: day.toLocaleDateString("en-US", { weekday: "short" }),
      start: key,
    };
  });
}

function monthBuckets(): Bucket[] {
  const currentMonday = startOfWeek(new Date());
  return Array.from({ length: 4 }, (_, index) => {
    const monday = addDays(currentMonday, (index - 3) * 7);
    return {
      end: toDateKey(addDays(monday, 6)),
      key: `w${index + 1}`,
      label: `W${index + 1}`,
      start: toDateKey(monday),
    };
  });
}

function sixMonthBuckets(): Bucket[] {
  const now = new Date();
  return Array.from({ length: 6 }, (_, index) => {
    const first = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
    const last = new Date(first.getFullYear(), first.getMonth() + 1, 0);
    return {
      end: toDateKey(last),
      key: toDateKey(first),
      label: first.toLocaleDateString("en-US", { month: "short" }),
      start: toDateKey(first),
    };
  });
}

/** Date-only part of a quest's completion timestamp, or null. */
function completedOn(quest: Quest): string | null {
  return quest.completedAt ? quest.completedAt.slice(0, 10) : null;
}

/** Cumulative "% of the goal done by the end of each bucket", exact. */
function cumulativePoints(
  quests: Quest[],
  weights: Map<number, number>,
  buckets: Bucket[],
): FulfillmentPoint[] {
  return buckets.map((bucket) => ({
    key: bucket.key,
    label: bucket.label,
    percent:
      quests
        .filter((quest) => {
          if (!quest.isDone) return false;
          const date = completedOn(quest);
          // Quests without a timestamp still count once done.
          return date === null || date <= bucket.end;
        })
        .reduce((sum, quest) => sum + (weights.get(quest.id) ?? 0), 0) * 100,
  }));
}

/** Cumulative goal-progress range with the "+10% closer" header data. */
function goalRange(
  quests: Quest[],
  weights: Map<number, number>,
  buckets: Bucket[],
  key: string,
  label: string,
  eyebrow: string,
): FulfillmentRange {
  const points = cumulativePoints(quests, weights, buckets);
  // Delta between the *displayed* endpoints, so the header always matches
  // the rounded labels on the chart.
  const delta =
    points.length > 1
      ? Math.round(points[points.length - 1].percent) -
        Math.round(points[0].percent)
      : 0;

  const rangeStart = buckets[0].start;
  const rangeEnd = buckets[buckets.length - 1].end;
  const doneInRange = quests.filter((quest) => {
    if (!quest.isDone) return false;
    const date = completedOn(quest);
    return date !== null && date >= rangeStart && date <= rangeEnd;
  }).length;

  return {
    key,
    label,
    points,
    highlight: {
      eyebrow,
      delta,
      caption: "closer to your goal",
      tasksLabel: `${doneInRange} ${doneInRange === 1 ? "quest" : "quests"}`,
    },
  };
}

/** Every local date in an inclusive YYYY-MM-DD range, capped at today. */
function datesInRange(start: string, end: string, today: string): string[] {
  const last = end < today ? end : today;
  if (start > last) return [];

  const dates: string[] = [];
  let date = new Date(`${start}T12:00:00`);
  const lastDate = new Date(`${last}T12:00:00`);
  while (date <= lastDate) {
    dates.push(toDateKey(date));
    date = addDays(date, 1);
  }
  return dates;
}

/** Per-bucket completion rate of due quests and scheduled habit occurrences. */
function completionRange(
  quests: Quest[],
  habits: HabitProgress[],
  buckets: Bucket[],
  key: string,
  label: string,
  eyebrow: string,
): FulfillmentRange {
  let rangeDone = 0;
  let rangeTotal = 0;
  const today = toDateKey(new Date());

  const points = buckets.map((bucket) => {
    const scheduled = quests.filter(
      (quest) =>
        quest.scheduledDate !== null &&
        quest.scheduledDate >= bucket.start &&
        quest.scheduledDate <= bucket.end &&
        quest.scheduledDate <= today,
    );
    const questDone = scheduled.filter((quest) => quest.isDone).length;

    let habitDone = 0;
    let habitTotal = 0;
    const dates = datesInRange(bucket.start, bucket.end, today);
    for (const { completions, scheduleDays, trackingStart } of habits) {
      const doneDates = new Set(
        completions
          .filter((record) => record.status === "done")
          .map((record) => record.date),
      );
      for (const dateKey of dates) {
        if (dateKey < trackingStart) continue;
        const date = new Date(`${dateKey}T12:00:00`);
        const weekday = (date.getDay() + 6) % 7;
        if (scheduleDays.length > 0 && !scheduleDays.includes(weekday)) continue;
        habitTotal += 1;
        if (doneDates.has(dateKey)) habitDone += 1;
      }
    }

    const done = questDone + habitDone;
    const total = scheduled.length + habitTotal;
    rangeDone += done;
    rangeTotal += total;
    return {
      current: bucket.start <= today && today <= bucket.end,
      key: bucket.key,
      label: bucket.label,
      percent: total > 0 ? Math.round((done / total) * 100) : 0,
    };
  });

  return {
    key,
    label,
    points,
    summary: {
      eyebrow,
      percent: rangeTotal > 0 ? Math.round((rangeDone / rangeTotal) * 100) : 0,
      caption: `${rangeDone} of ${rangeTotal} activities completed`,
    },
  };
}


/** "December 14" — the year only earns its place outside the current one. */
function formatDay(dateKey: string, today: Date): string {
  const date = new Date(`${dateKey}T12:00:00`);
  return date.toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    ...(date.getFullYear() === today.getFullYear()
      ? {}
      : { year: "numeric" }),
  });
}

function etaLabel(daysLeft: number): string {
  return daysLeft < 60
    ? `In ${daysLeft} ${daysLeft === 1 ? "day" : "days"}`
    : `In ${Math.round(daysLeft / 30)} months`;
}

/**
 * The banner copy for a projection — null when the dream has not earned a
 * forecast yet: no quests, or none ever completed. Nothing to predict from,
 * so the section stays off the screen entirely rather than guessing.
 */
function forecastCopy(
  projection: DreamForecast,
  today: Date,
): ProgressContent["forecast"] {
  switch (projection.reason) {
    case "no-quests":
    case "never-started":
      return null;
    case "undated":
      return {
        headline: "Complete a few quests and the forecast will appear.",
        date: "Keep going.",
        eta: "No recent data",
      };
    case "out-of-range":
      return {
        headline: "This pace puts your goal years away —",
        date: "plan a few more quests each week.",
        eta: "Out of range",
      };
    case "complete":
      return {
        headline: "Every quest is complete —",
        // Completions that predate the timestamp column cannot name a day.
        date:
          projection.date === null
            ? "you made it real."
            : `on ${formatDay(projection.date, today)}`,
        eta: "Done",
      };
    case "projected":
      return {
        headline: "You’re on track to reach your goal",
        date: `by ${formatDay(projection.date ?? "", today)}`,
        eta: etaLabel(projection.daysLeft ?? 1),
      };
  }
}

/**
 * Projects the dream, remembers the day it showed, and returns the copy.
 * The remembered day is what keeps the banner still: the projection only
 * moves the date when the estimate drifts past the threshold in
 * src/domain/forecast.ts, and the cache is per-device (nothing synced,
 * nothing backed up — it is derived from the quests themselves).
 */
async function projectForecast(
  dreamId: number,
  quests: Quest[],
  milestones: Milestone[],
): Promise<ProgressContent["forecast"]> {
  const today = new Date();
  const previous = await getForecastProjection(dreamId);
  const projection = forecastCompletion({
    quests,
    milestones,
    previous,
    today,
  });

  const shown = projection.reason === "projected" ? projection.date : null;
  if (shown !== previous) await saveForecastProjection(dreamId, shown);

  return forecastCopy(projection, today);
}

function toProgressMoment(
  moment: Omit<TimelineMoment, "dreamId">,
  index: number,
): ProgressTimelineMoment {
  const iconKey = VALID_TIMELINE_ICONS.includes(moment.iconKey as TimelineIconKey)
    ? (moment.iconKey as TimelineIconKey)
    : TIMELINE_ICONS[index % TIMELINE_ICONS.length];
  return {
    date: new Date(`${moment.occurredOn}T12:00:00`).toLocaleDateString(
      "en-US",
      { day: "numeric", month: "short", year: "numeric" },
    ),
    description: moment.description,
    icon: iconKey,
    key: String(moment.id),
    label: moment.label,
    locked: moment.isLocked,
    occurredOn: moment.occurredOn,
    photoUris: moment.photoUris,
  };
}

export type UseProgressContentResult = {
  content: ProgressContent;
  /** Resolved dream behind the selected goal key; null when no dreams exist. */
  dreamId: number | null;
  loading: boolean;
  refresh: () => Promise<void>;
};

/**
 * Builds the ProgressContent view-model the Progress screen renders, from
 * real dreams, quests and timeline moments. `goalKey` is the selected dream id
 * as a string ("" or unknown falls back to the first dream).
 *
 * `includeCompleted` keeps finished dreams in the list — the Memories screen
 * wants them (their memories are the point), the Progress screen does not.
 */
export function useProgressContent(
  goalKey: string,
  includeCompleted = false,
): UseProgressContentResult {
  const [dreams, setDreams] = useState<Dream[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [habits, setHabits] = useState<HabitProgress[]>([]);
  const [moments, setMoments] = useState<ProgressTimelineMoment[]>([]);
  // Built in refresh(), not in the memo below: projecting reads and writes
  // the remembered date, and neither belongs in a render.
  const [forecast, setForecast] =
    useState<ProgressContent["forecast"]>(null);
  const [loading, setLoading] = useState(true);

  const parsedKey = Number(goalKey);
  const selectedDream =
    dreams.find((dream) => dream.id === parsedKey) ?? dreams[0] ?? null;
  const dreamId = selectedDream?.id ?? null;

  const refresh = useCallback(async () => {
    try {
      const dreamList = includeCompleted
        ? await getDreamsWithCompleted()
        : await getDreams();
      setDreams(dreamList);

      const resolved =
        dreamList.find((dream) => dream.id === parsedKey) ?? dreamList[0];
      if (!resolved) {
        setMilestones([]);
        setQuests([]);
        setHabits([]);
        setMoments([]);
        setForecast(null);
        return;
      }
      const [milestoneList, questList, momentList, habitList] =
        await Promise.all([
          getMilestones(resolved.id),
          getQuestsByDream(resolved.id),
          getTimelineMoments(resolved.id),
          getHabitsByDream(resolved.id),
        ]);
      const historyStart = sixMonthBuckets()[0].start;
      const today = toDateKey(new Date());
      const habitProgress = await Promise.all(
        habitList.map(async (habit) => {
          const [scheduleDays, completions] = await Promise.all([
            getHabitScheduleDays(habit.id),
            getHabitCompletions(habit.id, historyStart, today),
          ]);
          return {
            completions,
            scheduleDays,
            trackingStart: completions[0]?.date ?? today,
          };
        }),
      );
      setMilestones(milestoneList);
      setQuests(questList);
      setHabits(habitProgress);
      setMoments(momentList.map(toProgressMoment));
      setForecast(await projectForecast(resolved.id, questList, milestoneList));
    } catch (cause) {
      console.error("Failed to load progress data", cause);
    } finally {
      setLoading(false);
    }
  }, [includeCompleted, parsedKey]);

  useRefreshOnSync(refresh);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  // `milestones` only feeds the weight table — isolate it so a milestone-array
  // identity change doesn't rebuild the whole content object below. The same
  // split the home card shows, so the charts and the card agree.
  const weights = useMemo(
    () => dreamWeights(quests, milestones).shares,
    [milestones, quests],
  );

  const content = useMemo<ProgressContent>(() => {
    const week = weekBuckets();
    const month = monthBuckets();
    const sixMonths = sixMonthBuckets();

    return {
      title: "Progress",
      subtitle: "Evidence that your future is becoming real.",
      goals:
        dreams.length > 0
          ? dreams.map((dream) => ({
              key: String(dream.id),
              label: dream.title,
            }))
          : [{ key: "none", label: "No dreams yet" }],
      forecast,
      moments,
      fulfillmentTabs: [
        {
          key: "goal",
          label: "Goal Progress",
          chart: "line",
          ranges: [
            goalRange(quests, weights, week, "week", "Week", "This week"),
            goalRange(quests, weights, month, "month", "Month", "This month"),
            goalRange(
              quests,
              weights,
              sixMonths,
              "6months",
              "6 Months",
              "Last 6 months",
            ),
          ],
        },
        {
          key: "daily",
          label: "Quest & Habit Completion",
          chart: "bars",
          ranges: [
            completionRange(
              quests,
              habits,
              week,
              "week",
              "Week",
              "Weekly Average",
            ),
            completionRange(
              quests,
              habits,
              month,
              "month",
              "Month",
              "Monthly Average",
            ),
            completionRange(
              quests,
              habits,
              sixMonths,
              "6months",
              "6 Months",
              "6-Month Average",
            ),
          ],
        },
      ],
      overallLabel: "Overall Goal Progress",
      hasChartData:
        quests.some((quest) => quest.isDone) ||
        habits.some(({ completions }) =>
          completions.some((record) => record.status === "done"),
        ),
    };
  }, [dreams, forecast, habits, moments, quests, weights]);

  return { content, dreamId, loading, refresh };
}
