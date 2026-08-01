import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Svg, { Path, Rect } from "react-native-svg";

import {
  AppButton,
  AppModal,
  AppText,
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
    <AppModal
      onClose={onClose}
      panelStyle={styles.card}
      variant="center"
      visible={visible}
    >
      <View style={styles.titleRow}>
        <View style={styles.titleGroup}>
          <CalendarGlyph />
          <AppText style={styles.title} variant="cardTitle">
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
        <AppText style={styles.monthLabel}>
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
          <AppText key={label} style={styles.weekdayLabel} variant="bodySmall">
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
            return (
              <Pressable
                accessibilityLabel={formatDayTitle(day)}
                accessibilityRole="button"
                accessibilityState={{ selected }}
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
                    selected && styles.dayLabelSelected,
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
    shadowColor: colors.accentViolet,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 12,
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
  selectButton: {
    backgroundColor: colors.accentVioletStrong,
    borderColor: colors.accentViolet,
    marginTop: spacing.lg,
    shadowColor: colors.accentViolet,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 14,
    elevation: 8,
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
  title: {
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
