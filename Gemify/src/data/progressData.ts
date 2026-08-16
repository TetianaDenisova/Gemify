export type TimelineIconKey =
  | "spark"
  | "code"
  | "userPlus"
  | "rocket"
  | "chat"
  | "target";

export type ProgressAccent = "violet" | "gold" | "pink" | "ember" | "muted";

export interface ProgressGoalOption {
  key: string;
  label: string;
}

export interface AchievementForecast {
  headline: string;
  date: string;
  eta: string;
}

export interface TimelineMoment {
  key: string;
  date: string;
  label: string;
  icon: TimelineIconKey;
  locked: boolean;
}

export interface FulfillmentPoint {
  key: string;
  label: string;
  percent: number;
}

export type FulfillmentChartKind = "line" | "bars";

/** Side panel copy for bar-chart ranges — "Monthly Average · 77% · 51 of 66". */
export interface FulfillmentSummary {
  eyebrow: string;
  percent: number;
  caption: string;
}

export interface FulfillmentRange {
  key: string;
  label: string;
  points: readonly FulfillmentPoint[];
  /** Average block shown beside the bars. Bar chart ranges only. */
  summary?: FulfillmentSummary;
}

export interface FulfillmentTab {
  key: string;
  label: string;
  chart: FulfillmentChartKind;
  ranges: readonly FulfillmentRange[];
}

export interface ProgressContent {
  title: string;
  subtitle: string;
  goals: readonly ProgressGoalOption[];
  forecast: AchievementForecast;
  moments: readonly TimelineMoment[];
  fulfillmentTabs: readonly FulfillmentTab[];
  /** Label above the overall progress bar under the goal line chart. */
  overallLabel: string;
}

