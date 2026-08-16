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
  actions: readonly {
    iconKey: string;
    subtitle: string | null;
    title: string;
  }[];
  iconKey: string;
  identity: string | null;
  key: string;
  label: string;
  routineSubtitle: string | null;
  routineTitle: string;
  /** HH:MM, or null for "flexible / anytime". */
  startTime: string | null;
};

/** Daily routine blocks (from src/data/timeBlocks.ts, minus completion state). */
export const TIME_BLOCK_SEEDS: readonly TimeBlockSeed[] = [
  {
    key: "anytime",
    label: "Anytime",
    iconKey: "clock",
    startTime: null,
    identity: "SELF-DISCIPLINED WOMAN",
    routineTitle: "Anytime intentions",
    routineSubtitle: "Small wins whenever they fit.",
    actions: [
      { iconKey: "water", subtitle: "500 ml", title: "I drink water" },
      { iconKey: "focus", subtitle: "One kind message", title: "I reach out" },
    ],
  },
  {
    key: "wake-up",
    label: "After wake-up",
    iconKey: "sunrise",
    startTime: "06:00",
    identity: "SELF-DISCIPLINED WOMAN",
    routineTitle: "After wake-up routine",
    routineSubtitle: "Start the day with intention.",
    actions: [
      { iconKey: "meditate", subtitle: "10 min", title: "I meditate" },
      { iconKey: "nourish", subtitle: "Healthy breakfast", title: "I nourish my body" },
      { iconKey: "move", subtitle: "20 min workout", title: "I move my body" },
      { iconKey: "water", subtitle: "500 ml", title: "I drink water" },
      { iconKey: "intention", subtitle: "Choose today's focus", title: "I plan my intention" },
    ],
  },
  {
    key: "before-work",
    label: "Before work",
    iconKey: "briefcase",
    startTime: "08:30",
    identity: "FOCUSED PROFESSIONAL",
    routineTitle: "Before work reset",
    routineSubtitle: "Step in clear and ready.",
    actions: [
      { iconKey: "focus", subtitle: "Top 3 for today", title: "I set my priorities" },
      { iconKey: "water", subtitle: "Refill bottle", title: "I hydrate" },
    ],
  },
  {
    key: "day",
    label: "Day",
    iconKey: "sun",
    startTime: "13:00",
    identity: "STEADY ACHIEVER",
    routineTitle: "Midday check-in",
    routineSubtitle: "Keep the momentum going.",
    actions: [
      { iconKey: "move", subtitle: "10 min walk", title: "I move my body" },
      { iconKey: "nourish", subtitle: "Mindful lunch", title: "I nourish my body" },
    ],
  },
  {
    key: "evening",
    label: "Evening",
    iconKey: "moon",
    startTime: "21:00",
    identity: "GROUNDED WOMAN",
    routineTitle: "Evening wind-down",
    routineSubtitle: "Close the day softly.",
    actions: [
      { iconKey: "meditate", subtitle: "5 min breathing", title: "I unwind" },
      { iconKey: "intention", subtitle: "Note one win", title: "I reflect" },
    ],
  },
];

/**
 * Milestone skeleton inserted for every newly created dream
 * (titles/states from journeyMilestoneContent, sequence 0..5).
 */
export const MILESTONE_SKELETON: readonly { state: string; title: string }[] = [
  { state: "Calm", title: "Awakening" },
  { state: "Confidence", title: "Transforming" },
  { state: "Focused", title: "Building" },
  { state: "Expansion", title: "Expanding" },
  { state: "Power", title: "Becoming" },
  { state: "Clarity", title: "Vision" },
];

/**
 * Default What-If risk plans inserted for every newly created dream
 * (from what-if-plan.tsx DEFAULT_PLANS). Editable user rows afterwards.
 */
export const DEFAULT_RISK_PLANS: readonly {
  actions: readonly string[];
  prompt: string;
  title: string;
}[] = [
  {
    title: "Lack of energy",
    prompt: "I may feel too tired to complete the planned action.",
    actions: [
      "I will make the step smaller.",
      "I'll do a 5-minute version.",
      "I'll rest briefly and continue.",
      "I'll move the task to my next available time.",
    ],
  },
  {
    title: "Lack of time",
    prompt: "I may not have enough time to do everything I planned.",
    actions: [
      "I will choose the smallest useful version.",
      "I'll reschedule it immediately.",
      "I'll protect this time as a priority.",
    ],
  },
  {
    title: "Loss of motivation",
    prompt: "I may lose interest or forget why this matters.",
    actions: [
      "I'll reconnect with why this goal matters.",
      "I'll take one tiny action to get started.",
      "I'll celebrate small wins to stay inspired.",
    ],
  },
];
