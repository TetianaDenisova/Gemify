import { Image } from "expo-image";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

import { AppText, Card, ProgressBar } from "@/shared/components";
import { colors } from "@/theme/colors";
import { radius, shadowStyle, spacing } from "@/theme/theme";

const PORTAL_ART_SOURCE = require("../../../assets/sprint-door-icon.png");

interface TodayProgressCardProps {
  completedActions: number;
  totalActions: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * The day's scoreboard: portal art · "Today's progress" over a long gold
 * bar · the big "done / total" count with an ACTIONS label.
 */
export function TodayProgressCard({
  completedActions,
  totalActions,
  style,
}: TodayProgressCardProps) {
  const percent =
    totalActions > 0 ? Math.round((completedActions / totalActions) * 100) : 0;

  return (
    <Card style={[styles.card, style]}>
      <Image
        contentFit="cover"
        source={PORTAL_ART_SOURCE}
        style={styles.portalArt}
      />
      <View style={styles.body}>
        <AppText color={colors.textPrimary} variant="pill">
          Today&apos;s progress
        </AppText>
        <ProgressBar glow height={7} style={styles.bar} value={percent} />
      </View>
      <View style={styles.count}>
        <AppText color={colors.primary} variant="cardTitle">
          {completedActions} / {totalActions}
        </AppText>
        <AppText
          color={colors.textMuted}
          style={styles.countLabel}
          variant="captionStrong"
        >
          ACTIONS
        </AppText>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  bar: {
    marginTop: spacing.lg,
  },
  body: {
    flex: 1,
    minWidth: 130,
  },
  // Flat edge-to-edge footer strip: no rounding or border, solid surface to
  // match the flat tab bar it sits on.
  card: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 0,
    borderWidth: 0,
    flexDirection: "row",
    gap: spacing.lg,
    overflow: "hidden",
    ...shadowStyle({ color: colors.primary, elevation: 8, opacity: 0.12, radius: 12 }),
  },
  count: {
    alignItems: "center",
  },
  countLabel: {
    letterSpacing: 2,
  },
  portalArt: {
    borderColor: colors.borderSoft,
    borderRadius: radius.md,
    borderWidth: 1,
    height: 92,
    overflow: "hidden",
    width: 92,
  },
});
