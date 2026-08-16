export type ActionIcon = "meditate" | "nourish" | "move" | "water" | "intention" | "focus";
export type BlockIcon = "clock" | "sunrise" | "briefcase" | "sun" | "moon";

/** View-model for a single action rendered inside a time block. */
export type DayAction = {
  done: boolean;
  icon: ActionIcon;
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
