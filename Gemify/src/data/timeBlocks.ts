export type ActionIcon = "meditate" | "nourish" | "move" | "water" | "intention" | "focus";
export type BlockIcon = "clock" | "sunrise" | "briefcase" | "sun" | "moon";

export type DayAction = {
  done: boolean;
  icon: ActionIcon;
  subtitle: string;
  title: string;
};

export type TimeBlock = {
  actions: DayAction[];
  icon: BlockIcon;
  identity: string;
  key: string;
  label: string;
  routineSubtitle: string;
  routineTitle: string;
  time: string;
};

/**
 * Key of the block whose start time most recently passed, falling back to
 * "anytime" before the first scheduled block. Blocks without a HH:MM time
 * (e.g. "Flexible") are skipped.
 */
export function getCurrentTimeBlockKey(date: Date): string {
  const nowMinutes = date.getHours() * 60 + date.getMinutes();
  let currentKey = "anytime";
  let currentStart = -1;

  for (const block of timeBlocks) {
    const match = /^(\d{1,2}):(\d{2})$/.exec(block.time);
    if (!match) continue;
    const start = Number(match[1]) * 60 + Number(match[2]);
    if (start <= nowMinutes && start > currentStart) {
      currentKey = block.key;
      currentStart = start;
    }
  }
  return currentKey;
}

/** Dummy day blocks — replace with real persistence when the data layer lands. */
export const timeBlocks: readonly TimeBlock[] = [
  {
    key: "anytime",
    label: "Anytime",
    icon: "clock",
    time: "Flexible",
    identity: "SELF-DISCIPLINED WOMAN",
    routineTitle: "Anytime intentions",
    routineSubtitle: "Small wins whenever they fit.",
    actions: [
      { done: false, icon: "water", subtitle: "500 ml", title: "I drink water" },
      { done: false, icon: "focus", subtitle: "One kind message", title: "I reach out" },
    ],
  },
  {
    key: "wake-up",
    label: "After wake-up",
    icon: "sunrise",
    time: "06:00",
    identity: "SELF-DISCIPLINED WOMAN",
    routineTitle: "After wake-up routine",
    routineSubtitle: "Start the day with intention.",
    actions: [
      { done: true, icon: "meditate", subtitle: "10 min", title: "I meditate" },
      { done: true, icon: "nourish", subtitle: "Healthy breakfast", title: "I nourish my body" },
      { done: false, icon: "move", subtitle: "20 min workout", title: "I move my body" },
      { done: false, icon: "water", subtitle: "500 ml", title: "I drink water" },
      { done: false, icon: "intention", subtitle: "Choose today's focus", title: "I plan my intention" },
    ],
  },
  {
    key: "before-work",
    label: "Before work",
    icon: "briefcase",
    time: "08:30",
    identity: "FOCUSED PROFESSIONAL",
    routineTitle: "Before work reset",
    routineSubtitle: "Step in clear and ready.",
    actions: [
      { done: false, icon: "focus", subtitle: "Top 3 for today", title: "I set my priorities" },
      { done: false, icon: "water", subtitle: "Refill bottle", title: "I hydrate" },
    ],
  },
  {
    key: "day",
    label: "Day",
    icon: "sun",
    time: "13:00",
    identity: "STEADY ACHIEVER",
    routineTitle: "Midday check-in",
    routineSubtitle: "Keep the momentum going.",
    actions: [
      { done: false, icon: "move", subtitle: "10 min walk", title: "I move my body" },
      { done: false, icon: "nourish", subtitle: "Mindful lunch", title: "I nourish my body" },
    ],
  },
  {
    key: "evening",
    label: "Evening",
    icon: "moon",
    time: "21:00",
    identity: "GROUNDED WOMAN",
    routineTitle: "Evening wind-down",
    routineSubtitle: "Close the day softly.",
    actions: [
      { done: false, icon: "meditate", subtitle: "5 min breathing", title: "I unwind" },
      { done: false, icon: "intention", subtitle: "Note one win", title: "I reflect" },
    ],
  },
];
