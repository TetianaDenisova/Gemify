import type { ReactNode } from "react";
import {
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { colors } from "@/theme/colors";
import { controls, pressed, radius, shadows } from "@/theme/theme";

export type CardVariant = "default" | "glass" | "strong";

export type CardProps = {
  accessibilityLabel?: string;
  children: ReactNode;
  onPress?: () => void;
  /** Apply the standard card padding. Default true. */
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
  variant?: CardVariant;
};

/**
 * The standard surface container: dark translucent background, 1px gold
 * border, radius.card. `glass` is the lighter frosted variant, `strong` is the
 * highlighted (active) variant with a brighter border and gold glow.
 */
export function Card({
  accessibilityLabel,
  children,
  onPress,
  padded = true,
  style,
  variant = "default",
}: CardProps) {
  const cardStyles: StyleProp<ViewStyle> = [
    styles.base,
    styles[variant],
    padded && styles.padded,
    style,
  ];

  if (!onPress) {
    return <View style={cardStyles}>{children}</View>;
  }

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed: isPressed }) => [cardStyles, isPressed && pressed]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.card,
    borderWidth: 1,
  },
  default: {
    backgroundColor: colors.surfaceCard,
    borderColor: colors.borderFaint,
    ...shadows.softDark,
  },
  glass: {
    backgroundColor: colors.surfaceGlass,
    borderColor: colors.border,
    ...shadows.softDark,
  },
  padded: {
    padding: controls.surface.cardPadding,
  },
  strong: {
    backgroundColor: colors.surfaceCard,
    borderColor: colors.borderStrong,
    ...shadows.goldGlow,
  },
});
