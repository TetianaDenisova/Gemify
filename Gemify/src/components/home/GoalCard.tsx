import { Image } from "expo-image";
import { StyleSheet, Text, View } from "react-native";

import type { Goal, GoalIconKey, ThemeColor } from "@/data/homeData";
import { goalImages } from "@/data/images";
import { colors } from "@/theme/colors";

import { GoalProgressBar } from "./GoalProgressBar";
import { GoalProgressRing } from "./GoalProgressRing";

interface GoalCardProps {
  goal: Goal;
}

const absoluteFill = {
  bottom: 0,
  height: "100%" as const,
  left: 0,
  position: "absolute" as const,
  right: 0,
  top: 0,
  width: "100%" as const,
};

function getThemeColor(themeColor: ThemeColor) {
  return themeColor === "gold" ? colors.gold : colors.purple;
}

function getIconSymbol(iconKey: GoalIconKey) {
  switch (iconKey) {
    case "spark":
      return "✦";
    case "lotus":
      return "♧";
    case "mountains":
      return "△";
  }
}

export function GoalCard({ goal }: GoalCardProps) {
  const accentColor = getThemeColor(goal.themeColor);

  return (
    <View style={styles.card}>
      <Image
        source={goalImages[goal.imageKey]}
        style={styles.backgroundImage}
        contentFit="cover"
        transition={180}
      />

      <View style={styles.darkOverlay} />
      <View style={styles.leftFade} />

      <View style={styles.inner}>
        <View style={styles.topRow}>
          <View style={[styles.iconCircle, { borderColor: accentColor }]}>
            <View style={[styles.iconGlow, { backgroundColor: accentColor }]} />
            <Text style={[styles.icon, { color: accentColor }]}>
              {getIconSymbol(goal.iconKey)}
            </Text>
          </View>

          <View style={styles.titleBlock}>
            <Text style={styles.title} numberOfLines={2}>
              {goal.title}
            </Text>

            <Text style={[styles.milestone, { color: accentColor }]}>
              ⚑ Milestone: {goal.milestone}
            </Text>
          </View>

        </View>

        <View style={styles.bottomContent}>
          <View style={styles.progressContent}>
            <GoalProgressBar
              progressPercent={goal.progressPercent}
              themeColor={goal.themeColor}
            />

            <Text style={styles.taskCount}>
              {goal.completedTasks} of {goal.totalTasks} tasks completed
            </Text>
          </View>

          <GoalProgressRing
            progressPercent={goal.progressPercent}
            themeColor={goal.themeColor}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    ...absoluteFill,
    zIndex: 0,
  },

  card: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 15,
    borderWidth: 1,
    height: 132,
    marginBottom: 8,
    overflow: "hidden",
    position: "relative",
  },

  darkOverlay: {
    ...absoluteFill,
    backgroundColor: "rgba(4, 6, 15, 0.34)",
    zIndex: 1,
  },

  leftFade: {
    bottom: 0,
    left: 0,
    position: "absolute",
    top: 0,
    width: "62%",
    backgroundColor: "rgba(4, 6, 15, 0.58)",
    zIndex: 2,
  },

  inner: {
    flex: 1,
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    zIndex: 3,
  },

  topRow: {
    alignItems: "center",
    flexDirection: "row",
  },

  iconCircle: {
    alignItems: "center",
    height: 52,
    justifyContent: "center",
    marginRight: 14,
    overflow: "hidden",
    width: 52,
  },

  iconGlow: {
    borderRadius: 999,
    height: 34,
    opacity: 0.18,
    position: "absolute",
    width: 34,
  },

  icon: {
    fontSize: 27,
    fontWeight: "700",
    lineHeight: 31,
  },

  titleBlock: {
    flex: 1,
    paddingRight: 12,
  },

  title: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: "700",
    lineHeight: 22,
  },

  milestone: {
    fontSize: 10,
    fontWeight: "500",
    lineHeight: 13,
    marginTop: 7,
  },

  bottomContent: {
    alignItems: "flex-end",
    flexDirection: "row",
    justifyContent: "space-between",
  },

  progressContent: {
    flex: 1,
    paddingRight: 16,
  },

  taskCount: {
    color: colors.textSecondary,
    fontSize: 10,
    lineHeight: 13,
    marginTop: 8,
  },
});
