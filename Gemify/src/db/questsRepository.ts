import { getDatabase } from "./database";
import type { Idea, Quest, QuestPatch, QuestWithBreadcrumb } from "./types";

type QuestRow = {
  id: number;
  milestone_id: number;
  title: string;
  is_active: number;
  is_done: number;
  created_at: string;
  scheduled_date: string | null;
  scheduled_time: string | null;
  is_planned: number;
  completed_at: string | null;
};

type QuestBreadcrumbRow = QuestRow & {
  dream_title: string;
  milestone_title: string;
};

const SELECT_QUEST = `
  SELECT id, milestone_id, title, is_active, is_done, created_at,
         scheduled_date, scheduled_time, is_planned, completed_at
  FROM quests
`;

const SELECT_QUEST_WITH_BREADCRUMB = `
  SELECT q.id, q.milestone_id, q.title, q.is_active, q.is_done, q.created_at,
         q.scheduled_date, q.scheduled_time, q.is_planned, q.completed_at,
         m.title AS milestone_title, d.title AS dream_title
  FROM quests q
  JOIN milestones m ON m.id = q.milestone_id
  JOIN dreams d ON d.id = m.dream_id
`;

function toQuest(row: QuestRow): Quest {
  return {
    id: row.id,
    milestoneId: row.milestone_id,
    title: row.title,
    isActive: row.is_active === 1,
    isDone: row.is_done === 1,
    createdAt: row.created_at,
    scheduledDate: row.scheduled_date,
    scheduledTime: row.scheduled_time,
    isPlanned: row.is_planned === 1,
    completedAt: row.completed_at,
  };
}

function toQuestWithBreadcrumb(row: QuestBreadcrumbRow): QuestWithBreadcrumb {
  return {
    ...toQuest(row),
    dreamTitle: row.dream_title,
    milestoneTitle: row.milestone_title,
  };
}

export async function getQuests(milestoneId: number): Promise<Quest[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<QuestRow>(
    `${SELECT_QUEST} WHERE milestone_id = ? ORDER BY id`,
    [milestoneId],
  );
  return rows.map(toQuest);
}

/** Every quest under the dream's milestones (progress charts). */
export async function getQuestsByDream(dreamId: number): Promise<Quest[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<QuestRow>(
    `SELECT q.id, q.milestone_id, q.title, q.is_active, q.is_done, q.created_at,
            q.scheduled_date, q.scheduled_time, q.is_planned, q.completed_at
     FROM quests q
     JOIN milestones m ON m.id = q.milestone_id
     WHERE m.dream_id = ?
     ORDER BY q.id`,
    [dreamId],
  );
  return rows.map(toQuest);
}

export async function getQuestById(id: number): Promise<Quest | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<QuestRow>(`${SELECT_QUEST} WHERE id = ?`, [
    id,
  ]);
  return row ? toQuest(row) : null;
}

/** Sprint board: quests scheduled on a day, timed ones first. */
export async function getScheduledQuests(
  date: string,
): Promise<QuestWithBreadcrumb[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<QuestBreadcrumbRow>(
    `${SELECT_QUEST_WITH_BREADCRUMB}
     WHERE q.scheduled_date = ?
     ORDER BY q.scheduled_time IS NULL, q.scheduled_time, q.id`,
    [date],
  );
  return rows.map(toQuestWithBreadcrumb);
}

/** Day-plan picker: every open quest not yet accepted into the plan. */
export async function getSchedulableQuests(): Promise<QuestWithBreadcrumb[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<QuestBreadcrumbRow>(
    `${SELECT_QUEST_WITH_BREADCRUMB}
     WHERE q.is_done = 0 AND q.is_planned = 0 AND q.scheduled_date IS NULL
     ORDER BY d.id, m.sequence_number, q.id`,
  );
  return rows.map(toQuestWithBreadcrumb);
}

/** Sprint backlog: quests added to the weekly plan but not put on a day yet. */
export async function getUnscheduledQuests(): Promise<QuestWithBreadcrumb[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<QuestBreadcrumbRow>(
    `${SELECT_QUEST_WITH_BREADCRUMB}
     WHERE q.scheduled_date IS NULL AND q.is_planned = 1
     ORDER BY d.id, m.sequence_number, q.id`,
  );
  return rows.map(toQuestWithBreadcrumb);
}

/** Week-strip counts: date → number of scheduled quests (missing date = 0). */
export async function getScheduledQuestCounts(
  fromDate: string,
  toDate: string,
): Promise<Map<string, number>> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ count: number; date: string }>(
    `SELECT scheduled_date AS date, COUNT(*) AS count
     FROM quests
     WHERE scheduled_date BETWEEN ? AND ?
     GROUP BY scheduled_date`,
    [fromDate, toDate],
  );
  return new Map(rows.map((row) => [row.date, row.count]));
}

export async function createQuest(
  milestoneId: number,
  title: string,
): Promise<Quest> {
  const cleanTitle = title.trim();
  if (!cleanTitle) {
    throw new Error("Quest title is required.");
  }

  const db = await getDatabase();
  const inserted = await db.runAsync(
    "INSERT INTO quests (milestone_id, title) VALUES (?, ?)",
    [milestoneId, cleanTitle],
  );

  const quest = await getQuestById(inserted.lastInsertRowId);
  if (!quest) {
    throw new Error("Failed to read back the created quest.");
  }
  return quest;
}

/** Updates only the fields present in `patch` and returns the stored row. */
export async function updateQuest(
  id: number,
  patch: QuestPatch,
): Promise<Quest | null> {
  const assignments: string[] = [];
  const params: (string | number | null)[] = [];

  if (patch.title !== undefined) {
    const title = patch.title.trim();
    if (!title) {
      throw new Error("Quest title is required.");
    }
    assignments.push("title = ?");
    params.push(title);
  }
  if (patch.isActive !== undefined) {
    assignments.push("is_active = ?");
    params.push(patch.isActive ? 1 : 0);
  }
  if (patch.isDone !== undefined) {
    assignments.push("is_done = ?");
    params.push(patch.isDone ? 1 : 0);
  }
  if (patch.scheduledDate !== undefined) {
    assignments.push("scheduled_date = ?");
    params.push(patch.scheduledDate);
  }
  if (patch.scheduledTime !== undefined) {
    assignments.push("scheduled_time = ?");
    params.push(patch.scheduledTime);
  }
  if (patch.isPlanned !== undefined) {
    assignments.push("is_planned = ?");
    params.push(patch.isPlanned ? 1 : 0);
  }

  if (assignments.length > 0) {
    const db = await getDatabase();
    await db.runAsync(
      `UPDATE quests SET ${assignments.join(", ")} WHERE id = ?`,
      [...params, id],
    );
  }

  return getQuestById(id);
}

/** Checks a quest on or off; `completed_at` feeds the history charts. */
export async function setQuestDone(
  id: number,
  done: boolean,
): Promise<Quest | null> {
  const db = await getDatabase();
  await db.runAsync(
    done
      ? `UPDATE quests SET is_done = 1,
           completed_at = STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now')
         WHERE id = ?`
      : "UPDATE quests SET is_done = 0, completed_at = NULL WHERE id = ?",
    [id],
  );
  return getQuestById(id);
}

export async function deleteQuest(id: number): Promise<boolean> {
  const db = await getDatabase();
  const result = await db.runAsync("DELETE FROM quests WHERE id = ?", [id]);
  return result.changes > 0;
}

/**
 * Rollover: quests scheduled before `beforeDate` (normally today, so
 * yesterday's undone quests are included) that were never done go back to the
 * unscheduled backlog, showing up under "Unscheduled this week" instead of
 * silently staying on past days. Returns how many quests were moved.
 */
export async function rolloverOverdueQuests(
  beforeDate: string,
): Promise<number> {
  const db = await getDatabase();
  const result = await db.runAsync(
    `UPDATE quests SET scheduled_date = NULL, scheduled_time = NULL, is_planned = 1
     WHERE is_done = 0 AND scheduled_date IS NOT NULL AND scheduled_date < ?`,
    [beforeDate],
  );
  return result.changes;
}

// ---------------------------------------------------------------------------
// Ideas
// ---------------------------------------------------------------------------

type IdeaRow = {
  id: number;
  milestone_id: number;
  title: string;
  score: number;
};

function toIdea(row: IdeaRow): Idea {
  return {
    id: row.id,
    milestoneId: row.milestone_id,
    title: row.title,
    score: row.score,
  };
}

/** Ideas for a milestone, highest score first (matches the screen order). */
export async function getIdeas(milestoneId: number): Promise<Idea[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<IdeaRow>(
    "SELECT id, milestone_id, title, score FROM ideas WHERE milestone_id = ? ORDER BY score DESC, id",
    [milestoneId],
  );
  return rows.map(toIdea);
}

export async function createIdea(
  milestoneId: number,
  title: string,
  score = 0,
): Promise<Idea> {
  const cleanTitle = title.trim();
  if (!cleanTitle) {
    throw new Error("Idea title is required.");
  }

  const db = await getDatabase();
  const inserted = await db.runAsync(
    "INSERT INTO ideas (milestone_id, title, score) VALUES (?, ?, ?)",
    [milestoneId, cleanTitle, score],
  );
  const row = await db.getFirstAsync<IdeaRow>(
    "SELECT id, milestone_id, title, score FROM ideas WHERE id = ?",
    [inserted.lastInsertRowId],
  );
  if (!row) {
    throw new Error("Failed to read back the created idea.");
  }
  return toIdea(row);
}

export async function deleteIdea(id: number): Promise<boolean> {
  const db = await getDatabase();
  const result = await db.runAsync("DELETE FROM ideas WHERE id = ?", [id]);
  return result.changes > 0;
}

/**
 * "Approve" — the idea becomes a quest under the same milestone and the idea
 * row is removed, in one transaction. Returns the new quest, or null when the
 * idea no longer exists.
 */
export async function approveIdea(ideaId: number): Promise<Quest | null> {
  const db = await getDatabase();
  const idea = await db.getFirstAsync<IdeaRow>(
    "SELECT id, milestone_id, title, score FROM ideas WHERE id = ?",
    [ideaId],
  );
  if (!idea) {
    return null;
  }

  let questId = 0;
  await db.withTransactionAsync(async () => {
    const inserted = await db.runAsync(
      "INSERT INTO quests (milestone_id, title) VALUES (?, ?)",
      [idea.milestone_id, idea.title],
    );
    questId = inserted.lastInsertRowId;
    await db.runAsync("DELETE FROM ideas WHERE id = ?", [ideaId]);
  });

  return getQuestById(questId);
}
