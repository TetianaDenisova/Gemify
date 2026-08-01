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
  xs: 12,
  sm: 14,
  md: 16,
  lg: 17,
  xl: 20,
  xxl: 22,
  cardTitle: 30,
  screenTitle: 36,
  display: 56,
} as const;

export const lineHeights = {
  xs: 15,
  sm: 18,
  md: 20,
  lg: 24,
  xl: 26,
  xxl: 28,
  cardTitle: 36,
  screenTitle: 42,
  display: 66,
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
  label: {
    color: colors.primary,
    fontFamily: fonts.serif,
    fontSize: fontSizes.cardTitle,
    fontWeight: "500",
    lineHeight: 38,
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
  helper: {
    color: colors.textSecondary,
    fontSize: fontSizes.xxl,
    fontWeight: "400",
    lineHeight: 30,
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
  pill: {
    color: colors.textPrimary,
    fontFamily: fonts.serif,
    fontSize: fontSizes.xl,
    fontWeight: "500",
    lineHeight: lineHeights.lg,
  } satisfies TextStyle,
  input: {
    color: colors.textPrimary,
    fontSize: 28,
    fontWeight: "400",
    lineHeight: lineHeights.cardTitle,
  } satisfies TextStyle,
  caption: {
    color: colors.textMuted,
    fontSize: fontSizes.xs,
    fontWeight: "500",
    lineHeight: 16,
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

/** Standard feedback style for pressed Pressables. */
export const pressed = {
  opacity: 0.72,
  transform: [{ scale: 0.98 }],
} satisfies ViewStyle;

export const shadows = {
  goldGlow: {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  } satisfies ViewStyle,
  softDark: {
    shadowColor: colors.background,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.32,
    shadowRadius: 16,
    elevation: 6,
  } satisfies ViewStyle,
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
  layout,
  lineHeights,
  pressed,
  radius,
  shadows,
  spacing,
  typography,
} as const;

export type AppTheme = typeof theme;
