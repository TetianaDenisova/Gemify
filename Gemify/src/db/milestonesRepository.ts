import { getDatabase } from "./database";
import type { Milestone, MilestonePatch, NewMilestone } from "./types";

type MilestoneRow = {
  id: number;
  dream_id: number;
  sequence_number: number;
  title: string;
  state: string | null;
  artifact: string | null;
  mentor: string | null;
  reward: string | null;
  status: Milestone["status"];
  photo_uri: string | null;
};

const SELECT_MILESTONE = `
  SELECT id, dream_id, sequence_number, title, state, artifact, mentor, reward,
         status, photo_uri
  FROM milestones
`;

function toMilestone(row: MilestoneRow): Milestone {
  return {
    id: row.id,
    dreamId: row.dream_id,
    sequenceNumber: row.sequence_number,
    title: row.title,
    state: row.state,
    artifact: row.artifact,
    mentor: row.mentor,
    reward: row.reward,
    status: row.status,
    photoUri: row.photo_uri,
  };
}

/** The dream's path in order (0 = start of the journey). */
export async function getMilestones(dreamId: number): Promise<Milestone[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<MilestoneRow>(
    `${SELECT_MILESTONE} WHERE dream_id = ? ORDER BY sequence_number`,
    [dreamId],
  );
  return rows.map(toMilestone);
}

export async function getMilestoneById(id: number): Promise<Milestone | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<MilestoneRow>(
    `${SELECT_MILESTONE} WHERE id = ?`,
    [id],
  );
  return row ? toMilestone(row) : null;
}

/**
 * Inserts a milestone at `atIndex` on the dream's path, shifting later
 * milestones one slot up. The shift goes through negative numbers in two
 * steps so the UNIQUE (dream_id, sequence_number) constraint never trips.
 */
export async function insertMilestone(
  dreamId: number,
  atIndex: number,
  input: NewMilestone,
): Promise<Milestone> {
  const title = input.title.trim();
  if (!title) {
    throw new Error("Milestone title is required.");
  }

  const db = await getDatabase();
  let milestoneId = 0;

  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `UPDATE milestones SET sequence_number = -sequence_number - 1
       WHERE dream_id = ? AND sequence_number >= ?`,
      [dreamId, atIndex],
    );
    await db.runAsync(
      `UPDATE milestones SET sequence_number = -sequence_number
       WHERE dream_id = ? AND sequence_number < 0`,
      [dreamId],
    );

    const inserted = await db.runAsync(
      `INSERT INTO milestones
         (dream_id, sequence_number, title, state, artifact, mentor, reward, photo_uri)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        dreamId,
        atIndex,
        title,
        input.state?.trim() || null,
        input.artifact?.trim() || null,
        input.mentor?.trim() || null,
        input.reward?.trim() || null,
        input.photoUri ?? null,
      ],
    );
    milestoneId = inserted.lastInsertRowId;
  });

  const milestone = await getMilestoneById(milestoneId);
  if (!milestone) {
    throw new Error("Failed to read back the created milestone.");
  }
  return milestone;
}

/** Updates only the fields present in `patch` and returns the stored row. */
export async function updateMilestone(
  id: number,
  patch: MilestonePatch,
): Promise<Milestone | null> {
  const assignments: string[] = [];
  const params: (string | null)[] = [];

  if (patch.title !== undefined) {
    const title = patch.title.trim();
    if (!title) {
      throw new Error("Milestone title is required.");
    }
    assignments.push("title = ?");
    params.push(title);
  }
  for (const key of ["state", "artifact", "mentor", "reward"] as const) {
    const value = patch[key];
    if (value !== undefined) {
      assignments.push(`${key} = ?`);
      params.push(value?.trim() || null);
    }
  }
  if (patch.status !== undefined) {
    assignments.push("status = ?");
    params.push(patch.status);
  }
  if (patch.photoUri !== undefined) {
    assignments.push("photo_uri = ?");
    params.push(patch.photoUri);
  }

  if (assignments.length > 0) {
    const db = await getDatabase();
    await db.runAsync(
      `UPDATE milestones SET ${assignments.join(", ")} WHERE id = ?`,
      [...params, id],
    );
  }

  return getMilestoneById(id);
}

export type MilestoneQuestProgress = {
  milestoneId: number;
  /** Active quests checked off. */
  completed: number;
  /** All active quests on the milestone. */
  total: number;
};

/** Per-milestone quest counts for a dream, driving the "N of M quests" bar. */
export async function getQuestProgressByMilestone(
  dreamId: number,
): Promise<MilestoneQuestProgress[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{
    milestone_id: number;
    completed: number;
    total: number;
  }>(
    `SELECT m.id AS milestone_id,
            COUNT(q.id) AS total,
            COALESCE(SUM(q.is_done), 0) AS completed
     FROM milestones m
     LEFT JOIN quests q ON q.milestone_id = m.id AND q.is_active = 1
     WHERE m.dream_id = ?
     GROUP BY m.id`,
    [dreamId],
  );
  return rows.map((row) => ({
    milestoneId: row.milestone_id,
    completed: row.completed,
    total: row.total,
  }));
}

/**
 * Deletes a milestone (its quests/ideas cascade) and compacts the
 * dream's sequence numbers back to 0..n-1.
 */
export async function deleteMilestone(id: number): Promise<boolean> {
  const db = await getDatabase();
  const existing = await db.getFirstAsync<{
    dream_id: number;
    sequence_number: number;
  }>("SELECT dream_id, sequence_number FROM milestones WHERE id = ?", [id]);

  if (!existing) {
    return false;
  }

  await db.withTransactionAsync(async () => {
    await db.runAsync("DELETE FROM milestones WHERE id = ?", [id]);
    await db.runAsync(
      `UPDATE milestones SET sequence_number = -sequence_number
       WHERE dream_id = ? AND sequence_number > ?`,
      [existing.dream_id, existing.sequence_number],
    );
    await db.runAsync(
      `UPDATE milestones SET sequence_number = -sequence_number - 1
       WHERE dream_id = ? AND sequence_number < 0`,
      [existing.dream_id],
    );
  });

  return true;
}
