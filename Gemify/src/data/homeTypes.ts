export type ThemeColor = "gold" | "purple";

export type GoalImageKey =
  | "dream_bg_1"
  | "dream_bg_2"
  | "dream_bg_4"
  | "dream_bg_5"
  | "dream_bg_6"
  | "dream_bg_7"
  | "dream_bg_8"
  | "dream_bg_9"
  | "dream_bg_10";

export type GoalIconKey = "spark" | "lotus" | "mountains";

export type FocusIconKey = "lotus" | "sunrise" | "heart";

export type FocusStatus = "completed" | "pending";

export interface HomeHeader {
  greeting: string;
  subtitle: string;
}

export interface Goal {
  id: string;
  title: string;
  progressPercent: number;
  themeColor: ThemeColor;
  imageKey: GoalImageKey;
  iconKey: GoalIconKey;
  /** User-attached dream image; replaces the preset art when set. */
  photoUri?: string | null;
}

export interface FocusItem {
  id: string;
  timeLabel: string;
  title: string;
  status: FocusStatus;
  statusLabel: string;
  iconKey: FocusIconKey;
  themeColor: ThemeColor;
}

export interface HomeData {
  header: HomeHeader;
  goals: Goal[];
  currentFocus: FocusItem[];
}
