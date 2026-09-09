import type { SupabaseClient } from "@supabase/supabase-js";
import type { SQLiteDatabase } from "expo-sqlite";

import { getDatabase } from "@/db";

import { PAGE_SIZE, SYNC_TABLE } from "./config";
import {
  applyPulledRows,
  clearDirty,
  clearTombstones,
  createUidCache,
  getSyncValue,
  markEverythingDirty,
  nowIso,
  readDirtyRows,
  readTombstones,
  setSyncValue,
  toRemoteRow,
  type RemoteRow,
} from "./localStore";
import { notifySyncApplied } from "./events";
import { downloadMissingPhotos, uploadRowPhotos } from "./photos";
import { getSupabase } from "./supabase";
import { SYNC_TABLES, SYNC_TABLES_BY_NAME } from "./tables";

/**
 * One sync pass: push what changed here, pull what changed elsewhere, then
 * fetch the photo files the pulled rows point at.
 *
 * Conflicts are settled per row by last-write-wins on the authoring device's
 * clock, on both sides of the wire — the server refuses an older write, and
 * `applyPulledRows` refuses an older read — so two devices editing different
 * things never overwrite each other, and two devices editing the same field
 * settle on the later edit.
 */

export type SyncResult = {
  /** Photo files fetched from storage. */
  downloaded: number;
  /** Rows from other devices written locally. */
  pulled: number;
  /** Local rows (and deletions) sent to the server. */
  pushed: number;
};

/** Cursor for the pull: the newest server timestamp already seen. */
const CURSOR_KEY = "last_pulled_at";
const ACCOUNT_KEY = "remote_user_id";
const LAST_SYNC_KEY = "last_synced_at";
const EPOCH = "1970-01-01T00:00:00Z";

let inFlight: Promise<SyncResult> | null = null;

/** Runs a sync, or joins the one already running. */
export function runSync(): Promise<SyncResult> {
  if (!inFlight) {
    inFlight = syncOnce().finally(() => {
      inFlight = null;
    });
  }
  return inFlight;
}

async function syncOnce(): Promise<SyncResult> {
  const supabase = getSupabase();
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;

  const userId = data.session?.user.id;
  if (!userId) {
    throw new Error("Sign in to sync this device.");
  }

  const db = await getDatabase();
  await adoptAccount(db, userId);

  const pushed = await pushChanges(db, supabase, userId);
  const pulled = await pullChanges(db, supabase, userId);
  const downloaded = await downloadMissingPhotos(db);

  await setSyncValue(db, LAST_SYNC_KEY, nowIso());
  if (pulled > 0 || downloaded > 0) notifySyncApplied();

  return { downloaded, pulled, pushed };
}

/** When this device last completed a sync, for the settings screen. */
export async function getLastSyncedAt(): Promise<string | null> {
  const db = await getDatabase();
  return getSyncValue(db, LAST_SYNC_KEY);
}

/**
 * Signing into a different account than this database last synced with makes
 * every local row unsent again, so the journey on this device is uploaded to
 * the new account rather than quietly drifting apart from it.
 */
async function adoptAccount(
  db: SQLiteDatabase,
  userId: string,
): Promise<void> {
  const previous = await getSyncValue(db, ACCOUNT_KEY);
  if (previous === userId) return;

  if (previous !== null) {
    await markEverythingDirty(db);
    await setSyncValue(db, CURSOR_KEY, null);
  }
  await setSyncValue(db, ACCOUNT_KEY, userId);
}

// ---------------------------------------------------------------------------
// Push
// ---------------------------------------------------------------------------

async function pushChanges(
  db: SQLiteDatabase,
  supabase: SupabaseClient,
  userId: string,
): Promise<number> {
  const cache = createUidCache();
  let pushed = 0;

  for (const table of SYNC_TABLES) {
    const rows = await readDirtyRows(db, table);
    if (rows.length === 0) continue;

    const payload: RemoteRow[] = [];
    for (const row of rows) {
      // Uploading first means the storage key is already on the row when it
      // is serialised, so a photo and its row travel together.
      await uploadRowPhotos(db, table, row, userId);
      const remote = await toRemoteRow(db, table, row, cache);
      if (remote) payload.push(remote);
    }

    for (let index = 0; index < payload.length; index += PAGE_SIZE) {
      const chunk = payload.slice(index, index + PAGE_SIZE);
      await upsertRows(supabase, chunk, userId);
      await clearDirty(
        db,
        table.name,
        chunk.map((row) => row.uid),
      );
      pushed += chunk.length;
    }
  }

  return pushed + (await pushDeletions(db, supabase, userId));
}

async function pushDeletions(
  db: SQLiteDatabase,
  supabase: SupabaseClient,
  userId: string,
): Promise<number> {
  const tombstones = await readTombstones(db);
  if (tombstones.length === 0) return 0;

  const payload: RemoteRow[] = tombstones.map((tombstone) => ({
    client_updated_at: tombstone.deleted_at,
    data: null,
    deleted: true,
    table_name: tombstone.table_name,
    uid: tombstone.uid,
  }));

  for (let index = 0; index < payload.length; index += PAGE_SIZE) {
    await upsertRows(supabase, payload.slice(index, index + PAGE_SIZE), userId);
  }
  await clearTombstones(db, tombstones);

  return payload.length;
}

async function upsertRows(
  supabase: SupabaseClient,
  rows: readonly RemoteRow[],
  userId: string,
): Promise<void> {
  const { error } = await supabase.from(SYNC_TABLE).upsert(
    rows.map((row) => ({ ...row, user_id: userId })),
    { onConflict: "user_id,table_name,uid" },
  );
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Pull
// ---------------------------------------------------------------------------

type PulledRow = RemoteRow & { server_updated_at: string };

async function pullChanges(
  db: SQLiteDatabase,
  supabase: SupabaseClient,
  userId: string,
): Promise<number> {
  const cursor = (await getSyncValue(db, CURSOR_KEY)) ?? EPOCH;
  const rows: RemoteRow[] = [];

  let newest = cursor;
  /** Oldest row this app version cannot store yet; the cursor stops there. */
  let unknown: string | null = null;

  for (let offset = 0; ; offset += PAGE_SIZE) {
    const { data, error } = await supabase
      .from(SYNC_TABLE)
      .select(
        "table_name, uid, data, deleted, client_updated_at, server_updated_at",
      )
      .eq("user_id", userId)
      .gte("server_updated_at", cursor)
      .order("server_updated_at", { ascending: true })
      .order("table_name", { ascending: true })
      .order("uid", { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1);

    if (error) throw error;
    const page = (data ?? []) as PulledRow[];
    if (page.length === 0) break;

    for (const row of page) {
      if (!SYNC_TABLES_BY_NAME.has(row.table_name)) {
        // Written by a device on a newer app version. Leaving the cursor
        // behind it means the row is picked up after this app updates,
        // instead of being skipped forever.
        if (unknown === null || isBefore(row.server_updated_at, unknown)) {
          unknown = row.server_updated_at;
        }
        continue;
      }
      if (isBefore(newest, row.server_updated_at)) {
        newest = row.server_updated_at;
      }
      rows.push(row);
    }

    if (page.length < PAGE_SIZE) break;
  }

  const stats = await applyPulledRows(db, rows);
  await setSyncValue(
    db,
    CURSOR_KEY,
    unknown !== null && isBefore(unknown, newest) ? unknown : newest,
  );

  return stats.applied;
}

/** Timestamp order by value, not by string shape — offsets may differ. */
function isBefore(left: string, right: string): boolean {
  return Date.parse(left) < Date.parse(right);
}
