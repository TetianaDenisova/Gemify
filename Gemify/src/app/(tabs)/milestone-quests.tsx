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
import Svg, { Path } from "react-native-svg";

import {
  HabitBoardRow,
  toBoardHabit,
  type BoardHabit,
} from "@/components/HabitBoardCard";
import {
  AcceptQuestModal,
  ActionSheet,
  QuestActionSheet,
  SheetActionRow,
  TextPromptModal,
  TIME_SLOTS,
  WEEKDAY_LABELS,
} from "@/components/QuestActions";
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
  AppModal,
  ConfirmDialog,
  AppText,
  BackIcon,
  BulbIcon,
  CalendarIcon,
  Card,
  CheckIcon,
  Checkbox,
  CloseIcon,
  DotsIcon,
  ImageIcon,
  PencilIcon,
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

/**
 * Human caption for an accepted quest's schedule, e.g. "Today · After work"
 * or "Wed 28 · Morning". Falls back to "This week" for planned quests with
 * no date yet.
 */
function scheduleLabel(quest: Quest): string {
  if (!quest.scheduledDate) return "This week";

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  let dayLabel: string;
  if (quest.scheduledDate === toDateKey(today)) {
    dayLabel = "Today";
  } else if (quest.scheduledDate === toDateKey(tomorrow)) {
    dayLabel = "Tomorrow";
  } else {
    const date = new Date(`${quest.scheduledDate}T12:00:00`);
    const weekday = WEEKDAY_LABELS[date.getDay()];
    dayLabel = `${weekday[0]}${weekday.slice(1).toLowerCase()} ${date.getDate()}`;
  }

  const slot = TIME_SLOTS.find((entry) => entry.time === quest.scheduledTime);
  return `${dayLabel} · ${slot?.label ?? quest.scheduledTime}`;
}

const QUEST_ICON_VARIANT_COUNT = 4;

/** Ornamental spark for quest rows — four hand-drawn variants. */
function QuestSparkIcon({
  color = colors.primary,
  variant,
}: {
  color?: string;
  variant: number;
}) {
  const safeVariant =
    ((variant % QUEST_ICON_VARIANT_COUNT) + QUEST_ICON_VARIANT_COUNT) %
    QUEST_ICON_VARIANT_COUNT;

  switch (safeVariant) {
    case 0:
      return (
        <Svg height={30} viewBox="0 0 32 32" width={30}>
          <Path
            d="M16 3c1.9 7.1 5.9 11.1 13 13-7.1 1.9-11.1 5.9-13 13-1.9-7.1-5.9-11.1-13-13 7.1-1.9 11.1-5.9 13-13Z"
            fill="none"
            stroke={color}
            strokeLinejoin="round"
            strokeWidth={1.9}
          />
        </Svg>
      );
    case 1:
      return (
        <Svg height={30} viewBox="0 0 32 32" width={30}>
          <Path
            d="M15 6c1.6 6 4.7 9.1 10.5 10.5C19.7 17.9 16.6 21 15 27c-1.6-6-4.7-9.1-10.5-10.5C10.3 15.1 13.4 12 15 6Z"
            fill="none"
            stroke={color}
            strokeLinejoin="round"
            strokeWidth={1.9}
          />
          <Path
            d="m25.5 3.5.9 2.5 2.6.9-2.6.9-.9 2.5-.9-2.5-2.5-.9 2.5-.9.9-2.5Z"
            fill={color}
          />
        </Svg>
      );
    case 2:
      return (
        <Svg height={30} viewBox="0 0 32 32" width={30}>
          <Path
            d="M16 4v6M16 22v6M4 16h6M22 16h6"
            fill="none"
            stroke={color}
            strokeLinecap="round"
            strokeWidth={1.9}
          />
          <Path
            d="m16 10 6 6-6 6-6-6 6-6Z"
            fill="none"
            stroke={color}
            strokeLinejoin="round"
            strokeWidth={1.9}
          />
        </Svg>
      );
    default:
      return (
        <Svg height={30} viewBox="0 0 32 32" width={30}>
          <Path
            d="M16.5 5c2 6.4 5.2 9.6 11 11.5-5.8 1.9-9 5.1-11 11.5-2-6.4-5.2-9.6-11-11.5 5.8-1.9 9-5.1 11-11.5Z"
            fill={color}
          />
          <Path d="m6 4 .7 2 2 .7-2 .7L6 9.4l-.7-2-2-.7 2-.7L6 4Z" fill={color} />
        </Svg>
      );
  }
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
 * One flat row per quest: spark · title · trailing state. A fresh quest shows
 * an ACCEPT pill (opens the accept modal); an accepted one turns violet,
 * captions its schedule ("Today · After work") and shows an ACCEPTED tag; a
 * done one shows a checked circle that un-dones. Tapping the row body opens
 * the action sheet.
 */
function QuestRow({
  compact,
  onAccept,
  onOpenMenu,
  onToggleQuest,
  quest,
}: {
  compact: boolean;
  onAccept: () => void;
  onOpenMenu: () => void;
  onToggleQuest: () => void;
  quest: Quest;
}) {
  // Stable pseudo-random pick so each quest keeps its spark across renders.
  const iconVariant = (quest.id * 31 + 7) % QUEST_ICON_VARIANT_COUNT;
  const isAccepted = quest.isPlanned && !quest.isDone;

  return (
    <Card style={[styles.questCard, compact && styles.questCardCompact]}>
      {/* The trailing control is a sibling of the row pressable, not a child —
          nested <button> elements are invalid HTML on web. */}
      <View style={styles.questRow}>
        <Pressable
          accessibilityLabel={`Options for the quest ${quest.title}`}
          accessibilityRole="button"
          onPress={onOpenMenu}
          style={({ pressed: isPressed }) => [
            styles.questRowBody,
            isPressed && pressed,
          ]}
        >
          <QuestSparkIcon color={colors.primary} variant={iconVariant} />
          <View style={styles.questCopy}>
            <AppText numberOfLines={2} variant="cardTitle">
              {quest.title}
            </AppText>
            {isAccepted ? (
              <View style={styles.questScheduleRow}>
                <CalendarIcon color={colors.primary} size={iconSizes.sm} />
                <AppText color={colors.primary} variant="labelStrong">
                  {scheduleLabel(quest)}
                </AppText>
              </View>
            ) : null}
          </View>
        </Pressable>
        {quest.isDone ? (
          <Pressable
            accessibilityLabel="Mark the quest as not done"
            accessibilityRole="checkbox"
            accessibilityState={{ checked: true }}
            hitSlop={8}
            onPress={onToggleQuest}
          >
            <Checkbox appearance="outline" checked shape="circle" size={44} />
          </Pressable>
        ) : isAccepted ? (
          <View style={styles.acceptedTag}>
            <View style={styles.acceptedDot} />
            <AppText
              color={colors.textMuted}
              style={styles.acceptPillLabel}
              variant="captionStrong"
            >
              ACCEPTED
            </AppText>
          </View>
        ) : (
          <Pressable
            accessibilityLabel={`Accept the quest ${quest.title}`}
            accessibilityRole="button"
            hitSlop={8}
            onPress={onAccept}
            style={({ pressed: isPressed }) => [
              styles.acceptPill,
              isPressed && pressed,
            ]}
          >
            <AppText
              color={colors.primary}
              style={styles.acceptPillLabel}
              variant="captionStrong"
            >
              ACCEPT
            </AppText>
          </Pressable>
        )}
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
      <SheetActionRow
        icon={
          <PencilIcon size={iconSizes.lg} strokeWidth={1.7} variant="detailed" />
        }
        label="Edit"
        onPress={onEdit}
      />
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
  const [acceptQuest, setAcceptQuest] = useState<Quest | null>(null);
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

  // Accepting a quest schedules it onto the chosen day (and representative
  // time) so it shows up in the weekly plan.
  const handleAcceptQuest = async (date: string, time: string | null) => {
    if (!acceptQuest) return;
    setAcceptQuest(null);
    try {
      await updateQuest(acceptQuest.id, {
        scheduledDate: date,
        scheduledTime: time,
        isPlanned: true,
      });
      await loadScreen();
    } catch (cause) {
      console.error("Failed to accept the quest", cause);
    }
  };

  const handleMenuCompleteNow = async () => {
    if (!menuQuest) return;
    setMenuQuest(null);
    try {
      await setQuestDone(menuQuest.id, true);
      await loadScreen();
    } catch (cause) {
      console.error("Failed to complete the quest", cause);
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
              onAccept={() => setAcceptQuest(quest)}
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
                  <DotsIcon color={colors.textSecondary} size={iconSizes.md} />
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
        onCompleteNow={handleMenuCompleteNow}
        onSchedule={() => {
          setAcceptQuest(menuQuest);
          setMenuQuest(null);
        }}
        onDelete={() => {
          setQuestDeleteTarget(menuQuest);
          setMenuQuest(null);
        }}
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
        quest={menuQuest}
      />

      {acceptQuest ? (
        <AcceptQuestModal
          key={acceptQuest.id}
          onAccept={handleAcceptQuest}
          onClose={() => setAcceptQuest(null)}
        />
      ) : null}

      <ConfirmDialog
        body={`“${questDeleteTarget?.title}” will be removed.`}
        onCancel={() => setQuestDeleteTarget(null)}
        onConfirm={handleDeleteQuestConfirmed}
        title="Delete this quest?"
        visible={questDeleteTarget !== null}
      />

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
          icon={<ImageIcon color={colors.textOnPrimary} />}
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
  acceptedDot: {
    backgroundColor: colors.textMuted,
    borderRadius: radius.round,
    height: 7,
    width: 7,
  },
  acceptedTag: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  acceptPill: {
    alignItems: "center",
    borderColor: colors.border,
    borderRadius: radius.round,
    borderWidth: 1.5,
    justifyContent: "center",
    minHeight: 44,
    paddingHorizontal: spacing.lg,
  },
  acceptPillLabel: {
    fontSize: fontSizes.sm,
    letterSpacing: 1.8,
    lineHeight: lineHeights.sm,
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
  questRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.lg,
  },
  questRowBody: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: spacing.lg,
    minWidth: 0,
  },
  questScheduleRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.xs,
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
