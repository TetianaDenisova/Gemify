import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Pressable, StyleSheet, View } from "react-native";

import type { Goal, ThemeColor } from "@/data/homeTypes";
import { goalIcons } from "@/data/icons";
import { goalImages } from "@/data/images";
import { AppText, ProgressRing } from "@/shared/components";
import { colors } from "@/theme/colors";
import { pressed, radius, shadows, spacing } from "@/theme/theme";

interface GoalCardProps {
  goal: Goal;
  onPress?: (goal: Goal) => void;
}

/**
 * Left-to-right shade over the goal art: dark under the icon/title so the
 * copy reads, thinning out so the artwork glows on the right (the same
 * treatment as the milestone hero and the plan-week card).
 */
const GOAL_SHADE = [
  "rgba(4, 7, 17, 0.96)",
  "rgba(4, 7, 17, 0.72)",
  "rgba(4, 7, 17, 0.16)",
] as const;

/**
 * The dream art is ultra-wide (~2.4:1) with the glowing subject on the right,
 * so it anchors right at full card height instead of covering (which would
 * crop the spires). The card backing matches the art's near-black left edge,
 * making the hand-off invisible under the shade.
 */
const ART_ASPECT_RATIO = 2.4;
const ART_BACKING = "#01030E";

/**
 * Fixed right-hand column reserved for the progress ring; it sizes the scrim
 * below so the ring area darkens just enough for the percentage to read.
 */
const RING_SIZE = 50;
const RING_EDGE_GAP = spacing.md;
const ART_RING_GAP = 14;
const RING_COLUMN_WIDTH = RING_SIZE + RING_EDGE_GAP + ART_RING_GAP;

/**
 * Soft scrim under the progress column. The art runs edge to edge, so this
 * only dims the ring area for readability — it must never go opaque, or it
 * swallows the glowing subject that sits on the art's right side.
 */
const SEAM_SHADE = [
  "rgba(1, 3, 14, 0)",
  "rgba(1, 3, 14, 0.32)",
  "rgba(1, 3, 14, 0.7)",
] as const;

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
          stays on the journey map, not the home list. The art bleeds to the
          card's right edge; the seam scrim keeps the ring readable over it. */}
      <View style={styles.artContainer}>
        <Image
          source={goalImages[goal.imageKey]}
          style={styles.backgroundImage}
          contentFit="cover"
          transition={180}
        />
      </View>

      <LinearGradient
        colors={GOAL_SHADE}
        end={{ x: 1, y: 0.5 }}
        start={{ x: 0, y: 0.5 }}
        style={styles.shade}
      />

      <LinearGradient
        colors={SEAM_SHADE}
        end={{ x: 1, y: 0.5 }}
        start={{ x: 0, y: 0.5 }}
        style={styles.seamShade}
      />

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

        <View style={styles.progressColumn}>
          <ProgressRing
            backgroundColor={colors.surfaceDeep}
            color={accentColor}
            label={notStarted ? "✦" : undefined}
            labelColor={accentColor}
            size={RING_SIZE}
            strokeWidth={2}
            value={goal.progressPercent}
          />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  artContainer: {
    bottom: 0,
    left: 0,
    overflow: "hidden",
    position: "absolute",
    right: 0,
    top: 0,
    zIndex: 0,
  },

  backgroundImage: {
    aspectRatio: ART_ASPECT_RATIO,
    bottom: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },

  card: {
    backgroundColor: ART_BACKING,
    borderColor: colors.borderSoft,
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: spacing.sm,
    minHeight: 132,
    overflow: "hidden",
    position: "relative",
    ...shadows.softDark,
  },

  shade: {
    ...absoluteFill,
    zIndex: 1,
  },

  seamShade: {
    bottom: 0,
    position: "absolute",
    right: 0,
    top: 0,
    width: RING_COLUMN_WIDTH + 56,
    zIndex: 2,
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

  progressColumn: {
    alignItems: "center",
    justifyContent: "center",
    width: RING_SIZE,
  },
});
