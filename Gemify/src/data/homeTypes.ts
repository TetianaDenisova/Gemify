export type ThemeColor = "gold" | "purple";

export type GoalImageKey =
  | "dream_bg_1"
  | "dream_bg_2"
  | "dream_bg_4"
  | "dream_bg_5"
  | "dream_bg_7"
  | "dream_bg_8"
  | "dream_bg_9"
  | "dream_bg_10";

export type GoalIconKey = "spark" | "lotus" | "mountains";

export interface Goal {
  id: string;
  title: string;
  progressPercent: number;
  themeColor: ThemeColor;
  imageKey: GoalImageKey;
  iconKey: GoalIconKey;
}
