import type { ReactNode } from "react";
import {
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { colors } from "@/theme/colors";
import { pressed, radius, shadows, spacing } from "@/theme/theme";

import { AppText } from "./AppText";

export type ChipProps = {
  accessibilityLabel?: string;
  icon?: ReactNode;
  label: string;
  onPress: () => void;
  selected?: boolean;
  style?: StyleProp<ViewStyle>;
};

/**
 * Selectable option chip (days, times, states). Unselected: dark glass with a
 * soft border; selected: gold border + glow + gold label.
 */
export function Chip({
  accessibilityLabel,
  icon,
  label,
  onPress,
  selected = false,
  style,
}: ChipProps) {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed: isPressed }) => [
        styles.chip,
        selected && styles.selected,
        isPressed && pressed,
        style,
      ]}
    >
      {icon ? <View>{icon}</View> : null}
      <AppText
        color={selected ? colors.primary : colors.textSecondary}
        variant="pill"
      >
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignItems: "center",
    backgroundColor: colors.surfaceDeep,
    borderColor: colors.borderSoft,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: spacing.md,
  },
  selected: {
    borderColor: colors.primary,
    ...shadows.goldGlow,
  },
});
