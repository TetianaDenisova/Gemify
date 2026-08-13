import { useCallback, useEffect, useRef, useState } from "react";

import {
  createItem,
  deleteItem,
  getItems,
  updateItem,
  type Item,
  type ItemPatch,
  type NewItem,
} from "@/db";

export type UseItemsResult = {
  items: Item[];
  /** True while the initial load or a refresh is in flight. */
  loading: boolean;
  /** Message from the last failed operation, cleared on the next success. */
  error: string | null;
  refresh: () => Promise<void>;
  addItem: (input: NewItem) => Promise<Item | null>;
  editItem: (id: number, patch: ItemPatch) => Promise<Item | null>;
  removeItem: (id: number) => Promise<boolean>;
};

function toMessage(cause: unknown): string {
  return cause instanceof Error ? cause.message : "Something went wrong.";
}

/**
 * List-of-items state backed by SQLite. Handles loading/error state and keeps
 * the list in sync after every mutation, so screens never touch SQL directly.
 */
export function useItems(): UseItemsResult {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  // State updates live in promise callbacks (never synchronously in the
  // caller), so the initial-load effect below can't cascade renders.
  const load = useCallback(
    () =>
      getItems()
        .then((next) => {
          if (!mounted.current) return;
          setItems(next);
          setError(null);
        })
        .catch((cause: unknown) => {
          if (mounted.current) setError(toMessage(cause));
        })
        .finally(() => {
          if (mounted.current) setLoading(false);
        }),
    [],
  );

  const refresh = useCallback(async () => {
    setLoading(true);
    await load();
  }, [load]);

  // `loading` starts true, so the mount load needs no synchronous setState.
  useEffect(() => {
    load();
  }, [load]);

  const addItem = useCallback(async (input: NewItem) => {
    try {
      const item = await createItem(input);
      if (mounted.current) {
        setItems((current) => [item, ...current]);
        setError(null);
      }
      return item;
    } catch (cause) {
      if (mounted.current) setError(toMessage(cause));
      return null;
    }
  }, []);

  const editItem = useCallback(async (id: number, patch: ItemPatch) => {
    try {
      const item = await updateItem(id, patch);
      if (mounted.current && item) {
        setItems((current) =>
          current.map((existing) => (existing.id === id ? item : existing)),
        );
        setError(null);
      }
      return item;
    } catch (cause) {
      if (mounted.current) setError(toMessage(cause));
      return null;
    }
  }, []);

  const removeItem = useCallback(async (id: number) => {
    try {
      const removed = await deleteItem(id);
      if (mounted.current && removed) {
        setItems((current) => current.filter((existing) => existing.id !== id));
        setError(null);
      }
      return removed;
    } catch (cause) {
      if (mounted.current) setError(toMessage(cause));
      return false;
    }
  }, []);

  return { items, loading, error, refresh, addItem, editItem, removeItem };
}
