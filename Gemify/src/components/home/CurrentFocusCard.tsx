import { Image } from "expo-image";
import { Platform, StyleSheet, Text, View } from "react-native";

import type { FocusItem, ThemeColor } from "@/data/homeData";
import { focusIcons } from "@/data/icons";
import { colors } from "@/theme/colors";
import { radius, shadows, spacing, typography } from "@/theme/theme";

interface CurrentFocusCardProps {
  item: FocusItem;
}

function getThemeColor(themeColor: ThemeColor) {
  return themeColor === "gold" ? colors.primary : colors.primarySoft;
}

export function CurrentFocusCard({ item }: CurrentFocusCardProps) {
  const accentColor = getThemeColor(item.themeColor);
  const iconSource = focusIcons[item.iconKey];

  return (
    <View style={styles.card}>
      <View style={styles.iconBox}>
        <View style={[styles.iconGlow, { backgroundColor: accentColor }]} />
        <Image
          source={iconSource}
          style={styles.iconImage}
          contentFit="contain"
        />
      </View>

      <View style={styles.textBlock}>
        <Text style={styles.timeLabel}>{item.timeLabel}</Text>
        <Text style={styles.title} numberOfLines={2}>
          {item.title}
        </Text>
      </View>

      <View style={styles.completedWrapper}>
        <View style={[styles.completedGlow, { backgroundColor: accentColor }]} />
        <View style={[styles.completedCircle, { borderColor: accentColor }]}>
          <Text style={[styles.check, { color: accentColor }]}>{"\u2713"}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    height: 86,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceGlass,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    marginBottom: spacing.sm,
    overflow: "hidden",
    ...shadows.softDark,
  },

  iconBox: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    backgroundColor: colors.secondaryDark,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
    overflow: "hidden",
  },

  iconGlow: {
    position: "absolute",
    width: 42,
    height: 42,
    borderRadius: radius.round,
    opacity: 0.16,
  },

  iconImage: {
    width: 38,
    height: 38,
  },

  textBlock: {
    flex: 1,
    paddingRight: 12,
  },

  timeLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 15,
    marginBottom: 4,
  },

  title: {
    ...typography.title,
    fontFamily: Platform.select({
      ios: "Georgia",
      android: "serif",
      default: "serif",
    }),
    fontSize: 16,
    lineHeight: 18,
    fontWeight: "400",
  },

  completedWrapper: {
    width: 76,
    height: 76,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },

  completedGlow: {
    position: "absolute",
    width: 35,
    height: 35,
    borderRadius: radius.round,
    opacity: 0.2,
  },

  completedCircle: {
    width: 35,
    height: 35,
    borderRadius: radius.round,
    borderWidth: 2,
    backgroundColor: colors.surfaceGlass,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.goldGlow,
  },

  check: {
    fontSize: 18,
    fontWeight: "400",
    lineHeight: 34,
  },
});
