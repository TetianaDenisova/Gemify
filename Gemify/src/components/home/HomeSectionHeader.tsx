import { Pressable, StyleSheet, View } from "react-native";

import { AppText, type SectionHeaderProps } from "@/shared/components";
import { colors } from "@/theme/colors";
import { pressed, radius } from "@/theme/theme";

/** Home's quiet gold headings and outlined Add Goal control. */
export function HomeSectionHeader({ action, style, title }: SectionHeaderProps) {
  return (
    <View style={[styles.row, style]}>
      <AppText style={styles.title} variant="eyebrow">{title}</AppText>
      {action ? (
        <Pressable
          accessibilityLabel={action.accessibilityLabel ?? action.label}
          accessibilityRole="button"
          onPress={action.onPress}
          style={({ pressed: isPressed }) => [styles.action, isPressed && pressed]}
        >
          {action.icon}
          <AppText color={colors.primary} style={styles.actionLabel} variant="bodySerif">{action.label}</AppText>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { alignItems: "center", flexDirection: "row", gap: 12, justifyContent: "space-between", minHeight: 30 },
  title: { color: colors.primary, flexShrink: 1, fontSize: 12, fontWeight: "600", letterSpacing: 2.1, lineHeight: 17 },
  action: { alignItems: "center", borderColor: "rgba(245, 184, 75, 0.4)", borderRadius: radius.round, borderWidth: 1, flexDirection: "row", gap: 7, minHeight: 38, paddingHorizontal: 14 },
  actionLabel: { fontSize: 16, lineHeight: 22 },
});
