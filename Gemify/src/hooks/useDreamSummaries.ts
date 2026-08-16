import { useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";

import { getDreamSummaries, type DreamSummary } from "@/db";

export type UseDreamSummariesResult = {
  dreams: DreamSummary[];
  /** True until the first load resolves. */
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

/**
 * Home-screen dream list backed by SQLite. Reloads on every screen focus so
 * dreams created or edited elsewhere show up without manual refresh.
 */
export function useDreamSummaries(): UseDreamSummariesResult {
  const [dreams, setDreams] = useState<DreamSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  const refresh = useCallback(async () => {
    try {
      const next = await getDreamSummaries();
      if (!mounted.current) return;
      setDreams(next);
      setError(null);
    } catch (cause) {
      if (mounted.current) {
        setError(cause instanceof Error ? cause.message : "Failed to load dreams.");
      }
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      mounted.current = true;
      refresh();
      return () => {
        mounted.current = false;
      };
    }, [refresh]),
  );

  return { dreams, loading, error, refresh };
}
