import { getDatabase } from "./database";
import type { NewRisk, Risk, RiskAction } from "./types";

type RiskRow = {
  id: number;
  dream_id: number;
  title: string;
  prompt: string;
};

type RiskActionRow = {
  id: number;
  risk_id: number;
  content: string;
};

function toRisk(row: RiskRow, actions: RiskAction[]): Risk {
  return {
    id: row.id,
    dreamId: row.dream_id,
    title: row.title,
    prompt: row.prompt,
    actions,
  };
}

/** The dream's risk plans with their actions, newest plan first. */
export async function getRisks(dreamId: number): Promise<Risk[]> {
  const db = await getDatabase();
  const riskRows = await db.getAllAsync<RiskRow>(
    "SELECT id, dream_id, title, prompt FROM risks WHERE dream_id = ? ORDER BY id DESC",
    [dreamId],
  );
  if (riskRows.length === 0) {
    return [];
  }

  const actionRows = await db.getAllAsync<RiskActionRow>(
    `SELECT ra.id, ra.risk_id, ra.content
     FROM risk_actions ra
     JOIN risks r ON r.id = ra.risk_id
     WHERE r.dream_id = ?
     ORDER BY ra.id`,
    [dreamId],
  );

  const actionsByRisk = new Map<number, RiskAction[]>();
  for (const row of actionRows) {
    const list = actionsByRisk.get(row.risk_id) ?? [];
    list.push({ id: row.id, riskId: row.risk_id, content: row.content });
    actionsByRisk.set(row.risk_id, list);
  }

  return riskRows.map((row) => toRisk(row, actionsByRisk.get(row.id) ?? []));
}

export async function getRiskById(id: number): Promise<Risk | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<RiskRow>(
    "SELECT id, dream_id, title, prompt FROM risks WHERE id = ?",
    [id],
  );
  if (!row) {
    return null;
  }
  const actions = await db.getAllAsync<RiskActionRow>(
    "SELECT id, risk_id, content FROM risk_actions WHERE risk_id = ? ORDER BY id",
    [id],
  );
  return toRisk(
    row,
    actions.map((a) => ({ id: a.id, riskId: a.risk_id, content: a.content })),
  );
}

/** Creates a risk with its protection actions in one transaction. */
export async function createRisk(
  dreamId: number,
  input: NewRisk,
): Promise<Risk> {
  const title = input.title.trim();
  const actions = input.actions.map((action) => action.trim()).filter(Boolean);
  if (!title || actions.length === 0) {
    throw new Error("A risk needs a title and at least one action.");
  }

  const db = await getDatabase();
  let riskId = 0;

  await db.withTransactionAsync(async () => {
    const inserted = await db.runAsync(
      "INSERT INTO risks (dream_id, title, prompt) VALUES (?, ?, ?)",
      [dreamId, title, input.prompt?.trim() || "If this gets in the way..."],
    );
    riskId = inserted.lastInsertRowId;
    for (const content of actions) {
      await db.runAsync(
        "INSERT INTO risk_actions (risk_id, content) VALUES (?, ?)",
        [riskId, content],
      );
    }
  });

  const risk = await getRiskById(riskId);
  if (!risk) {
    throw new Error("Failed to read back the created risk.");
  }
  return risk;
}

export async function updateRisk(
  id: number,
  patch: { prompt?: string; title?: string },
): Promise<Risk | null> {
  const assignments: string[] = [];
  const params: string[] = [];

  if (patch.title !== undefined) {
    const title = patch.title.trim();
    if (!title) {
      throw new Error("Risk title is required.");
    }
    assignments.push("title = ?");
    params.push(title);
  }
  if (patch.prompt !== undefined) {
    assignments.push("prompt = ?");
    params.push(patch.prompt.trim() || "If this gets in the way...");
  }

  if (assignments.length > 0) {
    const db = await getDatabase();
    await db.runAsync(
      `UPDATE risks SET ${assignments.join(", ")} WHERE id = ?`,
      [...params, id],
    );
  }

  return getRiskById(id);
}

/**
 * Replaces the risk's action list (the edit-mode flow rewrites actions as a
 * whole). Blank entries are dropped; at least one action must remain.
 */
export async function setRiskActions(
  riskId: number,
  contents: readonly string[],
): Promise<Risk | null> {
  const cleaned = contents.map((content) => content.trim()).filter(Boolean);
  if (cleaned.length === 0) {
    throw new Error("A risk always keeps at least one action.");
  }

  const db = await getDatabase();
  await db.withTransactionAsync(async () => {
    await db.runAsync("DELETE FROM risk_actions WHERE risk_id = ?", [riskId]);
    for (const content of cleaned) {
      await db.runAsync(
        "INSERT INTO risk_actions (risk_id, content) VALUES (?, ?)",
        [riskId, content],
      );
    }
  });

  return getRiskById(riskId);
}

export async function deleteRisk(id: number): Promise<boolean> {
  const db = await getDatabase();
  const result = await db.runAsync("DELETE FROM risks WHERE id = ?", [id]);
  return result.changes > 0;
}
