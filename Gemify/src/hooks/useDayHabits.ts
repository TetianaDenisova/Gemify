import { useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";

import {
  getHabitCompletions,
  getHabits,
  getHabitScheduleDays,
  setHabitCompletion,
  type Habit,
} from "@/db";
import type { ActionIcon } from "@/dto/timeBlocks";
import { useRefreshOnSync } from "@/hooks/useRefreshOnSync";
import { habitStreakDays, streakLookbackStart } from "@/utils/habitStreak";

/** A habit due on the viewed day, with that day's done state. */
export type DayHabitView = {
  /** Time block the habit belongs to; null = anytime. */
  blockKey: string | null;
  done: boolean;
  habit: Habit;
  /** Consecutive practiced days up to the viewed day (🔥 streak). */
  streakDays: number;
};

export type UseDayHabitsResult = {
  habits: DayHabitView[];
  loading: boolean;
  error: string | null;
  /** Persists the day's status and updates local state optimistically. */
  setDone: (habitId: number, done: boolean) => Promise<void>;
  refresh: () => Promise<void>;
};

/** Dream-magic icon variety for habits, stable per habit id. */
const HABIT_ICONS: readonly ActionIcon[] = [
  "moon",
  "crystal",
  "feather",
  "star",
  "wand",
  "key",
];

/** The dream-magic icon a habit keeps everywhere it appears. */
export function habitIconForId(habitId: number): ActionIcon {
  return HABIT_ICONS[habitId % HABIT_ICONS.length];
}

/** Monday-first weekday index (0 = Monday) of a YYYY-MM-DD key. */
function weekdayIndex(date: string): number {
  return (new Date(`${date}T00:00:00`).getDay() + 6) % 7;
}

/**
 * The habits practiced on one day — those whose schedule covers that weekday
 * (an empty schedule means every day), each with the day's completion state.
 * Loaded fresh on focus, like the day's quests.
 */
export function useDayHabits(date: string): UseDayHabitsResult {
  const [habits, setHabits] = useState<DayHabitView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  const refresh = useCallback(async () => {
    try {
      const list = await getHabits();
      const weekday = weekdayIndex(date);

      const entries = await Promise.all(
        list.map(async (habit) => {
          const [scheduleDays, completions] = await Promise.all([
            getHabitScheduleDays(habit.id),
            getHabitCompletions(habit.id, streakLookbackStart(date), date),
          ]);
          const statusByDate = new Map(
            completions.map((record) => [record.date, record.status]),
          );
          return {
            due: scheduleDays.length === 0 || scheduleDays.includes(weekday),
            view: {
              blockKey: habit.timeOfDay,
              done: statusByDate.get(date) === "done",
              habit,
              streakDays: habitStreakDays(statusByDate, scheduleDays, date),
            },
          };
        }),
      );

      if (!mounted.current) return;
      setHabits(entries.filter((entry) => entry.due).map((entry) => entry.view));
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
  }, [date]);

  useRefreshOnSync(refresh);

  useFocusEffect(
    useCallback(() => {
      mounted.current = true;
      refresh();
      return () => {
        mounted.current = false;
      };
    }, [refresh]),
  );

  const setDone = useCallback(
    (habitId: number, done: boolean) => {
      setHabits((current) =>
        current.map((view) =>
          view.habit.id === habitId ? { ...view, done } : view,
        ),
      );
      return setHabitCompletion(habitId, date, done ? "done" : null).then(
        // Reload so the streak reflects the change.
        () => {
          if (mounted.current) refresh();
        },
        (cause: unknown) => {
          console.error("Failed to save the habit completion", cause);
          if (mounted.current) refresh();
        },
      );
    },
    [date, refresh],
  );

  return { habits, loading, error, setDone, refresh };
}
