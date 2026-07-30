export const colors = {
  background: "#050811",
  backgroundSoft: "#0A1020",
  surface: "#0E1628",
  surfaceGlass: "rgba(14, 22, 40, 0.72)",

  primary: "#F5B84B",
  primarySoft: "#D9962E",
  primaryDark: "#8A5A18",
  primaryGlow: "rgba(245, 184, 75, 0.45)",

  accentViolet: "#B78CFF",
  accentVioletGlow: "rgba(183, 140, 255, 0.45)",
  accentPink: "#EF6FAF",
  accentPinkGlow: "rgba(239, 111, 175, 0.45)",

  secondary: "#1B2F4A",
  secondarySoft: "#263F5F",
  secondaryDark: "#08111F",

  textPrimary: "#F6E8C8",
  textSecondary: "#B8A77F",
  textMuted: "#6F7890",

  border: "rgba(245, 184, 75, 0.38)",
  borderSoft: "rgba(246, 232, 200, 0.12)",

  success: "#7FB069",
  warning: "#F5B84B",
  danger: "#B85C4A",

  overlayDark: "rgba(2, 5, 12, 0.65)",
  overlayLight: "rgba(255, 232, 170, 0.08)",
  transparent: "transparent",
} as const;

export type ThemeColors = typeof colors;
