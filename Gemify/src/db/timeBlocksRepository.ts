import { getDatabase } from "./database";
import type { TimeBlockActionRecord, TimeBlockWithActions } from "./types";

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
