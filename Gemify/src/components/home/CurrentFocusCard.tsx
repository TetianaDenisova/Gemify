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
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    marginBottom: 12,
    padding: 14,
  },
  check: {
    color: colors.background,
    fontSize: 10,
    fontWeight: "900",
    lineHeight: 13,
  },
  checkCircle: {
    alignItems: "center",
    borderRadius: 999,
    height: 16,
    justifyContent: "center",
    marginRight: 8,
    width: 16,
  },
  chevron: {
    color: colors.textSecondary,
    fontSize: 28,
    lineHeight: 30,
    marginLeft: 12,
  },
  content: {
    flex: 1,
    paddingLeft: 12,
  },
  icon: {
    fontSize: 20,
    fontWeight: "800",
  },
  iconBubble: {
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderRadius: 999,
    borderWidth: 1,
    height: 46,
    justifyContent: "center",
    width: 46,
  },
  statusLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 16,
  },
  statusRow: {
    alignItems: "center",
    flexDirection: "row",
    marginTop: 8,
  },
  timeLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 16,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0,
    lineHeight: 22,
    marginTop: 2,
  },
});
