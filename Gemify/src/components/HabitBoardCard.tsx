import type { ReactNode } from "react";
import {
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import Svg, { Circle, Path } from "react-native-svg";

import { HabitItemRow, type HabitCompletion } from "@/components/HabitItem";
import type { HabitDetailSection as DbHabitDetailSection } from "@/db";
import type { HabitWeekView } from "@/hooks/useHabitWeek";
import { AppText, Checkbox } from "@/shared/components";
import { colors } from "@/theme/colors";
import {
  fontSizes,
  lineHeights,
  pressed,
  spacing,
} from "@/theme/theme";

export type BoardDetailSection = {
  /** Rows with a checkbox toggle today's "partial" status; plan rows do not. */
  checkable: boolean;
  icon: "sun" | "feather" | "shield";
  /** The DB detail section backing this panel (check state is stored by it). */
  key: DbHabitDetailSection;
  rows: readonly string[];
  title: string;
};

export type BoardHabit = {
  accent: string;
  day: number;
  details: readonly BoardDetailSection[];
  goal: number;
  icon: "workout" | "water" | "book" | "meditate";
  id: number;
  progress: readonly HabitCompletion[];
  time: string;
  title: string;
};

const HABIT_ICON_CYCLE = ["workout", "water", "book", "meditate"] as const;

/** DB habit view → the row shape the habit board renders. */
export function toBoardHabit(
  view: HabitWeekView,
  index: number,
  tint: string,
): BoardHabit {
  const rowsFor = (...sections: string[]) =>
    view.details
      .filter((entry) => sections.includes(entry.section))
      .map((entry) => entry.content);

  // Three panels: the two ease helpers are checkable — ticking one marks
  // today half-done — and the contingency plan is read-only. A section with
  // no content stays hidden.
  const allSections: BoardDetailSection[] = [
    {
      checkable: true,
      icon: "sun",
      key: "easy_start",
      rows: rowsFor("easy_start"),
      title: "Make It Easy",
    },
    {
      checkable: true,
      icon: "feather",
      key: "easy_version",
      rows: rowsFor("easy_version"),
      title: "Easy version for a bad day",
    },
    {
      checkable: false,
      icon: "shield",
      key: "backup_plan",
      rows: rowsFor("backup_plan"),
      title: "Obstacles & backup plan",
    },
  ];
  const sections = allSections.filter((section) => section.rows.length > 0);

  return {
    accent: tint,
    day: view.doneCount,
    details: sections,
    goal: view.habit.goalDays,
    icon: HABIT_ICON_CYCLE[index % HABIT_ICON_CYCLE.length],
    id: view.habit.id,
    progress: view.weekProgress,
    time: view.habit.cue || view.timeLabel,
    title: view.habit.title,
  };
}

export function DetailIcon({
  icon,
  size = 58,
}: {
  icon: BoardDetailSection["icon"];
  size?: number;
}) {
  if (icon === "feather") {
    return (
      <Svg height={size} viewBox="0 0 64 64" width={size}>
        <Circle cx={32} cy={32} fill="#160B2C" r={29} />
        <Circle cx={32} cy={32} fill={colors.accentVioletStrong} opacity={0.18} r={23} />
        <Circle cx={32} cy={32} fill="none" r={27} stroke={colors.primary} strokeWidth={1.4} />
        <Path
          d="M46 15C32 17 21 27.5 18 47c11.5-2 22.5-12.5 28-32Z"
          fill="#EBC3FF"
          stroke={colors.accentVioletStrong}
          strokeLinejoin="round"
          strokeWidth={1.8}
        />
        <Path
          d="M19 46c8.7-10.7 15.4-16.4 25-25M28 36l-7 15"
          fill="none"
          stroke="#F8DDA0"
          strokeLinecap="round"
          strokeWidth={1.6}
        />
      </Svg>
    );
  }

  if (icon === "shield") {
    return (
      <Svg height={size} viewBox="0 0 64 64" width={size}>
        <Circle cx={32} cy={32} fill="#160B2C" r={29} />
        <Circle cx={32} cy={32} fill={colors.accentVioletStrong} opacity={0.18} r={23} />
        <Circle cx={32} cy={32} fill="none" r={27} stroke={colors.primary} strokeWidth={1.4} />
        <Path
          d="M32 14 47 20v13.4c0 9.9-6.1 16.1-15 20.2-8.9-4.1-15-10.3-15-20.2V20l15-6Z"
          fill="none"
          stroke="#EBC3FF"
          strokeLinejoin="round"
          strokeWidth={2.4}
        />
        <Path
          d="M32 20v26"
          fill="none"
          opacity={0.55}
          stroke="#F8DDA0"
          strokeLinecap="round"
          strokeWidth={1.8}
        />
      </Svg>
    );
  }

  return (
    <Svg height={size} viewBox="0 0 64 64" width={size}>
      <Circle cx={32} cy={32} fill="#160B2C" r={29} />
      <Circle cx={32} cy={32} fill={colors.accentVioletStrong} opacity={0.18} r={23} />
      <Circle cx={32} cy={32} fill="none" r={27} stroke={colors.primary} strokeWidth={1.4} />
      <Path
        d="M16 40h32M20 36c3.8-9 8-13 12-13s8.2 4 12 13"
        fill="none"
        stroke="#EBC3FF"
        strokeLinecap="round"
        strokeWidth={2.2}
      />
      <Path
        d="M32 17v-5M20.5 22.5 17 19M43.5 22.5 47 19M24 42h16"
        fill="none"
        stroke="#F8DDA0"
        strokeLinecap="round"
        strokeWidth={1.8}
      />
    </Svg>
  );
}

export function HabitDetailSectionView({
  checked = false,
  compact,
  onToggleRow,
  section,
}: {
  /** Whether this section's checkboxes show as ticked for today. */
  checked?: boolean;
  compact: boolean;
  /** Called when a checkable row is ticked/unticked. */
  onToggleRow?: () => void;
  section: BoardDetailSection;
}) {
  return (
    <View style={[styles.detailSection, compact && styles.detailSectionCompact]}>
      <View style={[styles.detailIconFrame, compact && styles.detailIconFrameCompact]}>
        <DetailIcon icon={section.icon} size={compact ? 44 : 58} />
      </View>
      <View style={styles.detailCopy}>
        <AppText
          color={colors.primary}
          style={compact && styles.detailTitleCompact}
          variant="pill"
        >
          {section.title}
        </AppText>
        {section.rows.map((row) => (
          <View key={row} style={[styles.detailRow, compact && styles.detailRowCompact]}>
            {section.checkable ? (
              <Checkbox
                accessibilityLabel={`Mark today as a small step: ${row}`}
                checked={checked}
                onPress={onToggleRow}
                shape="square"
              />
            ) : null}
            <AppText
              color={colors.textSecondary}
              style={[styles.detailText, compact && styles.detailTextCompact]}
              variant="body"
            >
              {row}
            </AppText>
          </View>
        ))}
      </View>
    </View>
  );
}

/**
 * A habit row/card for habit boards: header + week strip, and — when
 * expanded — the detail sections. The screen owns the container look via
 * `containerStyle`, an optional `trailing` control in the header (e.g. a
 * ⋮ menu) and an optional `footer` under the details (e.g. Edit/Delete).
 */
export function HabitBoardRow({
  activeDayIndex,
  checkedSections,
  compact,
  containerStyle,
  expanded,
  footer,
  habit,
  onDayPress,
  onDetailToggle,
  onPress,
  trailing,
}: {
  activeDayIndex: number;
  /** Detail sections whose checkboxes show as ticked today. */
  checkedSections?: readonly DbHabitDetailSection[];
  compact: boolean;
  containerStyle?: StyleProp<ViewStyle>;
  expanded: boolean;
  footer?: ReactNode;
  habit: BoardHabit;
  onDayPress?: (dayIndex: number) => void;
  /** Fired when a checkable section's checkbox is toggled. */
  onDetailToggle?: (section: DbHabitDetailSection) => void;
  onPress: () => void;
  trailing?: ReactNode;
}) {
  return (
    // No accessibilityRole="button": on web that renders a <button>, and the
    // nested day-cell/menu/footer buttons would be invalid HTML inside it.
    <Pressable
      accessibilityState={{ expanded }}
      onPress={onPress}
      style={({ pressed: isPressed }) => [containerStyle, isPressed && pressed]}
    >
      {/* Day cells stay tappable even collapsed, so a tap on a circle
          toggles that day instead of just expanding the row. */}
      <HabitItemRow
        activeDayIndex={activeDayIndex}
        compact={compact}
        expanded={expanded}
        habit={habit}
        onDayPress={onDayPress}
        trailing={trailing}
      />
      {expanded ? (
        <View style={styles.detailPanel}>
          {habit.details.map((section) => (
            <HabitDetailSectionView
              checked={checkedSections?.includes(section.key) ?? false}
              compact={compact}
              key={section.key}
              onToggleRow={() => onDetailToggle?.(section.key)}
              section={section}
            />
          ))}
          {footer}
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  detailCopy: {
    flex: 1,
    gap: spacing.md,
    minWidth: 0,
  },
  detailIconFrame: {
    alignItems: "center",
    height: 70,
    justifyContent: "center",
    width: 70,
  },
  detailIconFrameCompact: {
    height: 52,
    width: 52,
  },
  detailPanel: {
    borderTopColor: colors.borderSoft,
    borderTopWidth: 1,
    marginTop: spacing.lg,
  },
  detailRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
  },
  detailRowCompact: {
    gap: 12,
  },
  detailSection: {
    borderBottomColor: colors.borderSoft,
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: spacing.lg,
    paddingHorizontal: 12,
    paddingVertical: spacing.lg,
  },
  detailSectionCompact: {
    gap: spacing.md,
    paddingHorizontal: 2,
    paddingVertical: 18,
  },
  detailText: {
    flex: 1,
  },
  detailTextCompact: {
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.md,
  },
  detailTitleCompact: {
    fontSize: fontSizes.lg,
    lineHeight: lineHeights.lg,
  },
});
