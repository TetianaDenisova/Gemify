import { getDatabase } from "./database";
import type {
  Habit,
  HabitCompletionRecord,
  HabitCompletionStatus,
  HabitDetailEntry,
  HabitPatch,
  NewHabit,
} from "./types";

type HabitRow = {
  id: number;
  dream_id: number;
  title: string;
  cue: string | null;
  time_of_day: Habit["timeOfDay"];
  goal_days: number;
  is_archived: number;
};

const SELECT_HABIT = `
  SELECT id, dream_id, title, cue, time_of_day, goal_days, is_archived
  FROM habits
`;

function toHabit(row: HabitRow): Habit {
  return {
    id: row.id,
    dreamId: row.dream_id,
    title: row.title,
    cue: row.cue,
    timeOfDay: row.time_of_day,
    goalDays: row.goal_days,
    isArchived: row.is_archived === 1,
  };
}

/**
 * Creates a habit with its schedule days and detail entries in one
 * transaction (the create-habit form submit).
 */
export async function createHabit(input: NewHabit): Promise<Habit> {
  const title = input.title.trim();
  if (!title) {
    throw new Error("Habit title is required.");
  }

  const db = await getDatabase();
  let habitId = 0;

  await db.withTransactionAsync(async () => {
    const inserted = await db.runAsync(
      `INSERT INTO habits (dream_id, title, cue, time_of_day, goal_days)
       VALUES (?, ?, ?, ?, ?)`,
      [
        input.dreamId,
        title,
        input.cue?.trim() || null,
        input.timeOfDay ?? null,
        input.goalDays ?? 24,
      ],
    );
    habitId = inserted.lastInsertRowId;

    for (const weekday of new Set(input.scheduleDays ?? [])) {
      await db.runAsync(
        "INSERT INTO habit_schedule_days (habit_id, weekday) VALUES (?, ?)",
        [habitId, weekday],
      );
    }

    for (const detail of input.details ?? []) {
      const content = detail.content.trim();
      if (!content) continue;
      await db.runAsync(
        "INSERT INTO habit_detail_entries (habit_id, section, content) VALUES (?, ?, ?)",
        [habitId, detail.section, content],
      );
    }
  });

  const habit = await getHabitById(habitId);
  if (!habit) {
    throw new Error("Failed to read back the created habit.");
  }
  return habit;
}

/** All habits (Habits screen groups them by dream), archived hidden. */
export async function getHabits(includeArchived = false): Promise<Habit[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<HabitRow>(
    includeArchived
      ? `${SELECT_HABIT} ORDER BY dream_id, id`
      : `${SELECT_HABIT} WHERE is_archived = 0 ORDER BY dream_id, id`,
  );
  return rows.map(toHabit);
}

export async function getHabitsByDream(dreamId: number): Promise<Habit[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<HabitRow>(
    `${SELECT_HABIT} WHERE dream_id = ? AND is_archived = 0 ORDER BY id`,
    [dreamId],
  );
  return rows.map(toHabit);
}

export async function getHabitById(id: number): Promise<Habit | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<HabitRow>(`${SELECT_HABIT} WHERE id = ?`, [
    id,
  ]);
  return row ? toHabit(row) : null;
}

/** Updates only the fields present in `patch` and returns the stored row. */
export async function updateHabit(
  id: number,
  patch: HabitPatch,
): Promise<Habit | null> {
  const assignments: string[] = [];
  const params: (string | number | null)[] = [];

  if (patch.title !== undefined) {
    const title = patch.title.trim();
    if (!title) {
      throw new Error("Habit title is required.");
    }
    assignments.push("title = ?");
    params.push(title);
  }
  if (patch.cue !== undefined) {
    assignments.push("cue = ?");
    params.push(patch.cue?.trim() || null);
  }
  if (patch.timeOfDay !== undefined) {
    assignments.push("time_of_day = ?");
    params.push(patch.timeOfDay);
  }
  if (patch.goalDays !== undefined) {
    assignments.push("goal_days = ?");
    params.push(patch.goalDays);
  }
  if (patch.isArchived !== undefined) {
    assignments.push("is_archived = ?");
    params.push(patch.isArchived ? 1 : 0);
  }

  if (assignments.length > 0) {
    const db = await getDatabase();
    await db.runAsync(
      `UPDATE habits SET ${assignments.join(", ")} WHERE id = ?`,
      [...params, id],
    );
  }

  return getHabitById(id);
}

export async function deleteHabit(id: number): Promise<boolean> {
  const db = await getDatabase();
  const result = await db.runAsync("DELETE FROM habits WHERE id = ?", [id]);
  return result.changes > 0;
}

/** Weekdays (0 = Monday .. 6 = Sunday) the habit is practiced. */
export async function getHabitScheduleDays(habitId: number): Promise<number[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ weekday: number }>(
    "SELECT weekday FROM habit_schedule_days WHERE habit_id = ? ORDER BY weekday",
    [habitId],
  );
  return rows.map((row) => row.weekday);
}

export async function setHabitScheduleDays(
  habitId: number,
  weekdays: readonly number[],
): Promise<void> {
  const db = await getDatabase();
  await db.withTransactionAsync(async () => {
    await db.runAsync("DELETE FROM habit_schedule_days WHERE habit_id = ?", [
      habitId,
    ]);
    for (const weekday of new Set(weekdays)) {
      await db.runAsync(
        "INSERT INTO habit_schedule_days (habit_id, weekday) VALUES (?, ?)",
        [habitId, weekday],
      );
    }
  });
}

/** Detail rows in insertion order, all sections together. */
export async function getHabitDetails(
  habitId: number,
): Promise<HabitDetailEntry[]> {
  const db = await getDatabase();
  return db.getAllAsync<HabitDetailEntry>(
    `SELECT id, habit_id AS habitId, section, content
     FROM habit_detail_entries WHERE habit_id = ? ORDER BY id`,
    [habitId],
  );
}

/** Replaces the habit's detail rows (edit-habit save). */
export async function setHabitDetails(
  habitId: number,
  details: readonly { content: string; section: HabitDetailEntry["section"] }[],
): Promise<void> {
  const db = await getDatabase();
  await db.withTransactionAsync(async () => {
    await db.runAsync("DELETE FROM habit_detail_entries WHERE habit_id = ?", [
      habitId,
    ]);
    for (const detail of details) {
      const content = detail.content.trim();
      if (!content) continue;
      await db.runAsync(
        "INSERT INTO habit_detail_entries (habit_id, section, content) VALUES (?, ?, ?)",
        [habitId, detail.section, content],
      );
    }
  });
}

/**
 * Records the habit's status for a date, or clears it back to "open" when
 * `status` is null. One row per habit per date.
 */
export async function setHabitCompletion(
  habitId: number,
  date: string,
  status: HabitCompletionStatus | null,
): Promise<void> {
  const db = await getDatabase();
  if (status === null) {
    await db.runAsync(
      "DELETE FROM habit_completions WHERE habit_id = ? AND date = ?",
      [habitId, date],
    );
    return;
  }
  await db.runAsync(
    `INSERT INTO habit_completions (habit_id, date, status) VALUES (?, ?, ?)
     ON CONFLICT (habit_id, date) DO UPDATE SET status = excluded.status`,
    [habitId, date, status],
  );
}

/** Completions in [fromDate, toDate]; dates without a row are "open". */
export async function getHabitCompletions(
  habitId: number,
  fromDate: string,
  toDate: string,
): Promise<HabitCompletionRecord[]> {
  const db = await getDatabase();
  return db.getAllAsync<HabitCompletionRecord>(
    `SELECT habit_id AS habitId, date, status
     FROM habit_completions
     WHERE habit_id = ? AND date BETWEEN ? AND ?
     ORDER BY date`,
    [habitId, fromDate, toDate],
  );
}

/** "Day N" counter: number of days recorded as done. */
export async function getHabitDoneCount(habitId: number): Promise<number> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) AS count FROM habit_completions WHERE habit_id = ? AND status = 'done'",
    [habitId],
  );
  return row?.count ?? 0;
}
