import {
  createClient,
  type SupabaseClient,
  type SupportedStorage,
} from "@supabase/supabase-js";
import KvStore from "expo-sqlite/kv-store";
import { AppState, Platform } from "react-native";
import "react-native-url-polyfill/auto";

import { SUPABASE_ANON_KEY, SUPABASE_URL, isSyncConfigured } from "./config";

let client: SupabaseClient | null = null;

/**
 * Where the auth session is kept between launches.
 *
 * Native uses expo-sqlite's key/value store — the same SQLite engine the app
 * already ships, so no extra dependency. The web build can't: that store
 * opens a second wasm database, which fails (`sqlite3_open_v2`) wherever the
 * page isn't cross-origin isolated, and the failure surfaces as a token
 * refresh that throws every few seconds. `localStorage` is what a browser has
 * for exactly this, so the web build uses it, falling back to memory when the
 * browser withholds it (private mode, blocked storage, static rendering with
 * no `window` at all) so a missing store degrades to "signed out" instead of
 * crashing.
 */
function createAuthStorage(): SupportedStorage {
  if (Platform.OS !== "web") return KvStore;

  try {
    const probe = "gemify.storage-probe";
    globalThis.localStorage.setItem(probe, probe);
    globalThis.localStorage.removeItem(probe);
    return globalThis.localStorage;
  } catch {
    const memory = new Map<string, string>();
    return {
      getItem: (key) => memory.get(key) ?? null,
      removeItem: (key) => {
        memory.delete(key);
      },
      setItem: (key, value) => {
        memory.set(key, value);
      },
    };
  }
}

/** Whether a session exists, and whether the app is in front of the user. */
let hasSession = false;
let foregrounded = true;

/**
 * The token refresh timer runs only while someone is actually signed in and
 * the app is foregrounded. Signed out there is no token to refresh, and a
 * backgrounded app would burn wake-ups for nothing.
 */
function updateAutoRefresh(): void {
  if (!client) return;
  if (hasSession && foregrounded) client.auth.startAutoRefresh();
  else client.auth.stopAutoRefresh();
}

/**
 * The shared Supabase client. The auth session is persisted per platform (see
 * `createAuthStorage`) and refreshed only while signed in and foregrounded.
 */
export function getSupabase(): SupabaseClient {
  if (!isSyncConfigured()) {
    throw new Error(
      "Cloud sync is not configured. Set EXPO_PUBLIC_SUPABASE_URL and " +
        "EXPO_PUBLIC_SUPABASE_ANON_KEY, then restart the dev server.",
    );
  }

  if (!client) {
    client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        // Started by hand once there is a session to refresh.
        autoRefreshToken: false,
        // Sessions arrive through a typed one-time code, never a browser
        // redirect, so there is no URL fragment to inspect.
        detectSessionInUrl: false,
        persistSession: true,
        storage: createAuthStorage(),
      },
    });

    foregrounded = AppState.currentState === "active";

    // Fires once with the restored session, then on every sign-in and
    // sign-out. Supabase runs this callback holding the auth lock, so the
    // refresh timer is touched on the next tick rather than inside it.
    client.auth.onAuthStateChange((_event, session) => {
      hasSession = session !== null;
      setTimeout(updateAutoRefresh, 0);
    });

    AppState.addEventListener("change", (state) => {
      foregrounded = state === "active";
      updateAutoRefresh();
    });
  }

  return client;
}
