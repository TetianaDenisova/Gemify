import { Image } from "expo-image";
import { Pressable, StyleSheet, View } from "react-native";

import type { Goal, ThemeColor } from "@/data/homeData";
import { goalIcons } from "@/data/icons";
import { goalImages } from "@/data/images";
import { AppText, ProgressRing } from "@/shared/components";
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
  // A journey not yet started gets an invitation, never a "0%".
  const notStarted = Math.round(goal.progressPercent) === 0;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => onPress?.(goal)}
      style={({ pressed: isPressed }) => [styles.card, isPressed && pressed]}
    >
      {/* Always the preset art for the goal's slot — the user's dream photo
          stays on the journey map, not the home list. */}
      <Image
        source={goalImages[goal.imageKey]}
        style={styles.backgroundImage}
        contentFit="cover"
        transition={180}
      />

      <View style={styles.darkOverlay} />

      <View style={styles.inner}>
        <View style={styles.iconWrapper}>
          <Image
            source={goalIcons[goal.iconKey]}
            style={styles.iconImage}
            contentFit="contain"
          />
        </View>

        <View style={styles.titleBlock}>
          <AppText numberOfLines={2} variant="pill">
            {goal.title}
          </AppText>
        </View>

        <ProgressRing
          backgroundColor={colors.surfaceGlass}
          color={accentColor}
          label={notStarted ? "✦" : undefined}
          labelColor={accentColor}
          size={56}
          strokeWidth={2.5}
          value={goal.progressPercent}
        />
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
    marginBottom: spacing.sm,
    minHeight: 132,
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
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    zIndex: 3,
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
});
