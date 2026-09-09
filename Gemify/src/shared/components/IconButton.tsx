import type { ReactNode } from "react";
import {
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { useLayoutSize } from "@/hooks/useLayoutSize";
import { colors } from "@/theme/colors";
import {
  controls,
  controlsPhone,
  radius,
  shadowStyle,
  spacing,
} from "@/theme/theme";

import { AppText } from "./AppText";

export type IconButtonSize = keyof typeof controls.iconButton;

/** Side of an icon button on the active tier — also used to size header spacers. */
export function iconButtonSide(size: IconButtonSize, phone: boolean): number {
  return phone ? controlsPhone.iconButton[size] : controls.iconButton[size];
}

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
  const { phone } = useLayoutSize();
  const hasLabel = Boolean(label);
  const side = iconButtonSide(size, phone);
  // A labelled button must be free to grow when Dynamic Type scales its text,
  // so on the phone tier the square becomes a floor rather than a fixed size.
  const frame =
    phone && hasLabel
      ? { borderRadius: radius.md, minHeight: side, minWidth: side }
      : { borderRadius: radius.md, height: side, width: side };

  return (
    <View
      style={[
        styles.glow,
        frame,
        hasLabel && styles.withLabel,
        hasLabel && phone && styles.withLabelPhone,
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
          hasLabel && [
            styles.buttonWithLabel,
            styles.withLabel,
            phone && styles.withLabelPhone,
          ],
          pressed && styles.pressed,
        ]}
      >
        <View style={[styles.innerEdge, { pointerEvents: "none" }]} />
        {icon}
        {label ? (
          <AppText color={colors.primary} style={styles.label} variant="controlLabel">
            {label}
          </AppText>
        ) : null}
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
    paddingHorizontal: spacing.md,
  },
  disabled: {
    opacity: 0.38,
  },
  glow: {
    backgroundColor: colors.surfaceGlass,
    ...shadowStyle({ color: colors.primary, elevation: 8, opacity: 0.2, radius: 8 }),
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
    marginLeft: spacing.sm,
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
  /** Header button pairs have to share 370 pt, so the 128 pt floor goes. */
  withLabelPhone: {
    flexShrink: 1,
    minWidth: 0,
  },
});
