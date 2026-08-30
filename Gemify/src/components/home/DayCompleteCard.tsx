import { Image } from "expo-image";
import { StyleSheet, View, useWindowDimensions } from "react-native";

import { AppText, SparkIcon } from "@/shared/components";
import { colors } from "@/theme/colors";
import { layout, radius, spacing } from "@/theme/theme";

// Floating-island night art cropped from the dream backgrounds set; its edges
// fade to the same near-black navy as the card backing, so it bleeds off the
// left edge seamlessly.
const ISLAND_ART = require("../../../assets/images/day-complete-island.png");
const ISLAND_ASPECT_RATIO = 882 / 809;

/** Solid backing matched to the art's near-black edges (same as GoalCard). */
const ART_BACKING = "#01030E";

interface DayCompleteCardProps {
  /** 0..100 — dream % today's completed quests earned; the line hides at 0. */
  gainedPercent: number;
  /** e.g. "Every quest so far is complete." */
  subtitle: string;
}

/**
 * Celebration shown in the Current Focus slot once every quest scheduled so
 * far today is checked off: the floating-island art on the left, "You did it"
 * and the gold dream % those quests earned on the right.
 */
export function DayCompleteCard({
  gainedPercent,
  subtitle,
}: DayCompleteCardProps) {
  const { width } = useWindowDimensions();
  const compact = width < layout.compactBreakpoint;
  const artHeight = compact ? 168 : 220;

  return (
    <View style={styles.card}>
      <Image
        contentFit="cover"
        source={ISLAND_ART}
        style={{
          height: artHeight,
          width: Math.round(artHeight * ISLAND_ASPECT_RATIO),
        }}
      />
      <View style={styles.copy}>
        <View style={styles.titleRow}>
          <AppText variant="screenTitle">You did it !</AppText>
          <SparkIcon color={colors.primary} size={20} />
        </View>
        {gainedPercent > 0 ? (
          <AppText
            color={colors.textSecondary}
            style={styles.gainLine}
            variant="body"
          >
            <AppText color={colors.primary} variant="cardTitle">
              +{Math.max(1, Math.round(gainedPercent))}%
            </AppText>{" "}
            closer to your dream today
          </AppText>
        ) : null}
        <AppText
          color={colors.textSecondary}
          style={styles.subtitle}
          variant="bodySmall"
        >
          {subtitle}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: "center",
    backgroundColor: ART_BACKING,
    borderColor: colors.borderSoft,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: "row",
    overflow: "hidden",
  },
  copy: {
    flex: 1,
    // The art's right fifth is dark mist — the copy tucks over it so text
    // gets room on compact phones without shrinking the island.
    marginLeft: -spacing.xl,
    minWidth: 0,
    paddingRight: spacing.lg,
    paddingVertical: spacing.lg,
  },
  gainLine: {
    marginTop: spacing.md,
  },
  subtitle: {
    marginTop: spacing.sm,
  },
  titleRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
});
