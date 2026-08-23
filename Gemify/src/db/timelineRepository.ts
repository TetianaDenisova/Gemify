import { getDatabase } from "./database";
import type {
  NewTimelineMoment,
  TimelineMoment,
  TimelineMomentPatch,
} from "./types";
import type { SQLiteDatabase } from "expo-sqlite";

type MomentRow = {
  id: number;
  dream_id: number;
  occurred_on: string;
  label: string;
  description: string | null;
  icon_key: string | null;
  is_locked: number;
};

type PhotoRow = {
  moment_id: number;
  uri: string;
};

const SELECT_MOMENT = `
  SELECT id, dream_id, occurred_on, label, description, icon_key, is_locked
  FROM timeline_moments
`;

function toMoment(row: MomentRow, photoUris: string[]): TimelineMoment {
  return {
    id: row.id,
    dreamId: row.dream_id,
    occurredOn: row.occurred_on,
    label: row.label,
    description: row.description,
    iconKey: row.icon_key,
    isLocked: row.is_locked === 1,
    photoUris,
  };
}

async function getPhotosByMoment(
  db: SQLiteDatabase,
  momentIds: readonly number[],
): Promise<Map<number, string[]>> {
  const photos = new Map<number, string[]>();
  if (momentIds.length === 0) return photos;
  const placeholders = momentIds.map(() => "?").join(", ");
  const rows = await db.getAllAsync<PhotoRow>(
    `SELECT moment_id, uri FROM timeline_moment_photos
     WHERE moment_id IN (${placeholders})
     ORDER BY moment_id, position`,
    [...momentIds],
  );
  for (const row of rows) {
    const list = photos.get(row.moment_id) ?? [];
    list.push(row.uri);
    photos.set(row.moment_id, list);
  }
  return photos;
}

async function replacePhotos(
  db: SQLiteDatabase,
  momentId: number,
  uris: readonly string[],
): Promise<void> {
  await db.runAsync("DELETE FROM timeline_moment_photos WHERE moment_id = ?", [
    momentId,
  ]);
  for (const [position, uri] of uris.entries()) {
    await db.runAsync(
      `INSERT INTO timeline_moment_photos (moment_id, uri, position)
       VALUES (?, ?, ?)`,
      [momentId, uri, position],
    );
  }
}

async function getMomentById(
  db: SQLiteDatabase,
  id: number,
): Promise<TimelineMoment> {
  const row = await db.getFirstAsync<MomentRow>(
    `${SELECT_MOMENT} WHERE id = ?`,
    [id],
  );
  if (!row) {
    throw new Error(`Timeline moment ${id} not found.`);
  }
  const photos = await getPhotosByMoment(db, [id]);
  return toMoment(row, photos.get(id) ?? []);
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
  const photos = await getPhotosByMoment(
    db,
    rows.map((row) => row.id),
  );
  return rows.map((row) => toMoment(row, photos.get(row.id) ?? []));
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
    `INSERT INTO timeline_moments
       (dream_id, occurred_on, label, description, icon_key, is_locked)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      input.dreamId,
      input.occurredOn,
      label,
      input.description?.trim() || null,
      input.iconKey ?? null,
      input.isLocked ? 1 : 0,
    ],
  );

  const id = inserted.lastInsertRowId;
  if (input.photoUris?.length) {
    await replacePhotos(db, id, input.photoUris);
  }
  return getMomentById(db, id);
}

export async function updateTimelineMoment(
  id: number,
  patch: TimelineMomentPatch,
): Promise<TimelineMoment> {
  const db = await getDatabase();

  const assignments: string[] = [];
  const values: (string | null)[] = [];
  if (patch.label !== undefined) {
    const label = patch.label.trim();
    if (!label) {
      throw new Error("Moment label is required.");
    }
    assignments.push("label = ?");
    values.push(label);
  }
  if (patch.description !== undefined) {
    assignments.push("description = ?");
    values.push(patch.description?.trim() || null);
  }
  if (assignments.length > 0) {
    await db.runAsync(
      `UPDATE timeline_moments SET ${assignments.join(", ")} WHERE id = ?`,
      [...values, id],
    );
  }
  if (patch.photoUris !== undefined) {
    await replacePhotos(db, id, patch.photoUris);
  }
  return getMomentById(db, id);
}

export async function deleteTimelineMoment(id: number): Promise<boolean> {
  const db = await getDatabase();
  const result = await db.runAsync(
    "DELETE FROM timeline_moments WHERE id = ?",
    [id],
  );
  return result.changes > 0;
}
