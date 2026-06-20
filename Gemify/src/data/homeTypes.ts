export type ThemeColor = "gold" | "purple";

export type GoalImageKey =
  | "mountain_sunrise"
  | "sailboat_sunset"
  | "balloon_mountains";

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
  milestone: string;
  completedTasks: number;
  totalTasks: number;
  progressPercent: number;
  themeColor: ThemeColor;
  imageKey: GoalImageKey;
  iconKey: GoalIconKey;
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
