import { Image } from "expo-image";
import type { ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Svg, { Path } from "react-native-svg";

import { ActionIconArt } from "@/components/TimeBlockCard";
import type { WeekAscentEntry } from "@/db";
import type { ActionIcon } from "@/dto/timeBlocks";
import {
  AppText,
  Card,
  ChevronIcon,
  ProgressBar,
} from "@/shared/components";
import { colors } from "@/theme/colors";
import { pressed, radius, shadows, spacing } from "@/theme/theme";

const ASCENT_ART = require("../../assets/images/road-progress.png");

/** Dream-magic icon variety for the per-dream rows, stable per position. */
const DREAM_ICONS: readonly ActionIcon[] = [
  "star",
  "crystal",
  "wand",
  "moon",
  "key",
  "feather",
];

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

/** Share of the expected gain already earned, 0–100. */
function earnedShare(expectedPercent: number, gainedPercent: number): number {
  return expectedPercent > 0 ? (gainedPercent / expectedPercent) * 100 : 0;
}

/**
 * Title with the gold "+N% expected" label on the right · flat progress bar
 * (how much of the expected gain is already earned) · "N% earned" beneath.
 */
function AscentProgress({
  completesMilestone,
  expectedPercent,
  gainedPercent,
  title,
  trailing,
}: {
  completesMilestone?: string | null;
  expectedPercent: number;
  gainedPercent: number;
  title: string;
  trailing?: ReactNode;
}) {
  return (
    <View style={styles.progressCopy}>
      <View style={styles.progressHeader}>
        <AppText numberOfLines={2} style={styles.progressTitle} variant="titleSm">
          {title}
        </AppText>
        <AppText color={colors.primary} variant="labelStrong">
          {formatDelta(expectedPercent)} expected
        </AppText>
        {trailing}
      </View>
      <ProgressBar
        height={6}
        style={styles.progressTrack}
        value={earnedShare(expectedPercent, gainedPercent)}
      />
      <AppText
        color={colors.textSecondary}
        style={styles.gainedLabel}
        variant="labelStrong"
      >
        {Math.round(gainedPercent)}% earned
      </AppText>
      {completesMilestone ? (
        <View style={styles.completesRow}>
          <DiamondIcon />
          <AppText color={colors.primary} variant="eyebrow">
            Completes
          </AppText>
          <AppText
            color={colors.textPrimary}
            numberOfLines={1}
            style={styles.completesTitle}
            variant="body"
          >
            {completesMilestone}
          </AppText>
        </View>
      ) : null}
    </View>
  );
}

/**
 * Weekly Plan ascent card, pinned to the bottom of the screen: the progress
 * this week's scheduled quests promise across all dreams. Folded, it is a
 * slim one-line summary; expanded (controlled by the screen, which dims the
 * board behind it), it unwraps upward into the full art header and per-dream
 * breakdown. Hidden entirely while nothing is scheduled for the week.
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
          <View style={styles.artThumb}>
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
            <AppText color={colors.primary} variant="cardTitle">
              {formatDelta(expectedTotal)}
            </AppText>
            <AppText
              color={colors.textMuted}
              style={styles.compactCountLabel}
              variant="captionStrong"
            >
              EXPECTED
            </AppText>
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
        <View style={styles.row}>
          <View style={styles.artFrame}>
            <Image contentFit="cover" source={ASCENT_ART} style={styles.art} />
          </View>
          <AscentProgress
            expectedPercent={expectedTotal}
            gainedPercent={gainedTotal}
            title="Expected progress this week"
            trailing={
              <ChevronIcon color={colors.primary} direction="up" size={16} />
            }
          />
        </View>
      </Pressable>

      {entries.map((entry, index) => (
        <View key={entry.dreamId} style={styles.dreamRow}>
          <View style={styles.dreamIcon}>
            <ActionIconArt
              icon={DREAM_ICONS[index % DREAM_ICONS.length]}
              size={30}
            />
          </View>
          <AscentProgress
            completesMilestone={entry.completesMilestone}
            expectedPercent={entry.expectedPercent}
            gainedPercent={entry.gainedPercent}
            title={entry.dreamTitle}
          />
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
  artFrame: {
    borderColor: colors.borderFaint,
    borderRadius: radius.lg,
    borderWidth: 1,
    height: 88,
    overflow: "hidden",
    width: 88,
    ...shadows.goldGlow,
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
  completesRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.sm + spacing.xs,
  },
  completesTitle: {
    flexShrink: 1,
  },
  dreamIcon: {
    alignItems: "center",
    marginTop: spacing.xs,
    width: 34,
  },
  dreamRow: {
    alignItems: "flex-start",
    borderTopColor: colors.divider,
    borderTopWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
  },
  gainedLabel: {
    marginTop: spacing.sm,
  },
  progressCopy: {
    flex: 1,
    minWidth: 0,
  },
  progressHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  progressTitle: {
    flex: 1,
    minWidth: 0,
  },
  progressTrack: {
    marginTop: spacing.md,
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
  },
});
