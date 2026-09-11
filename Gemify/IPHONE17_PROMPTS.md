# iPhone 17 layout prompts

Backlog for adding a phone-first layout tier (iPhone 17 family) **without touching the
tablet layout that ships today**. Written as self-contained prompts — paste one at a time.

## Non-negotiable invariant

> **Nothing rendered at `width >= 560` may change.** The tablet/web layout must come out
> pixel-identical to `main` after every prompt below.

Concretely that means:

- **Do not** edit the existing values of `layout.compactBreakpoint` (560),
  `layout.shortScreenBreakpoint` (760), `layout.contentMaxWidth` (820),
  `layout.screenPaddingH` (22), `layout.headerHeight` (68) or `layout.tabBarHeight` (72).
  They stay as-is and keep driving the tablet path.
- **Do not** edit the existing entries of `typography`, `controls`, `fontSizes`,
  `lineHeights`, `spacing` or `radius`. Add new phone values alongside them.
- Every new value is reached **only** through the phone branch. A style change that is
  not gated behind `phone` is a bug in these prompts, not a shortcut.
- The width range **480–560** (small tablets, iPad split view) must also stay exactly as
  it renders today — it keeps the current `compact` layout, not the new phone layout.

The new phone tier is a **sub-tier inside the existing compact branch**, not a
replacement for it.

## Target devices

| Device | Logical size (portrait) | Safe area top / bottom |
|---|---|---|
| iPhone 17 / 17 Pro | 402 × 874 pt | ~62 / 34 |
| iPhone Air | 420 × 912 pt | ~62 / 34 |
| iPhone 17 Pro Max | 440 × 956 pt | ~62 / 34 |

Usable content width on the smallest target: **402 − 2×16 = 370 pt**.
All three are under 480 pt, which is why `phoneBreakpoint: 480` cleanly separates them
from everything the tablet layout serves today. The app is portrait-locked
(`orientation: "portrait"` in `app.json`), so a phone never reaches a landscape width.

## Diagnosis (why phones currently get a shrunk tablet layout)

- `layout.compactBreakpoint: 560` is the only width breakpoint, so every iPhone 17 model
  collapses into one "compact" branch that is a shrink-down of the tablet design rather
  than a phone design.
- `layout.shortScreenBreakpoint: 760` never fires on iPhone 17 (874 pt > 760), so three
  screens render at full tablet density on a 402 pt-wide phone.
- 7 tab bar entries share 402 pt (≈57 pt each) with a 28 pt icon plus a 10 pt label.
- No `maxFontSizeMultiplier` / `fontScale` handling anywhere in `src`, while `controls`
  uses fixed heights (button 42/48, iconButton 48/56/68, habit row 158).
- 146 `flexDirection: "row"` declarations vs 7 `flexWrap` — rows have nowhere to go when
  the width drops to 370 pt.

---

## 1. Add a phone tier below the existing compact breakpoint

Extend `src/theme/theme.ts` **additively**. Leave every existing `layout` field at its
current value and add:

```ts
/** Below this width screens use the phone layout (iPhone 17 family: 402-440 pt). */
phoneBreakpoint: 480,
```

Replace `src/hooks/useCompact.ts` with `useLayoutSize()` returning
`{ phone, compact, short, width, height }`, where:

- `phone` = `width < layout.phoneBreakpoint`
- `compact` = `width < layout.compactBreakpoint` (unchanged meaning — still true on phones)
- `short` = `phone || height < layout.shortScreenBreakpoint` (the `phone` term is what
  makes iPhone 17's 874 pt height count as short; `shortScreenBreakpoint` itself is
  untouched, so no tablet crosses this threshold that did not already)

Keep `useCompact()` exported as a thin wrapper over `useLayoutSize().compact` so every
existing import keeps compiling and behaving identically.

Then migrate the hand-rolled checks to the hook, **preserving current behavior** —
each site keeps its existing `compact` branch and only gains a new `phone` branch where a
later prompt calls for one: `src/shared/components/ScreenScaffold.tsx`,
`src/app/(tabs)/habits.tsx`, `memories.tsx`, `milestone-quests.tsx`, `my-day.tsx`,
`progress.tsx`, `sprint.tsx`, `src/app/milestone-ideas.tsx`, `state.tsx`,
`what-if-plan.tsx`, `src/components/HabitItem.tsx`, `TimeBlockCard.tsx`,
`TimeBlockTabs.tsx`, `JourneyMapControls.tsx`, `OnboardingStep.tsx`,
`src/components/home/DayCompleteCard.tsx`, `src/screens/JourneyMapScreen.tsx`.

**Verify:** at 820 pt and at 560 pt wide, every screen is unchanged; only `< 480` gains
new behavior (none yet at the end of this prompt — it is pure plumbing).

---

## 2. Fix the three screens that key density off height

These decide their density from window height alone, and 874 pt clears the 760 pt
threshold — so on iPhone 17 they currently render the full tablet layout:

- `src/components/OnboardingStep.tsx:43` — `height < shortScreenBreakpoint || width > height`
  is `false` on iPhone 17, so describe-dream, create-goal and milestone-ideas show tablet
  spacing on a 402 pt-wide screen.
- `src/app/state.tsx:52` — same check; also has a hardcoded 210 × 140 art block that
  should shrink on the phone tier only.
- `src/screens/JourneyMapScreen.tsx:560` — `isShort` never becomes true.

Switch all three to `short` from `useLayoutSize()` (prompt 1). Because `short` only gains
the `phone` term, a tablet's result for these three checks is bit-for-bit what it is
today; only devices under 480 pt start taking the dense branch.

**Verify:** an 820 × 1180 tablet and an 1180 × 820 landscape tablet both produce the same
`isShort` / `compactLayout` value as before the change.

---

## 3. Slim the tab bar on phones only

Seven tabs on a 402 pt bar leave ~57 pt each, so "Milestone Quests" and "Memories"
truncate, and the bar eats 72 + 34 = 106 pt (≈12% of the screen).

In `src/app/(tabs)/_layout.tsx`, add a `phone`-gated variant — the tablet keeps
`layout.tabBarHeight: 72` with labels shown:

- Add `layout.tabBarHeightPhone: 56` as a **new** constant; use it only when `phone`.
- Set `tabBarShowLabel: false` only when `phone`.
- Give each item a 44 pt (`layout.minTouchTarget`) hit area and an explicit
  `accessibilityLabel`, since the visible label disappears on phones.
- `layout.tabBarClearance` is currently the constant `72 + spacing.sm * 2`. Turn the
  clearance into a value derived from the active bar height so `ScreenScaffold`'s
  `tabClearance` shrinks with the bar — the derived value **must** still equal 88 when
  the bar is 72, so tablets are unaffected.

Alternative if labels must stay on phone: cut the visible tabs to five and move Sprint and
Memories behind a "More" entry — again phone-only, the tablet keeps all seven.

**Verify:** on tablet the bar is still 72 pt tall with labels, and scroll content still
clears it by 88 pt.

---

## 4. Phone typography scale and Dynamic Type safety

Nothing in `src` sets `maxFontSizeMultiplier`, so a large iOS text size can break the fixed
control heights in `controls` (button 42/48, iconButton 48/56/68, habit row 158).

- In `src/theme/theme.ts`, add a **new** `typographyPhone` map (or a `phone` override
  table keyed by variant) that overrides only the display roles: `screenTitle` 36 → 30
  (line height 42 → 36), `stat` 44 → 36 (52 → 42), `cardTitle` 30 → 26 (36 → 32). The
  existing `typography` object is not edited.
- In `src/shared/components/AppText.tsx`, pick the phone override when
  `useLayoutSize().phone`, otherwise use `typography` exactly as today.
- Apply `maxFontSizeMultiplier` (~1.4 display roles, ~1.8 body/label/caption) **only on
  the phone tier**. Adding it unconditionally would change how tablets render for users
  with a large Dynamic Type setting, which the invariant forbids.
- Same rule for `controls`: add phone-only `minHeight` variants rather than converting the
  shared `height` values, so a scaled label grows the control on phone while the tablet
  keeps its fixed metrics.

**Verify:** with iOS text size at maximum, a tablet renders identically to `main`; a phone
grows its controls instead of clipping.

---

## 5. Make rows survive 370 pt (phone branch only)

Content width on the smallest target is 370 pt, but several rows still reserve 220–250 pt
per child, so two-up rows overflow:

- `src/app/(tabs)/my-day.tsx:423` (`emptyBlockButton`)
- `src/app/(tabs)/sprint.tsx:890` (`addMoreButton`) and `:983` (`emptyDayButton`)
- `src/app/(tabs)/memories.tsx:923` (`addFooterCopy`)
- `src/app/see-dream.tsx:242`
- `src/shared/components/IconButton.tsx:118` (`withLabel`, `minWidth: 128`)

Do **not** rewrite the base styles. Add phone-only override styles (the pattern already
used across the codebase — `styles.habitDayCompact { minWidth: 0 }` in
`src/components/HabitItem.tsx:418` is the precedent) that drop the `minWidth`, add
`flexShrink: 1`, and let the parent row wrap or collapse to a single column.

Then audit the remaining `flexDirection: "row"` blocks for the same pattern — anything
holding two labelled controls side by side needs `flexShrink: 1` on both children or a
`flexWrap` on the parent, again added as a phone-gated override.

**Verify:** the tablet rows keep their 220 pt minimums and identical wrapping.

---

## 6. Reclaim vertical space on phones

iPhone 17 gives 874 pt of height but only 402 pt of width, so `topInset` of
`insets.top + spacing.lg` (62 + 24 = 86 pt) plus the 68 pt `layout.headerHeight` spends
~150 pt before any content.

In `src/shared/components/ScreenScaffold.tsx` and `ScreenHeader.tsx`, on the phone tier
only: use `spacing.sm` instead of `spacing.lg` for the `topInset` extra, and add a new
`layout.headerHeightPhone: 56` used in place of `layout.headerHeight`. Both existing
constants keep their values and stay in use above 480 pt.

Check the transparent stack-header screens (`asStackHeader`) still line up on phone after
the change — the header offset and the scaffold's top padding must move together.

**Verify:** on tablet the header block still measures 68 pt with `insets.top + 24` above it.

---

## 7. Per-screen shrink / hide budget

The first six prompts fix the *frame* (breakpoint, tab bar, type scale, rows, insets).
This one goes screen by screen through the *content*: which elements get smaller on the
phone tier, and which ones stop rendering because they are informational only.

**Rules for this whole section**

- Every change here is reached through `useLayoutSize().phone` — same invariant as above.
  At `width >= 480` nothing in this section exists.
- "Hide" means `phone ? null : <element>` at the render site. Never delete the element,
  never delete the data behind it, never change what is stored.
- Nothing listed under *Hide* is the only route to an action. Each one is either a label
  that repeats something else visible on the same screen, instructional copy, or pure
  decoration. **If hiding an element would remove the only way to reach a feature, it does
  not belong in that column — shrink it instead.**
- Sizes are new phone-only style objects living beside the existing `*Compact` ones
  (`styles.fooPhone`), applied as
  `[styles.foo, compact && styles.fooCompact, phone && styles.fooPhone]`.
- The `typographyPhone` map from prompt 4 already pulls `screenTitle`, `cardTitle` and
  `stat` down everywhere; the numbers below are *on top of* that.

**Two thresholds that never fire on an iPhone 17 — fix them first**

- `src/app/what-if-plan.tsx:77` — `compact = width < 380` and `verySmall = width < 340`.
  402 / 420 / 440 all miss both, so every target phone renders the **full tablet** risk
  card (214 pt tall, full-size risk art). Rebase both on `phone` from `useLayoutSize()`.
- `src/screens/JourneyMapScreen.tsx:559` — `isCompact = width < 520` does fire, but pair
  it with `phone` so the milestone sheet takes the phone numbers below rather than the
  tablet-compact ones.

---

### Home — `src/app/(tabs)/index.tsx`

**Shrink**

| Element | Today | Phone |
|---|---|---|
| `GoalCard` height / inner padding | `minHeight: 132`, `paddingVertical: 14` | 112 / 10 |
| `GoalCard` icon frame + glyph | 64 x 64 frame, 42 x 42 image | 48 / 32 |
| `GoalCard` progress ring (`RING_SIZE`) | 50 | 42 (the seam scrim width derives from it, so it follows) |
| Focus-row medallion + spark/repeat glyph | 22 pt icon | 18 |
| Focus-row `Checkbox` | `size={40}` | 34 |
| Focus-row gain value `+N%` | `variant="cardTitle"` (30 / 36) | `variant="pill"` (20 / 24) — it is wedged between a two-line title and the checkbox on a 370 pt row |
| Later-row block badge `BlockIconArt` | `size={26}` | 22 |
| `DayCompleteCard` art | `artHeight` 134 when compact | 108 |

**Hide**

- The **"Upcoming" / "Waiting" pill** on every Later Today row (`styles.upcomingPill`) —
  a status word for a row whose time is printed two lines above it, costing ~90 pt of a
  370 pt row.
- The **milestone half of the breadcrumb** (`ChevronIcon` + `MilestoneIcon` +
  `milestoneTitle`) in both the focus rows and the later rows. Keep the dream title; the
  milestone is the subject of the screen the row opens into.
- `DayCompleteCard`'s **subtitle** ("Every quest planned for today is complete.") — the
  headline and the gold `+N%` already carry it.
- The **spark divider** above the second "LATER TODAY" eyebrow (`laterDivider`: rule ·
  spark · rule). Pure ornament; the eyebrow stays.

---

### My Day — `src/app/(tabs)/my-day.tsx`

**Shrink**

| Element | Today | Phone |
|---|---|---|
| Empty-block artwork | `min(560, max(300, height * 0.5))` -> **437 pt** on an iPhone 17 | `min(360, max(220, height * 0.3))` |
| `TimeBlockTabs` tab | `timeTabCompact` 108 wide, `minHeight: 54` | 92 / 46 |
| `TimeBlockTabs` strip | `tabsContentCompact.minHeight: 72` | 58 |
| `ActionRow` icon / checkbox / gap | 32 · 32 · 14 | 28 · 30 · 10 |
| `TodayProgressCard` portal art | 92 x 92 | 64 x 64 |
| `TodayProgressCard` count | `variant="cardTitle"` | `variant="titleSm"` |
| Footer clearance | `FOOTER_CLEARANCE_COMPACT: 120` | ~96, once the card above is shorter |
| `emptyBlockButton` | `minWidth: 220` | dropped + `flexShrink: 1` (prompt 5) |

**Hide**

- The `ScreenHeader` **subtitle** "Focus only on what matters now." — a tagline that eats
  a full line under the title on every visit.
- The `TimeBlockTabs` **prev / next arrows** (`tabsArrow`, 34 pt each = 68 pt of a 370 pt
  row). The strip already scrolls and auto-centers the active tab and every tab is
  directly tappable — the arrows are a convenience the tablet keeps.
- The **"ACTIONS"** caption under the footer count — "3 / 7" beside "Today's progress"
  reads as actions without being told.
- `ActionRow`'s **milestone breadcrumb half**, same rule as Home.

---

### Milestone Quests — `src/app/(tabs)/milestone-quests.tsx`

**Shrink**

| Element | Today | Phone |
|---|---|---|
| Hero card | `milestoneCard.minHeight: 200`, padding `lg` | 150, padding `md` |
| Hero copy column | `milestoneCopy.maxWidth: "68%"` | `"76%"` — the art is a backdrop, the title needs the width |
| `QuestRow` title | `variant="cardTitle"` (30 / 36) | `variant="pill"` — a task title, not a page title |
| `QuestRow` checkbox | `size={44}` | 36 |
| Habit rows (`HabitBoardRow`) | `ART_SIZE_COMPACT: 62` | 52 |
| Habit detail panels | `DetailIcon` 44 when compact | 36 |

**Hide**

- The **`listToolbar` count** ("4 quests" / "2 habits") — the tab directly above prints the
  same number in a pill. Let "New quest" have the row.
- The **"To complete this milestone, complete all of its quests."** hint
  (`styles.completeHint`) — instruction-only copy shown in the most common state.
- The hero **"CURRENT MILESTONE" eyebrow** — the card is the only hero on the screen and
  the progress bar identifies it; buys the line a two-line milestone title needs.

---

### Habits — `src/app/(tabs)/habits.tsx`

**Shrink**

| Element | Today | Phone |
|---|---|---|
| Habit row height | `controls.row.habit: 158` | new phone key at 132 (add, never edit — prompt 4's rule) |
| Habit medallion | `ART_SIZE_COMPACT: 62` (+12 frame) | 52 |
| Week-strip day dot | 30 x 30 | 24 x 24 — seven cells share 370 pt |
| `HeaderOrnament` spark | 24 when compact | 18 |
| Group header glyph | 31 | 26 |
| Finished-habits sheet rows | two `IconButton size="sm"` | keep both, drop the row gap to `spacing.sm` |

**Hide**

- `TodayBar`'s **long date** ("Monday, September 9") and its divider — every habit row
  already highlights today in its own week strip. Keep "Today" and the habit count.
- The **group count** ("3 habits") beside each dream title — the rows are directly below.
- `HeaderOrnament`'s **rules** either side of the spark — decoration on the widest row of
  the screen.
- The finished-habits sheet **subtitle** ("Finished habits rest here — restore one to keep
  going") — the restore button is on every row.

---

### Weekly Plan — `src/app/(tabs)/sprint.tsx`

Seven day cells share 370 pt: ~45 pt each once the `spacing.sm` gaps are paid.

**Shrink**

| Element | Today | Phone |
|---|---|---|
| Week-strip gap | `spacing.sm` (8) | `spacing.xs` (4) -> ~48 pt cells |
| Day number | `variant="titleSm"` (26 / 32) | `variant="pill"` (20 / 24) |
| Day-cell padding | `paddingTop: spacing.sm + spacing.xs` | `spacing.xs` |
| Empty-day artwork | `min(480, max(280, height * 0.42))` -> **367 pt** | `min(320, max(200, height * 0.28))` |
| `QuestItemCard` icon / checkbox | 36 / 38 | 30 / 32 |
| `WeekAscentCard` collapsed thumb | `artThumb` | −25 % |
| `WeekAscentCard` total | `variant="cardTitle"` | `variant="titleSm"` |
| `addMoreButton`, `emptyDayButton` | `minWidth: 220` | dropped + `flexShrink: 1` (prompt 5) |

**Hide**

- `QuestBreadcrumb`'s **milestone half** on every card (and in the drag ghost).
- The collapsed ascent card's **"EXPECTED" caption** under `+N%` — the row title is
  literally "Expected progress this week".
- The expanded ascent card's **88 x 88 art frame** — decoration inside a card that is
  already overlaying the board.

---

### Progress — `src/app/(tabs)/progress.tsx`

**Shrink**

| Element | Today | Phone |
|---|---|---|
| Chart plot | `CHART_PLOT_HEIGHT: 150` | 120 |
| Y-axis gutter | `CHART_Y_AXIS_WIDTH: 34` | 26 |
| Bar width | `BAR_MAX_WIDTH: 34` | 24 |
| Y ticks | `CHART_Y_TICKS = [100, 75, 50, 25, 0]` | `[100, 50, 0]` — density, not removal |
| Bars + summary row | `chartRow` side by side (`summaryPanelCompact.minWidth: 96`) | `flexDirection: "column"` — 370 pt minus a 96 pt panel leaves the bars ~250 pt |
| Range trigger | `width: min(228, width * 0.45)` | `min(180, width * 0.5)` |
| Summary percent | `variant="stat"` (44 / 52) | the phone `stat` value (36 / 42) |
| Empty-state art | `emptyArtCompact.width: "88%"` | `70%`, `maxWidth: 220` |

**Hide**

- The **"Progress overview" label** in `overviewRow` — each chart card below carries its
  own title, and this leaves the range picker a full-width row of its own.
- The highlight row's **caption** (`lineRange.highlight.caption`) — the eyebrow and the
  `±N%` delta beside it already carry the fact.
- The **`panelDivider`** once the chart row stacks (a vertical rule between stacked blocks
  means nothing).

---

### Memories — `src/app/(tabs)/memories.tsx`

The timeline is the sharpest failure here: at 370 pt,
`floor((322 + 26) / (104 + 26)) = 2` items per row, so ten memories become five rows of
switchbacks.

**Shrink**

| Element | Today | Phone |
|---|---|---|
| `TIMELINE_ITEM_WIDTH` | 104 | 88 |
| `TIMELINE_CONNECTOR_WIDTH` | 26 | 16 -> **3 per row** instead of 2 |
| Hero banner | `heroImage.aspectRatio: 2.6` | 3.4 (shallower crop, same art) |
| Form photo tiles | four across at full size | −20 % so four fit 370 pt with their gaps |
| Detail sheet hero photo | `detailPhotoHero` | cap at `height * 0.32` |

**Hide**

- The whole **`addFooterCopy` block** — "Add memories from your journey" plus "Save
  moments that show how this goal is changing your real life." The header has an add
  button and the footer keeps its own "Add memory" button; this is two lines of pitch.
- The detail sheet's second **"Memory" eyebrow** above the description, when the header
  already shows the memory's title and date.

---

### Journey map — `src/screens/JourneyMapScreen.tsx`, `src/components/JourneyMapControls.tsx`

**Shrink**

| Element | Today | Phone |
|---|---|---|
| Milestone sheet height | `height * 0.72` when `isCompact` | `height * 0.80` — a phone can afford more of the screen, and the sheet is the whole task |
| Step photo frame | `stepPhotoFrame` | cap at `height * 0.24` |
| Dream photo frame (overview / edit) | `maxHeight: height * 0.32` / `0.28` | `0.24` / `0.22` |
| Vision card padding | `spacing.lg` | `spacing.md` |
| Overview action buttons | side by side | stack full width — "Edit Path" and `Check "What If" Plan` do not fit two-up at 370 pt |
| Guided-add hint | `GUIDED_HINT_WIDTH` | cap at `width - spacing.md * 2` |

**Hide**

- The **photo hint** "Drag the photo to choose its focus, zoom with − / +" — the − / +
  buttons sit on the frame and dragging is discoverable.
- The **ornament row** (rule · spark · rule) in both the overview and the edit sheet.
- Nothing else: the eyebrow, the dream name, the vision text and both action buttons stay.

---

### Dream creation flow — `OnboardingStep.tsx`, `see-dream.tsx`, `state.tsx`

Prompt 2 already makes `short` true here, so these screens finally take their dense
branch. On top of that:

**Shrink**

| Element | Today | Phone |
|---|---|---|
| `state.tsx` continue art | 210 x 140 | 160 x 106 |
| `state.tsx` feeling chips | `width: "31.5%"`, `paddingHorizontal: spacing.sm` | keep three-up, padding -> `spacing.xs` |
| `see-dream.tsx` photo frame | `aspectRatio: 0.78`, `width: "86%"` | `0.95` / `78%` — at 402 pt the current frame is 346 x 443 before any button |
| `see-dream.tsx` source buttons | `minWidth: 220` | dropped + `flexShrink: 1` (prompt 5) so gallery / camera stay two-up |
| `OnboardingStep` subtitle gap | `marginTop: spacing.lg` | `spacing.sm` |

**Hide**

- `state.tsx` **footnote** "You can change this anytime" — reassurance copy.
- `state.tsx` **brand block** ("G E M I F Y" + ornament) — the app's own chrome, on the
  app's own screen.
- `see-dream.tsx` **"Create with AI"** button and its "AI images are coming soon." reply —
  a full button row for a feature that does not exist yet.
- `see-dream.tsx` **`HintRow`** ("Choose an image that makes your future feel real.").
- Keep every `OnboardingStep` hint: on those screens the hint is the only guidance under a
  single input.

---

### What If Plan — `src/app/what-if-plan.tsx`

After rebasing `compact` / `verySmall` onto `phone` (see the top of this section):

**Shrink**

| Element | Today | Phone |
|---|---|---|
| Hero-to-cards gap | `marginBottom: compact ? 116 : 128` | 64 |
| Hero shield | `size={compact ? 42 : 54}` | 34 |
| Risk card | `card.minHeight: 214` / `cardCompact: 190` | 168 |
| Risk art | `riskImageWrapCompact` 56 x 56 | keep 56; below 340 pt it drops out as it does today |
| `AddRiskModal` action numerals | 45, or 38 when compact | 34 |

**Hide**

- The hero **subtitle** "When something goes off track, I already know what to do." — mood
  copy under a title that says the same thing.
- The **spark divider column** between the risk side and the plan side of each card once
  the card stacks vertically.

---

### Create habit — `src/app/create-habit.tsx`

**Shrink**

| Element | Today | Phone |
|---|---|---|
| `StepIconMedallion` | `size = 70` | 48 — it is a decorative rail down the left of every field |
| `formRow` gap | `spacing.lg` | `spacing.md` |
| Day chips | seven chips wrapping | `paddingHorizontal: spacing.xs` so they fit 4 + 3 |

**Hide**

- The **`helperText` line under every step** — six explanatory sentences ("Choose a moment
  in your routine that will trigger this habit.", "This habit will support the dream you
  pick.", "Select the days you want to practice this habit.", "Your My Day time blocks —
  the habit will live in the one you pick.", "Small steps that make starting effortless.
  …"). Each field already carries a numbered label naming it.
  **Exception:** keep copy that reports state rather than explains — the "Create a dream
  first — habits live inside one." branch is an empty-state message, and `formError`
  always renders.

---

### Cloud sync — `src/app/cloud-sync.tsx`

No content changes. It is a single column of cards, inputs and buttons that already
reflows; it picks up `headerHeightPhone` and the phone type scale from prompts 4 and 6 and
that is all it needs. Listed so the sweep is complete rather than silently skipping it.

---

### Shared modals and sheets

| Modal | Shrink | Hide |
|---|---|---|
| `AcceptQuestModal` (`QuestActions.tsx`) | star art 76 -> 56; `dayChip` / `timeChip` height 72 -> 60 | the subtitle "Choose when you'll do it. We've picked a time based on your current moment." — the two section labels below say both halves |
| `QuestPickerSheet` | group icon 26 -> 20; `pickerQuestTitle` `pill` -> `controlLabel` | the subtitle ("Pick quests you want to add to this time block.") — the title already reads "Add to *Morning*" |
| `DatePickerModal` | `dayCell.height` 44 -> 40 (seven across 370 pt) | the **"Today" legend row** — a legend for one gold dot on the current date |
| `TextPromptModal`, `ConfirmDialog`, `MoreMenuSheet` | no change | no change |
| `AppModal` (`variant="sheet"`) | `padding: spacing.lg` -> `spacing.md` | — |

---

**Verify (this section):** at 820 pt and 560 pt every element above still renders at its
current size — the hide list is empty and the shrink list is inert. At 402 pt walk each
screen and confirm that no hidden element was the only way to reach an action, and that no
row still overflows once the shrink column is applied.

---

## 8. Tablet-parity check

The tablet path is the thing most likely to regress silently, so close the batch with an
explicit pass:

- Walk every screen at 820 × 1180 and at 1180 × 820 and compare against `main`.
- Grep for any `layout.*`, `typography.*` or `controls.*` entry whose **value** was edited
  rather than added — there should be none.
- Grep for a style override applied without a `phone` guard — there should be none.
- Run `npm run typecheck` and `npm run lint`.

Note for context, not a change to make: `app.json` declares no `ios.supportsTablet`, so
the current iOS build is iPhone-only and the tablet layout is reached through web and
Android tablets. Leave that flag alone unless iPad support is a separate, deliberate
decision.
