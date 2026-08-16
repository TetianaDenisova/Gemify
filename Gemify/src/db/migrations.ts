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
];

/** Global reference seeds: routine time blocks and the feeling-state catalog. */
async function seedReferenceData(db: SQLiteDatabase): Promise<void> {
  for (const [blockPosition, block] of TIME_BLOCK_SEEDS.entries()) {
    const inserted = await db.runAsync(
      `INSERT INTO time_blocks
         (key, label, icon_key, start_time, identity, routine_title, routine_subtitle, position)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        block.key,
        block.label,
        block.iconKey,
        block.startTime,
        block.identity,
        block.routineTitle,
        block.routineSubtitle,
        blockPosition,
      ],
    );

    for (const [actionPosition, action] of block.actions.entries()) {
      await db.runAsync(
        `INSERT INTO time_block_actions (time_block_id, title, subtitle, icon_key, position)
         VALUES (?, ?, ?, ?, ?)`,
        [inserted.lastInsertRowId, action.title, action.subtitle, action.iconKey, actionPosition],
      );
    }
  }

  for (const label of FEELING_STATE_LABELS) {
    await db.runAsync("INSERT INTO feeling_states (label) VALUES (?)", [label]);
  }
}

export const LATEST_SCHEMA_VERSION = migrations[migrations.length - 1].toVersion;
