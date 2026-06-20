import { StyleSheet, Text, View } from "react-native";

import type { FocusIconKey, FocusItem, ThemeColor } from "@/data/homeData";
import { colors } from "@/theme/colors";

interface CurrentFocusCardProps {
  item: FocusItem;
}

function getThemeColor(themeColor: ThemeColor) {
  return themeColor === "gold" ? colors.gold : colors.purple;
}

function getIconSymbol(iconKey: FocusIconKey) {
  switch (iconKey) {
    case "lotus":
      return "✧";
    case "sunrise":
      return "☼";
    case "heart":
      return "♡";
  }
}

export function CurrentFocusCard({ item }: CurrentFocusCardProps) {
  const accentColor = getThemeColor(item.themeColor);

  return (
    <View style={styles.card}>
      <View style={[styles.iconBubble, { borderColor: accentColor }]}>
        <Text style={[styles.icon, { color: accentColor }]}>
          {getIconSymbol(item.iconKey)}
        </Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.timeLabel}>{item.timeLabel}</Text>
        <Text style={styles.title}>{item.title}</Text>
        <View style={styles.statusRow}>
          <View style={[styles.checkCircle, { backgroundColor: accentColor }]}>
            <Text style={styles.check}>✓</Text>
          </View>
          <Text style={styles.statusLabel}>{item.statusLabel}</Text>
        </View>
      </View>

      <Text style={styles.chevron}>›</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: "center",
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    marginBottom: 7,
    minHeight: 56,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  check: {
    color: colors.background,
    fontSize: 8,
    fontWeight: "900",
    lineHeight: 10,
  },
  checkCircle: {
    alignItems: "center",
    borderRadius: 999,
    height: 13,
    justifyContent: "center",
    marginRight: 6,
    width: 13,
  },
  chevron: {
    color: colors.textSecondary,
    fontSize: 23,
    lineHeight: 25,
    marginLeft: 8,
  },
  content: {
    flex: 1,
    paddingLeft: 9,
  },
  icon: {
    fontSize: 16,
    fontWeight: "800",
  },
  iconBubble: {
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderRadius: 999,
    borderWidth: 1,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  statusLabel: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: "700",
    lineHeight: 12,
  },
  statusRow: {
    alignItems: "center",
    flexDirection: "row",
    marginTop: 3,
  },
  timeLabel: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: "700",
    lineHeight: 12,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 0,
    lineHeight: 17,
    marginTop: 1,
  },
});
