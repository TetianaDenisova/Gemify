/**
 * Seed content for the v2 schema. Deliberately self-contained copies (not
 * imports from src/data/*): migrations must stay runnable forever, while the
 * dummy data files they were copied from will be deleted as screens get wired
 * to the database. Treat everything referenced by a shipped migration as
 * immutable — evolve seeds through new migrations instead.
 */

/** Feeling-state catalog labels (from state.tsx STATES; glyphs stay in code). */
export const FEELING_STATE_LABELS: readonly string[] = [
  "Alive",
  "Free",
  "Powerful",
  "Calm",
  "Peaceful",
  "Magnetic",
  "Creative",
  "Loved",
  "Clear",
  "Confident",
  "Connected",
  "Joyful",
  "Safe",
  "Energized",
  "Desired",
];

export type TimeBlockSeed = {
  iconKey: string;
  key: string;
  label: string;
  /** HH:MM, or null for "flexible / anytime". */
  startTime: string | null;
};

/** Default day time blocks — just the tab-strip frames, no routine content. */
export const TIME_BLOCK_SEEDS: readonly TimeBlockSeed[] = [
  { key: "anytime", label: "Anytime", iconKey: "clock", startTime: null },
  { key: "wake-up", label: "After wake-up", iconKey: "sunrise", startTime: "06:00" },
  { key: "before-work", label: "Before work", iconKey: "briefcase", startTime: "08:30" },
  { key: "day", label: "Day", iconKey: "sun", startTime: "13:00" },
  { key: "evening", label: "Evening", iconKey: "moon", startTime: "21:00" },
];
