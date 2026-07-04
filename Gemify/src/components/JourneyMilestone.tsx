import { Pressable, StyleSheet, Text, View } from "react-native";

import {
  MilestoneRing,
  getMilestoneRingDimensions,
} from "@/components/MilestoneRing";
import type { JourneyMilestoneData } from "@/data/journeyMilestones";

export type JourneyMilestoneProps = {
  imageHeight: number;
  imageWidth: number;
  milestone: JourneyMilestoneData;
  onPress: (milestone: JourneyMilestoneData) => void;
  position?: JourneyMilestonePosition;
};

export type JourneyMilestonePosition = {
  x: number;
  y: number;
};

export type JourneyMilestoneLayout = {
  groupHeight: number;
  groupWidth: number;
  labelHeight: number;
  left: number;
  ringCenterX: number;
  ringCenterY: number;
  ringHeight: number;
  ringWidth: number;
  titleFontSize: number;
  titleLineHeight: number;
  titleWidth: number;
  top: number;
};

const BASE_PHONE_WIDTH = 390;
const MAP_EDGE_PADDING = 6;
const RING_TILT = 0.42;
const TITLE_BOTTOM_GAP = 8;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function getJourneyMilestoneLayout(
  imageHeight: number,
  imageWidth: number,
  milestone: JourneyMilestoneData,
  position: JourneyMilestonePosition = milestone,
): JourneyMilestoneLayout {
  const responsiveScale = clamp(imageWidth / BASE_PHONE_WIDTH, 0.72, 1.22);
  const responsiveRingWidth = clamp(imageWidth * 0.28, 88, 130);
  const ringWidth = clamp(
    Math.max(milestone.size * responsiveScale, responsiveRingWidth),
    88,
    130,
  );
  const dimensions = getMilestoneRingDimensions(ringWidth, RING_TILT);
  const titleWidth = clamp(imageWidth * 0.34, 90, 150);
  const titleFontSize = clamp(14 * responsiveScale, 12.5, 15);
  const titleLineHeight = Math.ceil(titleFontSize + 3);
  const labelHeight = titleLineHeight + TITLE_BOTTOM_GAP;
  const groupWidth = Math.max(dimensions.ringWidth, titleWidth);
  const groupHeight = labelHeight + dimensions.ringHeight;
  const anchorX = position.x * imageWidth;
  const anchorY = position.y * imageHeight;
  const maxLeft = Math.max(
    MAP_EDGE_PADDING,
    imageWidth - groupWidth - MAP_EDGE_PADDING,
  );
  const left = clamp(
    anchorX - groupWidth / 2,
    MAP_EDGE_PADDING,
    maxLeft,
  );
  const top = clamp(
    anchorY - dimensions.ringHeight / 2 - labelHeight,
    0,
    Math.max(0, imageHeight - groupHeight),
  );

  return {
    groupHeight,
    groupWidth,
    labelHeight,
    left,
    ringCenterX: left + groupWidth / 2,
    ringCenterY: top + labelHeight + dimensions.ringHeight / 2,
    ringHeight: dimensions.ringHeight,
    ringWidth,
    titleFontSize,
    titleLineHeight,
    titleWidth,
    top,
  };
}

export function JourneyMilestone({
  imageHeight,
  imageWidth,
  milestone,
  onPress,
  position,
}: JourneyMilestoneProps) {
  const {
    groupHeight,
    groupWidth,
    labelHeight,
    left,
    ringWidth,
    titleFontSize,
    titleLineHeight,
    titleWidth,
    top,
  } = getJourneyMilestoneLayout(
    imageHeight,
    imageWidth,
    milestone,
    position,
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
          opacity: pressed ? milestone.opacity * 0.78 : milestone.opacity,
          transform: [{ scale: pressed ? 0.988 : 1 }],
          zIndex: 20 - milestone.id,
        },
      ]}
    >
      <View
        pointerEvents="none"
        style={[styles.label, { width: titleWidth, height: labelHeight }]}
      >
        <Text
          numberOfLines={1}
          style={[
            styles.title,
            { fontSize: titleFontSize, lineHeight: titleLineHeight },
          ]}
        >
          {milestone.title}
        </Text>
        <View style={styles.labelSpark} />
      </View>

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
    </Pressable>
  );
}

export default JourneyMilestone;

const styles = StyleSheet.create({
  pressable: {
    position: "absolute",
    alignItems: "center",
    overflow: "visible",
  },
  label: {
    alignItems: "center",
  },
  title: {
    color: "#fff1be",
    fontFamily: "serif",
    fontWeight: "700",
    textAlign: "center",
    textShadowColor: "rgba(255, 198, 92, 0.72)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 7,
  },
  labelSpark: {
    width: 4,
    height: 4,
    marginTop: 2,
    borderRadius: 2,
    backgroundColor: "#ffe49a",
    shadowColor: "#ffd36a",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.82,
    shadowRadius: 7,
    elevation: 3,
  },
});
