import { Platform } from "react-native";

import { getDatabase } from "./database";
import { LATEST_SCHEMA_VERSION } from "./migrations";

/**
 * Full-database backup as a single JSON file. Export dumps every user table
 * (plus memory photos, embedded as base64 so they survive reinstalls) and
 * hands the file to the system share sheet. Import picks a backup file and
 * replaces the entire database contents with it — original row ids are kept,
 * so foreign keys need no remapping.
 */

/** Row order respects foreign keys: parents first. Deletes run reversed. */
const BACKUP_TABLES = [
  "settings",
  "dreams",
  "feeling_states",
  "dream_feeling_states",
  "milestones",
  "quests",
  "ideas",
  "habits",
  "habit_schedule_days",
  "habit_detail_entries",
  "habit_completions",
  "habit_detail_checks",
  "time_blocks",
  "time_block_actions",
  "action_completions",
  "risks",
  "risk_actions",
  "timeline_moments",
  "timeline_moment_photos",
] as const;

/** Marks a photo row whose file travels in the backup's `photos` list. */
const PHOTO_URI_PREFIX = "backup-photo:";

/** Subdirectory of the document directory holding memory photos. */
const PHOTO_DIR = "memories";

type Row = Record<string, string | number | null>;

export type BackupDocument = {
  app: "gemify";
  schemaVersion: number;
  exportedAt: string;
  tables: Record<string, Row[]>;
  photos: { name: string; base64: string }[];
};

export type ImportSummary = {
  dreams: number;
  habits: number;
  moments: number;
  quests: number;
};

type BackupUpgrade = {
  /** The backup schema version after this upgrade runs. */
  toVersion: number;
  up: (doc: BackupDocument) => void;
};

/**
 * JSON-side mirror of the SQL migrations: lets an older backup file be
 * imported into a newer app. When adding SQL migration N, append an entry
 * here that reshapes a version N-1 backup document into version N.
 */
const backupUpgrades: BackupUpgrade[] = [
  {
    // v4 added tasks.is_planned; older backups predate the flag, so mirror
    // the migration default (1 = keep every task visible on the board).
    toVersion: 4,
    up: (doc) => {
      for (const row of doc.tables.tasks ?? []) {
        if (row.is_planned === undefined) row.is_planned = 1;
      }
    },
  },
  {
    // v5 moved habits.time_of_day into time_block_key (and added the per-day
    // habit_detail_checks table, which is simply absent in older backups).
    toVersion: 5,
    up: (doc) => {
      for (const row of doc.tables.habits ?? []) {
        if (row.time_block_key === undefined) {
          row.time_block_key = row.time_of_day ?? null;
        }
      }
    },
  },
  {
    // v6 mapped legacy time-of-day values onto the seeded My Day block keys
    // (only when the backup actually carries that block).
    toVersion: 6,
    up: (doc) => {
      const remap: Record<string, string> = {
        morning: "wake-up",
        after_lunch: "day",
      };
      const blockKeys = new Set(
        (doc.tables.time_blocks ?? []).map((row) => row.key),
      );
      for (const row of doc.tables.habits ?? []) {
        const key = row.time_block_key;
        if (typeof key === "string" && remap[key] && blockKeys.has(remap[key])) {
          row.time_block_key = remap[key];
        }
      }
    },
  },
  {
    // v7 added dreams.photo_uri; older backups have no vision image.
    toVersion: 7,
    up: (doc) => {
      for (const row of doc.tables.dreams ?? []) {
        if (row.photo_uri === undefined) row.photo_uri = null;
      }
    },
  },
  {
    // v8 added milestones.photo_uri; older backups have no step images.
    toVersion: 8,
    up: (doc) => {
      for (const row of doc.tables.milestones ?? []) {
        if (row.photo_uri === undefined) row.photo_uri = null;
      }
    },
  },
  {
    // v9 added quests.is_done; older backups predate manual quest checks.
    toVersion: 9,
    up: (doc) => {
      for (const row of doc.tables.quests ?? []) {
        if (row.is_done === undefined) row.is_done = 0;
      }
    },
  },
  {
    // v10 folded the tasks layer into quests: every task becomes its own
    // quest under its parent's milestone, former container quests are
    // dropped, and quests carry the scheduling columns.
    toVersion: 10,
    up: (doc) => {
      const quests = doc.tables.quests ?? [];
      const tasks = doc.tables.tasks ?? [];
      const questById = new Map(quests.map((row) => [row.id, row]));
      const containerIds = new Set(tasks.map((row) => row.quest_id));

      let nextId =
        quests.reduce((max, row) => Math.max(max, Number(row.id) || 0), 0) + 1;

      const survivors = quests
        .filter((row) => !containerIds.has(row.id))
        .map((row) => ({
          scheduled_date: null,
          scheduled_time: null,
          is_planned: 0,
          completed_at: null,
          ...row,
        }));

      const converted: typeof quests = [];
      for (const task of tasks) {
        const parent = questById.get(task.quest_id);
        if (!parent) continue;
        const row: Row = {
          id: nextId++,
          milestone_id: parent.milestone_id,
          title: task.title,
          is_active: parent.is_active ?? 1,
          is_done: task.is_done ?? 0,
          scheduled_date: task.scheduled_date ?? null,
          scheduled_time: task.scheduled_time ?? null,
          is_planned: task.is_planned ?? 1,
          completed_at: task.completed_at ?? null,
        };
        // created_at is NOT NULL with a default — omit rather than insert null.
        if (parent.created_at != null) row.created_at = parent.created_at;
        converted.push(row);
      }

      doc.tables.quests = [...survivors, ...converted];
      delete doc.tables.tasks;
    },
  },
  {
    // v12 added the dream photo framing (focus point + zoom); older backups
    // show the image centered at cover scale, matching the old rendering.
    // (v11 only dropped the leftover demo table — nothing to reshape.)
    toVersion: 12,
    up: (doc) => {
      for (const row of doc.tables.dreams ?? []) {
        if (row.photo_focus_x === undefined) row.photo_focus_x = 0.5;
        if (row.photo_focus_y === undefined) row.photo_focus_y = 0.5;
        if (row.photo_scale === undefined) row.photo_scale = 1;
      }
    },
  },
];

// ---------------------------------------------------------------------------
// Export

async function buildBackupDocument(): Promise<BackupDocument> {
  const db = await getDatabase();

  const tables: Record<string, Row[]> = {};
  for (const table of BACKUP_TABLES) {
    tables[table] = await db.getAllAsync<Row>(`SELECT * FROM ${table}`);
  }

  // On web the picker stores photos as self-contained data URIs, so only
  // native file:// photos need to be bundled alongside the rows.
  const photos: BackupDocument["photos"] = [];
  if (Platform.OS !== "web") {
    const { File } = await import("expo-file-system");
    const embedPhoto = async (uri: unknown): Promise<string | null> => {
      if (typeof uri !== "string" || !uri.startsWith("file:")) return null;
      try {
        const file = new File(uri);
        if (!file.exists) return null;
        const name = uri.split("/").pop() ?? "";
        if (!name) return null;
        photos.push({ name, base64: await file.base64() });
        return PHOTO_URI_PREFIX + name;
      } catch {
        // A photo that can't be read is dropped; its owner row survives.
        return null;
      }
    };

    for (const row of tables.timeline_moment_photos) {
      const marker = await embedPhoto(row.uri);
      if (marker) row.uri = marker;
    }
    // Dream vision and milestone step images travel like memory photos.
    for (const row of [...tables.dreams, ...tables.milestones]) {
      const marker = await embedPhoto(row.photo_uri);
      if (marker) row.photo_uri = marker;
    }
  }

  return {
    app: "gemify",
    schemaVersion: LATEST_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    tables,
    photos,
  };
}

/**
 * Builds the backup file and hands it off: the system share sheet on native
 * (save to Files / Drive / send anywhere), a plain download on web.
 */
export async function exportBackup(): Promise<void> {
  const document = await buildBackupDocument();
  const json = JSON.stringify(document);
  const fileName = `gemify-backup-${document.exportedAt.slice(0, 10)}.json`;

  if (Platform.OS === "web") {
    const dom = globalThis as unknown as {
      document: {
        createElement: (tag: string) => {
          href: string;
          download: string;
          click: () => void;
        };
      };
      Blob: new (parts: string[], options: { type: string }) => unknown;
      URL: {
        createObjectURL: (blob: unknown) => string;
        revokeObjectURL: (url: string) => void;
      };
    };
    const blob = new dom.Blob([json], { type: "application/json" });
    const url = dom.URL.createObjectURL(blob);
    const anchor = dom.document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    dom.URL.revokeObjectURL(url);
    return;
  }

  const { File, Paths } = await import("expo-file-system");
  const Sharing = await import("expo-sharing");

  const file = new File(Paths.cache, fileName);
  if (file.exists) file.delete();
  file.create();
  file.write(json);

  await Sharing.shareAsync(file.uri, {
    mimeType: "application/json",
    UTI: "public.json",
    dialogTitle: "Save Gemify backup",
  });
}

// ---------------------------------------------------------------------------
// Import

/**
 * Opens the system file picker and, if the user selects a valid backup,
 * replaces the entire database contents with it. Returns null when the picker
 * is cancelled; throws with a readable message for invalid files.
 */
export async function pickAndImportBackup(): Promise<ImportSummary | null> {
  const DocumentPicker = await import("expo-document-picker");
  const result = await DocumentPicker.getDocumentAsync({
    // Broad list: files saved through messengers/drive often lose their
    // JSON mime type and would be greyed out with a strict filter.
    type: ["application/json", "text/*", "application/octet-stream"],
    copyToCacheDirectory: true,
    multiple: false,
  });
  if (result.canceled) return null;

  const asset = result.assets[0];
  let json: string;
  if (Platform.OS === "web") {
    json = asset.file
      ? await asset.file.text()
      : await (await fetch(asset.uri)).text();
  } else {
    const { File } = await import("expo-file-system");
    json = await new File(asset.uri).text();
  }

  const document = parseBackupDocument(json);
  await restoreBackup(document);

  return {
    dreams: document.tables.dreams?.length ?? 0,
    habits: document.tables.habits?.length ?? 0,
    moments: document.tables.timeline_moments?.length ?? 0,
    quests: document.tables.quests?.length ?? 0,
  };
}

function parseBackupDocument(json: string): BackupDocument {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error("This file is not a Gemify backup (not valid JSON).");
  }

  const document = parsed as BackupDocument;
  if (
    document?.app !== "gemify" ||
    typeof document.schemaVersion !== "number" ||
    typeof document.tables !== "object" ||
    document.tables === null
  ) {
    throw new Error("This file is not a Gemify backup.");
  }

  if (document.schemaVersion > LATEST_SCHEMA_VERSION) {
    throw new Error(
      "This backup was made by a newer app version. Update the app first.",
    );
  }

  let version = document.schemaVersion;
  for (const upgrade of backupUpgrades) {
    if (upgrade.toVersion <= version) continue;
    upgrade.up(document);
    version = upgrade.toVersion;
  }
  if (version !== LATEST_SCHEMA_VERSION) {
    throw new Error(
      `This backup uses schema v${document.schemaVersion}, which this app ` +
        "can no longer import. Re-export it from the app version that made it.",
    );
  }

  return document;
}

async function restoreBackup(document: BackupDocument): Promise<void> {
  const photoUriByName =
    Platform.OS === "web"
      ? new Map<string, string>()
      : await writePhotoFiles(document.photos ?? []);

  const db = await getDatabase();
  await db.withTransactionAsync(async () => {
    for (const table of [...BACKUP_TABLES].reverse()) {
      await db.runAsync(`DELETE FROM ${table}`);
    }

    for (const table of BACKUP_TABLES) {
      for (const row of document.tables[table] ?? []) {
        const resolved =
          table === "timeline_moment_photos"
            ? resolvePhotoUri(row, photoUriByName)
            : table === "dreams" || table === "milestones"
              ? resolveDreamPhoto(row, photoUriByName)
              : row;
        if (!resolved) continue;

        const columns = Object.keys(resolved).filter((column) =>
          /^[a-z_]+$/.test(column),
        );
        if (columns.length === 0) continue;

        await db.runAsync(
          `INSERT INTO ${table} (${columns.join(", ")})
           VALUES (${columns.map(() => "?").join(", ")})`,
          columns.map((column) => resolved[column] ?? null),
        );
      }
    }
  });
}

/** Restores bundled photo files into the memories directory; name → new URI. */
async function writePhotoFiles(
  photos: BackupDocument["photos"],
): Promise<Map<string, string>> {
  const uriByName = new Map<string, string>();
  if (photos.length === 0) return uriByName;

  const { Directory, File, Paths } = await import("expo-file-system");
  const dir = new Directory(Paths.document, PHOTO_DIR);
  if (!dir.exists) dir.create();

  for (const photo of photos) {
    // Names come from the backup file; keep writes confined to the photo dir.
    if (!/^[\w.-]+$/.test(photo.name)) continue;
    try {
      const file = new File(dir, photo.name);
      if (file.exists) file.delete();
      file.create();
      file.write(base64ToBytes(photo.base64));
      uriByName.set(photo.name, file.uri);
    } catch {
      // A photo that fails to restore is dropped; its row is skipped below.
    }
  }
  return uriByName;
}

/**
 * Swaps a dream's or milestone's photo marker back to a real URI. A photo
 * that failed to restore only clears the image — the row itself survives.
 */
function resolveDreamPhoto(
  row: Row,
  photoUriByName: Map<string, string>,
): Row {
  const uri = row.photo_uri;
  if (typeof uri !== "string" || !uri.startsWith(PHOTO_URI_PREFIX)) return row;
  const restored = photoUriByName.get(uri.slice(PHOTO_URI_PREFIX.length));
  return { ...row, photo_uri: restored ?? null };
}

/** Swaps the export-time photo marker back to a real file URI. */
function resolvePhotoUri(
  row: Row,
  photoUriByName: Map<string, string>,
): Row | null {
  const uri = row.uri;
  if (typeof uri !== "string" || !uri.startsWith(PHOTO_URI_PREFIX)) return row;
  const restored = photoUriByName.get(uri.slice(PHOTO_URI_PREFIX.length));
  if (!restored) return null;
  return { ...row, uri: restored };
}

function base64ToBytes(base64: string): Uint8Array {
  const binary = (
    globalThis as unknown as { atob: (data: string) => string }
  ).atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}
