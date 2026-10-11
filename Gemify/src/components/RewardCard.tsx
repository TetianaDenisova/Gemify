import { Image } from "expo-image";
import { Pressable, StyleSheet, View } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";

import type { MilestoneReward } from "@/db";
import { AppText, Card } from "@/shared/components";
import { colors } from "@/theme/colors";
import {
  fontSizes,
  fonts,
  lineHeights,
  radius,
  shadows,
  spacing,
  textGlow,
  pressed,
} from "@/theme/theme";

const CLOSED_PRESENT = require("../../assets/rewards/closed-present-icon-glow.svg");
const OPEN_PRESENT = require("../../assets/rewards/open-present-icon.svg");

function CollectedCheck() {
  return (
    <Svg height={22} viewBox="0 0 32 32" width={22}>
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
            <AppText color={colors.primarySoft} variant="controlLabel">
              Collected
            </AppText>
          </View>
        </View>
      ) : (
        <Pressable
          accessibilityLabel={`Collect ${reward.rewardName}`}
          accessibilityRole="button"
          disabled={collecting}
          onPress={onCollect}
          style={({ pressed: isPressed }) => [
            styles.collectButton,
            collecting && styles.collectButtonDisabled,
            isPressed && !collecting && pressed,
          ]}
        >
          <AppText color={colors.textOnPrimary} variant="labelStrong">
            {collecting ? "Collecting..." : "Collect"}
          </AppText>
        </Pressable>
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
    minHeight: 286,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
  },
  cardReady: {
    borderColor: colors.borderStrong,
    ...shadows.goldGlow,
  },
  collectButton: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: radius.round,
    justifyContent: "center",
    marginTop: spacing.md,
    minHeight: 44,
    width: "100%",
  },
  collectButtonDisabled: {
    opacity: 0.5,
  },
  collectedBlock: {
    alignItems: "center",
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  collectedRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  eyebrow: {
    fontSize: fontSizes.xxs,
    fontWeight: "700",
    letterSpacing: 0,
    lineHeight: lineHeights.lg,
  },
  milestone: {
    marginTop: spacing.xs,
    maxWidth: 520,
    fontSize: fontSizes.md,
    lineHeight: lineHeights.lg,
  },
  present: {
    height: 76,
    marginTop: spacing.sm,
    width: 88,
  },
  rewardName: {
    fontFamily: fonts.serif,
    fontSize: fontSizes.xl,
    lineHeight: lineHeights.xl,
    marginTop: spacing.xs,
    ...textGlow(colors.primaryGlow, 8),
  },
});
