import { createElement, type ComponentType, type ReactNode } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import { Pressable, StyleSheet, View } from "react-native";
import { Asset } from "expo-asset";
import { SvgUri, type SvgProps } from "react-native-svg";

import MagicRingAsset from "../../assets/magic-ring.svg";

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

// Keep enough transparent space for Gaussian blur to fade before the SVG edge.
// A tighter crop exposes the rotated filter boundary as a visible rectangle.
const MAGIC_RING_VIEW_BOX = "0 280 1024 560";

function unwrapSvgModule(moduleValue: unknown): unknown {
  let current = moduleValue;

  // Metro can expose CommonJS/ESM interop as one or two nested defaults.
  for (let depth = 0; depth < 2; depth += 1) {
    if (
      current &&
      typeof current === "object" &&
      "default" in current &&
      (current as { default?: unknown }).default !== undefined
    ) {
      current = (current as { default: unknown }).default;
      continue;
    }

    break;
  }

  return current;
}

function getAssetUri(moduleValue: unknown): string | null {
  if (typeof moduleValue === "string") {
    return moduleValue;
  }

  if (typeof moduleValue === "number") {
    return Asset.fromModule(moduleValue).uri;
  }

  if (
    moduleValue &&
    typeof moduleValue === "object" &&
    "uri" in moduleValue &&
    typeof (moduleValue as { uri?: unknown }).uri === "string"
  ) {
    return (moduleValue as { uri: string }).uri;
  }

  return null;
}

function renderMagicRingAsset(props: SvgProps): ReactNode {
  const resolvedModule = unwrapSvgModule(MagicRingAsset as unknown);

  if (
    typeof resolvedModule === "function" ||
    (resolvedModule !== null &&
      typeof resolvedModule === "object" &&
      "$$typeof" in resolvedModule)
  ) {
    return createElement(resolvedModule as ComponentType<SvgProps>, props);
  }

  const uri = getAssetUri(resolvedModule);
  return uri ? <SvgUri {...props} uri={uri} /> : null;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
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
  const stateOpacity = locked ? 0.34 : completed ? 0.9 : active ? 1 : 0.78;
  const resolvedOpacity =
    clamp(opacity, 0, 1) *
    stateOpacity *
    clamp(0.72 + glowIntensity * 0.28, 0.72, 1);

  const ring: ReactNode = (
    <View pointerEvents="none" style={styles.assetContainer}>
      {renderMagicRingAsset({
        height: dimensions.canvasHeight,
        preserveAspectRatio: "none",
        viewBox: MAGIC_RING_VIEW_BOX,
        width: dimensions.canvasWidth,
      })}
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
        { scale: active ? 1.025 : 1 },
      ],
    },
  ];

  if (onPress) {
    return (
      <Pressable
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="button"
        accessibilityState={{ disabled: locked, selected: active }}
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
  pressed: {
    opacity: 0.66,
  },
});
