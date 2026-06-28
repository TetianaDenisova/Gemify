import { Pressable, StyleSheet, Text, View } from "react-native";

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

const BASE_PHONE_WIDTH = 390;

function getLabelPosition(
  side: JourneyMilestoneLabelSide,
  canvasWidth: number,
  platformCenterY: number,
  ringHeight: number,
  labelWidth: number,
) {
  if (side === "left") {
    return {
      right: canvasWidth - 10,
      top: platformCenterY - 23,
    };
  }

  if (side === "center") {
    return {
      left: (canvasWidth - labelWidth) / 2,
      top: platformCenterY + ringHeight / 2 + 5,
    };
  }

  return {
    left: canvasWidth - 10,
    top: platformCenterY - 23,
  };
}

export function JourneyMilestone({
  imageHeight,
  imageWidth,
  milestone,
  onPress,
}: JourneyMilestoneProps) {
  const responsiveScale = Math.min(
    Math.max(imageWidth / BASE_PHONE_WIDTH, 0.72),
    1.22,
  );
  const ringSize = milestone.size * responsiveScale;
  const dimensions = getMilestoneRingDimensions(ringSize, milestone.tilt);
  const touchPadding = Math.max(12, ringSize * 0.08);
  const pressableWidth = dimensions.canvasWidth + touchPadding * 2;
  const pressableHeight = dimensions.canvasHeight + touchPadding * 2;
  const labelWidth = Math.min(Math.max(112 * responsiveScale, 104), 140);
  const labelPosition = getLabelPosition(
    milestone.labelSide,
    pressableWidth,
    touchPadding + dimensions.platformCenterY,
    dimensions.ringHeight,
    labelWidth,
  );
  const badgeSize = Math.min(Math.max(22 * responsiveScale, 20), 25);
  const labelGap = 6;
  const textWidth = labelWidth - badgeSize - labelGap;
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
      <Text style={[styles.number, { fontSize: badgeSize * 0.47 }]}>
        {milestone.id}
      </Text>
    </View>
  );

  const labelCopy = (
    <View style={[styles.labelCopy, { width: textWidth }]}>
      <Text numberOfLines={1} style={styles.title}>
        {milestone.title}
      </Text>
      <Text numberOfLines={1} style={styles.subtitle}>
        {milestone.subtitle}
      </Text>
      <Text numberOfLines={1} style={styles.state}>
        {milestone.state}
      </Text>
    </View>
  );

  return (
    <Pressable
      accessibilityHint="Open milestone details"
      accessibilityLabel={`Milestone ${milestone.id}: ${milestone.title}`}
      accessibilityRole="button"
      hitSlop={10}
      onPress={() => onPress(milestone)}
      style={({ pressed }) => [
        styles.pressable,
        {
          left:
            milestone.x * imageWidth -
            touchPadding -
            dimensions.platformCenterX,
          top:
            milestone.y * imageHeight -
            touchPadding -
            dimensions.platformCenterY,
          width: pressableWidth,
          height: pressableHeight,
          opacity: pressed ? milestone.opacity * 0.74 : milestone.opacity,
          zIndex: 20 - milestone.id,
        },
      ]}
    >
      <MilestoneRing
        active={milestone.active}
        completed={milestone.completed}
        glowIntensity={milestone.glowIntensity}
        locked={milestone.locked}
        opacity={1}
        rotation={milestone.rotation}
        size={ringSize}
        style={{ left: touchPadding, top: touchPadding, position: "absolute" }}
        tilt={milestone.tilt}
        variant={milestone.variant}
      />

      <View
        pointerEvents="none"
        style={[styles.label, labelPosition, { width: labelWidth }]}
      >
        {milestone.labelSide === "left" ? (
          <>
            {labelCopy}
            <View style={{ width: labelGap }} />
            {numberBadge}
          </>
        ) : (
          <>
            {numberBadge}
            <View style={{ width: labelGap }} />
            {labelCopy}
          </>
        )}
      </View>
    </Pressable>
  );
}

export default JourneyMilestone;

const styles = StyleSheet.create({
  pressable: {
    position: "absolute",
    overflow: "visible",
  },
  numberBadge: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(7, 8, 17, 0.76)",
    borderWidth: 1,
    borderColor: "rgba(246, 197, 106, 0.78)",
  },
  number: {
    color: "#ffe3a0",
    fontFamily: "serif",
    fontWeight: "500",
    lineHeight: 14,
  },
  label: {
    position: "absolute",
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
  },
  labelCopy: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 9,
    backgroundColor: "rgba(4, 6, 16, 0.68)",
    borderWidth: 1,
    borderColor: "rgba(246, 197, 106, 0.12)",
  },
  title: {
    color: "#fff8e8",
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 16,
  },
  subtitle: {
    color: "rgba(232, 225, 213, 0.72)",
    fontSize: 10,
    lineHeight: 13,
    marginTop: 1,
  },
  state: {
    color: "#d39bff",
    fontSize: 9,
    fontWeight: "600",
    letterSpacing: 0.5,
    lineHeight: 12,
    marginTop: 1,
    textTransform: "uppercase",
  },
});
