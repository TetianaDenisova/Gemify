# Sync risk register

Everything that can go wrong with cloud sync, where it goes wrong, and what a
user would see. Audited 2026-09-12 against `src/sync/`, `src/db/migrations.ts`
(migration 17) and `supabase/schema.sql`.

Severity is about the user's data, not about how ugly the failure looks:

| | Meaning |
|---|---|
| 🔴 | Sync stops working, and keeps not working until someone intervenes |
| 🟠 | Data is lost, silently overwritten, or never arrives |
| 🟡 | Degraded — slow, noisy, or confusing, but nothing is lost |

Status is `open`, `fixed (undeployed)`, `by design`, or `latent` (the code path
is wrong but nothing reaches it yet).

---

## Summary

| # | Risk | Sev | Status |
|---|---|---|---|
| [1](#1-the-wasm-file-is-never-uploaded) | The wasm file is never uploaded (live, web only) | 🔴 | fixed, needs deploy |
| [2](#2-cross-origin-isolation-headers-must-survive-the-host) | Cross-origin isolation headers must survive the host | 🔴 | open |
| [3](#3-the-service-worker-can-pin-a-bad-asset-forever) | The service worker can pin a bad asset forever | 🔴 | partly fixed |
| [4](#4-the-auth-session-store-opens-a-second-database-on-web) | The auth session store opens a second database on web | 🔴 | fixed (undeployed) |
| [5](#5-one-unwritable-row-poisons-every-future-pull) | One unwritable row poisons every future pull | 🔴 | open |
| [6](#6-a-child-whose-parent-arrives-later-is-dropped-for-good) | A child whose parent arrives later is dropped for good | 🟠 | open |
| [7](#7-an-edit-made-during-a-push-is-lost) | An edit made during a push is lost | 🟠 | open |
| [8](#8-an-old-app-version-erases-columns-it-has-never-heard-of) | An old app version erases columns it has never heard of | 🟠 | open |
| [9](#9-photos-do-not-sync-on-web-in-either-direction) | Photos do not sync on web, in either direction | 🟠 | by design |
| [10](#10-a-photo-upload-failure-aborts-the-whole-push) | A photo upload failure aborts the whole push | 🟡 | open |
| [11](#11-a-wrong-device-clock-wins-every-conflict) | A wrong device clock wins every conflict | 🟠 | open |
| [12](#12-signing-into-a-second-account-copies-the-journey-into-it) | Signing into a second account copies the journey into it | 🟠 | by design |
| [13](#13-the-otp-email-never-sends-500-error-sending-confirmation-email) | The OTP email never sends — 500 (live, blocks sign-in) | 🔴 | open |
| [13a](#13a-the-otp-email-has-no-code-in-it) | The OTP email has no code in it | 🔴 | open |
| [14](#14-supabases-built-in-mailer-rate-limits-the-sign-in) | Supabase's built-in mailer rate-limits the sign-in | 🟡 | open |
| [15](#15-restoring-a-backup-overwrites-the-other-device) | Restoring a backup overwrites the other device | 🟠 | by design |
| [16](#16-a-signed-in-device-never-reports-a-failing-sync) | A signed-in device never reports a failing sync | 🟠 | open |
| [17](#17-the-pull-cursor-stalls-behind-an-unknown-table) | The pull cursor stalls behind an unknown table | 🟡 | by design |
| [18](#18-deleted-rows-leave-their-photos-in-the-bucket-forever) | Deleted rows leave their photos in the bucket forever | 🟡 | open |
| [19](#19-a-nullable-foreign-key-would-stop-a-row-syncing-forever) | A nullable foreign key would stop a row syncing forever | 🟠 | latent |
| [20](#20-dreamsseed_key-is-unique-and-nothing-resolves-a-clash) | `dreams.seed_key` is UNIQUE and nothing resolves a clash | 🔴 | latent |

---

## Delivery and platform

### 1. The wasm file is never uploaded

🟢 · **fixed 2026-09-12, needs a deploy** · was the error painted on the
screen in every web build.

```
Aborted(CompileError: WebAssembly.Module doesn't parse at byte 0:
module doesn't start with '\0asm')
```

`expo export` writes wa-sqlite to
`dist/assets/node_modules/expo-sqlite/web/wa-sqlite/wa-sqlite.<hash>.wasm`, and
the worker bundle asks for that exact absolute path. But `wrangler pages deploy`
(the `deploy` script in `package.json`) refuses to upload it: its asset walker
carries a hardcoded ignore list —

```js
const IGNORE_LIST = ["_worker.js", "_redirects", "_headers", "_routes.json",
                     "functions", "**/.DS_Store", "**/node_modules", "**/.git",
                     ".wrangler"]
```

— and `assets/node_modules` matches `**/node_modules`. The request 404s,
Cloudflare answers with its HTML error page, and emscripten tries to compile
HTML as WebAssembly.

**Blast radius is the whole web app, not just sync.** Without wa-sqlite there is
no local database at all; Cloud sync is simply the only screen that renders an
error instead of empty state.

**Fixed** by `scripts/prepare-web-deploy.mjs`, which `build:web` now runs after
`expo export`: it moves `dist/assets/node_modules` to `dist/assets/vendor` and
repoints every reference, so nothing wrangler ignores is left in the way. Takes
effect on the next `npm run deploy`.

Verify after deploying: `curl -I https://<host>/assets/vendor/expo-sqlite/web/wa-sqlite/wa-sqlite.<hash>.wasm`
must return `200` with `content-type: application/wasm`.

The alternative, if Pages is ever swapped out: Workers static assets
(`wrangler deploy`) honour `.assetsignore` rather than a hardcoded list, and
need no post-processing at all.

### 2. Cross-origin isolation headers must survive the host

🔴 · open

expo-sqlite's web worker needs `SharedArrayBuffer`, which browsers hand out only
under cross-origin isolation. Three ways this breaks:

- `public/_headers` never reaches the host (a different host, a preview branch,
  a proxy that strips headers) → `crossOriginIsolated === false` → the database
  never opens.
- Dev and prod disagree: `metro.config.js` sets `Cross-Origin-Embedder-Policy:
  credentialless`, `public/_headers` sets `require-corp`. Safari only honours
  `require-corp`, so something can work in `npm run web` and fail on an iPhone.
- `require-corp` also blocks any *future* third-party subresource that lacks
  CORP — a web font, an analytics script, a remote image. The app loads none
  today; the first one added will fail silently.

Check: `crossOriginIsolated` in the console on the deployed origin.

### 3. The service worker can pin a bad asset forever

🔴 · open

`public/sw.js` is cache-first for everything that is not a navigation, on the
premise that non-page assets are content-hashed. Two holes:

- `store()` caches any same-origin `200 basic` response, and **Cloudflare Pages
  answers a missing asset with `200 text/html`, not `404`** — measured against
  a stale preview deployment on 2026-09-12, where the wasm URL returned the SPA
  shell with a success status. So a missing asset really can be cached as HTML
  under its own URL, permanently, and no later deploy dislodges it. This was
  the mechanism behind [1](#1-the-wasm-file-is-never-uploaded) surviving as long
  as it did. The per-build `CACHE` stamp is now the thing that retires it.
- ~~The cache name is the only invalidation there is. Shipping a fix without
  bumping `CACHE` by hand leaves installed PWAs on the old assets.~~ **Fixed
  2026-09-12:** `scripts/prepare-web-deploy.mjs` stamps `CACHE` with a
  per-build value, so every deploy retires the previous cache. This also
  matters for [1](#1-the-wasm-file-is-never-uploaded), whose rewrite changes a
  content-hashed bundle without changing its name — a cache-first worker would
  otherwise serve the broken one forever.

### 4. The auth session store opens a second database on web

🔴 · fixed (undeployed)

`src/sync/supabase.ts` used `expo-sqlite/kv-store` as the Supabase auth store on
every platform. On web that opens a second wasm database, which fails wherever
the page is not cross-origin isolated, and the failure resurfaces as a token
refresh throwing every few seconds.

The working-tree version splits the store per platform (`localStorage` on web,
falling back to memory) and starts the refresh timer only while signed in and
foregrounded. **It is staged but not committed or deployed** — the live build
still has the old behaviour.

---

## Engine

### 5. One unwritable row poisons every future pull

🔴 · open

`applyPulledRows` writes the whole batch inside one exclusive transaction
(`src/sync/localStore.ts:305`). Any SQLite error — a UNIQUE violation not
covered by `resolveSequenceClash`, a NOT NULL column a newer app version made
required, a CHECK constraint — rolls the batch back, throws out of `runSync`,
and leaves the cursor where it was. Every subsequent sync re-pulls the same rows
and fails at the same one. Sync is over, on that device, permanently.

Nothing is quarantined, and nothing is reported: `useAutoSync` swallows the
throw (see [16](#16-a-signed-in-device-never-reports-a-failing-sync)).

### 6. A child whose parent arrives later is dropped for good

🟠 · open

`applyRow` returns `"orphaned"` when a foreign key points at a uid this device
has never seen (`src/sync/localStore.ts:388`). The batch retries once with a
cleared cache, then gives up — and the cursor still advances past the row. If
the parent turns up in a *later* pull (the other device pushed it in a
subsequent pass, so its `server_updated_at` is newer), the child's row sits
behind the cursor and is never read again.

`stats.orphaned` is counted and then discarded; nobody sees it.

### 7. An edit made during a push is lost

🟠 · open

`pushChanges` reads the dirty rows, uploads them, then clears `sync_dirty` for
the uids it sent (`src/sync/engine.ts:125-146`). An edit landing between the read
and the clear re-raises the flag — and then `clearDirty` lowers it again. The
edit stays on the device, unpushed, until something else touches the row.

Narrow window (an edit during an in-flight request), no error, no trace.

### 8. An old app version erases columns it has never heard of

🟠 · open

The pull side is careful: `applyRow` only writes columns present in the payload,
so an old device cannot blank a column it does not know. The push side is not —
`toRemoteRow` builds `data` from *this* device's `PRAGMA table_info` and the
upsert replaces the server's `data` jsonb wholesale. So an old device that edits
any field of a row wipes every newer column of that row for every device.

The unknown-*table* case is handled (the cursor is held back,
`src/sync/engine.ts:229`). The unknown-*column* case is not.

### 11. A wrong device clock wins every conflict

🟠 · open

`client_updated_at` is the authoring device's clock, and both the server trigger
and `applyRow` settle conflicts on it. A device whose clock runs days fast wins
every conflict until real time catches up — including against edits made after
it. A device running slow loses edits it makes legitimately.

There is no sanity check against `server_updated_at`, which the server owns and
could supply for exactly that.

### 17. The pull cursor stalls behind an unknown table

🟡 · by design

A row from a table this app version does not know holds the cursor at that row's
timestamp so it is picked up after an update (`src/sync/engine.ts:225-232`).
Correct, but while the older version is in the mix every sync re-pulls and
re-skips everything written since. The pull grows in proportion to how long the
device goes un-updated.

---

## Data and schema

### 19. A nullable foreign key would stop a row syncing forever

🟠 · latent

`toRemoteRow` bails with `if (typeof parentId !== "number") return null`
(`src/sync/localStore.ts`), which quietly drops the row from the push while
leaving it dirty — so it retries every sync, forever, and never arrives.

Today every foreign key in `SYNC_TABLES` is `NOT NULL`, so nothing reaches it.
The first nullable FK added to a synced table trips it, with no error anywhere.

### 20. `dreams.seed_key` is UNIQUE and nothing resolves a clash

🔴 · latent

`dreams.uid` is random per device, but `seed_key` carries `TEXT UNIQUE`
(`src/db/migrations.ts:46`). Two devices that each create a dream with the same
seed key produce two rows with different uids and the same `seed_key`; the pull
tries to INSERT the second and SQLite refuses → [risk 5](#5-one-unwritable-row-poisons-every-future-pull),
sync dead.

Nothing writes `seed_key` today (it is read-only in `dreamsRepository`), which is
the only reason this is latent. Every other UNIQUE on a synced table is safe:
natural-key uids converge (`habit_completions`, `action_completions`,
`habit_detail_checks`, `time_blocks.key`, `feeling_states.label`,
`dream_feeling_states`) and `milestones (dream_id, sequence_number)` is settled
by `resolveSequenceClash`.

### 12. Signing into a second account copies the journey into it

🟠 · by design

`adoptAccount` (`src/sync/engine.ts:98`) marks every local row dirty when the
account changes, so signing into a different email uploads the whole local
journey into that account rather than letting the two drift. A user signing into
a second account to "have a look" copies their journey there, and the rows keep
their uids, so it is a merge and not a switch.

Signing out does not clear the cursor or the stored account id — only signing in
as someone else does.

### 15. Restoring a backup overwrites the other device

🟠 · by design

`finishRestoreForSync` stamps every restored row with `now()` and marks it
dirty, so the restore wins last-write-wins everywhere. Restoring a two-week-old
backup on one device rolls the other device back by two weeks on the next sync.

---

## Photos

### 9. Photos do not sync on web, in either direction

🟠 · by design, undocumented in the UI

`uploadRowPhotos` and `downloadMissingPhotos` both return early on web
(`src/sync/photos.ts`), and the URI column is excluded from the synced columns
anyway (`getSyncedColumns` filters `photos[].uriColumn`). So:

- a photo added on web never leaves the browser, despite the comment in
  `photos.ts` suggesting the data URI travels in the row — it does not;
- a photo added on the phone never appears on web, only the row it belongs to.

Nothing in the UI says so.

### 10. A photo upload failure aborts the whole push

🟡 · open

`uploadPhoto` throws on a storage error and `uploadRowPhotos` is called inside
the push loop (`src/sync/engine.ts:132`), so one unreachable file — quota,
expired token, a corrupted local file — fails the entire sync, including the
rows that had nothing to do with photos. The download side is the opposite: it
swallows per-file failures and retries next time (`src/sync/photos.ts:123`).

### 18. Deleted rows leave their photos in the bucket forever

🟡 · open

Deleting a dream, milestone or memory tombstones the row, but nothing deletes
the storage object it pointed at. The bucket only grows, and it is billable.

---

## Auth and operations

### 13. The OTP email never sends — 500 "Error sending confirmation email"

🔴 · open · **this is what blocks sign-in today**

```
POST https://<project>.supabase.co/auth/v1/otp  →  500
{ "code": "unexpected_failure",
  "message": "Error sending confirmation email" }
```

The request was accepted and understood — the email address is fine, the user
row is created — and then the *send* failed. GoTrue reports every downstream
mail failure as this one opaque 500, so the message says nothing about the
cause. Nobody can sign in on any device while it lasts, which means nobody can
sync at all.

Candidates, most likely first:

1. **The built-in email service only delivers to project team members.**
   ❌ **Ruled out as the sole cause.** Project `txrqcnezmyfvjgeoawgv` has one
   member, `tania.shtrix15@gmail.com` (Owner), and signing in with that team
   address fails too — so the recipient is not what the mailer is objecting to.
   The restriction is real and still means no non-team address can receive a
   code without custom SMTP, but something else is failing first.
2. **The email template does not compile.** ⭐ **Leading candidate**, now that
   the recipient is ruled out. Adding `{{ .Token }}` by hand (which this app
   requires — see [13a](#13a-the-otp-email-has-no-code-in-it)) is easy to get
   wrong; a malformed Go template throws at render time and surfaces as this
   same 500, for every recipient equally.
3. **Custom SMTP is configured and broken** — wrong credentials, an unverified
   sender address, or a blocked port.
4. **The project is restricted** — auth email sending is suspended after a high
   bounce rate, or the built-in mailer is disabled for the project outright.
   Supabase has been tightening the free built-in service; on some projects it
   now fails for every address until custom SMTP is set.

— and since custom SMTP was switched on (Brevo, 2026-09-12), 3 is the one that
applies. Its three classic causes, all silent and all reported as the same 500:
the username is not the provider's SMTP login, the password is an API key rather
than an SMTP key, or the sender address is not verified with the provider.

**Observed so far:**

- The 500 is identical for a non-team address (`tetiana.kozlovska15@gmail.com`)
  and for the Owner's own address (`tania.shtrix15@gmail.com`). A failure that
  does not care who the recipient is is a failure before delivery.
- **Resolved by the Auth Logs**, which name the SMTP error the 500 hides. Two
  in sequence: `535 "5.7.8 Authentication failed"` while the username/key were
  wrong, then `525 "5.7.1 Unauthorized IP address"` once they were right —
  Brevo authenticates the login and then refuses the connection because the
  sending IP is not on its authorised list. Fix is in Brevo (Security →
  Authorised IPs), not in Supabase and not in the app.
- **Leave Brevo's SMTP IP allowlist deactivated.** The address it blocks is
  Supabase's egress IP (`99.80.235.191`, AWS eu-west-1 — the project region),
  not any client's: mail is sent server-side, so Android, iOS and web all leave
  from the same address. Supabase does not guarantee that address, so an
  allowlist turns any infrastructure change on their side into a silent
  sign-in outage here — and by [16](#16-a-signed-in-device-never-reports-a-failing-sync)
  nothing in the app would report it.
- **Do not read Brevo's `Last used on` column as "never contacted".** It only
  records successful sends, so it stays `--` through every failed connection.
  It cost a wrong diagnosis here (template blamed, reset, no effect).

How to tell the rest apart:

- Dashboard → Logs → Auth Logs. The underlying render/SMTP error is there in
  full; the 500 the client sees is the sanitised version.
- Go to Auth Logs **first**. Every other signal here — recipient, provider
  dashboard, template — was ambiguous or actively misleading, and the log had
  the SMTP status code in it the whole time. Three wrong hypotheses were chased
  before anyone opened it.
- Bisect by template only if the log points there: reset the Magic Link template
  to the Supabase default and retry. If mail sends (a link, no code — useless
  to the app, but proof), the hand-added `{{ .Token }}` was malformed.

The durable fix is custom SMTP (Resend, Postmark, SendGrid). The built-in
service is not meant to carry real sign-ins, and it is the same limitation
behind [14](#14-supabases-built-in-mailer-rate-limits-the-sign-in).

None of this is visible from the repo — it is all dashboard state — so a working
checkout gives no warning that sign-in is dead.

### 13a. The OTP email has no code in it

🔴 · open

Sign-in is `signInWithOtp` + `verifyOtp` with a typed code. Supabase only puts
the code in the mail when the Magic Link template renders `{{ .Token }}` — the
default template does not. Wrong template and every new user gets a link they
cannot use, and there is no path into the app at all.

This one fails *quietly*: the request returns 200, the mail arrives, and it is
simply unusable — unlike [13](#13-the-otp-email-never-sends-500-error-sending-confirmation-email),
which at least errors.

It is a dashboard setting, so nothing in the repo can prevent a regression;
`supabase/schema.sql` documents it in a comment.

### 14. Supabase's built-in mailer rate-limits the sign-in

🟡 · open

The default SMTP allows a couple of emails an hour per project. "Send a new
code" is one tap and offers no cooldown, so a user tapping it twice can lock
themselves out of sign-in for an hour.

This is a different failure from [13](#13-the-otp-email-never-sends-500-error-sending-confirmation-email)
and the status code is how to tell: a rate limit is `429`
`over_email_send_rate_limit`, a send failure is `500` `unexpected_failure`. Both
reach the user as one line of raw Supabase text under the button, so the screen
itself does not distinguish them.

### 16. A signed-in device never reports a failing sync

🟠 · open

This is what makes every other risk in this file worse.

- `useAutoSync`'s `autoSync` swallows every error — offline, expired session,
  poisoned pull, all of it — with a comment saying the sync screen reports what
  matters (`src/hooks/useCloudSync.ts`).
- The sync screen only shows an error after a *manual* "Sync now".
- Home renders its sync affordance only while `!cloudSync.signedIn`
  (`src/app/(tabs)/index.tsx:311`), so once signed in there is nothing on the
  main screen at all.

A device can fail every sync for weeks and look exactly like a device that is
perfectly in step. There is no "last synced" surface outside the settings
screen, no unsynced-changes count, and no retry or backoff — a failure just
waits five minutes and tries the same thing again.

---

## What this suggests, in order

1. Get email delivery working ([13](#13-the-otp-email-never-sends-500-error-sending-confirmation-email)).
   Nobody can sign in on any platform until the OTP mail sends, so nothing else
   about sync is testable. Auth Logs name the real cause; custom SMTP is the
   fix that stops it recurring.
2. Fix the wasm upload path ([1](#1-the-wasm-file-is-never-uploaded)) and ship
   the staged auth-storage split ([4](#4-the-auth-session-store-opens-a-second-database-on-web)) —
   web has no database at all until both land.
3. Surface failure ([16](#16-a-signed-in-device-never-reports-a-failing-sync)).
   Persist the last sync error and a dirty-row count; show them on Home when
   either is non-empty. Most of the rest of this list is invisible today, which
   is what makes it dangerous.
4. Quarantine rather than roll back ([5](#5-one-unwritable-row-poisons-every-future-pull),
   [6](#6-a-child-whose-parent-arrives-later-is-dropped-for-good)). Apply rows
   one savepoint at a time, park the ones that fail, and hold the cursor behind
   the oldest parked row.
5. Close the push races ([7](#7-an-edit-made-during-a-push-is-lost),
   [8](#8-an-old-app-version-erases-columns-it-has-never-heard-of)): clear
   `sync_dirty` only for rows whose `updated_at` still matches what was pushed,
   and merge `data` server-side instead of replacing it.
