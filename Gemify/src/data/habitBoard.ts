import type { HabitCompletion } from "@/components/HabitItem";
import { habitVisualsFor, type HabitVisuals } from "@/data/habitVisuals";
import type { HabitDetailSection as DbHabitDetailSection } from "@/db";
import type { HabitWeekView } from "@/hooks/useHabitWeek";

export type BoardDetailSection = {
  /** Rows with a checkbox toggle today's "partial" status; plan rows do not. */
  checkable: boolean;
  icon: "sun" | "feather" | "shield";
  /** The DB detail section backing this panel (check state is stored by it). */
  key: DbHabitDetailSection;
  rows: readonly string[];
  title: string;
};

export type BoardHabit = {
  accent: string;
  day: number;
  /** Dream the habit belongs to, shown beside the time on the card. */
  dreamTitle?: string;
  details: readonly BoardDetailSection[];
  goal: number;
  icon: "workout" | "water" | "book" | "meditate";
  id: number;
  progress: readonly HabitCompletion[];
  /** Consecutive practiced days up to today (phone card 🔥 line). */
  streakDays: number;
  time: string;
  title: string;
  /** The icon/accent the habit keeps on every phone screen. */
  visuals: HabitVisuals;
};

const HABIT_ICON_CYCLE = ["workout", "water", "book", "meditate"] as const;

/** DB habit view → the row shape the habit board renders. */
export function toBoardHabit(
  view: HabitWeekView,
  index: number,
  tint: string,
): BoardHabit {
  const rowsFor = (...sections: string[]) =>
    view.details
      .filter((entry) => sections.includes(entry.section))
      .map((entry) => entry.content);

  // Three panels: the two ease helpers are checkable — ticking one marks
  // today half-done — and the contingency plan is read-only. A section with
  // no content stays hidden.
  const allSections: BoardDetailSection[] = [
    {
      checkable: true,
      icon: "sun",
      key: "easy_start",
      rows: rowsFor("easy_start"),
      title: "Make It Easy",
    },
    {
      checkable: true,
      icon: "feather",
      key: "easy_version",
      rows: rowsFor("easy_version"),
      title: "Easy version for a bad day",
    },
    {
      checkable: false,
      icon: "shield",
      key: "backup_plan",
      rows: rowsFor("backup_plan"),
      title: "Obstacles & backup plan",
    },
  ];
  const sections = allSections.filter((section) => section.rows.length > 0);

  return {
    accent: tint,
    day: view.doneCount,
    details: sections,
    goal: view.habit.goalDays,
    icon: HABIT_ICON_CYCLE[index % HABIT_ICON_CYCLE.length],
    id: view.habit.id,
    progress: view.weekProgress,
    streakDays: view.streakDays,
    time: view.habit.cue || view.timeLabel,
    title: view.habit.title,
    visuals: habitVisualsFor(view.habit),
  };
}
