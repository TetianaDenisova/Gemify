import { useFocusEffect, useRouter } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { useCallback, useMemo, useState } from "react";

import { toBoardHabit, type BoardHabit } from "@/components/HabitBoardCard";
import { IllustratedHabitCard } from "@/components/IllustratedHabitCard";
import { mainDreamBackgrounds } from "@/data/images";
import {
  deleteHabit, getCompletedHabits, getDreams, getHabitDoneCount,
  setHabitDetailCheck, updateHabit,
  type Dream, type Habit as DbHabit, type HabitDetailSection,
} from "@/db";
import { useHabitWeek } from "@/hooks/useHabitWeek";
import { PremiumRequiredError } from "@/subscription/entitlements";
import { useLayoutSize } from "@/hooks/useLayoutSize";
import {
  AppButton, AppModal, ActionMenuSheet, ConfirmDialog, AppText, CheckIcon, DreamIcon,
  HistoryIcon, IconButton, PencilIcon, PlusIcon, RepeatIcon,
  ScreenScaffold, SparkIcon, TrashIcon,
} from "@/shared/components";
import { colors } from "@/theme/colors";
import { radius, spacing, textGlow } from "@/theme/theme";

const HABITS_BACKGROUND = ["#020A12", "#030B15", "#020912"] as const;

function habitBackground(habitId: number) {
  // Mix the stable ID so edits, filtering, and completion never reshuffle photos.
  const hash = Math.imul(habitId, 0x9e3779b1) >>> 0;
  return mainDreamBackgrounds[hash % mainDreamBackgrounds.length];
}

export default function HabitsScreen() {
  const router = useRouter();
  const { compact } = useLayoutSize();
  const [tab, setTab] = useState<"today" | "all">("today");
  const [expandedHabit, setExpandedHabit] = useState<number | null>(null);
  const [menuHabit, setMenuHabit] = useState<BoardHabit | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; title: string } | null>(null);
  const [completedOpen, setCompletedOpen] = useState(false);
  const [completedHabits, setCompletedHabits] = useState<{ habit: DbHabit; doneCount: number }[]>([]);
  const [dreams, setDreams] = useState<Dream[]>([]);
  const { habits: habitViews, loading, error, refresh, setCompletion, weekDates } = useHabitWeek();
  const activeDayIndex = (new Date().getDay() + 6) % 7;

  const refreshCompleted = useCallback(() => {
    getCompletedHabits()
      .then((list) => Promise.all(list.map(async (habit) => ({
        habit, doneCount: await getHabitDoneCount(habit.id),
      }))))
      .then(setCompletedHabits)
      .catch((cause: unknown) => console.error("Failed to load finished habits", cause));
  }, []);

  useFocusEffect(useCallback(() => {
    getDreams().then(setDreams)
      .catch((cause: unknown) => console.error("Failed to load dreams", cause));
    refreshCompleted();
  }, [refreshCompleted]));

  const rows = useMemo(() => {
    const dreamsById = new Map(dreams.map((dream) => [dream.id, dream]));
    return habitViews
      .filter((view) => tab === "all" || view.scheduleDays.includes(activeDayIndex))
      .sort((left, right) =>
        Number(left.weekProgress[activeDayIndex] === "done") - Number(right.weekProgress[activeDayIndex] === "done") ||
        left.timeOrder - right.timeOrder || left.habit.title.localeCompare(right.habit.title))
      .map((view, index) => {
        const dream = dreamsById.get(view.habit.dreamId);
        return {
          habit: {
            ...toBoardHabit(view, index, colors.primary),
            time: view.habit.cue?.trim() || view.timeLabel,
            dreamTitle: dream?.title,
          },
          imageSource: habitBackground(view.habit.id),
          checkedSections: view.todayDetailChecks,
        };
      });
  }, [activeDayIndex, dreams, habitViews, tab]);

  const checksByHabit = useMemo(
    () => new Map(habitViews.map((view) => [view.habit.id, view.todayDetailChecks])),
    [habitViews],
  );

  async function handleDetailToggle(habit: BoardHabit, section: HabitDetailSection) {
    const date = weekDates[activeDayIndex];
    const checks = checksByHabit.get(habit.id) ?? [];
    const nowChecked = !checks.includes(section);
    const anyChecked = nowChecked || checks.some((entry) => entry !== section);
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
    router.push({ pathname: "/create-habit", params: { habitId: String(habitId) } });
  }

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
      if (cause instanceof PremiumRequiredError) {
        setCompletedOpen(false);
        router.push("/account-subscription");
      }
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
        <IconButton accessibilityLabel="Finished habits" icon={<HistoryIcon size={compact ? 22 : 25} />}
          onPress={() => setCompletedOpen(true)} size={compact ? "sm" : "md"} />
        <View style={styles.titleBlock}>
          <AppText align="center" color={colors.primary} numberOfLines={1}
            adjustsFontSizeToFit style={[styles.title, compact && styles.titleCompact]} variant="screenTitle">
            My Habits
          </AppText>
          <View pointerEvents="none" style={styles.ornament}>
            <View style={styles.ornamentLine} />
            <SparkIcon size={compact ? 20 : 26} />
            <View style={styles.ornamentLine} />
          </View>
        </View>
        <IconButton accessibilityLabel="Add habit" icon={<PlusIcon size={compact ? 26 : 30} />}
          onPress={() => router.push("/create-habit")} size={compact ? "sm" : "md"} />
      </View>

      <View accessibilityRole="tablist" style={styles.tabs}>
        {(["today", "all"] as const).map((value) => (
          <Pressable accessibilityRole="tab" accessibilityState={{ selected: tab === value }}
            key={value} onPress={() => setTab(value)}
            style={({ pressed }) => [styles.tab, tab === value && styles.selectedTab, pressed && styles.pressed]}>
            {tab === value ? <SparkIcon size={19} /> : null}
            <AppText color={tab === value ? colors.primary : "#8F8B9F"} style={styles.tabLabel} variant="controlLabel">
              {value.toUpperCase()}
            </AppText>
          </Pressable>
        ))}
      </View>

      <View style={styles.list}>
        {rows.map(({ habit, imageSource, checkedSections }) => (
          <IllustratedHabitCard activeDayIndex={activeDayIndex} checkedSections={checkedSections}
            compact={compact} expanded={expandedHabit === habit.id}
            habit={habit} imageSource={imageSource} key={habit.id}
            onDateToggle={(date, status) => setCompletion(habit.id, date, status === "done" ? null : "done")}
            onDetailToggle={(section) => void handleDetailToggle(habit, section)}
            onOpenMenu={() => setMenuHabit(habit)}
            onPress={() => setExpandedHabit((current) => current === habit.id ? null : habit.id)}
            onToggleDone={() => void setCompletion(habit.id, weekDates[activeDayIndex], habit.progress[activeDayIndex] === "done" ? null : "done")}
          />
        ))}
        {rows.length === 0 ? (
          <AppText align="center" color={error ? colors.danger : colors.textMuted} style={styles.emptyState} variant="bodySmall">
            {error ? "Could not load habits." : loading ? "Loading habits..." : habitViews.length === 0 ? "No habits yet." : "No habits scheduled for today."}
          </AppText>
        ) : null}
      </View>

      <ActionMenuSheet
        eyebrow="Habit options"
        onClose={() => setMenuHabit(null)}
        title={menuHabit?.title}
        visible={menuHabit !== null}
        options={[
          { id: "edit", icon: PencilIcon, label: "Edit", onPress: () => { if (menuHabit) handleEdit(menuHabit.id); setMenuHabit(null); } },
          { id: "finish", icon: CheckIcon, label: "Finish habit", kind: "completion", onPress: () => { if (menuHabit) void handleCompleteHabit(menuHabit.id); setMenuHabit(null); } },
          { id: "delete", icon: TrashIcon, label: "Delete", kind: "destructive", onPress: () => { if (menuHabit) setDeleteTarget({ id: menuHabit.id, title: menuHabit.title }); setMenuHabit(null); } },
        ]}
      />

      <AppModal onClose={() => setCompletedOpen(false)} variant="sheet" visible={completedOpen}>
        <AppText align="center" color={colors.primary} variant="titleSm">Finished Habits</AppText>
        <View style={styles.manageList}>
          {completedHabits.map(({ doneCount, habit }) => (
            <View key={habit.id} style={styles.manageRow}>
              <View style={styles.manageCopy}>
                <AppText numberOfLines={1} variant="button">{habit.title}</AppText>
                <View style={styles.manageMetaRow}>
                  <DreamIcon size={14} />
                  <AppText color={colors.textMuted} numberOfLines={1} style={styles.manageMetaDream} variant="bodySmall">
                    {dreams.find((dream) => dream.id === habit.dreamId)?.title ?? ""}
                  </AppText>
                  <AppText color={colors.textMuted} variant="bodySmall">{doneCount} {doneCount === 1 ? "day" : "days"}</AppText>
                </View>
              </View>
              <IconButton accessibilityLabel={`Restore ${habit.title}`} icon={<RepeatIcon size={18} />}
                onPress={() => void handleRestoreHabit(habit.id)} size="sm" />
              <IconButton accessibilityLabel={`Delete ${habit.title}`} icon={<TrashIcon size={18} />}
                onPress={() => { setCompletedOpen(false); setDeleteTarget({ id: habit.id, title: habit.title }); }} size="sm" />
            </View>
          ))}
          {completedHabits.length === 0 ? <AppText align="center" color={colors.textMuted} variant="bodySmall">No finished habits yet.</AppText> : null}
        </View>
        <AppButton label="Close" onPress={() => setCompletedOpen(false)} style={styles.manageClose} variant="secondary" />
      </AppModal>

      <ConfirmDialog body={`"${deleteTarget?.title}" and its history will be removed.`}
        onCancel={() => setDeleteTarget(null)} onConfirm={handleDeleteConfirmed}
        title="Delete this habit?" visible={deleteTarget !== null} />
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", minHeight: 102 },
  headerCompact: { minHeight: 88 },
  titleBlock: { flex: 1, paddingHorizontal: spacing.sm },
  title: { fontSize: 40, lineHeight: 48, fontWeight: "400", letterSpacing: 0, ...textGlow("rgba(245, 184, 75, 0.18)", 8) },
  titleCompact: { fontSize: 32, lineHeight: 40 },
  ornament: { alignItems: "center", flexDirection: "row", gap: 8, justifyContent: "center", marginTop: 4 },
  ornamentLine: { backgroundColor: colors.primaryDark, flex: 1, height: 1, maxWidth: 78 },
  tabs: { flexDirection: "row", borderBottomColor: "#172130", borderBottomWidth: 1, marginTop: 8 },
  tab: { flex: 1, flexDirection: "row", gap: 10, alignItems: "center", justifyContent: "center", minHeight: 48, borderBottomWidth: 2, borderBottomColor: "transparent" },
  selectedTab: { borderBottomColor: colors.primary },
  tabLabel: { fontSize: 14, lineHeight: 20, fontWeight: "500", letterSpacing: 0 },
  pressed: { opacity: 0.72 },
  list: { gap: 10, paddingTop: 10 },
  emptyState: { paddingVertical: spacing.xl },
  manageClose: { marginTop: spacing.lg },
  manageCopy: { flex: 1, minWidth: 0 },
  manageList: { gap: spacing.md, marginTop: spacing.lg },
  manageRow: { alignItems: "center", backgroundColor: colors.surfaceCard, borderColor: colors.borderSoft, borderRadius: radius.card, borderWidth: 1, flexDirection: "row", gap: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  manageMetaRow: { alignItems: "center", flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 2 },
  manageMetaDream: { flexShrink: 1 },
});
