import type { ReactNode } from "react";
import {
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { DayActionCard, DayActionList } from "@/components/DayActionCard";
import { HabitActionRow } from "@/components/HabitActionRow";
import { QuestActionRow } from "@/components/QuestActionRow";
import { BlockIconArt } from "@/components/TimeBlockTabs";
import type { DayAction, TimeBlock } from "@/dto/timeBlocks";
import { AppText, SparkIcon } from "@/shared/components";
import { useLayoutSize } from "@/hooks/useLayoutSize";
import { colors } from "@/theme/colors";
import { fontSizes, lineHeights, spacing } from "@/theme/theme";

function ActionRow({
  action,
  last,
  onPress,
  onToggle,
}: {
  action: DayAction;
  last: boolean;
  onPress?: () => void;
  onToggle: () => void;
}) {
  if (action.habit) {
    return (
      <HabitActionRow
        done={action.done}
        last={last}
        onPress={onPress}
        onToggle={onToggle}
        streakDays={action.habit.streakDays}
        subtitle={action.habit.cue || action.subtitle}
        title={action.title}
      />
    );
  }

  return (
    <QuestActionRow
      done={action.done}
      dreamTitle={action.dreamTitle}
      last={last}
      onPress={onPress}
      onToggle={onToggle}
      progressPercent={action.progressPercent ?? 0}
      subtitle={action.subtitle}
      title={action.title}
    />
  );
}

type TimeBlockCardProps = {
  block: TimeBlock;
  /** Rendered instead of the card when the block has no actions. */
  emptySlot?: ReactNode;
  /** Makes each row's body pressable (e.g. to open an action menu). */
  onPressAction?: (index: number) => void;
  onToggleAction: (index: number) => void;
  /** Render every action in its own card instead of rows sharing one card. */
  separated?: boolean;
  showHeader?: boolean;
  /** Hide the identity/routine copy and show only the action rows. */
  showIntro?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function TimeBlockCard({
  block,
  emptySlot,
  onPressAction,
  onToggleAction,
  separated = false,
  showHeader = true,
  showIntro = true,
  style,
}: TimeBlockCardProps) {
  const { compact } = useLayoutSize();
  const done = block.actions.filter((action) => action.done).length;
  // Checked-off rows sink below the open ones. Each row keeps its
  // original index, so the index-based callbacks still hit the right action.
  const indexedActions = block.actions.map((action, index) => ({
    action,
    index,
  }));
  const orderedActions = [
    ...indexedActions.filter((entry) => !entry.action.done),
    ...indexedActions.filter((entry) => entry.action.done),
  ];

  return (
    <View style={style}>
      {showHeader ? (
        <View style={styles.sectionHeader}>
          <View style={[styles.sectionBadge, compact && styles.sectionBadgeCompact]}>
            <BlockIconArt color={colors.primaryBright} icon={block.icon} size={compact ? 17 : 20} />
          </View>
          <AppText
            color={colors.textPrimary}
            style={[styles.sectionLabel, compact && styles.sectionLabelCompact]}
            variant="sectionTitle"
          >
            {block.label.toUpperCase()}
          </AppText>
          <View style={styles.sectionDivider} />
          <AppText
            color={colors.primary}
            style={compact && styles.sectionTimeCompact}
            variant="controlLabel"
          >
            {block.time}
          </AppText>
          {block.actions.length > 0 ? (
            <AppText
              color={colors.textPrimary}
              style={[styles.sectionCount, compact && styles.sectionCountCompact]}
              variant="pill"
            >
              {done} / {block.actions.length}
            </AppText>
          ) : null}
        </View>
      ) : null}

      {block.actions.length === 0 && emptySlot ? (
        emptySlot
      ) : separated ? (
        <DayActionList style={[styles.separatedList, compact && styles.separatedListCompact]}>
          {orderedActions.map(({ action, index }) => (
            <DayActionCard done={action.done} key={index}>
              <ActionRow
                action={action}
                last
                onPress={onPressAction ? () => onPressAction(index) : undefined}
                onToggle={() => onToggleAction(index)}
              />
            </DayActionCard>
          ))}
        </DayActionList>
      ) : (
      <DayActionCard
        style={[
          styles.card,
          compact && styles.cardCompact,
          !showHeader && styles.cardNoHeader,
        ]}
      >
        {showIntro ? (
          <>
            <View style={styles.identityRow}>
              <SparkIcon color={colors.accentViolet} size={compact ? 15 : 18} />
              <AppText
                color={colors.accentViolet}
                style={compact && styles.identityTextCompact}
                variant="eyebrow"
              >
                {block.identity}
              </AppText>
            </View>
            <AppText
              style={[styles.routineTitle, compact && styles.routineTitleCompact]}
              variant="cardTitle"
            >
              {block.routineTitle}
            </AppText>
            <AppText
              color={colors.primary}
              style={[styles.routineSubtitle, compact && styles.routineSubtitleCompact]}
              variant="body"
            >
              {block.routineSubtitle}
            </AppText>
          </>
        ) : null}

        <View style={[styles.actionList, compact && styles.actionListCompact, !showIntro && styles.actionListBare]}>
          {orderedActions.map(({ action, index }, position) => (
            <ActionRow
              action={action}
              key={index}
              last={position === orderedActions.length - 1}
              onPress={onPressAction ? () => onPressAction(index) : undefined}
              onToggle={() => onToggleAction(index)}
            />
          ))}
        </View>
      </DayActionCard>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  actionList: {
    marginTop: 20,
  },
  actionListBare: {
    marginTop: 0,
  },
  actionListCompact: {
    marginTop: 14,
  },
  card: {
    marginTop: 18,
  },
  cardCompact: {
    marginTop: 14,
  },
  cardNoHeader: {
    marginTop: 0,
  },
  identityRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 9,
  },
  identityTextCompact: {
    fontSize: fontSizes.xs,
    letterSpacing: 1.8,
    lineHeight: lineHeights.xs,
  },
  routineSubtitle: {
    marginTop: spacing.xs,
  },
  routineSubtitleCompact: {
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    marginTop: 4,
  },
  routineTitle: {
    marginTop: 14,
  },
  routineTitleCompact: {
    fontSize: fontSizes.xxl,
    lineHeight: lineHeights.xxl,
    marginTop: 10,
  },
  sectionBadge: {
    alignItems: "center",
    backgroundColor: "rgba(245, 184, 75, 0.08)",
    borderColor: colors.primary,
    borderRadius: 22,
    borderWidth: 1,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  sectionBadgeCompact: {
    borderRadius: 18,
    height: 36,
    width: 36,
  },
  sectionCount: {
    marginLeft: "auto",
  },
  sectionCountCompact: {
    fontSize: fontSizes.lg,
    lineHeight: lineHeights.md,
  },
  sectionDivider: {
    backgroundColor: colors.borderSoft,
    height: 20,
    width: 1,
  },
  sectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
  },
  sectionLabel: {
    flexShrink: 1,
  },
  sectionLabelCompact: {
    fontSize: fontSizes.sm,
    letterSpacing: 1.6,
    lineHeight: lineHeights.sm,
  },
  sectionTimeCompact: {
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
  },
  separatedList: {
    marginTop: 18,
  },
  separatedListCompact: {
    marginTop: 14,
  },
});
