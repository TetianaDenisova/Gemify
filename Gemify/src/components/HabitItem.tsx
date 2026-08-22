import { useState, type ReactNode } from "react";
import {
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import Svg, { Circle, Line, Path } from "react-native-svg";

import { AppText, Card, CheckIcon, ChevronIcon } from "@/shared/components";
import { colors } from "@/theme/colors";
import {
  controls,
  fontSizes,
  lineHeights,
  shadowStyle,
  typography,
} from "@/theme/theme";

export type HabitCompletion = "done" | "missed" | "open" | "partial";

type Habit = {
  accent: string;
  day: number;
  goal: number;
  icon: "workout" | "water" | "book" | "meditate";
  progress: readonly HabitCompletion[];
  time: string;
  title: string;
};

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

/** Inner SVG size for the habit medallion; the frame around it is 12pt larger. */
const ART_SIZE = 90;
const ART_SIZE_COMPACT = 62;

function ClockIcon({ size = 17 }: { size?: number }) {
  return (
    <Svg height={size} viewBox="0 0 24 24" width={size}>
      <Circle
        cx={12}
        cy={12}
        fill="none"
        r={8.2}
        stroke={colors.textMuted}
        strokeWidth={1.9}
      />
      <Path
        d="M12 7.8v5l3.2 2"
        fill="none"
        stroke={colors.textMuted}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.9}
      />
    </Svg>
  );
}

function DayStatus({ status }: { status: HabitCompletion }) {
  if (status === "partial") {
    return (
      <View style={styles.partialDot}>
        <View style={styles.partialFill} />
      </View>
    );
  }

  return (
    <View
      style={[
        styles.dayDot,
        status === "done" && styles.dayDotDone,
        status === "missed" && styles.dayDotMissed,
      ]}
    />
  );
}

function HabitArt({
  accent,
  compact = false,
  icon,
}: {
  accent: string;
  compact?: boolean;
  icon: Habit["icon"];
}) {
  const artSize = compact ? ART_SIZE_COMPACT : ART_SIZE;

  return (
    <View
      style={[
        styles.habitArt,
        compact && styles.habitArtCompact,
        { borderColor: `${accent}A8` },
        shadowStyle({ color: accent, opacity: 0.5, radius: 16 }),
      ]}
    >
      <Svg height={artSize} viewBox="0 0 90 90" width={artSize}>
        <Circle cx={45} cy={45} fill="#050817" r={42} />
        <Circle cx={45} cy={45} fill={accent} opacity={0.15} r={34} />
        <Circle cx={45} cy={45} fill="none" opacity={0.58} r={37} stroke={accent} strokeWidth={1.4} />
        <Circle cx={45} cy={13.5} fill={accent} r={1.8} />
        <Circle cx={45} cy={76.5} fill={accent} r={1.8} />
        <Circle cx={13.5} cy={45} fill={accent} r={1.8} />
        <Circle cx={76.5} cy={45} fill={accent} r={1.8} />
        <Line opacity={0.35} stroke={accent} strokeWidth={1} x1={45} x2={45} y1={6} y2={12} />
        <Line opacity={0.35} stroke={accent} strokeWidth={1} x1={45} x2={45} y1={78} y2={84} />
        <Line opacity={0.35} stroke={accent} strokeWidth={1} x1={6} x2={12} y1={45} y2={45} />
        <Line opacity={0.35} stroke={accent} strokeWidth={1} x1={78} x2={84} y1={45} y2={45} />
        {icon === "workout" ? (
          <>
            <Path
              d="M25 38v14M31 33v24M58 33v24M64 38v14M31 45h27"
              fill="none"
              stroke={accent}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={3.2}
            />
            <Path d="M36 39h17v12H36z" fill="none" stroke={colors.primaryBright} strokeWidth={1.7} />
          </>
        ) : null}
        {icon === "water" ? (
          <Path
            d="M45 22c10.1 14 16.2 21.1 16.2 31.2 0 9-6.9 15.8-16.2 15.8s-16.2-6.8-16.2-15.8C28.8 43.1 34.9 36 45 22Z"
            fill="none"
            stroke={accent}
            strokeLinejoin="round"
            strokeWidth={3}
          />
        ) : null}
        {icon === "book" ? (
          <>
            <Path
              d="M25 31c8.8 0 14.3 2.6 20 9 5.7-6.4 11.2-9 20-9v27c-8.8 0-14.3 2.6-20 9-5.7-6.4-11.2-9-20-9V31Z"
              fill={colors.accentVioletStrong}
              stroke={colors.accentViolet}
              strokeLinejoin="round"
              strokeWidth={2}
            />
            <Path
              d="M45 40v27M29 37c6.2.4 10.8 2.2 16 6.8M61 37c-6.2.4-10.8 2.2-16 6.8"
              fill="none"
              stroke={colors.primaryBright}
              strokeLinecap="round"
              strokeWidth={2.2}
            />
          </>
        ) : null}
        {icon === "meditate" ? (
          <>
            <Circle cx={45} cy={31} fill={colors.accentViolet} r={6.2} />
            <Path
              d="M43.8 39.5c-9 6.3-9 15.1 1.2 20.7 10.2-5.6 10.2-14.4 1.2-20.7Z"
              fill={colors.accentVioletStrong}
            />
            <Path
              d="M25 65c9.2-9.5 17-10.5 20-4.2 3-6.3 10.8-5.3 20 4.2M34 48.5 23 57M56 48.5 67 57"
              fill="none"
              stroke={colors.accentViolet}
              strokeLinecap="round"
              strokeWidth={3.5}
            />
          </>
        ) : null}
      </Svg>
    </View>
  );
}

/**
 * Renders the habit title on a single line, or nothing at all when the available
 * width would force it to be ellipsized — a clipped title reads worse than none.
 */
function HabitTitle({ compact, title }: { compact: boolean; title: string }) {
  const { width } = useWindowDimensions();
  const [truncated, setTruncated] = useState(false);

  // A new width (or a new title) may well fit, so measure again from scratch.
  const measureKey = `${compact}|${width}|${title}`;
  const [lastMeasureKey, setLastMeasureKey] = useState(measureKey);
  if (measureKey !== lastMeasureKey) {
    setLastMeasureKey(measureKey);
    setTruncated(false);
  }

  if (truncated) {
    return null;
  }

  return (
    <AppText
      color={colors.textPrimary}
      numberOfLines={1}
      onTextLayout={(event) => {
        const [line] = event.nativeEvent.lines;

        if (line && line.text.trim() !== title) {
          setTruncated(true);
        }
      }}
      style={compact && styles.habitTitleCompact}
      variant="pill"
    >
      {title}
    </AppText>
  );
}

export function HabitItemHeader({
  compact = false,
  expanded = false,
  habit,
  trailing,
}: {
  compact?: boolean;
  expanded?: boolean;
  habit: Habit;
  /** Extra control between the day counter and the chevron (e.g. a menu). */
  trailing?: ReactNode;
}) {
  return (
    <View style={[styles.habitTop, compact && styles.habitTopCompact]}>
      <View style={[styles.habitIdentity, compact && styles.habitIdentityCompact]}>
        <HabitArt accent={habit.accent} compact={compact} icon={habit.icon} />
        <View style={styles.habitInfo}>
          <HabitTitle compact={compact} title={habit.title} />
          <View style={[styles.habitTimeRow, compact && styles.habitTimeRowCompact]}>
            <ClockIcon size={compact ? 14 : 17} />
            <AppText
              color={colors.textMuted}
              style={[styles.habitTime, compact && styles.habitTimeCompact]}
              variant="subtitle"
            >
              {habit.time}
            </AppText>
          </View>
        </View>
      </View>
      <View style={[styles.habitMeta, compact && styles.habitMetaCompact]}>
        <View style={[styles.habitDay, compact && styles.habitDayCompact]}>
          <AppText
            color={colors.primary}
            style={compact && styles.dayCountCompact}
            variant="pill"
          >
            Day {habit.day}
          </AppText>
          <AppText
            color={colors.textMuted}
            style={compact && styles.goalCountCompact}
            variant="pill"
          >
            {" "}/ {habit.goal}
          </AppText>
        </View>
        {trailing}
        <ChevronIcon
          direction={expanded ? "up" : "down"}
          size={compact ? 20 : 25}
          strokeWidth={2.2}
        />
      </View>
    </View>
  );
}

export function HabitProgress({
  activeDayIndex,
  compact = false,
  expanded = false,
  onDayPress,
  progress,
}: {
  activeDayIndex?: number;
  compact?: boolean;
  expanded?: boolean;
  /** When set, day cells become tappable (used to toggle completions). */
  onDayPress?: (dayIndex: number) => void;
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
            <DayStatus status={progress[index] ?? "missed"} />
            {expanded && progress[index] === "done" ? (
              <View style={styles.dayCheck}>
                <CheckIcon color={colors.primaryBright} size={18} strokeWidth={2.4} />
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

export function HabitItemRow({
  activeDayIndex,
  compact = false,
  expanded = false,
  habit,
  onDayPress,
  trailing,
}: {
  activeDayIndex?: number;
  compact?: boolean;
  expanded?: boolean;
  habit: Habit;
  onDayPress?: (dayIndex: number) => void;
  trailing?: ReactNode;
}) {
  return (
    <View>
      <HabitItemHeader
        compact={compact}
        expanded={expanded}
        habit={habit}
        trailing={trailing}
      />
      <HabitProgress
        activeDayIndex={activeDayIndex}
        compact={compact}
        expanded={expanded}
        onDayPress={onDayPress}
        progress={habit.progress}
      />
    </View>
  );
}

export function HabitItemCard({
  compact = false,
  habit,
  onPress,
}: {
  compact?: boolean;
  habit: Habit;
  onPress?: () => void;
}) {
  return (
    <Card
      onPress={onPress}
      padded={false}
      style={[styles.habitCard, compact && styles.habitCardCompact]}
      variant="strong"
    >
      <HabitItemHeader compact={compact} habit={habit} />
    </Card>
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
  dayCheck: {
    alignItems: "center",
    height: 30,
    justifyContent: "center",
    pointerEvents: "none",
    position: "absolute",
    top: 40,
    width: 30,
  },
  dayCountCompact: {
    fontSize: fontSizes.md,
    lineHeight: lineHeights.md,
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
  goalCountCompact: {
    fontSize: fontSizes.md,
    lineHeight: lineHeights.md,
  },
  habitArt: {
    alignItems: "center",
    backgroundColor: colors.surfaceCard,
    borderRadius: 61,
    borderWidth: 1.1,
    height: ART_SIZE + 12,
    justifyContent: "center",
    width: ART_SIZE + 12,
  },
  habitArtCompact: {
    borderRadius: (ART_SIZE_COMPACT + 12) / 2,
    height: ART_SIZE_COMPACT + 12,
    width: ART_SIZE_COMPACT + 12,
  },
  habitCard: {
    alignItems: "center",
    flexDirection: "row",
    gap: 24,
    minHeight: controls.row.habit,
    paddingHorizontal: 28,
    paddingVertical: 22,
  },
  habitCardCompact: {
    gap: 12,
    minHeight: 0,
    paddingHorizontal: 14,
    paddingVertical: 16,
  },
  habitDay: {
    alignItems: "baseline",
    flexDirection: "row",
    justifyContent: "flex-end",
    minWidth: 118,
  },
  habitDayCompact: {
    minWidth: 0,
  },
  habitIdentity: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: 24,
    minWidth: 250,
  },
  habitIdentityCompact: {
    gap: 12,
    minWidth: 0,
  },
  habitInfo: {
    flex: 1,
    minWidth: 0,
  },
  habitMeta: {
    alignItems: "center",
    flexDirection: "row",
    gap: 16,
  },
  habitMetaCompact: {
    gap: 4,
  },
  habitTime: {
    flexShrink: 1,
  },
  habitTimeCompact: {
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
  },
  habitTimeRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    marginTop: 7,
  },
  habitTimeRowCompact: {
    gap: 6,
    marginTop: 4,
  },
  habitTitleCompact: {
    fontSize: fontSizes.lg,
    lineHeight: lineHeights.lg,
  },
  habitTop: {
    alignItems: "center",
    flexDirection: "row",
    gap: 18,
    justifyContent: "space-between",
  },
  habitTopCompact: {
    gap: 8,
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
