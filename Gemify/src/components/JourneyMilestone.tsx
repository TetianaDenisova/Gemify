import { Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import {
  MilestoneRing,
  getMilestoneRingDimensions,
} from "@/components/MilestoneRing";
import type {
  JourneyMilestoneData,
  JourneyMilestoneLabelSide,
} from "@/data/journeyMilestones";

export type JourneyMilestoneProps = {
  imageHeight: number;
  imageWidth: number;
  milestone: JourneyMilestoneData;
  onPress: (milestone: JourneyMilestoneData) => void;
};

type GroupSide = "left" | "right";

const BASE_PHONE_WIDTH = 390;
const MAP_EDGE_PADDING = 6;
const RING_TILT = 0.42;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getPreferredGroupSide(
  side: JourneyMilestoneLabelSide,
  milestoneX: number,
): GroupSide {
  if (side === "center") {
    return milestoneX <= 0.5 ? "right" : "left";
  }

  return side;
}

function getGroupSide(
  preferredSide: GroupSide,
  anchorX: number,
  groupWidth: number,
  imageWidth: number,
  ringWidth: number,
): GroupSide {
  const widthToRightEdge = imageWidth - anchorX + ringWidth / 2;
  const widthToLeftEdge = anchorX + ringWidth / 2;

  if (preferredSide === "right" && groupWidth > widthToRightEdge) {
    return widthToLeftEdge >= groupWidth ? "left" : "right";
  }

  if (preferredSide === "left" && groupWidth > widthToLeftEdge) {
    return widthToRightEdge >= groupWidth ? "right" : "left";
  }

  return preferredSide;
}

export function JourneyMilestone({
  imageHeight,
  imageWidth,
  milestone,
  onPress,
}: JourneyMilestoneProps) {
  const responsiveScale = clamp(imageWidth / BASE_PHONE_WIDTH, 0.72, 1.22);
  const responsiveRingWidth = clamp(imageWidth * 0.28, 88, 130);
  const ringWidth = clamp(
    Math.max(milestone.size * responsiveScale, responsiveRingWidth),
    88,
    130,
  );
  const dimensions = getMilestoneRingDimensions(ringWidth, RING_TILT);
  const badgeSize = clamp(20 * responsiveScale, 20, 22);
  const cardWidth = clamp(126 * responsiveScale, 122, 136);
  const connectorWidth = clamp(8 * responsiveScale, 7, 10);
  const ringDetailOverlap = clamp(connectorWidth * 0.55, 4, 5);
  const groupWidth =
    dimensions.ringWidth + connectorWidth + cardWidth - ringDetailOverlap;
  const groupHeight = Math.max(dimensions.ringHeight, 48);
  const anchorX = milestone.x * imageWidth;
  const anchorY = milestone.y * imageHeight;
  const preferredSide = getPreferredGroupSide(
    milestone.labelSide,
    milestone.x,
  );
  const groupSide = getGroupSide(
    preferredSide,
    anchorX,
    groupWidth,
    imageWidth,
    dimensions.ringWidth,
  );
  const unclampedLeft =
    groupSide === "right"
      ? anchorX - dimensions.ringWidth / 2
      : anchorX + dimensions.ringWidth / 2 - groupWidth;
  const maxLeft = Math.max(
    MAP_EDGE_PADDING,
    imageWidth - groupWidth - MAP_EDGE_PADDING,
  );
  const left = clamp(unclampedLeft, MAP_EDGE_PADDING, maxLeft);
  const top = clamp(
    anchorY - groupHeight / 2,
    0,
    Math.max(0, imageHeight - groupHeight),
  );

  const ring = (
    <MilestoneRing
      active={milestone.active}
      completed={milestone.completed}
      glowIntensity={milestone.glowIntensity}
      locked={milestone.locked}
      opacity={1}
      rotation={milestone.rotation}
      size={ringWidth}
      tilt={RING_TILT}
      variant={milestone.variant}
    />
  );

  const numberBadge = (
    <View
      pointerEvents="none"
      style={[
        styles.numberBadge,
        {
          width: badgeSize,
          height: badgeSize,
          borderRadius: badgeSize / 2,
        },
      ]}
    >
      <Text style={styles.badgeText}>{milestone.id}</Text>
    </View>
  );

  const card = (
    <View pointerEvents="none" style={[styles.cardGlow, { width: cardWidth }]}>
      <LinearGradient
        colors={[
          "rgba(31, 22, 57, 0.82)",
          "rgba(12, 12, 34, 0.78)",
          "rgba(7, 9, 24, 0.74)",
        ]}
        end={{ x: 1, y: 1 }}
        locations={[0, 0.52, 1]}
        start={{ x: 0, y: 0 }}
        style={styles.card}
      >
        <View pointerEvents="none" style={styles.cardHighlight} />
        {numberBadge}
        <View style={styles.textBlock}>
          <Text numberOfLines={1} style={styles.title}>
            {milestone.title}
          </Text>
        </View>
      </LinearGradient>
    </View>
  );

  const connector = (
    <View
      pointerEvents="none"
      style={[
        styles.connector,
        {
          width: connectorWidth,
          marginLeft: groupSide === "right" ? -ringDetailOverlap : 0,
          marginRight: groupSide === "left" ? -ringDetailOverlap : 0,
        },
      ]}
    />
  );

  return (
    <Pressable
      accessibilityHint="Open milestone details"
      accessibilityLabel={`Milestone ${milestone.id}: ${milestone.title}`}
      accessibilityRole="button"
      accessibilityState={{ selected: milestone.active }}
      hitSlop={8}
      onPress={() => onPress(milestone)}
      style={({ pressed }) => [
        styles.pressable,
        {
          left,
          top,
          width: groupWidth,
          height: groupHeight,
          opacity: pressed ? milestone.opacity * 0.76 : milestone.opacity,
          transform: [{ scale: pressed ? 0.985 : 1 }],
          zIndex: 20 - milestone.id,
        },
      ]}
    >
      {groupSide === "right" ? ring : card}
      {connector}
      {groupSide === "right" ? card : ring}
    </Pressable>
  );
}

export default JourneyMilestone;

const styles = StyleSheet.create({
  pressable: {
    position: "absolute",
    flexDirection: "row",
    alignItems: "center",
    overflow: "visible",
  },
  connector: {
    height: 1,
    backgroundColor: "rgba(255, 211, 106, 0.32)",
    shadowColor: "#ffd36a",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.28,
    shadowRadius: 4,
  },
  numberBadge: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(8, 7, 18, 0.76)",
    borderWidth: 1,
    borderColor: "rgba(255, 213, 122, 0.85)",
    shadowColor: "#ffd36a",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  badgeText: {
    color: "#ffe6a3",
    fontSize: 10,
    fontWeight: "700",
    lineHeight: 13,
  },
  cardGlow: {
    borderRadius: 12,
    backgroundColor: "rgba(9, 8, 24, 0.72)",
    shadowColor: "#c084fc",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: 8,
  },
  card: {
    minWidth: 122,
    maxWidth: 136,
    minHeight: 38,
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 208, 112, 0.22)",
  },
  cardHighlight: {
    position: "absolute",
    top: 0,
    left: 12,
    right: 12,
    height: 1,
    backgroundColor: "rgba(231, 212, 255, 0.2)",
  },
  textBlock: {
    flex: 1,
    minWidth: 0,
    marginLeft: 7,
  },
  title: {
    color: "#fff8e7",
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 14,
  },
});
