import { useFocusEffect, useRouter } from "expo-router";
import { StyleSheet, View, useWindowDimensions } from "react-native";
import { useCallback, useMemo, useState } from "react";
import Svg, { Path } from "react-native-svg";

import {
  HabitBoardRow,
  toBoardHabit,
  type BoardHabit,
} from "@/components/HabitBoardCard";
import {
  deleteHabit,
  getDreams,
  setHabitDetailCheck,
  type Dream,
  type HabitDetailSection,
} from "@/db";
import { useHabitWeek, type HabitWeekView } from "@/hooks/useHabitWeek";
import {
  AppButton,
  AppModal,
  ConfirmDialog,
  AppText,
  ChevronIcon,
  GearIcon,
  IconButton,
  PencilIcon,
  PlusIcon,
  ScreenScaffold,
  SparkIcon,
  TrashIcon,
} from "@/shared/components";
import { colors } from "@/theme/colors";
import {
  fontSizes,
  layout,
  lineHeights,
  radius,
  shadowStyle,
  spacing,
  textGlow,
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

function HeaderOrnament({ compact }: { compact: boolean }) {
  return (
    <View style={styles.ornamentRow}>
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
  checkedSections,
  compact,
  expanded,
  habit,
  onDayPress,
  onDetailToggle,
  onPress,
}: {
  activeDayIndex: number;
  checkedSections: readonly HabitDetailSection[];
  compact: boolean;
  expanded: boolean;
  habit: Habit;
  onDayPress: (dayIndex: number) => void;
  onDetailToggle: (section: HabitDetailSection) => void;
  onPress: () => void;
}) {
  return (
    <HabitBoardRow
      activeDayIndex={activeDayIndex}
      checkedSections={checkedSections}
      compact={compact}
      containerStyle={[
        styles.habitRow,
        compact && styles.habitRowCompact,
        expanded && styles.habitRowExpanded,
        expanded && compact && styles.habitRowExpandedCompact,
      ]}
      expanded={expanded}
      habit={habit}
      onDayPress={onDayPress}
      onDetailToggle={onDetailToggle}
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
  const [deleteTarget, setDeleteTarget] = useState<{
    id: number;
    title: string;
  } | null>(null);
  const [manageOpen, setManageOpen] = useState(false);
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

  const groups: (HabitGroup & { views: HabitWeekView[] })[] = useMemo(
    () =>
      dreams
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
        .filter((group) => group.habits.length > 0),
    [dreams, habitViews],
  );

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

  // Sections ticked today, per habit — each section keeps its own check.
  const checksByHabit = useMemo(
    () => new Map(habitViews.map((view) => [view.habit.id, view.todayDetailChecks])),
    [habitViews],
  );

  // Ticking "Make It Easy" or the bad-day version counts today as a small
  // step: the day circle half-fills ("partial") while at least one section is
  // ticked and clears back to open when the last one is unticked.
  async function handleDetailToggle(habit: Habit, section: HabitDetailSection) {
    const date = weekDates[activeDayIndex];
    const checks = checksByHabit.get(habit.id) ?? [];
    const nowChecked = !checks.includes(section);
    const anyChecked =
      nowChecked || checks.some((entry) => entry !== section);
    const current = habit.progress[activeDayIndex];

    try {
      await setHabitDetailCheck(habit.id, section, date, nowChecked);
      if (anyChecked && current !== "done") {
        await setCompletion(habit.id, date, "partial");
      } else if (!anyChecked && current === "partial") {
        await setCompletion(habit.id, date, null);
      } else {
        await refresh();
      }
    } catch (cause) {
      console.error("Failed to save the habit detail check", cause);
    }
  }

  function handleEdit(habitId: number) {
    setManageOpen(false);
    router.push({
      pathname: "/create-habit",
      params: { habitId: String(habitId) },
    });
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
          accessibilityLabel="Manage habits"
          icon={<GearIcon size={compact ? 22 : 25} />}
          onPress={() => setManageOpen(true)}
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
                checkedSections={checksByHabit.get(habit.id) ?? []}
                compact={compact}
                expanded={expandedHabit === habit.id}
                habit={habit}
                key={habit.id}
                onDayPress={(dayIndex) => handleDayPress(habit, dayIndex)}
                onDetailToggle={(section) => handleDetailToggle(habit, section)}
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
        onClose={() => setManageOpen(false)}
        variant="sheet"
        visible={manageOpen}
      >
        <AppText align="center" color={colors.primary} variant="titleSm">
          Manage Habits
        </AppText>
        <AppText align="center" style={styles.manageSubtitle} variant="bodySmall">
          All your habits in one place
        </AppText>
        <View style={styles.manageList}>
          {habitViews.map((view) => (
            <View key={view.habit.id} style={styles.manageRow}>
              <View style={styles.manageCopy}>
                <AppText numberOfLines={1} variant="button">
                  {view.habit.title}
                </AppText>
                <AppText color={colors.textMuted} variant="bodySmall">
                  Day {view.doneCount} / {view.habit.goalDays}
                </AppText>
              </View>
              <IconButton
                accessibilityLabel={`Edit ${view.habit.title}`}
                icon={
                  <PencilIcon size={18} strokeWidth={1.7} variant="detailed" />
                }
                onPress={() => handleEdit(view.habit.id)}
                size="sm"
              />
              <IconButton
                accessibilityLabel={`Delete ${view.habit.title}`}
                icon={<TrashIcon size={18} />}
                onPress={() => {
                  setManageOpen(false);
                  setDeleteTarget({
                    id: view.habit.id,
                    title: view.habit.title,
                  });
                }}
                size="sm"
              />
            </View>
          ))}
          {habitViews.length === 0 ? (
            <AppText align="center" color={colors.textMuted} variant="bodySmall">
              No habits yet. Tap + to create the first one.
            </AppText>
          ) : null}
        </View>
        <AppButton
          label="Close"
          onPress={() => setManageOpen(false)}
          style={styles.manageClose}
          variant="secondary"
        />
      </AppModal>

      <ConfirmDialog
        body={`“${deleteTarget?.title}” and its history will be removed.`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirmed}
        title="Delete this habit?"
        visible={deleteTarget !== null}
      />
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
  emptyState: {
    paddingVertical: spacing.xl,
  },
  manageClose: {
    marginTop: spacing.lg,
  },
  manageCopy: {
    flex: 1,
    minWidth: 0,
  },
  manageList: {
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  manageRow: {
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
  manageSubtitle: {
    marginTop: spacing.xs,
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
    ...shadowStyle({ color: colors.primary, elevation: 8, opacity: 0.18, radius: 18 }),
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
    pointerEvents: "none",
  },
  title: {
    ...textGlow(colors.primaryGlow, 12),
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
