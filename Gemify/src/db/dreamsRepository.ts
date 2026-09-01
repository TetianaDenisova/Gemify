import type { SQLiteDatabase } from "expo-sqlite";

import { getDatabase } from "./database";
import type { Dream, DreamPatch, FeelingState, NewDream } from "./types";

const MAX_FEELING_STATES = 3;

/**
 * Planned length of every journey (Awakening → Vision). Users create
 * milestones one at a time, so a dream often holds fewer rows than the full
 * path — progress still measures against at least this many milestones, so
 * finishing the first created milestone never reads as the whole dream.
 */
export const JOURNEY_MILESTONE_COUNT = 6;

type DreamRow = {
  id: number;
  seed_key: string | null;
  title: string;
  vision_statement: string | null;
  photo_uri: string | null;
  photo_focus_x: number;
  photo_focus_y: number;
  photo_scale: number;
  is_archived: number;
};

const SELECT_DREAM = `
  SELECT id, seed_key, title, vision_statement, photo_uri,
         photo_focus_x, photo_focus_y, photo_scale, is_archived
  FROM dreams
`;

function toDream(row: DreamRow): Dream {
  return {
    id: row.id,
    seedKey: row.seed_key,
    title: row.title,
    visionStatement: row.vision_statement,
    photoUri: row.photo_uri,
    photoFocusX: row.photo_focus_x,
    photoFocusY: row.photo_focus_y,
    photoScale: row.photo_scale,
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
  completedQuests: number;
  totalQuests: number;
  /**
   * 0..100, exact (unrounded) so partial shares still sum to 100. The dream's
   * 100% is split equally across its milestones, and each milestone's share
   * equally across its active quests. Round only for display.
   */
  progressPercent: number;
};

/** Home-screen cards: each dream with its current milestone and quest counts. */
export async function getDreamSummaries(): Promise<DreamSummary[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<
    DreamRow & {
      current_milestone: string | null;
      completed_quests: number;
      total_quests: number;
      progress_fraction: number;
    }
  >(
    // Weighted progress: every milestone is an equal slice of the dream (the
    // journey counts at least JOURNEY_MILESTONE_COUNT slices even while fewer
    // are created) and every active quest an equal slice of its milestone. A
    // milestone the user marked completed counts as its full slice regardless
    // of quest state; empty levels count as 0.
    `WITH milestone_progress AS (
       SELECT m.id, m.dream_id,
              CASE WHEN m.status = 'completed' THEN 1.0
                   ELSE COALESCE(
                     (SELECT AVG(q.is_done * 1.0) FROM quests q
                      WHERE q.milestone_id = m.id AND q.is_active = 1),
                     0)
              END AS progress
       FROM milestones m
     )
     SELECT d.id, d.seed_key, d.title, d.vision_statement, d.photo_uri,
            d.photo_focus_x, d.photo_focus_y, d.photo_scale, d.is_archived,
            COALESCE(
              (SELECT m.title FROM milestones m
               WHERE m.dream_id = d.id AND m.status = 'active'
               ORDER BY m.sequence_number LIMIT 1),
              (SELECT m.title FROM milestones m
               WHERE m.dream_id = d.id
               ORDER BY m.sequence_number DESC LIMIT 1)
            ) AS current_milestone,
            (SELECT COUNT(*) FROM quests q
             JOIN milestones m ON m.id = q.milestone_id
             WHERE m.dream_id = d.id AND q.is_done = 1) AS completed_quests,
            (SELECT COUNT(*) FROM quests q
             JOIN milestones m ON m.id = q.milestone_id
             WHERE m.dream_id = d.id) AS total_quests,
            COALESCE(
              (SELECT SUM(mp.progress) FROM milestone_progress mp
               WHERE mp.dream_id = d.id)
              / MAX((SELECT COUNT(*) FROM milestones m
                     WHERE m.dream_id = d.id),
                    ${JOURNEY_MILESTONE_COUNT}),
              0) AS progress_fraction
     FROM dreams d
     WHERE d.is_archived = 0
     ORDER BY d.id`,
  );

  return rows.map((row) => ({
    ...toDream(row),
    currentMilestone: row.current_milestone,
    completedQuests: row.completed_quests,
    totalQuests: row.total_quests,
    progressPercent: row.progress_fraction * 100,
  }));
}

export type WeekAscentEntry = {
  dreamId: number;
  dreamTitle: string;
  /** 0..100 — dream % the week's scheduled quests add once they are all done. */
  expectedPercent: number;
  /** 0..100 — dream % already earned by the week's completed quests. */
  gainedPercent: number;
  /** Milestone the week's plan finishes (its last open quests are scheduled). */
  completesMilestone: string | null;
};

/**
 * Weekly-plan ascent card: per dream, how much progress the week's plan
 * promises (expected) and has already earned (gained). The plan is every
 * quest scheduled in [fromDate, toDate] plus the still-unscheduled weekly
 * backlog (is_planned without a date). Uses the same weighting as
 * getDreamSummaries — every milestone is an equal slice of the dream and
 * every active quest an equal slice of its milestone.
 */
export async function getWeekAscent(
  fromDate: string,
  toDate: string,
): Promise<WeekAscentEntry[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{
    id: number;
    title: string;
    expected_fraction: number;
    gained_fraction: number;
  }>(
    // The scheduled quest itself is active and belongs to the milestone, so
    // the active-quest count in the divisor is always at least 1. The
    // milestone's completed flag is ignored on purpose: marking a milestone
    // done mid-week must not erase the credit its planned quests earned.
    `WITH quest_weight AS (
       SELECT m.dream_id, q.is_done,
              1.0 / (MAX((SELECT COUNT(*) FROM milestones m2
                          WHERE m2.dream_id = m.dream_id),
                         ${JOURNEY_MILESTONE_COUNT})
                     * (SELECT COUNT(*) FROM quests q2
                        WHERE q2.milestone_id = m.id AND q2.is_active = 1)
                    ) AS weight
       FROM quests q
       JOIN milestones m ON m.id = q.milestone_id
       WHERE (q.scheduled_date BETWEEN ? AND ?
              OR (q.is_planned = 1 AND q.scheduled_date IS NULL))
         AND q.is_active = 1
     )
     SELECT d.id, d.title,
            SUM(qw.weight) AS expected_fraction,
            SUM(CASE WHEN qw.is_done = 1 THEN qw.weight ELSE 0 END)
              AS gained_fraction
     FROM quest_weight qw
     JOIN dreams d ON d.id = qw.dream_id
     WHERE d.is_archived = 0
     GROUP BY d.id
     ORDER BY d.id`,
    [fromDate, toDate],
  );

  // Milestones whose every remaining open quest sits inside the week — doing
  // the plan completes them. Earliest such milestone per dream is shown.
  const completions = await db.getAllAsync<{ dream_id: number; title: string }>(
    `SELECT m.dream_id, m.title
     FROM milestones m
     WHERE m.status != 'completed'
       AND EXISTS (SELECT 1 FROM quests q
                   WHERE q.milestone_id = m.id AND q.is_active = 1
                     AND (q.scheduled_date BETWEEN ? AND ?
                          OR (q.is_planned = 1 AND q.scheduled_date IS NULL)))
       AND NOT EXISTS (SELECT 1 FROM quests q
                       WHERE q.milestone_id = m.id AND q.is_active = 1
                         AND q.is_done = 0
                         AND (q.scheduled_date NOT BETWEEN ? AND ?
                              OR (q.scheduled_date IS NULL
                                  AND q.is_planned = 0)))
     ORDER BY m.dream_id, m.sequence_number`,
    [fromDate, toDate, fromDate, toDate],
  );
  const completesByDream = new Map<number, string>();
  for (const row of completions) {
    if (!completesByDream.has(row.dream_id)) {
      completesByDream.set(row.dream_id, row.title);
    }
  }

  return rows.map((row) => ({
    dreamId: row.id,
    dreamTitle: row.title,
    expectedPercent: row.expected_fraction * 100,
    gainedPercent: row.gained_fraction * 100,
    completesMilestone: completesByDream.get(row.id) ?? null,
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
  if (patch.photoFocusX !== undefined) {
    assignments.push("photo_focus_x = ?");
    params.push(patch.photoFocusX);
  }
  if (patch.photoFocusY !== undefined) {
    assignments.push("photo_focus_y = ?");
    params.push(patch.photoFocusY);
  }
  if (patch.photoScale !== undefined) {
    assignments.push("photo_scale = ?");
    params.push(patch.photoScale);
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
