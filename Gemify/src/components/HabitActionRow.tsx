import { StyleSheet, View } from "react-native";

import { DayActionRow, type DayActionRowProps } from "@/components/DayActionCard";
import { useLayoutSize } from "@/hooks/useLayoutSize";
import { AppText, FlameIcon } from "@/shared/components";
import { colors } from "@/theme/colors";

export function formatStreakDays(days: number): string {
  return `${days} ${days === 1 ? "day" : "days"}`;
}

export function HabitActionRow({
  streakDays,
  ...props
}: Omit<DayActionRowProps, "checkLabel" | "trailing"> & { streakDays: number }) {
  const { phone } = useLayoutSize();

  return (
    <DayActionRow
      {...props}
      checkLabel={`Mark ${props.title} ${props.done ? "not done" : "done"} today`}
      trailing={
        <View style={styles.streak}>
          <FlameIcon color={colors.primary} size={phone ? 18 : 22} />
          <AppText
            adjustsFontSizeToFit
            color={colors.primary}
            minimumFontScale={0.65}
            numberOfLines={1}
            style={[styles.streakText, phone && styles.streakTextPhone]}
            variant="pill"
          >
            {formatStreakDays(streakDays)}
          </AppText>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  streak: {
    alignItems: "center",
    flexDirection: "row",
    gap: 5,
  },
  streakText: {
    flexShrink: 1,
    fontSize: 18,
    lineHeight: 24,
  },
  streakTextPhone: {
    fontSize: 16,
    lineHeight: 22,
  },
});
