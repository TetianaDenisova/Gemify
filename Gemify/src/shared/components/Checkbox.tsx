import { LinearGradient } from "expo-linear-gradient";
import {
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { colors } from "@/theme/colors";
import {
  gradients,
  layout,
  radius,
  shadowStyle,
  withOpacity,
} from "@/theme/theme";

import { CheckIcon } from "./icons";

/** A "glow" square's corners scale with its size (≈10 pt at 40 pt). */
const GLOW_CORNER_RATIO = 0.26;

export type CheckboxProps = {
  accessibilityLabel?: string;
  /**
   * "solid" (default) fills gold with a dark check when checked; "outline"
   * keeps a transparent body with a gold ring and a gold check; "glow" is the
   * habit check — a thin gold ring, filled with the CTA gradient and a gold
   * glow once checked.
   */
  appearance?: "solid" | "outline" | "glow";
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
  const glow = appearance === "glow";
  const cornerRadius =
    shape === "circle"
      ? radius.round
      : glow
        ? Math.round(size * GLOW_CORNER_RATIO)
        : radius.sm;
  const box: ViewStyle = {
    borderRadius: cornerRadius,
    height: size,
    width: size,
  };

  const inner = (
    <View
      style={[
        styles.base,
        box,
        outline && styles.outline,
        glow && styles.glow,
        checked &&
          (glow
            ? styles.checkedGlow
            : outline
              ? styles.checkedOutline
              : styles.checked),
        !onPress && style,
      ]}
    >
      {glow && checked ? (
        <LinearGradient
          colors={gradients.cta}
          style={[StyleSheet.absoluteFill, { borderRadius: cornerRadius }]}
        />
      ) : null}
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
  checkedGlow: {
    borderColor: colors.primaryBright,
    ...shadowStyle({
      color: colors.primary,
      elevation: 6,
      opacity: 0.6,
      radius: 10,
    }),
  },
  checkedOutline: {
    borderColor: colors.primary,
  },
  glow: {
    backgroundColor: colors.transparent,
    borderColor: withOpacity(colors.primary, 0.5),
  },
  outline: {
    backgroundColor: colors.transparent,
    borderColor: colors.borderStrong,
  },
  pressed: {
    opacity: 0.72,
  },
});
