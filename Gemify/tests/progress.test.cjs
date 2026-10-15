/* global __dirname */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");
const { DatabaseSync } = require("node:sqlite");
const ts = require("typescript");

function load(relative, dependencies, globals = {}) {
  const compiled = ts.transpileModule(
    fs.readFileSync(path.join(__dirname, "..", relative), "utf8"),
    { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } },
  ).outputText;
  const exports = {};
  vm.runInNewContext(compiled, {
    exports, module: { exports }, Date, Promise, Set, Map, console,
    require: (name) => {
      assert.ok(name in dependencies, `Unexpected dependency: ${name}`);
      return dependencies[name];
    },
    ...globals,
  }, { filename: relative });
  return exports;
}

test("general quests include both active dreams and exclude archived or completed dreams", async () => {
  const sqlite = new DatabaseSync(":memory:");
  try {
    sqlite.exec(`
      CREATE TABLE dreams (id INTEGER, is_archived INTEGER, is_completed INTEGER);
      CREATE TABLE milestones (id INTEGER, dream_id INTEGER);
      CREATE TABLE quests (
        id INTEGER, milestone_id INTEGER, title TEXT, is_active INTEGER,
        is_done INTEGER, created_at TEXT, scheduled_date TEXT,
        scheduled_time TEXT, is_planned INTEGER, completed_at TEXT
      );
      INSERT INTO dreams VALUES (1, 0, 0), (2, 0, 0), (3, 1, 0), (4, 0, 1);
      INSERT INTO milestones VALUES (1, 1), (2, 2), (3, 3), (4, 4);
      INSERT INTO quests VALUES
        (1, 1, 'First', 1, 1, '2026-10-01', '2026-10-05', NULL, 1, '2026-10-05'),
        (2, 2, 'Second', 1, 0, '2026-10-01', '2026-10-07', NULL, 1, NULL),
        (3, 3, 'Archived', 1, 1, '2026-10-01', '2026-10-05', NULL, 1, '2026-10-05'),
        (4, 4, 'Completed', 1, 1, '2026-10-01', '2026-10-05', NULL, 1, '2026-10-05');
    `);
    const repository = load("src/db/questsRepository.ts", {
      "./database": { getDatabase: async () => ({
        getAllAsync: async (sql, params = []) => sqlite.prepare(sql).all(...params),
      }) },
    });
    const quests = await repository.getQuestsForActiveDreams();
    assert.deepEqual(Array.from(quests, (quest) => quest.id), [1, 2]);
    assert.equal(quests[0].isDone, true);
    assert.equal(quests[1].scheduledDate, "2026-10-07");
  } finally {
    sqlite.close();
  }
});

function fixture() {
  class FixedDate extends Date {
    constructor(...args) {
      super(...(args.length ? args : ["2026-10-08T12:00:00"]));
    }
  }
  const dates = load("src/utils/dates.ts", {}, { Date: FixedDate });
  const forecast = load("src/domain/forecast.ts", { "@/utils/dates": dates }, { Date: FixedDate });
  const states = [];
  let cursor = 0;
  let onFocus;
  let onSync;
  const data = {
    dreams: [{ id: 1, title: "First dream" }, { id: 2, title: "Second dream" }],
    milestones: [],
    savedForecasts: new Map(),
    quests: [
      { id: 1, isDone: true, scheduledDate: "2026-10-05" },
      { id: 2, isDone: false, scheduledDate: "2026-10-07" },
      { id: 3, isDone: false, scheduledDate: "2026-10-09" },
    ],
    habits: [{ id: 1, dreamId: 2 }, { id: 2, dreamId: 3 }],
    completions: [{ date: "2026-10-06", status: "done" }],
    dreamLoads: [],
  };
  const hooks = load("src/hooks/useProgressContent.ts", {
    "expo-router": { useFocusEffect: (callback) => { onFocus = callback; } },
    react: {
      useState: (initial) => {
        const index = cursor++;
        if (!(index in states)) states[index] = initial;
        return [states[index], (next) => { states[index] = next; }];
      },
      useMemo: (callback) => callback(),
      useCallback: (callback) => callback,
    },
    "@/db": {
      getDreams: async () => data.dreams,
      getQuestsForActiveDreams: async () => data.quests,
      getHabits: async () => data.habits,
      getHabitScheduleDays: async (id) => {
        assert.equal(id, 1, "Habits of inactive dreams must be excluded");
        return [1, 3];
      },
      getHabitCompletions: async (id, start, end) => {
        assert.equal(id, 1);
        assert.equal(start, "2026-05-01");
        assert.equal(end, "2026-10-08");
        return data.completions;
      },
      getDreamsWithCompleted: async () => [{ id: 1 }, { id: 4, isCompleted: true }],
      getMilestones: async (dreamId) => data.milestones.filter((milestone) => milestone.dreamId === dreamId),
      getQuestsByDream: async (id) => { data.dreamLoads.push(id); return []; },
      getTimelineMoments: async () => [],
      getHabitsByDream: async () => [],
      getForecastProjection: async (dreamId) => data.savedForecasts.get(dreamId) ?? null,
      saveForecastProjection: async (dreamId, date) => { data.savedForecasts.set(dreamId, date); },
    },
    "@/domain/forecast": forecast,
    "@/hooks/useRefreshOnSync": { useRefreshOnSync: (callback) => { onSync = callback; } },
    "@/utils/dates": dates,
  }, { Date: FixedDate });
  return {
    data,
    render: (goalKey) => {
      cursor = 0;
      return goalKey === undefined
        ? hooks.useProgressStatsContent()
        : hooks.useProgressContent(goalKey, true);
    },
    focus: async () => { onFocus(); await new Promise(setImmediate); },
    sync: async () => { await onSync(); },
  };
}

test("Progress combines quests and habits, caps totals at today, and retains all ranges", async () => {
  const app = fixture();
  await app.render().refresh();
  const result = app.render();
  assert.equal(result.loading, false);
  assert.equal(result.content.hasChartData, true);
  const ranges = result.content.fulfillmentTabs[0].ranges;
  assert.deepEqual(Array.from(ranges, (range) => range.key), ["week", "month", "6months"]);
  for (const range of ranges) {
    assert.equal(range.summary.percent, 50);
    assert.equal(range.summary.caption, "2 of 4 activities completed");
  }
  assert.deepEqual(Array.from(ranges[0].points, (point) => point.percent), [100, 100, 0, 0, 0, 0, 0]);
  assert.deepEqual(app.data.dreamLoads, []);
});

test("focus and sync refresh general stats, including habit-only and empty states", async () => {
  const app = fixture();
  app.render();
  await app.focus();
  app.data.quests = [{ id: 1, isDone: true, scheduledDate: null }];
  await app.sync();
  assert.equal(app.render().content.hasChartData, true, "Habit history reveals the chart");
  app.data.habits = [];
  await app.sync();
  assert.equal(app.render().content.hasChartData, false, "Unscheduled quests cannot appear in the completion chart");
  app.data.dreams = [];
  app.data.quests = [];
  await app.focus();
  assert.equal(app.render().content.fulfillmentTabs[0].ranges[0].summary.caption, "0 of 0 activities completed");
});

test("Memories still loads its selected completed dream", async () => {
  const app = fixture();
  await app.render("4").refresh();
  const result = app.render("4");
  assert.equal(result.dreamId, 4);
  assert.deepEqual(app.data.dreamLoads, [4]);
  assert.equal(result.content.goals.some((goal) => goal.key === "4"), true);
});

test("forecasts use each dream's own pace, retain pending dreams, and sort by full date", async () => {
  const app = fixture();
  app.data.dreams.push({ id: 3, title: "New dream" });
  app.data.habits = [];
  app.data.milestones = [
    { id: 11, dreamId: 1, status: "active" },
    { id: 22, dreamId: 2, status: "active" },
  ];
  app.data.quests = [
    { id: 1, milestoneId: 11, isActive: true, isDone: true, completedAt: "2026-10-07", scheduledDate: "2026-10-07" },
    { id: 2, milestoneId: 11, isActive: true, isDone: false, completedAt: null, scheduledDate: "2027-01-18" },
    { id: 3, milestoneId: 22, isActive: true, isDone: true, completedAt: "2026-10-06", scheduledDate: "2026-10-06" },
    { id: 4, milestoneId: 22, isActive: true, isDone: false, completedAt: null, scheduledDate: "2026-11-06" },
  ];
  await app.render().refresh();
  const forecasts = app.render().content.forecasts;
  assert.deepEqual(Array.from(forecasts, (entry) => [entry.dreamId, entry.title, entry.date]), [
    [2, "Second dream", "2026-11-06"],
    [1, "First dream", "2027-01-18"],
    [3, "New dream", null],
  ]);
  assert.equal(app.data.savedForecasts.get(1), "2027-01-18");
  assert.equal(app.data.savedForecasts.get(2), "2026-11-06");
  assert.deepEqual(app.data.dreamLoads, []);
});

test("forecast card displays the year and pending state without menu controls", () => {
  const element = (type, props) => ({ type, props });
  const { DreamForecastCard } = load("src/components/DreamForecastCard.tsx", {
    "react/jsx-runtime": { jsx: element, jsxs: element },
    "expo-image": { Image: "Image" },
    "expo-linear-gradient": { LinearGradient: "LinearGradient" },
    "react-native": { StyleSheet: { create: (styles) => styles, absoluteFill: {} }, View: "View" },
    "@/shared/components": { AppText: "AppText", Card: "Card" },
    "@/theme/colors": { colors: {} },
    "@/theme/theme": { spacing: {} },
    "../../assets/home/will-achieve.png": "castle.png",
  });
  const root = DreamForecastCard({ forecasts: [
    { dreamId: 1, title: "Become a Millionaire", date: "2027-03-02" },
    { dreamId: 2, title: "Build My Dream Life", date: null },
  ], loading: false });
  const strings = [];
  const types = [];
  function walk(node) {
    if (typeof node === "string") strings.push(node);
    else if (Array.isArray(node)) node.forEach(walk);
    else if (node?.props) { types.push(node.type); walk(node.props.children); }
  }
  walk(root);
  assert.ok(strings.includes("Dream Forecast"));
  assert.ok(strings.includes("Mar 2, 2027"));
  assert.ok(strings.includes("Pending"));
  assert.equal(types.includes("Pressable"), false);
});
