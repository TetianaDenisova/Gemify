import type { SQLiteDatabase } from "expo-sqlite";

import { getDatabase } from "./database";
import type { Dream, DreamPatch, FeelingState, NewDream } from "./types";

const MAX_FEELING_STATES = 3;

type DreamRow = {
  id: number;
  seed_key: string | null;
  title: string;
  vision_statement: string | null;
  photo_uri: string | null;
  is_archived: number;
};

const SELECT_DREAM = `
  SELECT id, seed_key, title, vision_statement, photo_uri, is_archived
  FROM dreams
`;

function toDream(row: DreamRow): Dream {
  return {
    id: row.id,
    seedKey: row.seed_key,
    title: row.title,
    visionStatement: row.vision_statement,
    photoUri: row.photo_uri,
    isArchived: row.is_archived === 1,
  };
}

/**
 * Creates a dream plus its selected feeling states (at most three; unknown
 * labels are added to the catalog) in one transaction. Milestones and What-If
 * risk plans start empty — the user creates them from scratch.
 */
export async function createDream(input: NewDream): Promise<Dream> {
  const title = input.title.trim();
  if (!title) {
    throw new Error("Dream title is required.");
  }

  const db = await getDatabase();
  let dreamId = 0;

  await db.withTransactionAsync(async () => {
    const inserted = await db.runAsync(
      "INSERT INTO dreams (title, vision_statement, photo_uri) VALUES (?, ?, ?)",
      [title, input.visionStatement?.trim() || null, input.photoUri ?? null],
    );
    dreamId = inserted.lastInsertRowId;

    if (input.feelingStates?.length) {
      await linkFeelingStates(db, dreamId, input.feelingStates);
    }
  });

  const dream = await getDreamById(dreamId);
  if (!dream) {
    throw new Error("Failed to read back the created dream.");
  }
  return dream;
}

/** Home-screen list: insertion order, archived dreams hidden by default. */
export async function getDreams(includeArchived = false): Promise<Dream[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<DreamRow>(
    includeArchived
      ? `${SELECT_DREAM} ORDER BY id`
      : `${SELECT_DREAM} WHERE is_archived = 0 ORDER BY id`,
  );
  return rows.map(toDream);
}

export type DreamSummary = Dream & {
  /** Title of the first not-completed milestone (or the last one when done). */
  currentMilestone: string | null;
  completedTasks: number;
  totalTasks: number;
  /**
   * 0..100, exact (unrounded) so partial shares still sum to 100. The dream's
   * 100% is split equally across its milestones, each milestone's share
   * equally across its active quests, and each quest's share equally across
   * its tasks. Round only for display.
   */
  progressPercent: number;
};

/** Home-screen cards: each dream with its current milestone and task counts. */
export async function getDreamSummaries(): Promise<DreamSummary[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<
    DreamRow & {
      current_milestone: string | null;
      completed_tasks: number;
      total_tasks: number;
      progress_fraction: number;
    }
  >(
    // Weighted progress: AVG at each level gives every milestone an equal
    // slice of the dream, every active quest an equal slice of its milestone,
    // and every task an equal slice of its quest. A milestone the user marked
    // completed counts as its full slice regardless of quest state; empty
    // levels count as 0.
    `WITH quest_progress AS (
       SELECT q.id, q.milestone_id,
              COALESCE(AVG(t.is_done * 1.0), 0) AS progress
       FROM quests q
       LEFT JOIN tasks t ON t.quest_id = q.id
       WHERE q.is_active = 1
       GROUP BY q.id
     ),
     milestone_progress AS (
       SELECT m.id, m.dream_id,
              CASE WHEN m.status = 'completed' THEN 1.0
                   ELSE COALESCE(
                     (SELECT AVG(qp.progress) FROM quest_progress qp
                      WHERE qp.milestone_id = m.id),
                     0)
              END AS progress
       FROM milestones m
     )
     SELECT d.id, d.seed_key, d.title, d.vision_statement, d.photo_uri,
            d.is_archived,
            COALESCE(
              (SELECT m.title FROM milestones m
               WHERE m.dream_id = d.id AND m.status = 'active'
               ORDER BY m.sequence_number LIMIT 1),
              (SELECT m.title FROM milestones m
               WHERE m.dream_id = d.id
               ORDER BY m.sequence_number DESC LIMIT 1)
            ) AS current_milestone,
            (SELECT COUNT(*) FROM tasks t
             JOIN quests q ON q.id = t.quest_id
             JOIN milestones m ON m.id = q.milestone_id
             WHERE m.dream_id = d.id AND t.is_done = 1) AS completed_tasks,
            (SELECT COUNT(*) FROM tasks t
             JOIN quests q ON q.id = t.quest_id
             JOIN milestones m ON m.id = q.milestone_id
             WHERE m.dream_id = d.id) AS total_tasks,
            COALESCE(
              (SELECT AVG(mp.progress) FROM milestone_progress mp
               WHERE mp.dream_id = d.id),
              0) AS progress_fraction
     FROM dreams d
     WHERE d.is_archived = 0
     ORDER BY d.id`,
  );

  return rows.map((row) => ({
    ...toDream(row),
    currentMilestone: row.current_milestone,
    completedTasks: row.completed_tasks,
    totalTasks: row.total_tasks,
    progressPercent: row.progress_fraction * 100,
  }));
}

export async function getDreamById(id: number): Promise<Dream | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<DreamRow>(`${SELECT_DREAM} WHERE id = ?`, [
    id,
  ]);
  return row ? toDream(row) : null;
}

/** Updates only the fields present in `patch` and returns the stored row. */
export async function updateDream(
  id: number,
  patch: DreamPatch,
): Promise<Dream | null> {
  const assignments: string[] = [];
  const params: (string | number | null)[] = [];

  if (patch.title !== undefined) {
    const title = patch.title.trim();
    if (!title) {
      throw new Error("Dream title is required.");
    }
    assignments.push("title = ?");
    params.push(title);
  }
  if (patch.visionStatement !== undefined) {
    assignments.push("vision_statement = ?");
    params.push(patch.visionStatement?.trim() || null);
  }
  if (patch.photoUri !== undefined) {
    assignments.push("photo_uri = ?");
    params.push(patch.photoUri);
  }
  if (patch.isArchived !== undefined) {
    assignments.push("is_archived = ?");
    params.push(patch.isArchived ? 1 : 0);
  }

  if (assignments.length > 0) {
    const db = await getDatabase();
    await db.runAsync(
      `UPDATE dreams SET ${assignments.join(", ")} WHERE id = ?`,
      [...params, id],
    );
  }

  return getDreamById(id);
}

/** Deletes the dream and (via CASCADE) its entire aggregate. */
export async function deleteDream(id: number): Promise<boolean> {
  const db = await getDatabase();
  const result = await db.runAsync("DELETE FROM dreams WHERE id = ?", [id]);
  return result.changes > 0;
}

/** Full feeling-state catalog (seeded labels plus user-created ones). */
export async function getFeelingStates(): Promise<FeelingState[]> {
  const db = await getDatabase();
  return db.getAllAsync<FeelingState>(
    "SELECT id, label FROM feeling_states ORDER BY id",
  );
}

/** The dream's selected feeling-state labels, in selection order. */
export async function getDreamFeelingStates(dreamId: number): Promise<string[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ label: string }>(
    `SELECT fs.label
     FROM dream_feeling_states dfs
     JOIN feeling_states fs ON fs.id = dfs.state_id
     WHERE dfs.dream_id = ?
     ORDER BY dfs.rowid`,
    [dreamId],
  );
  return rows.map((row) => row.label);
}

/** Replaces the dream's selection with `labels` (first three are kept). */
export async function setDreamFeelingStates(
  dreamId: number,
  labels: readonly string[],
): Promise<void> {
  const db = await getDatabase();
  await db.withTransactionAsync(async () => {
    await db.runAsync("DELETE FROM dream_feeling_states WHERE dream_id = ?", [
      dreamId,
    ]);
    await linkFeelingStates(db, dreamId, labels);
  });
}

async function linkFeelingStates(
  db: SQLiteDatabase,
  dreamId: number,
  labels: readonly string[],
): Promise<void> {
  const cleaned = labels
    .map((label) => label.trim())
    .filter(Boolean)
    .slice(0, MAX_FEELING_STATES);

  for (const label of cleaned) {
    await db.runAsync("INSERT OR IGNORE INTO feeling_states (label) VALUES (?)", [
      label,
    ]);
    await db.runAsync(
      `INSERT OR IGNORE INTO dream_feeling_states (dream_id, state_id)
       SELECT ?, id FROM feeling_states WHERE label = ?`,
      [dreamId, label],
    );
  }
}
