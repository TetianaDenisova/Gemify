import { StyleSheet, View } from "react-native";

import type { QuestWithBreadcrumb } from "@/db";
import { AppButton, AppModal, AppText, MilestoneIcon } from "@/shared/components";
import { colors } from "@/theme/colors";
import { radius, spacing } from "@/theme/theme";

export type OverdueQuestsModalProps = {
  onMoveToToday: () => void;
  onRelease: () => void;
  quests: readonly QuestWithBreadcrumb[];
  visible: boolean;
};

/**
 * Yesterday's unfinished quests, once a day. Either they come to today, or
 * they go back to their milestone — but the user decides, instead of finding
 * them quietly unscheduled.
 */
export function OverdueQuestsModal({
  onMoveToToday,
  onRelease,
  quests,
  visible,
}: OverdueQuestsModalProps) {
  const count = quests.length;

  return (
    // No dismiss by backdrop: this asks a question, and both answers change
    // where the quests end up.
    <AppModal onClose={onRelease} visible={visible}>
      <AppText align="center" variant="title">
        {count === 1 ? "One quest from yesterday" : `${count} quests from yesterday`}
      </AppText>
      <AppText
        align="center"
        color={colors.textSecondary}
        style={styles.subtitle}
        variant="bodySerif"
      >
        Bring them to today, or let them go back to their milestone.
      </AppText>

      <View style={styles.list}>
        {quests.map((quest) => (
          <View key={quest.id} style={styles.row}>
            <MilestoneIcon color={colors.primary} size={18} />
            <View style={styles.copy}>
              <AppText numberOfLines={1} variant="button">
                {quest.title}
              </AppText>
              <AppText color={colors.textMuted} numberOfLines={1} variant="bodySmall">
                {quest.dreamTitle} · {quest.milestoneTitle}
              </AppText>
            </View>
          </View>
        ))}
      </View>

      <AppButton
        label="Move to today"
        onPress={onMoveToToday}
        size="lg"
        style={styles.primary}
      />
      <AppButton
        label="Leave them"
        onPress={onRelease}
        style={styles.secondary}
        variant="secondary"
      />
    </AppModal>
  );
}

const styles = StyleSheet.create({
  copy: {
    flex: 1,
    minWidth: 0,
  },
  list: {
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  primary: {
    marginTop: spacing.lg,
  },
  row: {
    alignItems: "center",
    backgroundColor: colors.surfaceCard,
    borderColor: colors.borderSoft,
    borderRadius: radius.card,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  secondary: {
    marginTop: spacing.sm,
  },
  subtitle: {
    marginTop: spacing.sm,
  },
});
