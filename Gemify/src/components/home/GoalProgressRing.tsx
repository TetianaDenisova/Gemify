import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";

import type { ThemeColor } from "@/data/homeData";
import { colors } from "@/theme/colors";

interface GoalProgressRingProps {
  progressPercent: number;
  themeColor: ThemeColor;
}

const SIZE = 48;
const STROKE_WIDTH = 2;
const RADIUS = (SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function getThemeColor(themeColor: ThemeColor) {
  return themeColor === "gold" ? colors.gold : colors.purple;
}

function clampProgress(progressPercent: number) {
  return Math.max(0, Math.min(100, progressPercent));
}

export function GoalProgressRing({
  progressPercent,
  themeColor,
}: GoalProgressRingProps) {
  const accentColor = getThemeColor(themeColor);
  const progress = clampProgress(progressPercent);

  const strokeDashoffset =
    CIRCUMFERENCE - (progress / 100) * CIRCUMFERENCE;

  return (
    <View style={styles.container}>
      <Svg
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        style={styles.svg}
      >
        <Circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          stroke={accentColor}
          strokeWidth={STROKE_WIDTH}
          strokeOpacity={0.2}
          fill="rgba(5, 7, 17, 0.38)"
        />

        <Circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          stroke={accentColor}
          strokeWidth={STROKE_WIDTH}
          fill="transparent"
          strokeLinecap="round"
          strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
          strokeDashoffset={strokeDashoffset}
          rotation="-90"
          originX={SIZE / 2}
          originY={SIZE / 2}
        />
      </Svg>

      <Text style={[styles.percent, { color: accentColor }]}>
        {progress}%
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    height: SIZE,
    justifyContent: "center",
    width: SIZE,
  },

  svg: {
    position: "absolute",
  },

  percent: {
    fontSize: 17,
    fontWeight: "300",
    letterSpacing: 0,
  },
});