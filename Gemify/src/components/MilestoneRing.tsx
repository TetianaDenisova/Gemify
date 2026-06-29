import type { ReactNode } from "react";
import {
  Image,
  Pressable,
  StyleSheet,
  View,
  type ImageSourcePropType,
  type StyleProp,
  type ViewStyle,
} from "react-native";

const MagicRingAsset = require("../../assets/magic-ring-advanced.jpg") as ImageSourcePropType;

export type MilestoneRingVariant = "simple" | "detailed";

export type MilestoneRingProps = {
  accessibilityLabel?: string;
  active?: boolean;
  completed?: boolean;
  glowIntensity?: number;
  locked?: boolean;
  onPress?: () => void;
  opacity?: number;
  rotation?: number;
  size?: number;
  style?: StyleProp<ViewStyle>;
  /** Compresses the imported oval for stronger distance perspective. */
  tilt?: number;
  variant?: MilestoneRingVariant;
};

export type MilestoneRingDimensions = {
  canvasHeight: number;
  canvasWidth: number;
  glowPadding: number;
  platformCenterX: number;
  platformCenterY: number;
  ringHeight: number;
  ringWidth: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function renderMagicRingAsset(): ReactNode {
  return (
    <Image
      source={MagicRingAsset}
      resizeMode="stretch"
      style={styles.assetImage}
    />
  );
}

export function getMilestoneRingDimensions(
  size: number,
  tilt = 0.34,
): MilestoneRingDimensions {
  const ringWidth = Math.max(size, 32);
  const ringHeight = ringWidth * clamp(tilt, 0.16, 0.58);

  return {
    ringWidth,
    ringHeight,
    canvasWidth: ringWidth,
    canvasHeight: ringHeight,
    glowPadding: 0,
    platformCenterX: ringWidth / 2,
    platformCenterY: ringHeight / 2,
  };
}

export function MilestoneRing({
  accessibilityLabel = "Journey milestone",
  active = false,
  completed = false,
  glowIntensity = 1,
  locked = false,
  onPress,
  opacity = 1,
  rotation = 0,
  size = 120,
  style,
  tilt = 0.34,
}: MilestoneRingProps) {
  const dimensions = getMilestoneRingDimensions(size, tilt);

  const stateOpacity = locked ? 0.32 : completed ? 0.86 : active ? 0.97 : 0.76;

  const resolvedOpacity =
    clamp(opacity, 0, 1) *
    stateOpacity *
    clamp(0.72 + glowIntensity * 0.18, 0.72, 0.9);

  const ring: ReactNode = (
    <View
      pointerEvents="none"
      style={[
        styles.assetContainer,
        {
          width: dimensions.canvasWidth,
          height: dimensions.canvasHeight,
        },
      ]}
    >
      {renderMagicRingAsset()}
    </View>
  );

  const containerStyle = [
    styles.container,
    style,
    {
      width: dimensions.canvasWidth,
      height: dimensions.canvasHeight,
      opacity: resolvedOpacity,
      transform: [
        { rotate: `${rotation}deg` },
        { scale: active ? 1.018 : 1 },
      ],
    },
  ];

  if (onPress) {
    return (
      <Pressable
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="button"
        accessibilityState={{ disabled: locked, selected: active }}
        disabled={locked}
        hitSlop={12}
        onPress={onPress}
        style={({ pressed }) => [containerStyle, pressed && styles.pressed]}
      >
        {ring}
      </Pressable>
    );
  }

  return (
    <View pointerEvents="none" style={containerStyle}>
      {ring}
    </View>
  );
}

export default MilestoneRing;

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  assetContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  assetImage: {
    width: "100%",
    height: "100%",
  },
  pressed: {
    opacity: 0.66,
  },
});
