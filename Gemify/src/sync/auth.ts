import type { Session } from "@supabase/supabase-js";

import { getSupabase } from "./supabase";

/**
 * Account sign-in for cloud sync: a one-time code sent by email.
 *
 * A typed code rather than a tapped magic link keeps both devices on the same
 * simple path — no deep-link scheme, no redirect handling, and no difference
 * between Android and iOS. The Supabase email template has to include
 * `{{ .Token }}` for the code to be there at all (see supabase/schema.sql).
 */

/** Emails a six-digit code, creating the account on first use. */
export async function requestSignInCode(email: string): Promise<void> {
  const { error } = await getSupabase().auth.signInWithOtp({
    email: email.trim(),
    options: { shouldCreateUser: true },
  });
  if (error) throw error;
}

/** Exchanges the emailed code for a session that persists across restarts. */
export async function confirmSignInCode(
  email: string,
  code: string,
): Promise<Session> {
  const { data, error } = await getSupabase().auth.verifyOtp({
    email: email.trim(),
    token: code.trim(),
    type: "email",
  });
  if (error) throw error;
  if (!data.session) {
    throw new Error("That code did not open a session. Try requesting a new one.");
  }
  return data.session;
}

/** Signs out of the account. Nothing on the device is deleted. */
export async function signOut(): Promise<void> {
  const { error } = await getSupabase().auth.signOut();
  if (error) throw error;
}

export async function getCurrentSession(): Promise<Session | null> {
  const { data, error } = await getSupabase().auth.getSession();
  if (error) throw error;
  return data.session;
}
