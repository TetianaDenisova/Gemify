import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet } from "react-native";

import { GoalCard, HomeHeader, TodayProgressCard } from "@/components/home";
import { TimeBlockCard } from "@/components/TimeBlockCard";
import type { Goal } from "@/data/homeData";
import { homeData } from "@/data/homeData";
import type { TimeBlock } from "@/data/timeBlocks";
import { getCurrentTimeBlockKey, timeBlocks } from "@/data/timeBlocks";
import { PlusIcon, ScreenScaffold, SectionHeader } from "@/shared/components";
import { spacing } from "@/theme/theme";

export default function HomeScreen() {
  const router = useRouter();
  const [blocks, setBlocks] = useState<readonly TimeBlock[]>(timeBlocks);

  const currentBlockKey = getCurrentTimeBlockKey(new Date());
  const currentBlock = blocks.find((block) => block.key === currentBlockKey) ?? blocks[0];

  const totalActions = blocks.reduce((sum, block) => sum + block.actions.length, 0);
  const completedActions = blocks.reduce(
    (sum, block) => sum + block.actions.filter((action) => action.done).length,
    0,
  );

  function toggleBlockAction(index: number) {
    setBlocks((current) =>
      current.map((block) =>
        block.key === currentBlock.key
          ? {
              ...block,
              actions: block.actions.map((action, i) =>
                i === index ? { ...action, done: !action.done } : action,
              ),
            }
          : block,
      ),
    );
  }

  function handleGoalPress(goal: Goal) {
    console.log("Opening journey map for goal", goal);
    router.push("/journey-map");
  }

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

      {homeData.goals.map((goal) => (
        <GoalCard key={goal.id} goal={goal} onPress={handleGoalPress} />
      ))}

      <SectionHeader
        style={styles.sectionHeader}
        title="CURRENT FOCUS"
        variant="eyebrow"
      />

      <TimeBlockCard
        block={currentBlock}
        onToggleAction={toggleBlockAction}
        showHeader={false}
        showIntro={false}
        style={styles.currentBlock}
      />

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
  sectionHeader: {
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
});
