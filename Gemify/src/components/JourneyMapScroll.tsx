import type { ReactNode } from "react";
import type { ImageSourcePropType, StyleProp, ViewStyle } from "react-native";
import { StyleSheet, View, useWindowDimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  cancelAnimation,
  Extrapolation,
  interpolate,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import {
  ResponsiveJourneyBackground,
  type JourneyBackgroundMode,
  useResponsiveJourneyImageLayout,
} from "@/components/ResponsiveJourneyBackground";

type JourneyFrame = {
  position: number;
  source: ImageSourcePropType;
};

export type JourneyMapScrollProps = {
  /** Content rendered above the animated map, such as future milestones. */
  children?: ReactNode;
  /** Increase this to require a longer drag to travel through the whole map. */
  dragDistanceMultiplier?: number;
  /** Enables/disables map gestures without removing the visual. */
  enabled?: boolean;
  /** Width of each frame's cross-fade around its progress position. */
  frameFadeRange?: number;
  /** `contain` preserves the whole composition; `cover` fills and may crop. */
  imageMode?: JourneyBackgroundMode;
  initialProgress?: number;
  /** Optional shared value for coordinating future overlays with the map. */
  progress?: SharedValue<number>;
  showAtmosphere?: boolean;
  snapToFrames?: boolean;
  style?: StyleProp<ViewStyle>;
};

// Journey levels in travel order. Keep positions ascending for snapping.
export const JOURNEY_FRAMES: readonly JourneyFrame[] = [
  { position: 0, source: require("../../assets/journey-levels/level1.png") },
  { position: 0.5, source: require("../../assets/journey-levels/level2.png") },
  { position: 1, source: require("../../assets/journey-levels/level3.png") },
];

const SNAP_SPRING = {
  damping: 20,
  mass: 0.9,
  overshootClamping: true,
  stiffness: 180,
};

function clamp(value: number, min = 0, max = 1) {
  "worklet";
  return Math.min(Math.max(value, min), max);
}

type JourneyFrameLayerProps = JourneyFrame & {
  fadeRange: number;
  mode: JourneyBackgroundMode;
  progress: SharedValue<number>;
  travelOffset: number;
};

function JourneyFrameLayer({
  fadeRange,
  mode,
  position,
  progress,
  source,
  travelOffset,
}: JourneyFrameLayerProps) {
  const animatedStyle = useAnimatedStyle(() => {
    // Contain mode keeps the complete composition visible without camera crop.
    const scale =
      mode === "contain"
        ? 1
        : interpolate(progress.value, [0, 1], [1.02, 1.1]);
    const translateY =
      mode === "contain"
        ? 0
        : interpolate(
            progress.value,
            [0, 1],
            [travelOffset, -travelOffset],
          );

    return {
      opacity: interpolate(
        progress.value,
        [position - fadeRange, position, position + fadeRange],
        [0, 1, 0],
        Extrapolation.CLAMP,
      ),
      transform: [{ translateY }, { scale }],
    };
  });

  return (
    <Animated.View pointerEvents="none" style={[styles.frame, animatedStyle]}>
      <ResponsiveJourneyBackground mode={mode} source={source} />
    </Animated.View>
  );
}

function MagicalGlow({
  progress,
  size,
}: {
  progress: SharedValue<number>;
  size: number;
}) {
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.6, 1], [0.14, 0.24, 0.4]),
    transform: [
      { scale: interpolate(progress.value, [0, 1], [0.8, 1.18]) },
    ],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.glow,
        {
          width: size,
          height: size,
          marginLeft: -size / 2,
          borderRadius: size / 2,
          shadowRadius: size * 0.2,
        },
        animatedStyle,
      ]}
    />
  );
}

export function JourneyMapScroll({
  children,
  dragDistanceMultiplier = 0.9,
  enabled = true,
  // Three evenly spaced frames need a 0.5 fade range for continuous crossfades.
  frameFadeRange = 0.5,
  imageMode = "contain",
  initialProgress = 0,
  progress: suppliedProgress,
  showAtmosphere = true,
  snapToFrames = true,
  style,
}: JourneyMapScrollProps) {
  const { height } = useWindowDimensions();
  const imageLayout = useResponsiveJourneyImageLayout(
    JOURNEY_FRAMES[0].source,
    imageMode,
  );
  const internalProgress = useSharedValue(clamp(initialProgress));
  const progress = suppliedProgress ?? internalProgress;
  const progressAtGestureStart = useSharedValue(progress.value);

  // Responsive metrics scale with the active phone viewport.
  const dragDistance = Math.max(height * dragDistanceMultiplier, 1);
  const travelOffset = Math.min(Math.max(height * 0.035, 22), 38);
  const glowSize = Math.min(
    Math.max(imageLayout.renderedImageWidth * 0.38, 124),
    180,
  );

  const panGesture = Gesture.Pan()
    .enabled(enabled)
    .activeOffsetY([-4, 4])
    .onBegin(() => {
      cancelAnimation(progress);
      progressAtGestureStart.value = progress.value;
    })
    .onUpdate((event) => {
      // Negative translationY means an upward drag, so it advances the journey.
      progress.value = clamp(
        progressAtGestureStart.value - event.translationY / dragDistance,
      );
    })
    .onEnd((event) => {
      // A small velocity projection makes quick swipes feel responsive.
      const projectedProgress = clamp(
        progress.value - (event.velocityY / dragDistance) * 0.12,
      );

      if (snapToFrames) {
        // With evenly spaced frames, rounding selects the nearest milestone.
        const lastFrameIndex = JOURNEY_FRAMES.length - 1;
        const snappedProgress =
          Math.round(projectedProgress * lastFrameIndex) / lastFrameIndex;
        progress.value = withSpring(snappedProgress, SNAP_SPRING);
      } else {
        progress.value = withSpring(projectedProgress, SNAP_SPRING);
      }
    });

  return (
    <View style={[styles.container, style]}>
      <GestureDetector gesture={panGesture}>
        <View collapsable={false} style={styles.gestureSurface}>
          {JOURNEY_FRAMES.map((frame) => (
            <JourneyFrameLayer
              fadeRange={frameFadeRange}
              key={frame.position}
              mode={imageMode}
              position={frame.position}
              progress={progress}
              source={frame.source}
              travelOffset={travelOffset}
            />
          ))}

          {showAtmosphere ? (
            <>
              <View
                pointerEvents="none"
                style={[
                  styles.imageAlignedAtmosphere,
                  {
                    left: imageLayout.imageOffsetX,
                    top: imageLayout.imageOffsetY,
                    width: imageLayout.renderedImageWidth,
                    height: imageLayout.renderedImageHeight,
                  },
                ]}
              >
                <MagicalGlow progress={progress} size={glowSize} />
              </View>
              <LinearGradient
                colors={[
                  "rgba(2, 4, 12, 0.38)",
                  "rgba(2, 4, 12, 0.02)",
                  "rgba(2, 4, 12, 0.08)",
                  "rgba(2, 4, 12, 0.48)",
                ]}
                locations={[0, 0.3, 0.68, 1]}
                pointerEvents="none"
                style={StyleSheet.absoluteFill}
              />
            </>
          ) : null}

          <View
            pointerEvents="box-none"
            style={[
              styles.overlaySlot,
              {
                left: imageLayout.imageOffsetX,
                top: imageLayout.imageOffsetY,
                width: imageLayout.renderedImageWidth,
                height: imageLayout.renderedImageHeight,
              },
            ]}
          >
            {children}
          </View>
        </View>
      </GestureDetector>
    </View>
  );
}

export default JourneyMapScroll;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#02040c",
    overflow: "hidden",
  },
  gestureSurface: {
    flex: 1,
    overflow: "hidden",
  },
  frame: {
    position: "absolute",
    inset: 0,
    backfaceVisibility: "hidden",
  },
  imageAlignedAtmosphere: {
    position: "absolute",
    overflow: "hidden",
  },
  glow: {
    position: "absolute",
    top: "7%",
    left: "50%",
    backgroundColor: "rgba(255, 219, 128, 0.28)",
    shadowColor: "#ffe29a",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
  },
  overlaySlot: {
    position: "absolute",
  },
});
