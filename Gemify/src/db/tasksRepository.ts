import { getDatabase } from "./database";
import type { NewTask, Task, TaskPatch, TaskWithBreadcrumb } from "./types";

type TaskRow = {
  id: number;
  quest_id: number;
  title: string;
  scheduled_date: string | null;
  scheduled_time: string | null;
  is_done: number;
  completed_at: string | null;
};

type TaskBreadcrumbRow = TaskRow & {
  dream_title: string;
  milestone_title: string;
  quest_title: string;
};

const SELECT_TASK = `
  SELECT id, quest_id, title, scheduled_date, scheduled_time, is_done, completed_at
  FROM tasks
`;

const SELECT_TASK_WITH_BREADCRUMB = `
  SELECT t.id, t.quest_id, t.title, t.scheduled_date, t.scheduled_time,
         t.is_done, t.completed_at,
         q.title AS quest_title, m.title AS milestone_title, d.title AS dream_title
  FROM tasks t
  JOIN quests q ON q.id = t.quest_id
  JOIN milestones m ON m.id = q.milestone_id
  JOIN dreams d ON d.id = m.dream_id
`;

function toTask(row: TaskRow): Task {
  return {
    id: row.id,
    questId: row.quest_id,
    title: row.title,
    scheduledDate: row.scheduled_date,
    scheduledTime: row.scheduled_time,
    isDone: row.is_done === 1,
    completedAt: row.completed_at,
  };
}

function toTaskWithBreadcrumb(row: TaskBreadcrumbRow): TaskWithBreadcrumb {
  return {
    ...toTask(row),
    dreamTitle: row.dream_title,
    milestoneTitle: row.milestone_title,
    questTitle: row.quest_title,
  };
}

export async function getTasksByQuest(questId: number): Promise<Task[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<TaskRow>(
    `${SELECT_TASK} WHERE quest_id = ? ORDER BY id`,
    [questId],
  );
  return rows.map(toTask);
}

/** Every task under the dream's quests (progress charts). */
export async function getTasksByDream(dreamId: number): Promise<Task[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<TaskRow>(
    `SELECT t.id, t.quest_id, t.title, t.scheduled_date, t.scheduled_time,
            t.is_done, t.completed_at
     FROM tasks t
     JOIN quests q ON q.id = t.quest_id
     JOIN milestones m ON m.id = q.milestone_id
     WHERE m.dream_id = ?
     ORDER BY t.id`,
    [dreamId],
  );
  return rows.map(toTask);
}

export async function getTaskById(id: number): Promise<Task | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<TaskRow>(`${SELECT_TASK} WHERE id = ?`, [
    id,
  ]);
  return row ? toTask(row) : null;
}

/** Sprint board: tasks scheduled on a day, timed ones first. */
export async function getScheduledTasks(
  date: string,
): Promise<TaskWithBreadcrumb[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<TaskBreadcrumbRow>(
    `${SELECT_TASK_WITH_BREADCRUMB}
     WHERE t.scheduled_date = ?
     ORDER BY t.scheduled_time IS NULL, t.scheduled_time, t.id`,
    [date],
  );
  return rows.map(toTaskWithBreadcrumb);
}

/** Sprint board: not-yet-scheduled tasks, grouped by the caller. */
export async function getUnscheduledTasks(): Promise<TaskWithBreadcrumb[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<TaskBreadcrumbRow>(
    `${SELECT_TASK_WITH_BREADCRUMB}
     WHERE t.scheduled_date IS NULL
     ORDER BY d.id, m.sequence_number, q.id, t.id`,
  );
  return rows.map(toTaskWithBreadcrumb);
}

/** Week-strip counts: date → number of scheduled tasks (missing date = 0). */
export async function getScheduledTaskCounts(
  fromDate: string,
  toDate: string,
): Promise<Map<string, number>> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ count: number; date: string }>(
    `SELECT scheduled_date AS date, COUNT(*) AS count
     FROM tasks
     WHERE scheduled_date BETWEEN ? AND ?
     GROUP BY scheduled_date`,
    [fromDate, toDate],
  );
  return new Map(rows.map((row) => [row.date, row.count]));
}

export async function createTask(input: NewTask): Promise<Task> {
  const title = input.title.trim();
  if (!title) {
    throw new Error("Task title is required.");
  }

  const db = await getDatabase();
  const inserted = await db.runAsync(
    `INSERT INTO tasks (quest_id, title, scheduled_date, scheduled_time)
     VALUES (?, ?, ?, ?)`,
    [
      input.questId,
      title,
      input.scheduledDate ?? null,
      input.scheduledTime ?? null,
    ],
  );

  const task = await getTaskById(inserted.lastInsertRowId);
  if (!task) {
    throw new Error("Failed to read back the created task.");
  }
  return task;
}

/** Updates only the fields present in `patch` and returns the stored row. */
export async function updateTask(
  id: number,
  patch: TaskPatch,
): Promise<Task | null> {
  const assignments: string[] = [];
  const params: (string | null)[] = [];

  if (patch.title !== undefined) {
    const title = patch.title.trim();
    if (!title) {
      throw new Error("Task title is required.");
    }
    assignments.push("title = ?");
    params.push(title);
  }
  if (patch.scheduledDate !== undefined) {
    assignments.push("scheduled_date = ?");
    params.push(patch.scheduledDate);
  }
  if (patch.scheduledTime !== undefined) {
    assignments.push("scheduled_time = ?");
    params.push(patch.scheduledTime);
  }

  if (assignments.length > 0) {
    const db = await getDatabase();
    await db.runAsync(
      `UPDATE tasks SET ${assignments.join(", ")} WHERE id = ?`,
      [...params, id],
    );
  }

  return getTaskById(id);
}

/** Checks a task on or off; `completed_at` feeds the history charts. */
export async function setTaskDone(
  id: number,
  done: boolean,
): Promise<Task | null> {
  const db = await getDatabase();
  await db.runAsync(
    done
      ? `UPDATE tasks SET is_done = 1,
           completed_at = STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now')
         WHERE id = ?`
      : "UPDATE tasks SET is_done = 0, completed_at = NULL WHERE id = ?",
    [id],
  );
  return getTaskById(id);
}

export async function deleteTask(id: number): Promise<boolean> {
  const db = await getDatabase();
  const result = await db.runAsync("DELETE FROM tasks WHERE id = ?", [id]);
  return result.changes > 0;
}
