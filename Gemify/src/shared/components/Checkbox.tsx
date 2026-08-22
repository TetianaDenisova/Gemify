import {
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { colors } from "@/theme/colors";
import { layout, radius } from "@/theme/theme";

import { CheckIcon } from "./icons";

export type CheckboxProps = {
  accessibilityLabel?: string;
  /**
   * "solid" (default) fills gold with a dark check when checked; "outline"
   * keeps a transparent body with a gold ring and a gold check.
   */
  appearance?: "solid" | "outline";
  checked: boolean;
  onPress?: () => void;
  shape?: "circle" | "square";
  size?: number;
  style?: StyleProp<ViewStyle>;
};

/**
 * The standard check control: gold border, filled gold with a dark check when
 * checked. Display-only when onPress is omitted.
 */
export function Checkbox({
  accessibilityLabel,
  appearance = "solid",
  checked,
  onPress,
  shape = "circle",
  size = 24,
  style,
}: CheckboxProps) {
  const outline = appearance === "outline";
  const box: ViewStyle = {
    borderRadius: shape === "circle" ? radius.round : radius.sm,
    height: size,
    width: size,
  };

  const inner = (
    <View
      style={[
        styles.base,
        box,
        outline && styles.outline,
        checked && (outline ? styles.checkedOutline : styles.checked),
        !onPress && style,
      ]}
    >
      {checked ? (
        <CheckIcon
          color={outline ? colors.primary : undefined}
          size={Math.round(size * 0.6)}
        />
      ) : null}
    </View>
  );

  if (!onPress) {
    return inner;
  }

  const slop = Math.max(0, (layout.minTouchTarget - size) / 2);

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      hitSlop={slop}
      onPress={onPress}
      style={({ pressed }) => [pressed && styles.pressed, style]}
    >
      {inner}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    backgroundColor: colors.surfaceDeep,
    borderColor: colors.border,
    borderWidth: 1.5,
    justifyContent: "center",
  },
  checked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkedOutline: {
    borderColor: colors.primary,
  },
  outline: {
    backgroundColor: colors.transparent,
    borderColor: colors.borderStrong,
  },
  pressed: {
    opacity: 0.72,
  },
});
