/* global __dirname */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");
const { DatabaseSync } = require("node:sqlite");
const ts = require("typescript");

function load(relative, dependencies = {}) {
  const compiled = ts.transpileModule(fs.readFileSync(path.join(__dirname, "..", relative), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const exports = {};
  vm.runInNewContext(compiled, {
    exports, module: { exports }, Date, Promise, Set, Map,
    require: (name) => {
      assert.ok(name in dependencies, `Unexpected dependency: ${name}`);
      return dependencies[name];
    },
  }, { filename: relative });
  return exports;
}

async function fixture() {
  const sqlite = new DatabaseSync(":memory:");
  sqlite.exec("PRAGMA foreign_keys = ON; PRAGMA recursive_triggers = ON;");
  const db = {
    execAsync: async (sql) => sqlite.exec(sql),
    runAsync: async (sql, params = []) => sqlite.prepare(sql).run(...params),
    getFirstAsync: async (sql, params = []) => sqlite.prepare(sql).get(...params) ?? null,
    getAllAsync: async (sql, params = []) => sqlite.prepare(sql).all(...params),
    withTransactionAsync: async (task) => {
      sqlite.exec("BEGIN");
      try { await task(); sqlite.exec("COMMIT"); }
      catch (error) { sqlite.exec("ROLLBACK"); throw error; }
    },
  };
  const { migrations } = load("src/db/migrations.ts", { "./seeds": load("src/db/seeds.ts") });
  // Exercise the upgrade with content already present in the v24 database.
  for (const migration of migrations.filter((entry) => entry.toVersion <= 24)) await migration.up(db);
  sqlite.exec(`
    INSERT INTO dreams (id, title) VALUES (1, 'Calm evenings'), (2, 'Healthy skin'), (3, 'New dream');
    INSERT INTO milestones (id, dream_id, sequence_number, title, status) VALUES
      (11, 1, 0, 'Evening routine', 'completed'),
      (12, 1, 1, 'Restful sleep', 'active'),
      (21, 2, 0, 'Daily care', 'active');
    INSERT INTO quests (milestone_id, title, is_active, is_done) VALUES
      (11, 'Read', 1, 1), (11, 'Unwind', 1, 0), (11, 'Retired quest', 0, 1),
      (12, 'Sleep on time', 1, 0), (21, 'Hydrate', 1, 1);
  `);
  for (const migration of migrations.filter((entry) => entry.toVersion > 24)) await migration.up(db);
  const repository = load("src/db/dreamsRepository.ts", {
    "./database": { getDatabase: async () => db },
    "@/subscription/entitlements": {},
    "@/subscription/store": {},
  });
  return { sqlite, repository, close: () => sqlite.close() };
}

test("existing dreams default to the first milestone, including a completed first milestone", async () => {
  const app = await fixture();
  try {
    const summaries = await app.repository.getDreamSummaries();
    const dream = summaries.find((row) => row.id === 1);
    assert.equal(dream.currentMilestoneId, 11);
    assert.equal(dream.currentMilestone, "Evening routine");
    assert.equal(dream.milestoneCompletedQuests, 1);
    assert.equal(dream.milestoneTotalQuests, 2, "Inactive quests must not enter the milestone bar");
    assert.equal(dream.progressPercent, 50, "Completed milestones retain their full share of dream progress");
    assert.equal(await app.repository.getActiveMilestoneId(1), 11);
    const empty = summaries.find((row) => row.id === 3);
    assert.equal(empty.currentMilestoneId, null);
    assert.equal(empty.currentMilestone, null);
    assert.equal(empty.milestoneTotalQuests, 0);
    assert.equal(empty.progressPercent, 0);
  } finally { app.close(); }
});

test("choosing a milestone persists its stable identity and changes only the milestone bar", async () => {
  const app = await fixture();
  try {
    app.sqlite.exec("UPDATE dreams SET sync_dirty = 0");
    await app.repository.setActiveMilestone(1, 12);
    const stored = app.sqlite.prepare("SELECT active_milestone_uid, sync_dirty FROM dreams WHERE id = 1").get();
    const milestone = app.sqlite.prepare("SELECT uid FROM milestones WHERE id = 12").get();
    assert.equal(stored.active_milestone_uid, milestone.uid);
    assert.equal(stored.sync_dirty, 1, "The choice must be queued for cloud sync");
    assert.equal(await app.repository.getActiveMilestoneId(1), 12);
    const [dream] = await app.repository.getDreamSummaries();
    assert.equal(dream.currentMilestone, "Restful sleep");
    assert.equal(dream.milestoneCompletedQuests, 0);
    assert.equal(dream.milestoneTotalQuests, 1);
    assert.equal(dream.progressPercent, 50);
    assert.equal(await app.repository.getActiveMilestoneId(2), 21, "Other dreams retain their selection");
    // Renumbering local ids (as on another device) must preserve the selection.
    app.sqlite.exec("UPDATE quests SET milestone_id = 11 WHERE milestone_id = 12; UPDATE milestones SET id = 120 WHERE id = 12;");
    assert.equal(await app.repository.getActiveMilestoneId(1), 120);
  } finally { app.close(); }
});

test("deleted and invalid selections fall back safely without crossing dreams", async () => {
  const app = await fixture();
  try {
    await assert.rejects(app.repository.setActiveMilestone(1, 21), /no longer available/);
    await assert.rejects(app.repository.setActiveMilestone(1, 999), /no longer available/);
    await app.repository.setActiveMilestone(1, 12);
    app.sqlite.exec("DELETE FROM milestones WHERE id = 12");
    assert.equal(await app.repository.getActiveMilestoneId(1), 11);
    const [dream] = await app.repository.getDreamSummaries();
    assert.equal(dream.currentMilestone, "Evening routine");
    app.sqlite.exec("UPDATE dreams SET active_milestone_uid = (SELECT uid FROM milestones WHERE id = 21) WHERE id = 1");
    assert.equal(await app.repository.getActiveMilestoneId(1), 11);
    app.sqlite.exec("DELETE FROM milestones WHERE dream_id = 1");
    assert.equal(await app.repository.getActiveMilestoneId(1), null);
  } finally { app.close(); }
});
