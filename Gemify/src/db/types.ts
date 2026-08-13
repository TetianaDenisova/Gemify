/** A row from the `items` table, with column names mapped to camelCase. */
export type Item = {
  id: number;
  name: string;
  description: string | null;
  /** ISO 8601 UTC timestamp, e.g. "2026-08-13T09:30:00.000Z". */
  createdAt: string;
  /** ISO 8601 UTC timestamp, updated on every `updateItem`. */
  updatedAt: string;
};

/** Input for `createItem`. Timestamps and id are set by the database. */
export type NewItem = {
  name: string;
  description?: string | null;
};

/** Input for `updateItem`. Only the provided fields are changed. */
export type ItemPatch = {
  name?: string;
  description?: string | null;
};
