import type { ReactNode } from "react";
import {
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { colors } from "@/theme/colors";
import { controls, pressed, spacing } from "@/theme/theme";

import { AppText } from "./AppText";

export type ListItemProps = {
  accessibilityLabel?: string;
  /** Hide the bottom hairline (e.g. on the last row). */
  last?: boolean;
  leading?: ReactNode;
  minHeight?: number;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  subtitle?: string;
  title: string;
  titleColor?: string;
  trailing?: ReactNode;
};

/**
 * Standard list row: leading slot · title/subtitle · trailing slot, with a
 * soft hairline divider.
 */
export function ListItem({
  accessibilityLabel,
  last = false,
  leading,
  minHeight = controls.row.task,
  onPress,
  style,
  subtitle,
  title,
  titleColor = colors.textPrimary,
  trailing,
}: ListItemProps) {
  const content = (
    <>
      {leading ? <View style={styles.slot}>{leading}</View> : null}
      <View style={styles.copy}>
        <AppText color={titleColor} numberOfLines={2} variant="pill">
          {title}
        </AppText>
        {subtitle ? <AppText variant="bodySmall">{subtitle}</AppText> : null}
      </View>
      {trailing ? <View style={styles.slot}>{trailing}</View> : null}
    </>
  );

  const rowStyles: StyleProp<ViewStyle> = [
    styles.row,
    { minHeight },
    last && styles.last,
    style,
  ];

  if (!onPress) {
    return <View style={rowStyles}>{content}</View>;
  }

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed: isPressed }) => [rowStyles, isPressed && pressed]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  copy: {
    flex: 1,
    minWidth: 0,
  },
  last: {
    borderBottomWidth: 0,
  },
  row: {
    alignItems: "center",
    borderBottomColor: colors.divider,
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  slot: {
    alignItems: "center",
    justifyContent: "center",
  },
});
