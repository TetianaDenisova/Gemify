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
  getMilestones,
  getQuestsByDream,
  getTimelineMoments,
  type Dream,
  type Milestone,
  type Quest,
} from "@/db";
import { addDays, startOfWeek, toDateKey } from "@/utils/dates";

const TIMELINE_ICONS: readonly TimelineIconKey[] = [
  "spark",
  "code",
  "userPlus",
  "rocket",
  "chat",
  "target",
];

type Bucket = {
  /** YYYY-MM-DD range, inclusive. */
  end: string;
  key: string;
  label: string;
  start: string;
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

/**
 * Each quest's contribution to the overall goal, as a fraction of 1: 100% is
 * split equally across the dream's milestones, and each milestone's share
 * equally across its quests. Values stay exact (no rounding) so completing
 * everything sums to exactly 1 — round only when displaying.
 */
function questWeights(
  milestones: Milestone[],
  quests: Quest[],
): Map<number, number> {
  const weights = new Map<number, number>();
  if (milestones.length === 0) {
    // No structure to weight by — fall back to equal quest shares.
    quests.forEach((quest) => weights.set(quest.id, 1 / quests.length));
    return weights;
  }

  const milestoneShare = 1 / milestones.length;
  for (const milestone of milestones) {
    const milestoneQuests = quests.filter(
      (quest) => quest.milestoneId === milestone.id,
    );
    if (milestoneQuests.length === 0) continue;
    const questShare = milestoneShare / milestoneQuests.length;
    milestoneQuests.forEach((quest) => weights.set(quest.id, questShare));
  }
  return weights;
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

/** Per-bucket completion rate of quests scheduled inside the bucket. */
function completionRange(
  quests: Quest[],
  buckets: Bucket[],
  key: string,
  label: string,
  eyebrow: string,
): FulfillmentRange {
  let rangeDone = 0;
  let rangeTotal = 0;

  const points = buckets.map((bucket) => {
    const scheduled = quests.filter(
      (quest) =>
        quest.scheduledDate !== null &&
        quest.scheduledDate >= bucket.start &&
        quest.scheduledDate <= bucket.end,
    );
    const done = scheduled.filter((quest) => quest.isDone).length;
    rangeDone += done;
    rangeTotal += scheduled.length;
    const today = toDateKey(new Date());
    return {
      current: bucket.start <= today && today <= bucket.end,
      key: bucket.key,
      label: bucket.label,
      percent:
        scheduled.length > 0 ? Math.round((done / scheduled.length) * 100) : 0,
    };
  });

  return {
    key,
    label,
    points,
    summary: {
      eyebrow,
      percent: rangeTotal > 0 ? Math.round((rangeDone / rangeTotal) * 100) : 0,
      caption: `${rangeDone} of ${rangeTotal} quests completed`,
    },
  };
}

function buildForecast(quests: Quest[]): ProgressContent["forecast"] {
  const total = quests.length;
  const done = quests.filter((quest) => quest.isDone).length;

  if (total === 0) {
    return {
      headline: "Add quests to your milestones to unlock the forecast.",
      date: "Your journey starts now.",
      eta: "No data yet",
    };
  }
  if (done >= total) {
    return {
      headline: "Every quest is complete —",
      date: "you made it real.",
      eta: "Done",
    };
  }

  const cutoff = toDateKey(addDays(new Date(), -30));
  const recentDone = quests.filter((quest) => {
    const date = completedOn(quest);
    return date !== null && date >= cutoff;
  }).length;

  if (recentDone === 0) {
    return {
      headline: "Complete a few quests and the forecast will appear.",
      date: "Keep going.",
      eta: "No recent data",
    };
  }

  const daysLeft = Math.ceil((total - done) / (recentDone / 30));
  const finish = addDays(new Date(), daysLeft);
  const eta =
    daysLeft < 60
      ? `In ${daysLeft} ${daysLeft === 1 ? "day" : "days"}`
      : `In ${Math.round(daysLeft / 30)} months`;

  return {
    headline: "Stay consistent and you will finish by",
    date: `${finish.toLocaleDateString("en-US", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })}.`,
    eta,
  };
}

function toProgressMoment(
  moment: {
    description: string | null;
    iconKey: string | null;
    id: number;
    isLocked: boolean;
    label: string;
    occurredOn: string;
    photoUris: string[];
  },
  index: number,
): ProgressTimelineMoment {
  const iconKey = TIMELINE_ICONS.includes(moment.iconKey as TimelineIconKey)
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
 */
export function useProgressContent(goalKey: string): UseProgressContentResult {
  const [dreams, setDreams] = useState<Dream[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [moments, setMoments] = useState<ProgressTimelineMoment[]>([]);
  const [loading, setLoading] = useState(true);

  const parsedKey = Number(goalKey);
  const selectedDream =
    dreams.find((dream) => dream.id === parsedKey) ?? dreams[0] ?? null;
  const dreamId = selectedDream?.id ?? null;

  const refresh = useCallback(async () => {
    try {
      const dreamList = await getDreams();
      setDreams(dreamList);

      const resolved =
        dreamList.find((dream) => dream.id === parsedKey) ?? dreamList[0];
      if (!resolved) {
        setMilestones([]);
        setQuests([]);
        setMoments([]);
        return;
      }
      const [milestoneList, questList, momentList] = await Promise.all([
        getMilestones(resolved.id),
        getQuestsByDream(resolved.id),
        getTimelineMoments(resolved.id),
      ]);
      setMilestones(milestoneList);
      setQuests(questList);
      setMoments(momentList.map(toProgressMoment));
    } catch (cause) {
      console.error("Failed to load progress data", cause);
    } finally {
      setLoading(false);
    }
  }, [parsedKey]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const content = useMemo<ProgressContent>(() => {
    const week = weekBuckets();
    const month = monthBuckets();
    const sixMonths = sixMonthBuckets();
    const weights = questWeights(milestones, quests);

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
      forecast: buildForecast(quests),
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
          label: "Quest Completion",
          chart: "bars",
          ranges: [
            completionRange(quests, week, "week", "Week", "Weekly Average"),
            completionRange(quests, month, "month", "Month", "Monthly Average"),
            completionRange(
              quests,
              sixMonths,
              "6months",
              "6 Months",
              "6-Month Average",
            ),
          ],
        },
      ],
      overallLabel: "Overall Goal Progress",
      hasChartData: quests.some((quest) => quest.isDone),
    };
  }, [dreams, milestones, moments, quests]);

  return { content, dreamId, loading, refresh };
}
