import { getDatabase } from "./database";
import type { Idea, Quest } from "./types";

type QuestRow = {
  id: number;
  milestone_id: number;
  title: string;
  is_active: number;
  created_at: string;
};

const SELECT_QUEST = `
  SELECT id, milestone_id, title, is_active, created_at
  FROM quests
`;

function toQuest(row: QuestRow): Quest {
  return {
    id: row.id,
    milestoneId: row.milestone_id,
    title: row.title,
    isActive: row.is_active === 1,
    createdAt: row.created_at,
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

export async function getQuestById(id: number): Promise<Quest | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<QuestRow>(`${SELECT_QUEST} WHERE id = ?`, [
    id,
  ]);
  return row ? toQuest(row) : null;
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

export async function updateQuest(
  id: number,
  patch: { isActive?: boolean; title?: string },
): Promise<Quest | null> {
  const assignments: string[] = [];
  const params: (string | number)[] = [];

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

  if (assignments.length > 0) {
    const db = await getDatabase();
    await db.runAsync(
      `UPDATE quests SET ${assignments.join(", ")} WHERE id = ?`,
      [...params, id],
    );
  }

  return getQuestById(id);
}

/** Deletes the quest; its tasks cascade. */
export async function deleteQuest(id: number): Promise<boolean> {
  const db = await getDatabase();
  const result = await db.runAsync("DELETE FROM quests WHERE id = ?", [id]);
  return result.changes > 0;
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
