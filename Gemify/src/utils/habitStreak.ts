import { addDays, toDateKey } from "@/utils/dates";

/** How far back a streak is counted; a longer run still shows this many days. */
export const STREAK_LOOKBACK_DAYS = 365;

function dateFromKey(key: string): Date {
  return new Date(`${key}T00:00:00`);
}

/** First date key of the streak lookback window that ends on `today`. */
export function streakLookbackStart(today: string): string {
  return toDateKey(addDays(dateFromKey(today), -(STREAK_LOOKBACK_DAYS - 1)));
}

/**
 * Consecutive practiced days ending on `today`. Today still being open does
 * not break the run (the day is not over), and weekdays outside the habit's
 * schedule are skipped rather than counted as misses. A "partial" day — the
 * easy version on a bad day — keeps the chain alive.
 */
export function habitStreakDays(
  statusByDate: ReadonlyMap<string, string>,
  scheduleDays: readonly number[],
  today: string,
): number {
  const start = dateFromKey(today);
  let streak = 0;

  for (let offset = 0; offset < STREAK_LOOKBACK_DAYS; offset++) {
    const day = addDays(start, -offset);
    const weekday = (day.getDay() + 6) % 7;
    if (scheduleDays.length > 0 && !scheduleDays.includes(weekday)) {
      continue;
    }

    const status = statusByDate.get(toDateKey(day));
    if (status === "done" || status === "partial") {
      streak++;
      continue;
    }
    if (offset === 0 && status !== "missed") {
      continue;
    }
    break;
  }

  return streak;
}
