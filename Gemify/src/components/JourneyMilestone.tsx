import { Image } from "expo-image";
import { memo, useMemo } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { JourneyMilestoneLabel } from "@/components/JourneyMilestoneLabel";
import type { JourneyMilestoneData } from "@/data/journeyMilestones";
import { useLayoutSize } from "@/hooks/useLayoutSize";

export type JourneyMilestoneLabelSide = "left" | "right";

export type JourneyMilestoneProps = {
  imageHeight: number;
  imageWidth: number;
  /** Which side of the ring the label sits on; defaults to alternating by id. */
  labelSide?: JourneyMilestoneLabelSide;
  milestone: JourneyMilestoneData;
  onPress: (milestone: JourneyMilestoneData) => void;
  position?: JourneyMilestonePosition;
};

export type JourneyMilestonePosition = {
  x: number;
  y: number;
};

type JourneyMilestoneLayout = {
  groupHeight: number;
  groupWidth: number;
  left: number;
  ringHeight: number;
  ringWidth: number;
  top: number;
};

const BASE_PHONE_WIDTH = 390;
/**
 * Phone-tier ring size: about a sixth of the map width, so the path reads as
 * a trail of stepping stones and the labels keep room for full titles. The
 * minimum still clears a 44 pt tap target together with the hit slop.
 */
const PHONE_RING_WIDTH_RATIO = 0.18;
const PHONE_RING_MIN_WIDTH = 58;
const PHONE_RING_MAX_WIDTH = 78;
const MAP_EDGE_PADDING = 6;
const CIRCLE_ASPECT_RATIO = 1536 / 1024;
const CIRCLE_SOURCE = require("../../assets/journey-top/circle.png");
const CIRCLE_INACTIVE_SOURCE = require("../../assets/journey-top/circle-inactive.png");
const LABEL_WIDTH = 148;
const LABEL_RING_OVERLAP = 18;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getJourneyMilestoneLayout(
  imageHeight: number,
  imageWidth: number,
  milestone: JourneyMilestoneData,
  phone: boolean,
  position: JourneyMilestonePosition = milestone,
): JourneyMilestoneLayout {
  const responsiveScale = clamp(imageWidth / BASE_PHONE_WIDTH, 0.72, 1.22);
  const responsiveRingWidth = clamp(imageWidth * 0.32, 96, 136);
  const ringWidth = phone
    ? clamp(
        imageWidth * PHONE_RING_WIDTH_RATIO,
        PHONE_RING_MIN_WIDTH,
        PHONE_RING_MAX_WIDTH,
      )
    : clamp(
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
    left,
    ringHeight,
    ringWidth,
    top,
  };
}

/**
 * Memoized: the journey map renders one of these per milestone inside a
 * frequently re-rendering screen, so identical props must skip reconciling
 * the ring image and label subtree.
 */
export const JourneyMilestone = memo(function JourneyMilestone({
  imageHeight,
  imageWidth,
  labelSide: labelSideProp,
  milestone,
  onPress,
  position,
}: JourneyMilestoneProps) {
  const { phone } = useLayoutSize();
  const {
    groupHeight,
    groupWidth,
    left,
    ringHeight,
    ringWidth,
    top,
  } = useMemo(
    () =>
      getJourneyMilestoneLayout(
        imageHeight,
        imageWidth,
        milestone,
        phone,
        position,
      ),
    [imageHeight, imageWidth, milestone, phone, position],
  );

  const labelSide =
    labelSideProp ?? (milestone.id % 2 === 0 ? "left" : "right");
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
  // A phone label wraps instead, so it takes exactly the room up to the map
  // edge and never runs past it.
  const labelWidth = phone
    ? availableLabelWidth
    : Math.max(LABEL_WIDTH, availableLabelWidth);

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
        phone={phone}
        side={labelSide}
        style={[
          phone ? styles.labelPhone : styles.label,
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
          contentFit="contain"
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
});

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
  /**
   * Phone labels wrap to any height: the label spans the ring's height and
   * centres its content, so extra lines overflow evenly above and below.
   */
  labelPhone: {
    position: "absolute",
    top: 0,
    bottom: 0,
  },
  pressable: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "visible",
  },
});
