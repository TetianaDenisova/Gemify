import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";

import { GoalCard, HomeHeader, SectionTitle, TodayProgressCard } from "@/components/home";
import { TimeBlockCard } from "@/components/TimeBlockCard";
import type { Goal } from "@/data/homeData";
import { homeData } from "@/data/homeData";
import type { TimeBlock } from "@/data/timeBlocks";
import { getCurrentTimeBlockKey, timeBlocks } from "@/data/timeBlocks";
import { colors } from "@/theme/colors";
import { radius, shadows, spacing, typography } from "@/theme/theme";

/** Floating tab bar height (72) plus its bottom margin and a small gap. */
const FOOTER_BOTTOM_OFFSET = 72 + spacing.sm * 2;

function AddGoalIcon() {
  return (
    <Svg fill="none" height={16} viewBox="0 0 24 24" width={16}>
      <Path
        d="M12 5v14M5 12h14"
        stroke={colors.primary}
        strokeLinecap="round"
        strokeWidth={2}
      />
    </Svg>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
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
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + FOOTER_BOTTOM_OFFSET + spacing.lg },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <HomeHeader
          greeting={homeData.header.greeting}
          subtitle={homeData.header.subtitle}
        />

        <View style={styles.goalSectionHeader}>
          <SectionTitle style={styles.goalSectionTitle} title="YOUR GOALS" />

          <View style={styles.addGoalGlow}>
            <Pressable
              accessibilityLabel="Add goal"
              accessibilityRole="button"
              hitSlop={8}
              onPress={() => router.push("/create-goal")}
              style={({ pressed }) => [
                styles.addGoalButton,
                pressed && styles.addGoalButtonPressed,
              ]}
            >
              <View pointerEvents="none" style={styles.addGoalInnerEdge} />
              <AddGoalIcon />
              <Text style={styles.addGoalText}>ADD GOAL</Text>
            </Pressable>
          </View>
        </View>

        {homeData.goals.map((goal) => (
          <GoalCard key={goal.id} goal={goal} onPress={handleGoalPress} />
        ))}

        <SectionTitle title="CURRENT FOCUS" />

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
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  addGoalButton: {
    alignItems: "center",
    backgroundColor: colors.surfaceGlass,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.xs,
    height: 40,
    justifyContent: "center",
    overflow: "hidden",
    paddingHorizontal: 14,
  },
  addGoalButtonPressed: {
    backgroundColor: colors.secondary,
    borderColor: colors.primary,
    transform: [{ scale: 0.97 }],
  },
  addGoalGlow: {
    backgroundColor: colors.surfaceGlass,
    borderRadius: radius.md,
    ...shadows.goldGlow,
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  addGoalInnerEdge: {
    ...StyleSheet.absoluteFill,
    borderColor: colors.borderSoft,
    borderRadius: radius.md,
    borderWidth: 1,
    margin: 2,
  },
  addGoalText: {
    ...typography.caption,
    color: colors.primary,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1,
    lineHeight: 16,
  },
  content: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  currentBlock: {
    marginBottom: spacing.md,
  },
  goalSectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  goalSectionTitle: {
    marginBottom: 0,
    marginTop: 0,
  },
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
});
