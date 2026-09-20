/**
 * Backtest for the completion forecast (src/domain/forecast.ts).
 *
 * The forecast module is dependency-free on purpose, so it can be transpiled
 * and exercised straight from node — no emulator, no database. The script
 * replays a history: at several points along it, it predicts from *only* the
 * completions up to that day, then compares the prediction with the day the
 * dream actually finished.
 *
 *   node scripts/forecast-backtest.mjs                  # synthetic histories
 *   node scripts/forecast-backtest.mjs --backup <file>  # a real backup export
 *
 * The backup form takes the JSON written by the in-app backup (db/backup.ts)
 * and replays every dream in it that is already complete.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DAY_MS = 86400000;
const JOURNEY_SLICES = 6;

/** Transpiles a TS module and its "@/..." imports, and returns its exports. */
async function loadModule(relative, cache = new Map()) {
  if (cache.has(relative)) return cache.get(relative);
  const source = fs.readFileSync(path.join(ROOT, relative), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  });

  // Rewrite "@/x/y" imports to file URLs of the transpiled dependency, which
  // we write beside the original under a temp directory.
  const tempDir = path.join(ROOT, "node_modules", ".forecast-backtest");
  fs.mkdirSync(tempDir, { recursive: true });
  const deps = [...outputText.matchAll(/from "@\/([^"]+)"/g)].map((m) => m[1]);
  let code = outputText;
  for (const dep of deps) {
    const depRelative = `src/${dep}.ts`;
    await loadModule(depRelative, cache);
    const depFile = path.join(tempDir, `${dep.replace(/\//g, "_")}.mjs`);
    code = code.split(`from "@/${dep}"`).join(`from ${JSON.stringify(pathToFileURL(depFile).href)}`);
  }
  const outFile = path.join(
    tempDir,
    `${relative.replace(/^src\//, "").replace(/\.ts$/, "").replace(/\//g, "_")}.mjs`,
  );
  fs.writeFileSync(outFile, code);
  const loaded = await import(pathToFileURL(outFile).href);
  cache.set(relative, loaded);
  return loaded;
}

const toKey = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};
const addDays = (date, days) => new Date(date.getTime() + days * DAY_MS);
const daysBetween = (a, b) =>
  Math.round((new Date(`${b}T12:00:00`) - new Date(`${a}T12:00:00`)) / DAY_MS);

/**
 * Builds a dream of `questCount` quests across six milestones, completed on
 * the days `schedule(index)` returns (day offsets from the start).
 */
function synthesize(name, questCount, schedule) {
  const start = new Date(2026, 0, 5, 12);
  const milestones = Array.from({ length: JOURNEY_SLICES }, (_, i) => ({
    id: i + 1,
    status: "active",
  }));
  const quests = Array.from({ length: questCount }, (_, i) => {
    const day = schedule(i);
    return {
      id: i + 1,
      milestoneId: (i % JOURNEY_SLICES) + 1,
      isActive: true,
      isDone: true,
      completedAt: `${toKey(addDays(start, day))}T18:00:00.000Z`,
      scheduledDate: null,
      _day: day,
    };
  });
  return { name, start, milestones, quests };
}

/** The synthetic histories: each returns the day offset of completion `i`. */
const SCENARIOS = [
  synthesize("steady: 1 quest a day", 90, (i) => i),
  synthesize("weekend warrior: 4 every Saturday", 80, (i) =>
    Math.floor(i / 4) * 7 + 5,
  ),
  synthesize("losing steam: fast start, long tail", 90, (i) =>
    Math.round(120 * (1 - Math.sqrt(1 - i / 90))),
  ),
  synthesize("finding rhythm: slow start, fast finish", 90, (i) =>
    Math.round(120 * Math.sqrt(i / 90)),
  ),
  synthesize("bursty: three days on, eleven off", 84, (i) =>
    Math.floor(i / 6) * 14 + (i % 6),
  ),
];

/** Quests as the forecast sees them on `asOf` — later completions unticked. */
function historyAsOf(quests, start, asOf) {
  const cutoff = daysBetween(toKey(start), toKey(asOf));
  return quests.map((quest) => {
    const done = quest._day <= cutoff;
    return {
      ...quest,
      isDone: done,
      completedAt: done ? quest.completedAt : null,
    };
  });
}

function pct(n) {
  return `${(n * 100).toFixed(0)}%`;
}

async function main() {
  const { forecastCompletion } = await loadModule("src/domain/forecast.ts");
  const args = process.argv.slice(2);
  const backupAt = args.indexOf("--backup");
  const scenarios =
    backupAt >= 0 ? loadBackup(args[backupAt + 1]) : SCENARIOS;

  console.log(
    "Each row: predicting from the history up to that point, against the day " +
      "the dream actually finished.\n",
  );

  const errors = [];

  for (const scenario of scenarios) {
    const finishedDay = Math.max(...scenario.quests.map((q) => q._day));
    const finishedOn = toKey(addDays(scenario.start, finishedDay));
    console.log(`${scenario.name}  (actually finished ${finishedOn})`);

    for (const share of [0.25, 0.5, 0.75]) {
      const asOf = addDays(scenario.start, Math.round(finishedDay * share));
      const quests = historyAsOf(scenario.quests, scenario.start, asOf);
      const projection = forecastCompletion({
        quests,
        milestones: scenario.milestones,
        today: asOf,
      });

      if (projection.reason !== "projected") {
        console.log(`  at ${pct(share).padStart(4)}: ${projection.reason}`);
        continue;
      }
      const error = daysBetween(finishedOn, projection.date);
      errors.push(Math.abs(error));
      console.log(
        `  at ${pct(share).padStart(4)} (${toKey(asOf)}): says ${projection.date}` +
          `  ${error >= 0 ? "+" : ""}${error}d` +
          `   p80 ${projection.lateDate}` +
          `   left ${pct(projection.remainingShare)}`,
      );
    }
    console.log("");
  }

  if (errors.length > 0) {
    const sorted = [...errors].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    const mean = sorted.reduce((sum, n) => sum + n, 0) / sorted.length;
    console.log(
      `Absolute error over ${sorted.length} projections: ` +
        `median ${median}d, mean ${mean.toFixed(1)}d, worst ${sorted[sorted.length - 1]}d.`,
    );
  }
}

/** Replays the finished dreams inside an in-app backup export. */
function loadBackup(file) {
  if (!file) throw new Error("--backup needs a path to a backup JSON file");
  const document = JSON.parse(fs.readFileSync(file, "utf8"));
  const tables = document.tables ?? document;
  const dreams = tables.dreams ?? [];
  const milestones = tables.milestones ?? [];
  const quests = tables.quests ?? [];

  return dreams
    .map((dream) => {
      const dreamMilestones = milestones.filter((m) => m.dream_id === dream.id);
      const ids = new Set(dreamMilestones.map((m) => m.id));
      const dreamQuests = quests.filter((q) => ids.has(q.milestone_id));
      const dated = dreamQuests.filter((q) => q.is_done === 1 && q.completed_at);
      if (dated.length === 0 || dated.length < dreamQuests.length) return null;

      const days = dated.map((q) => q.completed_at.slice(0, 10)).sort();
      const start = new Date(`${days[0]}T12:00:00`);
      return {
        name: `dream: ${dream.title}`,
        start,
        milestones: dreamMilestones.map((m) => ({ id: m.id, status: m.status })),
        quests: dreamQuests.map((q) => ({
          id: q.id,
          milestoneId: q.milestone_id,
          isActive: q.is_active === 1,
          isDone: true,
          completedAt: q.completed_at,
          scheduledDate: q.scheduled_date ?? null,
          _day: daysBetween(days[0], q.completed_at.slice(0, 10)),
        })),
      };
    })
    .filter((scenario) => scenario !== null);
}

main().catch((cause) => {
  console.error(cause);
  process.exit(1);
});
