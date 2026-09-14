import { colors } from "@/theme/colors";

export type HabitGlyph = "water" | "move" | "book" | "meditate";

/** The icon and accent a habit keeps on every screen. */
export type HabitVisuals = {
  accent: string;
  glyph: HabitGlyph;
};

const GLYPH_ACCENT: Record<HabitGlyph, string> = {
  book: colors.accentViolet,
  meditate: colors.accentGreen,
  move: colors.primary,
  water: colors.accentBlue,
};

/**
 * Title fragments (English and Ukrainian stems) that pick a fitting glyph.
 * Checked in order, so the more specific practices come first.
 */
const GLYPH_KEYWORDS: readonly (readonly [HabitGlyph, readonly string[]])[] = [
  ["meditate", ["medit", "медит", "breath", "дих", "yoga", "йог", "mindful"]],
  ["book", ["read", "book", "study", "learn", "чит", "книг", "вчи"]],
  ["water", ["water", "drink", "hydrat", "вод", "пит"]],
  [
    "move",
    [
      "move", "walk", "run", "workout", "exercise", "sport", "gym", "stretch",
      "рух", "біг", "ходи", "прогулян", "трен", "спорт", "зарядк",
    ],
  ],
];

const GLYPH_CYCLE: readonly HabitGlyph[] = ["water", "move", "book", "meditate"];

/**
 * One identity per habit: a glyph matched from its title, or — when nothing
 * matches — a stable pick by id, so the habit never changes look between
 * screens or launches.
 */
export function habitVisualsFor(habit: { id: number; title: string }): HabitVisuals {
  const title = habit.title.toLowerCase();
  const match = GLYPH_KEYWORDS.find(([, words]) =>
    words.some((word) => title.includes(word)),
  );
  const glyph = match?.[0] ?? GLYPH_CYCLE[habit.id % GLYPH_CYCLE.length];

  return { accent: GLYPH_ACCENT[glyph], glyph };
}
