/* global __dirname */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");
const ts = require("typescript");

function fixture(storage = new Map()) {
  const states = [];
  let cursor = 0;
  let onFocus;
  let cleanup;
  let failWrite = false;
  let holdRead = false;
  let releaseRead;
  const compiled = ts.transpileModule(
    fs.readFileSync(path.join(__dirname, "../src/hooks/useHomePreferences.ts"), "utf8"),
    { compilerOptions: { module: ts.ModuleKind.CommonJS } },
  ).outputText;
  const exports = {};
  const dependencies = {
    react: {
      useCallback: (callback) => callback,
      useState: (initial) => {
        const index = cursor++;
        if (!(index in states)) states[index] = initial;
        return [states[index], (value) => { states[index] = value; }];
      },
      useRef: (initial) => {
        const index = cursor++;
        if (!(index in states)) states[index] = { current: initial };
        return states[index];
      },
    },
    "expo-router": { useFocusEffect: (callback) => { onFocus = callback; } },
    "@/db": {
      getSetting: async (key) => {
        const value = storage.get(key) ?? null;
        if (holdRead) await new Promise((resolve) => { releaseRead = resolve; });
        return value;
      },
      setSetting: async (key, value) => {
        if (failWrite) throw new Error("Storage unavailable");
        storage.set(key, value);
      },
    },
  };
  vm.runInNewContext(compiled, {
    exports,
    require: (name) => {
      assert.ok(name in dependencies, `Unexpected dependency: ${name}`);
      return dependencies[name];
    },
  });
  const flush = () => new Promise(setImmediate);
  return {
    render() { cursor = 0; return exports.useHomePreferences(); },
    async focus() { cleanup?.(); cleanup = onFocus(); await flush(); },
    async releaseRead() { releaseRead(); await flush(); },
    failWrites() { failWrite = true; },
    holdReads() { holdRead = true; },
  };
}

test("milestones show by default and the Profile choice survives a fresh Home mount", async () => {
  const storage = new Map();
  const profile = fixture(storage);
  assert.equal(profile.render().loading, true);
  await profile.focus();
  assert.equal(profile.render().showActiveMilestone, true);
  await profile.render().updateShowActiveMilestone(false);
  assert.equal(profile.render().showActiveMilestone, false);

  const home = fixture(storage);
  home.render();
  await home.focus();
  assert.equal(home.render().showActiveMilestone, false);

  await profile.render().updateShowActiveMilestone(true);
  await home.focus();
  assert.equal(home.render().showActiveMilestone, true);
});

test("a failed save restores the switch and reports the error without changing storage", async () => {
  const app = fixture();
  app.render();
  await app.focus();
  app.failWrites();
  const save = app.render().updateShowActiveMilestone(false);
  assert.equal(app.render().saving, true);
  assert.equal(app.render().showActiveMilestone, false);
  await save;
  assert.equal(app.render().showActiveMilestone, true);
  assert.equal(app.render().saving, false);
  assert.match(app.render().error, /Could not save/);
});

test("a stale focus read cannot overwrite a newer saved choice", async () => {
  const app = fixture();
  app.render();
  await app.focus();
  app.holdReads();
  await app.focus();
  await app.render().updateShowActiveMilestone(false);
  await app.releaseRead();
  assert.equal(app.render().showActiveMilestone, false);
});
