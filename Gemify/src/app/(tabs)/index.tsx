import { useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";

import { GoalCard, HomeHeader, TodayProgressCard } from "@/components/home";
import { TimeBlockCard } from "@/components/TimeBlockCard";
import type { Goal, GoalIconKey, GoalImageKey, ThemeColor } from "@/data/homeData";
import { homeData } from "@/data/homeData";
import { getCurrentTimeBlockKey } from "@/data/timeBlocks";
import type { DreamSummary } from "@/db";
import { useDreamSummaries } from "@/hooks/useDreamSummaries";
import { useTimeBlocks } from "@/hooks/useTimeBlocks";
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
    milestone: dream.currentMilestone ?? "—",
    completedTasks: dream.completedTasks,
    totalTasks: dream.totalTasks,
    progressPercent: dream.progressPercent,
    ...visuals,
  };
}

export default function HomeScreen() {
  const router = useRouter();
  const today = todayKey();
  const { dreams, loading } = useDreamSummaries();
  const { blocks, totalActions, completedActions, toggleAction } =
    useTimeBlocks(today);

  const currentBlockKey = getCurrentTimeBlockKey(new Date());
  const currentBlock =
    blocks.find((block) => block.key === currentBlockKey) ?? blocks[0];

  return (
    <ScreenScaffold tabClearance topInset>
      <HomeHeader
        greeting={homeData.header.greeting}
        subtitle={homeData.header.subtitle}
      />

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

      {currentBlock ? (
        <TimeBlockCard
          block={currentBlock}
          onToggleAction={(index) => {
            const action = currentBlock.actions[index];
            if (action) toggleAction(action.id, !action.done);
          }}
          showHeader={false}
          showIntro={false}
          style={styles.currentBlock}
        />
      ) : null}

      <TodayProgressCard
        completedActions={completedActions}
        totalActions={totalActions}
      />
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
