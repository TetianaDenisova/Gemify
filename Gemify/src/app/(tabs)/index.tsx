import { Image } from "expo-image";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback } from "react";
import { StyleSheet, View } from "react-native";

import { GoalCard, HomeHeader, TodayProgressCard } from "@/components/home";
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

const NEXT_MOVE_ART = require("../../../assets/create-goal/walk_road.png");

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
  const { blocks, totalQuests, completedQuests, toggleQuest } =
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
  const currentBlock = focusBlock
    ? { ...focusBlock, actions: [...questActions, ...habitActions] }
    : focusBlock;

  // Today's progress counts the sprint quests plus today's planned habits.
  const habitsDone = habitActions.filter((action) => action.done).length;
  const totalActions = totalQuests + habitActions.length;
  const completedActions = completedQuests + habitsDone;

  return (
    <ScreenScaffold
      // No progress footer on a day with nothing planned.
      footer={
        totalActions > 0 ? (
          <TodayProgressCard
            completedActions={completedActions}
            totalActions={totalActions}
          />
        ) : undefined
      }
      tabClearance
      topInset
    >
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
        title="CURRENT FOCUS"
        variant="eyebrow"
      />

      {currentBlock && currentBlock.actions.length > 0 ? (
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
      ) : (
        <Card style={[styles.currentBlock, styles.nextMoveCard]}>
          <View style={styles.nextMoveArtFrame}>
            <Image
              contentFit="cover"
              source={NEXT_MOVE_ART}
              style={styles.nextMoveArt}
            />
          </View>
          <View style={styles.nextMoveCopy}>
            <AppText variant="titleSm">
              Your next move is waiting{" "}
              <AppText color={colors.primary} variant="titleSm">
                ✦
              </AppText>
            </AppText>
            <AppText
              color={colors.textSecondary}
              style={styles.nextMoveSubtitle}
              variant="body"
            >
              Choose a few actions to move your goal forward.
            </AppText>
          </View>
          <AppButton
            icon={<ArrowRightIcon size={20} />}
            label="Plan my week"
            onPress={() => router.push("/sprint")}
            style={styles.nextMoveButton}
            variant="secondary"
          />
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
    height: "100%",
    width: "100%",
  },
  /** Walk-road art on the left, framed like the Today's-progress portal art. */
  nextMoveArtFrame: {
    borderColor: colors.borderSoft,
    borderRadius: 10,
    borderWidth: 1,
    height: 96,
    overflow: "hidden",
    width: 96,
  },
  nextMoveButton: {
    backgroundColor: colors.transparent,
    borderRadius: radius.round,
  },
  nextMoveCard: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  nextMoveCopy: {
    flex: 1,
    minWidth: 200,
  },
  nextMoveSubtitle: {
    marginTop: spacing.xs,
  },
});
