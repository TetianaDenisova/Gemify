import { useFocusEffect, useRouter } from "expo-router";
import { StyleSheet, View, useWindowDimensions } from "react-native";
import { useCallback, useState } from "react";
import Svg, { Path } from "react-native-svg";

import {
  HabitBoardRow,
  toBoardHabit,
  type BoardHabit,
} from "@/components/HabitBoardCard";
import { deleteHabit, getDreams, type Dream } from "@/db";
import { useHabitWeek, type HabitWeekView } from "@/hooks/useHabitWeek";
import {
  AppButton,
  AppModal,
  AppText,
  ChevronIcon,
  IconButton,
  PlusIcon,
  ScreenScaffold,
  SparkIcon,
} from "@/shared/components";
import { colors } from "@/theme/colors";
import {
  fontSizes,
  layout,
  lineHeights,
  radius,
  shadows,
  spacing,
} from "@/theme/theme";

/** Bespoke deep-night gradient behind the habits board. */
const HABITS_BACKGROUND = [
  "#020713",
  "rgba(3, 8, 19, 0.97)",
  "rgba(3, 8, 19, 0.92)",
  "rgba(3, 8, 19, 0.98)",
] as const;

type Habit = BoardHabit;

type HabitGroup = {
  count: string;
  icon: "book" | "heart";
  tint: string;
  title: string;
  habits: readonly Habit[];
};

const GROUP_VISUAL_CYCLE = [
  { icon: "book", tint: colors.accentVioletStrong },
  { icon: "heart", tint: colors.primary },
] as const;

function MenuIcon() {
  return (
    <Svg height={27} viewBox="0 0 24 24" width={27}>
      <Path
        d="M5 7h14M5 12h14M5 17h14"
        fill="none"
        stroke={colors.primary}
        strokeLinecap="round"
        strokeWidth={1.7}
      />
    </Svg>
  );
}

function HeaderOrnament({ compact }: { compact: boolean }) {
  return (
    <View style={styles.ornamentRow} pointerEvents="none">
      <View style={[styles.ornamentLine, compact && styles.ornamentLineCompact]} />
      <SparkIcon size={compact ? 24 : 32} />
      <View style={[styles.ornamentLine, compact && styles.ornamentLineCompact]} />
    </View>
  );
}

function TodayBar({
  compact,
  totalHabits,
}: {
  compact: boolean;
  totalHabits: number;
}) {
  const dateLabel = new Date().toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    weekday: "long",
  });

  return (
    <View style={[styles.todayBar, compact && styles.todayBarCompact]}>
      <View style={[styles.todayLabelRow, compact && styles.todayLabelRowCompact]}>
        <SparkIcon size={compact ? 16 : 20} />
        <AppText
          color={colors.primary}
          style={[styles.todayLabel, compact && styles.todayLabelCompact]}
          variant="pill"
        >
          Today
        </AppText>
      </View>
      <View style={styles.todayDivider} />
      <AppText
        numberOfLines={1}
        style={[styles.todayDate, compact && styles.todayDateCompact]}
        variant="subtitle"
      >
        {dateLabel}
      </AppText>
      <AppText
        color={colors.textMuted}
        style={compact && styles.todayCountCompact}
        variant="subtitle"
      >
        {totalHabits} habits
      </AppText>
    </View>
  );
}

function GroupIcon({ icon, tint }: { icon: HabitGroup["icon"]; tint: string }) {
  if (icon === "heart") {
    return (
      <Svg height={31} viewBox="0 0 32 32" width={31}>
        <Path
          d="M16 27S5.5 20.3 5.5 12.3c0-4.1 5.3-6.8 10.5-.9 5.2-5.9 10.5-3.2 10.5.9C26.5 20.3 16 27 16 27Z"
          fill="none"
          stroke={tint}
          strokeLinejoin="round"
          strokeWidth={2}
        />
        <Path
          d="M11.5 22.6c.3-5.7 3.5-10.1 9.4-13.4"
          fill="none"
          stroke={tint}
          strokeLinecap="round"
          strokeWidth={1.8}
        />
      </Svg>
    );
  }

  return (
    <Svg height={31} viewBox="0 0 32 32" width={31}>
      <Path
        d="M5.5 8c4.8 0 8 1.4 10.5 4.8C18.5 9.4 21.7 8 26.5 8v16c-4.8 0-8 1.4-10.5 4.8C13.5 25.4 10.3 24 5.5 24V8Z"
        fill="none"
        stroke={tint}
        strokeLinejoin="round"
        strokeWidth={2}
      />
      <Path
        d="M16 12.8v16"
        fill="none"
        stroke={tint}
        strokeLinecap="round"
        strokeWidth={2}
      />
    </Svg>
  );
}

function HabitRow({
  activeDayIndex,
  compact,
  expanded,
  habit,
  onDayPress,
  onDelete,
  onEdit,
  onPress,
}: {
  activeDayIndex: number;
  compact: boolean;
  expanded: boolean;
  habit: Habit;
  onDayPress: (dayIndex: number) => void;
  onDelete: () => void;
  onEdit: () => void;
  onPress: () => void;
}) {
  return (
    <HabitBoardRow
      activeDayIndex={activeDayIndex}
      compact={compact}
      containerStyle={[
        styles.habitRow,
        compact && styles.habitRowCompact,
        expanded && styles.habitRowExpanded,
        expanded && compact && styles.habitRowExpandedCompact,
      ]}
      expanded={expanded}
      footer={
        <View style={styles.habitActionsRow}>
          <AppButton
            label="Edit"
            onPress={onEdit}
            style={styles.habitActionButton}
            variant="secondary"
          />
          <AppButton
            label="Delete"
            onPress={onDelete}
            style={[styles.habitActionButton, styles.habitDeleteButton]}
            textStyle={styles.habitDeleteLabel}
            variant="secondary"
          />
        </View>
      }
      habit={habit}
      onDayPress={onDayPress}
      onPress={onPress}
    />
  );
}

function GroupHeader({ compact, group }: { compact: boolean; group: HabitGroup }) {
  return (
    <View style={[styles.groupHeader, compact && styles.groupHeaderCompact]}>
      <View style={[styles.groupTitleRow, compact && styles.groupTitleRowCompact]}>
        <GroupIcon icon={group.icon} tint={group.tint} />
        <AppText
          numberOfLines={1}
          style={[styles.groupTitle, compact && styles.groupTitleCompact]}
          variant="button"
        >
          {group.title}
        </AppText>
        <AppText
          color={colors.textMuted}
          style={[styles.groupCount, compact && styles.groupCountCompact]}
          variant="subtitle"
        >
          {group.count}
        </AppText>
      </View>
      {group.habits.length === 0 ? <ChevronIcon /> : null}
    </View>
  );
}

export default function HabitsScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const compact = width < layout.compactBreakpoint;
  const [expandedHabit, setExpandedHabit] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Habit | null>(null);
  const [dreams, setDreams] = useState<Dream[]>([]);
  const { habits: habitViews, refresh, setCompletion, weekDates } =
    useHabitWeek();

  useFocusEffect(
    useCallback(() => {
      getDreams()
        .then(setDreams)
        .catch((cause: unknown) =>
          console.error("Failed to load dreams", cause),
        );
    }, []),
  );

  // Monday-first index of today, matching the week strip's order.
  const activeDayIndex = (new Date().getDay() + 6) % 7;

  const groups: (HabitGroup & { views: HabitWeekView[] })[] = dreams
    .map((dream, index) => {
      const visuals = GROUP_VISUAL_CYCLE[index % GROUP_VISUAL_CYCLE.length];
      const views = habitViews.filter(
        (view) => view.habit.dreamId === dream.id,
      );
      return {
        count: `${views.length} ${views.length === 1 ? "habit" : "habits"}`,
        icon: visuals.icon,
        tint: visuals.tint,
        title: dream.title,
        habits: views.map((view, habitIndex) =>
          toBoardHabit(view, habitIndex, visuals.tint),
        ),
        views,
      };
    })
    .filter((group) => group.habits.length > 0);

  function handleHabitPress(id: number) {
    setExpandedHabit((current) => (current === id ? null : id));
  }

  function handleDayPress(habit: Habit, dayIndex: number) {
    const date = weekDates[dayIndex];
    const current = habit.progress[dayIndex];
    // Tap cycles done ↔ open; the create/edit form is where richer statuses
    // could live later.
    setCompletion(habit.id, date, current === "done" ? null : "done");
  }

  async function handleDeleteConfirmed() {
    if (!deleteTarget) return;
    try {
      await deleteHabit(deleteTarget.id);
      await refresh();
    } catch (cause) {
      console.error("Failed to delete the habit", cause);
    }
    setDeleteTarget(null);
  }

  return (
    <ScreenScaffold backgroundGradient={HABITS_BACKGROUND} tabClearance topInset>
      <View style={[styles.header, compact && styles.headerCompact]}>
        <IconButton
          accessibilityLabel="Open menu"
          icon={<MenuIcon />}
          onPress={() => {}}
          size={compact ? "sm" : "md"}
        />
        <View style={[styles.titleBlock, compact && styles.titleBlockCompact]}>
          <AppText
            align="center"
            color={colors.primary}
            numberOfLines={1}
            style={[styles.title, compact && styles.titleCompact]}
            variant="screenTitle"
          >
            My Habits
          </AppText>
          <HeaderOrnament compact={compact} />
        </View>
        <IconButton
          accessibilityLabel="Add habit"
          icon={<PlusIcon size={compact ? 26 : 30} />}
          onPress={() => router.push("/create-habit")}
          size={compact ? "sm" : "md"}
        />
      </View>

      <TodayBar compact={compact} totalHabits={habitViews.length} />

      <View style={styles.groups}>
        {groups.map((group) => (
          <View key={group.title} style={styles.group}>
            <GroupHeader compact={compact} group={group} />
            {group.habits.map((habit) => (
              <HabitRow
                activeDayIndex={activeDayIndex}
                compact={compact}
                expanded={expandedHabit === habit.id}
                habit={habit}
                key={habit.id}
                onDayPress={(dayIndex) => handleDayPress(habit, dayIndex)}
                onDelete={() => setDeleteTarget(habit)}
                onEdit={() =>
                  router.push({
                    pathname: "/create-habit",
                    params: { habitId: String(habit.id) },
                  })
                }
                onPress={() => handleHabitPress(habit.id)}
              />
            ))}
          </View>
        ))}
      </View>

      {habitViews.length === 0 ? (
        <View style={styles.emptyState}>
          <AppText align="center" variant="bodySmall">
            No habits yet. Tap + to create the first one.
          </AppText>
        </View>
      ) : null}

      <AppModal
        onClose={() => setDeleteTarget(null)}
        visible={deleteTarget !== null}
      >
        <AppText align="center" variant="titleSm">
          Delete this habit?
        </AppText>
        <AppText align="center" style={styles.confirmBody} variant="bodySerif">
          “{deleteTarget?.title}” and its history will be removed.
        </AppText>
        <View style={styles.habitActionsRow}>
          <AppButton
            label="Cancel"
            onPress={() => setDeleteTarget(null)}
            style={styles.habitActionButton}
            variant="secondary"
          />
          <AppButton
            label="Delete"
            onPress={handleDeleteConfirmed}
            style={[styles.habitActionButton, styles.habitDeleteButton]}
            textStyle={styles.habitDeleteLabel}
            variant="secondary"
          />
        </View>
      </AppModal>
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  group: {
    borderTopColor: colors.borderSoft,
    borderTopWidth: 1,
  },
  groupHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 66,
    paddingHorizontal: 12,
  },
  groupHeaderCompact: {
    minHeight: 54,
    paddingHorizontal: 2,
  },
  groupTitle: {
    flexShrink: 1,
  },
  groupTitleCompact: {
    fontSize: fontSizes.xl,
    lineHeight: lineHeights.xl,
  },
  groupTitleRow: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: 13,
    minWidth: 0,
  },
  groupTitleRowCompact: {
    gap: spacing.sm,
  },
  groupCount: {
    marginLeft: 7,
  },
  groupCountCompact: {
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    marginLeft: 0,
  },
  groups: {
    marginTop: spacing.md,
  },
  confirmBody: {
    marginTop: spacing.sm,
  },
  emptyState: {
    paddingVertical: spacing.xl,
  },
  habitActionButton: {
    flex: 1,
    paddingHorizontal: spacing.sm,
  },
  habitActionsRow: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  habitDeleteButton: {
    borderColor: colors.danger,
  },
  habitDeleteLabel: {
    color: colors.danger,
  },
  todayBar: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.lg,
    paddingHorizontal: 12,
  },
  todayBarCompact: {
    gap: 10,
    marginTop: 18,
    paddingHorizontal: 2,
  },
  todayCountCompact: {
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
  },
  todayDate: {
    flex: 1,
  },
  todayDateCompact: {
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
  },
  todayDivider: {
    backgroundColor: colors.borderSoft,
    height: 22,
    width: 1,
  },
  todayLabel: {
    letterSpacing: 1.6,
    textTransform: "uppercase",
  },
  todayLabelCompact: {
    fontSize: fontSizes.sm,
    letterSpacing: 1.2,
    lineHeight: lineHeights.sm,
  },
  todayLabelRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 9,
  },
  todayLabelRowCompact: {
    gap: 6,
  },
  habitRow: {
    borderTopColor: colors.borderSoft,
    borderTopWidth: 1,
    paddingBottom: 23,
    paddingHorizontal: 18,
    paddingTop: spacing.md,
  },
  habitRowCompact: {
    paddingBottom: spacing.md,
    paddingHorizontal: 2,
    paddingTop: 14,
  },
  habitRowExpandedCompact: {
    paddingHorizontal: 10,
  },
  habitRowExpanded: {
    backgroundColor: colors.surfaceCard,
    borderColor: colors.border,
    borderRadius: radius.card,
    borderWidth: 1,
    marginBottom: spacing.md,
    marginTop: 6,
    paddingHorizontal: spacing.lg,
    ...shadows.goldGlow,
    shadowOpacity: 0.18,
    shadowRadius: 18,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 92,
  },
  headerCompact: {
    minHeight: 72,
  },
  ornamentLine: {
    backgroundColor: colors.primary,
    flex: 1,
    height: 1,
    maxWidth: 112,
    opacity: 0.6,
  },
  ornamentLineCompact: {
    maxWidth: 64,
  },
  ornamentRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    justifyContent: "center",
    marginTop: 5,
  },
  title: {
    textShadowColor: colors.primaryGlow,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  titleBlock: {
    flex: 1,
    paddingHorizontal: 18,
  },
  titleBlockCompact: {
    paddingHorizontal: spacing.sm,
  },
  titleCompact: {
    fontSize: fontSizes.cardTitle,
    lineHeight: lineHeights.cardTitle,
  },
});
