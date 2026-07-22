import { useEffect, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import Svg, { Circle, Line, Path } from "react-native-svg";

import { colors } from "@/theme/colors";
import { controls, fontSizes, lineHeights, shadows, typography } from "@/theme/theme";

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
        stroke="#A0A5B1"
        strokeWidth={1.9}
      />
      <Path
        d="M12 7.8v5l3.2 2"
        fill="none"
        stroke="#A0A5B1"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.9}
      />
    </Svg>
  );
}

function ChevronIcon({ expanded = false, size = 25 }: { expanded?: boolean; size?: number }) {
  return (
    <Svg height={size} viewBox="0 0 24 24" width={size}>
      <Path
        d={expanded ? "m7 14 5-5 5 5" : "m7 10 5 5 5-5"}
        fill="none"
        stroke="#F0CA89"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2.2}
      />
    </Svg>
  );
}

function CheckIcon() {
  return (
    <Svg height={18} viewBox="0 0 24 24" width={18}>
      <Path
        d="m5.5 12.5 4.2 4.1 8.8-9.1"
        fill="none"
        stroke="#FFF0C1"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2.4}
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
        { borderColor: `${accent}A8`, shadowColor: accent },
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
            <Path d="M36 39h17v12H36z" fill="none" stroke="#FBE3A8" strokeWidth={1.7} />
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
              fill="#6D318A"
              stroke="#D39BFF"
              strokeLinejoin="round"
              strokeWidth={2}
            />
            <Path
              d="M45 40v27M29 37c6.2.4 10.8 2.2 16 6.8M61 37c-6.2.4-10.8 2.2-16 6.8"
              fill="none"
              stroke="#FFE2A3"
              strokeLinecap="round"
              strokeWidth={2.2}
            />
          </>
        ) : null}
        {icon === "meditate" ? (
          <>
            <Circle cx={45} cy={31} fill="#DFA7FF" r={6.2} />
            <Path d="M43.8 39.5c-9 6.3-9 15.1 1.2 20.7 10.2-5.6 10.2-14.4 1.2-20.7Z" fill="#A36EFF" />
            <Path
              d="M25 65c9.2-9.5 17-10.5 20-4.2 3-6.3 10.8-5.3 20 4.2M34 48.5 23 57M56 48.5 67 57"
              fill="none"
              stroke="#CA96FF"
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
  useEffect(() => {
    setTruncated(false);
  }, [compact, title, width]);

  if (truncated) {
    return null;
  }

  return (
    <Text
      numberOfLines={1}
      onTextLayout={(event) => {
        const [line] = event.nativeEvent.lines;

        if (line && line.text.trim() !== title) {
          setTruncated(true);
        }
      }}
      style={[styles.habitTitle, compact && styles.habitTitleCompact]}
    >
      {title}
    </Text>
  );
}

export function HabitItemHeader({
  compact = false,
  expanded = false,
  habit,
}: {
  compact?: boolean;
  expanded?: boolean;
  habit: Habit;
}) {
  return (
    <View style={[styles.habitTop, compact && styles.habitTopCompact]}>
      <View style={[styles.habitIdentity, compact && styles.habitIdentityCompact]}>
        <HabitArt accent={habit.accent} compact={compact} icon={habit.icon} />
        <View style={styles.habitInfo}>
          <HabitTitle compact={compact} title={habit.title} />
          <View style={[styles.habitTimeRow, compact && styles.habitTimeRowCompact]}>
            <ClockIcon size={compact ? 14 : 17} />
            <Text style={[styles.habitTime, compact && styles.habitTimeCompact]}>
              {habit.time}
            </Text>
          </View>
        </View>
      </View>
      <View style={[styles.habitMeta, compact && styles.habitMetaCompact]}>
        <View style={[styles.habitDay, compact && styles.habitDayCompact]}>
          <Text style={[styles.dayCount, compact && styles.dayCountCompact]}>
            Day {habit.day}
          </Text>
          <Text style={[styles.goalCount, compact && styles.goalCountCompact]}>
            {" "}/ {habit.goal}
          </Text>
        </View>
        <ChevronIcon expanded={expanded} size={compact ? 20 : 25} />
      </View>
    </View>
  );
}

export function HabitProgress({
  activeDayIndex,
  compact = false,
  expanded = false,
  progress,
}: {
  activeDayIndex?: number;
  compact?: boolean;
  expanded?: boolean;
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
          <View
            key={day}
            style={[
              styles.dayCell,
              highlighted && !expanded && styles.dayCellHighlighted,
              expanded && styles.dayCellExpanded,
              compact && styles.dayCellCompact,
            ]}
          >
            <Text
              style={[
                styles.dayLabel,
                expanded && styles.dayLabelExpanded,
                highlighted && styles.dayLabelHighlighted,
              ]}
            >
              {expanded ? day : day.toUpperCase()}
            </Text>
            <DayStatus status={progress[index] ?? "missed"} />
            {expanded && progress[index] === "done" ? (
              <View pointerEvents="none" style={styles.dayCheck}>
                <CheckIcon />
              </View>
            ) : null}
          </View>
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
}: {
  activeDayIndex?: number;
  compact?: boolean;
  expanded?: boolean;
  habit: Habit;
}) {
  return (
    <View>
      <HabitItemHeader compact={compact} expanded={expanded} habit={habit} />
      <HabitProgress
        activeDayIndex={activeDayIndex}
        compact={compact}
        expanded={expanded}
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
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.habitCard,
        compact && styles.habitCardCompact,
        pressed && styles.pressed,
      ]}
    >
      <HabitItemHeader compact={compact} habit={habit} />
    </Pressable>
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
    borderColor: "rgba(180, 106, 255, 0.8)",
    borderWidth: 1.2,
    shadowColor: "#B46AFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.62,
    shadowRadius: 14,
  },
  dayCheck: {
    alignItems: "center",
    height: 30,
    justifyContent: "center",
    position: "absolute",
    top: 40,
    width: 30,
  },
  dayCount: {
    ...typography.pill,
    color: colors.primary,
    fontWeight: "700",
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
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.72,
    shadowRadius: 11,
  },
  dayDotMissed: {
    borderColor: "#626B82",
  },
  dayLabel: {
    ...typography.caption,
    color: "#AAAEBB",
    fontWeight: "800",
  },
  dayLabelExpanded: {
    ...typography.pill,
    color: "#D7C4AF",
  },
  dayLabelHighlighted: {
    color: "#D29CFF",
  },
  goalCount: {
    ...typography.pill,
    color: "#9A9DA9",
  },
  goalCountCompact: {
    fontSize: fontSizes.md,
    lineHeight: lineHeights.md,
  },
  habitArt: {
    alignItems: "center",
    backgroundColor: "rgba(3, 6, 17, 0.9)",
    borderRadius: 61,
    borderWidth: 1.1,
    height: ART_SIZE + 12,
    justifyContent: "center",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    width: ART_SIZE + 12,
  },
  habitArtCompact: {
    borderRadius: (ART_SIZE_COMPACT + 12) / 2,
    height: ART_SIZE_COMPACT + 12,
    width: ART_SIZE_COMPACT + 12,
  },
  habitCard: {
    alignItems: "center",
    backgroundColor: "rgba(4, 10, 23, 0.92)",
    borderColor: "rgba(245, 184, 75, 0.82)",
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: "row",
    gap: 24,
    minHeight: controls.row.habit,
    paddingHorizontal: 28,
    paddingVertical: 22,
    ...shadows.goldGlow,
    shadowOpacity: 0.2,
    shadowRadius: 12,
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
    ...typography.subtitle,
    color: "#B1B3BC",
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
  habitTitle: {
    ...typography.button,
    color: colors.textPrimary,
  },
  habitTitleCompact: {
    fontSize: fontSizes.lg,
    lineHeight: 22,
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
  pressed: {
    opacity: 0.74,
    transform: [{ scale: 0.98 }],
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
