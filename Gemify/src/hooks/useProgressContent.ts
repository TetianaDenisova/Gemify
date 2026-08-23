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
  getTasksByDream,
  getTimelineMoments,
  type Dream,
  type Task,
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

/** Date-only part of a task's completion timestamp, or null. */
function completedOn(task: Task): string | null {
  return task.completedAt ? task.completedAt.slice(0, 10) : null;
}

/** Cumulative "% of all dream tasks done by the end of each bucket". */
function cumulativePoints(tasks: Task[], buckets: Bucket[]): FulfillmentPoint[] {
  const total = tasks.length;
  return buckets.map((bucket) => ({
    key: bucket.key,
    label: bucket.label,
    percent:
      total > 0
        ? Math.round(
            (tasks.filter((task) => {
              if (!task.isDone) return false;
              const date = completedOn(task);
              // Tasks without a timestamp still count once done.
              return date === null || date <= bucket.end;
            }).length /
              total) *
              100,
          )
        : 0,
  }));
}

/** Cumulative goal-progress range with the "+10% closer" header data. */
function goalRange(
  tasks: Task[],
  buckets: Bucket[],
  key: string,
  label: string,
  eyebrow: string,
): FulfillmentRange {
  const points = cumulativePoints(tasks, buckets);
  const delta =
    points.length > 1 ? points[points.length - 1].percent - points[0].percent : 0;

  const rangeStart = buckets[0].start;
  const rangeEnd = buckets[buckets.length - 1].end;
  const doneInRange = tasks.filter((task) => {
    if (!task.isDone) return false;
    const date = completedOn(task);
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
      tasksLabel: `${doneInRange} ${doneInRange === 1 ? "task" : "tasks"}`,
    },
  };
}

/** Per-bucket completion rate of tasks scheduled inside the bucket. */
function completionRange(
  tasks: Task[],
  buckets: Bucket[],
  key: string,
  label: string,
  eyebrow: string,
): FulfillmentRange {
  let rangeDone = 0;
  let rangeTotal = 0;

  const points = buckets.map((bucket) => {
    const scheduled = tasks.filter(
      (task) =>
        task.scheduledDate !== null &&
        task.scheduledDate >= bucket.start &&
        task.scheduledDate <= bucket.end,
    );
    const done = scheduled.filter((task) => task.isDone).length;
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
      caption: `${rangeDone} of ${rangeTotal} tasks completed`,
    },
  };
}

function buildForecast(tasks: Task[]): ProgressContent["forecast"] {
  const total = tasks.length;
  const done = tasks.filter((task) => task.isDone).length;

  if (total === 0) {
    return {
      headline: "Add tasks to your quests to unlock the forecast.",
      date: "Your journey starts now.",
      eta: "No data yet",
    };
  }
  if (done >= total) {
    return {
      headline: "Every task is complete —",
      date: "you made it real.",
      eta: "Done",
    };
  }

  const cutoff = toDateKey(addDays(new Date(), -30));
  const recentDone = tasks.filter((task) => {
    const date = completedOn(task);
    return date !== null && date >= cutoff;
  }).length;

  if (recentDone === 0) {
    return {
      headline: "Complete a few tasks and the forecast will appear.",
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
  moment: { iconKey: string | null; id: number; isLocked: boolean; label: string; occurredOn: string },
  index: number,
): ProgressTimelineMoment {
  const iconKey = TIMELINE_ICONS.includes(moment.iconKey as TimelineIconKey)
    ? (moment.iconKey as TimelineIconKey)
    : TIMELINE_ICONS[index % TIMELINE_ICONS.length];
  return {
    date: new Date(`${moment.occurredOn}T12:00:00`).toLocaleDateString(
      "en-US",
      { day: "numeric", month: "short" },
    ),
    icon: iconKey,
    key: String(moment.id),
    label: moment.label,
    locked: moment.isLocked,
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
 * real dreams, tasks and timeline moments. `goalKey` is the selected dream id
 * as a string ("" or unknown falls back to the first dream).
 */
export function useProgressContent(goalKey: string): UseProgressContentResult {
  const [dreams, setDreams] = useState<Dream[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
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
        setTasks([]);
        setMoments([]);
        return;
      }
      const [taskList, momentList] = await Promise.all([
        getTasksByDream(resolved.id),
        getTimelineMoments(resolved.id),
      ]);
      setTasks(taskList);
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
      forecast: buildForecast(tasks),
      moments,
      fulfillmentTabs: [
        {
          key: "goal",
          label: "Goal Progress",
          chart: "line",
          ranges: [
            goalRange(tasks, week, "week", "Week", "This week"),
            goalRange(tasks, month, "month", "Month", "This month"),
            goalRange(tasks, sixMonths, "6months", "6 Months", "Last 6 months"),
          ],
        },
        {
          key: "daily",
          label: "Task Completion",
          chart: "bars",
          ranges: [
            completionRange(tasks, week, "week", "Week", "Weekly Average"),
            completionRange(tasks, month, "month", "Month", "Monthly Average"),
            completionRange(
              tasks,
              sixMonths,
              "6months",
              "6 Months",
              "6-Month Average",
            ),
          ],
        },
      ],
      overallLabel: "Overall Goal Progress",
      hasChartData: tasks.some((task) => task.isDone),
    };
  }, [dreams, moments, tasks]);

  return { content, dreamId, loading, refresh };
}
