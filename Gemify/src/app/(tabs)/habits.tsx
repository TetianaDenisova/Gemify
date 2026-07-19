import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle, Line, Path } from "react-native-svg";

import { colors } from "@/theme/colors";
import { controls, spacing, typography } from "@/theme/theme";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
const ACTIVE_DAY_INDEX = 2;

type Completion = "done" | "missed" | "open" | "partial";

type HabitDetailSection = {
  icon: "sun" | "feather" | "shield";
  rows: readonly string[];
  title: string;
};

type Habit = {
  accent: string;
  day: number;
  details: readonly HabitDetailSection[];
  goal: number;
  icon: "workout" | "water" | "book" | "meditate";
  progress: readonly Completion[];
  time: string;
  title: string;
};

type HabitGroup = {
  count: string;
  icon: "book" | "heart";
  tint: string;
  title: string;
  habits: readonly Habit[];
};

const habitGroups: readonly HabitGroup[] = [
  {
    count: "2 habits",
    icon: "book",
    tint: "#B46AFF",
    title: "Growth Mindset",
    habits: [
      {
        accent: "#B46AFF",
        day: 10,
        details: [
          {
            icon: "sun",
            rows: ["Put the book on the coffee table", "Open to the next page before bed"],
            title: "How to make this habit easy to start",
          },
          {
            icon: "feather",
            rows: ["Read for 5 minutes only"],
            title: "Easy version for a bad day",
          },
          {
            icon: "shield",
            rows: [
              "If I feel tired -> read one page",
              "If I forget after coffee -> read before lunch",
            ],
            title: "Obstacles & backup plan",
          },
        ],
        goal: 24,
        icon: "book",
        progress: ["done", "done", "partial", "missed", "open", "missed", "missed"],
        time: "After morning coffee",
        title: "Read 20 minutes",
      },
      {
        accent: "#A36EFF",
        day: 6,
        details: [
          {
            icon: "sun",
            rows: ["Place cushion by the bed", "Start the timer before checking messages"],
            title: "How to make this habit easy to start",
          },
          {
            icon: "feather",
            rows: ["Breathe quietly for 2 minutes"],
            title: "Easy version for a bad day",
          },
          {
            icon: "shield",
            rows: [
              "If I wake up late -> meditate after shower",
              "If the room is noisy -> use headphones",
            ],
            title: "Obstacles & backup plan",
          },
        ],
        goal: 24,
        icon: "meditate",
        progress: ["done", "missed", "done", "missed", "open", "missed", "missed"],
        time: "After waking up",
        title: "Meditate",
      },
    ],
  },
  {
    count: "2 habits",
    icon: "heart",
    tint: colors.primary,
    title: "Healthy Body",
    habits: [
      {
        accent: colors.primary,
        day: 12,
        details: [
          {
            icon: "sun",
            rows: ["Lay out clothes before work", "Queue the workout plan in advance"],
            title: "How to make this habit easy to start",
          },
          {
            icon: "feather",
            rows: ["Do one set only"],
            title: "Easy version for a bad day",
          },
          {
            icon: "shield",
            rows: [
              "If I feel tired -> do the easy version",
              "If work runs late -> train before dinner",
            ],
            title: "Obstacles & backup plan",
          },
        ],
        goal: 24,
        icon: "workout",
        progress: ["done", "done", "done", "missed", "open", "missed", "missed"],
        time: "After work",
        title: "Workout",
      },
      {
        accent: colors.primary,
        day: 15,
        details: [
          {
            icon: "sun",
            rows: ["Fill bottle before breakfast", "Keep a glass on the desk"],
            title: "How to make this habit easy to start",
          },
          {
            icon: "feather",
            rows: ["Drink one full bottle"],
            title: "Easy version for a bad day",
          },
          {
            icon: "shield",
            rows: [
              "If I leave home -> carry the bottle",
              "If I forget all morning -> drink with lunch",
            ],
            title: "Obstacles & backup plan",
          },
        ],
        goal: 24,
        icon: "water",
        progress: ["done", "done", "done", "done", "open", "missed", "missed"],
        time: "All day",
        title: "Drink 2L of water",
      },
    ],
  },
];

function MenuIcon() {
  return (
    <Svg height={27} viewBox="0 0 24 24" width={27}>
      <Path
        d="M5 7h14M5 12h14M5 17h14"
        fill="none"
        stroke={colors.primary}
        strokeLinecap="round"
        strokeWidth={1.7}
      />
    </Svg>
  );
}

function PlusIcon({ size = 30 }: { size?: number }) {
  return (
    <Svg height={size} viewBox="0 0 24 24" width={size}>
      <Path
        d="M12 4.5v15M4.5 12h15"
        fill="none"
        stroke={colors.primary}
        strokeLinecap="round"
        strokeWidth={1.75}
      />
    </Svg>
  );
}

function ClockIcon() {
  return (
    <Svg height={17} viewBox="0 0 24 24" width={17}>
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

function ChevronIcon({ expanded = false }: { expanded?: boolean }) {
  return (
    <Svg height={25} viewBox="0 0 24 24" width={25}>
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

function DetailIcon({ icon }: { icon: HabitDetailSection["icon"] }) {
  if (icon === "feather") {
    return (
      <Svg height={58} viewBox="0 0 64 64" width={58}>
        <Circle cx={32} cy={32} fill="#160B2C" r={29} />
        <Circle cx={32} cy={32} fill="#B46AFF" opacity={0.18} r={23} />
        <Circle cx={32} cy={32} fill="none" r={27} stroke={colors.primary} strokeWidth={1.4} />
        <Path
          d="M46 15C32 17 21 27.5 18 47c11.5-2 22.5-12.5 28-32Z"
          fill="#EBC3FF"
          stroke="#B46AFF"
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
      <Svg height={58} viewBox="0 0 64 64" width={58}>
        <Circle cx={32} cy={32} fill="#160B2C" r={29} />
        <Circle cx={32} cy={32} fill="#B46AFF" opacity={0.18} r={23} />
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
    <Svg height={58} viewBox="0 0 64 64" width={58}>
      <Circle cx={32} cy={32} fill="#160B2C" r={29} />
      <Circle cx={32} cy={32} fill="#B46AFF" opacity={0.18} r={23} />
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

function HeaderOrnament() {
  return (
    <View style={styles.ornamentRow} pointerEvents="none">
      <View style={styles.ornamentLine} />
      <Svg height={32} viewBox="0 0 32 32" width={32}>
        <Path
          d="M16 1.8c2.6 8.1 6.1 11.6 14.2 14.2C22.1 18.6 18.6 22.1 16 30.2 13.4 22.1 9.9 18.6 1.8 16 9.9 13.4 13.4 9.9 16 1.8Z"
          fill={colors.primary}
        />
      </Svg>
      <View style={styles.ornamentLine} />
    </View>
  );
}

function GroupIcon({ icon, tint }: { icon: HabitGroup["icon"]; tint: string }) {
  if (icon === "heart") {
    return (
      <Svg height={31} viewBox="0 0 32 32" width={31}>
        <Path
          d="M16 27S5.5 20.3 5.5 12.3c0-4.1 5.3-6.8 10.5-.9 5.2-5.9 10.5-3.2 10.5.9C26.5 20.3 16 27 16 27Z"
          fill="none"
          stroke={tint}
          strokeLinejoin="round"
          strokeWidth={2}
        />
        <Path
          d="M11.5 22.6c.3-5.7 3.5-10.1 9.4-13.4"
          fill="none"
          stroke={tint}
          strokeLinecap="round"
          strokeWidth={1.8}
        />
      </Svg>
    );
  }

  return (
    <Svg height={31} viewBox="0 0 32 32" width={31}>
      <Path
        d="M5.5 8c4.8 0 8 1.4 10.5 4.8C18.5 9.4 21.7 8 26.5 8v16c-4.8 0-8 1.4-10.5 4.8C13.5 25.4 10.3 24 5.5 24V8Z"
        fill="none"
        stroke={tint}
        strokeLinejoin="round"
        strokeWidth={2}
      />
      <Path
        d="M16 12.8v16"
        fill="none"
        stroke={tint}
        strokeLinecap="round"
        strokeWidth={2}
      />
    </Svg>
  );
}

function HabitArt({ accent, icon }: { accent: string; icon: Habit["icon"] }) {
  return (
    <View style={[styles.habitArt, { borderColor: `${accent}A8`, shadowColor: accent }]}>
      <Svg height={90} viewBox="0 0 90 90" width={90}>
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

function DayStatus({ status }: { status: Completion }) {
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

function DetailCheckbox() {
  return (
    <View style={styles.detailCheckbox}>
      <View style={styles.detailCheckboxGlow} />
    </View>
  );
}

function HabitProgress({ compact, expanded, progress }: { compact: boolean; expanded: boolean; progress: readonly Completion[] }) {
  return (
    <View style={[styles.progressRow, expanded && styles.progressRowExpanded, compact && styles.progressRowCompact]}>
      {DAYS.map((day, index) => {
        const highlighted = index === ACTIVE_DAY_INDEX;

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
            <Text style={[styles.dayLabel, expanded && styles.dayLabelExpanded, highlighted && styles.dayLabelHighlighted]}>
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

function HabitDetailSectionView({ section }: { section: HabitDetailSection }) {
  return (
    <View style={styles.detailSection}>
      <View style={styles.detailIconFrame}>
        <DetailIcon icon={section.icon} />
      </View>
      <View style={styles.detailCopy}>
        <Text style={styles.detailTitle}>{section.title}</Text>
        {section.rows.map((row) => (
          <View key={row} style={styles.detailRow}>
            <DetailCheckbox />
            <Text style={styles.detailText}>{row}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function HabitRow({
  compact,
  expanded,
  habit,
  onPress,
}: {
  compact: boolean;
  expanded: boolean;
  habit: Habit;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ expanded }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.habitRow,
        expanded && styles.habitRowExpanded,
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.habitTop, compact && styles.habitTopCompact]}>
        <View style={styles.habitIdentity}>
          <HabitArt accent={habit.accent} icon={habit.icon} />
          <View style={styles.habitInfo}>
            <Text style={styles.habitTitle}>{habit.title}</Text>
            <View style={styles.habitTimeRow}>
              <ClockIcon />
              <Text style={styles.habitTime}>{habit.time}</Text>
            </View>
          </View>
        </View>
        <View style={styles.habitMeta}>
          <View style={styles.habitDay}>
            <Text style={styles.dayCount}>Day {habit.day}</Text>
            <Text style={styles.goalCount}> / {habit.goal}</Text>
          </View>
          <ChevronIcon expanded={expanded} />
        </View>
      </View>
      <HabitProgress compact={compact} expanded={expanded} progress={habit.progress} />
      {expanded ? (
        <>
          <View style={styles.detailPanel}>
            {habit.details.map((section) => (
              <HabitDetailSectionView key={section.title} section={section} />
            ))}
          </View>
        </>
      ) : null}
    </Pressable>
  );
}

function GroupHeader({ group }: { group: HabitGroup }) {
  return (
    <View style={styles.groupHeader}>
      <View style={styles.groupTitleRow}>
        <GroupIcon icon={group.icon} tint={group.tint} />
        <Text style={styles.groupTitle}>{group.title}</Text>
        <Text style={styles.groupCount}>{group.count}</Text>
      </View>
      {group.habits.length === 0 ? <ChevronIcon /> : null}
    </View>
  );
}

export default function HabitsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const compact = width < 620;
  const [expandedHabit, setExpandedHabit] = useState<string | null>(null);

  function handleHabitPress(title: string) {
    setExpandedHabit((current) => (current === title ? null : title));
  }

  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={[
          "#020713",
          "rgba(3, 8, 19, 0.97)",
          "rgba(3, 8, 19, 0.92)",
          "rgba(3, 8, 19, 0.98)",
        ]}
        locations={[0, 0.44, 0.74, 1]}
        pointerEvents="none"
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={["rgba(72, 36, 120, 0.2)", "rgba(245, 184, 75, 0.08)", "rgba(3, 8, 19, 0)"]}
        end={{ x: 0.5, y: 1 }}
        pointerEvents="none"
        start={{ x: 0.5, y: 0 }}
        style={styles.centerGlow}
      />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingBottom: Math.max(insets.bottom + 140, 168),
            paddingTop: Math.max(insets.top + 28, 38),
          },
          compact && styles.contentCompact,
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable
            accessibilityLabel="Open menu"
            accessibilityRole="button"
            style={({ pressed }) => [styles.headerButton, pressed && styles.pressed]}
          >
            <MenuIcon />
          </Pressable>
          <View style={styles.titleBlock}>
            <Text style={styles.title}>My Habits</Text>
            <HeaderOrnament />
          </View>
          <Pressable
            accessibilityLabel="Add habit"
            accessibilityRole="button"
            onPress={() => router.push("/create-habit")}
            style={({ pressed }) => [styles.headerButton, pressed && styles.pressed]}
          >
            <PlusIcon />
          </Pressable>
        </View>

        <View style={styles.groups}>
          {habitGroups.map((group) => (
            <View key={group.title} style={styles.group}>
              <GroupHeader group={group} />
              {group.habits.map((habit) => (
                <HabitRow
                  compact={compact}
                  expanded={expandedHabit === habit.title}
                  habit={habit}
                  key={habit.title}
                  onPress={() => handleHabitPress(habit.title)}
                />
              ))}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  centerGlow: {
    bottom: 70,
    height: 260,
    left: 0,
    position: "absolute",
    right: 0,
  },
  content: {
    alignSelf: "center",
    maxWidth: 820,
    paddingHorizontal: 34,
    width: "100%",
  },
  contentCompact: {
    paddingHorizontal: spacing.md,
  },
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
    minWidth: 44,
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
  dayCellExpanded: {
    gap: 14,
    minHeight: 78,
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
  dayLabelHighlighted: {
    color: "#D29CFF",
  },
  dayLabelExpanded: {
    ...typography.pill,
    color: "#D7C4AF",
  },
  detailCheckbox: {
    alignItems: "center",
    borderColor: colors.primary,
    borderRadius: 5,
    borderWidth: 1.4,
    height: 25,
    justifyContent: "center",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    width: 25,
  },
  detailCheckboxGlow: {
    backgroundColor: "rgba(245, 184, 75, 0.12)",
    borderRadius: 3,
    height: 17,
    width: 17,
  },
  detailCopy: {
    flex: 1,
    gap: 14,
    minWidth: 0,
  },
  detailIconFrame: {
    alignItems: "center",
    height: 70,
    justifyContent: "center",
    width: 70,
  },
  detailPanel: {
    borderTopColor: "rgba(246, 232, 200, 0.18)",
    borderTopWidth: 1,
    marginTop: 26,
  },
  detailRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 18,
  },
  detailSection: {
    borderBottomColor: "rgba(246, 232, 200, 0.14)",
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: 22,
    paddingHorizontal: 12,
    paddingVertical: 24,
  },
  detailText: {
    ...typography.body,
    color: "#D6C8BC",
    flex: 1,
  },
  detailTitle: {
    ...typography.pill,
    color: colors.primary,
  },
  goalCount: {
    ...typography.pill,
    color: "#9A9DA9",
  },
  group: {
    borderTopColor: "rgba(246, 232, 200, 0.14)",
    borderTopWidth: 1,
  },
  groupHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 66,
    paddingHorizontal: 12,
  },
  groupTitle: {
    ...typography.button,
    color: colors.textPrimary,
  },
  groupTitleRow: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: 13,
    minWidth: 0,
  },
  groupCount: {
    ...typography.subtitle,
    color: "#8E929E",
    marginLeft: 7,
  },
  groups: {
    marginTop: 28,
  },
  habitArt: {
    alignItems: "center",
    backgroundColor: "rgba(3, 6, 17, 0.9)",
    borderRadius: 61,
    borderWidth: 1.1,
    height: 102,
    justifyContent: "center",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    width: 102,
  },
  habitDay: {
    alignItems: "baseline",
    flexDirection: "row",
    justifyContent: "flex-end",
    minWidth: 118,
  },
  habitIdentity: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: 24,
    minWidth: 250,
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
  habitRow: {
    borderTopColor: "rgba(246, 232, 200, 0.12)",
    borderTopWidth: 1,
    paddingBottom: 23,
    paddingHorizontal: 18,
    paddingTop: 16,
  },
  habitRowExpanded: {
    backgroundColor: "rgba(5, 9, 22, 0.84)",
    borderColor: "rgba(245, 184, 75, 0.48)",
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 16,
    marginTop: 6,
    paddingHorizontal: 22,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
  },
  habitTime: {
    ...typography.subtitle,
    color: "#B1B3BC",
    flexShrink: 1,
  },
  habitTimeRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    marginTop: 7,
  },
  habitTitle: {
    ...typography.button,
    color: colors.textPrimary,
  },
  habitTop: {
    alignItems: "center",
    flexDirection: "row",
    gap: 18,
    justifyContent: "space-between",
  },
  habitTopCompact: {
    alignItems: "flex-start",
    flexWrap: "wrap",
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 92,
  },
  headerButton: {
    alignItems: "center",
    backgroundColor: "rgba(10, 13, 26, 0.72)",
    borderColor: "rgba(240, 202, 137, 0.35)",
    borderRadius: 22,
    borderWidth: 1.2,
    height: controls.iconButton.md,
    justifyContent: "center",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    width: controls.iconButton.md,
  },
  ornamentLine: {
    backgroundColor: colors.primary,
    flex: 1,
    height: 1,
    maxWidth: 112,
    opacity: 0.6,
  },
  ornamentRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    justifyContent: "center",
    marginTop: 5,
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
  progressRowExpanded: {
    marginLeft: 0,
    marginTop: 24,
  },
  progressRowCompact: {
    marginLeft: 0,
    width: "100%",
  },
  screen: {
    backgroundColor: colors.background,
    flex: 1,
    overflow: "hidden",
  },
  title: {
    ...typography.screenTitle,
    color: "#F7D99B",
    fontWeight: "700",
    textAlign: "center",
    textShadowColor: "rgba(245, 184, 75, 0.42)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  titleBlock: {
    flex: 1,
    paddingHorizontal: 18,
  },
});
