import { Image } from "expo-image";
import { Pressable, StyleSheet, View } from "react-native";
import Svg, { Path } from "react-native-svg";

import { useLayoutSize } from "@/hooks/useLayoutSize";
import type { WeekAscentEntry } from "@/db";
import {
  AppText,
  Card,
  ChevronIcon,
  ProgressBar,
  SparkIcon,
} from "@/shared/components";
import { colors } from "@/theme/colors";
import { pressed, radius, spacing, textGlow } from "@/theme/theme";

const ASCENT_ART = require("../../assets/progress/road-progress.png");

function DiamondIcon({ color = colors.primary, size = 16 }: { color?: string; size?: number }) {
  return (
    <Svg height={size} viewBox="0 0 24 24" width={size}>
      <Path
        d="M12 3.5 20.5 12 12 20.5 3.5 12Z"
        fill="none"
        stroke={color}
        strokeLinejoin="round"
        strokeWidth={1.7}
      />
    </Svg>
  );
}

function formatDelta(percent: number): string {
  return `+${Math.round(percent)}%`;
}

/** The card's gold sparkle: one star with a smaller one at its heel. */
function SparkCluster({
  color = colors.primary,
  size,
}: {
  color?: string;
  size: number;
}) {
  return (
    <View style={styles.sparkCluster}>
      <SparkIcon color={color} size={size} />
      <SparkIcon color={color} size={Math.max(6, Math.round(size * 0.42))} />
    </View>
  );
}

/** Share of the expected gain already earned, 0–100. */
function earnedShare(expectedPercent: number, gainedPercent: number): number {
  return expectedPercent > 0 ? (gainedPercent / expectedPercent) * 100 : 0;
}

/**
 * Weekly Plan ascent card, pinned to the bottom of the screen: the progress
 * this week's scheduled quests promise across all dreams. Folded, it is a
 * slim one-line summary; expanded (controlled by the screen, which dims the
 * board behind it), it unwraps upward into the headline, the week's bar and
 * the per-dream breakdown. Hidden entirely while nothing is scheduled.
 */
export function WeekAscentCard({
  entries,
  expanded,
  onToggle,
}: {
  entries: WeekAscentEntry[];
  expanded: boolean;
  onToggle: () => void;
}) {
  const { phone } = useLayoutSize();

  if (entries.length === 0) {
    return null;
  }

  const expectedTotal = entries.reduce(
    (sum, entry) => sum + entry.expectedPercent,
    0,
  );
  const gainedTotal = entries.reduce(
    (sum, entry) => sum + entry.gainedPercent,
    0,
  );

  if (!expanded) {
    return (
      <Card style={styles.card}>
        <Pressable
          accessibilityLabel="Show the week's expected progress"
          accessibilityRole="button"
          onPress={onToggle}
          style={({ pressed: isPressed }) => [
            styles.compactRow,
            isPressed && pressed,
          ]}
        >
          <View style={[styles.artThumb, phone && styles.artThumbPhone]}>
            <Image contentFit="cover" source={ASCENT_ART} style={styles.art} />
          </View>
          <View style={styles.compactBody}>
            <AppText color={colors.textPrimary} variant="pill">
              Expected progress this week
            </AppText>
            <ProgressBar
              glow
              height={7}
              style={styles.compactTrack}
              value={earnedShare(expectedTotal, gainedTotal)}
            />
          </View>
          <View style={styles.compactCount}>
            <AppText
              color={colors.primary}
              variant={phone ? "titleSm" : "cardTitle"}
            >
              {formatDelta(expectedTotal)}
            </AppText>
            {/* The row title beside it already reads "Expected progress
                this week". */}
            {phone ? null : (
              <AppText
                color={colors.textMuted}
                style={styles.compactCountLabel}
                variant="captionStrong"
              >
                EXPECTED
              </AppText>
            )}
          </View>
          <ChevronIcon color={colors.textMuted} direction="down" size={16} />
        </Pressable>
      </Card>
    );
  }

  return (
    <Card style={styles.card}>
      <Pressable
        accessibilityLabel="Hide the dream breakdown"
        accessibilityRole="button"
        onPress={onToggle}
        style={({ pressed: isPressed }) => [isPressed && pressed]}
      >
        <View style={styles.headlineRow}>
          <SparkIcon color={colors.primarySoft} size={14} />
          <AppText align="center" style={styles.headline} variant="title">
            Your plan moves you{" "}
            <AppText style={styles.headlineAccent} variant="title">
              {Math.round(expectedTotal)}% closer
            </AppText>{" "}
            this week
          </AppText>
          <SparkCluster color={colors.primarySoft} size={16} />
        </View>
        {/* The bar is the promise, not the tally: it fills to the share of the
            dream this week's plan is worth. */}
        <ProgressBar
          glow
          height={14}
          style={styles.headlineTrack}
          value={Math.min(100, expectedTotal)}
        />
      </Pressable>

      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <SparkIcon color={colors.primarySoft} size={12} />
        <View style={styles.dividerLine} />
      </View>

      {entries.map((entry, index) => (
        <View
          key={entry.dreamId}
          style={[styles.dreamRow, index > 0 && styles.dreamRowDivided]}
        >
          <View style={styles.dreamHeader}>
            <SparkCluster size={phone ? 24 : 28} />
            <AppText
              numberOfLines={1}
              style={styles.dreamTitle}
              variant="titleSm"
            >
              {entry.dreamTitle}
            </AppText>
            <AppText
              color={colors.primary}
              style={styles.dreamDelta}
              variant="titleSm"
            >
              {formatDelta(entry.expectedPercent)}
            </AppText>
          </View>
          {entry.completesMilestone ? (
            <View style={styles.completesBlock}>
              <View style={styles.completesRow}>
                <DiamondIcon size={14} />
                <AppText color={colors.primary} variant="eyebrow">
                  Milestone you&rsquo;ll complete
                </AppText>
              </View>
              <AppText
                color={colors.textPrimary}
                numberOfLines={2}
                style={styles.completesTitle}
                variant="body"
              >
                {entry.completesMilestone}
              </AppText>
            </View>
          ) : null}
        </View>
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  art: {
    height: "100%",
    width: "100%",
  },
  // Full-bleed flat footer strip: square corners, solid surface, no border.
  card: {
    backgroundColor: colors.surface,
    borderRadius: 0,
    borderWidth: 0,
  },
  artThumb: {
    borderColor: colors.borderSoft,
    borderRadius: radius.md,
    borderWidth: 1,
    height: 68,
    overflow: "hidden",
    width: 68,
  },
  artThumbPhone: {
    height: 51,
    width: 51,
  },
  compactBody: {
    flex: 1,
    minWidth: 130,
  },
  compactCount: {
    alignItems: "center",
  },
  compactCountLabel: {
    letterSpacing: 2,
  },
  compactRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.lg,
  },
  compactTrack: {
    marginTop: spacing.md,
  },
  /** Indented under the dream title, clear of its sparkle column. */
  completesBlock: {
    marginTop: spacing.md,
    paddingLeft: spacing.xl + spacing.sm,
  },
  completesRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  completesTitle: {
    marginTop: spacing.xs,
  },
  divider: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  dividerLine: {
    backgroundColor: colors.divider,
    flex: 1,
    height: 1,
  },
  dreamDelta: {
    ...textGlow(colors.primary, 10),
  },
  dreamHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
  },
  dreamRow: {
    marginTop: spacing.lg,
  },
  dreamRowDivided: {
    borderTopColor: colors.divider,
    borderTopWidth: 1,
    paddingTop: spacing.lg,
  },
  dreamTitle: {
    flex: 1,
    minWidth: 0,
  },
  headline: {
    flex: 1,
    minWidth: 0,
  },
  headlineAccent: {
    color: colors.primary,
    fontWeight: "700",
    ...textGlow(colors.primary, 14),
  },
  headlineRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  headlineTrack: {
    marginTop: spacing.lg,
  },
  sparkCluster: {
    alignItems: "flex-end",
    flexDirection: "row",
    gap: 2,
  },
});
