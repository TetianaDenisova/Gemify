import { useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";

import { getSetting, setSetting } from "@/db";

const SHOW_ACTIVE_MILESTONE_KEY = "home.showActiveMilestone";

/** Home display preferences, persisted on this device and reloaded on focus. */
export function useHomePreferences() {
  const [showActiveMilestone, setShowActiveMilestone] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const writing = useRef(false);
  const revision = useRef(0);

  useFocusEffect(useCallback(() => {
    let active = true;
    const readRevision = revision.current;
    getSetting(SHOW_ACTIVE_MILESTONE_KEY)
      .then((value) => {
        if (!active || readRevision !== revision.current) return;
        setShowActiveMilestone(value !== "false");
        setError(null);
      })
      .catch(() => {
        if (active) setError("Could not load Home preferences.");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []));

  const updateShowActiveMilestone = useCallback(async (value: boolean) => {
    if (writing.current || loading) return;
    writing.current = true;
    revision.current += 1;
    setSaving(true);
    setError(null);
    const previous = showActiveMilestone;
    setShowActiveMilestone(value);
    try {
      await setSetting(SHOW_ACTIVE_MILESTONE_KEY, String(value));
    } catch {
      setShowActiveMilestone(previous);
      setError("Could not save your preference. Please try again.");
    } finally {
      writing.current = false;
      setSaving(false);
    }
  }, [loading, showActiveMilestone]);

  return { showActiveMilestone, loading, saving, error, updateShowActiveMilestone };
}
