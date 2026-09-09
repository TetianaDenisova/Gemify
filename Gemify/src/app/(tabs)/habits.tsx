import { useFocusEffect, useRouter } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { useCallback, useMemo, useState } from "react";
import Svg, { Path } from "react-native-svg";

import {
  HabitBoardRow,
  toBoardHabit,
  type BoardHabit,
} from "@/components/HabitBoardCard";
import { ActionSheet, SheetActionRow } from "@/components/QuestActions";
import {
  deleteHabit,
  getCompletedHabits,
  getDreams,
  getHabitDoneCount,
  setHabitDetailCheck,
  updateHabit,
  type Dream,
  type Habit as DbHabit,
  type HabitDetailSection,
} from "@/db";
import { useHabitWeek, type HabitWeekView } from "@/hooks/useHabitWeek";
import {
  AppButton,
  AppModal,
  ConfirmDialog,
  AppText,
  CheckIcon,
  ChevronIcon,
  DotsIcon,
  DreamIcon,
  HistoryIcon,
  IconButton,
  PencilIcon,
  PlusIcon,
  RepeatIcon,
  ScreenScaffold,
  SparkIcon,
  TrashIcon,
} from "@/shared/components";
import { useLayoutSize } from "@/hooks/useLayoutSize";
import { colors } from "@/theme/colors";
import {
  fontSizes,
  lineHeights,
  pressed as pressedStyle,
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

function HeaderOrnament({
  compact,
  phone,
}: {
  compact: boolean;
  phone: boolean;
}) {
  return (
    <View style={styles.ornamentRow}>
      {/* Decoration on the widest row of the screen — the spark stays, the
          rules either side of it go. */}
      {phone ? null : (
        <View style={[styles.ornamentLine, compact && styles.ornamentLineCompact]} />
      )}
      <SparkIcon size={phone ? 18 : compact ? 24 : 32} />
      {phone ? null : (
        <View style={[styles.ornamentLine, compact && styles.ornamentLineCompact]} />
      )}
    </View>
  );
}

function TodayBar({
  compact,
  phone,
  totalHabits,
}: {
  compact: boolean;
  phone: boolean;
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
      {/* Every habit row highlights today in its own week strip, so the
          spelled-out date is the first thing to go on a phone. */}
      {phone ? null : (
        <>
          <View style={styles.todayDivider} />
          <AppText
            numberOfLines={1}
            style={[styles.todayDate, compact && styles.todayDateCompact]}
            variant="subtitle"
          >
            {dateLabel}
          </AppText>
        </>
      )}
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
  onOpenMenu,
  onPress,
  phone,
}: {
  activeDayIndex: number;
  checkedSections: readonly HabitDetailSection[];
  compact: boolean;
  expanded: boolean;
  habit: Habit;
  onDayPress: (dayIndex: number) => void;
  onDetailToggle: (section: HabitDetailSection) => void;
  onOpenMenu: () => void;
  onPress: () => void;
  phone: boolean;
}) {
  return (
    <HabitBoardRow
      activeDayIndex={activeDayIndex}
      checkedSections={checkedSections}
      compact={compact}
      containerStyle={[
        styles.habitRow,
        compact && styles.habitRowCompact,
        phone && styles.habitRowPhone,
        expanded && styles.habitRowExpanded,
        expanded && compact && styles.habitRowExpandedCompact,
      ]}
      expanded={expanded}
      habit={habit}
      onDayPress={onDayPress}
      onDetailToggle={onDetailToggle}
      onPress={onPress}
      phone={phone}
      trailing={
        <Pressable
          accessibilityLabel={`Options for the habit ${habit.title}`}
          accessibilityRole="button"
          hitSlop={8}
          onPress={onOpenMenu}
          style={({ pressed: isPressed }) => [
            styles.menuButton,
            isPressed && pressedStyle,
          ]}
        >
          <DotsIcon color={colors.textSecondary} size={20} />
        </Pressable>
      }
    />
  );
}

function GroupHeader({
  compact,
  group,
  phone,
}: {
  compact: boolean;
  group: HabitGroup;
  phone: boolean;
}) {
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
        {/* The rows it counts are directly below. */}
        {phone ? null : (
          <AppText
            color={colors.textMuted}
            style={[styles.groupCount, compact && styles.groupCountCompact]}
            variant="subtitle"
          >
            {group.count}
          </AppText>
        )}
      </View>
      {group.habits.length === 0 ? <ChevronIcon /> : null}
    </View>
  );
}

export default function HabitsScreen() {
  const router = useRouter();
  const { compact, phone } = useLayoutSize();
  const [expandedHabit, setExpandedHabit] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: number;
    title: string;
  } | null>(null);
  const [completedOpen, setCompletedOpen] = useState(false);
  const [completedHabits, setCompletedHabits] = useState<
    { habit: DbHabit; doneCount: number }[]
  >([]);
  const [menuHabit, setMenuHabit] = useState<Habit | null>(null);
  const [dreams, setDreams] = useState<Dream[]>([]);
  const { habits: habitViews, refresh, setCompletion, weekDates } =
    useHabitWeek();

  const refreshCompleted = useCallback(() => {
    getCompletedHabits()
      .then((list) =>
        Promise.all(
          list.map(async (habit) => ({
            habit,
            doneCount: await getHabitDoneCount(habit.id),
          })),
        ),
      )
      .then(setCompletedHabits)
      .catch((cause: unknown) =>
        console.error("Failed to load finished habits", cause),
      );
  }, []);

  useFocusEffect(
    useCallback(() => {
      getDreams()
        .then(setDreams)
        .catch((cause: unknown) =>
          console.error("Failed to load dreams", cause),
        );
      refreshCompleted();
    }, [refreshCompleted]),
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
    setMenuHabit(null);
    router.push({
      pathname: "/create-habit",
      params: { habitId: String(habitId) },
    });
  }

  // Completing removes the habit from the boards; it waits in the
  // Completed Habits modal, restorable at any time.
  async function handleCompleteHabit(habitId: number) {
    setMenuHabit(null);
    try {
      await updateHabit(habitId, { isCompleted: true });
      await refresh();
      refreshCompleted();
    } catch (cause) {
      console.error("Failed to complete the habit", cause);
    }
  }

  async function handleRestoreHabit(habitId: number) {
    try {
      await updateHabit(habitId, { isCompleted: false });
      await refresh();
      refreshCompleted();
    } catch (cause) {
      console.error("Failed to restore the habit", cause);
    }
  }

  async function handleDeleteConfirmed() {
    if (!deleteTarget) return;
    try {
      await deleteHabit(deleteTarget.id);
      await refresh();
      refreshCompleted();
    } catch (cause) {
      console.error("Failed to delete the habit", cause);
    }
    setDeleteTarget(null);
  }

  return (
    <ScreenScaffold backgroundGradient={HABITS_BACKGROUND} tabClearance topInset>
      <View style={[styles.header, compact && styles.headerCompact]}>
        <IconButton
          accessibilityLabel="Finished habits"
          icon={<HistoryIcon size={compact ? 22 : 25} />}
          onPress={() => setCompletedOpen(true)}
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
          <HeaderOrnament compact={compact} phone={phone} />
        </View>
        <IconButton
          accessibilityLabel="Add habit"
          icon={<PlusIcon size={compact ? 26 : 30} />}
          onPress={() => router.push("/create-habit")}
          size={compact ? "sm" : "md"}
        />
      </View>

      <TodayBar
        compact={compact}
        phone={phone}
        totalHabits={habitViews.length}
      />

      <View style={styles.groups}>
        {groups.map((group) => (
          <View key={group.title} style={styles.group}>
            <GroupHeader compact={compact} group={group} phone={phone} />
            {group.habits.map((habit) => (
              <HabitRow
                activeDayIndex={activeDayIndex}
                checkedSections={checksByHabit.get(habit.id) ?? []}
                compact={compact}
                phone={phone}
                expanded={expandedHabit === habit.id}
                habit={habit}
                key={habit.id}
                onDayPress={(dayIndex) => handleDayPress(habit, dayIndex)}
                onDetailToggle={(section) => handleDetailToggle(habit, section)}
                onOpenMenu={() => setMenuHabit(habit)}
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

      {/* Per-habit ⋯ menu: Complete, Edit, Delete. */}
      <ActionSheet
        onClose={() => setMenuHabit(null)}
        title={menuHabit?.title}
        visible={menuHabit !== null}
      >
        <SheetActionRow
          icon={<CheckIcon color={colors.primary} size={22} />}
          label="Finish habit"
          onPress={() => {
            if (menuHabit) handleCompleteHabit(menuHabit.id);
          }}
        />
        <SheetActionRow
          icon={<PencilIcon size={22} strokeWidth={1.7} variant="detailed" />}
          label="Edit"
          onPress={() => {
            if (menuHabit) handleEdit(menuHabit.id);
          }}
        />
        <SheetActionRow
          danger
          icon={<TrashIcon size={22} />}
          label="Delete"
          onPress={() => {
            if (menuHabit) {
              setDeleteTarget({ id: menuHabit.id, title: menuHabit.title });
            }
            setMenuHabit(null);
          }}
        />
      </ActionSheet>

      <AppModal
        onClose={() => setCompletedOpen(false)}
        variant="sheet"
        visible={completedOpen}
      >
        <AppText align="center" color={colors.primary} variant="titleSm">
          Finished Habits
        </AppText>
        {/* The restore button is on every row below. */}
        {phone ? null : (
          <AppText align="center" style={styles.manageSubtitle} variant="bodySmall">
            Finished habits rest here — restore one to keep going
          </AppText>
        )}
        <View style={styles.manageList}>
          {completedHabits.map(({ doneCount, habit }) => (
            <View key={habit.id} style={styles.manageRow}>
              <View style={styles.manageCopy}>
                <AppText numberOfLines={1} variant="button">
                  {habit.title}
                </AppText>
                <View style={styles.manageMetaRow}>
                  <DreamIcon size={14} />
                  <AppText
                    color={colors.textMuted}
                    numberOfLines={1}
                    style={styles.manageMetaDream}
                    variant="bodySmall"
                  >
                    {dreams.find((dream) => dream.id === habit.dreamId)
                      ?.title ?? "—"}
                  </AppText>
                  <AppText color={colors.textMuted} variant="bodySmall">
                    · {doneCount} {doneCount === 1 ? "day" : "days"}
                  </AppText>
                </View>
              </View>
              <IconButton
                accessibilityLabel={`Restore ${habit.title}`}
                icon={<RepeatIcon size={18} />}
                onPress={() => handleRestoreHabit(habit.id)}
                size="sm"
              />
              <IconButton
                accessibilityLabel={`Delete ${habit.title}`}
                icon={<TrashIcon size={18} />}
                onPress={() => {
                  setCompletedOpen(false);
                  setDeleteTarget({ id: habit.id, title: habit.title });
                }}
                size="sm"
              />
            </View>
          ))}
          {completedHabits.length === 0 ? (
            <AppText align="center" color={colors.textMuted} variant="bodySmall">
              No finished habits yet.
            </AppText>
          ) : null}
        </View>
        <AppButton
          label="Close"
          onPress={() => setCompletedOpen(false)}
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
  /** Dream breadcrumb + day counter under a finished habit's name. */
  manageMetaRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.xs + 2,
    marginTop: 2,
  },
  manageMetaDream: {
    flexShrink: 1,
  },
  /** Tap target for the row's ⋯ menu. */
  menuButton: {
    padding: spacing.xs,
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
  /** The 52 pt medallion and 24 pt day dots leave the row shorter. */
  habitRowPhone: {
    paddingBottom: spacing.sm,
    paddingTop: spacing.sm,
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
