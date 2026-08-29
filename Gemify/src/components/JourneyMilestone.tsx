import { Image, Pressable, StyleSheet, View } from "react-native";

import { JourneyMilestoneLabel } from "@/components/JourneyMilestoneLabel";
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
const CIRCLE_ASPECT_RATIO = 1536 / 1024;
const CIRCLE_SOURCE = require("../../assets/journey-top/circle.png");
const CIRCLE_INACTIVE_SOURCE = require("../../assets/journey-top/circle-inactive.png");
const LABEL_WIDTH = 148;
const LABEL_RING_OVERLAP = 18;

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
  const responsiveRingWidth = clamp(imageWidth * 0.32, 96, 136);
  const ringWidth = clamp(
    Math.max(milestone.size * responsiveScale, responsiveRingWidth),
    96,
    136,
  );
  const ringHeight = ringWidth / CIRCLE_ASPECT_RATIO;
  const groupWidth = ringWidth;
  const groupHeight = ringHeight;
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
    anchorY - ringHeight / 2,
    0,
    Math.max(0, imageHeight - groupHeight),
  );

  return {
    groupHeight,
    groupWidth,
    labelHeight: 0,
    left,
    ringCenterX: left + groupWidth / 2,
    ringCenterY: top + ringHeight / 2,
    ringHeight,
    ringWidth,
    titleFontSize: 0,
    titleLineHeight: 0,
    titleWidth: 0,
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
    left,
    ringHeight,
    ringWidth,
    top,
  } = getJourneyMilestoneLayout(
    imageHeight,
    imageWidth,
    milestone,
    position,
  );

  const labelSide = milestone.id % 2 === 0 ? "left" : "right";
  const labelPosition =
    labelSide === "left"
      ? { right: groupWidth - LABEL_RING_OVERLAP }
      : { left: groupWidth - LABEL_RING_OVERLAP };
  // Let the label use all the space between the ring and the map edge so
  // longer titles stay untruncated when the screen is wide enough.
  const availableLabelWidth =
    labelSide === "left"
      ? left + LABEL_RING_OVERLAP - MAP_EDGE_PADDING
      : imageWidth - (left + groupWidth) + LABEL_RING_OVERLAP - MAP_EDGE_PADDING;
  const labelWidth = Math.max(LABEL_WIDTH, availableLabelWidth);

  return (
    <View
      style={[
        styles.group,
        {
          left,
          pointerEvents: "box-none",
          top,
          width: groupWidth,
          height: groupHeight,
          zIndex: 20 - milestone.id,
        },
      ]}
    >
      <JourneyMilestoneLabel
        muted={milestone.completed}
        number={milestone.id}
        side={labelSide}
        style={[
          styles.label,
          labelPosition,
          { width: labelWidth },
        ]}
        subtitle={milestone.subtitle}
        title={milestone.title}
      />

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
            width: groupWidth,
            height: groupHeight,
            opacity: pressed ? milestone.opacity * 0.78 : milestone.opacity,
            transform: [{ scale: pressed ? 0.988 : 1 }],
          },
        ]}
      >
        <Image
          resizeMode="contain"
          // Completed milestones fall back to the quiet ring, like inactive
          // ones — only the steps still ahead glow gold.
          source={
            milestone.active && !milestone.completed
              ? CIRCLE_SOURCE
              : CIRCLE_INACTIVE_SOURCE
          }
          style={{ width: ringWidth, height: ringHeight }}
        />
      </Pressable>
    </View>
  );
}

export default JourneyMilestone;

const styles = StyleSheet.create({
  group: {
    position: "absolute",
    overflow: "visible",
  },
  label: {
    position: "absolute",
    top: "50%",
    marginTop: -20,
  },
  pressable: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "visible",
  },
});
