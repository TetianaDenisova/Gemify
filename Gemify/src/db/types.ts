// ---------------------------------------------------------------------------
// Dreams & feeling states
// ---------------------------------------------------------------------------

export type Dream = {
  id: number;
  /** Stable key for seeded/dev-fixture rows, null for user-created dreams. */
  seedKey: string | null;
  title: string;
  visionStatement: string | null;
  /** Attached vision image (durable app-storage URI), null when skipped. */
  photoUri: string | null;
  isArchived: boolean;
};

export type NewDream = {
  title: string;
  visionStatement?: string | null;
  photoUri?: string | null;
  /** Up to three feeling-state labels; unknown labels are created on the fly. */
  feelingStates?: readonly string[];
};

export type DreamPatch = {
  title?: string;
  visionStatement?: string | null;
  photoUri?: string | null;
  isArchived?: boolean;
};

export type FeelingState = {
  id: number;
  label: string;
};

// ---------------------------------------------------------------------------
// Milestones
// ---------------------------------------------------------------------------

export type MilestoneStatus = "active" | "completed";

export type Milestone = {
  id: number;
  dreamId: number;
  /** 0-based path order; display number = sequenceNumber + 1. */
  sequenceNumber: number;
  title: string;
  state: string | null;
  artifact: string | null;
  mentor: string | null;
  reward: string | null;
  status: MilestoneStatus;
  /** Attached step image (durable app-storage URI), null when absent. */
  photoUri: string | null;
};

export type NewMilestone = {
  title: string;
  state?: string | null;
  artifact?: string | null;
  mentor?: string | null;
  reward?: string | null;
  photoUri?: string | null;
};

export type MilestonePatch = {
  title?: string;
  state?: string | null;
  artifact?: string | null;
  mentor?: string | null;
  reward?: string | null;
  status?: MilestoneStatus;
  photoUri?: string | null;
};

// ---------------------------------------------------------------------------
// Quests & ideas
// ---------------------------------------------------------------------------

/** A quest is a single actionable item — the unit of both doing and planning. */
export type Quest = {
  id: number;
  milestoneId: number;
  title: string;
  isActive: boolean;
  isDone: boolean;
  /** ISO 8601 UTC — drives the "N days active" caption. */
  createdAt: string;
  /** YYYY-MM-DD, null = unscheduled. */
  scheduledDate: string | null;
  /** HH:MM, null = no fixed time. */
  scheduledTime: string | null;
  /** True once the quest was added to the weekly plan ("Do this week"). */
  isPlanned: boolean;
  completedAt: string | null;
};

export type QuestPatch = {
  title?: string;
  isActive?: boolean;
  isDone?: boolean;
  scheduledDate?: string | null;
  scheduledTime?: string | null;
  isPlanned?: boolean;
};

/** Quest plus its Dream / Milestone breadcrumb (sprint board rows). */
export type QuestWithBreadcrumb = Quest & {
  dreamTitle: string;
  milestoneTitle: string;
  /**
   * 0..100 — dream % completing this quest adds, using the same weighting as
   * getDreamSummaries: every milestone an equal slice of the dream, every
   * active quest an equal slice of its milestone.
   */
  progressPercent: number;
};

export type Idea = {
  id: number;
  milestoneId: number;
  title: string;
  /** 0..10 */
  score: number;
};

// ---------------------------------------------------------------------------
// Habits
// ---------------------------------------------------------------------------

/**
 * A time-block key from the `time_blocks` table (the same blocks My Day
 * shows). Legacy rows may still hold "morning" | "after_lunch" | "evening".
 */
export type HabitTimeOfDay = string;

export type Habit = {
  id: number;
  dreamId: number;
  title: string;
  cue: string | null;
  timeOfDay: HabitTimeOfDay | null;
  goalDays: number;
  isArchived: boolean;
};

export type HabitDetailSection = "easy_start" | "easy_version" | "backup_plan";

export type HabitDetailEntry = {
  id: number;
  habitId: number;
  section: HabitDetailSection;
  content: string;
};

export type NewHabit = {
  dreamId: number;
  title: string;
  cue?: string | null;
  timeOfDay?: HabitTimeOfDay | null;
  goalDays?: number;
  /** Weekdays the habit is practiced; 0 = Monday .. 6 = Sunday. */
  scheduleDays?: readonly number[];
  details?: readonly { content: string; section: HabitDetailSection }[];
};

export type HabitPatch = {
  dreamId?: number;
  title?: string;
  cue?: string | null;
  timeOfDay?: HabitTimeOfDay | null;
  goalDays?: number;
  isArchived?: boolean;
};

/** Stored day statuses; "open" (no record yet) is the absence of a row. */
export type HabitCompletionStatus = "done" | "partial" | "missed";

export type HabitCompletionRecord = {
  habitId: number;
  /** YYYY-MM-DD */
  date: string;
  status: HabitCompletionStatus;
};

// ---------------------------------------------------------------------------
// Daily routine time blocks
// ---------------------------------------------------------------------------

export type TimeBlockRecord = {
  id: number;
  /** Stable string key ("anytime", "wake-up", ...). */
  key: string;
  label: string;
  iconKey: string;
  /** HH:MM, null = flexible/anytime. */
  startTime: string | null;
  identity: string | null;
  routineTitle: string;
  routineSubtitle: string | null;
  position: number;
};

export type TimeBlockActionRecord = {
  id: number;
  timeBlockId: number;
  title: string;
  subtitle: string | null;
  iconKey: string;
  position: number;
  /** Whether the action is completed for the queried date. */
  done: boolean;
};

export type TimeBlockWithActions = TimeBlockRecord & {
  actions: TimeBlockActionRecord[];
};

// ---------------------------------------------------------------------------
// Risks (What-If plans)
// ---------------------------------------------------------------------------

export type RiskAction = {
  id: number;
  riskId: number;
  content: string;
};

export type Risk = {
  id: number;
  dreamId: number;
  title: string;
  prompt: string;
  actions: RiskAction[];
};

export type NewRisk = {
  title: string;
  prompt?: string;
  actions: readonly string[];
};

// ---------------------------------------------------------------------------
// Timeline moments
// ---------------------------------------------------------------------------

export type TimelineMoment = {
  id: number;
  dreamId: number;
  /** YYYY-MM-DD */
  occurredOn: string;
  label: string;
  description: string | null;
  iconKey: string | null;
  isLocked: boolean;
  /** Attached photo URIs, in display order. */
  photoUris: string[];
};

export type NewTimelineMoment = {
  dreamId: number;
  occurredOn: string;
  label: string;
  description?: string | null;
  iconKey?: string | null;
  isLocked?: boolean;
  photoUris?: readonly string[];
};

export type TimelineMomentPatch = {
  label?: string;
  description?: string | null;
  /** YYYY-MM-DD */
  occurredOn?: string;
  /** When provided, replaces the moment's full photo set. */
  photoUris?: readonly string[];
};

// ---------------------------------------------------------------------------
// Items (v1 demo table)
// ---------------------------------------------------------------------------

/** A row from the `items` table, with column names mapped to camelCase. */
export type Item = {
  id: number;
  name: string;
  description: string | null;
  /** ISO 8601 UTC timestamp, e.g. "2026-08-13T09:30:00.000Z". */
  createdAt: string;
  /** ISO 8601 UTC timestamp, updated on every `updateItem`. */
  updatedAt: string;
};

/** Input for `createItem`. Timestamps and id are set by the database. */
export type NewItem = {
  name: string;
  description?: string | null;
};

/** Input for `updateItem`. Only the provided fields are changed. */
export type ItemPatch = {
  name?: string;
  description?: string | null;
};
