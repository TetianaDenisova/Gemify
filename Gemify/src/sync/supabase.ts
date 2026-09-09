import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import Storage from "expo-sqlite/kv-store";
import { AppState, Platform } from "react-native";
import "react-native-url-polyfill/auto";

import { SUPABASE_ANON_KEY, SUPABASE_URL, isSyncConfigured } from "./config";

let client: SupabaseClient | null = null;

/**
 * The shared Supabase client. The auth session is persisted through
 * expo-sqlite's key/value store (the same SQLite engine the app already
 * ships, so no extra native dependency) and refreshed while the app is in
 * the foreground.
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
        autoRefreshToken: true,
        // Sessions arrive through a typed one-time code, never a browser
        // redirect, so there is no URL fragment to inspect.
        detectSessionInUrl: false,
        persistSession: true,
        storage: Storage,
      },
    });

    if (Platform.OS !== "web") {
      // Refreshing tokens on a timer only makes sense while the app is
      // foregrounded; a backgrounded app would burn wake-ups for nothing.
      AppState.addEventListener("change", (state) => {
        if (state === "active") {
          client?.auth.startAutoRefresh();
        } else {
          client?.auth.stopAutoRefresh();
        }
      });
      if (AppState.currentState === "active") {
        client.auth.startAutoRefresh();
      }
    }
  }

  return client;
}
