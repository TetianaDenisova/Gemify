# Gemify — Refactoring & Optimization Plan

Full-codebase audit (2026-08-30): all screens (`src/app`), components (`src/components`, `src/shared`), data/theme/db layers, and project config/assets. Each item is actionable on its own; sections are ordered by priority. You can hand any single section to Claude as a task prompt.

## Implementation status (2026-08-30)

**DONE** (uncommitted on `refactor/image-delete`; `tsc --noEmit` and `expo lint` clean):
- §0 critical: `app.config.js` icon paths fixed (demo/personal icon branch removed); `git gc` run (loose objects packed); stale `dist/` and `design-export/` deleted; `extra.appVariant`/`extra.router` removed from app.json. *Branch still needs pushing.*
- §1 dead code: all listed files/blocks deleted (journey dummy content, settingsRepository, milestonePagination, theme barrel, svg.d.ts + Metro SVG transformer, homeData re-export, dead theme tokens, dead controls, `FormField`, `HabitItemCard`); routine-actions join path removed (`getTimeBlocks` used instead); migration v11 drops the `items` table; **10 unused dependencies removed** from package.json; `typecheck` script added, broken `reset-project` removed.
- §2 icons: generic glyphs consolidated into `src/shared/components/icons.tsx` (Calendar/Clock/Gear/Trash/SparkleGlyph/Image/StepIcon moved; `PencilIcon` shadowing resolved via `variant="detailed"`; `DotsIcon` gained `orientation`). Single-use unique glyphs intentionally left local.
- §3 partial: `ConfirmDialog` (replaced all 6 copies), `OnboardingStep` (create-goal & describe-dream now ~50 lines each), `useCompact()` hook created, `ScreenHeader` gained `backFallback`.
- §4 perf: sprint drag gestures memoized; home focus derivation in one `useMemo`; journey map memoized (`JourneyMilestone`/`Label` + `useCallback` press + `expo-image` + `JourneyMapScroll` fixes); memories chunking memoized + static shadow hoisted; `QuestPickerSheet.groupQuests` memoized; habits groups/checks memoized; `TimeBlockTabs` effect deps fixed; gradient tuples (casts removed).
- §7 partial: `Goal.photoUri` dead field removed (GoalCard intentionally ignores photos — comment says so); goal art now keyed by `dream.id` (stable); `TimeBlockIcon` union + `toBlockIcon` narrowing (casts gone); `toProgressMoment` uses `Omit<TimelineMoment,"dreamId">`; `weights` memo split; feeling states moved to `src/data/feelingStates.ts`; `@/db/backup` deep import normalized.
- §8 nav: `/(tabs)/` href fixed, `push`→`navigate` for tab jumps, stack screens get `headerTitle:""` (generated from array), root inline style hoisted, memories deep-link kept as documented render-adjustment pattern.
- §10: CLAUDE.md rewritten (SQLite reality, errors fixed), README rewritten, `.gitignore` covers `.env*`, ESLint ignores widened.

**REMAINING** (see sections below for detail): §3 GoalPicker/tab-header/Ornament/QuestBreadcrumb extractions, chip/close-button/handle consolidation, date-utils dedup, `useQuestActions`/`useRefreshOnFocus` hooks; §4 FlatList conversions + row memo; §5 asset compression (needs image tooling) + iOS icon + asset naming; §6 remaining color-token sweep (`withOpacity` is now exported), spacing-scale gaps; §7 type-file naming, `TimelineMoment` view-model rename; §9 file decomposition; §10 typescript-eslint/react-compiler lint plugins, Prettier, CI.

---

## 0. CRITICAL — build is broken

**`app.config.js:7-8` references icons deleted in commit `3df07bb`:**

```js
const PERSONAL_ICON = './assets/images/icon-personal-1024.png';        // deleted
const PERSONAL_ICON_ADAPTIVE = './assets/images/icon-personal-adaptive.png'; // deleted
```

These are used unconditionally on the **default (non-demo) path** — `APP_VARIANT` is unset by default, so `IS_DEMO === false`. Any `expo prebuild` or EAS build fails to resolve the icon.

**Fix:** restore the two icons, or point both constants at the surviving `./assets/images/icon.png` / `./assets/images/android-icon-foreground.png` and delete the demo/personal icon branch. Also update the stale comment referencing `icon-personal.png`.

**Related git state:**
- Branch `refactor/image-delete` is local-only (no upstream) — push it.
- `git count-objects -vH` shows **126 MiB of loose objects, zero packfiles**. Run `git gc --aggressive --prune=now`.
- `dist/` holds 17 MB of stale web build output (including copies of deleted images) — delete it.

---

## 1. Quick wins — dead code (zero behavior change, ~1000+ lines removed)

### Dead files / blocks — delete outright
- `src/data/journeyMilestones.ts:41-118` — `journeyMilestoneContent`, `getBoardConfig`, and the `journeyMilestones` compat view are imported **nowhere** (the journey map now builds from real DB rows via `toJourneyData()`). Keep only the types. This also removes the circular import with `journeyMilestoneBoardLayout.ts`.
- `src/db/settingsRepository.ts` — entirely dead (33 lines); the `settings` table is created but never written.
- `src/utils/milestonePagination.ts` — 95% dead: `paginateMilestones`, `getMilestoneRingY`, both page-limit constants have zero consumers. Only the `JourneyPageVerticalBounds` type is used.
- `src/data/journeyPageConfig.ts:14-21` — only `journeyPageConfigs[0]` is ever read; entries 1-2 are unreachable.
- `src/data/icons.ts:15-19` — `focusIcons` unused (and maps `heart`→lotus, `sunrise`→spark — placeholder art).
- `src/data/homeData.ts` — an 11-line pure re-export of `homeTypes.ts` containing no data. Delete; import `@/data/homeTypes` directly.
- `src/theme/index.ts` — the theme barrel is imported by **0 files** (all 98 imports go direct to `@/theme/colors` / `@/theme/theme`), and it omits `shadowStyle`/`textGlow`/`inputFocusReset` which ARE used. Delete it (or complete it and enforce via ESLint `no-restricted-imports`).
- `src/types/svg.d.ts` + the SVG-transformer block in `metro.config.js` + devDep `react-native-svg-transformer` — there are **zero `.svg` imports** in `src/`; all icons are hand-authored `react-native-svg` JSX. Removing this also drops a custom Babel transformer from every Metro build.
- `src/components/HabitItem.tsx:360` `HabitItemCard` — zero references (plus its `habitCard`/`habitCardCompact` styles).
- `src/components/WeekAscentCard.tsx:249` `styles.cardCompact` — never referenced.
- Dead controls: `src/app/(tabs)/progress.tsx:460-465` hamburger with `onPress={() => {}}`; `src/app/state.tsx:132-136` `rightAction` with `onPress: () => undefined`.
- `src/app/what-if-plan.tsx:454-478` `FormField` — a zero-value 5-prop passthrough to `AppInput`.

### Dead theme tokens (`src/theme/`)
`colors.accentPinkGlow`, `colors.secondarySoft`, `colors.success`, `colors.warning` (duplicate of `primary` — `#F5B84B` twice, colors.ts:9 vs :38), `typography.display` + `fontSizes.display` + `lineHeights.display`, `iconSizes.xs`/`xl`, `controls.button.hero`, `controls.chip`, `controls.field`, `controls.iconFrame`, `gradients.primary`, `gradients.surface`, `fonts.sans`, the `theme` aggregate + `AppTheme`, `ThemeColors`.

### Dead DB scaffolding (decide: wire up or delete)
- **Routine actions subsystem:** `timeBlocksRepository.ts:87` `setActionDone` and `:107` `getDayProgress` have zero consumers, so `action_completions` is never written. `getTimeBlocksForDate` (`:32`) does a 3-table LEFT JOIN whose only caller (`useDayQuestBlocks.ts:94`) **discards `.actions` entirely**. Switch the caller to the join-free `getTimeBlocks()` and delete the join path + `TimeBlockWithActions`/`TimeBlockActionRecord` — or commit to the feature. Right now every My Day / Home render pays a pointless 3-way join.
- Unused barrel exports: `getFeelingStates`, `getDreamFeelingStates`, `setDreamFeelingStates`, `deleteIdea`, `resetDatabaseForDev`. Feeling states are write-only tables today.
- `migrations.ts:22-30` still creates the deleted `items` feature's table. Add a new migration `DROP TABLE IF EXISTS items` (never edit shipped migrations).

### Unused dependencies (verified — zero imports anywhere)
Remove from `package.json`: `@expo/ui`, `expo-glass-effect`, `expo-constants`, `expo-device`, `expo-font`, `expo-linking`, `expo-symbols`, `expo-system-ui`, `expo-web-browser`, plus devDep `react-native-svg-transformer`. Each unused Expo package adds native code to the binary.

**Do NOT remove** (needed despite no static imports): `react-dom`, `react-native-web`, `react-native-screens`, `react-native-worklets`, `expo-splash-screen`, and the dynamically-imported `expo-file-system` / `expo-sharing` / `expo-document-picker` (used via `await import()` in `src/db/backup.ts`).

---

## 2. Icon consolidation — the single biggest duplication (~500 lines)

`src/shared/components/icons.tsx` exports 12 icons; **~45 more are hand-defined in screens and feature components**, including name-shadowing footguns:

- `PencilIcon` defined **three times**: shared `icons.tsx:186`, `QuestActions.tsx:258`, `habits.tsx:79` — `QuestActions` uses its local one while importing other icons from shared in the same file.
- `DotsIcon` shadowed in `milestone-quests.tsx:217`; five separate dot-menu glyphs total (`MoreDotsIcon`, `DotsGlyph`, `MenuIcon`…).
- Calendar ×5 (`QuestActions`, `DatePickerModal`, `memories`, `my-day`, `sprint`), Clock ×4, Spark/Sparkle ×6, Gear ×2 (byte-identical), Trash ×2, `SparkleGlyph` byte-identical in `memories.tsx:97` and `progress.tsx:406`.
- `create-habit.tsx:119` `Icon` — a ~155-line SVG switch living in a screen.
- Moon/briefcase/sun-horizon exist in both `QuestActions.tsx` and `TimeBlockTabs.tsx`.

**Fix:** move every generic glyph into `src/shared/components/icons.tsx` (split into an `icons/` folder with barrel once it exceeds ~400 lines), standard `IconProps` signature, delete the shadowing duplicates. Keep only domain art (`ActionIconArt`, `BlockIconArt`, `HabitArt`) in feature files — but move `BlockIconArt`/`ActionIconArt` out of their current homes to kill the cross-feature imports (`WeekAscentCard` importing from `TimeBlockCard`, `TimeBlockCard`/`TimeBlockSettingsModal` importing from `TimeBlockTabs`).

---

## 3. Duplicated UI to extract into shared components

1. **`<ConfirmDialog />`** — the delete-confirmation modal is written **six times** with identical structure: `milestone-quests.tsx:897-922`, `habits.tsx:492-517`, `sprint.tsx`, `my-day.tsx`, `create-habit.tsx`, `what-if-plan.tsx:267-294`. (~150 lines + 18 style entries.)
2. **`<OnboardingStep />`** — `create-goal.tsx` and `describe-dream.tsx` are ~95% the same 138-line file (identical imports, layout logic, and StyleSheet). Both become ~30 lines.
3. **Tab-screen header** — `memories.tsx:499-521`, `progress.tsx:459-479`, `habits.tsx:378-403` hand-roll what `ScreenHeader` already provides (including the spacer-for-centering hack), with **byte-identical style blocks** across all three. Add `glow`/`compact` support to `ScreenHeader` (or a `TabScreenHeader` wrapper).
4. **`<GoalPicker />`** — copy-pasted between `memories.tsx:523-550` and `progress.tsx:481-508` and already visually drifted (progress adds surface/border styles memories lacks).
5. **`<Ornament />`** — ornament row triplicated in `create-habit.tsx:104-117`, `habits.tsx:109-117`, `state.tsx:50-58`.
6. **`<QuestBreadcrumb />`** — dream › milestone breadcrumb written three times (`sprint.tsx:169-209`, `index.tsx:290-313`, `index.tsx:402-426`).
7. **Chip variants** — `QuestActions.tsx` `dayChip`/`timeChip` are byte-identical to each other and duplicate shared `Chip`; the selected-check overlay is rendered 4×. Extend `Chip` with `size="grid"` + `showSelectedCheck`.
8. **Sheet close button + drag handle** — four close-button implementations and three drag-handle variants; make them `AppModal` props (`handleVariant`, close affordance).
9. **`useCompact()` hook** — `const compact = width < layout.compactBreakpoint` + `useWindowDimensions()` appears 10×; `HabitItem.tsx:179` even calls `useWindowDimensions()` per habit row.
10. **`useImagePicker()`** — `memories.tsx:365-398` and `see-dream.tsx:92-117` duplicate the permission→launch→try/catch photo flow.
11. **`useQuestActions()` / `useRefreshOnFocus()`** — optimistic quest toggle + reload-on-error and the mounted-guard/`useFocusEffect` boilerplate are duplicated across `my-day`, `sprint`, `milestone-quests` and the data hooks (`useDreamSummaries`, `useDayQuestBlocks`; `useProgressContent` has the same pattern *minus* the mounted guard — a latent bug).
12. **Date utils** — move into `src/utils/dates.ts`: Monday-first index `(getDay()+6)%7` (3 copies), noon-TZ guard `new Date(\`${key}T12:00:00\`)` (5 copies), `scheduleLabel`, `MONTH_NAMES`/`WEEKDAY_NAMES`. Fix the **two conflicting `WEEKDAY_LABELS`** (`DatePickerModal.tsx:23` Mon-first vs `QuestActions.tsx:55` Sun-first, same name, one exported) and the duplicated `DAYS` arrays.

---

## 4. Performance

**There is zero `React.memo`, ~zero `useMemo`/`useCallback`, and zero `FlatList` in the entire app.** Priorities:

1. **`sprint.tsx:467-469`** — worst bug: `new Map(scheduled.map(q => [q.id, makeDragGesture(q)]))` builds a fresh `Gesture.Pan()` per quest on **every render** (renders are frequent — shared values, modals, date changes). Every `GestureDetector` re-registers. Memoize on `[scheduled]`.
2. **Journey map** (`JourneyMapScreen.tsx`, 1768 lines): the render-prop child of `JourneyMapScroll` (`:1283-1300`) plus non-memoized `JourneyMilestone`/`JourneyMilestoneLabel` means every keystroke in the milestone editor re-reconciles all milestone SVGs. `memo` both components, `useCallback` `handleMilestonePress` (`:1153`), hoist `GoldenConnector`'s static `<Svg>` (`JourneyMilestoneLabel.tsx:27-57`), memoize `JourneyMapScroll`'s `Asset.fromModule` call (`:51`) and its `layout` object (`:72`).
3. **`index.tsx:121-197`** — the whole focus/next-block derivation (filter→map→concat→reduce-in-reduce→sort) runs unmemoized every render; `new Date()` constructed 3× per render pass. `useMemo` + a single `now`.
4. **`memories.tsx`** — `momentRows` chunking (`:476-495`) recomputes on every render, and per-row `onLayout` `setRowTops` (`:582-587`) triggers those renders → layout thrash. Memoize on `[moments, itemsPerRow]`. Also hoist the `shadowStyle(...)` call at `:235` out of the per-item render (it does regex hex parsing on web); same issue in `HabitItem.tsx:98`.
5. **`QuestPickerSheet.tsx:74`** — O(n²) `groupQuests(quests)` runs on every collapse/expand toggle. `useMemo` on `[quests]`. Convert its triple-nested `.map` inside `ScrollView` (`:125-207`) to `SectionList`.
6. **Lists** — every list in the app is `.map()` inside `ScrollView` (all rows mount eagerly, unbounded user data): sprint quests, milestone quests, habit boards (rendered TWICE — main list + Manage modal), memories timeline. At minimum `memo` the row components; habits and memories are the strongest `FlatList` candidates.
7. **Inline allocations** — anonymous handlers/objects created inside list `.map`s throughout (`memories`, `milestone-quests`, `habits`, `sprint`, `index`, `TimeBlockCard.tsx:368,418`); inline style objects in `_layout.tsx:29`, `my-day.tsx:227-232` (incl. a ~40-line inline `emptySlot` JSX prop), `progress.tsx:478`.
8. **`JourneyMilestone.tsx:1` imports `Image` from `react-native`** while the other 17 files use `expo-image` — and it's the file rendering the two 3 MB circle PNGs (no disk cache, no downsampling). Switch to `expo-image`.
9. `useProgressContent.ts:357-413` — `useMemo` recomputes the entire content object on every `milestones` identity change though it's only needed for `weights`. Split the memo.
10. `TimeBlockTabs.tsx:150-152` — `useEffect` depends on non-memoized `centerTab` redeclared each render; `JourneyMapScroll.tsx:84` effect lists `viewport.width` it never reads (extra `scrollTo` on rotation).

---

## 5. Assets — 45 MB → target under 6 MB

No orphaned files remain after the cleanup (all requires resolve), but per-file bloat is severe:

- **Buttons/icons shipped as multi-MB PNGs:** `assets/plus.png` (1.74 MB, 1024² — `PlusIcon` SVG already exists in shared), `assets/state/continue-btn.png` (2.37 MB), `assets/sprint-door-icon.png` (2.03 MB). Replace with SVG components.
- **RGB images that should be JPEG/WebP:** all 9 `assets/images/main-dream-bg/dream-bg-*.png` (~13 MB total → ~1.5 MB as q85 WebP), `level2.png`, `sprint-door-icon.png`.
- **Oversized:** `circle-inactive.png` 3.18 MB + `circle.png` 3.02 MB (1536×1024 for milestone rings), `icon.png` 1.97 MB for a 1024² app icon (~20× typical), `android-icon-foreground.png` 875 KB.
- Run everything through `pngquant`/`oxipng`, downscale the 1536×1024 art to actual render size.
- `main-dream-bg` numbering skips 3 (`1,2,4..10`) and `src/data/images/index.ts` mirrors the gap — renumber.
- **Layout inconsistency:** assets split across `assets/**`, `assets/` root, and `src/data/images/**` with no rule; filename conventions mix snake/kebab; `memory-custle.png` is a typo (castle). Pick one home and one convention.
- **`@/assets/*` tsconfig alias is declared but used by zero files** while 20+ files do `require("../../../assets/…")` — and it overlaps ambiguously with `@/*`. Either migrate to a non-colliding alias (needs Metro/Babel resolution too) or delete it.
- iOS icon (`app.json` `ios.icon: "./assets/expo.icon"`) is **still the stock Expo placeholder** — Android gets branding, iOS ships the Expo logo.

---

## 6. Theme-token gaps (colors/spacing hardcoded in screens)

- **Export `withOpacity()`** (`theme.ts:342-357`, currently private) — it's exactly what ~14 hand-written `rgba(...)` alpha-variants of `colors.primary`/`textPrimary`/`accentViolet` need (sites listed: `index.tsx:499`, `QuestPickerSheet.tsx:265,293`, `QuestActions.tsx:838,941`, `(tabs)/_layout.tsx:23,53`, `memories`, `milestone-quests`, `progress.tsx:60-64`…).
- **Ad-hoc palettes defined in screens** → promote to theme: `index.tsx:44-53` `LATER_COLORS` (8 hexes), `create-habit.tsx:43-46` violet ring colors, `progress.tsx:60-64` chart sub-palette, `HabitBoardCard.tsx:109-170` (3 hexes ×3 repeats), `milestone-quests.tsx:74` `HABIT_ACCENT_CYCLE` (1 token + 3 raw hexes), `milestone-ideas.tsx` violet hexes.
- **Duplicate gradient literals:** the left-scrim-over-art gradient copy-pasted in `index.tsx:37-41` ≡ `milestone-quests.tsx:683-687` ≈ `GoalCard.tsx:22-26`; bottom-fade duplicated in `my-day.tsx:270` ≡ `sprint.tsx:738`; per-screen night-background gradients in `habits.tsx:41-46`, `sprint.tsx:68`, `JourneyMapScreen.tsx:129` while `gradients.background` has 1 consumer. Add `gradients.artScrimLeft` / `bottomFade` / `screenNight`.
- `ART_BACKING = "#01030E"` defined twice (`GoalCard.tsx:35`, `DayCompleteCard.tsx:15`).
- **Spacing scale has gaps:** 60+ call sites use `6/10/12/14/18/22/28` which the `4/8/16/24/32` scale doesn't offer — extend the scale, then sweep the magic numbers (worst: `HabitItem.tsx:382-555`, `TimeBlockCard.tsx:429-605`).
- Missing layout tokens: header height `68` re-typed in 3 files, short-screen breakpoint `760` in 3 files; `what-if-plan.tsx:80-81` invents its own `width < 380` breakpoints while everything else uses `layout.compactBreakpoint`.
- **Type gradients as tuples** (`readonly [string, string, ...string[]]`) — removes the 5 casts/spread-copies at `AppButton.tsx:97`, `ScreenScaffold.tsx:134`, etc.
- `AppButton`'s local `HEIGHTS` record vs `controls.button.*` — two competing button-sizing systems; screens also reach into `controls.button` to rebuild button geometry by hand. Collapse into one.

---

## 7. Data layer & typing

- **`Goal.photoUri` is silently dead** — `toGoal()` (`index.tsx:88-96`) never copies `dream.photoUri` and `GoalCard` never reads it, so user dream photos never render on Home. Wire it or delete the field.
- **Unstable index-cycled visuals:** `GOAL_VISUALS` (`index.tsx:72-86`) keys art by list index, so a dream's art changes when another dream is added/archived. Key by `dream.id`. Same split-brain: `HABIT_ICONS` (index-keyed) vs `QUEST_ICONS` in `useDayQuestBlocks.ts:58-70` (id-keyed) — consolidate one `iconForId()`.
- **Content hardcoded in screens** → `src/data/`: `state.tsx:28-44` `STATES` (15 feeling states — also the third copy; the screen should read `getFeelingStates()` from the DB, which exists and is unused), `create-habit.tsx:68-102` form-step copy, greeting strings in `index.tsx:55-60`, and all user-facing strings inside `useProgressContent.ts` (~15 strings incl. the whole forecast copy table at `:217-266`).
- **`TimelineMoment` name collision:** view-model in `progressData.ts:22-33` vs DB record in `db/types.ts:247-258` — forces alias imports. Rename view-model `TimelineMomentView`. Also `HomeHeader` type collides with the `HomeHeader` component.
- **Loose db-boundary typing:** `TimeBlockRecord.iconKey: string` forces `as TimeBlock["icon"]` casts (`useDayQuestBlocks.ts:126`, `useProgressContent.ts:280-282`); `HabitTimeOfDay = string` is an alias to string. Type the columns with real unions + one `parseIconKey()` helper.
- `useDayQuestBlocks.ts:127` stuffs sentinel `"Flexible"` into an `HH:MM` field then string-compares it against clock values — model as `startTime: string | null`, format at render.
- Half of `homeTypes.ts` is dead (`HomeData`, `HomeHeader`, `FocusItem`, `FocusStatus`, `FocusIconKey`); `progressData.ts` contains only types despite the name (`ProgressAccent` unused) — rename to `*.types.ts`.
- Naming: three modules called "icons" (`data/icons.ts`, `data/menuIcons.ts`, `shared/components/icons.tsx`); `data/icons.ts` file vs `data/icons/` folder; types live in 4 locations with 4 conventions (`src/types/`, `src/dto/`, `db/types.ts`, `data/*Types.ts`). Pick one convention.
- Single-consumer exports to de-export: `getRiskById` from db barrel, `getJourneyMilestoneLayout`, `DetailIcon`, `HabitDetailSectionView`, `HabitProgress`; drop the 3 redundant `export default`s in journey components; `JourneyMilestoneLayout` carries 4 always-zero dead fields.
- `MoreMenuSheet.tsx:4` deep-imports `@/db/backup` — the only deep db import; normalize to `@/db`.

---

## 8. Navigation fixes (expo-router)

- `milestone-ideas.tsx:273` — `router.push("/(tabs)/milestone-quests")`: group segments must not appear in hrefs (wrong URL on web). Use `/milestone-quests`.
- `index.tsx:455` — `router.push("/sprint")` stacks a duplicate when switching tabs; use `router.navigate` (as `milestone-quests.tsx` already does).
- `milestone-ideas.tsx:268-274` and `create-habit.tsx:523-530` hand-write the canGoBack/replace fallback that `ScreenHeader.handleBack` already implements — add a `backFallback` prop instead.
- `_layout.tsx:37-71` — six identical `options={{ headerShown: true, headerTransparent: true }}` entries with no `headerTitle`, so the native header shows route filenames under the custom header. Set `headerTitle: ""` and generate entries from an array.
- `memories.tsx:333-337` — setState **during render** for deep-link param handling (fires ~7 setStates). Move to `useEffect`.
- `my-day.tsx:330-345` — manually absolute-positioned footer duplicating `ScreenScaffold`'s `footer`/`footerFullBleed` props (which `sprint.tsx` uses correctly).
- `src/screens/` contains exactly one file (`JourneyMapScreen.tsx`) re-exported by `journey-map.tsx` — a one-off pattern; fold it in or adopt it everywhere.
- Content bug: `state.tsx:150` renders the brand as `G A M I F Y` (app is "Gemify").

---

## 9. File decomposition (after the extractions above)

| Lines | File | Split |
|---:|---|---|
| 1768 | `src/screens/JourneyMapScreen.tsx` | modals + overlay into `components/journey/` |
| 1253 | `(tabs)/memories.tsx` | `MemoryTimeline`, `MemoryFormModal`, `MemoryDetailModal` → `components/memories/` |
| 1215 | `(tabs)/milestone-quests.tsx` | `QuestRow`, `ContentTabs`, celebration modal |
| 1079 | `(tabs)/sprint.tsx` | `DayCell`, `QuestItemCard`, `DragGhost`, drag logic → `useQuestDrag` hook |
| 1039 | `what-if-plan.tsx` | `AddRiskModal`, `RiskCard`, `UnderlineInput` → `components/whatIf/` |
| 992 | `components/QuestActions.tsx` | grab-bag: split `ActionSheet` / `AcceptQuestModal` / `TextPromptModal`; icons → shared |
| 967 | `(tabs)/progress.tsx` | `FulfillmentChart` + `QuestBarsChart` (300 lines, no screen state) → `components/charts/` |
| 860 | `create-habit.tsx` | 155-line `Icon` switch → shared icons; form-step copy → data |
| 674 | `components/JourneyMapControls.tsx` | `JourneyOverviewModal` + `DreamEditModal` into own files |

Also: collapse the `HabitBoardRow → HabitItemRow → HabitItemHeader` triple pass-through (11 props, 8 forwarded verbatim; `HabitItemRow` has no other consumer).

---

## 10. Tooling & repo hygiene

- **Scripts:** `reset-project` points at a non-existent `scripts/` dir (also documented in CLAUDE.md and README). Add `"typecheck": "tsc --noEmit"`; no test framework exists at all.
- **ESLint:** stock 8-line Expo config. Add `typescript-eslint` recommended (`no-floating-promises` matters for the async SQLite code), `eslint-plugin-react-compiler` (React Compiler is ON in `app.json` — it silently bails on Rules-of-React violations), import ordering, and widen `ignores` (`dist/*` → `dist/**`, add `.expo/**`). No Prettier, no CI, no pre-commit hooks.
- **tsconfig:** consider `noUncheckedIndexedAccess`, `noUnusedLocals/Parameters`; add `exclude` for `dist`/`.expo`.
- **app.json:** `extra.appVariant` has zero runtime consumers (`expo-constants` never imported) — wire or delete; `extra.router: {}` is dead; no iOS splash block; unused `expo-asset` plugin entry; version `1.1.0` will drift under EAS `appVersionSource: "remote"`.
- **Docs:** README is 100% create-expo-app boilerplate; CLAUDE.md has 3 factual errors (claims `expo-glass-effect` is used — it isn't; documents broken `reset-project`; references non-existent `homeDummyData.ts`; says 5 tabs — there are 7); three overlapping agent-instruction files (CLAUDE.md / AGENTS.md / `.codex/instructions.md`); `DATABASE_SCHEMA_PROPOSAL.md` (51 KB) → `docs/`; empty untracked `design-export/`.
- `.gitignore` covers `.env*.local` but not bare `.env` — add `.env*` + `!.env.example`. (No secrets currently committed — verified.)

---

## Suggested execution order

1. **Fix `app.config.js` icon paths** (build-blocking) + push the branch + `git gc`.
2. **Dead-code sweep** (§1) — ~1000+ lines and 10 dependencies removed, zero behavior change.
3. **Icon consolidation** (§2) — removes name-shadowing footguns, unblocks other extractions.
4. **Perf pass** (§4 items 1-4) — sprint gestures, journey-map memoization, home derivation, memories layout thrash. User-visible.
5. **Shared-component extractions** (§3) — ConfirmDialog, OnboardingStep, header, GoalPicker, hooks.
6. **Theme tokens** (§6) + **asset compression** (§5) — mechanical, big binary-size win.
7. **Data/typing cleanup** (§7) + **navigation fixes** (§8).
8. **File decomposition** (§9) + **tooling** (§10) as ongoing hygiene.
