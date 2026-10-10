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
    { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } },
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
  const states = [];
  let cursor = 0;
  let onFocus;
  let onSync;
  const data = {
    dreams: [{ id: 1 }, { id: 2 }],
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
      getMilestones: async () => [],
      getQuestsByDream: async (id) => { data.dreamLoads.push(id); return []; },
      getTimelineMoments: async () => [],
      getHabitsByDream: async () => [],
      getForecastProjection: async () => null,
      saveForecastProjection: async () => assert.fail("No forecast should be saved"),
    },
    "@/domain/forecast": {
      dreamWeights: () => ({ shares: new Map() }),
      forecastCompletion: () => ({ reason: "no-quests" }),
    },
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
