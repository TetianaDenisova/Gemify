import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

import { colors } from "@/theme/colors";
import { radius, shadowStyle } from "@/theme/theme";

export type ProgressBarProps = {
  color?: string;
  /** Add a soft glow in the fill color. */
  glow?: boolean;
  height?: number;
  style?: StyleProp<ViewStyle>;
  trackColor?: string;
  /** Progress 0–100 (clamped). */
  value: number;
};

/** The single linear progress track/fill for the whole app. */
export function ProgressBar({
  color = colors.primary,
  glow = false,
  height = 4,
  style,
  trackColor = colors.borderSoft,
  value,
}: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value));

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ max: 100, min: 0, now: clamped }}
      style={[styles.track, { backgroundColor: trackColor, height }, style]}
    >
      <View
        style={[
          styles.fill,
          { backgroundColor: color, width: `${clamped}%` },
          glow && shadowStyle({ color, elevation: 4, opacity: 0.6, radius: 6 }),
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    borderRadius: radius.round,
    height: "100%",
  },
  track: {
    borderRadius: radius.round,
    overflow: "hidden",
    width: "100%",
  },
});
