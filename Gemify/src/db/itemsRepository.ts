import { getDatabase } from "./database";
import type { Item, ItemPatch, NewItem } from "./types";

type ItemRow = {
  id: number;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
};

const SELECT_ITEM = `
  SELECT id, name, description, created_at, updated_at
  FROM items
`;

function toItem(row: ItemRow): Item {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Inserts an item and returns the stored row. `name` must be non-empty. */
export async function createItem(input: NewItem): Promise<Item> {
  const name = input.name.trim();
  if (!name) {
    throw new Error("Item name is required.");
  }

  const db = await getDatabase();
  const result = await db.runAsync(
    "INSERT INTO items (name, description) VALUES (?, ?)",
    [name, input.description?.trim() || null],
  );

  const item = await getItemById(result.lastInsertRowId);
  if (!item) {
    throw new Error("Failed to read back the created item.");
  }
  return item;
}

/** Returns all items, newest first. */
export async function getItems(): Promise<Item[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<ItemRow>(
    `${SELECT_ITEM} ORDER BY created_at DESC, id DESC`,
  );
  return rows.map(toItem);
}

/** Returns a single item, or null when no row matches. */
export async function getItemById(id: number): Promise<Item | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<ItemRow>(`${SELECT_ITEM} WHERE id = ?`, [
    id,
  ]);
  return row ? toItem(row) : null;
}

/**
 * Updates only the fields present in `patch` (plus `updated_at`) and returns
 * the stored row, or null when the item doesn't exist.
 */
export async function updateItem(
  id: number,
  patch: ItemPatch,
): Promise<Item | null> {
  const assignments: string[] = [];
  const params: (string | null)[] = [];

  if (patch.name !== undefined) {
    const name = patch.name.trim();
    if (!name) {
      throw new Error("Item name is required.");
    }
    assignments.push("name = ?");
    params.push(name);
  }
  if (patch.description !== undefined) {
    assignments.push("description = ?");
    params.push(patch.description?.trim() || null);
  }

  if (assignments.length > 0) {
    assignments.push("updated_at = STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now')");
    const db = await getDatabase();
    await db.runAsync(
      `UPDATE items SET ${assignments.join(", ")} WHERE id = ?`,
      [...params, id],
    );
  }

  return getItemById(id);
}

/** Deletes an item. Returns true when a row was removed. */
export async function deleteItem(id: number): Promise<boolean> {
  const db = await getDatabase();
  const result = await db.runAsync("DELETE FROM items WHERE id = ?", [id]);
  return result.changes > 0;
}
