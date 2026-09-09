/**
 * Where cloud sync talks to. Both values come from the environment at build
 * time (Metro inlines `EXPO_PUBLIC_*` variables), so a checkout without a
 * `.env` file simply has sync switched off instead of crashing on start —
 * see `.env.example` and `supabase/schema.sql` for the setup.
 */
export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";

export const SUPABASE_ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "";

/** Private storage bucket holding vision, milestone and memory photos. */
export const PHOTO_BUCKET = "gemify-photos";

/** The single generic row store every table syncs through. */
export const SYNC_TABLE = "sync_rows";

/** Rows fetched per pull request, and rows sent per push request. */
export const PAGE_SIZE = 500;

export function isSyncConfigured(): boolean {
  return SUPABASE_URL.length > 0 && SUPABASE_ANON_KEY.length > 0;
}
