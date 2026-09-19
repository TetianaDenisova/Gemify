/**
 * When a dream lands, predicted from how the user has actually been walking.
 *
 * Deliberately dependency-free (only the date helpers): no database, no React,
 * no theme. That keeps the whole prediction exercisable outside the app —
 * `scripts/forecast-backtest.mjs` replays histories through this module and
 * reports how far each projection was off.
 */

import { addDays, toDateKey } from "@/utils/dates";

/** Fields of a quest the forecast reads (a `Quest` satisfies this). */
export type ForecastQuest = {
  id: number;
  milestoneId: number;
  isActive: boolean;
  isDone: boolean;
  /** ISO timestamp, or null when the completion predates the column. */
  completedAt: string | null;
  /** YYYY-MM-DD the quest is planned for, or null. */
  scheduledDate: string | null;
};

/** Fields of a milestone the forecast reads (a `Milestone` satisfies this). */
export type ForecastMilestone = {
  id: number;
  status: "active" | "completed";
};

export type ForecastReason =
  /** The dream has no quests at all. */
  | "no-quests"
  /** Nothing has ever been completed — there is no pace to project. */
  | "never-started"
  /** Completions exist, but none carries a date to measure a pace from. */
  | "undated"
  /** Every quest is done. */
  | "complete"
  /** The pace is too slow to name a day without lying. */
  | "out-of-range"
  /** A real projection. */
  | "projected";

export type DreamForecast = {
  reason: ForecastReason;
  /** YYYY-MM-DD; set for "projected" (the day shown) and "complete". */
  date: string | null;
  /** The same projection at p80 — the slow-week variant of `date`. */
  lateDate: string | null;
  /** Whole days from today to `date`, for "projected". */
  daysLeft: number | null;
  /** Share of the goal completed per day, recency-weighted. */
  pacePerDay: number;
  /** Share of the goal still ahead, 0..1. */
  remainingShare: number;
};

export type ForecastInput = {
  quests: readonly ForecastQuest[];
  milestones: readonly ForecastMilestone[];
  /**
   * Slices the journey is always divided into, even before every milestone
   * exists — pass the app's JOURNEY_MILESTONE_COUNT so the forecast and the
   * home card's percentage measure the same dream.
   */
  journeySlices?: number;
  /** The day the projection is made on. */
  today: Date;
  /** Day shown last time (YYYY-MM-DD), so the date stops jittering. */
  previous?: string | null;
};

const DAY_MS = 86400000;
/** Half-life of the pace estimate: work done 14 days ago counts half. */
const PACE_HALF_LIFE_DAYS = 14;
/** Completions older than this stop counting toward the pace at all. */
const PACE_WINDOW_DAYS = 56;
/**
 * Shortest stretch the pace is ever measured over. Two quests finished on the
 * first evening are not "two quests a day forever" — a week of context keeps a
 * young journey honest, and stops mattering once it has one.
 */
const PACE_MIN_SPAN_DAYS = 7;
/** Past this horizon a date stops being a forecast and becomes noise. */
const MAX_FORECAST_DAYS = 365 * 5;
/** z for the date we show: a little slower than the median week. */
const Z_SHOWN = 0.385;
/** z for the "slow weeks" variant returned alongside it. */
const Z_LATE = 0.84;
/** However noisy the weeks, the projection never assumes less than this pace. */
const SLOWEST_SHOWN = 0.6;
const SLOWEST_LATE = 0.4;
/** A re-projection has to beat this to move the date the user already saw. */
const STABLE_MIN_DRIFT_DAYS = 3;
const STABLE_DRIFT_SHARE = 0.1;

/** Date-only part of a completion timestamp, or null. */
function completedOn(quest: ForecastQuest): string | null {
  return quest.completedAt ? quest.completedAt.slice(0, 10) : null;
}

/** Noon of `date`, so day arithmetic survives daylight-saving shifts. */
function noon(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12);
}

function fromDateKey(key: string): Date {
  return new Date(`${key}T12:00:00`);
}

/** Whole days between a YYYY-MM-DD key and today, never negative. */
function daysSince(dateKey: string, today: Date): number {
  const elapsed = noon(today).getTime() - fromDateKey(dateKey).getTime();
  return Math.max(0, Math.round(elapsed / DAY_MS));
}

/** Whole days from today to a YYYY-MM-DD key; negative once it is past. */
function daysUntil(dateKey: string, today: Date): number {
  return Math.round(
    (fromDateKey(dateKey).getTime() - noon(today).getTime()) / DAY_MS,
  );
}

export type DreamWeights = {
  /** Quest id -> its share of the whole dream, 0..1. */
  shares: Map<number, number>;
  /** Share of the dream already behind the user, 0..1. */
  doneShare: number;
};

/**
 * What each quest is worth, and how much of the dream is already done.
 *
 * The same split the home card shows: the dream is cut into `journeySlices`
 * equal slices (more when the journey has more milestones), each milestone's
 * slice is cut equally across its *active* quests, and a milestone the user
 * marked completed counts as its whole slice whatever its quests say.
 *
 * Slices with no milestone yet, and milestones with no quests yet, hold their
 * share without any quest to earn it — that work is real, it is simply not
 * written down, and it stays in `1 - doneShare` until the user writes it.
 */
export function dreamWeights(
  quests: readonly ForecastQuest[],
  milestones: readonly ForecastMilestone[],
  journeySlices: number,
): DreamWeights {
  const shares = new Map<number, number>();
  const slices = Math.max(milestones.length, journeySlices);
  if (slices === 0) return { shares, doneShare: 0 };

  const sliceShare = 1 / slices;
  let doneShare = 0;

  for (const milestone of milestones) {
    const active = quests.filter(
      (quest) => quest.milestoneId === milestone.id && quest.isActive,
    );
    // A completed milestone is its whole slice, but its quests still carry
    // their own share — that is what dates the pace when they were ticked.
    if (active.length > 0) {
      const questShare = sliceShare / active.length;
      for (const quest of active) shares.set(quest.id, questShare);
    }
    if (milestone.status === "completed") {
      doneShare += sliceShare;
      continue;
    }
    if (active.length === 0) continue;
    const done = active.filter((quest) => quest.isDone).length;
    doneShare += sliceShare * (done / active.length);
  }

  return { shares, doneShare: Math.min(1, doneShare) };
}

/**
 * Share of the goal the user completes per day, weighted toward now.
 *
 * Every completion decays by half every PACE_HALF_LIFE_DAYS, and the decayed
 * total is divided by that same decay integrated across the window — so a
 * steady pace in gives exactly that pace out, while a sprint (or a stall) this
 * week moves the number immediately instead of being averaged away by work
 * from seven weeks ago. A flat count over a fixed window cannot do that: it
 * treats a quest finished yesterday and one finished on day 30 alike, then
 * drops the older one off a cliff the next morning.
 *
 * The elapsed span only reaches back to the oldest completion that counted, so
 * a journey three days old is not divided by eight weeks of silence it was
 * never around for — floored at PACE_MIN_SPAN_DAYS so one good evening cannot
 * read as the pace of every day to come.
 */
export function recentPace(
  quests: readonly ForecastQuest[],
  shareOf: (quest: ForecastQuest) => number,
  today: Date,
): number {
  let decayedWork = 0;
  let oldestAge = 0;

  for (const quest of quests) {
    if (!quest.isDone) continue;
    const date = completedOn(quest);
    if (date === null) continue;
    const age = daysSince(date, today);
    if (age > PACE_WINDOW_DAYS) continue;
    decayedWork += shareOf(quest) * 0.5 ** (age / PACE_HALF_LIFE_DAYS);
    oldestAge = Math.max(oldestAge, age);
  }

  if (decayedWork === 0) return 0;

  const window = Math.min(
    PACE_WINDOW_DAYS,
    Math.max(PACE_MIN_SPAN_DAYS, oldestAge + 1),
  );
  // Integral of 0.5^(t/H) across the window: how many "full-weight days" the
  // decayed total is spread over.
  const effectiveDays =
    (PACE_HALF_LIFE_DAYS / Math.LN2) *
    (1 - 0.5 ** (window / PACE_HALF_LIFE_DAYS));
  return decayedWork / effectiveDays;
}

/**
 * How unevenly the last eight weeks went, as a share-per-day spread.
 *
 * Whole weeks, because that is the rhythm people actually keep (three quests
 * every Saturday is steady, not bursty). Fewer than two weeks of history has
 * no spread to speak of and returns 0, which leaves the projection at its
 * median pace until there is evidence either way.
 */
export function weeklySpread(
  quests: readonly ForecastQuest[],
  shareOf: (quest: ForecastQuest) => number,
  today: Date,
): number {
  const weeks = Math.floor(PACE_WINDOW_DAYS / 7);
  const buckets = new Array<number>(weeks).fill(0);
  let oldestAge = 0;

  for (const quest of quests) {
    if (!quest.isDone) continue;
    const date = completedOn(quest);
    if (date === null) continue;
    const age = daysSince(date, today);
    if (age >= PACE_WINDOW_DAYS) continue;
    buckets[Math.floor(age / 7)] += shareOf(quest);
    oldestAge = Math.max(oldestAge, age);
  }

  // Only weeks the journey was alive for count as samples; weeks of silence
  // before the first quest would read as a slump that never happened.
  const sampled = buckets.slice(0, Math.floor(oldestAge / 7) + 1);
  if (sampled.length < 2) return 0;

  const mean = sampled.reduce((sum, week) => sum + week, 0) / sampled.length;
  const variance =
    sampled.reduce((sum, week) => sum + (week - mean) ** 2, 0) /
    (sampled.length - 1);
  return Math.sqrt(variance) / 7;
}

/**
 * Keeps the shown date still. A projection that moves every time the screen
 * opens reads as noise, so the date the user already saw stands until the new
 * estimate is off by more than a few days (or a tenth of the road left,
 * whichever is larger) — or until it has slipped into the past.
 */
export function stabilize(
  next: string,
  previous: string | null | undefined,
  today: Date,
): string {
  if (!previous) return next;
  const previousDays = daysUntil(previous, today);
  if (previousDays <= 0) return next;
  const drift = Math.abs(daysUntil(next, today) - previousDays);
  const allowed = Math.max(
    STABLE_MIN_DRIFT_DAYS,
    Math.round(previousDays * STABLE_DRIFT_SHARE),
  );
  return drift > allowed ? next : previous;
}

/** The latest YYYY-MM-DD matching `pick`, or "" when there is none. */
function latestDate(
  quests: readonly ForecastQuest[],
  pick: (quest: ForecastQuest) => string | null,
): string {
  return quests.reduce((latest, quest) => {
    const date = pick(quest);
    if (date === null) return latest;
    return date > latest ? date : latest;
  }, "");
}

/**
 * The whole prediction: what is left of the dream, how fast the user has been
 * going lately, and therefore which day it lands on.
 */
export function forecastCompletion({
  quests,
  milestones,
  journeySlices = 6,
  today,
  previous,
}: ForecastInput): DreamForecast {
  const idle: DreamForecast = {
    reason: "no-quests",
    date: null,
    lateDate: null,
    daysLeft: null,
    pacePerDay: 0,
    remainingShare: 1,
  };

  if (quests.length === 0) return idle;

  const doneQuests = quests.filter((quest) => quest.isDone);
  if (doneQuests.length === 0) return { ...idle, reason: "never-started" };

  const { shares, doneShare } = dreamWeights(quests, milestones, journeySlices);
  // A quest the weight table cannot see (no milestone of its own) still has to
  // be worth something, or finishing it would move nothing.
  const shareOf = (quest: ForecastQuest) =>
    shares.get(quest.id) ?? 1 / quests.length;

  if (doneQuests.length >= quests.length) {
    const finishedOn = latestDate(doneQuests, completedOn);
    return {
      ...idle,
      reason: "complete",
      date: finishedOn === "" ? null : finishedOn,
      remainingShare: 0,
    };
  }

  const pace = recentPace(quests, shareOf, today);
  const remainingShare = Math.max(1 - doneShare, 1 / quests.length);
  if (pace <= 0) {
    return { ...idle, reason: "undated", pacePerDay: 0, remainingShare };
  }

  // The spread of the weeks behind decides how much slower than the median the
  // projection assumes: steady weeks barely move it, ragged weeks push it out.
  const spread = weeklySpread(quests, shareOf, today);
  const shownPace = Math.max(pace * SLOWEST_SHOWN, pace - Z_SHOWN * spread);
  const latePace = Math.max(pace * SLOWEST_LATE, pace - Z_LATE * spread);

  const paceDays = Math.max(1, Math.ceil(remainingShare / shownPace));
  if (paceDays > MAX_FORECAST_DAYS) {
    return { ...idle, reason: "out-of-range", pacePerDay: pace, remainingShare };
  }

  // The plan is a floor: a quest already scheduled for a later day cannot be
  // finished before that day, however fast the last two weeks were.
  const lastScheduled = latestDate(quests, (quest) =>
    quest.isDone ? null : quest.scheduledDate,
  );
  const projected = toDateKey(addDays(today, paceDays));
  const floored = lastScheduled > projected ? lastScheduled : projected;
  const date = stabilize(floored, previous, today);

  const lateDays = Math.min(
    MAX_FORECAST_DAYS,
    Math.max(1, Math.ceil(remainingShare / latePace)),
  );
  const lateKey = toDateKey(addDays(today, lateDays));

  return {
    reason: "projected",
    date,
    lateDate: lateKey > date ? lateKey : date,
    daysLeft: Math.max(1, daysUntil(date, today)),
    pacePerDay: pace,
    remainingShare,
  };
}
