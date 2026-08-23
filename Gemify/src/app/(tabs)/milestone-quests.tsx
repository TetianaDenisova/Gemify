import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useState, type ReactNode } from "react";
import {
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import Svg, { Circle, Path, Rect } from "react-native-svg";

import { DatePickerModal } from "@/components/DatePickerModal";
import {
  HabitBoardRow,
  toBoardHabit,
  type BoardHabit,
} from "@/components/HabitBoardCard";
import {
  createQuest,
  createTask,
  deleteQuest,
  deleteTask,
  getDreams,
  getMilestoneById,
  getMilestones,
  getQuests,
  getTasksByQuest,
  setTaskDone,
  updateQuest,
  updateTask,
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
  ChevronIcon,
  CloseIcon,
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
  shadowStyle,
  spacing,
} from "@/theme/theme";
import { toDateKey } from "@/utils/dates";

const TREE_MILESTONE_HEADER_SOURCE = require("../../data/images/tree-milestone-header.png");

const HABIT_ACCENT_CYCLE = [colors.primary, "#7F91FF", "#D986FF", "#4FC3F7"];

type QuestWithTasks = {
  quest: Quest;
  tasks: Task[];
};

type PromptState =
  | { kind: "quest" }
  | { kind: "task"; questId: number }
  | { kind: "editTask"; taskId: number; initialValue: string }
  | { kind: "editQuest"; questId: number; initialValue: string }
  | null;

type ContentTab = "quests" | "habits";

function CalendarIcon({ color = colors.primary }: { color?: string }) {
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
        d="M7 3.5v5M17 3.5v5M3.5 10.5h17"
        fill="none"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.7}
      />
    </Svg>
  );
}

function CalendarClockIcon({ color = colors.primary }: { color?: string }) {
  return (
    <Svg height={iconSizes.lg} viewBox="0 0 24 24" width={iconSizes.lg}>
      <Path
        d="M20.5 11V8a2 2 0 0 0-2-2h-13a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2H11M7 3.5v5M17 3.5v5M3.5 10.5h17"
        fill="none"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.7}
      />
      <Circle
        cx={17}
        cy={17}
        fill="none"
        r={4.2}
        stroke={color}
        strokeWidth={1.7}
      />
      <Path
        d="M17 15v2.2l1.6 1"
        fill="none"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.7}
      />
    </Svg>
  );
}

function PencilIcon({ color = colors.primary }: { color?: string }) {
  return (
    <Svg height={iconSizes.lg} viewBox="0 0 24 24" width={iconSizes.lg}>
      <Path
        d="m4 20 .8-3.8L15.6 5.4a2 2 0 0 1 2.8 0l.2.2a2 2 0 0 1 0 2.8L7.8 19.2 4 20Z"
        fill="none"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.7}
      />
      <Path
        d="m13.8 7.2 3 3"
        fill="none"
        stroke={color}
        strokeLinecap="round"
        strokeWidth={1.7}
      />
    </Svg>
  );
}

function TrashIcon({ color = colors.danger }: { color?: string }) {
  return (
    <Svg height={iconSizes.lg} viewBox="0 0 24 24" width={iconSizes.lg}>
      <Path
        d="M4.5 6.5h15M9.5 6.5V5a1.5 1.5 0 0 1 1.5-1.5h2A1.5 1.5 0 0 1 14.5 5v1.5m3.5 0-.9 12A2 2 0 0 1 15.1 20.5H8.9a2 2 0 0 1-2-1.9l-.9-12.1M10 10.5v6M14 10.5v6"
        fill="none"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.7}
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

function MilestoneProgressBar({ value }: { value: number }) {
  const clamped = Math.max(0, Math.min(100, value));

  return (
    <View style={styles.progressRow}>
      <View style={styles.progressTrack}>
        {clamped > 0 ? (
          <View style={[styles.progressFill, { width: `${clamped}%` }]} />
        ) : null}
      </View>
      <AppText color={colors.primary} style={styles.progressValue} variant="pill">
        {clamped}%
      </AppText>
    </View>
  );
}

function TaskRow({
  onOpenMenu,
  onToggle,
  task,
}: {
  onOpenMenu: () => void;
  onToggle: () => void;
  task: Task;
}) {
  const subtitle = task.scheduledDate
    ? `${task.scheduledDate}${task.scheduledTime ? ` - ${task.scheduledTime}` : ""}`
    : null;

  return (
    <View style={styles.taskTile}>
      <Pressable accessibilityRole="checkbox" hitSlop={8} onPress={onToggle}>
        <Checkbox
          appearance="outline"
          checked={task.isDone}
          shape="circle"
          size={36}
        />
      </Pressable>
      <View style={styles.taskCopy}>
        <AppText
          color={task.isDone ? colors.textMuted : colors.textPrimary}
          numberOfLines={2}
          style={task.isDone ? styles.taskTitleDone : undefined}
          variant="pill"
        >
          {task.title}
        </AppText>
        {subtitle ? (
          <AppText color={colors.textSecondary} style={styles.taskSubtitle} variant="bodySmall">
            {subtitle}
          </AppText>
        ) : null}
      </View>
      <Pressable
        accessibilityLabel="Task options"
        accessibilityRole="button"
        hitSlop={8}
        onPress={onOpenMenu}
        style={({ pressed: isPressed }) => [
          styles.menuButton,
          isPressed && pressed,
        ]}
      >
        <DotsIcon />
      </Pressable>
    </View>
  );
}

function ActiveQuestCard({
  compact,
  entry,
  expanded,
  onAddTask,
  onOpenMenu,
  onOpenTaskMenu,
  onToggleExpanded,
  onToggleTask,
}: {
  compact: boolean;
  entry: QuestWithTasks;
  expanded: boolean;
  onAddTask: () => void;
  onOpenMenu: () => void;
  onOpenTaskMenu: (task: Task) => void;
  onToggleExpanded: () => void;
  onToggleTask: (task: Task) => void;
}) {
  const { quest, tasks } = entry;
  const doneCount = tasks.filter((task) => task.isDone).length;
  const questComplete = tasks.length > 0 && doneCount === tasks.length;

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
            styles.questHeaderTap,
            isPressed && pressed,
          ]}
        >
          <Checkbox
            appearance="outline"
            checked={questComplete}
            shape="circle"
            size={44}
          />
          <View style={styles.questCopy}>
            <AppText numberOfLines={2} variant="cardTitle">
              {quest.title}
            </AppText>
            {tasks.length > 0 ? (
              <AppText
                color={colors.textSecondary}
                style={styles.questMeta}
                variant="meta"
              >
                {doneCount}/{tasks.length} tasks
              </AppText>
            ) : null}
          </View>
        </Pressable>
        <Pressable
          accessibilityLabel="Quest options"
          accessibilityRole="button"
          hitSlop={8}
          onPress={onOpenMenu}
          style={({ pressed: isPressed }) => [
            styles.menuButton,
            isPressed && pressed,
          ]}
        >
          <DotsIcon />
        </Pressable>
        <Pressable
          accessibilityLabel={expanded ? "Collapse quest" : "Expand quest"}
          accessibilityRole="button"
          hitSlop={8}
          onPress={onToggleExpanded}
          style={({ pressed: isPressed }) => [
            styles.chevronButton,
            isPressed && pressed,
          ]}
        >
          <ChevronIcon direction={expanded ? "up" : "down"} />
        </Pressable>
      </View>

      {expanded ? (
        <>
          <View style={styles.taskStack}>
            {tasks.length > 0 ? (
              tasks.map((task) => (
                <TaskRow
                  key={task.id}
                  onOpenMenu={() => onOpenTaskMenu(task)}
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
  initialValue = "",
  onClose,
  onSubmit,
  placeholder,
  submitLabel = "Add",
  title,
  visible,
}: {
  initialValue?: string;
  onClose: () => void;
  onSubmit: (value: string) => void;
  placeholder: string;
  submitLabel?: string;
  title: string;
  visible: boolean;
}) {
  const [value, setValue] = useState("");
  const [wasVisible, setWasVisible] = useState(false);

  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) setValue(initialValue);
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
          label={submitLabel}
          onPress={() => onSubmit(value.trim())}
          style={styles.promptButton}
        />
      </View>
    </AppModal>
  );
}

function TaskActionRow({
  danger = false,
  icon,
  label,
  onPress,
}: {
  danger?: boolean;
  icon: ReactNode;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed: isPressed }) => [
        styles.sheetActionRow,
        isPressed && pressed,
      ]}
    >
      {icon}
      <AppText color={danger ? colors.danger : colors.textPrimary} variant="button">
        {label}
      </AppText>
    </Pressable>
  );
}

/**
 * Bottom-sheet shell shared by the task and habit action menus: violet
 * handle + border, the item title, then the caller's action rows.
 */
function ActionSheet({
  children,
  onClose,
  title,
  visible,
}: {
  children: ReactNode;
  onClose: () => void;
  title: string | undefined;
  visible: boolean;
}) {
  return (
    <AppModal
      onClose={onClose}
      panelStyle={styles.actionSheetPanel}
      showHandle={false}
      variant="sheet"
      visible={visible}
    >
      <View style={styles.sheetHandle} />
      <AppText numberOfLines={3} style={styles.sheetTitle} variant="titleSm">
        {title}
      </AppText>
      {children}
    </AppModal>
  );
}

/** Bottom sheet with the actions for one task (mirrors the design mock). */
function TaskActionSheet({
  onClose,
  onDelete,
  onDoThisWeek,
  onEdit,
  onSchedule,
  task,
}: {
  onClose: () => void;
  onDelete: () => void;
  onDoThisWeek: () => void;
  onEdit: () => void;
  onSchedule: () => void;
  task: Task | null;
}) {
  return (
    <ActionSheet onClose={onClose} title={task?.title} visible={task !== null}>
      <TaskActionRow
        icon={<CalendarIcon />}
        label="Do this week"
        onPress={onDoThisWeek}
      />
      <TaskActionRow
        icon={<CalendarClockIcon />}
        label="Schedule"
        onPress={onSchedule}
      />
      <TaskActionRow icon={<PencilIcon />} label="Edit" onPress={onEdit} />
      <TaskActionRow
        danger
        icon={<TrashIcon />}
        label="Delete"
        onPress={onDelete}
      />
    </ActionSheet>
  );
}

/** The same sheet for a quest — the same actions as a task's menu. */
function QuestActionSheet({
  entry,
  onClose,
  onDelete,
  onDoThisWeek,
  onEdit,
  onSchedule,
}: {
  entry: QuestWithTasks | null;
  onClose: () => void;
  onDelete: () => void;
  onDoThisWeek: () => void;
  onEdit: () => void;
  onSchedule: () => void;
}) {
  return (
    <ActionSheet
      onClose={onClose}
      title={entry?.quest.title}
      visible={entry !== null}
    >
      <TaskActionRow
        icon={<CalendarIcon />}
        label="Do this week"
        onPress={onDoThisWeek}
      />
      <TaskActionRow
        icon={<CalendarClockIcon />}
        label="Schedule"
        onPress={onSchedule}
      />
      <TaskActionRow icon={<PencilIcon />} label="Edit" onPress={onEdit} />
      <TaskActionRow
        danger
        icon={<TrashIcon />}
        label="Delete"
        onPress={onDelete}
      />
    </ActionSheet>
  );
}

/** The same sheet for a habit: only Edit and Cancel (delete lives on the Habits tab). */
function HabitActionSheet({
  habit,
  onClose,
  onEdit,
}: {
  habit: BoardHabit | null;
  onClose: () => void;
  onEdit: () => void;
}) {
  return (
    <ActionSheet onClose={onClose} title={habit?.title} visible={habit !== null}>
      <TaskActionRow icon={<PencilIcon />} label="Edit" onPress={onEdit} />
      <TaskActionRow
        icon={<CloseIcon color={colors.textSecondary} size={iconSizes.lg} />}
        label="Cancel"
        onPress={onClose}
      />
    </ActionSheet>
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
  const [expandedQuestIds, setExpandedQuestIds] = useState<Set<number>>(
    () => new Set(),
  );
  const [expandedHabitIds, setExpandedHabitIds] = useState<Set<number>>(
    () => new Set(),
  );
  const [didAutoExpand, setDidAutoExpand] = useState(false);
  const [menuHabit, setMenuHabit] = useState<BoardHabit | null>(null);
  const [menuTask, setMenuTask] = useState<Task | null>(null);
  const [menuQuest, setMenuQuest] = useState<QuestWithTasks | null>(null);
  const [scheduleTask, setScheduleTask] = useState<Task | null>(null);
  const [scheduleQuest, setScheduleQuest] = useState<QuestWithTasks | null>(
    null,
  );
  const [taskDeleteTarget, setTaskDeleteTarget] = useState<Task | null>(null);
  const [questDeleteTarget, setQuestDeleteTarget] = useState<Quest | null>(
    null,
  );
  const [milestone, setMilestone] = useState<Milestone | null>(null);
  const [questEntries, setQuestEntries] = useState<QuestWithTasks[]>([]);
  const [prompt, setPrompt] = useState<PromptState>(null);
  const { habits, setCompletion, weekDates } = useHabitWeek(
    milestone?.dreamId,
  );

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

  // Expand the first quest once when the list first loads; from then on every
  // card is toggled independently by the user. Adjusted during render so it
  // settles before paint instead of cascading through an effect.
  if (!didAutoExpand && questEntries.length > 0) {
    setDidAutoExpand(true);
    setExpandedQuestIds(new Set([questEntries[0].quest.id]));
  }

  const toggleQuestExpanded = (id: number) => {
    setExpandedQuestIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleHabitExpanded = (id: number) => {
    setExpandedHabitIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

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

  const handlePromptSubmit = async (value: string) => {
    if (!prompt) return;
    try {
      if (prompt.kind === "quest" && milestone) {
        await createQuest(milestone.id, value);
      } else if (prompt.kind === "task") {
        await createTask({ questId: prompt.questId, title: value });
      } else if (prompt.kind === "editTask") {
        await updateTask(prompt.taskId, { title: value });
      } else if (prompt.kind === "editQuest") {
        await updateQuest(prompt.questId, { title: value });
      }
      await loadScreen();
    } catch (cause) {
      console.error("Failed to save the entry", cause);
    }
    setPrompt(null);
  };

  // "Do this week" clears any date, so the task lands in the sprint board's
  // "Unscheduled this week" backlog to be planned onto a day from there.
  const handleDoThisWeek = async () => {
    if (!menuTask) return;
    setMenuTask(null);
    try {
      await updateTask(menuTask.id, {
        scheduledDate: null,
        scheduledTime: null,
        isPlanned: true,
      });
      await loadScreen();
    } catch (cause) {
      console.error("Failed to move the task to the weekly backlog", cause);
    }
  };

  const handleScheduleDate = async (date: Date) => {
    if (!scheduleTask) return;
    setScheduleTask(null);
    try {
      await updateTask(scheduleTask.id, {
        scheduledDate: toDateKey(date),
        isPlanned: true,
      });
      await loadScreen();
    } catch (cause) {
      console.error("Failed to schedule the task", cause);
    }
  };

  const handleDeleteTaskConfirmed = async () => {
    if (!taskDeleteTarget) return;
    setTaskDeleteTarget(null);
    try {
      await deleteTask(taskDeleteTarget.id);
      await loadScreen();
    } catch (cause) {
      console.error("Failed to delete the task", cause);
    }
  };

  /** Batch-schedules a quest's still-unscheduled tasks onto one date. */
  const scheduleQuestTasks = async (entry: QuestWithTasks, date: string) => {
    try {
      const pending = entry.tasks.filter((task) => !task.scheduledDate);
      await Promise.all(
        pending.map((task) =>
          updateTask(task.id, { scheduledDate: date, isPlanned: true }),
        ),
      );
      await loadScreen();
    } catch (cause) {
      console.error("Failed to schedule the quest", cause);
    }
  };

  // Quest-level "Do this week": every not-done task goes to the weekly backlog.
  const handleQuestDoThisWeek = async () => {
    if (!menuQuest) return;
    setMenuQuest(null);
    try {
      const pending = menuQuest.tasks.filter((task) => !task.isDone);
      await Promise.all(
        pending.map((task) =>
          updateTask(task.id, {
            scheduledDate: null,
            scheduledTime: null,
            isPlanned: true,
          }),
        ),
      );
      await loadScreen();
    } catch (cause) {
      console.error("Failed to move the quest to the weekly backlog", cause);
    }
  };

  const handleQuestScheduleDate = async (date: Date) => {
    if (!scheduleQuest) return;
    setScheduleQuest(null);
    await scheduleQuestTasks(scheduleQuest, toDateKey(date));
  };

  const handleDeleteQuestConfirmed = async () => {
    if (!questDeleteTarget) return;
    setQuestDeleteTarget(null);
    try {
      await deleteQuest(questDeleteTarget.id);
      await loadScreen();
    } catch (cause) {
      console.error("Failed to delete the quest", cause);
    }
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
              expanded={expandedQuestIds.has(entry.quest.id)}
              key={entry.quest.id}
              onAddTask={() => setPrompt({ kind: "task", questId: entry.quest.id })}
              onOpenMenu={() => setMenuQuest(entry)}
              onOpenTaskMenu={setMenuTask}
              onToggleExpanded={() => toggleQuestExpanded(entry.quest.id)}
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
              expanded={expandedHabitIds.has(habit.id)}
              habit={habit}
              key={habit.id}
              onDayPress={(dayIndex) => handleDayPress(habit, dayIndex)}
              onPress={() => toggleHabitExpanded(habit.id)}
              trailing={
                <Pressable
                  accessibilityLabel="Habit options"
                  accessibilityRole="button"
                  hitSlop={8}
                  onPress={() => setMenuHabit(habit)}
                  style={({ pressed: isPressed }) => [
                    styles.menuButton,
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
        initialValue={
          prompt?.kind === "editTask" || prompt?.kind === "editQuest"
            ? prompt.initialValue
            : ""
        }
        onClose={() => setPrompt(null)}
        onSubmit={handlePromptSubmit}
        placeholder={
          prompt?.kind === "quest" || prompt?.kind === "editQuest"
            ? "Quest title..."
            : "Task title..."
        }
        submitLabel={
          prompt?.kind === "editTask" || prompt?.kind === "editQuest"
            ? "Save"
            : "Add"
        }
        title={
          prompt?.kind === "editQuest"
            ? "Edit quest"
            : prompt?.kind === "editTask"
              ? "Edit task"
              : prompt?.kind === "task"
                ? "Add a task"
                : "Add a quest"
        }
        visible={prompt !== null}
      />

      <TaskActionSheet
        onClose={() => setMenuTask(null)}
        onDelete={() => {
          setTaskDeleteTarget(menuTask);
          setMenuTask(null);
        }}
        onDoThisWeek={handleDoThisWeek}
        onEdit={() => {
          if (menuTask) {
            setPrompt({
              kind: "editTask",
              taskId: menuTask.id,
              initialValue: menuTask.title,
            });
          }
          setMenuTask(null);
        }}
        onSchedule={() => {
          setScheduleTask(menuTask);
          setMenuTask(null);
        }}
        task={menuTask}
      />

      <QuestActionSheet
        entry={menuQuest}
        onClose={() => setMenuQuest(null)}
        onDelete={() => {
          setQuestDeleteTarget(menuQuest?.quest ?? null);
          setMenuQuest(null);
        }}
        onDoThisWeek={handleQuestDoThisWeek}
        onEdit={() => {
          if (menuQuest) {
            setPrompt({
              kind: "editQuest",
              questId: menuQuest.quest.id,
              initialValue: menuQuest.quest.title,
            });
          }
          setMenuQuest(null);
        }}
        onSchedule={() => {
          setScheduleQuest(menuQuest);
          setMenuQuest(null);
        }}
      />

      {scheduleTask ? (
        <DatePickerModal
          initialDate={
            scheduleTask.scheduledDate
              ? new Date(`${scheduleTask.scheduledDate}T12:00:00`)
              : new Date()
          }
          onClose={() => setScheduleTask(null)}
          onSelect={handleScheduleDate}
          today={new Date()}
          visible
        />
      ) : null}

      {scheduleQuest ? (
        <DatePickerModal
          initialDate={new Date()}
          onClose={() => setScheduleQuest(null)}
          onSelect={handleQuestScheduleDate}
          today={new Date()}
          visible
        />
      ) : null}

      <AppModal
        onClose={() => setQuestDeleteTarget(null)}
        visible={questDeleteTarget !== null}
      >
        <AppText align="center" variant="titleSm">
          Delete this quest?
        </AppText>
        <AppText align="center" style={styles.confirmBody} variant="bodySerif">
          “{questDeleteTarget?.title}” and its tasks will be removed.
        </AppText>
        <View style={styles.promptActions}>
          <AppButton
            label="Cancel"
            onPress={() => setQuestDeleteTarget(null)}
            style={styles.promptButton}
            variant="secondary"
          />
          <AppButton
            label="Delete"
            onPress={handleDeleteQuestConfirmed}
            style={[styles.promptButton, styles.habitDeleteButton]}
            textStyle={styles.habitDeleteLabel}
            variant="secondary"
          />
        </View>
      </AppModal>

      <AppModal
        onClose={() => setTaskDeleteTarget(null)}
        visible={taskDeleteTarget !== null}
      >
        <AppText align="center" variant="titleSm">
          Delete this task?
        </AppText>
        <AppText align="center" style={styles.confirmBody} variant="bodySerif">
          “{taskDeleteTarget?.title}” will be removed.
        </AppText>
        <View style={styles.promptActions}>
          <AppButton
            label="Cancel"
            onPress={() => setTaskDeleteTarget(null)}
            style={styles.promptButton}
            variant="secondary"
          />
          <AppButton
            label="Delete"
            onPress={handleDeleteTaskConfirmed}
            style={[styles.promptButton, styles.habitDeleteButton]}
            textStyle={styles.habitDeleteLabel}
            variant="secondary"
          />
        </View>
      </AppModal>

      <HabitActionSheet
        habit={menuHabit}
        onClose={() => setMenuHabit(null)}
        onEdit={() => {
          const habitId = menuHabit?.id;
          setMenuHabit(null);
          if (habitId != null) {
            router.push({
              pathname: "/create-habit",
              params: { habitId: String(habitId) },
            });
          }
        }}
      />
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  actionSheetPanel: {
    borderColor: colors.accentVioletGlow,
  },
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
    ...shadowStyle({ color: colors.primary, elevation: 8, opacity: 0.18, radius: 18 }),
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
  menuButton: {
    alignItems: "center",
    height: 44,
    justifyContent: "center",
    width: 34,
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
  questHeaderTap: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: spacing.md,
    minWidth: 0,
  },
  questMeta: {
    marginTop: spacing.xs,
  },
  questTopRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.lg,
    justifyContent: "space-between",
  },
  sheetActionRow: {
    alignItems: "center",
    borderTopColor: "rgba(246, 232, 200, 0.13)",
    borderTopWidth: 1,
    flexDirection: "row",
    gap: spacing.lg,
    minHeight: 60,
    paddingVertical: spacing.sm,
  },
  sheetHandle: {
    alignSelf: "center",
    backgroundColor: colors.accentVioletStrong,
    borderRadius: radius.round,
    height: 5,
    marginBottom: spacing.lg,
    opacity: 0.85,
    width: 64,
  },
  sheetTitle: {
    marginBottom: spacing.lg,
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
    gap: spacing.md,
    paddingTop: spacing.lg,
  },
  taskSubtitle: {
    marginTop: spacing.xs,
  },
  taskTitleDone: {
    textDecorationLine: "line-through",
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
