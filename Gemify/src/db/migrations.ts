import type { SQLiteDatabase } from "expo-sqlite";

export type Migration = {
  /** The schema version the database is at after this migration runs. */
  toVersion: number;
  up: (db: SQLiteDatabase) => Promise<void>;
};

/**
 * Ordered schema migrations. To evolve the schema, append a new entry with
 * `toVersion` one higher than the last — never edit or reorder shipped
 * entries, since released apps have already applied them. Each migration runs
 * in its own transaction; the current version is tracked via
 * `PRAGMA user_version`.
 */
export const migrations: Migration[] = [
  {
    toVersion: 1,
    up: async (db) => {
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          description TEXT,
          created_at TEXT NOT NULL DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now')),
          updated_at TEXT NOT NULL DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now'))
        );
      `);
    },
  },
];

export const LATEST_SCHEMA_VERSION = migrations[migrations.length - 1].toVersion;
