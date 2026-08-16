import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useRef, useState } from "react";

import type { HabitCompletion } from "@/components/HabitItem";
import {
  getHabitCompletions,
  getHabitDetails,
  getHabitDoneCount,
  getHabits,
  getHabitsByDream,
  getHabitScheduleDays,
  setHabitCompletion,
  type Habit,
  type HabitCompletionStatus,
  type HabitDetailEntry,
} from "@/db";
import { addDays, startOfWeek, toDateKey } from "@/utils/dates";

export type HabitWeekView = {
  habit: Habit;
  /** Weekdays practiced; 0 = Monday .. 6 = Sunday. */
  scheduleDays: number[];
  /** Total days ever recorded as done ("Day N" counter). */
  doneCount: number;
  /** Status per current-week day, Monday first; no record = "open". */
  weekProgress: HabitCompletion[];
  details: HabitDetailEntry[];
};

export type UseHabitWeekResult = {
  habits: HabitWeekView[];
  loading: boolean;
  error: string | null;
  /** YYYY-MM-DD for each day of the current week, Monday first. */
  weekDates: string[];
  refresh: () => Promise<void>;
  /** Sets/clears a day's status and refreshes the list. */
  setCompletion: (
    habitId: number,
    date: string,
    status: HabitCompletionStatus | null,
  ) => Promise<void>;
};

/**
 * Habits with their current-week completions, schedule and details, loaded
 * fresh on every focus. Pass `dreamId` to scope to one dream (quests screen);
 * omit it for all habits (Habits tab).
 */
export function useHabitWeek(dreamId?: number): UseHabitWeekResult {
  const [habits, setHabits] = useState<HabitWeekView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  const weekDates = useMemo(() => {
    const monday = startOfWeek(new Date());
    return Array.from({ length: 7 }, (_, index) =>
      toDateKey(addDays(monday, index)),
    );
  }, []);

  const refresh = useCallback(async () => {
    try {
      const list =
        dreamId !== undefined ? await getHabitsByDream(dreamId) : await getHabits();

      const views = await Promise.all(
        list.map(async (habit): Promise<HabitWeekView> => {
          const [scheduleDays, completions, doneCount, details] =
            await Promise.all([
              getHabitScheduleDays(habit.id),
              getHabitCompletions(habit.id, weekDates[0], weekDates[6]),
              getHabitDoneCount(habit.id),
              getHabitDetails(habit.id),
            ]);
          const statusByDate = new Map(
            completions.map((record) => [record.date, record.status]),
          );
          return {
            habit,
            scheduleDays,
            doneCount,
            details,
            weekProgress: weekDates.map(
              (date) => statusByDate.get(date) ?? "open",
            ),
          };
        }),
      );

      if (!mounted.current) return;
      setHabits(views);
      setError(null);
    } catch (cause) {
      if (mounted.current) {
        setError(
          cause instanceof Error ? cause.message : "Failed to load habits.",
        );
      }
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [dreamId, weekDates]);

  useFocusEffect(
    useCallback(() => {
      mounted.current = true;
      refresh();
      return () => {
        mounted.current = false;
      };
    }, [refresh]),
  );

  const setCompletion = useCallback(
    async (
      habitId: number,
      date: string,
      status: HabitCompletionStatus | null,
    ) => {
      try {
        await setHabitCompletion(habitId, date, status);
        await refresh();
      } catch (cause) {
        console.error("Failed to save the habit completion", cause);
      }
    },
    [refresh],
  );

  return { habits, loading, error, weekDates, refresh, setCompletion };
}

/** Display label for a habit's time of day. */
export function habitTimeLabel(timeOfDay: Habit["timeOfDay"]): string {
  switch (timeOfDay) {
    case "morning":
      return "Morning";
    case "after_lunch":
      return "After lunch";
    case "evening":
      return "Evening";
    default:
      return "Anytime";
  }
}
