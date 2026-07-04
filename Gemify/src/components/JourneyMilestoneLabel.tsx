import type { StyleProp, ViewStyle } from "react-native";
import { Platform, StyleSheet, Text, View } from "react-native";
import Svg, { Line } from "react-native-svg";

export type JourneyMilestoneLabelSide = "left" | "right";

export type JourneyMilestoneLabelProps = {
  number: number;
  side?: JourneyMilestoneLabelSide;
  style?: StyleProp<ViewStyle>;
  subtitle: string;
  title: string;
};

const BADGE_SIZE = 36;
const CONNECTOR_WIDTH = 14;
const FANTASY_SERIF = Platform.select({
  android: "serif",
  default: "serif",
  ios: "Georgia",
  web: "Georgia, 'Times New Roman', serif",
});

function GoldenConnector() {
  return (
    <Svg
      height={12}
      pointerEvents="none"
      viewBox={`0 0 ${CONNECTOR_WIDTH} 12`}
      width={CONNECTOR_WIDTH}
    >
      <Line
        opacity={0.12}
        stroke="#D9B36A"
        strokeLinecap="round"
        strokeWidth={5}
        x1={0}
        x2={CONNECTOR_WIDTH}
        y1={6}
        y2={6}
      />
      <Line
        opacity={0.82}
        stroke="#D9B36A"
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
      pointerEvents="none"
      style={[
        styles.container,
        isLeft && styles.containerLeft,
        style,
      ]}
    >
      <View style={styles.connector}>
        <GoldenConnector />
      </View>

      <View style={styles.badge}>
        <View pointerEvents="none" style={styles.badgeInnerRing} />
        <Text style={styles.badgeText}>{displayNumber}</Text>
      </View>

      <View
        style={[
          styles.textBlock,
          isLeft ? styles.textBlockLeft : styles.textBlockRight,
        ]}
      >
        <Text numberOfLines={1} style={styles.title}>
          {title}
        </Text>
        <Text numberOfLines={1} style={styles.subtitle}>
          {subtitle}
        </Text>
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
    borderColor: "rgba(217, 179, 106, 0.92)",
    backgroundColor: "rgba(8, 8, 14, 0.72)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#D9B36A",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 5,
  },
  badgeInnerRing: {
    position: "absolute",
    inset: 3,
    borderRadius: (BADGE_SIZE - 6) / 2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(245, 210, 138, 0.24)",
  },
  badgeText: {
    color: "#F5D28A",
    fontFamily: FANTASY_SERIF,
    fontSize: 17,
    fontWeight: "600",
    lineHeight: 21,
    textAlign: "center",
    textShadowColor: "rgba(217, 179, 106, 0.38)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 5,
  },
  textBlock: {
    width: 90,
    justifyContent: "center",
  },
  textBlockLeft: {
    marginRight: 8,
  },
  textBlockRight: {
    marginLeft: 8,
  },
  title: {
    color: "#E6C27A",
    fontFamily: FANTASY_SERIF,
    fontSize: 15,
    fontWeight: "500",
    letterSpacing: 0.15,
    lineHeight: 18,
    textAlign: "left",
    textShadowColor: "rgba(217, 179, 106, 0.18)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 4,
  },
  subtitle: {
    marginTop: 1,
    color: "rgba(167, 164, 160, 0.78)",
    fontSize: 11,
    fontWeight: "300",
    letterSpacing: 0.1,
    lineHeight: 14,
    textAlign: "left",
  },
});
