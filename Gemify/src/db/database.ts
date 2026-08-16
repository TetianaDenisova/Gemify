import {
  deleteDatabaseAsync,
  openDatabaseAsync,
  type SQLiteDatabase,
} from "expo-sqlite";

import { migrations } from "./migrations";

const DATABASE_NAME = "gemify.db";

let databasePromise: Promise<SQLiteDatabase> | null = null;

/**
 * Returns the app's single shared database connection, opening it and running
 * any pending migrations on first call. Safe to call from anywhere — repeated
 * calls reuse the same connection, and a failed open is retried on the next
 * call.
 */
export function getDatabase(): Promise<SQLiteDatabase> {
  if (!databasePromise) {
    databasePromise = openAndMigrate();
    databasePromise.catch(() => {
      databasePromise = null;
    });
  }
  return databasePromise;
}

/**
 * Eagerly opens and migrates the database. Called once at app start so the
 * first screen that touches the database doesn't pay the open/migrate cost.
 */
export async function initDatabase(): Promise<void> {
  await getDatabase();
}

async function openAndMigrate(): Promise<SQLiteDatabase> {
  const db = await openDatabaseAsync(DATABASE_NAME);
  await db.execAsync("PRAGMA journal_mode = WAL;");
  await db.execAsync("PRAGMA foreign_keys = ON;");
  await migrate(db);
  return db;
}

/**
 * Development-only reset: closes the connection, deletes the database file,
 * and re-opens it (which re-runs every migration and re-seeds reference
 * data). Compiled out of production builds via the __DEV__ guard.
 */
export async function resetDatabaseForDev(): Promise<void> {
  if (!__DEV__) {
    throw new Error("resetDatabaseForDev is only available in development.");
  }

  if (databasePromise) {
    try {
      const db = await databasePromise;
      await db.closeAsync();
    } catch {
      // A failed open still leaves no connection worth closing.
    }
    databasePromise = null;
  }

  await deleteDatabaseAsync(DATABASE_NAME);
  await initDatabase();
}

async function migrate(db: SQLiteDatabase): Promise<void> {
  const row = await db.getFirstAsync<{ user_version: number }>(
    "PRAGMA user_version",
  );
  const currentVersion = row?.user_version ?? 0;

  for (const migration of migrations) {
    if (migration.toVersion <= currentVersion) continue;
    await db.withTransactionAsync(async () => {
      await migration.up(db);
      await db.execAsync(`PRAGMA user_version = ${migration.toVersion}`);
    });
  }
}
