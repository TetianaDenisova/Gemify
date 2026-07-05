import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";

import {
  CurrentFocusCard,
  GoalCard,
  HomeHeader,
  SectionTitle,
} from "@/components/home";
import type { Goal } from "@/data/homeData";
import { homeData } from "@/data/homeData";
import { colors } from "@/theme/colors";
import { radius, shadows, spacing, typography } from "@/theme/theme";

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

  function handleGoalPress(goal: Goal) {
    console.log("Opening journey map for goal", goal);
    router.push("/journey-map");
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
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

        {homeData.currentFocus.map((item) => (
          <CurrentFocusCard key={item.id} item={item} />
        ))}
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
    height: 36,
    justifyContent: "center",
    overflow: "hidden",
    paddingHorizontal: 12,
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
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  content: {
    paddingBottom: 96,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
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
