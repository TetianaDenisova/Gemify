import { useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";

import { getTimeBlocksForDate, setActionDone } from "@/db";
import type { TimeBlock } from "@/data/timeBlocks";

/** UI time block enriched with the DB ids needed to persist toggles. */
export type TimeBlockView = Omit<TimeBlock, "actions"> & {
  id: number;
  actions: (TimeBlock["actions"][number] & { id: number })[];
};

export type UseTimeBlocksResult = {
  blocks: TimeBlockView[];
  loading: boolean;
  error: string | null;
  /** Total/completed routine actions for the date, derived from `blocks`. */
  totalActions: number;
  completedActions: number;
  /** Persists the toggle and updates local state optimistically. */
  toggleAction: (actionId: number, done: boolean) => void;
  refresh: () => Promise<void>;
};

/**
 * Daily routine blocks for a YYYY-MM-DD date, mapped to the shape
 * TimeBlockCard consumes. Home and My Day share this hook, so a checkmark
 * set on one screen shows on the other after focus.
 */
export function useTimeBlocks(date: string): UseTimeBlocksResult {
  const [blocks, setBlocks] = useState<TimeBlockView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  const refresh = useCallback(async () => {
    try {
      const records = await getTimeBlocksForDate(date);
      if (!mounted.current) return;
      setBlocks(
        records.map((block) => ({
          id: block.id,
          key: block.key,
          label: block.label,
          icon: block.iconKey as TimeBlock["icon"],
          time: block.startTime ?? "Flexible",
          identity: block.identity ?? "",
          routineTitle: block.routineTitle,
          routineSubtitle: block.routineSubtitle ?? "",
          actions: block.actions.map((action) => ({
            id: action.id,
            done: action.done,
            icon: action.iconKey as TimeBlock["actions"][number]["icon"],
            subtitle: action.subtitle ?? "",
            title: action.title,
          })),
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

  const toggleAction = useCallback(
    (actionId: number, done: boolean) => {
      setBlocks((current) =>
        current.map((block) => ({
          ...block,
          actions: block.actions.map((action) =>
            action.id === actionId ? { ...action, done } : action,
          ),
        })),
      );
      setActionDone(actionId, date, done).catch((cause: unknown) => {
        console.error("Failed to save the action state", cause);
        if (mounted.current) refresh();
      });
    },
    [date, refresh],
  );

  const totalActions = blocks.reduce(
    (sum, block) => sum + block.actions.length,
    0,
  );
  const completedActions = blocks.reduce(
    (sum, block) => sum + block.actions.filter((action) => action.done).length,
    0,
  );

  return {
    blocks,
    loading,
    error,
    totalActions,
    completedActions,
    toggleAction,
    refresh,
  };
}
