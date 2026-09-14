import {
  deleteDatabaseAsync,
  openDatabaseAsync,
  type SQLiteDatabase,
  type SQLiteStatement,
} from "expo-sqlite";
import { Platform } from "react-native";

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

/**
 * Runs `task` on a prepared statement and finalizes it, without letting a
 * failed finalize hide the error that caused it.
 */
async function withStatement<T>(
  db: SQLiteDatabase,
  source: string,
  task: (statement: SQLiteStatement) => Promise<T>,
): Promise<T> {
  const statement = await db.prepareAsync(source);
  let result: T;
  try {
    result = await task(statement);
  } catch (error) {
    await statement.finalizeAsync().catch(() => undefined);
    throw error;
  }
  await statement.finalizeAsync();
  return result;
}

/**
 * expo-sqlite finalizes statements in a `finally`. On web, finalizing a
 * statement whose step failed throws as well, and that second error replaces
 * the real one — a "FOREIGN KEY constraint failed" reaches the app as a bare
 * "Error finalizing statement". These replacements keep the original error.
 */
function preserveStatementErrors(db: SQLiteDatabase): void {
  // Variadic bind params, exactly as the replaced methods accept them.
  type Params = Parameters<SQLiteStatement["executeAsync"]>;
  const target = db as unknown as {
    getAllAsync: (source: string, ...params: Params) => Promise<unknown[]>;
    getFirstAsync: (source: string, ...params: Params) => Promise<unknown>;
    runAsync: (source: string, ...params: Params) => Promise<unknown>;
  };

  target.runAsync = (source, ...params) =>
    withStatement(db, source, (statement) =>
      statement.executeAsync(...params),
    );
  target.getFirstAsync = (source, ...params) =>
    withStatement(db, source, async (statement) =>
      (await statement.executeAsync(...params)).getFirstAsync(),
    );
  target.getAllAsync = (source, ...params) =>
    withStatement(db, source, async (statement) =>
      (await statement.executeAsync(...params)).getAllAsync(),
    );
}

async function openAndMigrate(): Promise<SQLiteDatabase> {
  const db = await openDatabaseAsync(DATABASE_NAME);
  if (Platform.OS === "web") {
    preserveStatementErrors(db);
  }
  await db.execAsync("PRAGMA journal_mode = WAL;");
  await db.execAsync("PRAGMA foreign_keys = ON;");
  // Cloud sync leans on triggers to stamp rows; recursive triggers make ON
  // DELETE CASCADE leave tombstones for the children it removes too.
  await db.execAsync("PRAGMA recursive_triggers = ON;");
  await migrate(db);
  // A sync interrupted mid-apply (app killed, transaction rolled back) can
  // never leave the marker behind, but clearing it on open makes that
  // impossible rather than merely unlikely — with it set, every sync trigger
  // stays silent and local edits would stop being tracked.
  await db.execAsync("DELETE FROM sync_state WHERE key = 'applying';");
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
