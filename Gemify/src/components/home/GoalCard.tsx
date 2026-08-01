import { Image } from "expo-image";
import { Pressable, StyleSheet, View } from "react-native";

import type { Goal, ThemeColor } from "@/data/homeData";
import { goalIcons } from "@/data/icons";
import { goalImages } from "@/data/images";
import { AppText, ProgressBar, ProgressRing } from "@/shared/components";
import { colors } from "@/theme/colors";
import { pressed, radius, shadows, spacing } from "@/theme/theme";

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
      style={({ pressed: isPressed }) => [styles.card, isPressed && pressed]}
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
            <AppText numberOfLines={2} style={styles.title} variant="title">
              {goal.title}
            </AppText>

            <AppText color={accentColor} style={styles.milestone} variant="caption">
              ⚑ Milestone: {goal.milestone}
            </AppText>
          </View>
        </View>

        <View style={styles.bottomContent}>
          <View style={styles.progressContent}>
            <ProgressBar
              color={accentColor}
              height={3}
              value={goal.progressPercent}
            />

            <AppText
              color={colors.textSecondary}
              style={styles.taskCount}
              variant="caption"
            >
              {goal.completedTasks} of {goal.totalTasks} tasks completed
            </AppText>
          </View>

          <ProgressRing
            backgroundColor={colors.surfaceGlass}
            color={accentColor}
            labelColor={accentColor}
            size={48}
            strokeWidth={2}
            value={goal.progressPercent}
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
    fontSize: 20,
    letterSpacing: -0.3,
    lineHeight: 22,
  },

  milestone: {
    fontSize: 10,
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
    fontSize: 10,
    lineHeight: 13,
    marginTop: spacing.sm,
  },
});
