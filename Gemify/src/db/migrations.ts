import type { SQLiteDatabase } from "expo-sqlite";

import { FEELING_STATE_LABELS, TIME_BLOCK_SEEDS } from "./seeds";

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
  {
    // Domain schema per DATABASE_SCHEMA_PROPOSAL.md (revision 3).
    toVersion: 2,
    up: async (db) => {
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS settings (
          key        TEXT PRIMARY KEY,
          value      TEXT NOT NULL,
          updated_at TEXT NOT NULL DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now'))
        );

        CREATE TABLE IF NOT EXISTS dreams (
          id               INTEGER PRIMARY KEY AUTOINCREMENT,
          seed_key         TEXT UNIQUE,
          title            TEXT NOT NULL CHECK (length(trim(title)) > 0),
          vision_statement TEXT,
          is_archived      INTEGER NOT NULL DEFAULT 0 CHECK (is_archived IN (0, 1))
        );

        CREATE TABLE IF NOT EXISTS feeling_states (
          id    INTEGER PRIMARY KEY AUTOINCREMENT,
          label TEXT NOT NULL UNIQUE COLLATE NOCASE
        );

        CREATE TABLE IF NOT EXISTS dream_feeling_states (
          dream_id INTEGER NOT NULL REFERENCES dreams(id) ON DELETE CASCADE,
          state_id INTEGER NOT NULL REFERENCES feeling_states(id) ON DELETE CASCADE,
          PRIMARY KEY (dream_id, state_id)
        );

        CREATE TABLE IF NOT EXISTS milestones (
          id              INTEGER PRIMARY KEY AUTOINCREMENT,
          dream_id        INTEGER NOT NULL REFERENCES dreams(id) ON DELETE CASCADE,
          sequence_number INTEGER NOT NULL,
          title           TEXT NOT NULL CHECK (length(trim(title)) > 0),
          state           TEXT,
          artifact        TEXT,
          mentor          TEXT,
          reward          TEXT,
          status          TEXT NOT NULL DEFAULT 'active'
                            CHECK (status IN ('active', 'completed')),
          UNIQUE (dream_id, sequence_number)
        );
        CREATE INDEX IF NOT EXISTS idx_milestones_dream
          ON milestones (dream_id, sequence_number);

        CREATE TABLE IF NOT EXISTS quests (
          id           INTEGER PRIMARY KEY AUTOINCREMENT,
          milestone_id INTEGER NOT NULL REFERENCES milestones(id) ON DELETE CASCADE,
          title        TEXT NOT NULL CHECK (length(trim(title)) > 0),
          is_active    INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
          created_at   TEXT NOT NULL DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now'))
        );
        CREATE INDEX IF NOT EXISTS idx_quests_milestone ON quests (milestone_id);

        CREATE TABLE IF NOT EXISTS tasks (
          id             INTEGER PRIMARY KEY AUTOINCREMENT,
          quest_id       INTEGER NOT NULL REFERENCES quests(id) ON DELETE CASCADE,
          title          TEXT NOT NULL CHECK (length(trim(title)) > 0),
          scheduled_date TEXT CHECK (scheduled_date IS NULL OR date(scheduled_date) IS NOT NULL),
          scheduled_time TEXT CHECK (scheduled_time IS NULL
                           OR scheduled_time GLOB '[0-2][0-9]:[0-5][0-9]'),
          is_done        INTEGER NOT NULL DEFAULT 0 CHECK (is_done IN (0, 1)),
          completed_at   TEXT
        );
        CREATE INDEX IF NOT EXISTS idx_tasks_quest ON tasks (quest_id);
        CREATE INDEX IF NOT EXISTS idx_tasks_schedule
          ON tasks (scheduled_date, scheduled_time);

        CREATE TABLE IF NOT EXISTS ideas (
          id           INTEGER PRIMARY KEY AUTOINCREMENT,
          milestone_id INTEGER NOT NULL REFERENCES milestones(id) ON DELETE CASCADE,
          title        TEXT NOT NULL CHECK (length(trim(title)) > 0),
          score        INTEGER NOT NULL DEFAULT 0 CHECK (score BETWEEN 0 AND 10)
        );
        CREATE INDEX IF NOT EXISTS idx_ideas_milestone ON ideas (milestone_id);

        CREATE TABLE IF NOT EXISTS habits (
          id          INTEGER PRIMARY KEY AUTOINCREMENT,
          dream_id    INTEGER NOT NULL REFERENCES dreams(id) ON DELETE CASCADE,
          title       TEXT NOT NULL CHECK (length(trim(title)) > 0),
          cue         TEXT,
          time_of_day TEXT CHECK (time_of_day IS NULL
                        OR time_of_day IN ('morning', 'after_lunch', 'evening')),
          goal_days   INTEGER NOT NULL DEFAULT 24 CHECK (goal_days > 0),
          is_archived INTEGER NOT NULL DEFAULT 0 CHECK (is_archived IN (0, 1))
        );
        CREATE INDEX IF NOT EXISTS idx_habits_dream ON habits (dream_id, is_archived);

        CREATE TABLE IF NOT EXISTS habit_schedule_days (
          habit_id INTEGER NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
          weekday  INTEGER NOT NULL CHECK (weekday BETWEEN 0 AND 6),
          PRIMARY KEY (habit_id, weekday)
        );

        CREATE TABLE IF NOT EXISTS habit_detail_entries (
          id       INTEGER PRIMARY KEY AUTOINCREMENT,
          habit_id INTEGER NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
          section  TEXT NOT NULL CHECK (section IN ('easy_start', 'easy_version', 'backup_plan')),
          content  TEXT NOT NULL CHECK (length(trim(content)) > 0)
        );
        CREATE INDEX IF NOT EXISTS idx_habit_details
          ON habit_detail_entries (habit_id, section);

        CREATE TABLE IF NOT EXISTS habit_completions (
          id         INTEGER PRIMARY KEY AUTOINCREMENT,
          habit_id   INTEGER NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
          date       TEXT NOT NULL CHECK (date(date) IS NOT NULL),
          status     TEXT NOT NULL CHECK (status IN ('done', 'partial', 'missed')),
          created_at TEXT NOT NULL DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now')),
          UNIQUE (habit_id, date)
        );
        CREATE INDEX IF NOT EXISTS idx_habit_completions_date
          ON habit_completions (date);

        CREATE TABLE IF NOT EXISTS time_blocks (
          id               INTEGER PRIMARY KEY AUTOINCREMENT,
          key              TEXT NOT NULL UNIQUE,
          label            TEXT NOT NULL,
          icon_key         TEXT NOT NULL
                             CHECK (icon_key IN ('clock', 'sunrise', 'briefcase', 'sun', 'moon')),
          start_time       TEXT CHECK (start_time IS NULL
                             OR start_time GLOB '[0-2][0-9]:[0-5][0-9]'),
          identity         TEXT,
          routine_title    TEXT NOT NULL,
          routine_subtitle TEXT,
          position         INTEGER NOT NULL DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS time_block_actions (
          id            INTEGER PRIMARY KEY AUTOINCREMENT,
          time_block_id INTEGER NOT NULL REFERENCES time_blocks(id) ON DELETE CASCADE,
          title         TEXT NOT NULL,
          subtitle      TEXT,
          icon_key      TEXT NOT NULL CHECK (icon_key IN
                          ('meditate', 'nourish', 'move', 'water', 'intention', 'focus')),
          position      INTEGER NOT NULL DEFAULT 0,
          is_active     INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1))
        );
        CREATE INDEX IF NOT EXISTS idx_block_actions
          ON time_block_actions (time_block_id, position);

        CREATE TABLE IF NOT EXISTS action_completions (
          id           INTEGER PRIMARY KEY AUTOINCREMENT,
          action_id    INTEGER NOT NULL REFERENCES time_block_actions(id) ON DELETE CASCADE,
          date         TEXT NOT NULL CHECK (date(date) IS NOT NULL),
          completed_at TEXT NOT NULL DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now')),
          UNIQUE (action_id, date)
        );
        CREATE INDEX IF NOT EXISTS idx_action_completions_date
          ON action_completions (date);

        CREATE TABLE IF NOT EXISTS risks (
          id       INTEGER PRIMARY KEY AUTOINCREMENT,
          dream_id INTEGER NOT NULL REFERENCES dreams(id) ON DELETE CASCADE,
          title    TEXT NOT NULL CHECK (length(trim(title)) > 0),
          prompt   TEXT NOT NULL DEFAULT 'If this gets in the way...'
        );

        CREATE TABLE IF NOT EXISTS risk_actions (
          id      INTEGER PRIMARY KEY AUTOINCREMENT,
          risk_id INTEGER NOT NULL REFERENCES risks(id) ON DELETE CASCADE,
          content TEXT NOT NULL CHECK (length(trim(content)) > 0)
        );

        CREATE TABLE IF NOT EXISTS timeline_moments (
          id          INTEGER PRIMARY KEY AUTOINCREMENT,
          dream_id    INTEGER NOT NULL REFERENCES dreams(id) ON DELETE CASCADE,
          occurred_on TEXT NOT NULL CHECK (date(occurred_on) IS NOT NULL),
          label       TEXT NOT NULL,
          icon_key    TEXT CHECK (icon_key IS NULL OR icon_key IN
                        ('spark', 'code', 'userPlus', 'rocket', 'chat', 'target')),
          is_locked   INTEGER NOT NULL DEFAULT 0 CHECK (is_locked IN (0, 1))
        );
        CREATE INDEX IF NOT EXISTS idx_moments_dream
          ON timeline_moments (dream_id, occurred_on);
      `);

      await seedReferenceData(db);
    },
  },
  {
    // Memories: moments gain a description and up to a few attached photos.
    toVersion: 3,
    up: async (db) => {
      await db.execAsync(`
        ALTER TABLE timeline_moments ADD COLUMN description TEXT;

        CREATE TABLE IF NOT EXISTS timeline_moment_photos (
          id        INTEGER PRIMARY KEY AUTOINCREMENT,
          moment_id INTEGER NOT NULL REFERENCES timeline_moments(id) ON DELETE CASCADE,
          uri       TEXT NOT NULL,
          position  INTEGER NOT NULL DEFAULT 0
        );
        CREATE INDEX IF NOT EXISTS idx_moment_photos
          ON timeline_moment_photos (moment_id, position);
      `);
    },
  },
  {
    // Weekly-plan membership: the sprint backlog shows only tasks explicitly
    // added to the week ("Do this week"), tracked by is_planned. Existing
    // tasks default to 1 so nothing disappears from the board on upgrade.
    toVersion: 4,
    up: async (db) => {
      await db.execAsync(`
        ALTER TABLE tasks ADD COLUMN is_planned INTEGER NOT NULL DEFAULT 1
          CHECK (is_planned IN (0, 1));
      `);
    },
  },
  {
    // Habits: the time of day now references a My Day time block. The legacy
    // time_of_day column carries a CHECK for the old enum, so block keys live
    // in a new column (old values are copied over; the UI resolves both).
    // Also: the "Make It Easy" / "bad day" detail checkboxes persist per
    // section per day, backing the half-filled day circle.
    toVersion: 5,
    up: async (db) => {
      await db.execAsync(`
        ALTER TABLE habits ADD COLUMN time_block_key TEXT;
        UPDATE habits SET time_block_key = time_of_day
          WHERE time_of_day IS NOT NULL;

        CREATE TABLE IF NOT EXISTS habit_detail_checks (
          id       INTEGER PRIMARY KEY AUTOINCREMENT,
          habit_id INTEGER NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
          section  TEXT NOT NULL CHECK (section IN ('easy_start', 'easy_version')),
          date     TEXT NOT NULL CHECK (date(date) IS NOT NULL),
          UNIQUE (habit_id, section, date)
        );
        CREATE INDEX IF NOT EXISTS idx_habit_detail_checks
          ON habit_detail_checks (habit_id, date);
      `);
    },
  },
  {
    // Legacy habit time-of-day values map onto the seeded My Day blocks, so
    // pre-migration habits pre-select a block in the edit form's Time of day
    // dropdown ("evening" already matches the seeded block key). Skipped when
    // the target block was deleted; the display fallback still covers those.
    toVersion: 6,
    up: async (db) => {
      await db.execAsync(`
        UPDATE habits SET time_block_key =
          COALESCE((SELECT key FROM time_blocks WHERE key = 'wake-up'), time_block_key)
          WHERE time_block_key = 'morning';
        UPDATE habits SET time_block_key =
          COALESCE((SELECT key FROM time_blocks WHERE key = 'day'), time_block_key)
          WHERE time_block_key = 'after_lunch';
      `);
    },
  },
  {
    // Dreams: an attached vision image ("See your dream" step), stored the
    // same way as memory photos — the file is copied into app storage and its
    // durable URI lives here.
    toVersion: 7,
    up: async (db) => {
      await db.execAsync("ALTER TABLE dreams ADD COLUMN photo_uri TEXT;");
    },
  },
  {
    // Milestones: an attached step image shown in the milestone sheet,
    // stored the same way as the dream vision image.
    toVersion: 8,
    up: async (db) => {
      await db.execAsync("ALTER TABLE milestones ADD COLUMN photo_uri TEXT;");
    },
  },
  {
    // Quests: a manual done flag so a quest without tasks can be checked
    // off. Quests with tasks still derive completion from their tasks.
    toVersion: 9,
    up: async (db) => {
      await db.execAsync(`
        ALTER TABLE quests ADD COLUMN is_done INTEGER NOT NULL DEFAULT 0
          CHECK (is_done IN (0, 1));
      `);
    },
  },
  {
    // A quest is now a single actionable item: the tasks layer is folded into
    // quests. Scheduling columns move onto quests; every existing task becomes
    // its own quest under the same milestone; former container quests (those
    // that had tasks) are removed, and the tasks table is dropped.
    toVersion: 10,
    up: async (db) => {
      await db.execAsync(`
        ALTER TABLE quests ADD COLUMN scheduled_date TEXT
          CHECK (scheduled_date IS NULL OR date(scheduled_date) IS NOT NULL);
        ALTER TABLE quests ADD COLUMN scheduled_time TEXT
          CHECK (scheduled_time IS NULL
            OR scheduled_time GLOB '[0-2][0-9]:[0-5][0-9]');
        ALTER TABLE quests ADD COLUMN is_planned INTEGER NOT NULL DEFAULT 0
          CHECK (is_planned IN (0, 1));
        ALTER TABLE quests ADD COLUMN completed_at TEXT;

        CREATE TEMP TABLE container_quests AS
          SELECT DISTINCT quest_id AS id FROM tasks;

        INSERT INTO quests
          (milestone_id, title, is_active, is_done, created_at,
           scheduled_date, scheduled_time, is_planned, completed_at)
        SELECT q.milestone_id, t.title, q.is_active, t.is_done, q.created_at,
               t.scheduled_date, t.scheduled_time, t.is_planned, t.completed_at
        FROM tasks t
        JOIN quests q ON q.id = t.quest_id
        ORDER BY t.id;

        DELETE FROM quests
          WHERE id IN (SELECT id FROM container_quests);
        DROP TABLE container_quests;

        DROP INDEX IF EXISTS idx_tasks_quest;
        DROP INDEX IF EXISTS idx_tasks_schedule;
        DROP TABLE tasks;

        CREATE INDEX IF NOT EXISTS idx_quests_schedule
          ON quests (scheduled_date, scheduled_time);
      `);
    },
  },
  {
    // The demo "items" feature was removed; drop its leftover table.
    toVersion: 11,
    up: async (db) => {
      await db.execAsync("DROP TABLE IF EXISTS items;");
    },
  },
  {
    // Dream vision image framing: the user drags/zooms the photo to choose
    // what stays visible in the cropped frame. Focus is an
    // object-position-style fraction of the hidden overflow (0 = left/top
    // edge in view, 1 = right/bottom edge); scale multiplies the
    // frame-covering fit (1 = plain cover, the previous rendering).
    toVersion: 12,
    up: async (db) => {
      await db.execAsync(`
        ALTER TABLE dreams ADD COLUMN photo_focus_x REAL NOT NULL DEFAULT 0.5;
        ALTER TABLE dreams ADD COLUMN photo_focus_y REAL NOT NULL DEFAULT 0.5;
        ALTER TABLE dreams ADD COLUMN photo_scale REAL NOT NULL DEFAULT 1;
      `);
    },
  },
  {
    // Milestone step images get the same framing controls as the dream
    // vision image (see toVersion 12).
    toVersion: 13,
    up: async (db) => {
      await db.execAsync(`
        ALTER TABLE milestones ADD COLUMN photo_focus_x REAL NOT NULL DEFAULT 0.5;
        ALTER TABLE milestones ADD COLUMN photo_focus_y REAL NOT NULL DEFAULT 0.5;
        ALTER TABLE milestones ADD COLUMN photo_scale REAL NOT NULL DEFAULT 1;
      `);
    },
  },
  {
    // Habits: a completed flag. A completed habit leaves the boards and
    // waits in the Completed Habits list, restorable at any time.
    toVersion: 14,
    up: async (db) => {
      await db.execAsync(`
        ALTER TABLE habits ADD COLUMN is_completed INTEGER NOT NULL DEFAULT 0
          CHECK (is_completed IN (0, 1));
      `);
    },
  },
  {
    // The seeded "Day" block reads better as "After work". Only untouched
    // labels rename (a user's custom label wins); a mirrored routine_title
    // ("no custom copy") follows the label, matching updateTimeBlock.
    toVersion: 15,
    up: async (db) => {
      await db.execAsync(`
        UPDATE time_blocks SET routine_title = 'After work'
          WHERE key = 'day' AND label = 'Day' AND routine_title = 'Day';
        UPDATE time_blocks SET label = 'After work'
          WHERE key = 'day' AND label = 'Day';
      `);
    },
  },
  {
    // Default block start times follow the renamed blocks: wake-up moves to
    // 07:00, After work to 15:00, Evening to 20:00. Only rows still at the
    // seeded times change — a user's custom time wins.
    toVersion: 16,
    up: async (db) => {
      await db.execAsync(`
        UPDATE time_blocks SET start_time = '07:00'
          WHERE key = 'wake-up' AND start_time = '06:00';
        UPDATE time_blocks SET start_time = '15:00'
          WHERE key = 'day' AND start_time = '13:00';
        UPDATE time_blocks SET start_time = '20:00'
          WHERE key = 'evening' AND start_time = '21:00';
      `);
    },
  },
  {
    // Cloud-sync groundwork (Supabase). Every synced table gains three
    // columns — `uid` (the row's identity across devices), `updated_at` (the
    // last-write-wins clock) and `sync_dirty` (has local edits still to push)
    // — plus a tombstone row on delete. Triggers maintain all of it, so the
    // repositories keep writing plain SQL and know nothing about sync.
    //
    // Rows whose identity is really a natural key (a habit's completion for a
    // date, a dream/feeling pair, a time block) derive their uid from that
    // key, so two devices that create "the same" row independently land on
    // one row instead of tripping a UNIQUE constraint.
    //
    // SYNC_V17_TABLES is a frozen copy, like the seeds: a table added later
    // needs its own migration, and this one must keep running forever.
    toVersion: 17,
    up: async (db) => {
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS sync_state (
          key   TEXT PRIMARY KEY,
          value TEXT
        );

        CREATE TABLE IF NOT EXISTS sync_tombstones (
          table_name TEXT NOT NULL,
          uid        TEXT NOT NULL,
          deleted_at TEXT NOT NULL,
          PRIMARY KEY (table_name, uid)
        );

        ALTER TABLE dreams ADD COLUMN photo_remote_key TEXT;
        ALTER TABLE milestones ADD COLUMN photo_remote_key TEXT;
        ALTER TABLE timeline_moment_photos ADD COLUMN photo_remote_key TEXT;
      `);

      for (const table of SYNC_V17_TABLES) {
        await db.execAsync(`
          ALTER TABLE ${table.name} ADD COLUMN uid TEXT;
          ALTER TABLE ${table.name} ADD COLUMN updated_at TEXT;
          ALTER TABLE ${table.name} ADD COLUMN sync_dirty INTEGER NOT NULL DEFAULT 1;

          UPDATE ${table.name}
            SET uid = ${table.uid(table.name)},
                updated_at = ${SYNC_V17_NOW};

          CREATE UNIQUE INDEX IF NOT EXISTS idx_${table.name}_uid
            ON ${table.name} (uid);
        `);
        await db.execAsync(syncTriggersV17(table));
      }
    },
  },
  {
    // The v17 update trigger re-fires on the row it has just stamped whenever
    // "now" equals the stamp already there — an edit landing in the same
    // millisecond as the previous one, such as the two-step sequence shuffle
    // in milestonesRepository — and SQLite aborts the write with "too many
    // levels of trigger recursion". The replacement always moves the clock
    // forward: to now, or 1 ms past the stored stamp when now is not later.
    // That also keeps a local edit newer than a stamp pulled from a device
    // whose clock runs ahead, so last-write-wins still ranks it latest.
    toVersion: 18,
    up: async (db) => {
      for (const table of SYNC_V17_TABLES) {
        await db.execAsync(syncUpdateTriggerV18(table.name));
      }
    },
  },
];

/** Global reference seeds: routine time blocks and the feeling-state catalog. */
async function seedReferenceData(db: SQLiteDatabase): Promise<void> {
  for (const [blockPosition, block] of TIME_BLOCK_SEEDS.entries()) {
    // routine_title is NOT NULL; mirroring the label marks "no custom copy"
    // (updateTimeBlock keeps mirrored titles in sync on rename).
    await db.runAsync(
      `INSERT INTO time_blocks
         (key, label, icon_key, start_time, routine_title, position)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        block.key,
        block.label,
        block.iconKey,
        block.startTime,
        block.label,
        blockPosition,
      ],
    );
  }

  for (const label of FEELING_STATE_LABELS) {
    await db.runAsync("INSERT INTO feeling_states (label) VALUES (?)", [label]);
  }
}

export const LATEST_SCHEMA_VERSION = migrations[migrations.length - 1].toVersion;

// ---------------------------------------------------------------------------
// Cloud-sync schema (migration 17)
// ---------------------------------------------------------------------------

type SyncTableV17 = {
  name: string;
  /**
   * SQL expression producing the row's uid. `ref` is how the row is addressed
   * in the surrounding statement — the table name in the backfill UPDATE,
   * "NEW" inside a trigger.
   */
  uid: (ref: string) => string;
};

/** ISO 8601 UTC, matching the format the rest of the schema stores. */
const SYNC_V17_NOW = "STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now')";

/** Opaque identity for rows that are genuinely new wherever they are made. */
const SYNC_V17_RANDOM_UID = "lower(hex(randomblob(16)))";

/**
 * Synced tables, parents before children — the order the backfill (and later
 * the sync engine) needs so a child's derived uid can read its parent's.
 * Frozen: adding a table means adding a migration, not editing this list.
 */
const SYNC_V17_TABLES: readonly SyncTableV17[] = [
  { name: "dreams", uid: () => SYNC_V17_RANDOM_UID },
  { name: "feeling_states", uid: (ref) => `lower(${ref}.label)` },
  {
    name: "dream_feeling_states",
    uid: (ref) =>
      `(SELECT uid FROM dreams WHERE dreams.id = ${ref}.dream_id) || '/' || ` +
      `(SELECT uid FROM feeling_states WHERE feeling_states.id = ${ref}.state_id)`,
  },
  { name: "milestones", uid: () => SYNC_V17_RANDOM_UID },
  { name: "quests", uid: () => SYNC_V17_RANDOM_UID },
  { name: "ideas", uid: () => SYNC_V17_RANDOM_UID },
  { name: "habits", uid: () => SYNC_V17_RANDOM_UID },
  {
    name: "habit_schedule_days",
    uid: (ref) =>
      `(SELECT uid FROM habits WHERE habits.id = ${ref}.habit_id) ` +
      `|| '/' || ${ref}.weekday`,
  },
  { name: "habit_detail_entries", uid: () => SYNC_V17_RANDOM_UID },
  {
    name: "habit_completions",
    uid: (ref) =>
      `(SELECT uid FROM habits WHERE habits.id = ${ref}.habit_id) ` +
      `|| '/' || ${ref}.date`,
  },
  {
    name: "habit_detail_checks",
    uid: (ref) =>
      `(SELECT uid FROM habits WHERE habits.id = ${ref}.habit_id) ` +
      `|| '/' || ${ref}.section || '/' || ${ref}.date`,
  },
  { name: "time_blocks", uid: (ref) => `${ref}.key` },
  { name: "time_block_actions", uid: () => SYNC_V17_RANDOM_UID },
  {
    name: "action_completions",
    uid: (ref) =>
      `(SELECT uid FROM time_block_actions ` +
      `WHERE time_block_actions.id = ${ref}.action_id) || '/' || ${ref}.date`,
  },
  { name: "risks", uid: () => SYNC_V17_RANDOM_UID },
  { name: "risk_actions", uid: () => SYNC_V17_RANDOM_UID },
  { name: "timeline_moments", uid: () => SYNC_V17_RANDOM_UID },
  { name: "timeline_moment_photos", uid: () => SYNC_V17_RANDOM_UID },
];

/**
 * The three triggers that keep a table syncable: stamp new rows with a uid,
 * move `updated_at` forward (and raise `sync_dirty`) on every edit, and leave
 * a tombstone behind on delete so the deletion can travel to other devices.
 *
 * All three stand down while `sync_state` holds the "applying" marker — that
 * is the sync engine writing rows it just pulled, which already carry the
 * authoring device's uid and timestamp and must not look like local edits.
 */
function syncTriggersV17(table: SyncTableV17): string {
  const name = table.name;
  const idle = "NOT EXISTS (SELECT 1 FROM sync_state WHERE key = 'applying')";

  return `
    CREATE TRIGGER IF NOT EXISTS trg_${name}_sync_insert
    AFTER INSERT ON ${name}
    WHEN NEW.uid IS NULL AND ${idle}
    BEGIN
      UPDATE ${name}
        SET uid = ${table.uid("NEW")}, updated_at = ${SYNC_V17_NOW}
        WHERE rowid = NEW.rowid;
      DELETE FROM sync_tombstones
        WHERE table_name = '${name}'
          AND uid = (SELECT uid FROM ${name} WHERE rowid = NEW.rowid);
    END;

    CREATE TRIGGER IF NOT EXISTS trg_${name}_sync_update
    AFTER UPDATE ON ${name}
    WHEN NEW.updated_at IS OLD.updated_at AND ${idle}
    BEGIN
      UPDATE ${name}
        SET updated_at = ${SYNC_V17_NOW}, sync_dirty = 1
        WHERE rowid = NEW.rowid;
    END;

    CREATE TRIGGER IF NOT EXISTS trg_${name}_sync_delete
    AFTER DELETE ON ${name}
    WHEN OLD.uid IS NOT NULL AND ${idle}
    BEGIN
      INSERT OR REPLACE INTO sync_tombstones (table_name, uid, deleted_at)
        VALUES ('${name}', OLD.uid, ${SYNC_V17_NOW});
    END;
  `;
}

/**
 * Migration 18's update trigger: the v17 one, except the stamp it writes is
 * always later than the stamp it replaces, so it can never re-fire on its own
 * write. Frozen like the v17 SQL above.
 */
function syncUpdateTriggerV18(name: string): string {
  const idle = "NOT EXISTS (SELECT 1 FROM sync_state WHERE key = 'applying')";
  const later =
    `CASE WHEN OLD.updated_at IS NULL OR ${SYNC_V17_NOW} > OLD.updated_at ` +
    `THEN ${SYNC_V17_NOW} ` +
    `ELSE COALESCE(STRFTIME('%Y-%m-%dT%H:%M:%fZ', OLD.updated_at, '+0.001 seconds'), ${SYNC_V17_NOW}) ` +
    `END`;

  return `
    DROP TRIGGER IF EXISTS trg_${name}_sync_update;

    CREATE TRIGGER trg_${name}_sync_update
    AFTER UPDATE ON ${name}
    WHEN NEW.updated_at IS OLD.updated_at AND ${idle}
    BEGIN
      UPDATE ${name}
        SET updated_at = ${later}, sync_dirty = 1
        WHERE rowid = NEW.rowid;
    END;
  `;
}
