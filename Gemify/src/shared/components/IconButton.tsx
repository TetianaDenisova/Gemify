import type { ReactNode } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { colors } from "@/theme/colors";
import { controls, radius, shadows } from "@/theme/theme";

export type IconButtonSize = keyof typeof controls.iconButton;

export type IconButtonProps = {
  accessibilityLabel: string;
  disabled?: boolean;
  icon: ReactNode;
  /** Optional text rendered next to the icon (button widens to fit). */
  label?: string;
  onPress: () => void;
  size?: IconButtonSize;
  style?: StyleProp<ViewStyle>;
};

/**
 * Circular-ish glass icon button used in headers, toolbars, and floating
 * controls. One look everywhere: glass surface, gold border, inner edge,
 * soft gold glow.
 */
export function IconButton({
  accessibilityLabel,
  disabled = false,
  icon,
  label,
  onPress,
  size = "sm",
  style,
}: IconButtonProps) {
  const side = controls.iconButton[size];
  const frame = { borderRadius: radius.md, height: side, width: side };
  const hasLabel = Boolean(label);

  return (
    <View
      style={[
        styles.glow,
        frame,
        hasLabel && styles.withLabel,
        disabled && styles.disabled,
        style,
      ]}
    >
      <Pressable
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="button"
        disabled={disabled}
        hitSlop={8}
        onPress={onPress}
        style={({ pressed }) => [
          styles.button,
          frame,
          hasLabel && [styles.buttonWithLabel, styles.withLabel],
          pressed && styles.pressed,
        ]}
      >
        <View pointerEvents="none" style={styles.innerEdge} />
        {icon}
        {label ? <Text style={styles.label}>{label}</Text> : null}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    backgroundColor: colors.surfaceGlass,
    borderColor: colors.border,
    borderWidth: 1,
    justifyContent: "center",
    overflow: "hidden",
  },
  buttonWithLabel: {
    flexDirection: "row",
    paddingHorizontal: 18,
  },
  disabled: {
    opacity: 0.38,
  },
  glow: {
    backgroundColor: colors.surfaceGlass,
    ...shadows.goldGlow,
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  innerEdge: {
    ...StyleSheet.absoluteFill,
    borderBottomColor: colors.secondaryDark,
    borderColor: colors.borderSoft,
    borderRadius: radius.md,
    borderWidth: 1,
    margin: 2,
  },
  label: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 20,
    marginLeft: 8,
  },
  pressed: {
    backgroundColor: colors.secondary,
    borderColor: colors.primary,
    transform: [{ scale: 0.97 }],
  },
  withLabel: {
    minWidth: 128,
    width: "auto",
  },
});
