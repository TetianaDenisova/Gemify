import { StyleSheet, View } from "react-native";

import { AppText, Card, CheckIcon } from "@/shared/components";
import { colors } from "@/theme/colors";
import { radius, spacing } from "@/theme/theme";

interface DayCompleteCardProps {
  completed: number;
  total: number;
}

/**
 * Shown in place of the Current Focus block once every action planned for
 * today is checked off: gold-ringed check · "You kept your word" · the
 * done/total tally.
 */
export function DayCompleteCard({ completed, total }: DayCompleteCardProps) {
  return (
    <Card style={styles.card}>
      <View style={styles.checkRing}>
        <CheckIcon color={colors.primary} size={22} />
      </View>
      <View style={styles.copy}>
        <AppText color={colors.textPrimary} variant="pill">
          You kept your word
        </AppText>
        <AppText style={styles.subtitle} variant="bodySmall">
          Every quest planned for today is complete.
        </AppText>
      </View>
      <View style={styles.count}>
        <AppText color={colors.primary} variant="titleSm">
          {completed} / {total}
        </AppText>
        <AppText
          color={colors.primary}
          style={styles.countLabel}
          variant="captionStrong"
        >
          COMPLETE
        </AppText>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: "center",
    borderWidth: 0,
    flexDirection: "row",
    gap: spacing.md,
  },
  checkRing: {
    alignItems: "center",
    borderColor: colors.primary,
    borderRadius: radius.round,
    borderWidth: 1.5,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  count: {
    alignItems: "center",
  },
  countLabel: {
    letterSpacing: 2,
  },
  subtitle: {
    marginTop: spacing.xs,
  },
});
