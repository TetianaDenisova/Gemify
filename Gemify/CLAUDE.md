# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development commands

```bash
npm start        # Start Expo dev server (opens menu for iOS/Android/web)
npm run android  # Open Android emulator
npm run ios      # Open iOS simulator
npm run web      # Open web browser
npm run lint     # Run ESLint
npm run typecheck # tsc --noEmit
```

**Important:** Expo 56 is bleeding-edge (Jan 2026). Always consult the [versioned docs](https://docs.expo.dev/versions/v56.0.0/) before writing any code — APIs change frequently in v56.

## Architecture

### Core concept: The Journey
This app frames goal achievement as a **journey** from point A (current state) → point B (dream). The visual metaphor is central:
- A **dream** (goal) maps to a **journey** with **milestones** along a path
- Each milestone has a state (e.g. "Calm", "Focused"), mentor, artifact, and reward
- The **journey map** is a zoomable, interactive canvas showing all milestones positioned on the map art

### Persistence: expo-sqlite
All user data lives in a local SQLite database behind `src/db/` (barrel: `@/db`):
- `database.ts` — single shared connection, forward-only migrations via `PRAGMA user_version`
- `migrations.ts` — ordered migrations; **never edit or reorder shipped entries**, always append
- Per-aggregate repositories (`dreamsRepository`, `milestonesRepository`, `questsRepository`, `habitsRepository`, `timeBlocksRepository`, `risksRepository`, `timelineRepository`) with explicit snake_case → camelCase row mappers
- `backup.ts` — versioned JSON export/import of the whole database
- Screens load via hooks in `src/hooks/` (`useDreamSummaries`, `useDayQuestBlocks`, `useHabitWeek`, `useProgressContent`) that refresh on focus. No Redux/Zustand — React state + focus-driven refresh only. No backend API.

### Routing and screens
**File-based routing** via `expo-router`:
- `src/app/(tabs)/` — bottom-tabbed screens (Home, My Day, Milestone Quests, Habits, Sprint/Weekly Plan, Progress, Memories)
- `src/app/` — stack screens (what-if-plan, create-goal, describe-dream, see-dream, state, create-habit, milestone-ideas; journey-map re-exports `src/screens/JourneyMapScreen`)
- `src/app/_layout.tsx` — Root stack + GestureHandler wrapper; stack screens that draw their own header use a transparent native header with `headerTitle: ""`
- `src/app/(tabs)/_layout.tsx` — Tab bar with custom SVG icon rendering

Navigation between tabs uses `router.navigate`, never `push` (push stacks duplicates). Group segments like `(tabs)` must not appear in hrefs.

### Theme and styling
Centralized design tokens in `src/theme/`:
- `colors.ts` — primary/secondary, background, surface (surfaceCard/surfaceDeep/surfaceGlass), border tiers (borderFaint/border/borderStrong/borderSoft/divider), text tones. Dark theme, gold accents; violet accents via `accentViolet`/`accentVioletStrong`. (`surfaceGlass` is a translucent rgba fill — plain styling, no native glass module.)
- `theme.ts` — spacing, radius (incl. `card`/`sheet`), shadows (`shadowStyle`/`textGlow` helpers), typography roles, `layout` (compactBreakpoint, shortScreenBreakpoint, headerHeight, contentMaxWidth, screenPaddingH, tabBar sizes), `pressed`, gradients (typed tuples, incl. `cta`), `withOpacity(color, opacity)` for alpha variants of tokens
- All components import from `@/theme/colors` / `@/theme/theme` — no inline color/size literals

### Shared component system
`src/shared/components/` (barrel: `@/shared/components`) holds the app-wide UI primitives — use these instead of hand-rolling:
- `ScreenScaffold` (background/keyboard/scroll/tab-clearance wrapper for every screen), `ScreenHeader` (left button · title/subtitle · right button; `asStackHeader` for stack screens, `backFallback` for no-history back), `IconButton`, `AppButton` (primary gold-gradient CTA / secondary / ghost), `AppText` (all text — variants map to theme typography), `AppInput`, `Card` (default/glass/strong), `ConfirmDialog` (the app-wide delete/confirm modal), `ProgressRing`, `ProgressBar`, `Checkbox`, `Chip`, `Badge`, `ListItem`, `SectionHeader`, `AppModal` (center/sheet), `HintRow`, and the shared SVG icon set in `icons.tsx`.
- Never render raw `<Text>` in screens — use `AppText` with a variant.
- Never define a screen-local SVG icon that duplicates a shared one — add it to `src/shared/components/icons.tsx` instead.
- `useCompact()` in `src/hooks/` replaces hand-rolled `width < layout.compactBreakpoint` checks.

### Feature components
- `src/components/home/` — HomeHeader, GoalCard, TodayProgressCard, DayCompleteCard
- `src/components/` — JourneyMapScroll (zoomable canvas), JourneyMilestone(+Label) (memoized — keep `onPress` stable with `useCallback`), JourneyMapControls, TimeBlockCard/Tabs, HabitItem, DatePickerModal, QuestActions, QuestPickerSheet, OnboardingStep (shared shell of the dream-creation steps)
- Feature components consume the shared layer internally; keep them in `src/components/`, not `src/shared/`.
- All styled with exported `StyleSheet` objects; no CSS or styled-components

## Key files to know

| File | Purpose |
|---|---|
| `src/app/(tabs)/_layout.tsx` | Tab bar definition + custom icon rendering |
| `src/app/(tabs)/index.tsx` | Home screen: goals list + current focus |
| `src/app/(tabs)/milestone-quests.tsx` | Daily quests tied to a milestone |
| `src/app/(tabs)/sprint.tsx` | Weekly quest board with drag-to-reschedule |
| `src/app/what-if-plan.tsx` | Risk/contingency planner ("if tired, do 5-min version") |
| `src/screens/JourneyMapScreen.tsx` | The zoomable journey map + milestone editing |
| `src/db/migrations.ts` | Schema migrations (append-only) |
| `src/data/journeyMilestones.ts` | Milestone type contracts (content comes from the DB) |
| `src/theme/colors.ts` | Color palette (dark, gold-accented) |
| `src/theme/theme.ts` | Spacing, radius, shadows, typography, gradients |

## Adding new features

**New tab screen:** Create `src/app/(tabs)/[name].tsx`, export a default component, and add a `<Tabs.Screen>` entry in `src/app/(tabs)/_layout.tsx`. Add icon data to `src/data/menuIcons.ts`.

**New persisted data:** Append a migration in `src/db/migrations.ts`, add a repository (or extend one) with an explicit row mapper, export it from `src/db/index.ts`, and load it through a focus-refreshing hook in `src/hooks/`. Add new tables to `BACKUP_TABLES` in `src/db/backup.ts` (parents before children).

**Styling:** Always use theme exports (`colors.*`, `spacing.*`, etc.). No magic numbers for padding, font size, or color. For an alpha variant of a token use `withOpacity`.

## Quirks and gotchas

- **Expo 56 is new.** Features ship frequently; the docs are the source of truth. Don't assume patterns from older Expo versions work.
- **SVG rendering:** All custom icons are `react-native-svg` components (no `.svg` file imports). Mobile SVG rendering differs from web.
- **React Compiler is enabled** (`experiments.reactCompiler` in app.json) — follow the Rules of React strictly; violations make the compiler silently bail out of a component.
- **Safe area insets:** Screens use `react-native-safe-area-context` for notch/home indicator spacing. Check `useSafeAreaInsets()` if adding header or bottom UI.
- **expo-sqlite on web** needs `wasm` in Metro's assetExts and cross-origin isolation headers — both configured in `metro.config.js`; don't remove them.
- **Dynamic imports:** `expo-file-system`, `expo-sharing`, `expo-document-picker` are loaded via `await import()` in `src/db/backup.ts` — dependency scanners that only see static imports will wrongly flag them as unused.
- **No test infrastructure.** No Jest, no testing library. Manual testing in dev (plus `npm run typecheck` and `npm run lint`) is the current bar.
