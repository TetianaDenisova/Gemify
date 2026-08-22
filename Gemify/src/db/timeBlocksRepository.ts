import { getDatabase } from "./database";
import type {
  TimeBlockActionRecord,
  TimeBlockRecord,
  TimeBlockWithActions,
} from "./types";
import type { SQLiteDatabase } from "expo-sqlite";

type BlockActionJoinRow = {
  id: number;
  key: string;
  label: string;
  icon_key: string;
  start_time: string | null;
  identity: string | null;
  routine_title: string;
  routine_subtitle: string | null;
  position: number;
  action_id: number | null;
  action_title: string | null;
  action_subtitle: string | null;
  action_icon_key: string | null;
  action_position: number | null;
  action_done: number | null;
};

/**
 * All routine blocks with their active actions and the done-state for `date`
 * (YYYY-MM-DD). Both Home and My Day read this, so their checkmarks stay in
 * sync — a completion is one row in action_completions per action per date.
 */
export async function getTimeBlocksForDate(
  date: string,
): Promise<TimeBlockWithActions[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<BlockActionJoinRow>(
    `SELECT b.id, b.key, b.label, b.icon_key, b.start_time, b.identity,
            b.routine_title, b.routine_subtitle, b.position,
            a.id AS action_id, a.title AS action_title, a.subtitle AS action_subtitle,
            a.icon_key AS action_icon_key, a.position AS action_position,
            (c.id IS NOT NULL) AS action_done
     FROM time_blocks b
     LEFT JOIN time_block_actions a ON a.time_block_id = b.id AND a.is_active = 1
     LEFT JOIN action_completions c ON c.action_id = a.id AND c.date = ?
     ORDER BY b.position, a.position, a.id`,
    [date],
  );

  const blocks: TimeBlockWithActions[] = [];
  let current: TimeBlockWithActions | null = null;

  for (const row of rows) {
    if (!current || current.id !== row.id) {
      current = {
        id: row.id,
        key: row.key,
        label: row.label,
        iconKey: row.icon_key,
        startTime: row.start_time,
        identity: row.identity,
        routineTitle: row.routine_title,
        routineSubtitle: row.routine_subtitle,
        position: row.position,
        actions: [],
      };
      blocks.push(current);
    }

    if (row.action_id !== null) {
      const action: TimeBlockActionRecord = {
        id: row.action_id,
        timeBlockId: row.id,
        title: row.action_title ?? "",
        subtitle: row.action_subtitle,
        iconKey: row.action_icon_key ?? "",
        position: row.action_position ?? 0,
        done: row.action_done === 1,
      };
      current.actions.push(action);
    }
  }

  return blocks;
}

/** Checks or unchecks a routine action for a date (idempotent both ways). */
export async function setActionDone(
  actionId: number,
  date: string,
  done: boolean,
): Promise<void> {
  const db = await getDatabase();
  if (done) {
    await db.runAsync(
      "INSERT OR IGNORE INTO action_completions (action_id, date) VALUES (?, ?)",
      [actionId, date],
    );
    return;
  }
  await db.runAsync(
    "DELETE FROM action_completions WHERE action_id = ? AND date = ?",
    [actionId, date],
  );
}

/** Today-progress card numbers for a date. */
export async function getDayProgress(
  date: string,
): Promise<{ completed: number; total: number }> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ completed: number; total: number }>(
    `SELECT
       (SELECT COUNT(*) FROM time_block_actions WHERE is_active = 1) AS total,
       (SELECT COUNT(*)
        FROM action_completions c
        JOIN time_block_actions a ON a.id = c.action_id AND a.is_active = 1
        WHERE c.date = ?) AS completed`,
    [date],
  );
  return { completed: row?.completed ?? 0, total: row?.total ?? 0 };
}

/** All routine blocks without their actions, in display order. */
export async function getTimeBlocks(): Promise<TimeBlockRecord[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{
    id: number;
    key: string;
    label: string;
    icon_key: string;
    start_time: string | null;
    identity: string | null;
    routine_title: string;
    routine_subtitle: string | null;
    position: number;
  }>("SELECT * FROM time_blocks ORDER BY position");

  return rows.map((row) => ({
    id: row.id,
    key: row.key,
    label: row.label,
    iconKey: row.icon_key,
    startTime: row.start_time,
    identity: row.identity,
    routineTitle: row.routine_title,
    routineSubtitle: row.routine_subtitle,
    position: row.position,
  }));
}

export type NewTimeBlock = {
  label: string;
  iconKey: string;
  /** HH:MM, null = flexible/anytime. */
  startTime: string | null;
};

export type TimeBlockPatch = {
  label?: string;
  iconKey?: string;
  startTime?: string | null;
};

/** Slug of `label` that no existing block uses as its key. */
async function uniqueBlockKey(
  db: SQLiteDatabase,
  label: string,
): Promise<string> {
  const base =
    label
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "block";

  let candidate = base;
  for (let suffix = 2; ; suffix += 1) {
    const taken = await db.getFirstAsync(
      "SELECT 1 FROM time_blocks WHERE key = ?",
      [candidate],
    );
    if (!taken) return candidate;
    candidate = `${base}-${suffix}`;
  }
}

/** Rewrites positions so flexible blocks come first, then timed blocks by time. */
async function normalizeBlockPositions(db: SQLiteDatabase): Promise<void> {
  const rows = await db.getAllAsync<{ id: number }>(
    `SELECT id FROM time_blocks
     ORDER BY (start_time IS NULL) DESC, start_time, position`,
  );
  for (const [position, row] of rows.entries()) {
    await db.runAsync("UPDATE time_blocks SET position = ? WHERE id = ?", [
      position,
      row.id,
    ]);
  }
}

export async function createTimeBlock(input: NewTimeBlock): Promise<number> {
  const db = await getDatabase();
  const key = await uniqueBlockKey(db, input.label);
  const inserted = await db.runAsync(
    `INSERT INTO time_blocks (key, label, icon_key, start_time, routine_title, position)
     VALUES (?, ?, ?, ?, ?, (SELECT COALESCE(MAX(position), -1) + 1 FROM time_blocks))`,
    [key, input.label, input.iconKey, input.startTime, input.label],
  );
  await normalizeBlockPositions(db);
  return inserted.lastInsertRowId;
}

export async function updateTimeBlock(
  id: number,
  patch: TimeBlockPatch,
): Promise<void> {
  const db = await getDatabase();
  const current = await db.getFirstAsync<{
    label: string;
    routine_title: string;
  }>("SELECT label, routine_title FROM time_blocks WHERE id = ?", [id]);
  if (!current) return;

  const label = patch.label ?? current.label;
  // A block whose routine title just mirrors its label keeps them in sync.
  const routineTitle =
    current.routine_title === current.label ? label : current.routine_title;

  await db.runAsync(
    `UPDATE time_blocks
     SET label = ?, routine_title = ?,
         icon_key = COALESCE(?, icon_key),
         start_time = CASE WHEN ? THEN start_time ELSE ? END
     WHERE id = ?`,
    [
      label,
      routineTitle,
      patch.iconKey ?? null,
      patch.startTime === undefined ? 1 : 0,
      patch.startTime ?? null,
      id,
    ],
  );
  await normalizeBlockPositions(db);
}

/** Removes a block; its routine actions and their completions cascade away. */
export async function deleteTimeBlock(id: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync("DELETE FROM time_blocks WHERE id = ?", [id]);
  await normalizeBlockPositions(db);
}

/**
 * Key of the block whose start time most recently passed, falling back to the
 * first flexible block.
 */
export async function getCurrentBlockKey(now: Date): Promise<string> {
  const db = await getDatabase();
  const clock = `${String(now.getHours()).padStart(2, "0")}:${String(
    now.getMinutes(),
  ).padStart(2, "0")}`;

  const timed = await db.getFirstAsync<{ key: string }>(
    `SELECT key FROM time_blocks
     WHERE start_time IS NOT NULL AND start_time <= ?
     ORDER BY start_time DESC LIMIT 1`,
    [clock],
  );
  if (timed) {
    return timed.key;
  }

  const flexible = await db.getFirstAsync<{ key: string }>(
    "SELECT key FROM time_blocks WHERE start_time IS NULL ORDER BY position LIMIT 1",
  );
  return flexible?.key ?? "anytime";
}
