import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback } from "react";
import { StyleSheet, View } from "react-native";

import { DayCompleteCard, GoalCard, HomeHeader } from "@/components/home";
import { TimeBlockCard } from "@/components/TimeBlockCard";
import type { Goal, GoalIconKey, GoalImageKey, ThemeColor } from "@/data/homeData";
import { rolloverOverdueQuests, type DreamSummary } from "@/db";
import type { ActionIcon } from "@/dto/timeBlocks";
import { currentBlockKey, useDayQuestBlocks } from "@/hooks/useDayQuestBlocks";
import { useDreamSummaries } from "@/hooks/useDreamSummaries";
import { useHabitWeek } from "@/hooks/useHabitWeek";
import {
  AppButton,
  AppText,
  ArrowRightIcon,
  Card,
  PlusIcon,
  ScreenScaffold,
  SectionHeader,
} from "@/shared/components";
import { colors } from "@/theme/colors";
import { radius, spacing } from "@/theme/theme";
import { todayKey } from "@/utils/dates";

// Same enchanted-forest path art as the Milestone Quests hero.
const NEXT_MOVE_ART = require("../../data/images/tree-milestone-header.png");

/** Left-to-right shade so the copy reads over the art's dark edge. */
const NEXT_MOVE_SHADE = [
  "rgba(4, 7, 17, 0.98)",
  "rgba(4, 7, 17, 0.74)",
  "rgba(4, 7, 17, 0.12)",
] as const;

function greetingForNow(now: Date): string {
  const hour = now.getHours();
  if (hour < 12) return "Good morning ✦";
  if (hour < 18) return "Good afternoon ✦";
  return "Good evening ✦";
}

/** Dream-magic icon variety for habit rows, stable per habit id. */
const HABIT_ICONS: readonly ActionIcon[] = [
  "moon",
  "crystal",
  "feather",
  "star",
  "wand",
  "key",
];

const GOAL_VISUALS: readonly {
  themeColor: ThemeColor;
  imageKey: GoalImageKey;
  iconKey: GoalIconKey;
}[] = [
  { themeColor: "gold", imageKey: "mountain_sunrise", iconKey: "spark" },
  { themeColor: "purple", imageKey: "sailboat_sunset", iconKey: "lotus" },
  { themeColor: "purple", imageKey: "balloon_mountains", iconKey: "mountains" },
];

function toGoal(dream: DreamSummary, index: number): Goal {
  const visuals = GOAL_VISUALS[index % GOAL_VISUALS.length];
  return {
    id: String(dream.id),
    title: dream.title,
    progressPercent: dream.progressPercent,
    photoUri: dream.photoUri,
    ...visuals,
  };
}

export default function HomeScreen() {
  const router = useRouter();
  const today = todayKey();
  const { dreams, loading } = useDreamSummaries();
  const { blocks, completedQuests, toggleQuest, totalQuests } =
    useDayQuestBlocks(today);

  const { habits: habitViews, setCompletion } = useHabitWeek();

  // Quests scheduled before today that never got done roll back into the
  // weekly backlog, so yesterday's leftovers wait under "Unscheduled this
  // week" on the Weekly Plan instead of silently staying on past days.
  useFocusEffect(
    useCallback(() => {
      rolloverOverdueQuests(today).catch((cause: unknown) => {
        console.error("Failed to roll over overdue quests", cause);
      });
    }, [today]),
  );

  // Current focus = the sprint quests scheduled into the time block that
  // matches the clock right now, plus today's Anytime (flexible) quests and
  // today's habits — always shown, ordered after the timed quests.
  const focusKey = currentBlockKey(blocks, new Date());
  const focusBlock =
    blocks.find((block) => block.key === focusKey) ?? blocks[0];
  const flexibleBlock = blocks.find((block) => block.time === "Flexible");

  // Monday-first index of today, matching the habit week arrays.
  const habitDayIndex = (new Date().getDay() + 6) % 7;
  const habitActions = habitViews
    .filter(
      (view) =>
        view.scheduleDays.length === 0 ||
        view.scheduleDays.includes(habitDayIndex),
    )
    .map((view) => ({
      done: view.weekProgress[habitDayIndex] === "done",
      habitId: view.habit.id,
      icon: HABIT_ICONS[view.habit.id % HABIT_ICONS.length],
      subtitle: view.timeLabel,
      title: view.habit.title,
    }));

  const questActions = focusBlock
    ? flexibleBlock && flexibleBlock.key !== focusBlock.key
      ? [...focusBlock.actions, ...flexibleBlock.actions]
      : focusBlock.actions
    : [];
  // Checked-off actions leave the focus list.
  const focusActions = [...questActions, ...habitActions].filter(
    (action) => !action.done,
  );
  const currentBlock = focusBlock
    ? { ...focusBlock, actions: focusActions }
    : focusBlock;

  const hasFocus = currentBlock !== undefined && currentBlock.actions.length > 0;

  // Everything planned for today (all time blocks' quests + today's habits)
  // is checked off — celebrate instead of nudging to plan.
  const habitsDone = habitActions.filter((action) => action.done).length;
  const plannedTotal = totalQuests + habitActions.length;
  const plannedDone = completedQuests + habitsDone;
  const allDone = plannedTotal > 0 && plannedDone === plannedTotal;

  // Current block clear but open quests remain elsewhere today: surface the
  // block that goes next (the nearest upcoming one, else earlier leftovers).
  const now = new Date();
  const clock = `${String(now.getHours()).padStart(2, "0")}:${String(
    now.getMinutes(),
  ).padStart(2, "0")}`;
  const openBlocks = blocks
    .filter((block) => block.actions.some((action) => !action.done))
    .map((block) => ({
      ...block,
      actions: block.actions.filter((action) => !action.done),
    }));
  const nextBlock =
    !hasFocus && !allDone
      ? (openBlocks
          .filter((block) => block.time !== "Flexible" && block.time > clock)
          .sort((a, b) => (a.time < b.time ? -1 : 1))[0] ?? openBlocks[0])
      : undefined;

  return (
    <ScreenScaffold tabClearance topInset>
      <HomeHeader greeting={greetingForNow(new Date())} />

      <SectionHeader
        action={{
          icon: <PlusIcon size={14} />,
          label: "Add Goal",
          onPress: () => router.push("/create-goal"),
        }}
        style={styles.sectionHeader}
        title="YOUR GOALS"
        variant="eyebrow"
      />

      {dreams.map((dream, index) => (
        <GoalCard
          goal={toGoal(dream, index)}
          key={dream.id}
          onPress={() =>
            router.push({
              pathname: "/journey-map",
              params: { dreamId: String(dream.id) },
            })
          }
        />
      ))}

      {!loading && dreams.length === 0 ? (
        <Card style={styles.emptyCard}>
          <AppText align="center" variant="cardTitle">
            Start your first journey
          </AppText>
          <AppText align="center" style={styles.emptyText} variant="bodySmall">
            Name the dream you want to live, and we will turn it into a path of
            milestones.
          </AppText>
          <View style={styles.emptyButton}>
            <AppButton
              label="Create a dream"
              onPress={() => router.push("/create-goal")}
              variant="primary"
            />
          </View>
        </Card>
      ) : null}

      <SectionHeader
        style={styles.sectionHeader}
        // The planning nudge only appears when nothing at all is planned for
        // today; otherwise the section names what it shows: the current
        // focus (open or complete) or the block that goes next.
        title={
          hasFocus || allDone
            ? "CURRENT FOCUS"
            : nextBlock
              ? "NEXT FOCUS"
              : "PLAN YOUR WEEK"
        }
        variant="eyebrow"
      />

      {allDone ? (
        <View style={styles.currentBlock}>
          <DayCompleteCard completed={plannedDone} total={plannedTotal} />
        </View>
      ) : hasFocus && currentBlock ? (
        <TimeBlockCard
          block={currentBlock}
          onToggleAction={(index) => {
            const action = currentBlock.actions[index];
            if (!action) return;
            if ("questId" in action) {
              toggleQuest(action.questId, !action.done);
            } else {
              setCompletion(action.habitId, today, action.done ? null : "done");
            }
          }}
          showHeader={false}
          showIntro={false}
          style={styles.currentBlock}
        />
      ) : nextBlock ? (
        <TimeBlockCard
          block={nextBlock}
          onToggleAction={(index) => {
            const action = nextBlock.actions[index];
            if (action) toggleQuest(action.questId, !action.done);
          }}
          showIntro={false}
          style={styles.currentBlock}
        />
      ) : (
        <Card padded={false} style={[styles.currentBlock, styles.nextMoveCard]}>
          <Image
            contentFit="cover"
            source={NEXT_MOVE_ART}
            style={styles.nextMoveArt}
          />
          <LinearGradient
            colors={[...NEXT_MOVE_SHADE]}
            end={{ x: 1, y: 0.5 }}
            start={{ x: 0, y: 0.5 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.nextMoveCopy}>
            <AppText color={colors.textPrimary} variant="body">
              A few focused steps can move{"\n"}your dreams forward.
            </AppText>
            <AppButton
              icon={<ArrowRightIcon size={20} />}
              label="Plan my week"
              onPress={() => router.push("/sprint")}
              style={styles.nextMoveButton}
              variant="secondary"
            />
          </View>
        </Card>
      )}
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  currentBlock: {
    marginBottom: spacing.md,
  },
  emptyButton: {
    alignItems: "center",
    marginTop: spacing.md,
  },
  emptyCard: {
    marginBottom: spacing.sm,
    paddingVertical: spacing.lg,
  },
  emptyText: {
    marginTop: spacing.sm,
  },
  sectionHeader: {
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  nextMoveArt: {
    ...StyleSheet.absoluteFill,
  },
  nextMoveButton: {
    backgroundColor: colors.transparent,
    borderRadius: radius.round,
  },
  nextMoveCard: {
    minHeight: 180,
    overflow: "hidden",
  },
  nextMoveCopy: {
    alignItems: "flex-start",
    flex: 1,
    gap: spacing.lg,
    justifyContent: "center",
    maxWidth: "68%",
    padding: spacing.lg,
    zIndex: 1,
  },
});
