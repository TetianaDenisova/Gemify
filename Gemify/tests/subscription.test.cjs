/* global __dirname */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");
const ts = require("typescript");
const { DatabaseSync } = require("node:sqlite");

function load(relative, dependencies, globals = {}) {
  const source = fs.readFileSync(path.join(__dirname, "..", relative), "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const exports = {};
  vm.runInNewContext(compiled, {
    exports, module: { exports }, Error, Date, Promise, Set, console,
    require: (name) => {
      assert.ok(name in dependencies, `Unexpected dependency: ${name}`);
      return dependencies[name];
    },
    ...globals,
  }, { filename: relative });
  return exports;
}

function fixture({ testMode = false, platform = "ios" } = {}) {
  let callbacks;
  let foreground;
  const counters = { connect: 0, buy: 0, restore: 0, manage: 0 };
  const timers = [];
  let status = { active: false, expiresAt: null, willRenew: null };
  let failure = null;
  let priceFailure = null;
  let purchaseFailure = null;
  const billing = {
    connectBilling: async (next) => { counters.connect++; callbacks = next; if (failure) throw failure; },
    readBillingStatus: async () => { if (failure) throw failure; return status; },
    readBillingPrice: async () => { if (priceFailure) throw priceFailure; return "$14.00"; },
    purchasePremium: async () => {
      counters.buy++;
      if (purchaseFailure) {
        callbacks.onError(purchaseFailure, purchaseFailure.code === "user-cancelled");
        throw purchaseFailure;
      }
    },
    isPurchaseCancelled: (error) => error?.code === "user-cancelled",
    restorePremium: async () => { counters.restore++; if (failure) throw failure; },
    managePremium: async () => { counters.manage++; },
  };
  const store = load("src/subscription/store.ts", {
    "react-native": { Platform: { OS: platform }, AppState: { addEventListener: (_event, listener) => {
      foreground = listener;
      return { remove() {} };
    } } },
    "./billing": billing,
    "./config": { PREMIUM_TEST_MODE: testMode },
  }, { setTimeout: (action) => { timers.push(action); return timers.length; }, clearTimeout() {} });
  const entitlements = load("src/subscription/entitlements.ts", { "./store": store });
  return {
    store, entitlements, counters, timers,
    setStatus: (next) => { status = next; },
    setFailure: (error) => { failure = error; },
    setPriceFailure: (error) => { priceFailure = error; },
    setPurchaseFailure: (error) => { purchaseFailure = error; },
    callback: () => callbacks,
    foreground: () => foreground("active"),
  };
}

test("a release test build starts Premium without touching Apple billing", async () => {
  const f = fixture({ testMode: true });
  await f.store.initializeSubscription();
  await f.entitlements.requirePremium();
  await f.entitlements.requireCreationAllowance("dream", 20);
  assert.equal(f.store.getSubscriptionState().source, "test");
  assert.equal(f.counters.connect, 0);
});

test("test switch changes all entitlements and upgrade never requests payment", async () => {
  const f = fixture({ testMode: true });
  f.store.setTestPremium(false);
  await f.entitlements.requireCreationAllowance("habit", 0);
  await assert.rejects(f.entitlements.requireCreationAllowance("habit", 1), /Basic includes 1/);
  await assert.rejects(f.entitlements.requirePremium(), /Upgrade to Premium/);
  await f.store.upgradeSubscription();
  await f.store.restoreSubscription();
  await f.store.manageSubscription();
  assert.equal(f.store.getSubscriptionState().premium, true);
  assert.deepEqual(f.counters, { connect: 0, buy: 0, restore: 0, manage: 0 });
});

test("the test override cannot be enabled in a normal build", async () => {
  const f = fixture();
  assert.throws(() => f.store.setTestPremium(true), /disabled/);
  await assert.rejects(f.entitlements.requireCreationAllowance("dream", 1), /Basic includes 1 active dream/);
  assert.equal(f.store.getSubscriptionState().premium, false);
});

test("purchase dispatch and cancellation do not grant Premium", async () => {
  const f = fixture();
  await f.store.upgradeSubscription();
  assert.equal(f.counters.buy, 1);
  assert.equal(f.store.getSubscriptionState().premium, false);
  f.callback().onError(new Error("Canceled"), true);
  assert.equal(f.store.getSubscriptionState().busy, false);
  assert.equal(f.store.getSubscriptionState().error, null);
});

test("verified purchase and restore update entitlement; canceled renewal stays active", async () => {
  const f = fixture();
  await f.store.initializeSubscription();
  f.setStatus({ active: true, expiresAt: Date.now() + 60_000, willRenew: false });
  assert.equal(await f.store.restoreSubscription(), true);
  assert.equal(f.store.getSubscriptionState().source, "apple");
  assert.equal(f.store.getSubscriptionState().willRenew, false);
  await f.entitlements.requireCreationAllowance("dream", 10);
});

test("Apple cancellation returned through both the promise and listener stays silent", async () => {
  const f = fixture();
  f.setPurchaseFailure(Object.assign(new Error("User canceled"), { code: "user-cancelled" }));
  await f.store.upgradeSubscription();
  assert.equal(f.store.getSubscriptionState().error, null);
  assert.equal(f.store.getSubscriptionState().busy, false);
  assert.equal(f.store.getSubscriptionState().premium, false);
});

test("connection failure is retryable and never grants Premium", async () => {
  const f = fixture();
  f.setFailure(new Error("App Store offline"));
  await f.store.initializeSubscription();
  assert.equal(f.store.getSubscriptionState().error, "App Store offline");
  assert.equal(f.store.getSubscriptionState().premium, false);
  f.setFailure(null);
  await f.store.refreshSubscription();
  assert.equal(f.counters.connect, 2);
  assert.equal(f.store.getSubscriptionState().error, null);
});

test("an expired paid subscription loses access even if Apple refresh fails", async () => {
  const f = fixture();
  f.setStatus({ active: true, expiresAt: Date.now() - 1, willRenew: false });
  await f.store.initializeSubscription();
  f.setFailure(new Error("Offline"));
  await f.store.refreshSubscription();
  assert.equal(f.store.getSubscriptionState().premium, false);
});

test("a product lookup failure does not hide a valid existing subscription", async () => {
  const f = fixture();
  f.setStatus({ active: true, expiresAt: Date.now() + 60_000, willRenew: true });
  f.setPriceFailure(new Error("Product unavailable"));
  await f.store.initializeSubscription();
  assert.equal(f.store.getSubscriptionState().premium, true);
  assert.equal(f.counters.connect, 1);
  assert.equal(f.store.getSubscriptionState().error, "Product unavailable");
});

test("web production stays Basic and never initializes native billing", async () => {
  const f = fixture({ platform: "web" });
  await f.store.initializeSubscription();
  assert.equal(f.store.getSubscriptionState().ready, true);
  assert.equal(f.store.getSubscriptionState().premium, false);
  assert.equal(f.counters.connect, 0);
});

test("iOS billing filters inactive, expired and unrelated subscriptions", async () => {
  const native = load("src/subscription/billing.ios.ts", {
    "./config": { PREMIUM_PRODUCT_ID: "premium" },
    "expo-iap": { getActiveSubscriptions: async () => [
      { productId: "unrelated", isActive: true },
      { productId: "premium", isActive: false },
      { productId: "premium", isActive: true, expirationDateIOS: Date.now() - 1 },
    ] },
  });
  assert.equal((await native.readBillingStatus()).active, false);
});

function repositories(testMode) {
  const f = fixture({ testMode });
  const database = new DatabaseSync(":memory:");
  database.exec(`
    CREATE TABLE dreams (
      id INTEGER PRIMARY KEY, seed_key TEXT, title TEXT, vision_statement TEXT,
      photo_uri TEXT, photo_remote_key TEXT, photo_focus_x REAL DEFAULT 0.5,
      photo_focus_y REAL DEFAULT 0.5, photo_scale REAL DEFAULT 1,
      is_archived INTEGER DEFAULT 0, is_completed INTEGER DEFAULT 0, completed_at TEXT,
      active_milestone_uid TEXT
    );
    CREATE TABLE habits (
      id INTEGER PRIMARY KEY, dream_id INTEGER, title TEXT, cue TEXT, time_block_key TEXT,
      time_of_day TEXT, goal_days INTEGER, is_archived INTEGER DEFAULT 0, is_completed INTEGER DEFAULT 0
    );
  `);
  const db = {
    withTransactionAsync: async (task) => task(),
    runAsync: async (sql, values = []) => {
      const result = database.prepare(sql).run(...(Array.isArray(values) ? values : [values]));
      return { changes: result.changes, lastInsertRowId: result.lastInsertRowid };
    },
    getFirstAsync: async (sql, values = []) => database.prepare(sql).get(...(Array.isArray(values) ? values : [values])),
    getAllAsync: async (sql, values = []) => database.prepare(sql).all(...(Array.isArray(values) ? values : [values])),
  };
  const dependencies = {
    "./database": { getDatabase: async () => db },
    "@/subscription/entitlements": f.entitlements,
    "@/subscription/store": f.store,
  };
  const dreams = load("src/db/dreamsRepository.ts", dependencies);
  const habits = load("src/db/habitsRepository.ts", dependencies);
  const quests = load("src/db/questsRepository.ts", { "./database": dependencies["./database"] });
  return { ...f, database, dreams, habits, quests };
}

test("SQLite Basic limit rejects concurrent dream creation without inserting a second record", async () => {
  const f = repositories(false);
  try {
    const outcomes = await Promise.allSettled([
      f.dreams.createDream({ title: "First" }), f.dreams.createDream({ title: "Second" }),
    ]);
    assert.equal(outcomes.filter((outcome) => outcome.status === "fulfilled").length, 1);
    assert.equal(f.database.prepare("SELECT COUNT(*) AS count FROM dreams").get().count, 1);
  } finally { f.database.close(); }
});

test("SQLite test Premium allows multiple records; Basic downgrade preserves and limits them", async () => {
  const f = repositories(true);
  try {
    const first = await f.dreams.createDream({ title: "First" });
    await f.dreams.createDream({ title: "Second" });
    await f.habits.createHabit({ title: "One", dreamId: first.id });
    await f.habits.createHabit({ title: "Two", dreamId: first.id });
    f.store.setTestPremium(false);
    await assert.rejects(f.habits.createHabit({ title: "Three", dreamId: first.id }), /Basic includes 1 active habit/);
    assert.equal((await f.dreams.getDreams()).length, 2);
    assert.equal((await f.habits.getHabits()).length, 2);
    await f.habits.updateHabit(1, { isCompleted: true });
    await assert.rejects(f.habits.updateHabit(1, { isCompleted: false }), /Basic includes 1 active habit/);
    assert.equal((await f.habits.getHabitById(1)).isCompleted, true);
  } finally { f.database.close(); }
});

test("archiving preserves a dream's journey and restoration returns it to Home summaries", async () => {
  const f = repositories(true);
  try {
    f.database.exec(`
      CREATE TABLE milestones (id INTEGER PRIMARY KEY, dream_id INTEGER, title TEXT, status TEXT, sequence_number INTEGER, uid TEXT);
      CREATE TABLE quests (id INTEGER PRIMARY KEY, milestone_id INTEGER, is_done INTEGER, is_active INTEGER);
    `);
    const dream = await f.dreams.createDream({ title: "Learn piano", visionStatement: "Play my favorite song" });
    const other = await f.dreams.createDream({ title: "Travel" });
    f.database.prepare("INSERT INTO milestones VALUES (1, ?, 'First song', 'active', 0, 'first-song')").run(dream.id);
    f.database.exec("INSERT INTO quests VALUES (1, 1, 1, 1), (2, 1, 0, 1)");
    await f.habits.createHabit({ title: "Practice", dreamId: dream.id });
    const before = (await f.dreams.getDreamSummaries()).find((item) => item.id === dream.id);

    await f.dreams.updateDream(dream.id, { isArchived: true });
    assert.deepEqual(Array.from(await f.dreams.getDreamSummaries(), (item) => item.id), [other.id]);
    const archived = await f.dreams.getArchivedDreams();
    assert.deepEqual(Array.from(archived, (item) => item.id), [dream.id]);
    assert.equal(archived[0].visionStatement, "Play my favorite song");
    assert.equal((await f.habits.getHabitById(1)).dreamId, dream.id);

    await f.dreams.updateDream(dream.id, { isArchived: false, isCompleted: false });
    assert.equal((await f.dreams.getArchivedDreams()).length, 0);
    const restored = (await f.dreams.getDreamSummaries()).find((item) => item.id === dream.id);
    assert.deepEqual(restored, before);
    assert.equal(restored.progressPercent, 50);
  } finally { f.database.close(); }
});

test("Basic restoration keeps a dream archived at the limit and succeeds when a slot is free", async () => {
  const f = repositories(false);
  try {
    const first = await f.dreams.createDream({ title: "First" });
    await f.dreams.updateDream(first.id, { isArchived: true });
    const second = await f.dreams.createDream({ title: "Second" });
    await assert.rejects(
      f.dreams.updateDream(first.id, { isArchived: false, isCompleted: false }),
      /Basic includes 1 active dream/,
    );
    assert.equal((await f.dreams.getDreamById(first.id)).isArchived, true);
    await f.dreams.updateDream(second.id, { isArchived: true });
    await f.dreams.updateDream(first.id, { isArchived: false, isCompleted: false });
    assert.deepEqual(Array.from(await f.dreams.getDreams(), (item) => item.id), [first.id]);
  } finally { f.database.close(); }
});

test("restoring an archived completed dream makes it active again", async () => {
  const f = repositories(false);
  try {
    const dream = await f.dreams.createDream({ title: "Restart" });
    await f.dreams.updateDream(dream.id, { isArchived: true, isCompleted: true });
    await f.dreams.updateDream(dream.id, { isArchived: false, isCompleted: false });
    const restored = (await f.dreams.getDreams())[0];
    assert.equal(restored.id, dream.id);
    assert.equal(restored.isCompleted, false);
    assert.equal(restored.completedAt, null);
    assert.equal((await f.dreams.getArchivedDreams()).length, 0);
  } finally { f.database.close(); }
});

test("dream archive hides related quests and habits across boards and restores their original state", async () => {
  const f = repositories(true);
  try {
    f.database.exec(`
      CREATE TABLE milestones (id INTEGER PRIMARY KEY, dream_id INTEGER, title TEXT, sequence_number INTEGER);
      CREATE TABLE quests (
        id INTEGER PRIMARY KEY, milestone_id INTEGER, title TEXT, is_active INTEGER,
        is_done INTEGER, created_at TEXT, scheduled_date TEXT, scheduled_time TEXT,
        is_planned INTEGER, completed_at TEXT
      );
    `);
    const dream = await f.dreams.createDream({ title: "Archive me" });
    const other = await f.dreams.createDream({ title: "Keep visible" });
    f.database.prepare("INSERT INTO milestones VALUES (1, ?, 'First', 0), (2, ?, 'Second', 0)").run(dream.id, other.id);
    f.database.exec(`
      INSERT INTO quests VALUES
        (1, 1, 'Scheduled', 1, 0, '2026-10-01', '2026-10-14', '09:00', 1, NULL),
        (2, 1, 'Done', 1, 1, '2026-10-01', '2026-10-14', NULL, 1, '2026-10-14'),
        (3, 1, 'Available', 1, 0, '2026-10-01', NULL, NULL, 0, NULL),
        (4, 1, 'Backlog', 1, 0, '2026-10-01', NULL, NULL, 1, NULL),
        (5, 2, 'Other scheduled', 1, 0, '2026-10-01', '2026-10-14', NULL, 1, NULL),
        (6, 2, 'Other available', 1, 0, '2026-10-01', NULL, NULL, 0, NULL),
        (7, 2, 'Other backlog', 1, 0, '2026-10-01', NULL, NULL, 1, NULL);
    `);
    const habit = await f.habits.createHabit({ dreamId: dream.id, title: "Practice" });
    const ownArchived = await f.habits.createHabit({ dreamId: dream.id, title: "Already archived" });
    const completed = await f.habits.createHabit({ dreamId: dream.id, title: "Already completed" });
    const otherHabit = await f.habits.createHabit({ dreamId: other.id, title: "Other practice" });
    await f.habits.updateHabit(ownArchived.id, { isArchived: true });
    await f.habits.updateHabit(completed.id, { isCompleted: true });

    const ids = (rows) => Array.from(rows, (row) => row.id);
    const reads = [
      () => f.quests.getScheduledQuests("2026-10-14"),
      () => f.quests.getSchedulableQuests(),
      () => f.quests.getUnscheduledQuests(),
      () => f.quests.getOverdueQuests("2026-10-15"),
      () => f.quests.getQuests(1),
      () => f.quests.getQuestsByDream(dream.id),
      () => f.quests.getQuestsForActiveDreams(),
      () => f.habits.getHabits(),
      () => f.habits.getHabitsByDream(dream.id),
      () => f.habits.getCompletedHabits(),
    ];
    const before = await Promise.all(reads.map(async (read) => ids(await read())));
    assert.deepEqual(before, [[1, 2, 5], [3, 6], [4, 7], [1, 5], [1, 2, 3, 4],
      [1, 2, 3, 4], [1, 2, 3, 4, 5, 6, 7], [habit.id, otherHabit.id], [habit.id], [completed.id]]);
    const questSnapshot = f.database.prepare("SELECT * FROM quests ORDER BY id").all();
    const habitSnapshot = f.database.prepare("SELECT * FROM habits ORDER BY id").all();

    await f.dreams.updateDream(dream.id, { isArchived: true });
    const hidden = await Promise.all(reads.map(async (read) => ids(await read())));
    assert.deepEqual(hidden, [[5], [6], [7], [5], [], [], [5, 6, 7], [otherHabit.id], [], []]);
    assert.equal((await f.quests.getScheduledQuestCounts("2026-10-01", "2026-10-31")).get("2026-10-14"), 1);
    assert.deepEqual(f.database.prepare("SELECT * FROM quests ORDER BY id").all(), questSnapshot);
    assert.deepEqual(f.database.prepare("SELECT * FROM habits ORDER BY id").all(), habitSnapshot);

    await f.dreams.updateDream(dream.id, { isArchived: false });
    assert.deepEqual(await Promise.all(reads.map(async (read) => ids(await read()))), before);
    assert.equal((await f.quests.getScheduledQuestCounts("2026-10-01", "2026-10-31")).get("2026-10-14"), 3);

    // Background overdue cleanup must leave archived schedules untouched.
    await f.dreams.updateDream(dream.id, { isArchived: true });
    assert.equal(await f.quests.rolloverOverdueQuests("2026-10-15"), 1);
    assert.deepEqual(f.database.prepare("SELECT * FROM quests WHERE milestone_id = 1 ORDER BY id").all(), questSnapshot.slice(0, 4));
    await f.dreams.updateDream(dream.id, { isArchived: false });
    assert.deepEqual(ids(await f.quests.getOverdueQuests("2026-10-15")), [1]);
  } finally { f.database.close(); }
});

function deleteEndpoint({ signedIn = true, removeFails = false } = {}) {
  let handler;
  const removed = [];
  const deleted = [];
  const admin = {
    auth: {
      getUser: async () => ({ data: { user: signedIn ? { id: "owner-id" } : null }, error: null }),
      admin: { deleteUser: async (id) => { deleted.push(id); return { error: null }; } },
    },
    storage: { from: () => ({
      list: async (folder) => ({ data: folder === "owner-id" ? [{ id: "photo-id", name: "photo.png" }] : [], error: null }),
      remove: async (files) => { removed.push(...files); return { error: removeFails ? new Error("Storage offline") : null }; },
    }) },
  };
  load("supabase/functions/delete-account/index.ts", {
    "npm:@supabase/supabase-js@2.116.0": { createClient: () => admin },
  }, { Deno: { env: { get: () => "fixture" }, serve: (next) => { handler = next; } }, Response });
  return { handler, removed, deleted };
}

test("account deletion authenticates before performing any destructive action", async () => {
  const f = deleteEndpoint({ signedIn: false });
  const response = await f.handler(new Request("https://local/delete-account", {
    method: "POST", headers: { Authorization: "Bearer invalid" }, body: JSON.stringify({ confirmation: "DELETE" }),
  }));
  assert.equal(response.status, 401);
  assert.deepEqual(f.removed, []);
  assert.deepEqual(f.deleted, []);
});

test("account deletion ignores an attacker-supplied user ID and removes only caller files", async () => {
  const f = deleteEndpoint();
  const response = await f.handler(new Request("https://local/delete-account", {
    method: "POST", headers: { Authorization: "Bearer valid" },
    body: JSON.stringify({ confirmation: "DELETE", userId: "someone-else" }),
  }));
  assert.equal(response.status, 200);
  assert.deepEqual(f.removed, ["owner-id/photo.png"]);
  assert.deepEqual(f.deleted, ["owner-id"]);
});

test("storage failure stops Auth deletion and allows a retry", async () => {
  const f = deleteEndpoint({ removeFails: true });
  const response = await f.handler(new Request("https://local/delete-account", {
    method: "POST", headers: { Authorization: "Bearer valid" }, body: JSON.stringify({ confirmation: "DELETE" }),
  }));
  assert.equal(response.status, 500);
  assert.deepEqual(f.deleted, []);
});
