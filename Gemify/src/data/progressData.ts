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
  /** Formatted display date, e.g. "Aug 23, 2026". */
  date: string;
  /** Raw YYYY-MM-DD key backing `date` (edit form round-trips). */
  occurredOn: string;
  label: string;
  description: string | null;
  icon: TimelineIconKey;
  locked: boolean;
  photoUris: readonly string[];
}

export interface FulfillmentPoint {
  key: string;
  label: string;
  /** Exact value (may be fractional) — round only when displaying. */
  percent: number;
  /** True for the bucket containing today — highlighted in the bars chart. */
  current?: boolean;
}

export type FulfillmentChartKind = "line" | "bars";

/** Side panel copy for bar-chart ranges — "Monthly Average · 77% · 51 of 66". */
export interface FulfillmentSummary {
  eyebrow: string;
  percent: number;
  caption: string;
}

/** Header above the goal line chart — "THIS WEEK · +10% closer to your goal". */
export interface FulfillmentHighlight {
  eyebrow: string;
  /** Percent-point change across the range, signed. */
  delta: number;
  caption: string;
  tasksLabel: string;
}

export interface FulfillmentRange {
  key: string;
  label: string;
  points: readonly FulfillmentPoint[];
  /** Average block shown beside the bars. Bar chart ranges only. */
  summary?: FulfillmentSummary;
  /** Delta header above the chart. Line chart ranges only. */
  highlight?: FulfillmentHighlight;
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
  /**
   * Whether the selected dream has any completed tasks to chart. When false
   * the chart area shows the "Your journey starts here" empty state instead.
   */
  hasChartData: boolean;
}

