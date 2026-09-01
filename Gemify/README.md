# Gemify

A goal-achievement app that frames every goal as a **journey**: you name a dream, map it into milestones on a zoomable journey map, break milestones into quests and habits, plan them into your week, and collect memories as evidence that the future is becoming real.

Built with [Expo](https://expo.dev) (SDK 56), `expo-router`, `react-native-svg`, Reanimated, and a local `expo-sqlite` database (no backend).

## Get started

```bash
npm install
npm start          # Expo dev server (menu for iOS / Android / web)
npm run android    # Android emulator
npm run ios        # iOS simulator
npm run web        # browser
```

Quality checks:

```bash
npm run lint       # ESLint
npm run typecheck  # tsc --noEmit
```

## Project layout

| Path | What lives there |
|---|---|
| `src/app/` | Screens (expo-router file-based routing; `(tabs)/` is the tab bar) |
| `src/screens/` | `JourneyMapScreen` (the zoomable journey map) |
| `src/components/` | Feature components |
| `src/shared/components/` | App-wide UI primitives (`AppText`, `Card`, `ScreenScaffold`, icons, …) |
| `src/db/` | SQLite persistence: migrations, repositories, JSON backup |
| `src/hooks/` | Focus-refreshing data hooks |
| `src/theme/` | Design tokens (dark, gold-accented) |
| `src/data/` | Static content, type contracts, image maps |
| `assets/` | Art, icons, backgrounds |

See `CLAUDE.md` for architecture details and conventions.

## Builds

EAS is configured (`eas.json`); the demo variant is selected with `APP_VARIANT=demo` (see `app.config.js`).
