import type { ReactNode } from "react";
import {
  StyleSheet,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";

import { colors } from "@/theme/colors";
import { radius, spacing } from "@/theme/theme";

import { AppText } from "./AppText";

export type BadgeProps = {
  color?: string;
  icon?: ReactNode;
  label: string;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
};

/**
 * Small bordered pill for inline metadata (score, ETA, date range, status).
 */
export function Badge({
  color = colors.primary,
  icon,
  label,
  style,
  textStyle,
}: BadgeProps) {
  return (
    <View style={[styles.badge, { borderColor: color }, style]}>
      {icon}
      <AppText color={color} style={textStyle} variant="caption">
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: colors.surfaceDeep,
    borderRadius: radius.round,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.xs,
    minHeight: 28,
    paddingHorizontal: spacing.sm + spacing.xs,
    paddingVertical: spacing.xs,
  },
});
