# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development commands

```bash
npm start              # Start Expo dev server (opens menu for iOS/Android/web)
npm run android        # Open Android emulator
npm run ios           # Open iOS simulator
npm run web           # Open web browser
npm run lint          # Run ESLint
npm run reset-project # Reset app directory to blank state (destructive)
```

**Important:** Expo 56 is bleeding-edge (Jan 2026). Always consult the [versioned docs](https://docs.expo.dev/versions/v56.0.0/) before writing any code — APIs change frequently in v56, especially around new packages like `@expo/ui` and `expo-glass-effect`.

## Architecture

### Core concept: The Journey
This app frames goal achievement as a **journey** from point A (current state) → point B (dream). The visual metaphor is central:
- A **goal** maps to a **journey** with 6 **milestones** (Awakening → Transforming → Building → Expanding → Becoming → Vision)
- Each milestone has a state (e.g. "Calm", "Focused"), mentor, artifact, and reward
- The **journey map** is a zoomable, interactive SVG showing all milestones positioned on a visual board

### Data and UI separation
**Critical pattern:** Content data is *separate* from visual/layout config:
- `src/data/journeyMilestones.ts`: *content* (`journeyMilestoneContent` — titles, descriptions, states, mentor/reward) + *layout config* (`journeyMilestoneBoardLayout` — x, y, size, rotation, opacity)
- A compatibility view (`journeyMilestones`) merges them for consumption by components
- This separation lets designers tweak visual positioning without touching content, and vice versa

Similarly, `src/data/homeData.ts` exports dummy data from `homeDummyData.ts`. When adding real persistence, replace the dummy file with calls to state/API.

### Routing and screens
**File-based routing** via `expo-router`:
- `src/app/(tabs)/` — 5 bottom-tabbed screens (Home, Today/Quests, Weekly Plan/Sprint, Progress, Habits)
- `src/app/` — Modal/stack screens (journey-map, create-goal, what-if-plan, etc.)
- `src/app/_layout.tsx` — Root stack + GestureHandler wrapper
- `src/app/(tabs)/_layout.tsx` — Tab bar with custom SVG icon rendering

The tab bar icon for Habits is hand-drawn SVG (star + sparkles); others use image assets from `src/data/menuIcons.ts`.

### Theme and styling
Centralized design tokens in `src/theme/`:
- `colors.ts` — primary/secondary, background, surface (surfaceCard/surfaceDeep), border tiers (borderFaint/border/borderStrong/borderSoft/divider), text tones. Dark theme, gold accents; violet accents via `accentViolet`/`accentVioletStrong`.
- `theme.ts` — spacing, radius (incl. `card`/`sheet`), shadows, typography roles (incl. `eyebrow`/`bodySmall`), `layout` (compactBreakpoint, contentMaxWidth, screenPaddingH, tabBar sizes), `pressed`, gradients (incl. `cta`)
- All components import from `@/theme/*` — no inline color/size literals

**Glass effect:** Surfaces use `colors.surfaceGlass` (frosted glass via `expo-glass-effect`) with soft borders and shadows.

### Shared component system
`src/shared/components/` (barrel: `@/shared/components`) holds the app-wide UI primitives — use these instead of hand-rolling:
- `ScreenScaffold` (background/keyboard/scroll/tab-clearance wrapper for every screen), `ScreenHeader` (left button · title/subtitle · right button; `asStackHeader` for stack screens), `IconButton`, `AppButton` (primary gold-gradient CTA / secondary / ghost), `AppText` (all text — variants map to theme typography), `AppInput`, `Card` (default/glass/strong), `ProgressRing`, `ProgressBar`, `Checkbox`, `Chip`, `Badge`, `ListItem`, `SectionHeader`, `AppModal` (center/sheet), `HintRow`, and shared SVG icons (`BackIcon`, `ChevronIcon`, `CheckIcon`, `CloseIcon`, `PlusIcon`, `SparkIcon`, `ArrowRightIcon`, `BulbIcon`).
- Never render raw `<Text>` in screens — use `AppText` with a variant.

### Feature components
- `src/components/home/` — HomeHeader, GoalCard, TodayProgressCard
- `src/components/` — JourneyMapScroll (zoomable canvas), JourneyMilestone(+Label), JourneyMapControls, TimeBlockCard/Tabs, HabitItem, DatePickerModal
- Feature components consume the shared layer internally; keep them in `src/components/`, not `src/shared/`.
- All styled with exported `StyleSheet` objects; no CSS or styled-components

### Current state
- **No persistence layer.** All data is static dummy objects in `src/data/`.
- **No state management** (Redux, Zustand, Jotai, etc.).
- **No backend API** — everything is client-side mock data.
- When building features (especially create-*, what-if-plan), assume the UI is disconnected. Focus on UX/interaction; wiring to real data is a separate phase.

## Key files to know

| File | Purpose |
|---|---|
| `src/app/(tabs)/_layout.tsx` | Tab bar definition + custom icon rendering |
| `src/app/(tabs)/index.tsx` | Home screen: goals list + current focus |
| `src/app/(tabs)/milestone-quests.tsx` | Daily quests tied to a milestone |
| `src/app/(tabs)/sprint.tsx` | Weekly quest board with date-grouped tasks |
| `src/app/what-if-plan.tsx` | Risk/contingency planner ("if tired, do 5-min version") |
| `src/data/journeyMilestones.ts` | Milestone content + board layout config |
| `src/data/homeData.ts` | Goals and focus items (exports dummy data) |
| `src/theme/colors.ts` | Color palette (dark, gold-accented) |
| `src/theme/theme.ts` | Spacing, radius, shadows, typography |
| `src/types/svg.d.ts` | SVG import type declaration |

## Adding new features

**New tab screen:** Create `src/app/(tabs)/[name].tsx`, export a default component, and add a `<Tabs.Screen>` entry in `src/app/(tabs)/_layout.tsx`. Add icon data to `src/data/menuIcons.ts`.

**New data-driven feature:** Create content in `src/data/[feature].ts`, separate layout/visual config as a distinct export, and merge them in a compatibility view. Keep components dumb — push data shape into models.

**New journey/quest types:** Extend the milestone/quest types in respective data files. The `JourneyMilestoneContent` and `Quest` types are the contracts components consume.

**Styling:** Always use theme exports (`colors.*`, `spacing.*`, etc.). No magic numbers for padding, font size, or color.

## Quirks and gotchas

- **Expo 56 is new.** Features ship frequently; the docs are the source of truth. Don't assume patterns from older Expo versions work.
- **SVG rendering:** All custom icons are `react-native-svg` paths. Ensure `xmlns` and viewBox are correct; mobile SVG rendering differs from web.
- **Glass effect on Android:** `expo-glass-effect` has platform differences. Test on both iOS and Android emulators if adding glass UI.
- **Safe area insets:** Screens use `react-native-safe-area-context` for notch/home indicator spacing. Check `useSafeAreaInsets()` if adding header or bottom UI.
- **No test infrastructure.** No Jest, no testing library. Manual testing in dev is the current bar.
