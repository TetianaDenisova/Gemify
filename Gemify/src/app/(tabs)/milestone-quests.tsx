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

import { HabitItemCard, type HabitCompletion } from "@/components/HabitItem";
import {
  approveIdea,
  createIdea,
  createQuest,
  createTask,
  getDreams,
  getIdeas,
  getMilestoneById,
  getMilestones,
  getQuests,
  getTasksByQuest,
  setTaskDone,
  type Idea,
  type Milestone,
  type Quest,
  type Task,
} from "@/db";
import { habitTimeLabel, useHabitWeek } from "@/hooks/useHabitWeek";
import {
  AppButton,
  AppInput,
  AppModal,
  AppText,
  BackIcon,
  Badge,
  Card,
  Checkbox,
  ListItem,
  PlusIcon,
  ProgressRing,
  ScreenHeader,
  ScreenScaffold,
  SectionHeader,
  SparkIcon,
} from "@/shared/components";
import { colors } from "@/theme/colors";
import {
  controls,
  fontSizes,
  layout,
  lineHeights,
  pressed,
  spacing,
  typography,
} from "@/theme/theme";

const QUEST_HEADER_SOURCE = require("../../../assets/quest-header.png");

type IdeaIconKey = "star" | "shirt" | "music" | "drop";

const IDEA_ICON_CYCLE: readonly IdeaIconKey[] = [
  "star",
  "shirt",
  "music",
  "drop",
];

const HABIT_ICON_CYCLE = ["workout", "water", "book", "meditate"] as const;
const HABIT_ACCENT_CYCLE = [colors.primary, "#7F91FF", "#D986FF", "#4FC3F7"];

/** Quest plus its tasks, as one unit of screen state. */
type QuestWithTasks = {
  quest: Quest;
  tasks: Task[];
};

type PromptState =
  | { kind: "idea" }
  | { kind: "quest" }
  | { kind: "task"; questId: number }
  | null;

function daysSince(isoDate: string): number {
  const started = new Date(isoDate).getTime();
  if (Number.isNaN(started)) return 0;
  return Math.max(0, Math.floor((Date.now() - started) / 86_400_000));
}

function MoreIcon({ color = colors.primary }: { color?: string }) {
  return (
    <Svg height={22} viewBox="0 0 24 24" width={22}>
      {[7, 12, 17].map((cx) => (
        <Circle cx={cx} cy={12} fill={color} key={cx} r={1.55} />
      ))}
    </Svg>
  );
}

function CalendarIcon({ color = colors.primary }: { color?: string }) {
  return (
    <Svg height={22} viewBox="0 0 24 24" width={22}>
      <Rect
        fill="none"
        height={15}
        rx={2}
        stroke={color}
        strokeWidth={1.5}
        width={18}
        x={3}
        y={5}
      />
      <Path
        d="M7 3v4M17 3v4M3 10h18"
        fill="none"
        stroke={color}
        strokeLinecap="round"
        strokeWidth={1.5}
      />
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

function IdeaIcon({ icon }: { icon: IdeaIconKey }) {
  if (icon === "shirt") {
    return (
      <Svg height={29} viewBox="0 0 24 24" width={29}>
        <Path
          d="M8 4 5 6 2 9l3 4 2-1v8h10v-8l2 1 3-4-3-3-3-2c-1 2-7 2-8 0Z"
          fill="#C879FF"
        />
      </Svg>
    );
  }

  if (icon === "music") {
    return (
      <Svg height={29} viewBox="0 0 24 24" width={29}>
        <Path
          d="M9 18V6l10-2v12"
          fill="none"
          stroke="#D986FF"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2.3}
        />
        <Circle cx={6} cy={18} fill="#D986FF" r={3} />
        <Circle cx={16} cy={16} fill="#D986FF" r={3} />
      </Svg>
    );
  }

  if (icon === "drop") {
    return (
      <Svg height={29} viewBox="0 0 24 24" width={29}>
        <Path
          d="M12 3c4 5 6 8 6 11a6 6 0 0 1-12 0c0-3 2-6 6-11Z"
          fill="none"
          stroke="#7F91FF"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2.1}
        />
      </Svg>
    );
  }

  return (
    <Svg height={29} viewBox="0 0 24 24" width={29}>
      <Path
        d="m12 3 2.4 5.1 5.6.8-4 3.9.9 5.5-4.9-2.6-4.9 2.6.9-5.5-4-3.9 5.6-.8L12 3Z"
        fill="none"
        stroke={colors.primary}
        strokeLinejoin="round"
        strokeWidth={1.6}
      />
      <Path d="m12 8 1 2.3 2.5.4-1.8 1.7.4 2.5-2.1-1.2-2.1 1.2.4-2.5-1.8-1.7 2.5-.4L12 8Z" fill={colors.primary} />
    </Svg>
  );
}

function PillButton({
  color = colors.accentViolet,
  label,
  minWidth,
  onPress,
}: {
  color?: string;
  label: string;
  minWidth?: number;
  onPress?: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed: isPressed }) => [
        styles.pillButton,
        { borderColor: color, minWidth },
        isPressed && pressed,
      ]}
    >
      <AppText color={color} variant="pill">
        {label}
      </AppText>
    </Pressable>
  );
}

function IdeaRow({
  compact,
  idea,
  index,
  isLast,
  onApprove,
}: {
  compact: boolean;
  idea: Idea;
  index: number;
  isLast: boolean;
  onApprove: () => void;
}) {
  return (
    <View
      style={[
        styles.ideaRow,
        compact && styles.ideaRowCompact,
        isLast && styles.lastRow,
      ]}
    >
      <View style={styles.ideaIconFrame}>
        <IdeaIcon icon={IDEA_ICON_CYCLE[index % IDEA_ICON_CYCLE.length]} />
      </View>
      <AppText
        numberOfLines={2}
        style={[styles.ideaTitle, compact && styles.ideaTitleCompact]}
        variant="button"
      >
        {idea.title}
      </AppText>
      <Badge
        label={String(idea.score)}
        style={[styles.scorePill, compact && styles.scorePillCompact]}
        textStyle={styles.scoreText}
      />
      <PillButton
        label="Approve"
        minWidth={compact ? 84 : 126}
        onPress={onApprove}
      />
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
    ? `${task.scheduledDate}${task.scheduledTime ? ` · ${task.scheduledTime}` : ""}`
    : "Not scheduled";

  return (
    <ListItem
      leading={
        <Pressable accessibilityRole="checkbox" hitSlop={8} onPress={onToggle}>
          <Checkbox checked={task.isDone} shape="circle" size={36} />
        </Pressable>
      }
      style={styles.taskRow}
      subtitle={subtitle}
      title={task.title}
    />
  );
}

function ActiveQuestCard({
  compact,
  entry,
  onAddTask,
  onAddToSprint,
  onToggleTask,
}: {
  compact: boolean;
  entry: QuestWithTasks;
  onAddTask: () => void;
  onAddToSprint: () => void;
  onToggleTask: (task: Task) => void;
}) {
  const { quest, tasks } = entry;
  const doneCount = tasks.filter((task) => task.isDone).length;
  const progress =
    tasks.length > 0 ? Math.round((doneCount / tasks.length) * 100) : 0;
  const activeDays = daysSince(quest.createdAt);

  return (
    <Card style={styles.activeQuestCard} variant="strong">
      <View
        style={[
          styles.activeQuestHeader,
          compact && styles.activeQuestHeaderCompact,
        ]}
      >
        <View style={styles.activeQuestProgressRing}>
          <ProgressRing
            backgroundColor={colors.surfaceDeep}
            color={colors.primary}
            size={74}
            strokeWidth={4}
            value={progress}
          />
        </View>
        <View style={styles.activeQuestCopy}>
          <AppText variant="cardTitle">{quest.title}</AppText>
          <View style={styles.questMetaRow}>
            <View style={styles.metaItem}>
              <ClockIcon />
              <AppText variant="meta">
                {doneCount} / {tasks.length} tasks
              </AppText>
            </View>
            <AppText style={styles.metaSeparator}>|</AppText>
            <View style={styles.metaItem}>
              <CalendarIcon color={colors.textSecondary} />
              <AppText variant="meta">
                {activeDays} {activeDays === 1 ? "day" : "days"} active
              </AppText>
            </View>
          </View>
        </View>
        <PillButton
          label="Add to sprint"
          minWidth={compact ? 84 : 126}
          onPress={onAddToSprint}
        />
      </View>

      <Card padded={false} style={styles.taskList}>
        {tasks.map((task) => (
          <TaskRow
            key={task.id}
            onToggle={() => onToggleTask(task)}
            task={task}
          />
        ))}
        <Pressable
          accessibilityRole="button"
          onPress={onAddTask}
          style={({ pressed: isPressed }) => [styles.addTaskButton, isPressed && pressed]}
        >
          <PlusIcon color={colors.accentViolet} size={24} />
          <AppText color={colors.accentViolet} variant="button">
            Add Task
          </AppText>
        </Pressable>
      </Card>
    </Card>
  );
}

/** Small centered dialog with one input, used for quick "add X" prompts. */
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

  const [milestone, setMilestone] = useState<Milestone | null>(null);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [questEntries, setQuestEntries] = useState<QuestWithTasks[]>([]);
  const [prompt, setPrompt] = useState<PromptState>(null);
  const { habits } = useHabitWeek(milestone?.dreamId);

  const loadScreen = useCallback(async () => {
    try {
      let resolved: Milestone | null = null;
      const paramId = Number(milestoneIdParam);
      if (milestoneIdParam && Number.isFinite(paramId) && paramId > 0) {
        resolved = await getMilestoneById(paramId);
      }
      if (!resolved) {
        // Tab opened directly: fall back to the first dream's first active
        // milestone so the screen always shows something real.
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
        setIdeas([]);
        setQuestEntries([]);
        return;
      }

      const [ideaList, questList] = await Promise.all([
        getIdeas(resolved.id),
        getQuests(resolved.id),
      ]);
      const withTasks = await Promise.all(
        questList.map(async (quest) => ({
          quest,
          tasks: await getTasksByQuest(quest.id),
        })),
      );
      setIdeas(ideaList);
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

  const allTasks = questEntries.flatMap((entry) => entry.tasks);
  const doneTasks = allTasks.filter((task) => task.isDone).length;
  const milestoneProgress =
    allTasks.length > 0 ? Math.round((doneTasks / allTasks.length) * 100) : 0;
  const oldestQuest = questEntries.reduce<string | null>(
    (oldest, entry) =>
      oldest === null || entry.quest.createdAt < oldest
        ? entry.quest.createdAt
        : oldest,
    null,
  );
  const daysInProgress = oldestQuest ? daysSince(oldestQuest) : 0;

  const handleApproveIdea = async (idea: Idea) => {
    try {
      await approveIdea(idea.id);
      await loadScreen();
    } catch (cause) {
      console.error("Failed to approve the idea", cause);
    }
  };

  const handleToggleTask = async (task: Task) => {
    // Optimistic flip; reload fixes any divergence.
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

  const handlePromptSubmit = async (value: string) => {
    if (!prompt) return;
    try {
      if (prompt.kind === "quest" && milestone) {
        await createQuest(milestone.id, value);
      } else if (prompt.kind === "idea" && milestone) {
        await createIdea(milestone.id, value, 5);
      } else if (prompt.kind === "task") {
        await createTask({ questId: prompt.questId, title: value });
      }
      await loadScreen();
    } catch (cause) {
      console.error("Failed to add the entry", cause);
    }
    setPrompt(null);
  };

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
          accessibilityLabel: "More options",
          icon: <MoreIcon />,
          onPress: () => {},
        }}
        style={styles.header}
        title="Milestone Quests"
      />

      <Card padded={false} style={styles.milestoneCard}>
        <Image contentFit="cover" source={QUEST_HEADER_SOURCE} style={styles.heroImage} />
        <LinearGradient
          colors={[
            "rgba(4, 7, 17, 0.98)",
            "rgba(4, 7, 17, 0.78)",
            "rgba(4, 7, 17, 0.24)",
          ]}
          end={{ x: 1, y: 0.5 }}
          start={{ x: 0, y: 0.5 }}
          style={StyleSheet.absoluteFill}
        />
        <LinearGradient
          colors={["rgba(4, 7, 17, 0)", "rgba(4, 7, 17, 0.92)"]}
          style={styles.heroBottomShade}
        />
        <View style={styles.milestoneCopy}>
          <View style={styles.labelRow}>
            <PlusIcon color={colors.accentViolet} size={18} />
            <AppText color={colors.accentViolet} variant="eyebrow">
              CURRENT MILESTONE
            </AppText>
          </View>
          <AppText variant="cardTitle">
            {milestone?.title ?? "No milestone yet"}
          </AppText>
          <View style={styles.metaItem}>
            <CalendarIcon />
            <AppText color={colors.primary} variant="meta">
              {daysInProgress} {daysInProgress === 1 ? "day" : "days"} in
              progress
            </AppText>
          </View>
        </View>
        <View style={styles.milestoneProgress}>
          <ProgressRing
            backgroundColor={colors.surfaceDeep}
            color={colors.primary}
            meta="COMPLETE"
            size={116}
            strokeWidth={5}
            value={milestoneProgress}
          />
        </View>
      </Card>

      <Card style={styles.ideaPanel}>
        <SectionHeader
          action={{
            icon: <PlusIcon size={14} />,
            label: "Add",
            onPress: () => setPrompt({ kind: "idea" }),
          }}
          style={styles.ideaHeader}
          title="IDEAS THAT CAN HELP ACHIEVE"
          variant="eyebrow"
        />
        <View style={styles.sparkle}>
          <SparkIcon color={colors.accentViolet} size={30} />
        </View>
        {ideas.length > 0 ? (
          <Card padded={false} style={styles.ideaList}>
            {ideas.map((idea, index) => (
              <IdeaRow
                compact={isNarrow}
                idea={idea}
                index={index}
                isLast={index === ideas.length - 1}
                key={idea.id}
                onApprove={() => handleApproveIdea(idea)}
              />
            ))}
          </Card>
        ) : (
          <AppText style={styles.emptyHint} variant="bodySmall">
            Capture small ideas here, then approve the best ones into quests.
          </AppText>
        )}
      </Card>

      <SectionHeader
        action={{
          icon: <PlusIcon />,
          label: "Add Quest",
          onPress: () => setPrompt({ kind: "quest" }),
        }}
        style={styles.sectionHeader}
        title="QUESTS"
      />

      {questEntries.map((entry) => (
        <ActiveQuestCard
          compact={isNarrow}
          entry={entry}
          key={entry.quest.id}
          onAddTask={() => setPrompt({ kind: "task", questId: entry.quest.id })}
          onAddToSprint={() => router.push("/sprint")}
          onToggleTask={handleToggleTask}
        />
      ))}

      {questEntries.length === 0 ? (
        <Card style={styles.emptyCard}>
          <AppText align="center" variant="bodySmall">
            No quests yet — add the first one to break this milestone into
            doable steps.
          </AppText>
        </Card>
      ) : null}

      <SectionHeader
        action={{
          icon: <PlusIcon />,
          label: "Add Habit",
          onPress: () =>
            router.push({
              pathname: "/create-habit",
              params: {
                dreamId: milestone ? String(milestone.dreamId) : "",
              },
            }),
        }}
        style={[styles.sectionHeader, styles.habitSectionHeader]}
        title="HABITS"
      />

      {habits.map((view, index) => (
        <HabitItemCard
          habit={{
            accent: HABIT_ACCENT_CYCLE[index % HABIT_ACCENT_CYCLE.length],
            day: view.doneCount,
            goal: view.habit.goalDays,
            icon: HABIT_ICON_CYCLE[index % HABIT_ICON_CYCLE.length],
            progress: view.weekProgress as readonly HabitCompletion[],
            time: habitTimeLabel(view.habit.timeOfDay),
            title: view.habit.title,
          }}
          key={view.habit.id}
        />
      ))}

      {habits.length === 0 ? (
        <Card style={styles.emptyCard}>
          <AppText align="center" variant="bodySmall">
            No habits linked to this dream yet.
          </AppText>
        </Card>
      ) : null}

      <TextPromptModal
        onClose={() => setPrompt(null)}
        onSubmit={handlePromptSubmit}
        placeholder={
          prompt?.kind === "task"
            ? "Task title..."
            : prompt?.kind === "idea"
              ? "Idea title..."
              : "Quest title..."
        }
        title={
          prompt?.kind === "task"
            ? "Add a task"
            : prompt?.kind === "idea"
              ? "Add an idea"
              : "Add a quest"
        }
        visible={prompt !== null}
      />
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  activeQuestCard: {
    marginBottom: spacing.md,
    overflow: "hidden",
  },
  activeQuestCopy: {
    flex: 1,
    paddingHorizontal: 20,
  },
  activeQuestHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 20,
  },
  activeQuestHeaderCompact: {
    alignItems: "center",
  },
  activeQuestProgressRing: {
    alignItems: "center",
    justifyContent: "center",
    minWidth: 90,
  },
  addTaskButton: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    height: 58,
    paddingHorizontal: spacing.md,
  },
  emptyCard: {
    marginBottom: spacing.md,
    paddingVertical: spacing.lg,
  },
  emptyHint: {
    marginTop: spacing.md,
  },
  habitSectionHeader: {
    marginTop: 28,
    paddingHorizontal: spacing.xl,
  },
  header: {
    marginBottom: spacing.sm,
    paddingHorizontal: 0,
  },
  heroBottomShade: {
    bottom: 0,
    height: "52%",
    left: 0,
    position: "absolute",
    right: 0,
  },
  heroImage: {
    ...StyleSheet.absoluteFill,
  },
  ideaHeader: {
    paddingHorizontal: 0,
  },
  ideaIconFrame: {
    alignItems: "center",
    borderColor: colors.accentVioletGlow,
    borderRadius: 28,
    borderWidth: 1,
    height: 56,
    justifyContent: "center",
    width: 56,
  },
  ideaList: {
    backgroundColor: colors.surfaceDeep,
    borderColor: colors.divider,
    marginTop: spacing.md,
    overflow: "hidden",
  },
  ideaPanel: {
    borderColor: colors.accentVioletGlow,
    marginTop: spacing.md,
    padding: spacing.lg,
  },
  ideaRow: {
    alignItems: "center",
    borderBottomColor: colors.divider,
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: spacing.lg,
    minHeight: 70,
    paddingHorizontal: spacing.md,
  },
  ideaRowCompact: {
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  ideaTitle: {
    flex: 1,
  },
  ideaTitleCompact: {
    fontSize: fontSizes.lg,
    lineHeight: lineHeights.lg,
  },
  labelRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  lastRow: {
    borderBottomWidth: 0,
  },
  metaItem: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  metaSeparator: {
    color: colors.textMuted,
    fontSize: fontSizes.xl,
    lineHeight: lineHeights.xl,
  },
  milestoneCard: {
    borderColor: colors.accentVioletGlow,
    minHeight: 184,
    overflow: "hidden",
    padding: 28,
  },
  milestoneCopy: {
    gap: spacing.lg,
    maxWidth: "66%",
    zIndex: 1,
  },
  milestoneProgress: {
    position: "absolute",
    right: 28,
    top: 28,
    zIndex: 2,
  },
  pillButton: {
    alignItems: "center",
    backgroundColor: "rgba(22, 13, 40, 0.64)",
    borderRadius: controls.button.pill.borderRadius,
    borderWidth: 1,
    height: controls.button.pill.height,
    justifyContent: "center",
    paddingHorizontal: controls.button.pill.paddingHorizontal,
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
  questMetaRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    marginTop: spacing.md,
  },
  scorePill: {
    height: 42,
    justifyContent: "center",
    minWidth: 92,
  },
  scorePillCompact: {
    minWidth: 58,
  },
  scoreText: {
    ...typography.pill,
    color: colors.primary,
  },
  sectionHeader: {
    marginBottom: spacing.sm,
    marginTop: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  sparkle: {
    position: "absolute",
    right: 30,
    top: 28,
  },
  taskList: {
    backgroundColor: colors.surfaceDeep,
    borderColor: colors.divider,
    marginTop: spacing.lg,
    overflow: "hidden",
  },
  taskRow: {
    paddingHorizontal: spacing.md,
  },
});
