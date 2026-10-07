import { useFocusEffect, useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";
import { useCallback, useMemo, useState } from "react";

import {
  HabitBoardRow,
  toBoardHabit,
  type BoardHabit,
} from "@/components/HabitBoardCard";
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
import { habitStatus, useHabitWeek } from "@/hooks/useHabitWeek";
import {
  AppButton,
  AppModal,
  ConfirmDialog,
  AppText,
  CheckIcon,
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
  radius,
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

/**
 * Sections in the order they matter: what is still waiting today leads, the
 * other days follow, and what is already done rests at the bottom.
 */
const HABIT_SECTIONS = [
  { key: "today", title: "Today" },
  { key: "other", title: "Other days" },
  { key: "done", title: "Done today" },
] as const;

/** Each dream keeps one accent, so a row still reads as its dream's. */
const DREAM_TINT_CYCLE = [colors.accentVioletStrong, colors.primary] as const;

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

function HabitRow({
  activeDayIndex,
  checkedSections,
  compact,
  expanded,
  habit,
  onDayPress,
  onDelete,
  onDetailToggle,
  onEdit,
  onFinish,
  onPress,
  phone,
}: {
  activeDayIndex: number;
  checkedSections: readonly HabitDetailSection[];
  compact: boolean;
  expanded: boolean;
  habit: Habit;
  onDayPress: (dayIndex: number) => void;
  onDelete: () => void;
  onDetailToggle: (section: HabitDetailSection) => void;
  onEdit: () => void;
  onFinish: () => void;
  onPress: () => void;
  phone: boolean;
}) {
  return (
    <HabitBoardRow
      activeDayIndex={activeDayIndex}
      checkedSections={checkedSections}
      compact={compact}
      expanded={expanded}
      habit={habit}
      onDayPress={onDayPress}
      onDetailToggle={onDetailToggle}
      onPress={onPress}
      phone={phone}
      footer={
        <View style={[styles.habitActions, phone && styles.habitActionsPhone]}>
          <AppButton
            density="compact"
            icon={<CheckIcon color={colors.textOnPrimary} size={18} />}
            iconPosition="before"
            label="Finish"
            onPress={onFinish}
            style={styles.habitAction}
          />
          <AppButton
            density="compact"
            icon={<PencilIcon size={18} strokeWidth={1.7} variant="detailed" />}
            iconPosition="before"
            label="Edit"
            onPress={onEdit}
            style={styles.habitAction}
            variant="secondary"
          />
          <AppButton
            density="compact"
            icon={<TrashIcon color={colors.danger} size={18} />}
            iconPosition="before"
            label="Delete"
            onPress={onDelete}
            style={styles.habitAction}
            textStyle={styles.deleteActionLabel}
            variant="ghost"
          />
        </View>
      }
    />
  );
}

function SectionTitle({
  compact,
  count,
  phone,
  title,
}: {
  compact: boolean;
  count: number;
  phone: boolean;
  title: string;
}) {
  return (
    <View style={[styles.groupHeader, compact && styles.groupHeaderCompact]}>
      <View style={[styles.groupTitleRow, compact && styles.groupTitleRowCompact]}>
        <AppText
          numberOfLines={1}
          style={[styles.groupTitle, compact && styles.groupTitleCompact]}
          variant="button"
        >
          {title}
        </AppText>
        {/* The rows it counts are directly below. */}
        {phone ? null : (
          <AppText
            color={colors.textMuted}
            style={[styles.groupCount, compact && styles.groupCountCompact]}
            variant="subtitle"
          >
            {`${count} ${count === 1 ? "habit" : "habits"}`}
          </AppText>
        )}
      </View>
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

  const sections = useMemo(() => {
    const tints = new Map(
      dreams.map((dream, index) => [
        dream.id,
        DREAM_TINT_CYCLE[index % DREAM_TINT_CYCLE.length],
      ]),
    );
    const titles = new Map(dreams.map((dream) => [dream.id, dream.title]));

    const rows = habitViews.map((view, index) => ({
      habit: {
        ...toBoardHabit(view, index, tints.get(view.habit.dreamId) ?? colors.primary),
        dreamTitle: titles.get(view.habit.dreamId),
      },
      status: habitStatus(view, activeDayIndex),
      timeOrder: view.timeOrder,
    }));

    return HABIT_SECTIONS.map((section) => ({
      ...section,
      // Within a section: through the day, then alphabetically.
      rows: rows
        .filter((row) => row.status === section.key)
        .sort(
          (left, right) =>
            left.timeOrder - right.timeOrder ||
            left.habit.title.localeCompare(right.habit.title),
        ),
    })).filter((section) => section.rows.length > 0);
  }, [activeDayIndex, dreams, habitViews]);
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
    router.push({
      pathname: "/create-habit",
      params: { habitId: String(habitId) },
    });
  }

  // Completing removes the habit from the boards; it waits in the
  // Completed Habits modal, restorable at any time.
  async function handleCompleteHabit(habitId: number) {
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
        {sections.map((section) => (
          <View key={section.key} style={styles.group}>
            <SectionTitle
              compact={compact}
              count={section.rows.length}
              phone={phone}
              title={section.title}
            />
            {section.rows.map(({ habit }) => (
              <HabitRow
                activeDayIndex={activeDayIndex}
                checkedSections={checksByHabit.get(habit.id) ?? []}
                compact={compact}
                phone={phone}
                expanded={expandedHabit === habit.id}
                habit={habit}
                key={habit.id}
                onDayPress={(dayIndex) => handleDayPress(habit, dayIndex)}
                onDelete={() =>
                  setDeleteTarget({ id: habit.id, title: habit.title })
                }
                onDetailToggle={(section) => handleDetailToggle(habit, section)}
                onEdit={() => handleEdit(habit.id)}
                onFinish={() => handleCompleteHabit(habit.id)}
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
  deleteActionLabel: {
    color: colors.danger,
  },
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
  habitAction: {
    flex: 1,
  },
  habitActions: {
    alignItems: "center",
    borderTopColor: colors.borderSoft,
    borderTopWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: 12,
    paddingTop: spacing.md,
  },
  habitActionsPhone: {
    alignItems: "stretch",
    flexDirection: "column",
    paddingHorizontal: 2,
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
