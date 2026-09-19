import { getDatabase } from "./database";

/**
 * The completion date the Progress banner last showed for a dream.
 *
 * Device-local and derived: the projection is recomputed from the dream's
 * quests on every refresh (src/domain/forecast.ts), and this row only exists
 * so the date the user already read stays put unless the estimate really
 * moved. Nothing here syncs, and nothing here is worth backing up.
 */

type ForecastRow = {
  projected_on: string;
};

/** The stored projection (YYYY-MM-DD), or null when there is none yet. */
export async function getForecastProjection(
  dreamId: number,
): Promise<string | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<ForecastRow>(
    `SELECT projected_on FROM forecast_cache WHERE dream_id = ?`,
    [dreamId],
  );
  return row?.projected_on ?? null;
}

/** Stores the shown projection; `null` forgets it (nothing to show). */
export async function saveForecastProjection(
  dreamId: number,
  projectedOn: string | null,
): Promise<void> {
  const db = await getDatabase();
  if (projectedOn === null) {
    await db.runAsync(`DELETE FROM forecast_cache WHERE dream_id = ?`, [
      dreamId,
    ]);
    return;
  }
  await db.runAsync(
    `INSERT INTO forecast_cache (dream_id, projected_on, computed_at)
       VALUES (?, ?, STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now'))
     ON CONFLICT (dream_id) DO UPDATE
       SET projected_on = excluded.projected_on,
           computed_at = excluded.computed_at`,
    [dreamId, projectedOn],
  );
}
