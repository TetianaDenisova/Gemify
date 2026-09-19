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
export type AppButtonDensity = "default" | "compact";

export type AppButtonProps = {
  accessibilityLabel?: string;
  /**
   * How much room the label gets inside the button. "compact" is for two
   * buttons sharing one row, where the standard inset wraps the label.
   * Padding passed through `style` is ignored — see the note in the render.
   */
  density?: AppButtonDensity;
  disabled?: boolean;
  /** Optional icon rendered next to the label. */
  icon?: ReactNode;
  /** Side of the label the icon sits on. Default "after". */
  iconPosition?: "before" | "after";
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
  density = "default",
  disabled = false,
  icon,
  iconPosition = "after",
  label,
  onPress,
  size = "md",
  style,
  textStyle,
  variant = "primary",
}: AppButtonProps) {
  const minHeight = HEIGHTS[size];

  const iconNode = icon ? (
    <View style={iconPosition === "before" ? styles.iconBefore : styles.icon}>
      {icon}
    </View>
  ) : null;

  const content = (
    <>
      {iconPosition === "before" ? iconNode : null}
      <AppText
        color={variant === "primary" ? colors.textOnPrimary : colors.primary}
        style={textStyle}
        variant={variant === "primary" ? "buttonPrimary" : "button"}
      >
        {label}
      </AppText>
      {iconPosition === "after" ? iconNode : null}
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
        variant === "primary" && styles.primary,
        disabled && styles.disabled,
        isPressed && !disabled && pressed,
        style,
        // Every child — the gold fill included — is laid out inside the
        // padding box, so padding on the shell would inset the fill and leave
        // a dark sliver at the button's edge. The label's inset lives on the
        // content row below instead, where `density` controls it. Zeroing the
        // per-edge longhands last is what makes a caller's `padding` or
        // `paddingHorizontal` harmless.
        styles.shellPadding,
      ]}
    >
      {variant === "primary" ? (
        <LinearGradient
          colors={gradients.cta}
          end={{ x: 1, y: 1 }}
          start={{ x: 0, y: 0 }}
          style={styles.gradient}
        />
      ) : null}
      <View
        style={[
          styles.content,
          variant === "ghost" && styles.contentGhost,
          density === "compact" && styles.contentCompact,
        ]}
      >
        {content}
      </View>
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
  /** The label row: owns the inset the shell is no longer allowed to have. */
  content: {
    alignItems: "center",
    alignSelf: "stretch",
    flexDirection: "row",
    // `flexGrow` (not `flex`) so an auto-width button still sizes to its
    // label instead of collapsing to a zero basis.
    flexGrow: 1,
    gap: spacing.sm,
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  /** Two buttons sharing a row: the standard inset would wrap the label. */
  contentCompact: {
    paddingHorizontal: spacing.sm,
  },
  contentGhost: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  disabled: {
    opacity: 0.45,
  },
  ghost: {
    minHeight: undefined,
  },
  gradient: {
    bottom: 0,
    // The shell clips it too; the radius is what keeps the corners right on
    // Android, where elevation can defeat the parent's `overflow: hidden`.
    borderRadius: radius.md,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
  icon: {
    marginLeft: spacing.sm,
  },
  iconBefore: {
    marginRight: spacing.sm,
  },
  primary: {
    ...shadows.goldGlow,
  },
  secondary: {
    backgroundColor: colors.surfaceGlass,
    borderColor: colors.border,
    borderWidth: 1,
  },
  /** See the note at the call site: the shell never carries padding. */
  shellPadding: {
    paddingBottom: 0,
    paddingLeft: 0,
    paddingRight: 0,
    paddingTop: 0,
  },
});
