import { getDatabase } from "./database";
import type { MilestoneReward } from "./types";

type RewardRow = {
  id: number;
  milestone_id: number;
  dream_id: number;
  milestone_title: string;
  reward_name: string;
  awarded_at: string;
  collected_at: string | null;
};

function toReward(row: RewardRow): MilestoneReward {
  return {
    id: row.id,
    milestoneId: row.milestone_id,
    dreamId: row.dream_id,
    milestoneTitle: row.milestone_title,
    rewardName: row.reward_name,
    awardedAt: row.awarded_at,
    collectedAt: row.collected_at,
  };
}

/** Completes a milestone and records its configured reward exactly once. */
export async function completeMilestone(id: number): Promise<void> {
  const db = await getDatabase();
  await db.withTransactionAsync(async () => {
    await db.runAsync("UPDATE milestones SET status = 'completed' WHERE id = ?", [id]);
    await db.runAsync(
      `INSERT OR IGNORE INTO milestone_rewards
         (milestone_id, dream_id, milestone_title, reward_name)
       SELECT id, dream_id, title, trim(reward)
       FROM milestones
       WHERE id = ? AND reward IS NOT NULL AND length(trim(reward)) > 0`,
      [id],
    );
  });
}

export async function getRewardsByDream(
  dreamId: number,
): Promise<MilestoneReward[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<RewardRow>(
    `SELECT id, milestone_id, dream_id, milestone_title, reward_name,
            awarded_at, collected_at
     FROM milestone_rewards
     WHERE dream_id = ?
     ORDER BY awarded_at DESC, id DESC`,
    [dreamId],
  );
  return rows.map(toReward);
}

export async function collectReward(
  id: number,
): Promise<MilestoneReward | null> {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE milestone_rewards
     SET collected_at = COALESCE(collected_at, STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now'))
     WHERE id = ?`,
    [id],
  );
  const row = await db.getFirstAsync<RewardRow>(
    `SELECT id, milestone_id, dream_id, milestone_title, reward_name,
            awarded_at, collected_at
     FROM milestone_rewards WHERE id = ?`,
    [id],
  );
  return row ? toReward(row) : null;
}
