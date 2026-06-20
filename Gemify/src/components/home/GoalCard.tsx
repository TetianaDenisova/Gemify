import { StyleSheet, Text, View } from "react-native";

import type { Goal, GoalIconKey, GoalImageKey, ThemeColor } from "@/data/homeData";
import { colors } from "@/theme/colors";

import { GoalProgressBar } from "./GoalProgressBar";
import { GoalProgressRing } from "./GoalProgressRing";

interface GoalCardProps {
  goal: Goal;
}

function getThemeColor(themeColor: ThemeColor) {
  return themeColor === "gold" ? colors.gold : colors.purple;
}

function getIconSymbol(iconKey: GoalIconKey) {
  switch (iconKey) {
    case "spark":
      return "✦";
    case "lotus":
      return "✧";
    case "mountains":
      return "△";
  }
}

function getImagePlaceholderStyle(imageKey: GoalImageKey) {
  switch (imageKey) {
    case "mountain_sunrise":
      return styles.mountainSunrise;
    case "sailboat_sunset":
      return styles.sailboatSunset;
    case "balloon_mountains":
      return styles.balloonMountains;
  }
}

export function GoalCard({ goal }: GoalCardProps) {
  const accentColor = getThemeColor(goal.themeColor);

  return (
    <View style={styles.card}>
      <View style={[styles.visual, getImagePlaceholderStyle(goal.imageKey)]}>
        <View style={styles.horizon} />
        <View style={[styles.glow, { backgroundColor: accentColor }]} />
        <Text style={[styles.icon, { color: accentColor }]}>
          {getIconSymbol(goal.iconKey)}
        </Text>
      </View>

      <View style={styles.content}>
        <View style={styles.titleRow}>
          <View style={styles.titleBlock}>
            <Text style={styles.title}>{goal.title}</Text>
            <Text style={styles.milestone}>{goal.milestone}</Text>
          </View>
          <GoalProgressRing
            progressPercent={goal.progressPercent}
            themeColor={goal.themeColor}
          />
        </View>

        <GoalProgressBar
          progressPercent={goal.progressPercent}
          themeColor={goal.themeColor}
        />
        <Text style={styles.taskCount}>
          {goal.completedTasks} of {goal.totalTasks} tasks completed
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  balloonMountains: {
    backgroundColor: "#27183f",
  },
  card: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 16,
    overflow: "hidden",
  },
  content: {
    padding: 18,
  },
  glow: {
    borderRadius: 999,
    height: 74,
    opacity: 0.24,
    position: "absolute",
    right: 28,
    top: 20,
    width: 74,
  },
  horizon: {
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    borderRadius: 999,
    bottom: 24,
    height: 44,
    left: -18,
    position: "absolute",
    right: -18,
  },
  icon: {
    fontSize: 34,
    fontWeight: "800",
    position: "absolute",
    right: 28,
    top: 24,
  },
  milestone: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
  },
  mountainSunrise: {
    backgroundColor: "#312615",
  },
  sailboatSunset: {
    backgroundColor: "#191a3d",
  },
  taskCount: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 10,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 19,
    fontWeight: "800",
    letterSpacing: 0,
    lineHeight: 25,
  },
  titleBlock: {
    flex: 1,
    paddingRight: 16,
  },
  titleRow: {
    alignItems: "center",
    flexDirection: "row",
    marginBottom: 16,
  },
  visual: {
    height: 118,
    position: "relative",
  },
});
