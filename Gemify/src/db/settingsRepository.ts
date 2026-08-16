import { getDatabase } from "./database";

/** Well-known settings keys (free-form keys are also allowed). */
export const SETTING_KEYS = {
  displayName: "display_name",
  homeSubtitle: "home_subtitle",
} as const;

/** Returns the stored value, or null when the key has never been set. */
export async function getSetting(key: string): Promise<string | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ value: string }>(
    "SELECT value FROM settings WHERE key = ?",
    [key],
  );
  return row?.value ?? null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO settings (key, value) VALUES (?, ?)
     ON CONFLICT (key) DO UPDATE SET
       value = excluded.value,
       updated_at = STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now')`,
    [key, value],
  );
}

export async function deleteSetting(key: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync("DELETE FROM settings WHERE key = ?", [key]);
}
