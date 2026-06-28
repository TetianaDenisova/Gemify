import type { ImageSourcePropType } from "react-native";
import { StyleSheet, View } from "react-native";

import {
  JourneyRing,
  getJourneyRingDimensions,
  type JourneyRingVariant,
} from "@/components/JourneyRing";
import {
  ResponsiveJourneyBackground,
  type JourneyBackgroundMode,
} from "@/components/ResponsiveJourneyBackground";

export type JourneyRingDemoItem = {
  glowIntensity?: number;
  highlight?: boolean;
  id: number;
  rotation: number;
  /** Baseline size designed around a 390pt-wide phone. */
  size: number;
  tilt: number;
  variant?: JourneyRingVariant;
  /** Relative position inside the rendered image, from 0 to 1. */
  x: number;
  /** Relative position inside the rendered image, from 0 to 1. */
  y: number;
};

export type JourneyRingsDemoProps = {
  backgroundSource?: ImageSourcePropType;
  mode?: JourneyBackgroundMode;
  onRingPress?: (ring: JourneyRingDemoItem) => void;
  rings?: readonly JourneyRingDemoItem[];
};

export const JOURNEY_RING_DEMO_DATA: readonly JourneyRingDemoItem[] = [
  { id: 1, x: 0.39, y: 0.82, size: 140, tilt: 0.42, rotation: -8, highlight: true, variant: "detailed" },
  { id: 2, x: 0.69, y: 0.69, size: 120, tilt: 0.36, rotation: 6, variant: "detailed" },
  { id: 3, x: 0.38, y: 0.57, size: 108, tilt: 0.32, rotation: -4, variant: "detailed" },
  { id: 4, x: 0.68, y: 0.46, size: 92, tilt: 0.28, rotation: 7, variant: "simple" },
  { id: 5, x: 0.44, y: 0.35, size: 78, tilt: 0.24, rotation: -5, variant: "simple" },
  { id: 6, x: 0.61, y: 0.25, size: 64, tilt: 0.2, rotation: 4, glowIntensity: 0.56, variant: "simple" },
];

const defaultBackground = require("../../assets/journey-levels/level1.png");
const BASE_PHONE_WIDTH = 390;

export function JourneyRingsDemo({
  backgroundSource = defaultBackground,
  mode = "contain",
  onRingPress,
  rings = JOURNEY_RING_DEMO_DATA,
}: JourneyRingsDemoProps) {
  return (
    <ResponsiveJourneyBackground mode={mode} source={backgroundSource}>
      {(layout) => {
        const responsiveScale = layout.renderedImageWidth / BASE_PHONE_WIDTH;

        return (
          <View pointerEvents="box-none" style={styles.overlay}>
            {rings.map((ring) => {
              const responsiveSize = ring.size * responsiveScale;
              const dimensions = getJourneyRingDimensions(
                responsiveSize,
                ring.tilt,
              );

              return (
                <JourneyRing
                  accessibilityLabel={`Journey ring ${ring.id}`}
                  glowIntensity={ring.glowIntensity ?? 0.78}
                  active={ring.highlight}
                  key={ring.id}
                  onPress={() => {
                    if (onRingPress) {
                      onRingPress(ring);
                    } else {
                      console.log("Journey ring pressed", ring.id);
                    }
                  }}
                  rotation={ring.rotation}
                  size={responsiveSize}
                  style={[
                    styles.ring,
                    {
                      left:
                        ring.x * layout.renderedImageWidth -
                        dimensions.platformCenterX,
                      top:
                        ring.y * layout.renderedImageHeight -
                        dimensions.platformCenterY,
                    },
                  ]}
                  tilt={ring.tilt}
                  variant={ring.variant}
                />
              );
            })}
          </View>
        );
      }}
    </ResponsiveJourneyBackground>
  );
}

export default JourneyRingsDemo;

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
  },
  ring: {
    position: "absolute",
  },
});
