import { Image } from "expo-image";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

import { AppText, Card, ProgressBar, ProgressRing } from "@/shared/components";
import { colors } from "@/theme/colors";
import { shadowStyle, spacing } from "@/theme/theme";

const RING_SIZE = 72;

const PORTAL_ART_SOURCE = require("../../../assets/sprint-door-icon.png");

interface TodayProgressCardProps {
  completedActions: number;
  totalActions: number;
  style?: StyleProp<ViewStyle>;
}

export function TodayProgressCard({
  completedActions,
  totalActions,
  style,
}: TodayProgressCardProps) {
  const percent =
    totalActions > 0 ? Math.round((completedActions / totalActions) * 100) : 0;

  return (
    <Card style={[styles.card, style]}>
      <Image contentFit="cover" source={PORTAL_ART_SOURCE} style={styles.portalArt} />
      <View style={styles.body}>
        <AppText color={colors.textPrimary} variant="bodySmall">
          Today&apos;s progress
        </AppText>
        <ProgressBar glow style={styles.bar} value={percent} />
      </View>
      <View style={styles.percent}>
        <ProgressRing
          backgroundColor={colors.surfaceDeep}
          size={RING_SIZE}
          value={percent}
        />
        <AppText color={colors.textSecondary} variant="caption">
          {completedActions} / {totalActions} actions
        </AppText>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  bar: {
    marginTop: 13,
  },
  body: {
    flex: 1,
    minWidth: 130,
  },
  card: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
    overflow: "hidden",
    ...shadowStyle({ color: colors.primary, elevation: 8, opacity: 0.12, radius: 12 }),
  },
  percent: {
    alignItems: "center",
    gap: spacing.xs,
  },
  portalArt: {
    borderColor: colors.borderSoft,
    borderRadius: 10,
    borderWidth: 1,
    height: 82,
    overflow: "hidden",
    width: 96,
  },
});
