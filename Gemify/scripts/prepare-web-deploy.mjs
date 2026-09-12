// Post-processes `expo export` output so Cloudflare Pages can actually serve it.
//
// Two problems, both invisible until the deployed app is opened on a phone:
//
//  1. Metro writes assets under a path that mirrors where they came from, so
//     expo-sqlite's wasm lands in `dist/assets/node_modules/...`. Wrangler's
//     Pages uploader carries a hardcoded ignore list that includes
//     `**/node_modules`, so that file is silently left behind. The deployed app
//     then fetches it, gets Cloudflare's 404 page, and tries to compile HTML as
//     WebAssembly ("module doesn't start with '\0asm'") — which leaves the app
//     with no database at all.
//
//  2. The rewrite in (1) changes the *contents* of a content-hashed bundle
//     without changing its *name*, and the service worker is cache-first for
//     hashed assets. An installed PWA would keep serving the old bundle, still
//     pointing at the old path. Stamping the cache name per build is what
//     retires it — and it fixes the more general case too, where shipping any
//     fix required remembering to bump the constant by hand.
//
// Run automatically as part of `npm run build:web`.

import { cp, readdir, readFile, rename, rm, stat, writeFile } from "node:fs/promises";
import { join } from "node:path";

const DIST = "dist";
/** Metro's path for it, and the name we move it to. */
const IGNORED_DIR = "assets/node_modules";
const SERVED_DIR = "assets/vendor";
/** Files whose contents may carry the path. */
const TEXT_FILE = /\.(js|html|json|css|map)$/;

async function main() {
  await moveIgnoredAssets();
  const rewritten = await rewriteReferences();
  await stampServiceWorker();

  console.log(
    `prepare-web-deploy: ${IGNORED_DIR} -> ${SERVED_DIR}, ` +
      `${rewritten} file(s) rewritten`,
  );
}

/**
 * Moves the assets wrangler refuses to upload. Missing means either a build
 * that never produced them or a second run over the same dist — both fine.
 */
async function moveIgnoredAssets() {
  const from = join(DIST, IGNORED_DIR);
  if (!(await exists(from))) return;

  const to = join(DIST, SERVED_DIR);
  try {
    await rename(from, to);
  } catch (cause) {
    // Windows refuses to rename a directory anything else has a handle on —
    // an indexer or a virus scanner walking a fresh build is enough. Copying
    // and then deleting gets there anyway.
    if (cause.code !== "EPERM" && cause.code !== "EXDEV") throw cause;
    await cp(from, to, { force: true, recursive: true });
    await rm(from, { force: true, recursive: true });
  }
}

/** Repoints every reference at the new path. Returns the file count. */
async function rewriteReferences() {
  let rewritten = 0;

  for await (const file of walk(DIST)) {
    if (!TEXT_FILE.test(file)) continue;

    const before = await readFile(file, "utf8");
    const after = before.replaceAll(`${IGNORED_DIR}/`, `${SERVED_DIR}/`);
    if (after === before) continue;

    await writeFile(file, after);
    rewritten += 1;
  }

  return rewritten;
}

/**
 * Gives the service worker a cache name unique to this build, so a deploy
 * retires the previous one instead of an installed PWA holding onto it.
 */
async function stampServiceWorker() {
  const file = join(DIST, "sw.js");
  if (!(await exists(file))) return;

  const source = await readFile(file, "utf8");
  const stamped = source.replace(
    /const CACHE = "[^"]*"/,
    `const CACHE = "gemify-${Date.now().toString(36)}"`,
  );
  if (stamped !== source) await writeFile(file, stamped);
}

async function* walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) yield* walk(path);
    else yield path;
  }
}

async function exists(path) {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

await main();
