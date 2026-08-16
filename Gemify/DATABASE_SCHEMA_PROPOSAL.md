# Gemify — SQLite Database Schema Proposal

> Analysis-only deliverable. Nothing in this document has been executed or wired into the app.
> Date of analysis: 2026-08-13. Codebase state: branch `HEAD` at `f341e9e` (+ working-tree edit to `src/app/(tabs)/sprint.tsx`).
>
> **Revision 2 (2026-08-15)** — trimmed per product feedback: dreams lose visual/ordering columns (all dreams share the same look; order derives from id), `feeling_states` reduced to id+label, milestone ordering renamed to `sequence_number`, subtitle/description dropped, task `duration_minutes`/`frequency_label`/`position` dropped (`completed_at` kept for history), habits lose `icon_key`/`started_on`, detail entries lose `position`, and most `created_at`/`updated_at` audit columns removed. Time-block tables are **kept** (confirmed) so daily checkmarks persist per date.
>
> **Revision 3 (2026-08-15)** — all open product questions answered: goal = dream (one table); habits belong to a **dream** (`dream_id NOT NULL`); risks are **per-dream** (`dream_id NOT NULL`, defaults seeded per new dream); milestone `status` is just `active`/`completed` (no `locked`, no timestamps — the locked look derives from path order); quests keep a single `created_at` (feeds "N days active"); habit medallion art derives from the title in code; **Approve converts an idea into a quest** (insert quest + delete idea in one transaction); risks/risk_actions trim confirmed.

---

## 1. Executive summary

Gemify is an Expo 56 / expo-router app with **no persistence for domain data**: every screen renders from hardcoded TypeScript objects, either in `src/data/*` or inlined at module scope inside screens. A minimal SQLite layer already exists (`src/db/` — commit `f341e9e "add db sqllite"`): `expo-sqlite ~56.0.5` is installed, a migration runner keyed on `PRAGMA user_version` is in place, WAL + `foreign_keys = ON` are enabled, and a demo `items` table with repository + hook + demo screen proves the pattern end-to-end. **The proposal below builds on that scaffold rather than replacing it.**

The domain decomposes into one aggregate hierarchy — **Dream → Milestone → Quest → Task** — plus three satellite feature areas: **Habits** (with per-day completions), **Daily routine time blocks** (with per-day action completions), and **Risk / What-If plans**. Progress numbers (percentages, counts, streaks, forecasts, charts) are currently stored as literals but are all **derivable** and should not be persisted. Visual configuration (board layout, accents, icons, SVG art, and — per revision 2 — the dream card imagery/colors, which are identical for every dream) stays in code.

The proposal defines **18 new tables** (19 counting the existing `items` demo table), a migration `toVersion: 2` appended to the existing runner, a seed strategy that separates *reference seeds* (time blocks, feeling states) from *dev-only fixtures* (the dummy goals/progress data), and a repository architecture that mirrors the existing `itemsRepository` pattern.

---

## 2. Inventory of discovered hardcoded datasets

### 2.1 `src/data/` (the designated data layer)

| # | File | Export | Shape | Nature |
|---|---|---|---|---|
| D1 | `src/data/homeDummyData.ts` | `homeDummyData` (re-exported as `homeData` by `src/data/homeData.ts`) | `{ header, goals[3], currentFocus[3] }` typed by `src/data/homeTypes.ts` | Dummy user data |
| D2 | `src/data/journeyMilestones.ts` | `journeyMilestoneContent` (6 milestones) | `JourneyMilestoneContent`: id, title, subtitle, state, description, active, optional artifact/mentor/reward/completed/locked | Dummy user data (editable in-app) |
| D3 | `src/data/journeyMilestoneBoardLayout.ts` | `journeyMilestoneBoardLayout` | Per-milestone x/y/size/tilt/rotation/opacity/glowIntensity/variant | Visual layout config |
| D4 | `src/data/journeyPageConfig.ts` | `journeyPageConfigs` | `{ castleY, bottomY }[]` | Visual layout config |
| D5 | `src/data/timeBlocks.ts` | `timeBlocks` (5 blocks, 2–5 actions each) + `getCurrentTimeBlockKey()` | `TimeBlock { key, label, icon, time, identity, routineTitle, routineSubtitle, actions[] }`; `DayAction { done, icon, subtitle, title }` | Reference/routine content **+** embedded completion state (`done`) |
| D6 | `src/data/progressData.ts` | `progressContent` | `{ title, subtitle, goals[3], forecast, moments[6], fulfillmentTabs[2], overallLabel }` | Mostly derived numbers + dummy history |
| D7 | `src/data/progressData.ts` | `progressAccentLayout` | moment-key → accent color name | Visual config |
| D8 | `src/data/icons.ts` | `goalIcons`, `focusIcons` | icon-key → PNG `require()` | UI asset map |
| D9 | `src/data/images/index.ts` | `goalImages` | image-key → PNG `require()` | UI asset map |
| D10 | `src/data/menuIcons.ts` | `menuIcons` | tab → active/inactive PNG | UI asset map (navigation) |

### 2.2 Data embedded in screens/components

| # | File | Symbol(s) | Contents | Nature |
|---|---|---|---|---|
| S1 | `src/app/(tabs)/sprint.tsx` | `weekDays`, `scheduledTasks`, `unscheduledGroup`, `collapsedDream` | Week strip counts; tasks with time/duration and Dream/Milestone/Quest breadcrumbs ("Growth Mindset / Become a Creator / Learn Video Making"); quest progress `3/5` | Dummy user data + derived counts |
| S2 | `src/app/(tabs)/milestone-quests.tsx` | `ideas`, `questTasks`, `identity`, `dummyHabit`, inline hero copy ("Build Unstoppable Discipline", `72`% ring, "18 days in progress", "Morning routine mastery", `67`% ring) | Ideas w/ scores; quest tasks w/ frequency; identity card; habit card | Dummy user data + derived numbers |
| S3 | `src/app/(tabs)/habits.tsx` | `habitGroups`, `ACTIVE_DAY_INDEX` | 2 groups ("Growth Mindset", "Healthy Body") × 2 habits each; per-habit 7-slot progress (`done/partial/missed/open`), `day`/`goal` counters, detail sections (easy-start rows, easy version, obstacles → backup) | Dummy user data |
| S4 | `src/app/state.tsx` | `STATES` (15 entries), `MAX_SELECTIONS`, initial `selected` | Feeling-state catalog `{icon glyph, label}`; user picks ≤3, can add custom | Reference catalog + user selection |
| S5 | `src/app/what-if-plan.tsx` | `DEFAULT_PLANS` (3 risk plans) | `RiskPlan { id: number, title, prompt, actions[] }`; full in-memory CRUD already implemented | Dummy user data (default content) |
| S6 | `src/components/JourneyMapControls.tsx` | `DREAM_NAME`, `VISION_STATEMENT` | Dream name + vision statement, editable in the journey overview modal | Dummy user data |
| S7 | `src/screens/JourneyMapScreen.tsx` | `MILESTONE_DETAIL_FIELDS`, `NEW_MILESTONE_VISUALS`, `EMPTY_MILESTONE_FORM` | Form field labels/placeholders; default board visuals for new milestones | UI config |
| S8 | `src/app/create-habit.tsx` | `DAYS`, `TIMES`, `textSteps`, initial `values`/`selectedDays`/`selectedTime` | Weekday chips, time-of-day chips, form step definitions, prefilled demo answers | UI config + demo form defaults |
| S9 | `src/app/(tabs)/index.tsx` | `useState(timeBlocks)` | Home screen clones D5 into local state and toggles `done` | Session state over dummy data |
| S10 | `src/app/(tabs)/my-day.tsx` | `useState(timeBlocks)`, `activeKey`, `selectedDate` | Same D5 clone; date picker exists but completions are not per-date | Session state over dummy data |
| S11 | `src/app/(tabs)/progress.tsx` | chart constants (`CHART_*`, `accentTints`), consumes D6/D7 | Chart geometry and tints | UI config |
| S12 | `src/app/create-goal.tsx`, `src/app/describe-dream.tsx` | `dreamName` / `description` local state | Captured but discarded on navigation | Lost user input → future persistent data |

### 2.3 Existing database code (already in repo)

| File | Contents |
|---|---|
| `src/db/database.ts` | `getDatabase()` / `initDatabase()`; opens `gemify.db`, WAL, `foreign_keys = ON`, runs migrations |
| `src/db/migrations.ts` | `Migration[]` keyed by `toVersion`, tracked via `PRAGMA user_version`; v1 creates `items` |
| `src/db/itemsRepository.ts`, `src/db/types.ts`, `src/hooks/useItems.ts`, `src/app/items-demo.tsx` | Full demo vertical slice (repository → hook → screen) |

---

## 3. Page-by-page data usage audit

Screens inspected: **14** (6 tab screens incl. the tab layout's icon data, 8 stack screens) plus 15 feature/shared components.

| Screen (route) | Reads | Writes (currently in-memory only) |
|---|---|---|
| Home — `(tabs)/index.tsx` | D1 header+goals, D5 time blocks (current block by clock), derived today-progress | Toggles action `done` (lost on unmount) |
| Today — `(tabs)/my-day.tsx` | D5 all blocks + tabs, derived completed/total; date picker | Toggles action `done` per block (not per date) |
| Weekly Plan — `(tabs)/sprint.tsx` | S1: week strip, scheduled tasks (time+duration), unscheduled tree grouped Dream→Milestone→Quest, quest done/total | none (Schedule button is a stub) |
| Progress — `(tabs)/progress.tsx` | D6 goals selector, forecast, timeline moments, fulfillment tabs/ranges/points/summaries; D7 accents | none |
| Habits — `(tabs)/habits.tsx` | S3 groups → habits → 7-day progress + detail sections; date label from `new Date()` | Expand/collapse only |
| Milestone Quests — `(tabs)/milestone-quests.tsx` | S2 hero milestone, ideas, active quest + tasks, identity card, `dummyHabit` | none (Approve/Add buttons are stubs) |
| Journey Map — `journey-map.tsx` → `src/screens/JourneyMapScreen.tsx` | D2+D3 via `journeyMilestones`, D4 page bounds; S7 form config | Full milestone CRUD: add (insert at slot), edit (artifact/state/mentor/reward), delete, resequencing ids 1..n — all in `useState` |
| Journey overview modal — `src/components/JourneyMapControls.tsx` | S6 dream name + vision | Edits both; "Delete Dream" button |
| Create Goal — `create-goal.tsx` | — | `dreamName` (discarded) |
| Describe Dream — `describe-dream.tsx` | — | `description` (discarded) |
| State — `state.tsx` | S4 catalog | Selection of ≤3 states + custom entries (discarded) |
| Create Habit — `create-habit.tsx` | S8 form config | Habit form values incl. frequency days, time-of-day, easy-start/bad-day/backup (Continue is a stub) |
| What If Plan — `what-if-plan.tsx` | S5 defaults | Full risk CRUD incl. per-action editing (lost on unmount) |
| Items demo — `items-demo.tsx` | `items` table via `useItems` | Real SQLite CRUD (the only persisted screen) |

Key observation: three screens (**journey map**, **what-if-plan**, **home/my-day toggles**) already implement real mutation flows against `useState`. Their state shapes are the strongest evidence for the schema; the schema below matches those flows so that later wiring is a `useState`→repository swap.

---

## 4. Classification of data

### Persistent user data (SQLite tables, user-created rows)
- Dreams/goals (D1 `goals`, S6 dream name + vision, `create-goal`/`describe-dream` inputs, S1 `dream` labels, S3 group titles)
- Milestones incl. artifact/state/mentor/reward and ordering (D2, journey-map CRUD, S1 `milestone`, S2 hero)
- Quests (S1/S2), tasks (S1 scheduled+unscheduled, S2 `questTasks`), ideas (S2 `ideas`)
- Habits + schedule + detail entries (S3, `create-habit`), habit completions (S3 `progress` arrays)
- Per-day action completions for time blocks (the `done` flags in D5, toggled in S9/S10)
- Risks + protection actions (S5)
- Timeline moments (D6 `moments` — user-meaningful history)
- Selected feeling states incl. custom ones (S4)
- User display name (D1 `header.greeting` — "Tania")

### Static reference data → seed into SQLite (editable later without app release)
- Time blocks + their default routine actions (D5 minus the `done` flags) — **confirmed kept in DB**
- Feeling-state catalog (S4 `STATES` — labels only; glyphs stay in code)
- Default risk plans (S5 `DEFAULT_PLANS`) — seeded as editable rows into each newly created dream (see §9)
- Default milestone skeleton "Awakening → Vision" (D2) — seeded per new dream (see §9)

### Derived — compute, never store
- All percentages and counts: goal `progressPercent`/`completedTasks`/`totalTasks` (D1), quest `done/total` (S1), milestone `72%` / active-quest `67%` (S2), habit `day` counter (S3 — derived from `habit_completions` history), today progress (S9/S10), week-strip per-day counts and "unscheduled" badge (S1)
- Dream ordering on the home screen — derived from `id` (insertion order); no stored position (revision 2)
- Fulfillment "Task Completion" charts — computed from `tasks.completed_at` + habit/action completion history; the forecast date/ETA (D6) is computed or omitted (no stored `target_date` — revision 2)
- `getCurrentTimeBlockKey()` (clock-derived), habit `open` status (absence of a completion row), sprint day heading

### Temporary session state — do not persist
- Modal open/closed, edit modes, expanded habit, active tab key, selected calendar date, form drafts before save

### UI-only — stays in code
- D3, D4, D7, D8, D9, D10; S7 field/placeholder config; S8 `DAYS`/`TIMES` chips; S11 chart constants; all SVG icon components; gradients; theme tokens; `NEW_MILESTONE_VISUALS`
- **Dream card visuals** (revision 2): `theme_color`, `image_key`, `icon_key` are identical for every dream, so they become shared constants in code, not columns
- Feeling-state glyphs ("♠", "☾", …): code map keyed by label; unknown/custom labels get a UI fallback glyph

---

## 5. Conventions used by the proposed schema

- **IDs**: `INTEGER PRIMARY KEY AUTOINCREMENT` throughout (matches `items` and the numeric ids already used by `journeyMilestoneContent` and `RiskPlan`). String ids in `homeDummyData` ("goal-creative-business") become a nullable `seed_key TEXT UNIQUE` on `dreams` so seeded rows stay addressable.
- **Booleans**: `INTEGER NOT NULL DEFAULT 0 CHECK (col IN (0, 1))`.
- **Timestamps**: ISO-8601 UTC `TEXT`, `DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now'))`. Kept **only where the UI needs them** (`quests.created_at` for "N days active", `tasks.completed_at` for history charts, `action_completions.completed_at`, `settings.updated_at`, `habit_completions.created_at`); generic `created_at`/`updated_at` audit columns are dropped everywhere else.
- **Calendar dates** (no time component): `TEXT` `YYYY-MM-DD` with `CHECK (date(col) IS NOT NULL)`.
- **Clock times**: `TEXT` `HH:MM` (24h), `NULL` meaning "flexible/anytime" (matches `timeBlocks[].time === "Flexible"`).
- **Enums**: `TEXT` + `CHECK (col IN (...))`.
- **Ordering** (revision 2): the only user-reorderable list is the milestone path → explicit `sequence_number INTEGER NOT NULL` with `UNIQUE (dream_id, sequence_number)`. Every other list (dreams, quests, tasks, ideas, detail entries, risk actions) is ordered by **insertion order (`id`)** — no `position` columns.
- **Arrays of strings** (risk actions, habit detail rows) become child tables — they are individually edited in the UI — ordered by `id`.
- **Foreign keys**: `ON DELETE CASCADE` down the aggregate (deleting a dream removes its milestones → quests → tasks, matching the "Delete Dream"/"Delete Milestone" confirm dialogs). Time blocks are reference rows the UI never deletes; their completions cascade if it ever happens.

---

## 6. Proposed tables

Legend: origin **U** = user-created, **S** = seeded, **U/S** = seeded rows the user then edits.

### 6.1 `settings` — app-level key/value (origin: U/S)
Purpose: single-user profile and preferences. Maps: `homeDummyData.header.greeting` → `display_name` (greeting text derived: "Good morning, {name}"); `header.subtitle` affirmation → `home_subtitle`.

| Column | Type | Constraints |
|---|---|---|
| key | TEXT | PRIMARY KEY |
| value | TEXT | NOT NULL |
| updated_at | TEXT | NOT NULL DEFAULT now |

### 6.2 `dreams` — the top-level goal/journey (origin: U, dev-seeded)
One row per Dream. Maps: D1 `goals[].title`, S6 `DREAM_NAME`/`VISION_STATEMENT`, `create-goal` name, `describe-dream` description, S1 `dream`/`collapsedDream.title`, S3 group titles, D6 `goals[]` selector.
Dropped (revision 2): `theme_color`, `image_key`, `icon_key` (identical for every dream → code constants), `position` (order = `id`), `target_date` (forecast derived or omitted), `created_at`/`updated_at`. Dropped as derived: `milestone` name, `completedTasks`/`totalTasks`/`progressPercent`.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | home-screen order = `ORDER BY id` |
| seed_key | TEXT | UNIQUE, NULL | e.g. `goal-creative-business` for dev fixtures |
| title | TEXT | NOT NULL CHECK (length(trim(title)) > 0) | ≤60 chars enforced in UI (`DREAM_NAME_MAX_LENGTH`) |
| vision_statement | TEXT | NULL | describe-dream text (≤300 in UI) |
| is_archived | INTEGER | NOT NULL DEFAULT 0 CHECK (in 0,1) | soft-hide from the home list |

Delete: cascades to milestones, habits, risks, moments, feeling links.

### 6.3 `feeling_states` — catalog of desired states (origin: S + U for custom)
Maps: S4 `STATES` labels (15 seeded rows) plus user-typed custom labels. Revision 2: glyph and `is_custom` dropped — glyphs live in a code map keyed by label; seeded vs custom is not distinguished.

| Column | Type | Constraints |
|---|---|---|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT |
| label | TEXT | NOT NULL UNIQUE COLLATE NOCASE |

### 6.4 `dream_feeling_states` — join, ≤3 per dream (origin: U)
Maps: `state.tsx` `selected[]`. Revision 2: no `position` — selection order/eviction ("replace oldest") uses insertion order (`rowid`); the ≤3 cap stays app logic.

| Column | Type | Constraints |
|---|---|---|
| dream_id | INTEGER | NOT NULL REFERENCES dreams(id) ON DELETE CASCADE |
| state_id | INTEGER | NOT NULL REFERENCES feeling_states(id) ON DELETE CASCADE |
| PK | | PRIMARY KEY (dream_id, state_id) |

### 6.5 `milestones` (origin: U; skeleton seeded per dream)
Maps: D2 `journeyMilestoneContent`, journey-map add/edit/delete + resequencing, S1 `milestone`, S2 hero.
Revision 2: `position` renamed **`sequence_number`**; `subtitle`, `description`, `created_at`/`updated_at` dropped (neither is collected by the add-form).
Revision 3 (confirmed): `status` is only `active`/`completed`; no `locked` value and no `started_at`/`completed_at`. The "locked" look on the map derives from path order (milestones after the first non-completed one render locked); the hero's "18 days in progress" caption loses its data source and is dropped when wired.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | replaces the fragile resequenced 1..n id |
| dream_id | INTEGER | NOT NULL REFERENCES dreams(id) ON DELETE CASCADE | |
| sequence_number | INTEGER | NOT NULL | path order, 0 = start; UNIQUE (dream_id, sequence_number); display number = `sequence_number + 1` |
| title | TEXT | NOT NULL CHECK (length(trim(title)) > 0) | |
| state | TEXT | NULL | free-text feeling ("Calm"); required by the form, enforce in UI |
| artifact | TEXT | NULL | |
| mentor | TEXT | NULL | |
| reward | TEXT | NULL | optional in the form |
| status | TEXT | NOT NULL DEFAULT 'active' CHECK (status IN ('active','completed')) | D2 mapping: `completed` → 'completed', everything else → 'active' |

Index: `idx_milestones_dream (dream_id, sequence_number)`. Board visuals (D3) stay in code: the screen computes x/y from index count (`getMilestoneRingY`).

### 6.6 `quests` (origin: U)
Maps: S1 `unscheduledGroup.quest` ("Learn Video Making", 3/5 → derived), S2 active quest ("7 days active" ← `created_at`). Revision 2 dropped `position` (insertion order); revision 3 (confirmed) **keeps a single `created_at`** so the "N days active" caption survives. Quests are also created by approving an idea (§6.8).

| Column | Type | Constraints |
|---|---|---|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT |
| milestone_id | INTEGER | NOT NULL REFERENCES milestones(id) ON DELETE CASCADE |
| title | TEXT | NOT NULL CHECK (length(trim(title)) > 0) |
| is_active | INTEGER | NOT NULL DEFAULT 1 CHECK (in 0,1) |
| created_at | TEXT | NOT NULL DEFAULT now — "N days active" |

Index: `idx_quests_milestone (milestone_id)`.

### 6.7 `tasks` (origin: U)
Maps: S2 `questTasks` (`done`, `title`), S1 `scheduledTasks` (`time`; breadcrumbs → joins) and `unscheduledGroup.tasks`. A task is "scheduled" iff `scheduled_date` is set — that single nullable column reproduces the sprint board's two sections.
Revision 2 (confirmed): `duration_minutes` **dropped** — the sprint cards' "45 min" display goes away when wired; `frequency_label` dropped (S2's overloaded `frequency` strings are not modeled); `position` dropped (order by `id`); `created_at`/`updated_at` dropped; **`completed_at` kept** (set when checked off) so the Progress "Task Completion" history charts remain computable.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | |
| quest_id | INTEGER | NOT NULL REFERENCES quests(id) ON DELETE CASCADE | |
| title | TEXT | NOT NULL CHECK (length(trim(title)) > 0) | |
| scheduled_date | TEXT | NULL CHECK (valid date or NULL) | week board placement |
| scheduled_time | TEXT | NULL CHECK (HH:MM or NULL) | "09:00" |
| is_done | INTEGER | NOT NULL DEFAULT 0 CHECK (in 0,1) | |
| completed_at | TEXT | NULL | set on completion; feeds task-completion charts |

Indexes: `idx_tasks_quest (quest_id)`, `idx_tasks_schedule (scheduled_date, scheduled_time)` — the week strip counts and day list are `GROUP BY scheduled_date` queries.

### 6.8 `ideas` (origin: U, dev-seeded)
Maps: S2 `ideas` (`title`, `score`). Revision 2: `icon_key`, `status`, `created_at` dropped. Revision 3 (confirmed): **"Approve" = the idea becomes a quest** — the repository inserts a `quests` row (same milestone, title copied) and deletes the idea, in one transaction. Ideas never carry a lifecycle column; icons, if kept in the UI, come from a code-side default.

| Column | Type | Constraints |
|---|---|---|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT |
| milestone_id | INTEGER | NOT NULL REFERENCES milestones(id) ON DELETE CASCADE |
| title | TEXT | NOT NULL CHECK (length(trim(title)) > 0) |
| score | INTEGER | NOT NULL DEFAULT 0 CHECK (score BETWEEN 0 AND 10) |

Index: `idx_ideas_milestone (milestone_id)`.

### 6.9 `habits` (origin: U, dev-seeded)
Maps: S3 `Habit` (`title`, `time` cue, `goal`), `create-habit` form. Revision 2: `icon_key`, `started_on`, `created_at`/`updated_at` dropped — the "Day 12 / 24" counter derives from `habit_completions`. Revision 3 (confirmed): habits belong to a **dream** (`dream_id NOT NULL`; the Milestone Quests screen shows the parent dream's habits), and medallion art is **derived from the title** by keyword matching in code ("workout"/"water"/"read"/"meditate"…, fallback to a default).

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | |
| dream_id | INTEGER | NOT NULL REFERENCES dreams(id) ON DELETE CASCADE | grouping on the Habits screen |
| title | TEXT | NOT NULL CHECK (length(trim(title)) > 0) | |
| cue | TEXT | NULL | "After morning coffee" |
| time_of_day | TEXT | NULL CHECK (in 'morning','after_lunch','evening' or NULL) | S8 `TIMES` |
| goal_days | INTEGER | NOT NULL DEFAULT 24 CHECK (goal_days > 0) | "Day 12 / 24" denominator |
| is_archived | INTEGER | NOT NULL DEFAULT 0 CHECK (in 0,1) | |

Index: `idx_habits_dream (dream_id, is_archived)`.

### 6.10 `habit_schedule_days` (origin: U)
Maps: `create-habit` `selectedDays` (subset of Mon..Sun).

| Column | Type | Constraints |
|---|---|---|
| habit_id | INTEGER | NOT NULL REFERENCES habits(id) ON DELETE CASCADE |
| weekday | INTEGER | NOT NULL CHECK (weekday BETWEEN 0 AND 6) — 0 = Monday, matching the UI's Mon-first week |
| PK | | PRIMARY KEY (habit_id, weekday) |

### 6.11 `habit_detail_entries` (origin: U)
Maps: S3 `details[]` rows; `create-habit` collects one text per section. Section titles/icons stay in code keyed by `section`. Revision 2: no `position` — rows render in insertion order (`id`).

| Column | Type | Constraints |
|---|---|---|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT |
| habit_id | INTEGER | NOT NULL REFERENCES habits(id) ON DELETE CASCADE |
| section | TEXT | NOT NULL CHECK (section IN ('easy_start','easy_version','backup_plan')) |
| content | TEXT | NOT NULL CHECK (length(trim(content)) > 0) |

Index: `idx_habit_details (habit_id, section)`.

### 6.12 `habit_completions` (origin: U)
Maps: S3 `progress` arrays. `open` (future/unrecorded) is the **absence** of a row; only `done`/`partial`/`missed` are stored. Weekly strip = 7-day range query; `day` counter and streaks derive from these rows (now that `habits.started_on` is gone, this table is the *only* source for the counter).

| Column | Type | Constraints |
|---|---|---|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT |
| habit_id | INTEGER | NOT NULL REFERENCES habits(id) ON DELETE CASCADE |
| date | TEXT | NOT NULL CHECK (date(date) IS NOT NULL) |
| status | TEXT | NOT NULL CHECK (status IN ('done','partial','missed')) |
| created_at | TEXT | NOT NULL DEFAULT now |
| UNIQUE | | (habit_id, date) |

Index: `idx_habit_completions_date (date)`.

### 6.13 `time_blocks` (origin: S — **kept per confirmation**)
Maps: D5 `timeBlocks` minus `actions` and minus completion state. `key` keeps the stable string ids ("anytime", "wake-up", …) that `getCurrentTimeBlockKey` and tab selection use.

| Column | Type | Constraints |
|---|---|---|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT |
| key | TEXT | NOT NULL UNIQUE |
| label | TEXT | NOT NULL |
| icon_key | TEXT | NOT NULL CHECK (in 'clock','sunrise','briefcase','sun','moon') |
| start_time | TEXT | NULL CHECK (HH:MM or NULL) — NULL = "Flexible" |
| identity | TEXT | NULL — "SELF-DISCIPLINED WOMAN" |
| routine_title | TEXT | NOT NULL |
| routine_subtitle | TEXT | NULL |
| position | INTEGER | NOT NULL DEFAULT 0 — display order of the five blocks (seeded reference data, not user-sorted) |

Delete behavior: reference rows, never user-deleted in the current UI; children cascade if it ever happens.

### 6.14 `time_block_actions` (origin: S — **kept per confirmation**)
Maps: D5 `actions[]` minus `done`.

| Column | Type | Constraints |
|---|---|---|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT |
| time_block_id | INTEGER | NOT NULL REFERENCES time_blocks(id) ON DELETE CASCADE |
| title | TEXT | NOT NULL |
| subtitle | TEXT | NULL |
| icon_key | TEXT | NOT NULL CHECK (in 'meditate','nourish','move','water','intention','focus') |
| position | INTEGER | NOT NULL DEFAULT 0 |
| is_active | INTEGER | NOT NULL DEFAULT 1 CHECK (in 0,1) |

### 6.15 `action_completions` (origin: U)
Replaces the mutable `done` flag with per-date records — makes My Day's date picker meaningful and fixes Home/My Day holding independent copies of completion state.

| Column | Type | Constraints |
|---|---|---|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT |
| action_id | INTEGER | NOT NULL REFERENCES time_block_actions(id) ON DELETE CASCADE |
| date | TEXT | NOT NULL CHECK (date(date) IS NOT NULL) |
| completed_at | TEXT | NOT NULL DEFAULT now |
| UNIQUE | | (action_id, date) |

Un-checking deletes the row. Today-progress = `COUNT(completions today)` / `COUNT(active actions)`.

### 6.16 `risks` (origin: U/S — defaults seeded per dream, then user-edited)
Maps: S5 `RiskPlan` (`title`, `prompt`). Revision 2 trim confirmed: `position` and audit timestamps dropped; the screen prepends new plans — render `ORDER BY id DESC`. Revision 3 (confirmed): risks are **per-dream** — `dream_id NOT NULL`, and the three `DEFAULT_PLANS` are seeded for each newly created dream (not globally).

| Column | Type | Constraints |
|---|---|---|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT |
| dream_id | INTEGER | NOT NULL REFERENCES dreams(id) ON DELETE CASCADE |
| title | TEXT | NOT NULL CHECK (length(trim(title)) > 0) |
| prompt | TEXT | NOT NULL DEFAULT 'If this gets in the way...' |

### 6.17 `risk_actions` (origin: U/S)
Maps: S5 `actions[]` — individually edited/blur-deleted in the UI, so a child table, not JSON; ordered by `id`. The "always keep ≥1 action" rule stays app logic.

| Column | Type | Constraints |
|---|---|---|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT |
| risk_id | INTEGER | NOT NULL REFERENCES risks(id) ON DELETE CASCADE |
| content | TEXT | NOT NULL CHECK (length(trim(content)) > 0) |

### 6.18 `timeline_moments` (origin: U, dev-seeded)
Maps: D6 `moments` (`date` "Mar 12" → real `occurred_on`, `label`, `icon`, `locked`). Accent (D7) stays in code.

| Column | Type | Constraints |
|---|---|---|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT |
| dream_id | INTEGER | NOT NULL REFERENCES dreams(id) ON DELETE CASCADE |
| occurred_on | TEXT | NOT NULL CHECK (date(occurred_on) IS NOT NULL) |
| label | TEXT | NOT NULL |
| icon_key | TEXT | NULL CHECK (in 'spark','code','userPlus','rocket','chat','target' or NULL) |
| is_locked | INTEGER | NOT NULL DEFAULT 0 CHECK (in 0,1) — "future" moments |

Index: `idx_moments_dream (dream_id, occurred_on)`.

### 6.19 `items` (existing, v1)
Demo table backing `items-demo.tsx`. Recommendation: keep it through v2 (harmless smoke test); drop it in a later migration once a real feature screen is wired.

---

## 7. Entity relationships

```text
settings (KV, standalone)

dreams 1 ──< milestones 1 ──< quests 1 ──< tasks
   │              └──────────< ideas    ▲
   │                            └── "Approve" converts idea → quest (app transaction)
   ├──< habits 1 ──< habit_schedule_days
   │        ├──────< habit_detail_entries
   │        └──────< habit_completions
   ├──< risks 1 ──< risk_actions
   ├──< timeline_moments
   └──< dream_feeling_states >── feeling_states

time_blocks 1 ──< time_block_actions 1 ──< action_completions
```

All `──<` links are `ON DELETE CASCADE`. Habits and risks require a dream (`dream_id NOT NULL`) — wiring their screens therefore depends on dream creation being wired first (§13 ordering).

---

## 8. Ambiguities, duplicated models, and open questions

**All blocking product questions are now resolved** (revisions 2–3):
- Time-block routines **stay in the database** (blocks + actions seeded; per-date completions persisted).
- Task `duration` is **not stored** — sprint cards stop showing "45 min" once wired.
- `tasks.completed_at` **is stored**, so task-history charts remain possible.
- **Goal = Dream** — one `dreams` table; "goal" is just wording on some screens. The progress selector's divergent labels ("Financial Freedom" vs "Financial freedom & abundance") are display variants of `dreams.title`.
- **Habits belong to a dream** (`dream_id NOT NULL`); the Milestone Quests screen's habit section shows the parent dream's habits.
- **Risks are per-dream** (`dream_id NOT NULL`); the three `DEFAULT_PLANS` seed into every newly created dream.
- **Milestone status is `active`/`completed` only** — no `locked` value, no timestamps. The locked look on the map derives from path order; the "18 days in progress" caption is dropped.
- **Quests keep `created_at`** so "N days active" stays.
- **Habit medallion art derives from the title** (keyword match in code, default fallback) — no `icon_key`.
- **Approve converts an idea into a quest** under the same milestone (insert quest + delete idea, one transaction).
- Dream visuals (color/image/icon) are identical for all dreams → **code constants**; dream order derives from `id`.
- Risks/risk_actions trim (no position/timestamps) confirmed; new risks render newest-first via `ORDER BY id DESC`.

Remaining notes (non-blocking, decide in-flight):

**E. Sprint week ordering within a day.** With `tasks.position` dropped, same-day tasks order by `scheduled_time` then `id`. Fine for the current UI; the drag handles in sprint.tsx suggest manual reordering may come later — that would need a column added back.

**F. Incompatible ID types.** D1 string ids / D2+S5 resequenced numeric ids / sprint rows keyed by title — resolved by integer PKs (+ `seed_key` on dreams). The journey map's "ids always 1..n" invariant becomes `sequence_number`; stable PKs never change.

**G. Completion-state duplication for time blocks.** Home and My Day each `useState(timeBlocks)` — two divergent copies, neither per-date. `action_completions` (per action, per date) supersedes both.

**H. Identity strings.** `timeBlocks[].identity` and milestone-quests' identity card hint at an Identity entity; evidence is too thin → kept as `time_blocks.identity TEXT`. *Revisit when the feature is designed.*

**L. `currentFocus` (D1) is dead data** — nothing renders it (Home shows time blocks instead). Not mapped; delete with the dummy file later.

**M. Fulfillment history granularity.** Charts imply ≥6 months of retained completion rows; both completion tables keep full history. If stored "percent snapshots" are ever wanted, add a table later — every charted number is currently derivable.

---

## 9. Versioning, migration order, and seed strategy

### 9.1 Mechanism (already in place — extend, don't replace)
`src/db/migrations.ts` tracks schema version via `PRAGMA user_version`; each migration runs in its own transaction. **Append a `toVersion: 2` entry**; never edit v1. `LATEST_SCHEMA_VERSION` updates automatically.

### 9.2 Creation order inside migration v2 (FK dependency order)
1. `settings`
2. `dreams`
3. `feeling_states`
4. `dream_feeling_states`
5. `milestones`
6. `quests`
7. `tasks`
8. `ideas`
9. `habits` → `habit_schedule_days` → `habit_detail_entries` → `habit_completions`
10. `time_blocks` → `time_block_actions` → `action_completions`
11. `risks` → `risk_actions`
12. `timeline_moments`
13. Indexes (after all tables)

### 9.3 Seed order (same transaction, after DDL)
1. `time_blocks` + `time_block_actions` — from `src/data/timeBlocks.ts` (content only; strip `done`). Stable keys: the existing `key` strings.
2. `feeling_states` — labels from `state.tsx` `STATES` (glyph map stays in code).

Per-dream seeds (**not** global — inserted by the dreams repository inside the create-dream transaction; template constants kept in code):
3. Milestone skeleton — D2 titles Awakening→Vision, `sequence_number` 0–5.
4. Default risks + actions — `what-if-plan.tsx` `DEFAULT_PLANS`, three editable rows per new dream (a user who deletes them never sees them reappear, since they only seed at dream creation).

### 9.4 Dev fixtures vs production
- Production first-run: seeds §9.3 only; no dreams/habits — empty states must render.
- Development: a `__DEV__`-guarded `seedDevData()` that inserts the `homeDummyData` goal titles (with `seed_key`), the habits from `habits.tsx`, sprint's quest/tasks, and `progressContent.moments` — so screens look like today's mocks.
- Reset: dev-only action calling `SQLite.deleteDatabaseAsync("gemify.db")` (or `DROP` + re-migrate), compiled out with `__DEV__`; production users unaffected.

### 9.5 Future migrations
Continue the append-only `Migration[]` pattern: `toVersion` monotonic, additive changes preferred (`ALTER TABLE ADD COLUMN`), table rebuilds via the SQLite 12-step recipe when constraints must change (foreign keys OFF during rebuilds).

---

## 10. Full `CREATE TABLE` statements (proposed — do not execute yet)

```sql
-- v2 migration DDL (revision 3).

CREATE TABLE settings (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE dreams (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  seed_key         TEXT UNIQUE,
  title            TEXT NOT NULL CHECK (length(trim(title)) > 0),
  vision_statement TEXT,
  is_archived      INTEGER NOT NULL DEFAULT 0 CHECK (is_archived IN (0, 1))
);

CREATE TABLE feeling_states (
  id    INTEGER PRIMARY KEY AUTOINCREMENT,
  label TEXT NOT NULL UNIQUE COLLATE NOCASE
);

CREATE TABLE dream_feeling_states (
  dream_id INTEGER NOT NULL REFERENCES dreams(id) ON DELETE CASCADE,
  state_id INTEGER NOT NULL REFERENCES feeling_states(id) ON DELETE CASCADE,
  PRIMARY KEY (dream_id, state_id)
);

CREATE TABLE milestones (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  dream_id        INTEGER NOT NULL REFERENCES dreams(id) ON DELETE CASCADE,
  sequence_number INTEGER NOT NULL,
  title           TEXT NOT NULL CHECK (length(trim(title)) > 0),
  state           TEXT,
  artifact        TEXT,
  mentor          TEXT,
  reward          TEXT,
  status          TEXT NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active', 'completed')),
  UNIQUE (dream_id, sequence_number)
);
CREATE INDEX idx_milestones_dream ON milestones (dream_id, sequence_number);

CREATE TABLE quests (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  milestone_id INTEGER NOT NULL REFERENCES milestones(id) ON DELETE CASCADE,
  title        TEXT NOT NULL CHECK (length(trim(title)) > 0),
  is_active    INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  created_at   TEXT NOT NULL DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX idx_quests_milestone ON quests (milestone_id);

CREATE TABLE tasks (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  quest_id       INTEGER NOT NULL REFERENCES quests(id) ON DELETE CASCADE,
  title          TEXT NOT NULL CHECK (length(trim(title)) > 0),
  scheduled_date TEXT CHECK (scheduled_date IS NULL OR date(scheduled_date) IS NOT NULL),
  scheduled_time TEXT CHECK (scheduled_time IS NULL
                   OR scheduled_time GLOB '[0-2][0-9]:[0-5][0-9]'),
  is_done        INTEGER NOT NULL DEFAULT 0 CHECK (is_done IN (0, 1)),
  completed_at   TEXT
);
CREATE INDEX idx_tasks_quest ON tasks (quest_id);
CREATE INDEX idx_tasks_schedule ON tasks (scheduled_date, scheduled_time);

CREATE TABLE ideas (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  milestone_id INTEGER NOT NULL REFERENCES milestones(id) ON DELETE CASCADE,
  title        TEXT NOT NULL CHECK (length(trim(title)) > 0),
  score        INTEGER NOT NULL DEFAULT 0 CHECK (score BETWEEN 0 AND 10)
);
CREATE INDEX idx_ideas_milestone ON ideas (milestone_id);

CREATE TABLE habits (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  dream_id    INTEGER NOT NULL REFERENCES dreams(id) ON DELETE CASCADE,
  title       TEXT NOT NULL CHECK (length(trim(title)) > 0),
  cue         TEXT,
  time_of_day TEXT CHECK (time_of_day IS NULL
                OR time_of_day IN ('morning', 'after_lunch', 'evening')),
  goal_days   INTEGER NOT NULL DEFAULT 24 CHECK (goal_days > 0),
  is_archived INTEGER NOT NULL DEFAULT 0 CHECK (is_archived IN (0, 1))
);
CREATE INDEX idx_habits_dream ON habits (dream_id, is_archived);

CREATE TABLE habit_schedule_days (
  habit_id INTEGER NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  weekday  INTEGER NOT NULL CHECK (weekday BETWEEN 0 AND 6),
  PRIMARY KEY (habit_id, weekday)
);

CREATE TABLE habit_detail_entries (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  habit_id INTEGER NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  section  TEXT NOT NULL CHECK (section IN ('easy_start', 'easy_version', 'backup_plan')),
  content  TEXT NOT NULL CHECK (length(trim(content)) > 0)
);
CREATE INDEX idx_habit_details ON habit_detail_entries (habit_id, section);

CREATE TABLE habit_completions (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  habit_id   INTEGER NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  date       TEXT NOT NULL CHECK (date(date) IS NOT NULL),
  status     TEXT NOT NULL CHECK (status IN ('done', 'partial', 'missed')),
  created_at TEXT NOT NULL DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE (habit_id, date)
);
CREATE INDEX idx_habit_completions_date ON habit_completions (date);

CREATE TABLE time_blocks (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  key              TEXT NOT NULL UNIQUE,
  label            TEXT NOT NULL,
  icon_key         TEXT NOT NULL
                     CHECK (icon_key IN ('clock', 'sunrise', 'briefcase', 'sun', 'moon')),
  start_time       TEXT CHECK (start_time IS NULL
                     OR start_time GLOB '[0-2][0-9]:[0-5][0-9]'),
  identity         TEXT,
  routine_title    TEXT NOT NULL,
  routine_subtitle TEXT,
  position         INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE time_block_actions (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  time_block_id INTEGER NOT NULL REFERENCES time_blocks(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  subtitle      TEXT,
  icon_key      TEXT NOT NULL CHECK (icon_key IN
                  ('meditate', 'nourish', 'move', 'water', 'intention', 'focus')),
  position      INTEGER NOT NULL DEFAULT 0,
  is_active     INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1))
);
CREATE INDEX idx_block_actions ON time_block_actions (time_block_id, position);

CREATE TABLE action_completions (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  action_id    INTEGER NOT NULL REFERENCES time_block_actions(id) ON DELETE CASCADE,
  date         TEXT NOT NULL CHECK (date(date) IS NOT NULL),
  completed_at TEXT NOT NULL DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE (action_id, date)
);
CREATE INDEX idx_action_completions_date ON action_completions (date);

CREATE TABLE risks (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  dream_id INTEGER NOT NULL REFERENCES dreams(id) ON DELETE CASCADE,
  title    TEXT NOT NULL CHECK (length(trim(title)) > 0),
  prompt   TEXT NOT NULL DEFAULT 'If this gets in the way...'
);

CREATE TABLE risk_actions (
  id      INTEGER PRIMARY KEY AUTOINCREMENT,
  risk_id INTEGER NOT NULL REFERENCES risks(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (length(trim(content)) > 0)
);

CREATE TABLE timeline_moments (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  dream_id    INTEGER NOT NULL REFERENCES dreams(id) ON DELETE CASCADE,
  occurred_on TEXT NOT NULL CHECK (date(occurred_on) IS NOT NULL),
  label       TEXT NOT NULL,
  icon_key    TEXT CHECK (icon_key IS NULL OR icon_key IN
                ('spark', 'code', 'userPlus', 'rocket', 'chat', 'target')),
  is_locked   INTEGER NOT NULL DEFAULT 0 CHECK (is_locked IN (0, 1))
);
CREATE INDEX idx_moments_dream ON timeline_moments (dream_id, occurred_on);
```

---

## 11. Dataset → table migration mapping

| Source (file → export) | Used by | Destination | Property mapping / transform | Becomes |
|---|---|---|---|---|
| `homeDummyData.ts` → `header` | Home | `settings` | greeting → `display_name` (greeting becomes derived); subtitle → `home_subtitle` | Seed (dev) / user data |
| `homeDummyData.ts` → `goals` | Home (`GoalCard`) | `dreams` | id→`seed_key`, title; `themeColor`/`imageKey`/`iconKey` → shared code constants (same for all dreams); drop `milestone`, counters (derived) | Dev seed → user data |
| `homeDummyData.ts` → `currentFocus` | **nothing** (dead) | — | — | Stays out; delete with the dummy file later |
| `journeyMilestones.ts` → `journeyMilestoneContent` | Journey map | `milestones` | id→`sequence_number` (id−1), title, state, artifact, mentor, reward; `completed`→'completed', else 'active' (locked look derives from path order); subtitle/description dropped | Per-dream seed template + user data |
| `journeyMilestoneBoardLayout.ts`, `journeyPageConfig.ts` | Journey map | — | — | Stays in code (visual) |
| `timeBlocks.ts` → `timeBlocks` | Home, My Day | `time_blocks` + `time_block_actions` + `action_completions` | key/label/icon/time("Flexible"→NULL)/identity/routineTitle/routineSubtitle; actions minus `done`; `done` → per-date rows | Seed; completions are user data |
| `progressData.ts` → `progressContent.goals` | Progress selector | `dreams` (query) | label ← `dreams.title` | Derived |
| `progressData.ts` → `forecast` | Progress | derived | compute from completion velocity or omit (no stored target date) | Derived |
| `progressData.ts` → `moments` | Progress timeline | `timeline_moments` | "Mar 12"→`occurred_on` (year must be assumed — dev seed picks explicit dates), label, icon, locked | Dev seed → user data |
| `progressData.ts` → `fulfillmentTabs` | Progress charts | — | recompute from `tasks.completed_at` + `habit_completions` + `action_completions` | Derived |
| `progressData.ts` → `progressAccentLayout` | Progress | — | — | Stays in code |
| `sprint.tsx` → `weekDays` | Weekly Plan strip | query over `tasks` | `GROUP BY scheduled_date` | Derived |
| `sprint.tsx` → `scheduledTasks`, `unscheduledGroup`, `collapsedDream` | Weekly Plan | `tasks` (+ joins to `quests`/`milestones`/`dreams`) | time→`scheduled_time`; **duration dropped (confirmed)** — "45 min" disappears when wired; breadcrumbs→FK joins; quest 3/5→derived | Dev seed → user data |
| `milestone-quests.tsx` → `ideas` | Milestone Quests | `ideas` | title, score; icon dropped; Approve → insert `quests` row + delete idea (one transaction) | Dev seed → user data |
| `milestone-quests.tsx` → `questTasks` | Milestone Quests | `tasks` | done→`is_done`; `frequency` strings dropped (not modeled) | Dev seed → user data |
| `milestone-quests.tsx` → hero copy / `identity` / `dummyHabit` | Milestone Quests | `milestones` / unresolved (§8-H) / `habits` | ring % derived; "18 days in progress" dropped (no timestamp); "7 days active" ← `quests.created_at` | Dev seed / identity open (§8-H) |
| `habits.tsx` → `habitGroups` | Habits | `habits` + `habit_detail_entries` + `habit_completions` | group title→`dreams.title` lookup (`dream_id NOT NULL`); time→`cue`; day/goal→derived from completions + `goal_days`; progress array → dated rows (`open` = no row); detail rows → entries per section; medallion art derived from title in code | Dev seed → user data |
| `state.tsx` → `STATES` | State picker | `feeling_states` | labels only; glyph map stays in code | Seed |
| `state.tsx` → `selected` | State picker | `dream_feeling_states` | insertion order = selection order | User data |
| `what-if-plan.tsx` → `DEFAULT_PLANS` | What If Plan | `risks` + `risk_actions` | title, prompt, actions[]→rows | Per-dream seed at creation (editable) |
| `JourneyMapControls.tsx` → `DREAM_NAME`, `VISION_STATEMENT` | Journey overview modal | `dreams.title`, `dreams.vision_statement` | direct | User data |
| `create-habit.tsx` → form defaults | Create Habit | — (demo prefills) | replace with empty form once wired | Removed at wiring time |
| `create-habit.tsx` → `DAYS`, `TIMES`, `textSteps` | Create Habit | — | — | Stays in code |
| `icons.ts` / `images/` / `menuIcons.ts` | GoalCard, tab bar | — | shared constants (all dreams look the same) | Stays in code |
| `db/migrations.ts` → `items` | items-demo | `items` (unchanged) | — | Keep for now; drop in a later migration |

Migration risks worth flagging: (1) dummy dates lack years ("Mar 12", week of "May 24") — dev seeds must pick explicit dates; (2) `progressContent` labels vs `homeDummyData` titles differ — pick the `homeDummyData` titles as canonical; (3) sprint's "Become a Creator" milestone does not exist in `journeyMilestoneContent` — dev seed must add it or re-point the tasks.

---

## 12. Recommended data-access architecture

Extend the pattern already proven by `items`:

```text
Screens & components            (no SQL, no db imports)
        ↓
Feature hooks                   src/hooks/useDreams.ts, useHabits.ts, useMyDay.ts, ...
        ↓                       (loading/error state, optimistic list updates — clone useItems.ts)
Repositories                    src/db/dreamsRepository.ts, milestonesRepository.ts,
        ↓                       habitsRepository.ts, tasksRepository.ts, timeBlocksRepository.ts,
        ↓                       risksRepository.ts  (row↔model mapping, all SQL lives here)
SQLite layer                    src/db/database.ts (existing), src/db/migrations.ts (existing)
```

Guidelines:
- One repository per aggregate, not per table: `risksRepository` owns `risks` + `risk_actions`; `habitsRepository` owns the habit child tables; `milestonesRepository` owns milestones + `sequence_number` renumbering.
- **Transaction boundaries** (`db.withTransactionAsync`, already used by the migration runner) around every multi-table invariant:
  - create dream = insert dream + skeleton milestones + default risks/actions + feeling-state links
  - insert/delete milestone = row change + renumber `sequence_number` of siblings
  - **approve idea = insert quest + delete idea** (confirmed behavior)
  - save risk = upsert risk + replace its actions
  - create habit = habit + schedule days + detail entries
- Repositories return camelCase domain types (`src/db/types.ts` pattern) so screens keep their current prop shapes; the `journeyMilestones` "compatibility view" concept survives as a repository-level join.
- Derived values (progress %, counts, streaks, "Day N", charts) are computed in repositories/hooks via SQL aggregates — never stored, never computed in components.

---

## 13. Recommended implementation sequence (next task)

1. **Migration v2** in `src/db/migrations.ts` (DDL from §10 + §9.3 global seeds 1–2). Verify with a fresh install and an upgrade-from-v1 install.
2. **Time blocks / My Day vertical slice** (`timeBlocksRepository` + `useMyDay`): smallest surface, fixes the Home-vs-MyDay duplicated state, exercises seeds + per-date completions.
3. **Dreams + feeling states**: wire `create-goal` → `describe-dream` → `state` to actually insert a dream (currently the input is discarded) — the create-dream transaction also seeds the milestone skeleton and default risks; point Home's goal list at the table (`ORDER BY id`); wire `JourneyMapControls` name/vision editing + Delete Dream.
4. **Milestones**: swap `JourneyMapScreen`'s `useState(journeyMilestones)` for the repository (`sequence_number` ordering replaces id resequencing).
5. **Risks**: swap `what-if-plan.tsx` state for `risksRepository` (CRUD already matches 1:1; screen needs the dream context from step 3).
6. **Habits** (largest slice; needs dreams from step 3): create-habit submit, habits list, completion toggling.
7. **Quests/tasks + sprint board** (incl. the idea→quest approval transaction), then **progress screen** aggregates last (they need real completion history to chart).
8. Only after each screen is wired: delete its dummy source (out of scope now).

All blocking product questions are resolved (§8); the remaining notes there (E, H, L, M) can be decided in-flight.

---

## Appendix: file coverage list

Screens: `(tabs)/index`, `(tabs)/my-day`, `(tabs)/sprint`, `(tabs)/progress`, `(tabs)/habits`, `(tabs)/milestone-quests`, `(tabs)/_layout`, `journey-map` (+`screens/JourneyMapScreen`), `create-goal`, `describe-dream`, `state`, `create-habit`, `what-if-plan`, `details`, `items-demo`, `_layout`.
Data: all 10 files under `src/data/` (incl. `images/index.ts`).
Components: `JourneyMapControls`, `JourneyMapScroll`, `JourneyMilestone(+Label)`, `TimeBlockCard`, `TimeBlockTabs`, `HabitItem`, `DatePickerModal`, `home/*` (3), shared component library (presentational only — no domain data found).
Infra: `src/db/*` (5 files), `src/hooks/useItems.ts`, `src/utils/milestonePagination.ts`, `package.json` (`expo-sqlite ~56.0.5` present).
