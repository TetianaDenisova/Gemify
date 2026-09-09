/**
 * What sync knows about the local schema.
 *
 * Column lists are read from the database at runtime (`PRAGMA table_info`), so
 * a plain `ALTER TABLE ... ADD COLUMN` migration starts syncing on its own.
 * Only the two things SQL cannot tell us live here: which columns are foreign
 * keys (they travel as the parent's `uid`, since row ids differ per device)
 * and which columns hold a photo (the file URI is device-local, the storage
 * key is what syncs).
 */
export type SyncPhotoColumn = {
  /** Column holding the Supabase Storage object key; travels with the row. */
  keyColumn: string;
  /** Column holding the on-device file URI; never leaves the device. */
  uriColumn: string;
};

export type SyncTableSpec = {
  /** Local column -> table whose `uid` replaces the stored integer id. */
  foreignKeys: Readonly<Record<string, string>>;
  name: string;
  photos?: readonly SyncPhotoColumn[];
};

const PHOTO: readonly SyncPhotoColumn[] = [
  { keyColumn: "photo_remote_key", uriColumn: "photo_uri" },
];

/**
 * Every synced table, parents before children. Pulled rows are applied in
 * this order so a child always finds its parent, and deletes are pushed the
 * same way. `settings` is deliberately absent — nothing writes to it.
 */
export const SYNC_TABLES: readonly SyncTableSpec[] = [
  { foreignKeys: {}, name: "dreams", photos: PHOTO },
  { foreignKeys: {}, name: "feeling_states" },
  {
    foreignKeys: { dream_id: "dreams", state_id: "feeling_states" },
    name: "dream_feeling_states",
  },
  { foreignKeys: { dream_id: "dreams" }, name: "milestones", photos: PHOTO },
  { foreignKeys: { milestone_id: "milestones" }, name: "quests" },
  { foreignKeys: { milestone_id: "milestones" }, name: "ideas" },
  { foreignKeys: { dream_id: "dreams" }, name: "habits" },
  { foreignKeys: { habit_id: "habits" }, name: "habit_schedule_days" },
  { foreignKeys: { habit_id: "habits" }, name: "habit_detail_entries" },
  { foreignKeys: { habit_id: "habits" }, name: "habit_completions" },
  { foreignKeys: { habit_id: "habits" }, name: "habit_detail_checks" },
  { foreignKeys: {}, name: "time_blocks" },
  { foreignKeys: { time_block_id: "time_blocks" }, name: "time_block_actions" },
  {
    foreignKeys: { action_id: "time_block_actions" },
    name: "action_completions",
  },
  { foreignKeys: { dream_id: "dreams" }, name: "risks" },
  { foreignKeys: { risk_id: "risks" }, name: "risk_actions" },
  { foreignKeys: { dream_id: "dreams" }, name: "timeline_moments" },
  {
    foreignKeys: { moment_id: "timeline_moments" },
    name: "timeline_moment_photos",
    photos: [{ keyColumn: "photo_remote_key", uriColumn: "uri" }],
  },
];

export const SYNC_TABLES_BY_NAME: ReadonlyMap<string, SyncTableSpec> = new Map(
  SYNC_TABLES.map((table) => [table.name, table]),
);
