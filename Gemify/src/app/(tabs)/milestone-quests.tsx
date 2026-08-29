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
  deleteQuest,
  getDreams,
  getMilestoneById,
  getMilestones,
  getQuests,
  setQuestDone,
  updateMilestone,
  updateQuest,
  type Milestone,
  type Quest,
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
  CheckIcon,
  Checkbox,
  CloseIcon,
  HintRow,
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
const MILESTONE_DOOR_SOURCE = require("../../../assets/create-goal/milestone-door.png");

const HABIT_ACCENT_CYCLE = [colors.primary, "#7F91FF", "#D986FF", "#4FC3F7"];

type PromptState =
  | { kind: "quest" }
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

function MemoryGlyph({
  color = colors.textOnPrimary,
  size = 22,
}: {
  color?: string;
  size?: number;
}) {
  return (
    <Svg height={size} viewBox="0 0 24 24" width={size}>
      <Rect
        fill="none"
        height={16}
        rx={2.6}
        stroke={color}
        strokeWidth={1.6}
        width={18}
        x={3}
        y={4}
      />
      <Circle cx={8.4} cy={9} fill="none" r={1.7} stroke={color} strokeWidth={1.6} />
      <Path
        d="m5.5 17 4.6-4.8 3.2 3.2 2.8-2.6 2.9 4.2"
        fill="none"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.6}
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

/**
 * One flat row per quest: completion circle · title · kebab menu. A quest is
 * a single actionable item — there is nothing to expand or drill into.
 */
function QuestRow({
  compact,
  onOpenMenu,
  onToggleQuest,
  quest,
}: {
  compact: boolean;
  onOpenMenu: () => void;
  onToggleQuest: () => void;
  quest: Quest;
}) {
  return (
    <Card
      style={[styles.questCard, compact && styles.questCardCompact]}
    >
      <View style={styles.questTopRow}>
        <Pressable
          accessibilityLabel={
            quest.isDone
              ? "Mark the quest as not done"
              : "Mark the quest as done"
          }
          accessibilityRole="checkbox"
          accessibilityState={{ checked: quest.isDone }}
          hitSlop={8}
          onPress={onToggleQuest}
        >
          <Checkbox
            appearance="outline"
            checked={quest.isDone}
            shape="circle"
            size={44}
          />
        </Pressable>
        <Pressable
          accessibilityLabel={`Options for the quest ${quest.title}`}
          accessibilityRole="button"
          onPress={onOpenMenu}
          style={({ pressed: isPressed }) => [
            styles.questHeaderTap,
            isPressed && pressed,
          ]}
        >
          <View style={styles.questCopy}>
            <AppText numberOfLines={2} variant="cardTitle">
              {quest.title}
            </AppText>
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
      </View>
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
  hint,
  initialValue = "",
  onClose,
  onSubmit,
  placeholder,
  submitLabel = "Add",
  title,
  visible,
}: {
  hint?: string;
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
      {hint ? <HintRow style={styles.promptHint} text={hint} /> : null}
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

function SheetActionRow({
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
 * Bottom-sheet shell shared by the quest and habit action menus: violet
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

/** Bottom sheet with the actions for one quest (mirrors the design mock). */
function QuestActionSheet({
  onClose,
  onDelete,
  onDoThisWeek,
  onEdit,
  onSchedule,
  quest,
}: {
  onClose: () => void;
  onDelete: () => void;
  onDoThisWeek: () => void;
  onEdit: () => void;
  onSchedule: () => void;
  quest: Quest | null;
}) {
  return (
    <ActionSheet
      onClose={onClose}
      title={quest?.title}
      visible={quest !== null}
    >
      <SheetActionRow
        icon={<CalendarIcon />}
        label="Do this week"
        onPress={onDoThisWeek}
      />
      <SheetActionRow
        icon={<CalendarClockIcon />}
        label="Schedule"
        onPress={onSchedule}
      />
      <SheetActionRow icon={<PencilIcon />} label="Edit" onPress={onEdit} />
      <SheetActionRow
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
      <SheetActionRow icon={<PencilIcon />} label="Edit" onPress={onEdit} />
      <SheetActionRow
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
  const { milestoneId: milestoneIdParam, dreamId: dreamIdParam } =
    useLocalSearchParams<{
      milestoneId?: string;
      dreamId?: string;
    }>();

  const [activeTab, setActiveTab] = useState<ContentTab>("quests");
  const [expandedHabitIds, setExpandedHabitIds] = useState<Set<number>>(
    () => new Set(),
  );
  const [menuHabit, setMenuHabit] = useState<BoardHabit | null>(null);
  const [menuQuest, setMenuQuest] = useState<Quest | null>(null);
  const [scheduleQuest, setScheduleQuest] = useState<Quest | null>(null);
  const [questDeleteTarget, setQuestDeleteTarget] = useState<Quest | null>(
    null,
  );
  const [milestone, setMilestone] = useState<Milestone | null>(null);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [prompt, setPrompt] = useState<PromptState>(null);
  const [celebrationVisible, setCelebrationVisible] = useState(false);
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
        setQuests([]);
        return;
      }

      setQuests(await getQuests(resolved.id));
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

  const toggleHabitExpanded = (id: number) => {
    setExpandedHabitIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const goToJourneyMap = () => {
    const dreamId =
      dreamIdParam ?? (milestone ? String(milestone.dreamId) : "");
    router.navigate({
      pathname: "/journey-map",
      params: dreamId ? { dreamId } : {},
    });
  };

  // The milestone can be closed once every quest is checked off. No quests
  // at all also counts as ready.
  const allQuestsComplete = quests.every((quest) => quest.isDone);

  const handleCompleteMilestone = async () => {
    if (!milestone) return;
    try {
      await updateMilestone(milestone.id, { status: "completed" });
      setMilestone({ ...milestone, status: "completed" });
      setCelebrationVisible(true);
    } catch (cause) {
      console.error("Failed to complete the milestone", cause);
    }
  };

  // "Add a Memory" jumps to the Memories tab with the add form open for this
  // dream, prefilled with the milestone's name. The unique addMemory value
  // makes each arrival open the form exactly once.
  const handleAddMemory = () => {
    setCelebrationVisible(false);
    router.navigate({
      pathname: "/memories",
      params: {
        addMemory: String(Date.now()),
        goalKey:
          dreamIdParam ?? (milestone ? String(milestone.dreamId) : ""),
        memoryName: milestone?.title ?? "",
      },
    });
  };

  const handleCelebrationClose = () => {
    setCelebrationVisible(false);
    goToJourneyMap();
  };

  // Every quest is an equal slice of the milestone (mirrors the dream-level
  // weighted progress in the DB).
  const milestoneProgress =
    quests.length > 0
      ? Math.round(
          (quests.filter((quest) => quest.isDone).length / quests.length) * 100,
        )
      : 0;

  const handleToggleQuest = async (quest: Quest) => {
    const nextDone = !quest.isDone;
    setQuests((current) =>
      current.map((existing) =>
        existing.id === quest.id
          ? { ...existing, isDone: nextDone }
          : existing,
      ),
    );
    try {
      await setQuestDone(quest.id, nextDone);
    } catch (cause) {
      console.error("Failed to toggle the quest", cause);
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
      } else if (prompt.kind === "editQuest") {
        await updateQuest(prompt.questId, { title: value });
      }
      await loadScreen();
    } catch (cause) {
      console.error("Failed to save the entry", cause);
    }
    setPrompt(null);
  };

  // "Do this week" clears any date, so the quest lands in the sprint board's
  // "Unscheduled this week" backlog to be planned onto a day from there.
  const handleQuestDoThisWeek = async () => {
    if (!menuQuest) return;
    setMenuQuest(null);
    try {
      await updateQuest(menuQuest.id, {
        scheduledDate: null,
        scheduledTime: null,
        isPlanned: true,
      });
      await loadScreen();
    } catch (cause) {
      console.error("Failed to move the quest to the weekly backlog", cause);
    }
  };

  const handleQuestScheduleDate = async (date: Date) => {
    if (!scheduleQuest) return;
    setScheduleQuest(null);
    try {
      await updateQuest(scheduleQuest.id, {
        scheduledDate: toDateKey(date),
        isPlanned: true,
      });
      await loadScreen();
    } catch (cause) {
      console.error("Failed to schedule the quest", cause);
    }
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

  const visibleCount = activeTab === "quests" ? quests.length : habits.length;
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
          accessibilityLabel: "Back to the journey map",
          icon: <BackIcon />,
          // Back always returns to the journey map of the milestone's dream,
          // regardless of how the quests screen was reached.
          onPress: goToJourneyMap,
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
        questsCount={quests.length}
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
          {quests.map((quest) => (
            <QuestRow
              compact={isNarrow}
              key={quest.id}
              onOpenMenu={() => setMenuQuest(quest)}
              onToggleQuest={() => handleToggleQuest(quest)}
              quest={quest}
            />
          ))}

          {quests.length === 0 ? (
            <Card style={styles.emptyCard}>
              <AppText align="center" variant="bodySmall">
                No quests yet. Add the first one to break this milestone into doable steps.
              </AppText>
            </Card>
          ) : null}

          {milestone ? (
            milestone.status === "completed" ? (
              <View style={styles.completeRow}>
                <CheckIcon color={colors.primary} size={iconSizes.md} />
                <AppText color={colors.primary} variant="button">
                  Milestone completed
                </AppText>
              </View>
            ) : allQuestsComplete ? (
              <AppButton
                icon={
                  <CheckIcon
                    color={colors.textOnPrimary}
                    size={iconSizes.md}
                  />
                }
                iconPosition="before"
                label="Milestone Complete"
                onPress={handleCompleteMilestone}
                size="lg"
                style={styles.completeButton}
              />
            ) : (
              <AppText
                align="center"
                color={colors.textMuted}
                style={styles.completeHint}
                variant="bodySmall"
              >
                To complete this milestone, complete all of its quests.
              </AppText>
            )
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
        hint={
          prompt?.kind === "quest"
            ? "Big quest? Split it into smaller ones — each finished quest moves your milestone forward."
            : undefined
        }
        initialValue={
          prompt?.kind === "editQuest" ? prompt.initialValue : ""
        }
        onClose={() => setPrompt(null)}
        onSubmit={handlePromptSubmit}
        placeholder="Quest title..."
        submitLabel={prompt?.kind === "editQuest" ? "Save" : "Add"}
        title={prompt?.kind === "editQuest" ? "Edit quest" : "Add a quest"}
        visible={prompt !== null}
      />

      <QuestActionSheet
        onClose={() => setMenuQuest(null)}
        onDelete={() => {
          setQuestDeleteTarget(menuQuest);
          setMenuQuest(null);
        }}
        onDoThisWeek={handleQuestDoThisWeek}
        onEdit={() => {
          if (menuQuest) {
            setPrompt({
              kind: "editQuest",
              questId: menuQuest.id,
              initialValue: menuQuest.title,
            });
          }
          setMenuQuest(null);
        }}
        onSchedule={() => {
          setScheduleQuest(menuQuest);
          setMenuQuest(null);
        }}
        quest={menuQuest}
      />

      {scheduleQuest ? (
        <DatePickerModal
          initialDate={
            scheduleQuest.scheduledDate
              ? new Date(`${scheduleQuest.scheduledDate}T12:00:00`)
              : new Date()
          }
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
          “{questDeleteTarget?.title}” will be removed.
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
        onClose={() => setCelebrationVisible(false)}
        visible={celebrationVisible}
      >
        <Image
          contentFit="contain"
          source={MILESTONE_DOOR_SOURCE}
          style={styles.celebrationImage}
        />
        <AppText align="center" variant="title">
          Milestone Complete!
        </AppText>
        <AppText
          align="center"
          style={styles.celebrationSubtitle}
          variant="bodySerif"
        >
          You&rsquo;ve completed {milestone?.title}
        </AppText>
        <AppText
          align="center"
          color={colors.primary}
          style={styles.celebrationHint}
          variant="caption"
        >
          Take a moment to capture what changed.
        </AppText>
        <AppButton
          icon={<MemoryGlyph />}
          iconPosition="before"
          label="Add a Memory"
          onPress={handleAddMemory}
          size="lg"
          style={styles.celebrationButton}
        />
        <AppButton
          label="Close"
          onPress={handleCelebrationClose}
          style={styles.celebrationCloseButton}
          variant="secondary"
        />
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
  celebrationButton: {
    marginTop: spacing.lg,
  },
  celebrationCloseButton: {
    marginTop: spacing.md,
  },
  celebrationHint: {
    marginTop: spacing.md,
  },
  celebrationImage: {
    alignSelf: "center",
    height: 150,
    marginBottom: spacing.sm,
    width: 220,
  },
  celebrationSubtitle: {
    marginTop: spacing.sm,
  },
  completeButton: {
    marginTop: spacing.lg,
  },
  completeHint: {
    marginTop: spacing.lg,
  },
  completeRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "center",
    marginTop: spacing.lg,
    minHeight: controls.button.section.height,
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
  promptHint: {
    marginTop: spacing.lg,
  },
  promptInput: {
    marginTop: spacing.lg,
  },
  questCard: {
    borderColor: "rgba(246, 232, 200, 0.18)",
    marginBottom: spacing.md,
    overflow: "hidden",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  questCardCompact: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
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
});
