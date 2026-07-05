import { Platform, type TextStyle, type ViewStyle } from "react-native";

import { colors } from "./colors";

export const radius = {
  sm: 8,
  md: 16,
  lg: 24,
  round: 999,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

const fantasySerif = Platform.select({
  android: "serif",
  default: "serif",
  ios: "Georgia",
  web: "Georgia, 'Times New Roman', serif",
});

export const typography = {
  title: {
    color: colors.textPrimary,
    fontFamily: fantasySerif,
    fontSize: 30,
    fontWeight: "700",
    lineHeight: 36,
  } satisfies TextStyle,
  body: {
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: "400",
    lineHeight: 23,
  } satisfies TextStyle,
  caption: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 16,
  } satisfies TextStyle,
} as const;

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
  gradients,
  radius,
  shadows,
  spacing,
  typography,
} as const;

export type AppTheme = typeof theme;
