import { useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";

import type { TimeBlock } from "@/dto/timeBlocks";
import {
  getScheduledTasks,
  getTimeBlocksForDate,
  setTaskDone,
  type TaskWithBreadcrumb,
} from "@/db";

/**
 * A day's schedule: the routine time-block frames (labels, times, identity)
 * filled with the REAL tasks planned in the weekly sprint — each task belongs
 * to a quest under a milestone, and lands in the block whose start time most
 * recently precedes its scheduled time (no time → the flexible block).
 */
export type TaskBlockView = Omit<TimeBlock, "actions"> & {
  actions: (TimeBlock["actions"][number] & { taskId: number })[];
};

export type UseDayTaskBlocksResult = {
  blocks: TaskBlockView[];
  loading: boolean;
  error: string | null;
  totalTasks: number;
  completedTasks: number;
  /** Persists the done state and updates local state optimistically. */
  toggleTask: (taskId: number, done: boolean) => void;
  refresh: () => Promise<void>;
};

/** Key of the block whose start time most recently passed (Home focus). */
export function currentBlockKey(
  blocks: readonly TaskBlockView[],
  now: Date,
): string | null {
  const clock = `${String(now.getHours()).padStart(2, "0")}:${String(
    now.getMinutes(),
  ).padStart(2, "0")}`;

  let key: string | null = null;
  let latest = "";
  for (const block of blocks) {
    if (block.time !== "Flexible" && block.time <= clock && block.time >= latest) {
      latest = block.time;
      key = block.key;
    }
  }
  return key ?? blocks.find((block) => block.time === "Flexible")?.key ?? null;
}

function toAction(task: TaskWithBreadcrumb): TaskBlockView["actions"][number] {
  return {
    done: task.isDone,
    icon: "focus",
    subtitle: task.scheduledTime
      ? `${task.scheduledTime} · ${task.questTitle}`
      : task.questTitle,
    taskId: task.id,
    title: task.title,
  };
}

export function useDayTaskBlocks(date: string): UseDayTaskBlocksResult {
  const [blocks, setBlocks] = useState<TaskBlockView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  const refresh = useCallback(async () => {
    try {
      const [blockDefs, tasks] = await Promise.all([
        getTimeBlocksForDate(date),
        getScheduledTasks(date),
      ]);

      // Timed blocks in start-time order; the flexible block collects tasks
      // without a time and tasks earlier than the first timed block.
      const timed = blockDefs
        .filter((block) => block.startTime !== null)
        .sort((a, b) => (a.startTime! < b.startTime! ? -1 : 1));
      const flexibleKey =
        blockDefs.find((block) => block.startTime === null)?.key ??
        blockDefs[0]?.key;

      const tasksByBlock = new Map<string, TaskWithBreadcrumb[]>();
      for (const task of tasks) {
        let key = flexibleKey;
        if (task.scheduledTime) {
          for (const block of timed) {
            if (block.startTime! <= task.scheduledTime) key = block.key;
          }
        }
        if (key === undefined) continue;
        const list = tasksByBlock.get(key) ?? [];
        list.push(task);
        tasksByBlock.set(key, list);
      }

      if (!mounted.current) return;
      setBlocks(
        blockDefs.map((block) => ({
          key: block.key,
          label: block.label,
          icon: block.iconKey as TimeBlock["icon"],
          time: block.startTime ?? "Flexible",
          identity: block.identity ?? "",
          routineTitle: block.routineTitle,
          routineSubtitle: block.routineSubtitle ?? "",
          actions: (tasksByBlock.get(block.key) ?? []).map(toAction),
        })),
      );
      setError(null);
    } catch (cause) {
      if (mounted.current) {
        setError(
          cause instanceof Error ? cause.message : "Failed to load your day.",
        );
      }
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [date]);

  useFocusEffect(
    useCallback(() => {
      mounted.current = true;
      refresh();
      return () => {
        mounted.current = false;
      };
    }, [refresh]),
  );

  const toggleTask = useCallback(
    (taskId: number, done: boolean) => {
      setBlocks((current) =>
        current.map((block) => ({
          ...block,
          actions: block.actions.map((action) =>
            action.taskId === taskId ? { ...action, done } : action,
          ),
        })),
      );
      setTaskDone(taskId, done).catch((cause: unknown) => {
        console.error("Failed to save the task state", cause);
        if (mounted.current) refresh();
      });
    },
    [refresh],
  );

  const totalTasks = blocks.reduce(
    (sum, block) => sum + block.actions.length,
    0,
  );
  const completedTasks = blocks.reduce(
    (sum, block) => sum + block.actions.filter((action) => action.done).length,
    0,
  );

  return { blocks, loading, error, totalTasks, completedTasks, toggleTask, refresh };
}
