import type { SQLiteDatabase } from "expo-sqlite";
import { Platform } from "react-native";

import { PHOTO_BUCKET } from "./config";
import { withSyncApply, type LocalRow } from "./localStore";
import { getSupabase } from "./supabase";
import { SYNC_TABLES, type SyncTableSpec } from "./tables";

/**
 * Photo files travel through Supabase Storage rather than the row store: the
 * row carries only the object key, because the file URI that goes with it is
 * meaningless on any other device.
 *
 * Web is skipped on purpose — there the picker hands back a self-contained
 * data URI that is already stored in the row, and expo-file-system has no web
 * implementation.
 */

/** Same directory the local photo helpers use, so both write one place. */
const PHOTO_DIR = "memories";

const CONTENT_TYPES: Record<string, string> = {
  gif: "image/gif",
  heic: "image/heic",
  jpeg: "image/jpeg",
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

function extensionOf(uri: string): string {
  const tail = uri.split("?")[0].split("/").pop() ?? "";
  const dot = tail.lastIndexOf(".");
  const extension = dot > 0 ? tail.slice(dot + 1).toLowerCase() : "";
  return /^[a-z0-9]{1,5}$/.test(extension) ? extension : "jpg";
}

/** Object name; only has to be unique inside the signed-in user's folder. */
function uniqueName(extension: string): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${extension}`;
}

/**
 * Uploads any photo on `row` that is not in the bucket yet and writes the
 * resulting object key back — into the database and into `row` itself, so the
 * key goes out with the same push that triggered the upload.
 */
export async function uploadRowPhotos(
  db: SQLiteDatabase,
  table: SyncTableSpec,
  row: LocalRow,
  userId: string,
): Promise<void> {
  if (Platform.OS === "web" || !table.photos) return;

  for (const photo of table.photos) {
    const uri = row[photo.uriColumn];
    if (typeof uri !== "string" || uri.length === 0) continue;
    if (typeof row[photo.keyColumn] === "string") continue;

    const key = await uploadPhoto(uri, userId);
    if (!key) continue;

    row[photo.keyColumn] = key;
    await writeSilently(db, table.name, row.uid, photo.keyColumn, key);
  }
}

async function uploadPhoto(
  uri: string,
  userId: string,
): Promise<string | null> {
  const { File } = await import("expo-file-system");
  const file = new File(uri);
  if (!file.exists) return null;

  const extension = extensionOf(uri);
  const key = `${userId}/${uniqueName(extension)}`;
  const { error } = await getSupabase()
    .storage.from(PHOTO_BUCKET)
    .upload(key, await file.arrayBuffer(), {
      contentType: CONTENT_TYPES[extension] ?? "image/jpeg",
      upsert: true,
    });

  if (error) throw error;
  return key;
}

/**
 * Fetches the files behind photo keys this device does not have yet — the
 * other half of a pull. Returns how many files were downloaded.
 *
 * A failed download is swallowed: the row is already correct, and the next
 * sync tries again. Losing the whole sync over one unreachable image would be
 * a worse trade.
 */
export async function downloadMissingPhotos(
  db: SQLiteDatabase,
): Promise<number> {
  if (Platform.OS === "web") return 0;

  let downloaded = 0;
  for (const table of SYNC_TABLES) {
    for (const photo of table.photos ?? []) {
      const rows = await db.getAllAsync<{
        key: string;
        uid: string;
        uri: string | null;
      }>(
        `SELECT uid, ${photo.keyColumn} AS key, ${photo.uriColumn} AS uri
         FROM ${table.name}
         WHERE ${photo.keyColumn} IS NOT NULL`,
      );

      for (const row of rows) {
        try {
          if (await hasLocalFile(row.uri)) continue;
          const uri = await downloadPhoto(row.key);
          if (!uri) continue;
          await writeSilently(db, table.name, row.uid, photo.uriColumn, uri);
          downloaded += 1;
        } catch {
          // Try again next sync rather than failing the whole run.
        }
      }
    }
  }

  return downloaded;
}

async function hasLocalFile(uri: string | null): Promise<boolean> {
  if (typeof uri !== "string" || uri.length === 0) return false;
  const { File } = await import("expo-file-system");
  try {
    return new File(uri).exists;
  } catch {
    return false;
  }
}

async function downloadPhoto(key: string): Promise<string | null> {
  const { data, error } = await getSupabase()
    .storage.from(PHOTO_BUCKET)
    .createSignedUrl(key, 600);
  if (error || !data) return null;

  const { Directory, File, Paths } = await import("expo-file-system");
  const directory = new Directory(Paths.document, PHOTO_DIR);
  if (!directory.exists) directory.create();

  const destination = new File(directory, key.split("/").pop() ?? key);
  const file = await File.downloadFileAsync(data.signedUrl, destination, {
    idempotent: true,
  });
  return file.uri;
}

/**
 * Writes one photo column without disturbing the row's sync bookkeeping.
 * Storage keys and downloaded file paths are sync's own plumbing, not user
 * edits: moving the row's clock for them would let a photo download beat a
 * genuine edit made on the other device.
 */
async function writeSilently(
  db: SQLiteDatabase,
  tableName: string,
  uid: unknown,
  column: string,
  value: string,
): Promise<void> {
  if (typeof uid !== "string") return;
  await withSyncApply(db, async (txn) => {
    await txn.runAsync(
      `UPDATE ${tableName} SET ${column} = ? WHERE uid = ?`,
      [value, uid],
    );
  });
}
