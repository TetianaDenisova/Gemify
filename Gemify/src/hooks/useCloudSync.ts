import type { Session } from "@supabase/supabase-js";
import { useCallback, useEffect, useState } from "react";
import { AppState } from "react-native";

import {
  getCurrentSession,
  getLastSyncedAt,
  getSupabase,
  isSyncConfigured,
  runSync,
  type SyncResult,
} from "@/sync";

/**
 * Cloud sync as the screens see it: who is signed in, when this device last
 * synced, and the one action that pushes and pulls.
 */

export type CloudSync = {
  busy: boolean;
  /** Null until the persisted session has been read back. */
  email: string | null;
  error: string | null;
  /** False when the app was built without Supabase credentials. */
  configured: boolean;
  lastResult: SyncResult | null;
  /** ISO timestamp of the last completed sync on this device. */
  lastSyncedAt: string | null;
  ready: boolean;
  signedIn: boolean;
  sync: () => Promise<void>;
};

function describe(cause: unknown): string {
  return cause instanceof Error ? cause.message : "Sync failed.";
}

export function useCloudSync(): CloudSync {
  const configured = isSyncConfigured();
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(!configured);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<SyncResult | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  useEffect(() => {
    if (!configured) return;

    let active = true;
    const supabase = getSupabase();

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!active) return;
        setSession(data.session);
        setReady(true);
      })
      .catch(() => {
        if (active) setReady(true);
      });

    const { data } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, [configured]);

  useEffect(() => {
    let active = true;
    getLastSyncedAt()
      .then((value) => {
        if (active) setLastSyncedAt(value);
      })
      .catch(() => {
        // Only the "last synced" caption depends on this.
      });
    return () => {
      active = false;
    };
  }, [lastResult, session]);

  const sync = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      setLastResult(await runSync());
    } catch (cause) {
      setError(describe(cause));
    } finally {
      setBusy(false);
    }
  }, []);

  return {
    busy,
    configured,
    email: session?.user.email ?? null,
    error,
    lastResult,
    lastSyncedAt,
    ready,
    signedIn: session !== null,
    sync,
  };
}

/**
 * How long a sync suppresses the next automatic one. Coming back to the app
 * can fire in bursts (a permission sheet, a notification pulled down), so
 * resumes coalesce generously; leaving is the last chance to push what was
 * just written, so it barely coalesces at all.
 */
const ON_RESUME_GAP_MS = 60_000;
const ON_LEAVE_GAP_MS = 10_000;
/** Cadence while the app simply stays open. */
const WHILE_OPEN_MS = 5 * 60_000;

let lastAutoSyncAt = 0;

/** Syncs, unless one already ran within `minGapMs`. */
function autoSync(minGapMs: number): void {
  const now = Date.now();
  if (now - lastAutoSyncAt < minGapMs) return;
  lastAutoSyncAt = now;

  getCurrentSession()
    .then((session) => (session ? runSync() : null))
    .catch(() => {
      // Offline, or signed out. The sync screen reports failures that matter.
    });
}

/**
 * Keeps the device in step on its own: on open, every few minutes while the
 * app stays up, and on the way out.
 *
 * The sync on leaving is best-effort — the OS can suspend the app before the
 * request lands — so it is a bonus, not the guarantee. The one on open is
 * what actually makes the other device's changes show up.
 *
 * Mounted once, from the root layout.
 */
export function useAutoSync(): void {
  useEffect(() => {
    if (!isSyncConfigured()) return;

    autoSync(0);

    const timer = setInterval(() => autoSync(WHILE_OPEN_MS), WHILE_OPEN_MS);
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") autoSync(ON_RESUME_GAP_MS);
      else if (state === "background") autoSync(ON_LEAVE_GAP_MS);
    });

    return () => {
      clearInterval(timer);
      subscription.remove();
    };
  }, []);
}
