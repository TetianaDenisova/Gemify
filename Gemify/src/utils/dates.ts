/** Local-time date helpers shared by DB-backed screens (dates are YYYY-MM-DD). */

/** Formats a Date as a local YYYY-MM-DD key (never UTC — matches user's day). */
export function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function todayKey(): string {
  return toDateKey(new Date());
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

/** Monday of the week containing `date` (local time). */
export function startOfWeek(date: Date): Date {
  const monday = new Date(date);
  const weekday = (monday.getDay() + 6) % 7; // 0 = Monday .. 6 = Sunday
  monday.setDate(monday.getDate() - weekday);
  monday.setHours(0, 0, 0, 0);
  return monday;
}
