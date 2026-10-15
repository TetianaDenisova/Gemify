/* global __dirname */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");
const ts = require("typescript");

function fixture() {
  let state;
  let changed;
  let dependencies;
  let pendingEffect;
  let cleanup;
  const reads = [];
  const writes = [];
  const compiled = ts.transpileModule(
    fs.readFileSync(path.join(__dirname, "../src/hooks/useOncePerDay.ts"), "utf8"),
    { compilerOptions: { module: ts.ModuleKind.CommonJS } },
  ).outputText;
  const exports = {};
  const mocks = {
    react: {
      useCallback: (callback) => callback,
      useState: (initial) => {
        state ??= initial;
        return [state, (next) => { state = next; changed = true; }];
      },
      useEffect: (callback, nextDependencies) => {
        if (!dependencies || dependencies[0] !== nextDependencies[0]) {
          pendingEffect = { callback, dependencies: nextDependencies };
        }
      },
    },
    "@/db": {
      getSetting: (key) => new Promise((resolve) => reads.push({ key, resolve })),
      setSetting: async (key, day) => { writes.push({ key, day }); },
    },
    "@/utils/dates": { todayKey: () => "2026-10-11" },
  };
  vm.runInNewContext(compiled, {
    exports, console,
    require: (name) => {
      assert.ok(name in mocks, `Unexpected dependency: ${name}`);
      return mocks[name];
    },
  });
  return {
    reads, writes,
    render(key) {
      let result;
      let attempts = 0;
      do {
        changed = false;
        pendingEffect = null;
        result = exports.useOncePerDay(key);
        assert.ok(++attempts < 10, "Hook must settle after a key change");
      } while (changed);
      if (pendingEffect) {
        cleanup?.();
        dependencies = pendingEffect.dependencies;
        cleanup = pendingEffect.callback();
      }
      return result;
    },
  };
}

test("daily prompt waits for storage and suppresses a flag already seen today", async () => {
  const app = fixture();
  assert.equal(app.render("intro:1").due, false);
  app.reads[0].resolve("2026-10-11");
  await Promise.resolve();
  assert.equal(app.render("intro:1").due, false);
});

test("switching daily prompt keys resets the flag until the new read completes", async () => {
  const app = fixture();
  app.render("intro:1");
  app.reads[0].resolve(null);
  await Promise.resolve();
  assert.equal(app.render("intro:1").due, true);

  assert.equal(app.render("intro:2").due, false);
  assert.equal(app.render("intro:1").due, false);
  app.reads[1].resolve(null);
  await Promise.resolve();
  assert.equal(app.render("intro:1").due, false);

  app.reads[2].resolve("2026-10-10");
  await Promise.resolve();
  assert.equal(app.render("intro:1").due, true);
});

test("an empty daily prompt key disables storage and ignores a stale read", async () => {
  const app = fixture();
  app.render("intro:1");
  const disabled = app.render("");
  assert.equal(disabled.due, false);
  await disabled.markSeen();
  assert.equal(app.reads.length, 1);
  assert.equal(app.writes.length, 0);
  app.reads[0].resolve(null);
  await Promise.resolve();
  assert.equal(app.render("").due, false);
});

test("marking a daily prompt seen closes it and persists today's date", async () => {
  const app = fixture();
  app.render("overdue_prompt");
  app.reads[0].resolve(null);
  await Promise.resolve();
  const prompt = app.render("overdue_prompt");
  assert.equal(prompt.due, true);
  await prompt.markSeen();
  assert.equal(app.render("overdue_prompt").due, false);
  assert.equal(app.writes[0].key, "overdue_prompt");
  assert.equal(app.writes[0].day, "2026-10-11");
});
