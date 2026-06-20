import { StyleSheet, View } from "react-native";

import type { ThemeColor } from "@/data/homeData";
import { colors } from "@/theme/colors";

interface GoalProgressBarProps {
  progressPercent: number;
  themeColor: ThemeColor;
}

function getThemeColor(themeColor: ThemeColor) {
  return themeColor === "gold" ? colors.gold : colors.purple;
}

function clampProgress(progressPercent: number) {
  return Math.max(0, Math.min(100, progressPercent));
}

export function GoalProgressBar({
  progressPercent,
  themeColor,
}: GoalProgressBarProps) {
  const clampedProgress = clampProgress(progressPercent);
  const progressWidth = `${clampedProgress}%` as `${number}%`;

  return (
    <View style={styles.track}>
      <View
        style={[
          styles.fill,
          {
            backgroundColor: getThemeColor(themeColor),
            width: progressWidth,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    borderRadius: 999,
    height: "100%",
  },
  track: {
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    borderRadius: 999,
    height: 8,
    overflow: "hidden",
    width: "100%",
  },
});
