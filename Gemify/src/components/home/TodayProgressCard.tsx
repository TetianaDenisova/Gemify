import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

import {
  AppText,
  Card,
  ProgressBar,
  ProgressRing,
  SparkIcon,
} from "@/shared/components";
import { colors } from "@/theme/colors";
import { radius, spacing } from "@/theme/theme";

const RING_SIZE = 64;

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
      <View style={styles.iconFrame}>
        <SparkIcon />
      </View>
      <View style={styles.body}>
        <AppText variant="cardTitle">Today’s progress</AppText>
        <AppText color={colors.primary} style={styles.meta} variant="bodySmall">
          {completedActions} / {totalActions} actions completed
        </AppText>
        <ProgressBar style={styles.bar} value={percent} />
      </View>
      <ProgressRing size={RING_SIZE} value={percent} />
    </Card>
  );
}

const styles = StyleSheet.create({
  bar: {
    marginTop: spacing.sm + spacing.xs,
  },
  body: {
    flex: 1,
    minWidth: 0,
  },
  card: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
  },
  iconFrame: {
    alignItems: "center",
    backgroundColor: colors.surfaceDeep,
    borderColor: colors.borderFaint,
    borderRadius: radius.round,
    borderWidth: 1,
    height: 56,
    justifyContent: "center",
    width: 56,
  },
  meta: {
    marginTop: spacing.xs,
  },
});
