import { useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Path, Rect } from "react-native-svg";

import { colors } from "@/theme/colors";
import { fontSizes, fonts, lineHeights, radius, spacing, typography } from "@/theme/theme";

const PURPLE = "#C79BFF";
const PURPLE_FILL = "#8A55D6";
const PURPLE_BORDER = "rgba(199, 155, 255, 0.6)";

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;
const WEEKDAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function formatDayTitle(date: Date) {
  return `${WEEKDAY_NAMES[date.getDay()]}, ${MONTH_NAMES[date.getMonth()]} ${date.getDate()}`;
}

/** Monday-first weeks covering the given month, padded with adjacent-month days. */
function buildWeeks(year: number, month: number): Date[][] {
  const firstOffset = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const weekCount = Math.ceil((firstOffset + daysInMonth) / 7);

  return Array.from({ length: weekCount }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => new Date(year, month, 1 - firstOffset + w * 7 + d)),
  );
}

function CalendarGlyph({ size = 22 }: { size?: number }) {
  return (
    <Svg height={size} viewBox="0 0 24 24" width={size}>
      <Rect
        fill="none"
        height={15}
        rx={2.4}
        stroke={colors.primary}
        strokeWidth={1.6}
        width={18}
        x={3}
        y={5}
      />
      <Path
        d="M7 3v4M17 3v4M3 10h18"
        fill="none"
        stroke={colors.primary}
        strokeLinecap="round"
        strokeWidth={1.6}
      />
    </Svg>
  );
}

function ChevronIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <Svg height={22} viewBox="0 0 24 24" width={22}>
      <Path
        d={direction === "left" ? "m14 6-6 6 6 6" : "m10 6 6 6-6 6"}
        fill="none"
        stroke={colors.textPrimary}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.9}
      />
    </Svg>
  );
}

function CloseIcon() {
  return (
    <Svg height={20} viewBox="0 0 24 24" width={20}>
      <Path
        d="m6 6 12 12M18 6 6 18"
        fill="none"
        stroke={colors.textSecondary}
        strokeLinecap="round"
        strokeWidth={1.9}
      />
    </Svg>
  );
}

type DatePickerModalProps = {
  initialDate: Date;
  onClose: () => void;
  onSelect: (date: Date) => void;
  today: Date;
  visible: boolean;
};

export function DatePickerModal({
  initialDate,
  onClose,
  onSelect,
  today,
  visible,
}: DatePickerModalProps) {
  const [pendingDate, setPendingDate] = useState(initialDate);
  const [viewYear, setViewYear] = useState(initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialDate.getMonth());

  function shiftMonth(delta: -1 | 1) {
    const next = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth());
  }

  const weeks = buildWeeks(viewYear, viewMonth);

  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible={visible}>
      <Pressable accessibilityLabel="Dismiss calendar" onPress={onClose} style={styles.overlay}>
        <Pressable onPress={() => {}} style={styles.card}>
          <View style={styles.titleRow}>
            <View style={styles.titleGroup}>
              <CalendarGlyph />
              <Text style={styles.title}>Choose a date</Text>
            </View>
            <Pressable
              accessibilityLabel="Close calendar"
              accessibilityRole="button"
              hitSlop={8}
              onPress={onClose}
              style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
            >
              <CloseIcon />
            </Pressable>
          </View>

          <Text style={styles.selectedDate}>{formatDayTitle(pendingDate)}</Text>
          <Text style={styles.selectedCaption}>Selected date</Text>

          <View style={styles.monthRow}>
            <Pressable
              accessibilityLabel="Previous month"
              accessibilityRole="button"
              hitSlop={8}
              onPress={() => shiftMonth(-1)}
              style={({ pressed }) => [styles.monthArrow, pressed && styles.pressed]}
            >
              <ChevronIcon direction="left" />
            </Pressable>
            <Text style={styles.monthLabel}>
              {MONTH_NAMES[viewMonth]} {viewYear}
            </Text>
            <Pressable
              accessibilityLabel="Next month"
              accessibilityRole="button"
              hitSlop={8}
              onPress={() => shiftMonth(1)}
              style={({ pressed }) => [styles.monthArrow, pressed && styles.pressed]}
            >
              <ChevronIcon direction="right" />
            </Pressable>
          </View>

          <View style={styles.weekdayRow}>
            {WEEKDAY_LABELS.map((label) => (
              <Text key={label} style={styles.weekdayLabel}>
                {label}
              </Text>
            ))}
          </View>

          {weeks.map((week) => (
            <View key={week[0].toISOString()} style={styles.weekRow}>
              {week.map((day) => {
                const inMonth = day.getMonth() === viewMonth;
                const selected = isSameDay(day, pendingDate);
                const isToday = isSameDay(day, today);
                return (
                  <Pressable
                    accessibilityLabel={formatDayTitle(day)}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    key={day.toISOString()}
                    onPress={() => setPendingDate(day)}
                    style={({ pressed }) => [
                      styles.dayCell,
                      isToday && !selected && styles.dayCellToday,
                      selected && styles.dayCellSelected,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayLabel,
                        !inMonth && styles.dayLabelOutside,
                        selected && styles.dayLabelSelected,
                      ]}
                    >
                      {day.getDate()}
                    </Text>
                    {isToday && !selected ? <View style={styles.todayDot} /> : null}
                  </Pressable>
                );
              })}
            </View>
          ))}

          <View style={styles.legendRow}>
            <View style={styles.legendDot} />
            <Text style={styles.legendLabel}>Today</Text>
          </View>

          <Pressable
            accessibilityLabel="Select date"
            accessibilityRole="button"
            onPress={() => onSelect(pendingDate)}
            style={({ pressed }) => [styles.selectButton, pressed && styles.pressed]}
          >
            <Text style={styles.selectButtonLabel}>Select</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "rgba(9, 13, 28, 0.98)",
    borderColor: PURPLE_BORDER,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    maxWidth: 420,
    padding: spacing.lg,
    shadowColor: PURPLE,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 12,
    width: "100%",
  },
  closeButton: {
    alignItems: "center",
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  dayCell: {
    alignItems: "center",
    borderColor: colors.transparent,
    borderRadius: radius.round,
    borderWidth: 1.5,
    flex: 1,
    height: 44,
    justifyContent: "center",
  },
  dayCellSelected: {
    backgroundColor: PURPLE_FILL,
    borderColor: colors.primary,
  },
  dayCellToday: {
    borderColor: "rgba(245, 184, 75, 0.7)",
  },
  dayLabel: {
    color: colors.textPrimary,
    fontFamily: fonts.serif,
    fontSize: fontSizes.lg,
    lineHeight: lineHeights.lg,
  },
  dayLabelOutside: {
    color: colors.textMuted,
  },
  dayLabelSelected: {
    fontWeight: "700",
  },
  legendDot: {
    backgroundColor: colors.primary,
    borderRadius: radius.round,
    height: 7,
    width: 7,
  },
  legendLabel: {
    color: colors.textSecondary,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
  },
  legendRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "center",
    marginTop: spacing.md,
  },
  monthArrow: {
    alignItems: "center",
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  monthLabel: {
    color: colors.textPrimary,
    fontFamily: fonts.serif,
    fontSize: fontSizes.xxl,
    fontWeight: "500",
    lineHeight: lineHeights.xxl,
  },
  monthRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.lg,
  },
  overlay: {
    alignItems: "center",
    backgroundColor: colors.overlayDark,
    flex: 1,
    justifyContent: "center",
    padding: spacing.lg,
  },
  pressed: {
    opacity: 0.72,
    transform: [{ scale: 0.98 }],
  },
  selectButton: {
    alignItems: "center",
    backgroundColor: PURPLE_FILL,
    borderColor: "rgba(199, 155, 255, 0.9)",
    borderRadius: radius.md,
    borderWidth: 1,
    height: 56,
    justifyContent: "center",
    marginTop: spacing.lg,
    shadowColor: PURPLE,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 14,
    elevation: 8,
  },
  selectButtonLabel: {
    ...typography.button,
  },
  selectedCaption: {
    color: colors.textSecondary,
    fontSize: fontSizes.md,
    lineHeight: lineHeights.md,
    marginTop: spacing.xs,
  },
  selectedDate: {
    ...typography.cardTitle,
    marginTop: spacing.md,
  },
  title: {
    ...typography.cardTitle,
    fontSize: fontSizes.cardTitle - 4,
    lineHeight: lineHeights.cardTitle - 4,
  },
  titleGroup: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm + 2,
  },
  titleRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  weekRow: {
    flexDirection: "row",
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  weekdayLabel: {
    color: colors.textSecondary,
    flex: 1,
    fontSize: fontSizes.sm,
    fontWeight: "600",
    lineHeight: lineHeights.sm,
    textAlign: "center",
  },
  weekdayRow: {
    flexDirection: "row",
    gap: spacing.xs,
    marginTop: spacing.md,
  },
});
