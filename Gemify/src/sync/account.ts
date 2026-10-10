import { Platform } from "react-native";

import { getDatabase } from "@/db/database";
import { FEELING_STATE_LABELS } from "@/db/seeds";
import { withSyncPaused } from "./engine";
import { notifySyncApplied } from "./events";
import { getSupabase } from "./supabase";
import { SYNC_TABLES } from "./tables";

async function clearDeviceData() {
  const db = await getDatabase();
  await db.withTransactionAsync(async () => {
    for (const table of [...SYNC_TABLES].reverse()) {
      await db.runAsync(`DELETE FROM "${table.name}"`);
    }
    await db.execAsync("DELETE FROM items; DELETE FROM settings; DELETE FROM forecast_cache; DELETE FROM sync_tombstones; DELETE FROM sync_state;");
    for (const label of FEELING_STATE_LABELS) {
      await db.runAsync("INSERT INTO feeling_states (label) VALUES (?)", [label]);
    }
  });
  if (Platform.OS !== "web") {
    const { Directory, Paths } = await import("expo-file-system");
    const memories = new Directory(Paths.document, "memories");
    if (memories.exists) memories.delete();
  }
  notifySyncApplied();
}

export async function deleteAccount(): Promise<void> {
  await withSyncPaused(async () => {
    const supabase = getSupabase();
    const { data: session } = await supabase.auth.getSession();
    if (!session.session) throw new Error("Sign in before deleting your account.");
    const { data, error } = await supabase.functions.invoke("delete-account", {
      body: { confirmation: "DELETE" },
    });
    if (error || data?.deleted !== true) {
      throw new Error("Could not delete your account. Check your connection and try again.");
    }
    // Clear the revoked session locally even if global sign-out cannot reach Auth.
    await supabase.auth.signOut({ scope: "local" });
    try { await clearDeviceData(); }
    catch {
      throw new Error("Your cloud account was deleted, but some device data could not be removed. Please clear Gemify's app storage before signing in again.");
    }
  });
}
