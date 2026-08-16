import { getDatabase } from "./database";
import type { NewTimelineMoment, TimelineMoment } from "./types";

type MomentRow = {
  id: number;
  dream_id: number;
  occurred_on: string;
  label: string;
  icon_key: string | null;
  is_locked: number;
};

const SELECT_MOMENT = `
  SELECT id, dream_id, occurred_on, label, icon_key, is_locked
  FROM timeline_moments
`;

function toMoment(row: MomentRow): TimelineMoment {
  return {
    id: row.id,
    dreamId: row.dream_id,
    occurredOn: row.occurred_on,
    label: row.label,
    iconKey: row.icon_key,
    isLocked: row.is_locked === 1,
  };
}

/** The dream's timeline, oldest first (Progress screen order). */
export async function getTimelineMoments(
  dreamId: number,
): Promise<TimelineMoment[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<MomentRow>(
    `${SELECT_MOMENT} WHERE dream_id = ? ORDER BY occurred_on, id`,
    [dreamId],
  );
  return rows.map(toMoment);
}

export async function addTimelineMoment(
  input: NewTimelineMoment,
): Promise<TimelineMoment> {
  const label = input.label.trim();
  if (!label) {
    throw new Error("Moment label is required.");
  }

  const db = await getDatabase();
  const inserted = await db.runAsync(
    `INSERT INTO timeline_moments (dream_id, occurred_on, label, icon_key, is_locked)
     VALUES (?, ?, ?, ?, ?)`,
    [
      input.dreamId,
      input.occurredOn,
      label,
      input.iconKey ?? null,
      input.isLocked ? 1 : 0,
    ],
  );

  const row = await db.getFirstAsync<MomentRow>(
    `${SELECT_MOMENT} WHERE id = ?`,
    [inserted.lastInsertRowId],
  );
  if (!row) {
    throw new Error("Failed to read back the created moment.");
  }
  return toMoment(row);
}

export async function deleteTimelineMoment(id: number): Promise<boolean> {
  const db = await getDatabase();
  const result = await db.runAsync(
    "DELETE FROM timeline_moments WHERE id = ?",
    [id],
  );
  return result.changes > 0;
}
