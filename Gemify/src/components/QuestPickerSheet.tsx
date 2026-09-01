import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";

import { type QuestWithBreadcrumb } from "@/db";
import {
  AppModal,
  AppText,
  ChevronIcon,
  CloseIcon,
  DreamIcon,
  MilestoneIcon,
  PlusIcon,
  SparkIcon,
} from "@/shared/components";
import { colors } from "@/theme/colors";
import { iconSizes, pressed, radius, shadowStyle, spacing } from "@/theme/theme";

type QuestGroup = {
  dreamTitle: string;
  milestones: { milestoneTitle: string; quests: QuestWithBreadcrumb[] }[];
};

/** Dream → milestone → quests, in the order the repository returns them. */
function groupQuests(quests: QuestWithBreadcrumb[]): QuestGroup[] {
  const groups: QuestGroup[] = [];
  for (const quest of quests) {
    let group = groups.find((entry) => entry.dreamTitle === quest.dreamTitle);
    if (!group) {
      group = { dreamTitle: quest.dreamTitle, milestones: [] };
      groups.push(group);
    }
    let milestone = group.milestones.find(
      (entry) => entry.milestoneTitle === quest.milestoneTitle,
    );
    if (!milestone) {
      milestone = { milestoneTitle: quest.milestoneTitle, quests: [] };
      group.milestones.push(milestone);
    }
    milestone.quests.push(quest);
  }
  return groups;
}

type QuestPickerSheetProps = {
  onAdd: (quest: QuestWithBreadcrumb) => void;
  onClose: () => void;
  quests: QuestWithBreadcrumb[];
  /** Copy under the title, e.g. "Pick quests you want to add to this day." */
  subtitle: string;
  /** Violet-highlighted name of what quests are added to (block or day). */
  targetLabel: string;
  /** Optional gold time row under the title (e.g. the block's time). */
  time?: string | null;
  visible: boolean;
};

/**
 * "Add quests" sheet: every quest not yet accepted, grouped by dream with the
 * milestone as a sub-header. "ADD" hands the quest to the host screen, which
 * schedules it into its own target (a time block or a day).
 */
export function QuestPickerSheet({
  onAdd,
  onClose,
  quests,
  subtitle,
  targetLabel,
  time,
  visible,
}: QuestPickerSheetProps) {
  const [collapsedDreams, setCollapsedDreams] = useState<Set<string>>(
    () => new Set(),
  );
  // Regrouping is O(n²) — don't redo it on collapse/expand toggles.
  const groups = useMemo(() => groupQuests(quests), [quests]);

  const toggleDream = (dreamTitle: string) => {
    setCollapsedDreams((current) => {
      const next = new Set(current);
      if (next.has(dreamTitle)) next.delete(dreamTitle);
      else next.add(dreamTitle);
      return next;
    });
  };

  return (
    <AppModal maxWidth={720} onClose={onClose} variant="sheet" visible={visible}>
      <Pressable
        accessibilityLabel="Close"
        accessibilityRole="button"
        hitSlop={8}
        onPress={onClose}
        style={({ pressed: isPressed }) => [
          styles.pickerClose,
          isPressed && pressed,
        ]}
      >
        <CloseIcon color={colors.textSecondary} size={iconSizes.sm} />
      </Pressable>

      <AppText align="center" variant="titleSm">
        Add to{" "}
        <AppText color={colors.accentViolet} variant="titleSm">
          {targetLabel}
        </AppText>
      </AppText>
      {time ? (
        <View style={styles.pickerTimeRow}>
          <SparkIcon color={colors.primary} size={iconSizes.sm} />
          <AppText color={colors.primary} variant="titleSm">
            {time}
          </AppText>
          <SparkIcon color={colors.primary} size={iconSizes.sm} />
        </View>
      ) : null}
      <AppText
        align="center"
        color={colors.textSecondary}
        style={styles.pickerSubtitle}
        variant="bodySmall"
      >
        {subtitle}
      </AppText>

      {groups.length > 0 ? (
        <ScrollView style={styles.pickerList}>
          {groups.map((group) => {
            const collapsed = collapsedDreams.has(group.dreamTitle);
            return (
              <View key={group.dreamTitle} style={styles.pickerGroup}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ expanded: !collapsed }}
                  onPress={() => toggleDream(group.dreamTitle)}
                  style={({ pressed: isPressed }) => [
                    styles.pickerGroupHeader,
                    isPressed && pressed,
                  ]}
                >
                  <View style={styles.pickerGroupIcon}>
                    <DreamIcon color={colors.primary} size={26} />
                  </View>
                  <AppText
                    color={colors.primary}
                    numberOfLines={1}
                    style={styles.pickerGroupTitle}
                    variant="cardTitle"
                  >
                    {group.dreamTitle}
                  </AppText>
                  <ChevronIcon
                    color={colors.accentViolet}
                    direction={collapsed ? "down" : "up"}
                    size={20}
                  />
                </Pressable>

                {collapsed
                  ? null
                  : group.milestones.map((milestone) => (
                    <View key={milestone.milestoneTitle}>
                      <View style={styles.pickerMilestoneRow}>
                        <MilestoneIcon size={16} />
                        <AppText
                          color={colors.primary}
                          numberOfLines={1}
                          variant="subtitle"
                        >
                          {milestone.milestoneTitle}
                        </AppText>
                        <View style={styles.pickerMilestoneRule} />
                      </View>
                      {milestone.quests.map((quest) => (
                        <View key={quest.id} style={styles.pickerQuestRow}>
                            <SparkIcon
                              color={colors.accentViolet}
                              size={22}
                            />
                            <AppText
                              numberOfLines={2}
                              style={styles.pickerQuestTitle}
                              variant="pill"
                            >
                              {quest.title}
                            </AppText>
                            <Pressable
                              accessibilityLabel={`Add the quest ${quest.title} to ${targetLabel}`}
                              accessibilityRole="button"
                              hitSlop={8}
                              onPress={() => onAdd(quest)}
                              style={({ pressed: isPressed }) => [
                                styles.pickerAddButton,
                                isPressed && pressed,
                              ]}
                            >
                              <PlusIcon
                                color={colors.primary}
                                size={iconSizes.md}
                              />
                            </Pressable>
                          </View>
                        ))}
                    </View>
                  ))}
              </View>
            );
          })}
        </ScrollView>
      ) : (
        <AppText
          align="center"
          color={colors.textSecondary}
          style={styles.pickerEmpty}
          variant="bodySmall"
        >
          No quests waiting to be accepted. Create quests in your milestones
          and they will show up here.
        </AppText>
      )}
    </AppModal>
  );
}

const styles = StyleSheet.create({
  pickerAddButton: {
    alignItems: "center",
    borderColor: colors.primary,
    borderRadius: radius.round,
    borderWidth: 1.5,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  pickerClose: {
    alignItems: "center",
    borderColor: colors.borderSoft,
    borderRadius: radius.round,
    borderWidth: 1,
    height: 40,
    justifyContent: "center",
    position: "absolute",
    right: spacing.md,
    top: spacing.md,
    width: 40,
    zIndex: 2,
  },
  pickerEmpty: {
    marginVertical: spacing.lg,
  },
  pickerGroup: {
    backgroundColor: colors.surfaceDeep,
    borderColor: colors.borderFaint,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  pickerGroupHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
    minHeight: 52,
  },
  pickerGroupIcon: {
    alignItems: "center",
    borderColor: "rgba(245, 184, 75, 0.55)",
    borderRadius: radius.round,
    borderWidth: 1,
    height: 52,
    justifyContent: "center",
    width: 52,
    ...shadowStyle({
      color: colors.primary,
      elevation: 6,
      opacity: 0.35,
      radius: 10,
    }),
  },
  pickerGroupTitle: {
    flex: 1,
    minWidth: 0,
  },
  pickerList: {
    marginTop: spacing.md,
    maxHeight: 460,
  },
  pickerMilestoneRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  pickerMilestoneRule: {
    backgroundColor: "rgba(245, 184, 75, 0.25)",
    flex: 1,
    height: 1,
    marginLeft: spacing.sm,
  },
  pickerQuestRow: {
    alignItems: "center",
    backgroundColor: colors.surfaceCard,
    borderColor: colors.borderFaint,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.sm,
    minHeight: 64,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  pickerQuestTitle: {
    flex: 1,
    minWidth: 0,
  },
  pickerSubtitle: {
    marginTop: spacing.xs,
  },
  pickerTimeRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "center",
    marginTop: spacing.xs,
  },
});
