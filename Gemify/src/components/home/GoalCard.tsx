import { Image } from "expo-image";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

import type { Goal, ThemeColor } from "@/data/homeData";
import { goalIcons } from "@/data/icons";
import { goalImages } from "@/data/images";
import { colors } from "@/theme/colors";
import { radius, shadows, spacing, typography } from "@/theme/theme";

import { GoalProgressBar } from "./GoalProgressBar";
import { GoalProgressRing } from "./GoalProgressRing";

interface GoalCardProps {
  goal: Goal;
  onPress?: (goal: Goal) => void;
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
  return themeColor === "gold" ? colors.primary : colors.primarySoft;
}

export function GoalCard({ goal, onPress }: GoalCardProps) {
  const accentColor = getThemeColor(goal.themeColor);

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => onPress?.(goal)}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      <Image
        source={goalImages[goal.imageKey]}
        style={styles.backgroundImage}
        contentFit="cover"
        transition={180}
      />

      <View style={styles.darkOverlay} />

      <View style={styles.inner}>
        <View style={styles.topRow}>
          <View style={styles.iconWrapper}>
            <Image
              source={goalIcons[goal.iconKey]}
              style={styles.iconImage}
              contentFit="contain"
            />
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
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    ...absoluteFill,
    zIndex: 0,
  },

  card: {
    backgroundColor: colors.surfaceGlass,
    borderColor: colors.borderSoft,
    borderRadius: radius.md,
    borderWidth: 1,
    height: 132,
    marginBottom: spacing.sm,
    overflow: "hidden",
    position: "relative",
    ...shadows.softDark,
  },

  cardPressed: {
    opacity: 0.9,
  },

  darkOverlay: {
    ...absoluteFill,
    backgroundColor: colors.overlayDark,
    zIndex: 1,
  },

  inner: {
    flex: 1,
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    zIndex: 3,
  },

  topRow: {
    alignItems: "center",
    flexDirection: "row",
  },

  iconWrapper: {
    alignItems: "center",
    height: 64,
    justifyContent: "center",
    marginRight: 6,
    width: 64,
  },

  iconImage: {
    height: 42,
    width: 42,
  },

  titleBlock: {
    flex: 1,
    paddingRight: 12,
  },

  title: {
    ...typography.title,
    fontFamily: Platform.select({
      ios: "Georgia",
      android: "serif",
      default: "serif",
    }),
    fontSize: 20,
    letterSpacing: -0.3,
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
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 10,
    lineHeight: 13,
    marginTop: 8,
  },
});
