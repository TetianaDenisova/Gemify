import { Platform, type TextStyle, type ViewStyle } from "react-native";

import { colors } from "./colors";

export const radius = {
  sm: 8,
  md: 16,
  lg: 24,
  card: 20,
  sheet: 28,
  round: 999,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

/** Screen-level layout constants shared by every screen scaffold. */
export const layout = {
  /** Below this window width screens switch to their compact layout. */
  compactBreakpoint: 560,
  /** Below this width screens use the phone layout (iPhone 17 family: 402-440 pt). */
  phoneBreakpoint: 480,
  /** Min-height of the ScreenHeader row; also the top offset under a transparent stack header. */
  headerHeight: 68,
  /** Phone-tier ScreenHeader height — replaces headerHeight below phoneBreakpoint. */
  headerHeightPhone: 56,
  /** Below this window height (or in landscape) screens tighten vertical spacing. */
  shortScreenBreakpoint: 760,
  /** Max readable width for screen content on tablets/web. */
  contentMaxWidth: 820,
  /** Horizontal screen padding (collapses to spacing.md when compact). */
  screenPaddingH: 22,
  /** Height of the floating tab bar in (tabs)/_layout. */
  tabBarHeight: 72,
  /** Phone-tier tab bar height — icons only, no labels. */
  tabBarHeightPhone: 56,
  /** Bottom clearance so scroll content is not hidden behind the tab bar. */
  tabBarClearance: 72 + spacing.sm * 2,
  /** Minimum touch target for interactive elements. */
  minTouchTarget: 44,
} as const;

/** Height of the tab bar on the active tier (phone drops the labels). */
export function tabBarHeightFor(phone: boolean): number {
  return phone ? layout.tabBarHeightPhone : layout.tabBarHeight;
}

/**
 * Scroll clearance for a tab bar of `barHeight`. Equals layout.tabBarClearance
 * (88) at the tablet's 72 pt bar, so the tablet path is unchanged.
 */
export function tabBarClearanceFor(barHeight: number): number {
  return barHeight + spacing.sm * 2;
}

const fantasySerif = Platform.select({
  android: "serif",
  default: "serif",
  ios: "Georgia",
  web: "Georgia, 'Times New Roman', serif",
});

export const fonts = {
  serif: fantasySerif,
} as const;

export const fontSizes = {
  xxs: 10,
  xs: 12,
  sm: 14,
  md: 16,
  lg: 17,
  xl: 20,
  xxl: 22,
  xxxl: 26,
  cardTitle: 30,
  screenTitle: 36,
  stat: 44,
} as const;

export const lineHeights = {
  xxs: 14,
  xs: 15,
  sm: 18,
  md: 20,
  lg: 24,
  xl: 26,
  xxl: 28,
  xxxl: 32,
  cardTitle: 36,
  screenTitle: 42,
  stat: 52,
} as const;

/** Shared icon sizes — use these for SVG/text glyphs instead of ad-hoc numbers. */
export const iconSizes = {
  sm: 18,
  md: 22,
  lg: 28,
} as const;

export const typography = {
  screenTitle: {
    color: colors.textPrimary,
    fontFamily: fonts.serif,
    fontSize: fontSizes.screenTitle,
    fontWeight: "500",
    lineHeight: lineHeights.screenTitle,
  } satisfies TextStyle,
  title: {
    color: colors.textPrimary,
    fontFamily: fonts.serif,
    fontSize: fontSizes.cardTitle,
    fontWeight: "700",
    lineHeight: lineHeights.cardTitle,
  } satisfies TextStyle,
  cardTitle: {
    color: colors.textPrimary,
    fontFamily: fonts.serif,
    fontSize: fontSizes.cardTitle,
    fontWeight: "500",
    lineHeight: lineHeights.cardTitle,
  } satisfies TextStyle,
  sectionTitle: {
    color: colors.primary,
    fontSize: fontSizes.xxl,
    fontWeight: "700",
    letterSpacing: 2.8,
    lineHeight: lineHeights.xxl,
  } satisfies TextStyle,
  /** Mid-size serif title — sheet/card headings between `pill` and `cardTitle`. */
  titleSm: {
    color: colors.textPrimary,
    fontFamily: fonts.serif,
    fontSize: fontSizes.xxxl,
    fontWeight: "500",
    lineHeight: lineHeights.xxxl,
  } satisfies TextStyle,
  /** Hero serif number/word — big stats and milestone numerals. */
  stat: {
    color: colors.textPrimary,
    fontFamily: fonts.serif,
    fontSize: fontSizes.stat,
    fontWeight: "500",
    lineHeight: lineHeights.stat,
  } satisfies TextStyle,
  /** Field/category name (form labels, small headings above values). */
  label: {
    color: colors.textSecondary,
    fontSize: fontSizes.sm,
    fontWeight: "500",
    lineHeight: lineHeights.sm,
  } satisfies TextStyle,
  subtitle: {
    color: colors.textSecondary,
    fontSize: fontSizes.md,
    fontWeight: "400",
    lineHeight: 22,
  } satisfies TextStyle,
  body: {
    color: colors.textSecondary,
    fontSize: fontSizes.md,
    fontWeight: "400",
    lineHeight: 23,
  } satisfies TextStyle,
  /** Hint/helper copy under forms — secondary, must not compete with body. */
  helper: {
    color: colors.textSecondary,
    fontSize: fontSizes.md,
    fontWeight: "400",
    lineHeight: lineHeights.lg,
  } satisfies TextStyle,
  /** Serif body copy (descriptions inside themed cards/sheets). */
  bodySerif: {
    color: colors.textSecondary,
    fontFamily: fonts.serif,
    fontSize: fontSizes.md,
    fontWeight: "400",
    lineHeight: 23,
  } satisfies TextStyle,
  meta: {
    color: colors.textSecondary,
    fontSize: fontSizes.md,
    fontWeight: "400",
    lineHeight: lineHeights.md,
  } satisfies TextStyle,
  button: {
    color: colors.textPrimary,
    fontFamily: fonts.serif,
    fontSize: fontSizes.xxl,
    fontWeight: "500",
    lineHeight: 27,
  } satisfies TextStyle,
  /** Label of the primary (gold gradient) CTA — same metrics, heavier weight. */
  buttonPrimary: {
    color: colors.textOnPrimary,
    fontFamily: fonts.serif,
    fontSize: fontSizes.xxl,
    fontWeight: "700",
    lineHeight: 27,
  } satisfies TextStyle,
  /** Sans label on interactive controls (icon-button labels, segmented tabs). */
  controlLabel: {
    color: colors.textPrimary,
    fontSize: fontSizes.md,
    fontWeight: "600",
    lineHeight: lineHeights.md,
  } satisfies TextStyle,
  /** Emphasized small label (step titles, delta badges). */
  labelStrong: {
    color: colors.textPrimary,
    fontSize: fontSizes.sm,
    fontWeight: "600",
    lineHeight: lineHeights.sm,
  } satisfies TextStyle,
  pill: {
    color: colors.textPrimary,
    fontFamily: fonts.serif,
    fontSize: fontSizes.xl,
    fontWeight: "500",
    lineHeight: lineHeights.lg,
  } satisfies TextStyle,
  /** Text typed inside AppInput fields. */
  input: {
    color: colors.textPrimary,
    fontSize: fontSizes.md,
    fontWeight: "400",
    lineHeight: 23,
  } satisfies TextStyle,
  caption: {
    color: colors.textMuted,
    fontSize: fontSizes.xs,
    fontWeight: "500",
    lineHeight: 16,
  } satisfies TextStyle,
  /** Emphasized caption (section-header action pills, tag labels). */
  captionStrong: {
    color: colors.textMuted,
    fontSize: fontSizes.xs,
    fontWeight: "700",
    letterSpacing: 1,
    lineHeight: 16,
  } satisfies TextStyle,
  /** Smallest metadata (tab-bar labels, tiny counters under cards). */
  micro: {
    color: colors.textMuted,
    fontSize: fontSizes.xxs,
    fontWeight: "500",
    lineHeight: lineHeights.xxs,
  } satisfies TextStyle,
  bodySmall: {
    color: colors.textSecondary,
    fontSize: fontSizes.sm,
    fontWeight: "400",
    lineHeight: lineHeights.md,
  } satisfies TextStyle,
  eyebrow: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 2,
    lineHeight: 18,
    textTransform: "uppercase",
  } satisfies TextStyle,
} as const;

/**
 * Phone-tier overrides for the display roles only. A variant missing here
 * renders from `typography` unchanged, and nothing above phoneBreakpoint ever
 * reads this table.
 */
export const typographyPhone: Partial<Record<keyof typeof typography, TextStyle>> = {
  cardTitle: {
    fontSize: fontSizes.xxxl,
    lineHeight: lineHeights.xxxl,
  },
  screenTitle: {
    fontSize: 30,
    lineHeight: 36,
  },
  stat: {
    fontSize: fontSizes.screenTitle,
    lineHeight: lineHeights.screenTitle,
  },
};

/**
 * Ceiling on the iOS Dynamic Type multiplier, phone tier only — display roles
 * are the ones that break the fixed control heights first, so they cap lower.
 * Tablets pass `undefined` and keep RN's unbounded default.
 */
const DISPLAY_ROLES: readonly (keyof typeof typography)[] = [
  "cardTitle",
  "screenTitle",
  "sectionTitle",
  "stat",
  "title",
  "titleSm",
];

export function maxFontScaleFor(
  variant: keyof typeof typography,
  phone: boolean,
): number | undefined {
  if (!phone) return undefined;
  return DISPLAY_ROLES.includes(variant) ? 1.4 : 1.8;
}

export const controls = {
  button: {
    pill: {
      borderRadius: radius.sm,
      height: 42,
      minWidth: 126,
      paddingHorizontal: 18,
    },
    section: {
      borderRadius: radius.round,
      height: 48,
      minWidth: 176,
      paddingHorizontal: 22,
    },
  },
  iconButton: {
    sm: 48,
    md: 56,
    lg: 68,
  },
  row: {
    option: 74,
    task: 66,
    habit: 158,
  },
  surface: {
    borderRadius: 22,
    cardRadius: 20,
    cardPadding: 20,
  },
} as const;

/**
 * Phone-tier control metrics. These are `minHeight`, not `height`: a control
 * whose label grows under Dynamic Type gets taller instead of clipping, while
 * the tablet keeps the fixed heights in `controls`.
 */
export const controlsPhone = {
  button: {
    pill: { minHeight: 42 },
    section: { minHeight: 48 },
  },
  iconButton: {
    sm: 44,
    md: 48,
    lg: 56,
  },
} as const;

/**
 * Removes the browser's default focus outline on web TextInputs (no-op on
 * native). "none" is valid in react-native-web but missing from RN's
 * outlineStyle union, hence the cast.
 */
export const inputFocusReset = Platform.select({
  default: {},
  web: { outlineStyle: "none" },
}) as unknown as TextStyle;

/** Standard feedback style for pressed Pressables. */
export const pressed = {
  opacity: 0.72,
  transform: [{ scale: 0.98 }],
} satisfies ViewStyle;

/** `color` at `opacity`, as an rgba() string (accepts #rgb, #rrggbb, rgb/rgba). */
export function withOpacity(color: string, opacity: number): string {
  const hex = color.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i)?.[1];
  if (hex) {
    const full =
      hex.length === 3 ? hex.split("").map((char) => char + char).join("") : hex;
    const [r, g, b] = [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16));
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }
  const inner = color.match(/^rgba?\(([^)]+)\)$/)?.[1];
  if (inner) {
    const [r, g, b, a = "1"] = inner.split(",").map((part) => part.trim());
    return `rgba(${r}, ${g}, ${b}, ${Number(a) * opacity})`;
  }
  return color;
}

/**
 * Platform-correct drop shadow: web gets a `boxShadow` string (react-native-web
 * deprecates the shadow* props), native keeps the classic shadow props.
 */
export function shadowStyle({
  color,
  elevation,
  offsetX = 0,
  offsetY = 0,
  opacity,
  radius,
}: {
  color: string;
  elevation?: number;
  offsetX?: number;
  offsetY?: number;
  opacity: number;
  radius: number;
}): ViewStyle {
  if (Platform.OS === "web") {
    return {
      boxShadow: `${offsetX}px ${offsetY}px ${radius}px ${withOpacity(color, opacity)}`,
    } as ViewStyle;
  }
  return {
    shadowColor: color,
    shadowOffset: { width: offsetX, height: offsetY },
    shadowOpacity: opacity,
    shadowRadius: radius,
    ...(elevation === undefined ? null : { elevation }),
  };
}

/** Platform-correct text glow (web: `textShadow` string; native: textShadow* props). */
export function textGlow(color: string, radius: number): TextStyle {
  if (Platform.OS === "web") {
    return { textShadow: `0px 0px ${radius}px ${color}` } as unknown as TextStyle;
  }
  return {
    textShadowColor: color,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: radius,
  };
}

export const shadows = {
  goldGlow: shadowStyle({
    color: colors.primary,
    elevation: 8,
    opacity: 0.35,
    radius: 12,
  }),
  softDark: shadowStyle({
    color: colors.background,
    elevation: 6,
    offsetY: 6,
    opacity: 0.32,
    radius: 16,
  }),
} as const;

/** Gradient color stops, typed as tuples so expo-linear-gradient accepts them directly. */
export const gradients: {
  background: readonly [string, string, ...string[]];
  cta: readonly [string, string, ...string[]];
  shimmer: readonly [string, string, ...string[]];
} = {
  background: [colors.background, colors.backgroundSoft, colors.secondaryDark],
  cta: [colors.primaryBright, colors.primary, colors.primarySoft],
  shimmer: [
    colors.transparent,
    colors.overlayLight,
    colors.primaryGlow,
    colors.transparent,
  ],
} as const;
