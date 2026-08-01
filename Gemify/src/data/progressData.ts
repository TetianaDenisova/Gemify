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

/** Screen copy and numbers — dummy data until real tracking lands. */
export const progressContent: ProgressContent = {
  title: "Progress",
  subtitle: "Evidence that your future is becoming real.",
  goals: [
    { key: "creative-business", label: "Creative Business" },
    { key: "financial-freedom", label: "Financial Freedom" },
    { key: "purposeful-travel", label: "Purposeful Travel" },
  ],
  forecast: {
    headline: "Stay consistent and you will finish by",
    date: "September 28, 2025.",
    eta: "In 5 months",
  },
  moments: [
    {
      key: "decided",
      date: "Mar 12",
      label: "Decided to build Gamify",
      icon: "spark",
      locked: false,
    },
    {
      key: "mvp-screen",
      date: "Apr 3",
      label: "Built first MVP screen",
      icon: "code",
      locked: false,
    },
    {
      key: "user-interview",
      date: "Apr 28",
      label: "First user interview",
      icon: "userPlus",
      locked: false,
    },
    {
      key: "private-beta",
      date: "May 17",
      label: "Launched private beta",
      icon: "rocket",
      locked: false,
    },
    {
      key: "user-feedback",
      date: "Jun 8",
      label: "First real user feedback",
      icon: "chat",
      locked: true,
    },
    {
      key: "pricing-module",
      date: "Jun 24",
      label: "Completed pricing module",
      icon: "target",
      locked: true,
    },
  ],
  fulfillmentTabs: [
    {
      key: "goal",
      label: "Goal Progress",
      chart: "line",
      ranges: [
        {
          key: "week",
          label: "Week",
          points: [
            { key: "mon", label: "Mon", percent: 52 },
            { key: "tue", label: "Tue", percent: 54 },
            { key: "wed", label: "Wed", percent: 54 },
            { key: "thu", label: "Thu", percent: 58 },
            { key: "fri", label: "Fri", percent: 60 },
            { key: "sat", label: "Sat", percent: 61 },
            { key: "sun", label: "Sun", percent: 64 },
          ],
        },
        {
          key: "month",
          label: "Month",
          points: [
            { key: "w1", label: "W1", percent: 52 },
            { key: "w2", label: "W2", percent: 54 },
            { key: "w3", label: "W3", percent: 54 },
            { key: "w4", label: "W4", percent: 64 },
          ],
        },
        {
          key: "6months",
          label: "6 Months",
          points: [
            { key: "mar", label: "Mar", percent: 28 },
            { key: "apr", label: "Apr", percent: 37 },
            { key: "may", label: "May", percent: 44 },
            { key: "jun", label: "Jun", percent: 52 },
            { key: "jul", label: "Jul", percent: 58 },
            { key: "aug", label: "Aug", percent: 64 },
          ],
        },
      ],
    },
    {
      key: "daily",
      label: "Task Completion",
      chart: "bars",
      ranges: [
        {
          key: "week",
          label: "Week",
          points: [
            { key: "mon", label: "Mon", percent: 72 },
            { key: "tue", label: "Tue", percent: 76 },
            { key: "wed", label: "Wed", percent: 81 },
            { key: "thu", label: "Thu", percent: 79 },
            { key: "fri", label: "Fri", percent: 84 },
            { key: "sat", label: "Sat", percent: 68 },
            { key: "sun", label: "Sun", percent: 75 },
          ],
          summary: {
            eyebrow: "Weekly Average",
            percent: 76,
            caption: "23 of 30 tasks completed",
          },
        },
        {
          key: "month",
          label: "Month",
          points: [
            { key: "w1", label: "Week 1", percent: 72 },
            { key: "w2", label: "Week 2", percent: 76 },
            { key: "w3", label: "Week 3", percent: 81 },
            { key: "w4", label: "Week 4", percent: 79 },
          ],
          summary: {
            eyebrow: "Monthly Average",
            percent: 77,
            caption: "51 of 66 tasks completed",
          },
        },
        {
          key: "6months",
          label: "6 Months",
          points: [
            { key: "mar", label: "Mar", percent: 54 },
            { key: "apr", label: "Apr", percent: 61 },
            { key: "may", label: "May", percent: 58 },
            { key: "jun", label: "Jun", percent: 69 },
            { key: "jul", label: "Jul", percent: 74 },
            { key: "aug", label: "Aug", percent: 78 },
          ],
          summary: {
            eyebrow: "6-Month Average",
            percent: 66,
            caption: "261 of 396 tasks completed",
          },
        },
      ],
    },
  ],
  overallLabel: "Overall Goal Progress",
} as const;

/**
 * Visual accent per element, kept apart from content so the look can be
 * retuned without touching copy (same pattern as the journey board layout).
 */
export const progressAccentLayout: {
  moments: Record<string, ProgressAccent>;
} = {
  moments: {
    decided: "violet",
    "mvp-screen": "violet",
    "user-interview": "violet",
    "private-beta": "violet",
    "user-feedback": "gold",
    "pricing-module": "muted",
  },
};
