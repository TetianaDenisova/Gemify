import { LinearGradient } from "expo-linear-gradient";
import type { ReactNode } from "react";
import {
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";

import { colors } from "@/theme/colors";
import { gradients, pressed, radius, shadows, spacing } from "@/theme/theme";

import { AppText } from "./AppText";

export type AppButtonVariant = "primary" | "secondary" | "ghost";
export type AppButtonSize = "md" | "lg";

export type AppButtonProps = {
  accessibilityLabel?: string;
  disabled?: boolean;
  /** Optional icon rendered after the label. */
  icon?: ReactNode;
  label: string;
  onPress: () => void;
  size?: AppButtonSize;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  variant?: AppButtonVariant;
};

const HEIGHTS: Record<AppButtonSize, number> = {
  md: 56,
  lg: 64,
};

/**
 * The app-wide button. `primary` is the gold-gradient CTA, `secondary` is the
 * bordered glass button, `ghost` is text-only.
 */
export function AppButton({
  accessibilityLabel,
  disabled = false,
  icon,
  label,
  onPress,
  size = "md",
  style,
  textStyle,
  variant = "primary",
}: AppButtonProps) {
  const minHeight = HEIGHTS[size];

  const content = (
    <>
      <AppText
        color={variant === "primary" ? colors.textOnPrimary : colors.primary}
        style={[variant === "primary" && styles.primaryText, textStyle]}
        variant="button"
      >
        {label}
      </AppText>
      {icon ? <View style={styles.icon}>{icon}</View> : null}
    </>
  );

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed: isPressed }) => [
        styles.base,
        { minHeight },
        variant === "secondary" && styles.secondary,
        variant === "ghost" && styles.ghost,
        variant === "primary" && styles.primaryShell,
        disabled && styles.disabled,
        isPressed && !disabled && pressed,
        style,
      ]}
    >
      {variant === "primary" ? (
        <LinearGradient
          colors={[...gradients.cta] as [string, string, ...string[]]}
          end={{ x: 1, y: 1 }}
          start={{ x: 0, y: 0 }}
          style={[styles.gradient, { minHeight }]}
        >
          {content}
        </LinearGradient>
      ) : (
        content
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    borderRadius: radius.md,
    flexDirection: "row",
    justifyContent: "center",
    overflow: "hidden",
  },
  disabled: {
    opacity: 0.45,
  },
  ghost: {
    minHeight: undefined,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  gradient: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  icon: {
    marginLeft: spacing.sm,
  },
  primaryShell: {
    ...shadows.goldGlow,
  },
  primaryText: {
    fontWeight: "700",
  },
  secondary: {
    backgroundColor: colors.surfaceGlass,
    borderColor: colors.border,
    borderWidth: 1,
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
});
