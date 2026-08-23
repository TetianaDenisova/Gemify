/**
 * Routine icons ("meditate".."focus") are stored on time-block actions in the
 * database; the dream-magic set ("star".."feather") exists only in the view
 * layer, assigned to quest tasks and habits on the fly.
 */
export type ActionIcon =
  | "meditate"
  | "nourish"
  | "move"
  | "water"
  | "intention"
  | "focus"
  | "star"
  | "moon"
  | "crystal"
  | "wand"
  | "key"
  | "feather";
export type BlockIcon = "clock" | "sunrise" | "briefcase" | "sun" | "moon";

/** View-model for a single action rendered inside a time block. */
export type DayAction = {
  done: boolean;
  /** Dream the task belongs to; with milestoneTitle it renders a breadcrumb instead of the plain subtitle. */
  dreamTitle?: string;
  icon: ActionIcon;
  milestoneTitle?: string;
  subtitle: string;
  title: string;
};

/** View-model for a day time block (mapped from TimeBlockWithActions DB records). */
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
