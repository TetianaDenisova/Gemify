import { Image } from "expo-image";
import { StyleSheet, View } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";

import type { MilestoneReward } from "@/db";
import { AppButton, AppText, Card } from "@/shared/components";
import { colors } from "@/theme/colors";
import {
  fontSizes,
  fonts,
  lineHeights,
  radius,
  shadows,
  spacing,
  textGlow,
} from "@/theme/theme";

const CLOSED_PRESENT = require("../../assets/reward/closed-present-icon-glow.svg");
const OPEN_PRESENT = require("../../assets/reward/open-present-icon.svg");

function formatCollectedDate(value: string): string {
  return new Date(value).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function CollectedCheck() {
  return (
    <Svg height={32} viewBox="0 0 32 32" width={32}>
      <Circle
        cx={16}
        cy={16}
        fill="none"
        r={14}
        stroke={colors.primarySoft}
        strokeWidth={2}
      />
      <Path
        d="m9.5 16 4.2 4.2 8.8-9"
        fill="none"
        stroke={colors.primarySoft}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2.4}
      />
    </Svg>
  );
}

export function RewardCard({
  collecting,
  onCollect,
  reward,
}: {
  collecting: boolean;
  onCollect: () => void;
  reward: MilestoneReward;
}) {
  const collected = reward.collectedAt !== null;

  return (
    <Card padded={false} style={[styles.card, !collected && styles.cardReady]}>
      <AppText
        align="center"
        color={colors.primaryBright}
        style={styles.eyebrow}
        variant="eyebrow"
      >
        FOR ACHIEVING
      </AppText>
      <AppText
        align="center"
        numberOfLines={2}
        style={styles.milestone}
        variant="titleSm"
      >
        &quot;{reward.milestoneTitle}&quot;
      </AppText>
      <Image
        contentFit="contain"
        source={collected ? OPEN_PRESENT : CLOSED_PRESENT}
        style={styles.present}
      />
      <AppText
        align="center"
        numberOfLines={2}
        style={styles.rewardName}
        variant="cardTitle"
      >
        {reward.rewardName}
      </AppText>
      {collected ? (
        <View style={styles.collectedBlock}>
          <View style={styles.collectedRow}>
            <CollectedCheck />
            <AppText color={colors.primarySoft} variant="titleSm">
              Collected
            </AppText>
          </View>
          <AppText color={colors.textSecondary} variant="meta">
            {formatCollectedDate(reward.collectedAt!)}
          </AppText>
        </View>
      ) : (
        <AppButton
          disabled={collecting}
          label={collecting ? "Collecting..." : "Collect"}
          onPress={onCollect}
          style={styles.collectButton}
        />
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: "center",
    backgroundColor: colors.surfaceCard,
    borderColor: colors.primaryDark,
    borderRadius: radius.card,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  cardReady: {
    borderColor: colors.borderStrong,
    ...shadows.goldGlow,
  },
  collectButton: {
    marginTop: spacing.lg,
    maxWidth: 360,
    width: "100%",
  },
  collectedBlock: {
    alignItems: "center",
    gap: spacing.xs,
    marginTop: spacing.lg,
  },
  collectedRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  eyebrow: {
    fontSize: fontSizes.sm,
    fontWeight: "700",
    letterSpacing: 0,
    lineHeight: lineHeights.lg,
  },
  milestone: {
    marginTop: spacing.xs,
    maxWidth: 520,
  },
  present: {
    height: 150,
    marginTop: spacing.md,
    width: 170,
  },
  rewardName: {
    fontFamily: fonts.serif,
    marginTop: spacing.sm,
    ...textGlow(colors.primaryGlow, 8),
  },
});
