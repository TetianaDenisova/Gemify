import { Pressable, StyleSheet, View } from "react-native";

import { AppText } from "@/shared/components";
import { colors } from "@/theme/colors";
import { shadowStyle, typography } from "@/theme/theme";

export type HabitCompletion = "done" | "missed" | "open" | "partial";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

function DayStatus({
  phone,
  status,
}: {
  phone: boolean;
  status: HabitCompletion;
}) {
  if (status === "partial") {
    return (
      <View style={[styles.partialDot, phone && styles.partialDotPhone]}>
        <View style={styles.partialFill} />
      </View>
    );
  }

  return (
    <View
      style={[
        styles.dayDot,
        phone && styles.dayDotPhone,
        status === "done" && styles.dayDotDone,
        status === "missed" && styles.dayDotMissed,
      ]}
    />
  );
}
export function HabitProgress({
  activeDayIndex,
  compact = false,
  expanded = false,
  onDayPress,
  phone = false,
  progress,
}: {
  activeDayIndex?: number;
  compact?: boolean;
  expanded?: boolean;
  /** When set, day cells become tappable (used to toggle completions). */
  onDayPress?: (dayIndex: number) => void;
  phone?: boolean;
  progress: readonly HabitCompletion[];
}) {
  return (
    <View
      style={[
        styles.progressRow,
        expanded && styles.progressRowExpanded,
        compact && styles.progressRowCompact,
      ]}
    >
      {DAYS.map((day, index) => {
        const highlighted = index === activeDayIndex;

        return (
          <Pressable
            accessibilityLabel={`${day} status`}
            disabled={!onDayPress}
            key={day}
            onPress={() => onDayPress?.(index)}
            style={[
              styles.dayCell,
              highlighted && !expanded && styles.dayCellHighlighted,
              expanded && styles.dayCellExpanded,
              compact && styles.dayCellCompact,
            ]}
          >
            <AppText
              style={[
                expanded && styles.dayLabelExpanded,
                highlighted && styles.dayLabelHighlighted,
              ]}
              variant="captionStrong"
            >
              {expanded ? day : day.toUpperCase()}
            </AppText>
            <DayStatus phone={phone} status={progress[index] ?? "missed"} />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  dayCell: {
    alignItems: "center",
    borderRadius: 12,
    gap: 16,
    justifyContent: "center",
    minHeight: 86,
    minWidth: 68,
    paddingHorizontal: 5,
    paddingVertical: 10,
  },
  dayCellCompact: {
    flex: 1,
    gap: 10,
    minHeight: 66,
    minWidth: 0,
    paddingHorizontal: 2,
  },
  dayCellExpanded: {
    gap: 14,
    minHeight: 78,
  },
  dayCellHighlighted: {
    backgroundColor: "rgba(116, 62, 170, 0.34)",
    borderColor: colors.accentVioletStrong,
    borderWidth: 1.2,
    ...shadowStyle({ color: colors.accentVioletStrong, opacity: 0.62, radius: 14 }),
  },
  dayDotPhone: {
    borderRadius: 12,
    height: 24,
    width: 24,
  },
  dayDot: {
    borderColor: colors.primary,
    borderRadius: 15,
    borderWidth: 2,
    height: 30,
    width: 30,
  },
  dayDotDone: {
    backgroundColor: colors.primary,
    ...shadowStyle({ color: colors.primary, opacity: 0.72, radius: 11 }),
  },
  dayDotMissed: {
    borderColor: colors.textMuted,
  },
  dayLabelExpanded: {
    ...typography.pill,
    color: colors.textSecondary,
  },
  dayLabelHighlighted: {
    color: colors.accentViolet,
  },
  partialDotPhone: {
    borderRadius: 12,
    height: 24,
    width: 24,
  },
  partialDot: {
    borderColor: colors.primary,
    borderRadius: 15,
    borderWidth: 2,
    height: 30,
    overflow: "hidden",
    width: 30,
  },
  partialFill: {
    backgroundColor: colors.primary,
    height: "100%",
    width: "50%",
  },
  progressRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginLeft: 9,
    marginTop: 14,
  },
  progressRowCompact: {
    marginLeft: 0,
    width: "100%",
  },
  progressRowExpanded: {
    marginLeft: 0,
    marginTop: 24,
  },
});
