import type { ReactNode } from "react";
import {
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { colors } from "@/theme/colors";
import { pressed, radius, spacing } from "@/theme/theme";

import { AppText, type AppTextVariant } from "./AppText";

export type SectionHeaderAction = {
  accessibilityLabel?: string;
  icon?: ReactNode;
  label: string;
  onPress: () => void;
};

export type SectionHeaderProps = {
  /** Small pill button on the right (e.g. "+ Add Quest"). */
  action?: SectionHeaderAction;
  style?: StyleProp<ViewStyle>;
  title: string;
  /** "sectionTitle" (default) or "eyebrow" for the small uppercase label. */
  variant?: Extract<AppTextVariant, "sectionTitle" | "eyebrow">;
};

/** Section title row with an optional trailing action pill. */
export function SectionHeader({
  action,
  style,
  title,
  variant = "sectionTitle",
}: SectionHeaderProps) {
  return (
    <View style={[styles.row, style]}>
      <AppText numberOfLines={1} style={styles.title} variant={variant}>
        {title}
      </AppText>
      {action ? (
        <Pressable
          accessibilityLabel={action.accessibilityLabel ?? action.label}
          accessibilityRole="button"
          onPress={action.onPress}
          style={({ pressed: isPressed }) => [
            styles.action,
            isPressed && pressed,
          ]}
        >
          {action.icon}
          <AppText color={colors.primary} variant="captionStrong">
            {action.label}
          </AppText>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  action: {
    alignItems: "center",
    backgroundColor: colors.surfaceGlass,
    borderColor: colors.border,
    borderRadius: radius.round,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.xs,
    minHeight: 40,
    paddingHorizontal: spacing.md,
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between",
  },
  title: {
    flexShrink: 1,
  },
});
