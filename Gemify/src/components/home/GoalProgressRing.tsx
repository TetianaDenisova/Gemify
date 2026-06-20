import { StyleSheet, Text, View } from "react-native";

import type { ThemeColor } from "@/data/homeData";
import { colors } from "@/theme/colors";

interface GoalProgressRingProps {
  progressPercent: number;
  themeColor: ThemeColor;
}

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

  return (
    <View style={[styles.ring, { borderColor: accentColor }]}>
      <Text style={[styles.percent, { color: accentColor }]}>
        {clampProgress(progressPercent)}%
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  percent: {
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 0,
  },
  ring: {
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderRadius: 999,
    borderWidth: 3,
    height: 58,
    justifyContent: "center",
    width: 58,
  },
});
