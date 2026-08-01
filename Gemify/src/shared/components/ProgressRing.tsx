import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import Svg, { Circle } from "react-native-svg";

import { colors } from "@/theme/colors";
import { fonts, fontSizes, lineHeights } from "@/theme/theme";

import { AppText } from "./AppText";

export type ProgressRingProps = {
  /** Fill color behind the ring (e.g. colors.surfaceDeep). */
  backgroundColor?: string;
  color?: string;
  /** Text inside the ring. Defaults to "N%"; pass null to hide. */
  label?: string | null;
  labelColor?: string;
  /** Small line under the label (e.g. "done"). */
  meta?: string;
  size?: number;
  strokeWidth?: number;
  style?: StyleProp<ViewStyle>;
  trackColor?: string;
  /** Progress 0–100 (clamped). */
  value: number;
};

/**
 * The single SVG progress ring for the whole app (screens previously each
 * carried their own copy of this math).
 */
export function ProgressRing({
  backgroundColor,
  color = colors.primary,
  label,
  labelColor = colors.textPrimary,
  meta,
  size = 64,
  strokeWidth = 3,
  style,
  trackColor = colors.borderSoft,
  value,
}: ProgressRingProps) {
  const clamped = Math.max(0, Math.min(100, value));
  const ringRadius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * ringRadius;
  const dashOffset = circumference * (1 - clamped / 100);
  const center = size / 2;
  const resolvedLabel = label === undefined ? `${Math.round(clamped)}%` : label;

  return (
    <View style={[styles.ring, { height: size, width: size }, style]}>
      <Svg height={size} viewBox={`0 0 ${size} ${size}`} width={size}>
        {backgroundColor ? (
          <Circle cx={center} cy={center} fill={backgroundColor} r={ringRadius} />
        ) : null}
        <Circle
          cx={center}
          cy={center}
          fill="none"
          r={ringRadius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />
        <Circle
          cx={center}
          cy={center}
          fill="none"
          r={ringRadius}
          stroke={color}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          strokeWidth={strokeWidth}
          transform={`rotate(-90 ${center} ${center})`}
        />
      </Svg>
      {resolvedLabel != null || meta ? (
        <View pointerEvents="none" style={styles.labelBlock}>
          {resolvedLabel != null ? (
            <AppText
              align="center"
              color={labelColor}
              style={[styles.label, size < 56 && styles.labelSmall]}
              variant="pill"
            >
              {resolvedLabel}
            </AppText>
          ) : null}
          {meta ? (
            <AppText align="center" style={styles.meta} variant="caption">
              {meta}
            </AppText>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontFamily: fonts.serif,
  },
  labelBlock: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
  },
  labelSmall: {
    fontSize: fontSizes.md,
    lineHeight: lineHeights.md,
  },
  meta: {
    marginTop: -2,
  },
  ring: {
    alignItems: "center",
    justifyContent: "center",
  },
});
