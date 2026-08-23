import { useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";

import { GoalCard, HomeHeader, TodayProgressCard } from "@/components/home";
import { TimeBlockCard } from "@/components/TimeBlockCard";
import type { Goal, GoalIconKey, GoalImageKey, ThemeColor } from "@/data/homeData";
import type { DreamSummary } from "@/db";
import type { ActionIcon } from "@/dto/timeBlocks";
import { currentBlockKey, useDayTaskBlocks } from "@/hooks/useDayTaskBlocks";
import { useDreamSummaries } from "@/hooks/useDreamSummaries";
import { habitTimeLabel, useHabitWeek } from "@/hooks/useHabitWeek";
import {
  AppButton,
  AppText,
  Card,
  PlusIcon,
  ScreenScaffold,
  SectionHeader,
} from "@/shared/components";
import { spacing } from "@/theme/theme";
import { todayKey } from "@/utils/dates";

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
    ...visuals,
  };
}

export default function HomeScreen() {
  const router = useRouter();
  const today = todayKey();
  const { dreams, loading } = useDreamSummaries();
  const { blocks, totalTasks, completedTasks, toggleTask } =
    useDayTaskBlocks(today);

  const { habits: habitViews, setCompletion } = useHabitWeek();

  // Current focus = the sprint tasks scheduled into the time block that
  // matches the clock right now, plus today's Anytime (flexible) tasks and
  // today's habits — always shown, ordered after the timed tasks.
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
      subtitle: habitTimeLabel(view.habit.timeOfDay),
      title: view.habit.title,
    }));

  const taskActions = focusBlock
    ? flexibleBlock && flexibleBlock.key !== focusBlock.key
      ? [...focusBlock.actions, ...flexibleBlock.actions]
      : focusBlock.actions
    : [];
  const currentBlock = focusBlock
    ? { ...focusBlock, actions: [...taskActions, ...habitActions] }
    : focusBlock;

  // Today's progress counts the sprint tasks plus today's planned habits.
  const habitsDone = habitActions.filter((action) => action.done).length;
  const totalActions = totalTasks + habitActions.length;
  const completedActions = completedTasks + habitsDone;

  return (
    <ScreenScaffold
      footer={
        <TodayProgressCard
          completedActions={completedActions}
          totalActions={totalActions}
        />
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
            if ("taskId" in action) {
              toggleTask(action.taskId, !action.done);
            } else {
              setCompletion(action.habitId, today, action.done ? null : "done");
            }
          }}
          showHeader={false}
          showIntro={false}
          style={styles.currentBlock}
        />
      ) : (
        <Card style={styles.currentBlock}>
          <AppText align="center" variant="bodySmall">
            Nothing scheduled for right now. Plan tasks in the Sprint tab and
            your current focus will appear here.
          </AppText>
          <View style={styles.emptyButton}>
            <AppButton
              label="Open Weekly Plan"
              onPress={() => router.push("/sprint")}
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
});
