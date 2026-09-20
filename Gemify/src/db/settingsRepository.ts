import { getDatabase } from "./database";

/**
 * The `settings` key/value table: small per-device state that is not the
 * user's content — which prompt was last shown on which day, and the like.
 *
 * Deliberately outside `SYNC_TABLES` (see src/sync/tables.ts): a "seen today"
 * flag belongs to the device that showed it, not to the account.
 */

type SettingRow = {
  value: string;
};

export async function getSetting(key: string): Promise<string | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<SettingRow>(
    `SELECT value FROM settings WHERE key = ?`,
    [key],
  );
  return row?.value ?? null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO settings (key, value, updated_at)
       VALUES (?, ?, STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now'))
     ON CONFLICT (key) DO UPDATE
       SET value = excluded.value, updated_at = excluded.updated_at`,
    [key, value],
  );
}
