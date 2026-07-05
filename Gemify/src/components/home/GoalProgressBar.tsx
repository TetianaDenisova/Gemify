import { StyleSheet, View } from "react-native";

import type { ThemeColor } from "@/data/homeData";
import { colors } from "@/theme/colors";
import { radius } from "@/theme/theme";

interface GoalProgressBarProps {
  progressPercent: number;
  themeColor: ThemeColor;
}

function getThemeColor(themeColor: ThemeColor) {
  return themeColor === "gold" ? colors.primary : colors.primarySoft;
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
    borderRadius: radius.round,
    height: "100%",
  },
  track: {
    backgroundColor: colors.borderSoft,
    borderRadius: radius.round,
    height: 3,
    overflow: "hidden",
    width: "100%",
  },
});
