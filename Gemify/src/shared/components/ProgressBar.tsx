import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

import { colors } from "@/theme/colors";
import { radius } from "@/theme/theme";

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
          glow && {
            elevation: 4,
            shadowColor: color,
            shadowOffset: { height: 0, width: 0 },
            shadowOpacity: 0.6,
            shadowRadius: 6,
          },
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
