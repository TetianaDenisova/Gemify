import type { SQLiteDatabase } from "expo-sqlite";
import { Platform } from "react-native";

import { SYNC_TABLES, type SyncTableSpec } from "./tables";

/**
 * Everything the sync engine does to the local database lives here: reading
 * what changed, writing back what other devices changed, and the bookkeeping
 * (cursor, tombstones) around both.
 */

export type SyncValue = string | number | null;
export type SyncPayload = Record<string, SyncValue>;

/** A row as it travels to and from the server's generic row store. */
export type RemoteRow = {
  /** The authoring device's clock — what last-write-wins compares. */
  client_updated_at: string;
  data: SyncPayload | null;
  deleted: boolean;
  table_name: string;
  uid: string;
};

export type LocalRow = Record<string, SyncValue>;

/** Columns the triggers own; they never travel to the server. */
const INTERNAL_COLUMNS = new Set(["id", "uid", "updated_at", "sync_dirty"]);

const columnCache = new Map<string, string[]>();

/** ISO 8601 UTC in the shape SQLite's STRFTIME writes, so the two sort alike. */
export function nowIso(): string {
  return new Date().toISOString();
}

/**
 * The columns of `table` that travel with a synced row: everything except the
 * trigger-owned bookkeeping and the device-local photo URIs.
 */
export async function getSyncedColumns(
  db: SQLiteDatabase,
  table: SyncTableSpec,
): Promise<string[]> {
  const cached = columnCache.get(table.name);
  if (cached) return cached;

  const info = await db.getAllAsync<{ name: string }>(
    `PRAGMA table_info(${table.name})`,
  );
  const deviceLocal = new Set((table.photos ?? []).map((it) => it.uriColumn));
  const columns = info
    .map((row) => row.name)
    .filter((name) => !INTERNAL_COLUMNS.has(name) && !deviceLocal.has(name));

  columnCache.set(table.name, columns);
  return columns;
}

/**
 * Runs `task` with the sync triggers muted, inside an exclusive transaction.
 *
 * Rows written while pulling already carry the authoring device's uid and
 * timestamp; letting the triggers restamp them would turn every pulled row
 * into a local edit and bounce it straight back. The exclusive transaction
 * also keeps a screen from slipping an untracked write in between.
 *
 * Web takes the plain transaction instead: expo-sqlite implements
 * `withExclusiveTransactionAsync` by opening a second connection, which the
 * wasm build has no way to do, so it throws outright there. Nothing is lost —
 * the exclusive variant exists to fence off *other connections*, and on web
 * there is only ever the one, driven by a single JavaScript thread.
 */
export async function withSyncApply(
  db: SQLiteDatabase,
  task: (txn: SQLiteDatabase) => Promise<void>,
): Promise<void> {
  const apply = async (txn: SQLiteDatabase) => {
    await txn.runAsync(
      "INSERT OR REPLACE INTO sync_state (key, value) VALUES ('applying', '1')",
    );
    try {
      await task(txn);
    } finally {
      await txn.runAsync("DELETE FROM sync_state WHERE key = 'applying'");
    }
  };

  if (Platform.OS === "web") {
    await db.withTransactionAsync(() => apply(db));
    return;
  }

  await db.withExclusiveTransactionAsync((txn) =>
    apply(txn as unknown as SQLiteDatabase),
  );
}

export async function getSyncValue(
  db: SQLiteDatabase,
  key: string,
): Promise<string | null> {
  const row = await db.getFirstAsync<{ value: string | null }>(
    "SELECT value FROM sync_state WHERE key = ?",
    [key],
  );
  return row?.value ?? null;
}

export async function setSyncValue(
  db: SQLiteDatabase,
  key: string,
  value: string | null,
): Promise<void> {
  await db.runAsync(
    "INSERT OR REPLACE INTO sync_state (key, value) VALUES (?, ?)",
    [key, value],
  );
}

// ---------------------------------------------------------------------------
// Local id <-> uid
// ---------------------------------------------------------------------------

/** Per-run memo so a busy parent (one dream, many quests) is looked up once. */
export type UidCache = Map<string, string | number | null>;

export function createUidCache(): UidCache {
  return new Map();
}

export async function uidForLocalId(
  db: SQLiteDatabase,
  tableName: string,
  id: number,
  cache: UidCache,
): Promise<string | null> {
  const key = `uid:${tableName}:${id}`;
  const hit = cache.get(key);
  if (hit !== undefined) return hit as string | null;

  const row = await db.getFirstAsync<{ uid: string | null }>(
    `SELECT uid FROM ${tableName} WHERE id = ?`,
    [id],
  );
  const uid = row?.uid ?? null;
  cache.set(key, uid);
  return uid;
}

export async function localIdForUid(
  db: SQLiteDatabase,
  tableName: string,
  uid: string,
  cache: UidCache,
): Promise<number | null> {
  const key = `id:${tableName}:${uid}`;
  const hit = cache.get(key);
  if (hit !== undefined) return hit as number | null;

  const row = await db.getFirstAsync<{ id: number }>(
    `SELECT id FROM ${tableName} WHERE uid = ?`,
    [uid],
  );
  const id = row?.id ?? null;
  cache.set(key, id);
  return id;
}

// ---------------------------------------------------------------------------
// Reading local changes (push side)
// ---------------------------------------------------------------------------

export async function readDirtyRows(
  db: SQLiteDatabase,
  table: SyncTableSpec,
): Promise<LocalRow[]> {
  return db.getAllAsync<LocalRow>(
    `SELECT * FROM ${table.name} WHERE sync_dirty = 1`,
  );
}

/**
 * Turns a local row into the payload the server stores: foreign keys become
 * the parent's uid, because row ids are per-device. Returns null when a
 * parent has no uid yet — the row waits for the next sync rather than
 * uploading a dangling reference.
 */
export async function toRemoteRow(
  db: SQLiteDatabase,
  table: SyncTableSpec,
  row: LocalRow,
  cache: UidCache,
): Promise<RemoteRow | null> {
  const uid = row.uid;
  if (typeof uid !== "string" || uid.length === 0) return null;

  const columns = await getSyncedColumns(db, table);
  const data: SyncPayload = {};

  for (const column of columns) {
    const parentTable = table.foreignKeys[column];
    if (!parentTable) {
      data[column] = row[column] ?? null;
      continue;
    }
    const parentId = row[column];
    if (typeof parentId !== "number") return null;
    const parentUid = await uidForLocalId(db, parentTable, parentId, cache);
    if (parentUid === null) return null;
    data[column] = parentUid;
  }

  return {
    client_updated_at:
      typeof row.updated_at === "string" ? row.updated_at : nowIso(),
    data,
    deleted: false,
    table_name: table.name,
    uid,
  };
}

export async function clearDirty(
  db: SQLiteDatabase,
  tableName: string,
  uids: readonly string[],
): Promise<void> {
  if (uids.length === 0) return;

  // Clearing the flag is sync's own bookkeeping, not an edit — muting the
  // triggers keeps it from moving the row's clock and re-dirtying it.
  await withSyncApply(db, async (txn) => {
    for (let index = 0; index < uids.length; index += 400) {
      const chunk = uids.slice(index, index + 400);
      await txn.runAsync(
        `UPDATE ${tableName} SET sync_dirty = 0
         WHERE uid IN (${chunk.map(() => "?").join(", ")})`,
        chunk,
      );
    }
  });
}

export type Tombstone = { deleted_at: string; table_name: string; uid: string };

export async function readTombstones(db: SQLiteDatabase): Promise<Tombstone[]> {
  return db.getAllAsync<Tombstone>(
    "SELECT table_name, uid, deleted_at FROM sync_tombstones",
  );
}

export async function clearTombstones(
  db: SQLiteDatabase,
  tombstones: readonly Tombstone[],
): Promise<void> {
  for (const tombstone of tombstones) {
    await db.runAsync(
      "DELETE FROM sync_tombstones WHERE table_name = ? AND uid = ?",
      [tombstone.table_name, tombstone.uid],
    );
  }
}

/**
 * Settles the database after a backup import so the restored journey becomes
 * the version other devices receive.
 *
 * The import wipes and rewrites every table with the triggers live, which is
 * what leaves tombstones for the rows it dropped. Rows the backup brought
 * back keep their uid, so their tombstones have to go — otherwise the very
 * next sync would delete what was just restored.
 */
export async function finishRestoreForSync(db: SQLiteDatabase): Promise<void> {
  const stamp = nowIso();
  await withSyncApply(db, async (txn) => {
    for (const table of SYNC_TABLES) {
      await txn.runAsync(
        `UPDATE ${table.name} SET updated_at = ?, sync_dirty = 1`,
        [stamp],
      );
      await txn.runAsync(
        `DELETE FROM sync_tombstones
         WHERE table_name = ? AND uid IN (SELECT uid FROM ${table.name})`,
        [table.name],
      );
    }
  });
}

/**
 * Re-marks every synced row as unpushed. Used when the app signs into a
 * different account than the one this database was last synced with, so the
 * local journey is uploaded to the new account instead of silently diverging.
 */
export async function markEverythingDirty(db: SQLiteDatabase): Promise<void> {
  await withSyncApply(db, async (txn) => {
    for (const table of SYNC_TABLES) {
      await txn.runAsync(`UPDATE ${table.name} SET sync_dirty = 1`);
    }
  });
}

// ---------------------------------------------------------------------------
// Writing remote changes (pull side)
// ---------------------------------------------------------------------------

export type ApplyStats = { applied: number; orphaned: number; skipped: number };

type ApplyOutcome = "applied" | "orphaned" | "skipped";

/**
 * Writes pulled rows into the local database, parents before children, with
 * the sync triggers muted for the whole batch.
 *
 * A row wins over the local copy only when the authoring device stamped it
 * later — the same last-write-wins rule the server applies, so both sides
 * settle on the same value. Rows whose parent is gone (deleted on the other
 * device) are dropped.
 */
export async function applyPulledRows(
  db: SQLiteDatabase,
  rows: readonly RemoteRow[],
): Promise<ApplyStats> {
  const stats: ApplyStats = { applied: 0, orphaned: 0, skipped: 0 };
  if (rows.length === 0) return stats;

  const byTable = new Map<string, RemoteRow[]>();
  for (const row of rows) {
    const bucket = byTable.get(row.table_name);
    if (bucket) bucket.push(row);
    else byTable.set(row.table_name, [row]);
  }

  await withSyncApply(db, async (txn) => {
    const cache = createUidCache();
    const orphans: { row: RemoteRow; table: SyncTableSpec }[] = [];

    for (const table of SYNC_TABLES) {
      for (const row of byTable.get(table.name) ?? []) {
        const outcome = await applyRow(txn, table, row, cache);
        if (outcome === "orphaned") orphans.push({ row, table });
        else stats[outcome] += 1;
      }
    }

    // One retry: a parent may have been created by an earlier row in the same
    // batch after the cache recorded it as missing. Anything still orphaned
    // has genuinely lost its parent, and goes no further.
    for (const { row, table } of orphans) {
      cache.clear();
      stats[await applyRow(txn, table, row, cache)] += 1;
    }
  });

  return stats;
}

async function applyRow(
  txn: SQLiteDatabase,
  table: SyncTableSpec,
  remote: RemoteRow,
  cache: UidCache,
): Promise<ApplyOutcome> {
  const existing = await txn.getFirstAsync<{ updated_at: string | null }>(
    `SELECT updated_at FROM ${table.name} WHERE uid = ?`,
    [remote.uid],
  );

  if (remote.deleted) {
    if (existing) {
      await txn.runAsync(`DELETE FROM ${table.name} WHERE uid = ?`, [
        remote.uid,
      ]);
    }
    await txn.runAsync(
      "DELETE FROM sync_tombstones WHERE table_name = ? AND uid = ?",
      [table.name, remote.uid],
    );
    return "applied";
  }

  if (existing && (existing.updated_at ?? "") >= remote.client_updated_at) {
    return "skipped";
  }

  const data = remote.data ?? {};
  const columns = await getSyncedColumns(txn, table);
  const assignments: string[] = [];
  const values: SyncValue[] = [];

  // Only columns the sender actually knows about are written, so a device on
  // an older app version cannot blank out a column it has never heard of.
  for (const column of columns) {
    if (!Object.hasOwn(data, column)) continue;

    const parentTable = table.foreignKeys[column];
    if (parentTable) {
      const parentUid = data[column];
      const parentId =
        typeof parentUid === "string"
          ? await localIdForUid(txn, parentTable, parentUid, cache)
          : null;
      if (parentId === null) return "orphaned";
      assignments.push(column);
      values.push(parentId);
      continue;
    }

    assignments.push(column);
    values.push(data[column] ?? null);
  }

  if (assignments.length === 0) return "skipped";

  const resequenced = await resolveSequenceClash(
    txn,
    table,
    remote.uid,
    assignments,
    values,
  );
  // A milestone that had to move now carries a local edit to broadcast, so
  // its clock moves forward too — otherwise the other device discards it.
  const updatedAt = resequenced ? nowIso() : remote.client_updated_at;
  const dirty = resequenced ? 1 : 0;

  if (existing) {
    await txn.runAsync(
      `UPDATE ${table.name}
       SET ${assignments.map((column) => `${column} = ?`).join(", ")},
           updated_at = ?, sync_dirty = ?
       WHERE uid = ?`,
      [...values, updatedAt, dirty, remote.uid],
    );
    return "applied";
  }

  const allColumns = [...assignments, "uid", "updated_at", "sync_dirty"];
  await txn.runAsync(
    `INSERT INTO ${table.name} (${allColumns.join(", ")})
     VALUES (${allColumns.map(() => "?").join(", ")})`,
    [...values, remote.uid, updatedAt, dirty],
  );
  return "applied";
}

/**
 * Two devices adding a step to the same dream both call it step N, which the
 * UNIQUE (dream_id, sequence_number) index refuses. Neither step is wrong, so
 * one of them moves to the end of the path instead of being dropped.
 *
 * Which one moves is decided by comparing uids, not by which row arrived —
 * both devices reach the same verdict that way, and the path stops shuffling
 * after one exchange. Deciding it locally ("the incoming one always moves")
 * would have each device push the other's step back down forever.
 *
 * Returns true when it is the incoming row that had to move.
 */
async function resolveSequenceClash(
  txn: SQLiteDatabase,
  table: SyncTableSpec,
  uid: string,
  columns: readonly string[],
  values: SyncValue[],
): Promise<boolean> {
  if (table.name !== "milestones") return false;

  const dreamIndex = columns.indexOf("dream_id");
  const sequenceIndex = columns.indexOf("sequence_number");
  if (dreamIndex < 0 || sequenceIndex < 0) return false;

  const dreamId = values[dreamIndex];
  const clash = await txn.getFirstAsync<{ id: number; uid: string }>(
    `SELECT id, uid FROM milestones
     WHERE dream_id = ? AND sequence_number = ? AND uid IS NOT ?`,
    [dreamId, values[sequenceIndex], uid],
  );
  if (!clash) return false;

  const last = await txn.getFirstAsync<{ next: number }>(
    `SELECT COALESCE(MAX(sequence_number), -1) + 1 AS next
     FROM milestones WHERE dream_id = ?`,
    [dreamId],
  );
  const next = last?.next ?? 0;

  if (uid < clash.uid) {
    // The incoming step owns the slot; the one already here steps aside and
    // carries that move to the other devices.
    await txn.runAsync(
      `UPDATE milestones
       SET sequence_number = ?, updated_at = ?, sync_dirty = 1
       WHERE id = ?`,
      [next, nowIso(), clash.id],
    );
    return false;
  }

  values[sequenceIndex] = next;
  return true;
}
