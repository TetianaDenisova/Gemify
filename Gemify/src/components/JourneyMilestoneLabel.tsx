import type { StyleProp, ViewStyle } from "react-native";
import { StyleSheet, View } from "react-native";
import Svg, { Line } from "react-native-svg";

import { AppText } from "@/shared/components";
import { colors } from "@/theme/colors";
import { fonts, shadows, textGlow } from "@/theme/theme";

export type JourneyMilestoneLabelSide = "left" | "right";

export type JourneyMilestoneLabelProps = {
  number: number;
  side?: JourneyMilestoneLabelSide;
  style?: StyleProp<ViewStyle>;
  subtitle: string;
  title: string;
};

// NOTE: This label renders inside the zoomable journey-map canvas, so its
// font sizes are tuned to the board's coordinate space (relative to the 36px
// badge) rather than the app type scale — an intentional exception.
const BADGE_SIZE = 36;
const CONNECTOR_WIDTH = 14;

function GoldenConnector() {
  return (
    <Svg
      height={12}
      style={{ pointerEvents: "none" }}
      viewBox={`0 0 ${CONNECTOR_WIDTH} 12`}
      width={CONNECTOR_WIDTH}
    >
      <Line
        opacity={0.12}
        stroke={colors.primary}
        strokeLinecap="round"
        strokeWidth={5}
        x1={0}
        x2={CONNECTOR_WIDTH}
        y1={6}
        y2={6}
      />
      <Line
        opacity={0.82}
        stroke={colors.primary}
        strokeLinecap="round"
        strokeWidth={1}
        x1={0}
        x2={CONNECTOR_WIDTH}
        y1={6}
        y2={6}
      />
    </Svg>
  );
}

export function JourneyMilestoneLabel({
  number,
  side = "right",
  style,
  subtitle,
  title,
}: JourneyMilestoneLabelProps) {
  const displayNumber = Math.min(Math.max(Math.round(number), 1), 99);
  const isLeft = side === "left";

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        styles.container,
        { pointerEvents: "none" },
        isLeft && styles.containerLeft,
        style,
      ]}
    >
      <View style={styles.connector}>
        <GoldenConnector />
      </View>

      <View style={styles.badge}>
        <View style={[styles.badgeInnerRing, { pointerEvents: "none" }]} />
        <AppText style={styles.badgeText}>{displayNumber}</AppText>
      </View>

      <View
        style={[
          styles.textBlock,
          isLeft ? styles.textBlockLeft : styles.textBlockRight,
        ]}
      >
        <AppText
          numberOfLines={1}
          style={[styles.title, isLeft && styles.textAlignRight]}
        >
          {title}
        </AppText>
        <AppText
          numberOfLines={1}
          style={[styles.subtitle, isLeft && styles.textAlignRight]}
          variant="caption"
        >
          {subtitle}
        </AppText>
      </View>
    </View>
  );
}

export default JourneyMilestoneLabel;

const styles = StyleSheet.create({
  container: {
    width: 148,
    height: 40,
    flexDirection: "row",
    alignItems: "center",
  },
  containerLeft: {
    flexDirection: "row-reverse",
  },
  connector: {
    width: CONNECTOR_WIDTH,
    height: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    width: BADGE_SIZE,
    height: BADGE_SIZE,
    borderRadius: BADGE_SIZE / 2,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceGlass,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.goldGlow,
  },
  badgeInnerRing: {
    position: "absolute",
    inset: 3,
    borderRadius: (BADGE_SIZE - 6) / 2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderSoft,
  },
  badgeText: {
    color: colors.primary,
    fontFamily: fonts.serif,
    fontSize: 17,
    fontWeight: "600",
    lineHeight: 21,
    textAlign: "center",
    ...textGlow(colors.primaryGlow, 5),
  },
  textBlock: {
    flex: 1,
    minWidth: 0,
    justifyContent: "center",
  },
  /** Left-side labels grow toward the map edge; keep text hugging the badge. */
  textAlignRight: {
    textAlign: "right",
  },
  textBlockLeft: {
    marginRight: 8,
  },
  textBlockRight: {
    marginLeft: 8,
  },
  title: {
    color: colors.primarySoft,
    fontFamily: fonts.serif,
    fontSize: 15,
    fontWeight: "500",
    letterSpacing: 0.15,
    lineHeight: 18,
    textAlign: "left",
    ...textGlow(colors.primaryGlow, 4),
  },
  subtitle: {
    marginTop: 1,
    fontSize: 11,
    fontWeight: "300",
    letterSpacing: 0.1,
    lineHeight: 14,
    textAlign: "left",
  },
});
