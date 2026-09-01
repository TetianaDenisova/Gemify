import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import {
  AppButton,
  AppModal,
  AppText,
  CalendarIcon,
  ChevronIcon,
  CloseIcon,
} from "@/shared/components";
import { colors } from "@/theme/colors";
import {
  fontSizes,
  fonts,
  lineHeights,
  pressed,
  radius,
  shadowStyle,
  spacing,
} from "@/theme/theme";

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

/** Whether `a` falls on an earlier calendar day than `b` (times ignored). */
function isBeforeDay(a: Date, b: Date) {
  return (
    new Date(a.getFullYear(), a.getMonth(), a.getDate()).getTime() <
    new Date(b.getFullYear(), b.getMonth(), b.getDate()).getTime()
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

type DatePickerModalProps = {
  initialDate: Date;
  /** Days before this date are disabled (e.g. today, when scheduling). */
  minDate?: Date;
  onClose: () => void;
  onSelect: (date: Date) => void;
  today: Date;
  visible: boolean;
};

export function DatePickerModal({
  initialDate,
  minDate,
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
    <AppModal
      onClose={onClose}
      panelStyle={styles.card}
      variant="center"
      visible={visible}
    >
      <View style={styles.titleRow}>
        <View style={styles.titleGroup}>
          <CalendarIcon size={22} />
          <AppText variant="titleSm">
            Choose a date
          </AppText>
        </View>
        <Pressable
          accessibilityLabel="Close calendar"
          accessibilityRole="button"
          hitSlop={8}
          onPress={onClose}
          style={({ pressed: isPressed }) => [
            styles.closeButton,
            isPressed && pressed,
          ]}
        >
          <CloseIcon color={colors.textSecondary} strokeWidth={1.9} />
        </Pressable>
      </View>

      <AppText style={styles.selectedDate} variant="cardTitle">
        {formatDayTitle(pendingDate)}
      </AppText>
      <AppText style={styles.selectedCaption} variant="meta">
        Selected date
      </AppText>

      <View style={styles.monthRow}>
        <Pressable
          accessibilityLabel="Previous month"
          accessibilityRole="button"
          hitSlop={8}
          onPress={() => shiftMonth(-1)}
          style={({ pressed: isPressed }) => [
            styles.monthArrow,
            isPressed && pressed,
          ]}
        >
          <ChevronIcon
            color={colors.textPrimary}
            direction="left"
            size={22}
            strokeWidth={1.9}
          />
        </Pressable>
        <AppText style={styles.monthLabel} variant="titleSm">
          {MONTH_NAMES[viewMonth]} {viewYear}
        </AppText>
        <Pressable
          accessibilityLabel="Next month"
          accessibilityRole="button"
          hitSlop={8}
          onPress={() => shiftMonth(1)}
          style={({ pressed: isPressed }) => [
            styles.monthArrow,
            isPressed && pressed,
          ]}
        >
          <ChevronIcon
            color={colors.textPrimary}
            direction="right"
            size={22}
            strokeWidth={1.9}
          />
        </Pressable>
      </View>

      <View style={styles.weekdayRow}>
        {WEEKDAY_LABELS.map((label) => (
          <AppText key={label} style={styles.weekdayLabel} variant="labelStrong">
            {label}
          </AppText>
        ))}
      </View>

      {weeks.map((week) => (
        <View key={week[0].toISOString()} style={styles.weekRow}>
          {week.map((day) => {
            const inMonth = day.getMonth() === viewMonth;
            const selected = isSameDay(day, pendingDate);
            const isToday = isSameDay(day, today);
            const disabled = minDate !== undefined && isBeforeDay(day, minDate);
            return (
              <Pressable
                accessibilityLabel={formatDayTitle(day)}
                accessibilityRole="button"
                accessibilityState={{ disabled, selected }}
                disabled={disabled}
                key={day.toISOString()}
                onPress={() => setPendingDate(day)}
                style={({ pressed: isPressed }) => [
                  styles.dayCell,
                  isToday && !selected && styles.dayCellToday,
                  selected && styles.dayCellSelected,
                  isPressed && pressed,
                ]}
              >
                <AppText
                  style={[
                    styles.dayLabel,
                    !inMonth && styles.dayLabelOutside,
                    disabled && styles.dayLabelDisabled,
                  ]}
                >
                  {day.getDate()}
                </AppText>
                {isToday && !selected ? <View style={styles.todayDot} /> : null}
              </Pressable>
            );
          })}
        </View>
      ))}

      <View style={styles.legendRow}>
        <View style={styles.legendDot} />
        <AppText style={styles.legendLabel} variant="bodySmall">
          Today
        </AppText>
      </View>

      <AppButton
        accessibilityLabel="Select date"
        label="Select"
        onPress={() => onSelect(pendingDate)}
        style={styles.selectButton}
        textStyle={styles.selectButtonLabel}
        variant="secondary"
      />
    </AppModal>
  );
}

const styles = StyleSheet.create({
  card: {
    borderColor: colors.accentVioletGlow,
    borderWidth: 1.5,
    maxWidth: 420,
    alignSelf: "center",
    ...shadowStyle({ color: colors.accentViolet, elevation: 12, opacity: 0.35, radius: 24 }),
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
    backgroundColor: colors.accentVioletStrong,
    borderColor: colors.primary,
  },
  dayCellToday: {
    borderColor: colors.borderStrong,
  },
  dayLabel: {
    color: colors.textPrimary,
    fontFamily: fonts.serif,
    fontSize: fontSizes.lg,
    lineHeight: lineHeights.lg,
  },
  dayLabelDisabled: {
    color: colors.textMuted,
    opacity: 0.4,
  },
  dayLabelOutside: {
    color: colors.textMuted,
  },
  legendDot: {
    backgroundColor: colors.primary,
    borderRadius: radius.round,
    height: 7,
    width: 7,
  },
  legendLabel: {
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
    fontSize: fontSizes.xxl,
    lineHeight: lineHeights.xxl,
  },
  monthRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.lg,
  },
  selectButton: {
    backgroundColor: colors.accentVioletStrong,
    borderColor: colors.accentViolet,
    marginTop: spacing.lg,
    ...shadowStyle({ color: colors.accentViolet, elevation: 8, opacity: 0.5, radius: 14 }),
  },
  selectButtonLabel: {
    color: colors.textPrimary,
  },
  selectedCaption: {
    marginTop: spacing.xs,
  },
  selectedDate: {
    marginTop: spacing.md,
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
  /** Small gold marker under the day number in the "today" cell (legend match). */
  todayDot: {
    backgroundColor: colors.primary,
    borderRadius: radius.round,
    bottom: 5,
    height: 5,
    position: "absolute",
    width: 5,
  },
  weekRow: {
    flexDirection: "row",
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  weekdayLabel: {
    flex: 1,
    textAlign: "center",
  },
  weekdayRow: {
    flexDirection: "row",
    gap: spacing.xs,
    marginTop: spacing.md,
  },
});
