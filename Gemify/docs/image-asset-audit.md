# Image Asset Audit

Initial cleanup pass: 2026-10-11

Feature folder organization completed: 2026-10-11. Moved 50 assets and verified their SHA256 hashes before and after each move. Original filenames were preserved.

Expo SDK 56 [asset documentation](https://docs.expo.dev/versions/v56.0.0/sdk/asset/) was checked before this pass. Static app images are referenced with `require("path/to/file")`, and Expo config images are referenced from `app.json`.

## Quarantined unused images

These files had no direct reference in `src`, `app.json`, `app.config.js`, `public`, `docs`, or `scripts`, so they were moved into `assets/_unused/` instead of being deleted.

| Current path | Previous path | Size | Notes |
| --- | --- | ---: | --- |
| `assets/_unused/btn-upgrade-to-premium.png` | `assets/btn-upgrade-to-premium.png` | 1.6 MB | No filename or path reference found. |
| `assets/_unused/icon.png` | `assets/icon.png` | 2.1 MB | Older duplicate icon. The active Expo icon is `assets/app/icon.png`. |

## Current image folders

| Folder | Purpose |
| --- | --- |
| `assets/app/` | App icon, favicon, splash icon, and adaptive Android icon parts referenced by `app.json`. |
| `assets/navigation/` | Active and inactive tab bar icons. |
| `assets/goals/icons/` | Spark, lotus, and mountains goal picker icons. |
| `assets/dreams/` | Dream photo placeholder and entering artwork shared by onboarding and the dream screen. |
| `assets/dreams/backgrounds/` | All nine dream background options. |
| `assets/risk-plan/` | What-if plan background and risk illustration. |
| `assets/state/` | State screen background and continue button artwork. |
| `assets/home/` | Sprint portal, day-complete island, and dream forecast artwork. |
| `assets/journey/` | Journey map, milestone circles, pulse animation, and plus icon. |
| `assets/milestones/` | Milestone door and tree header shared by home and milestone quests. |
| `assets/plan/` | Empty-state artwork shared by day and week plans. |
| `assets/progress/` | No-progress and weekly ascent artwork. |
| `assets/memories/` | Memories background and completed-milestone artwork. |
| `assets/quests/` | Accept-star quest action artwork. |
| `assets/rewards/` | Open and closed present SVG artwork. |
| `assets/subscription/` | Subscription screen background, previously at the repository root. |
| `public/icons/` | Web/PWA icons used by `public/manifest.json`, `public/sw.js`, and `src/app/+html.tsx`. |
| `assets/_unused/` | Quarantined images that are not currently referenced. |

## Organization rules

- Group assets by their owning feature, including both icons and illustrations.
- Store shared artwork once in its owning feature folder; consumers can reference it from other screens.
- Keep the TypeScript registries in `src/data/icons.ts`, `src/data/menuIcons.ts`, and `src/data/images/index.ts`. They now reference files under `assets/`; no image binaries remain in `src/data`.
- Keep public web icons in `public/icons/` so their `/icons/...` URLs remain stable.
- Leave quarantined files in `assets/_unused/` until deletion is explicitly requested.

## Verification

- All 50 moved files retained their original SHA256 hashes.
- All 58 image references in source, Expo config, and public icons resolve to existing files.
- `npm.cmd run typecheck` passed.
- `npm.cmd run build:web` passed, exporting 27 static routes and completing web deployment preparation locally.
- Screen-by-screen visual checks were not performed because browser tooling was unavailable in this session.
