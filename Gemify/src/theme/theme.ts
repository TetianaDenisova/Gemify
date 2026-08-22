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
  /** Max readable width for screen content on tablets/web. */
  contentMaxWidth: 820,
  /** Horizontal screen padding (collapses to spacing.md when compact). */
  screenPaddingH: 22,
  /** Height of the floating tab bar in (tabs)/_layout. */
  tabBarHeight: 72,
  /** Bottom clearance so scroll content is not hidden behind the tab bar. */
  tabBarClearance: 72 + spacing.sm * 2,
  /** Minimum touch target for interactive elements. */
  minTouchTarget: 44,
} as const;

const fantasySerif = Platform.select({
  android: "serif",
  default: "serif",
  ios: "Georgia",
  web: "Georgia, 'Times New Roman', serif",
});

const systemSans = Platform.select({
  default: undefined,
  web: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
});

export const fonts = {
  serif: fantasySerif,
  sans: systemSans,
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
  display: 56,
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
  display: 66,
} as const;

/** Shared icon sizes — use these for SVG/text glyphs instead of ad-hoc numbers. */
export const iconSizes = {
  xs: 14,
  sm: 18,
  md: 22,
  lg: 28,
  xl: 34,
} as const;

export const typography = {
  display: {
    color: colors.textPrimary,
    fontFamily: fonts.serif,
    fontSize: fontSizes.display,
    fontWeight: "500",
    lineHeight: lineHeights.display,
  } satisfies TextStyle,
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
    hero: {
      borderRadius: radius.sm,
      height: 88,
      paddingHorizontal: 48,
    },
  },
  chip: {
    day: {
      borderRadius: 40,
      height: 80,
      width: 80,
    },
    time: {
      borderRadius: radius.lg,
      height: 64,
      minWidth: 160,
      paddingHorizontal: 18,
    },
  },
  field: {
    height: 76,
    borderRadius: radius.sm,
    paddingHorizontal: 24,
  },
  iconButton: {
    sm: 48,
    md: 56,
    lg: 68,
  },
  iconFrame: {
    sm: 88,
    md: 96,
    lg: 100,
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
function withOpacity(color: string, opacity: number): string {
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

export const gradients = {
  background: [colors.background, colors.backgroundSoft, colors.secondaryDark],
  primary: [colors.primary, colors.primarySoft, colors.primaryDark],
  cta: [colors.primaryBright, colors.primary, colors.primarySoft],
  surface: [colors.surface, colors.backgroundSoft],
  shimmer: [
    colors.transparent,
    colors.overlayLight,
    colors.primaryGlow,
    colors.transparent,
  ],
} as const;

export const theme = {
  colors,
  controls,
  fonts,
  fontSizes,
  gradients,
  iconSizes,
  inputFocusReset,
  layout,
  lineHeights,
  pressed,
  radius,
  shadows,
  spacing,
  typography,
} as const;

export type AppTheme = typeof theme;
