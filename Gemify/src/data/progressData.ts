export type TimelineIconKey =
  | "spark"
  | "code"
  | "userPlus"
  | "rocket"
  | "chat"
  | "target";

export type StatIconKey = "check" | "flame" | "trend" | "calendar" | "gift";

export type ProgressAccent = "violet" | "gold" | "pink" | "ember";

export interface ProgressGoalOption {
  key: string;
  label: string;
}

export interface AchievementForecast {
  headline: string;
  subline: string;
  dateIntro: string;
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

export interface DayFulfillment {
  key: string;
  day: string;
  percent: number;
}

export interface ProgressStatItem {
  key: string;
  label: string;
  value: string;
  icon: StatIconKey;
}

export interface ProgressContent {
  title: string;
  subtitle: string;
  goals: readonly ProgressGoalOption[];
  forecast: AchievementForecast;
  timelineTitle: string;
  timelineSubtitle: string;
  moments: readonly TimelineMoment[];
  fulfillmentTitle: string;
  fulfillmentSubtitle: string;
  rangeLabel: string;
  week: readonly DayFulfillment[];
  averageLabel: string;
  averagePercent: number;
  stats: readonly ProgressStatItem[];
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
    headline: "If you keep moving like this...",
    subline: "You will achieve your goal.",
    dateIntro: "You will achieve it on",
    date: "September 28, 2025",
    eta: "In 5 months",
  },
  timelineTitle: "Reality Shift Timeline",
  timelineSubtitle: "Moments that changed your reality.",
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
  fulfillmentTitle: "Goal Fulfillment",
  fulfillmentSubtitle: "How consistently you complete your goals.",
  rangeLabel: "Week",
  week: [
    { key: "mon", day: "Mon", percent: 72 },
    { key: "tue", day: "Tue", percent: 84 },
    { key: "wed", day: "Wed", percent: 68 },
    { key: "thu", day: "Thu", percent: 91 },
    { key: "fri", day: "Fri", percent: 76 },
    { key: "sat", day: "Sat", percent: 60 },
    { key: "sun", day: "Sun", percent: 78 },
  ],
  averageLabel: "Average",
  averagePercent: 76,
  stats: [
    { key: "average", label: "Average", value: "74%", icon: "check" },
    { key: "streak", label: "Best streak", value: "14 days", icon: "flame" },
    { key: "completed", label: "Total completed", value: "87 tasks", icon: "trend" },
    { key: "active", label: "Days active", value: "26 / 30", icon: "calendar" },
    { key: "rewards", label: "Rewards unlocked", value: "12", icon: "gift" },
  ],
} as const;

/**
 * Visual accent per element, kept apart from content so the look can be
 * retuned without touching copy (same pattern as the journey board layout).
 */
export const progressAccentLayout: {
  bars: Record<string, ProgressAccent>;
  moments: Record<string, ProgressAccent>;
} = {
  bars: {
    mon: "violet",
    tue: "gold",
    wed: "violet",
    thu: "pink",
    fri: "violet",
    sat: "gold",
    sun: "violet",
  },
  moments: {
    decided: "violet",
    "mvp-screen": "violet",
    "user-interview": "gold",
    "private-beta": "gold",
    "user-feedback": "ember",
    "pricing-module": "ember",
  },
};
