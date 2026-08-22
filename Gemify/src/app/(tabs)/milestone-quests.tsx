import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import Svg, { Circle, Path, Rect } from "react-native-svg";

import {
  HabitBoardRow,
  toBoardHabit,
  type BoardHabit,
} from "@/components/HabitBoardCard";
import {
  createQuest,
  createTask,
  deleteHabit,
  getDreams,
  getMilestoneById,
  getMilestones,
  getQuests,
  getTasksByQuest,
  setTaskDone,
  type Milestone,
  type Quest,
  type Task,
} from "@/db";
import { useHabitWeek } from "@/hooks/useHabitWeek";
import {
  AppButton,
  AppInput,
  AppModal,
  AppText,
  BackIcon,
  BulbIcon,
  Card,
  Checkbox,
  PlusIcon,
  ScreenHeader,
  ScreenScaffold,
} from "@/shared/components";
import { colors } from "@/theme/colors";
import {
  controls,
  fontSizes,
  iconSizes,
  layout,
  lineHeights,
  pressed,
  radius,
  shadows,
  spacing,
} from "@/theme/theme";

const TREE_MILESTONE_HEADER_SOURCE = require("../../data/images/tree-milestone-header.png");

const HABIT_ACCENT_CYCLE = [colors.primary, "#7F91FF", "#D986FF", "#4FC3F7"];

type QuestWithTasks = {
  quest: Quest;
  tasks: Task[];
};

type PromptState =
  | { kind: "quest" }
  | { kind: "task"; questId: number }
  | null;

type ContentTab = "quests" | "habits";

function CalendarPlusIcon({ color = colors.primary }: { color?: string }) {
  return (
    <Svg height={iconSizes.lg} viewBox="0 0 24 24" width={iconSizes.lg}>
      <Rect
        fill="none"
        height={14}
        rx={2}
        stroke={color}
        strokeWidth={1.7}
        width={17}
        x={3.5}
        y={6}
      />
      <Path
        d="M7 3.5v5M17 3.5v5M3.5 10.5h17M16.2 14.2v5M13.7 16.7h5"
        fill="none"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.7}
      />
    </Svg>
  );
}

function ChevronDownIcon({ color = colors.primary }: { color?: string }) {
  return (
    <Svg height={iconSizes.md} viewBox="0 0 24 24" width={iconSizes.md}>
      <Path
        d="m6 9 6 6 6-6"
        fill="none"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2.4}
      />
    </Svg>
  );
}

function DotsIcon({ color = colors.textSecondary }: { color?: string }) {
  return (
    <Svg height={iconSizes.md} viewBox="0 0 24 24" width={iconSizes.md}>
      {[6, 12, 18].map((cy) => (
        <Circle cx={12} cy={cy} fill={color} key={cy} r={1.7} />
      ))}
    </Svg>
  );
}

function ClockIcon() {
  return (
    <Svg height={18} viewBox="0 0 24 24" width={18}>
      <Circle
        cx={12}
        cy={12}
        fill="none"
        r={8}
        stroke={colors.textSecondary}
        strokeWidth={1.6}
      />
      <Path
        d="M12 8v5l3 2"
        fill="none"
        stroke={colors.textSecondary}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.6}
      />
    </Svg>
  );
}

function MilestoneProgressBar({ value }: { value: number }) {
  const clamped = Math.max(0, Math.min(100, value));

  return (
    <View style={styles.progressRow}>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${clamped}%` }]} />
      </View>
      <AppText color={colors.primary} style={styles.progressValue} variant="pill">
        {clamped}%
      </AppText>
    </View>
  );
}

function TaskRow({
  onToggle,
  task,
}: {
  onToggle: () => void;
  task: Task;
}) {
  const subtitle = task.scheduledDate
    ? `${task.scheduledDate}${task.scheduledTime ? ` - ${task.scheduledTime}` : ""}`
    : "Not scheduled";

  return (
    <View style={styles.taskTile}>
      <Pressable accessibilityRole="checkbox" hitSlop={8} onPress={onToggle}>
        <Checkbox checked={task.isDone} shape="circle" size={36} />
      </Pressable>
      <View style={styles.taskCopy}>
        <AppText numberOfLines={2} variant="pill">
          {task.title}
        </AppText>
        <AppText color={colors.textSecondary} style={styles.taskSubtitle} variant="bodySmall">
          {subtitle}
        </AppText>
      </View>
    </View>
  );
}

function ActiveQuestCard({
  compact,
  entry,
  expanded,
  onAddTask,
  onAddToSprint,
  onToggleExpanded,
  onToggleTask,
}: {
  compact: boolean;
  entry: QuestWithTasks;
  expanded: boolean;
  onAddTask: () => void;
  onAddToSprint: () => void;
  onToggleExpanded: () => void;
  onToggleTask: (task: Task) => void;
}) {
  const { quest, tasks } = entry;
  const taskLabel = `${tasks.length} ${tasks.length === 1 ? "task" : "tasks"}`;

  return (
    <Card
      style={[
        styles.questCard,
        expanded ? styles.questCardExpanded : styles.questCardCollapsed,
        compact && styles.questCardCompact,
      ]}
      variant={expanded ? "strong" : "default"}
    >
      <View style={styles.questTopRow}>
        <Pressable
          accessibilityRole="button"
          onPress={onToggleExpanded}
          style={({ pressed: isPressed }) => [
            styles.questCopy,
            isPressed && pressed,
          ]}
        >
          <AppText numberOfLines={2} variant="cardTitle">
            {quest.title}
          </AppText>
          <View style={styles.questMetaLine}>
            <ClockIcon />
            <AppText color={colors.textSecondary} variant="meta">
              {taskLabel}
            </AppText>
          </View>
        </Pressable>
        <View style={styles.questActions}>
          <Pressable
            accessibilityLabel="Add quest to sprint"
            accessibilityRole="button"
            onPress={onAddToSprint}
            style={({ pressed: isPressed }) => [
              styles.questIconButton,
              isPressed && pressed,
            ]}
          >
            <CalendarPlusIcon />
          </Pressable>
          {!expanded ? (
            <Pressable
              accessibilityLabel="Expand quest"
              accessibilityRole="button"
              hitSlop={8}
              onPress={onToggleExpanded}
              style={({ pressed: isPressed }) => [
                styles.chevronButton,
                isPressed && pressed,
              ]}
            >
              <ChevronDownIcon />
            </Pressable>
          ) : null}
        </View>
      </View>

      {expanded ? (
        <>
          <View style={styles.questDivider} />
          <View style={styles.taskStack}>
            {tasks.length > 0 ? (
              tasks.map((task) => (
                <TaskRow
                  key={task.id}
                  onToggle={() => onToggleTask(task)}
                  task={task}
                />
              ))
            ) : (
              <AppText style={styles.noTasksText} variant="bodySmall">
                No tasks yet.
              </AppText>
            )}
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={onAddTask}
            style={({ pressed: isPressed }) => [
              styles.addTaskButton,
              isPressed && pressed,
            ]}
          >
            <PlusIcon color={colors.primary} size={iconSizes.md} />
            <AppText color={colors.primary} variant="button">
              Add task
            </AppText>
          </Pressable>
        </>
      ) : null}
    </Card>
  );
}

function ContentTabs({
  activeTab,
  habitsCount,
  onChange,
  questsCount,
}: {
  activeTab: ContentTab;
  habitsCount: number;
  onChange: (tab: ContentTab) => void;
  questsCount: number;
}) {
  return (
    <View style={styles.tabs}>
      <Pressable
        accessibilityRole="tab"
        accessibilityState={{ selected: activeTab === "quests" }}
        onPress={() => onChange("quests")}
        style={({ pressed: isPressed }) => [
          styles.tabButton,
          activeTab === "quests" && styles.tabButtonActive,
          isPressed && pressed,
        ]}
      >
        <AppText
          color={activeTab === "quests" ? colors.primary : colors.textMuted}
          style={styles.tabLabel}
          variant="captionStrong"
        >
          QUESTS
        </AppText>
        <AppText
          color={activeTab === "quests" ? colors.primary : colors.textMuted}
          style={styles.tabCount}
          variant="pill"
        >
          {questsCount}
        </AppText>
      </Pressable>
      <Pressable
        accessibilityRole="tab"
        accessibilityState={{ selected: activeTab === "habits" }}
        onPress={() => onChange("habits")}
        style={({ pressed: isPressed }) => [
          styles.tabButton,
          activeTab === "habits" && styles.tabButtonActive,
          isPressed && pressed,
        ]}
      >
        <AppText
          color={activeTab === "habits" ? colors.primary : colors.textMuted}
          style={styles.tabLabel}
          variant="captionStrong"
        >
          HABITS
        </AppText>
        <AppText
          color={activeTab === "habits" ? colors.primary : colors.textMuted}
          style={styles.tabCount}
          variant="pill"
        >
          {habitsCount}
        </AppText>
      </Pressable>
    </View>
  );
}

function TextPromptModal({
  onClose,
  onSubmit,
  placeholder,
  title,
  visible,
}: {
  onClose: () => void;
  onSubmit: (value: string) => void;
  placeholder: string;
  title: string;
  visible: boolean;
}) {
  const [value, setValue] = useState("");
  const [wasVisible, setWasVisible] = useState(false);

  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) setValue("");
  }

  return (
    <AppModal onClose={onClose} visible={visible}>
      <AppText align="center" variant="titleSm">
        {title}
      </AppText>
      <AppInput
        autoFocus
        containerStyle={styles.promptInput}
        onChangeText={setValue}
        placeholder={placeholder}
        value={value}
      />
      <View style={styles.promptActions}>
        <AppButton
          label="Cancel"
          onPress={onClose}
          style={styles.promptButton}
          variant="secondary"
        />
        <AppButton
          disabled={!value.trim()}
          label="Add"
          onPress={() => onSubmit(value.trim())}
          style={styles.promptButton}
        />
      </View>
    </AppModal>
  );
}

export default function MilestoneQuestsScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isNarrow = width < layout.compactBreakpoint;
  const { milestoneId: milestoneIdParam } = useLocalSearchParams<{
    milestoneId?: string;
    dreamId?: string;
  }>();

  const [activeTab, setActiveTab] = useState<ContentTab>("quests");
  const [expandedQuestId, setExpandedQuestId] = useState<number | null>(null);
  const [expandedHabitId, setExpandedHabitId] = useState<number | null>(null);
  const [menuHabit, setMenuHabit] = useState<BoardHabit | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BoardHabit | null>(null);
  const [milestone, setMilestone] = useState<Milestone | null>(null);
  const [questEntries, setQuestEntries] = useState<QuestWithTasks[]>([]);
  const [prompt, setPrompt] = useState<PromptState>(null);
  const { habits, refresh: refreshHabits, setCompletion, weekDates } =
    useHabitWeek(milestone?.dreamId);

  const loadScreen = useCallback(async () => {
    try {
      let resolved: Milestone | null = null;
      const paramId = Number(milestoneIdParam);
      if (milestoneIdParam && Number.isFinite(paramId) && paramId > 0) {
        resolved = await getMilestoneById(paramId);
      }
      if (!resolved) {
        const [firstDream] = await getDreams();
        if (firstDream) {
          const milestones = await getMilestones(firstDream.id);
          resolved =
            milestones.find((entry) => entry.status === "active") ??
            milestones[0] ??
            null;
        }
      }

      setMilestone(resolved);
      if (!resolved) {
        setQuestEntries([]);
        return;
      }

      const questList = await getQuests(resolved.id);
      const withTasks = await Promise.all(
        questList.map(async (quest) => ({
          quest,
          tasks: await getTasksByQuest(quest.id),
        })),
      );
      setQuestEntries(withTasks);
    } catch (cause) {
      console.error("Failed to load milestone quests", cause);
    }
  }, [milestoneIdParam]);

  useFocusEffect(
    useCallback(() => {
      loadScreen();
    }, [loadScreen]),
  );

  const boardHabits = habits.map((view, index) =>
    toBoardHabit(view, index, HABIT_ACCENT_CYCLE[index % HABIT_ACCENT_CYCLE.length]),
  );
  // Monday-first index of today, matching the week strip's order.
  const activeDayIndex = (new Date().getDay() + 6) % 7;

  // Keep one quest/habit expanded once the lists load; adjusted during render
  // so it settles before paint instead of cascading through an effect.
  if (questEntries.length === 0) {
    if (expandedQuestId !== null) setExpandedQuestId(null);
  } else if (
    !questEntries.some((entry) => entry.quest.id === expandedQuestId)
  ) {
    setExpandedQuestId(questEntries[0].quest.id);
  }
  if (boardHabits.length === 0) {
    if (expandedHabitId !== null) setExpandedHabitId(null);
  } else if (!boardHabits.some((habit) => habit.id === expandedHabitId)) {
    setExpandedHabitId(boardHabits[0].id);
  }

  const allTasks = questEntries.flatMap((entry) => entry.tasks);
  const doneTasks = allTasks.filter((task) => task.isDone).length;
  const milestoneProgress =
    allTasks.length > 0 ? Math.round((doneTasks / allTasks.length) * 100) : 0;

  const handleToggleTask = async (task: Task) => {
    setQuestEntries((current) =>
      current.map((entry) => ({
        ...entry,
        tasks: entry.tasks.map((existing) =>
          existing.id === task.id
            ? { ...existing, isDone: !existing.isDone }
            : existing,
        ),
      })),
    );
    try {
      await setTaskDone(task.id, !task.isDone);
    } catch (cause) {
      console.error("Failed to toggle the task", cause);
      await loadScreen();
    }
  };

  const handleDayPress = (habit: BoardHabit, dayIndex: number) => {
    const date = weekDates[dayIndex];
    const current = habit.progress[dayIndex];
    // Tap cycles done ↔ open, same as the Habits tab.
    setCompletion(habit.id, date, current === "done" ? null : "done");
  };

  const handleDeleteHabitConfirmed = async () => {
    if (!deleteTarget) return;
    try {
      await deleteHabit(deleteTarget.id);
      await refreshHabits();
    } catch (cause) {
      console.error("Failed to delete the habit", cause);
    }
    setDeleteTarget(null);
  };

  const handlePromptSubmit = async (value: string) => {
    if (!prompt) return;
    try {
      if (prompt.kind === "quest" && milestone) {
        await createQuest(milestone.id, value);
      } else if (prompt.kind === "task") {
        await createTask({ questId: prompt.questId, title: value });
      }
      await loadScreen();
    } catch (cause) {
      console.error("Failed to add the entry", cause);
    }
    setPrompt(null);
  };

  const visibleCount = activeTab === "quests" ? questEntries.length : habits.length;
  const visibleLabel = `${visibleCount} ${
    activeTab === "quests"
      ? visibleCount === 1
        ? "quest"
        : "quests"
      : visibleCount === 1
        ? "habit"
        : "habits"
  }`;

  return (
    <ScreenScaffold tabClearance topInset>
      <ScreenHeader
        buttonSize="md"
        leftAction={{
          accessibilityLabel: "Back",
          icon: <BackIcon />,
          onPress: () => {
            if (router.canGoBack()) {
              router.back();
              return;
            }
            router.push("/journey-map");
          },
        }}
        rightAction={{
          accessibilityLabel: "Open ideas",
          icon: <BulbIcon color={colors.accentViolet} size={iconSizes.md} />,
          onPress: () =>
            router.push({
              pathname: "/milestone-ideas",
              params: {
                milestoneId: milestone ? String(milestone.id) : "",
              },
            }),
        }}
        style={styles.header}
        title="Milestone Quests"
      />

      <Card padded={false} style={styles.milestoneCard}>
        <Image
          contentFit="cover"
          source={TREE_MILESTONE_HEADER_SOURCE}
          style={styles.heroImage}
        />
        <LinearGradient
          colors={[
            "rgba(4, 7, 17, 0.98)",
            "rgba(4, 7, 17, 0.74)",
            "rgba(4, 7, 17, 0.12)",
          ]}
          end={{ x: 1, y: 0.5 }}
          start={{ x: 0, y: 0.5 }}
          style={StyleSheet.absoluteFill}
        />
        <LinearGradient
          colors={["rgba(4, 7, 17, 0.04)", "rgba(4, 7, 17, 0.8)"]}
          style={styles.heroBottomShade}
        />
        <View style={styles.milestoneCopy}>
          <AppText color={colors.accentViolet} variant="eyebrow">
            CURRENT MILESTONE
          </AppText>
          <AppText numberOfLines={2} style={styles.milestoneTitle} variant="cardTitle">
            {milestone?.title ?? "No milestone yet"}
          </AppText>
          <MilestoneProgressBar value={milestoneProgress} />
        </View>
      </Card>

      <ContentTabs
        activeTab={activeTab}
        habitsCount={habits.length}
        onChange={setActiveTab}
        questsCount={questEntries.length}
      />

      <View style={styles.listToolbar}>
        <AppText color={colors.textSecondary} variant="meta">
          {visibleLabel}
        </AppText>
        {activeTab === "quests" ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => setPrompt({ kind: "quest" })}
            style={({ pressed: isPressed }) => [
              styles.newButton,
              isPressed && pressed,
            ]}
          >
            <PlusIcon color={colors.primary} size={iconSizes.md} />
            <AppText color={colors.primary} variant="button">
              New quest
            </AppText>
          </Pressable>
        ) : (
          <Pressable
            accessibilityRole="button"
            onPress={() =>
              router.push({
                pathname: "/create-habit",
                params: {
                  dreamId: milestone ? String(milestone.dreamId) : "",
                },
              })
            }
            style={({ pressed: isPressed }) => [
              styles.newButton,
              isPressed && pressed,
            ]}
          >
            <PlusIcon color={colors.primary} size={iconSizes.md} />
            <AppText color={colors.primary} variant="button">
              New habit
            </AppText>
          </Pressable>
        )}
      </View>

      {activeTab === "quests" ? (
        <>
          {questEntries.map((entry) => (
            <ActiveQuestCard
              compact={isNarrow}
              entry={entry}
              expanded={expandedQuestId === entry.quest.id}
              key={entry.quest.id}
              onAddTask={() => setPrompt({ kind: "task", questId: entry.quest.id })}
              onAddToSprint={() => router.push("/sprint")}
              onToggleExpanded={() =>
                setExpandedQuestId((current) =>
                  current === entry.quest.id ? null : entry.quest.id,
                )
              }
              onToggleTask={handleToggleTask}
            />
          ))}

          {questEntries.length === 0 ? (
            <Card style={styles.emptyCard}>
              <AppText align="center" variant="bodySmall">
                No quests yet. Add the first one to break this milestone into doable steps.
              </AppText>
            </Card>
          ) : null}
        </>
      ) : (
        <>
          {boardHabits.map((habit) => (
            <HabitBoardRow
              activeDayIndex={activeDayIndex}
              compact={isNarrow}
              containerStyle={[
                styles.habitCard,
                isNarrow && styles.habitCardCompact,
              ]}
              expanded={expandedHabitId === habit.id}
              habit={habit}
              key={habit.id}
              onDayPress={(dayIndex) => handleDayPress(habit, dayIndex)}
              onPress={() =>
                setExpandedHabitId((current) =>
                  current === habit.id ? null : habit.id,
                )
              }
              trailing={
                <Pressable
                  accessibilityLabel="Habit options"
                  accessibilityRole="button"
                  hitSlop={8}
                  onPress={() => setMenuHabit(habit)}
                  style={({ pressed: isPressed }) => [
                    styles.habitMenuButton,
                    isPressed && pressed,
                  ]}
                >
                  <DotsIcon />
                </Pressable>
              }
            />
          ))}

          {habits.length === 0 ? (
            <Card style={styles.emptyCard}>
              <AppText align="center" variant="bodySmall">
                No habits linked to this dream yet.
              </AppText>
            </Card>
          ) : null}
        </>
      )}

      <TextPromptModal
        onClose={() => setPrompt(null)}
        onSubmit={handlePromptSubmit}
        placeholder={prompt?.kind === "task" ? "Task title..." : "Quest title..."}
        title={prompt?.kind === "task" ? "Add a task" : "Add a quest"}
        visible={prompt !== null}
      />

      <AppModal onClose={() => setMenuHabit(null)} visible={menuHabit !== null}>
        <AppText align="center" numberOfLines={2} variant="titleSm">
          {menuHabit?.title}
        </AppText>
        <View style={styles.promptActions}>
          <AppButton
            label="Edit"
            onPress={() => {
              const habitId = menuHabit?.id;
              setMenuHabit(null);
              if (habitId != null) {
                router.push({
                  pathname: "/create-habit",
                  params: { habitId: String(habitId) },
                });
              }
            }}
            style={styles.promptButton}
            variant="secondary"
          />
          <AppButton
            label="Delete"
            onPress={() => {
              setDeleteTarget(menuHabit);
              setMenuHabit(null);
            }}
            style={[styles.promptButton, styles.habitDeleteButton]}
            textStyle={styles.habitDeleteLabel}
            variant="secondary"
          />
        </View>
      </AppModal>

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
        <View style={styles.promptActions}>
          <AppButton
            label="Cancel"
            onPress={() => setDeleteTarget(null)}
            style={styles.promptButton}
            variant="secondary"
          />
          <AppButton
            label="Delete"
            onPress={handleDeleteHabitConfirmed}
            style={[styles.promptButton, styles.habitDeleteButton]}
            textStyle={styles.habitDeleteLabel}
            variant="secondary"
          />
        </View>
      </AppModal>
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  addTaskButton: {
    alignItems: "center",
    alignSelf: "center",
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "center",
    minHeight: controls.button.section.height,
    paddingHorizontal: spacing.md,
  },
  chevronButton: {
    alignItems: "center",
    height: layout.minTouchTarget,
    justifyContent: "center",
    width: layout.minTouchTarget,
  },
  confirmBody: {
    marginTop: spacing.sm,
  },
  emptyCard: {
    marginBottom: spacing.md,
    paddingVertical: spacing.lg,
  },
  habitCard: {
    backgroundColor: colors.surfaceCard,
    borderColor: colors.border,
    borderRadius: radius.card,
    borderWidth: 1,
    marginBottom: spacing.lg,
    paddingBottom: 23,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    ...shadows.goldGlow,
    shadowOpacity: 0.18,
    shadowRadius: 18,
  },
  habitCardCompact: {
    paddingBottom: spacing.md,
    paddingHorizontal: 10,
    paddingTop: 14,
  },
  habitDeleteButton: {
    borderColor: colors.danger,
  },
  habitDeleteLabel: {
    color: colors.danger,
  },
  habitMenuButton: {
    alignItems: "center",
    height: 44,
    justifyContent: "center",
    width: 34,
  },
  header: {
    marginBottom: spacing.md,
    paddingHorizontal: 0,
  },
  heroBottomShade: {
    bottom: 0,
    height: "62%",
    left: 0,
    position: "absolute",
    right: 0,
  },
  heroImage: {
    ...StyleSheet.absoluteFill,
  },
  listToolbar: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.md,
    marginTop: spacing.lg,
    minHeight: controls.button.section.height,
  },
  milestoneCard: {
    borderColor: colors.accentVioletGlow,
    minHeight: 200,
    overflow: "hidden",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  milestoneCopy: {
    flex: 1,
    justifyContent: "space-between",
    maxWidth: "68%",
    zIndex: 1,
  },
  milestoneTitle: {
    marginTop: spacing.md,
  },
  newButton: {
    alignItems: "center",
    backgroundColor: "rgba(8, 14, 28, 0.86)",
    borderColor: colors.borderStrong,
    borderRadius: controls.button.section.borderRadius,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "center",
    minHeight: controls.button.section.height,
    minWidth: controls.button.section.minWidth,
    paddingHorizontal: controls.button.section.paddingHorizontal,
  },
  noTasksText: {
    paddingVertical: spacing.md,
  },
  progressFill: {
    backgroundColor: colors.primary,
    borderRadius: radius.round,
    height: "100%",
    minWidth: spacing.lg,
  },
  progressRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  progressTrack: {
    backgroundColor: "rgba(246, 232, 200, 0.18)",
    borderRadius: radius.round,
    flex: 1,
    height: 6,
    overflow: "hidden",
  },
  progressValue: {
    minWidth: 44,
  },
  promptActions: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  promptButton: {
    flex: 1,
    paddingHorizontal: spacing.sm,
  },
  promptInput: {
    marginTop: spacing.lg,
  },
  questActions: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
  },
  questCard: {
    marginBottom: spacing.md,
    overflow: "hidden",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  questCardCollapsed: {
    borderColor: "rgba(246, 232, 200, 0.18)",
  },
  questCardCompact: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  questCardExpanded: {
    borderColor: colors.borderStrong,
  },
  questCopy: {
    flex: 1,
    minWidth: 0,
  },
  questDivider: {
    backgroundColor: "rgba(246, 232, 200, 0.22)",
    height: 1,
    marginTop: spacing.lg,
  },
  questIconButton: {
    alignItems: "center",
    backgroundColor: "rgba(8, 14, 28, 0.82)",
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    height: controls.iconButton.md,
    justifyContent: "center",
    width: controls.iconButton.md,
  },
  questMetaLine: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  questTopRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.lg,
    justifyContent: "space-between",
  },
  tabButton: {
    alignItems: "center",
    borderBottomColor: colors.transparent,
    borderBottomWidth: 2,
    flex: 1,
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "center",
    minHeight: 56,
  },
  tabButtonActive: {
    borderBottomColor: colors.primary,
  },
  tabCount: {
    fontSize: fontSizes.md,
    lineHeight: lineHeights.md,
  },
  tabLabel: {
    fontSize: fontSizes.sm,
    letterSpacing: 2,
    lineHeight: lineHeights.sm,
  },
  tabs: {
    borderBottomColor: "rgba(246, 232, 200, 0.2)",
    borderBottomWidth: 1,
    flexDirection: "row",
    marginHorizontal: -layout.screenPaddingH,
    marginTop: spacing.lg,
  },
  taskCopy: {
    flex: 1,
    minWidth: 0,
  },
  taskStack: {
    borderBottomColor: "rgba(246, 232, 200, 0.13)",
    borderBottomWidth: 1,
    gap: spacing.md,
    paddingVertical: spacing.lg,
  },
  taskSubtitle: {
    marginTop: spacing.xs,
  },
  taskTile: {
    alignItems: "center",
    backgroundColor: "rgba(7, 13, 27, 0.82)",
    borderColor: "rgba(246, 232, 200, 0.1)",
    borderRadius: radius.card,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    minHeight: controls.row.option,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
});
