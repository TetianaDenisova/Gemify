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
import Svg, { Circle, Path } from "react-native-svg";

import { type HabitCompletion, HabitItemRow } from "@/components/HabitItem";
import { colors } from "@/theme/colors";
import { controls, fontSizes, lineHeights, spacing, typography } from "@/theme/theme";

const ACTIVE_DAY_INDEX = 2;

/** Below this width the full-size layout overflows, so switch to the phone scale. */
const COMPACT_BREAKPOINT = 620;

type Completion = HabitCompletion;

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

function DetailIcon({ icon, size = 58 }: { icon: HabitDetailSection["icon"]; size?: number }) {
  if (icon === "feather") {
    return (
      <Svg height={size} viewBox="0 0 64 64" width={size}>
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
      <Svg height={size} viewBox="0 0 64 64" width={size}>
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
    <Svg height={size} viewBox="0 0 64 64" width={size}>
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

function HeaderOrnament({ compact }: { compact: boolean }) {
  return (
    <View style={styles.ornamentRow} pointerEvents="none">
      <View style={[styles.ornamentLine, compact && styles.ornamentLineCompact]} />
      <Svg height={compact ? 24 : 32} viewBox="0 0 32 32" width={compact ? 24 : 32}>
        <Path
          d="M16 1.8c2.6 8.1 6.1 11.6 14.2 14.2C22.1 18.6 18.6 22.1 16 30.2 13.4 22.1 9.9 18.6 1.8 16 9.9 13.4 13.4 9.9 16 1.8Z"
          fill={colors.primary}
        />
      </Svg>
      <View style={[styles.ornamentLine, compact && styles.ornamentLineCompact]} />
    </View>
  );
}

function TodaySparkle({ size = 20 }: { size?: number }) {
  return (
    <Svg height={size} viewBox="0 0 32 32" width={size}>
      <Path
        d="M16 1.8c2.6 8.1 6.1 11.6 14.2 14.2C22.1 18.6 18.6 22.1 16 30.2 13.4 22.1 9.9 18.6 1.8 16 9.9 13.4 13.4 9.9 16 1.8Z"
        fill={colors.primary}
      />
    </Svg>
  );
}

function TodayBar({ compact }: { compact: boolean }) {
  const dateLabel = new Date().toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    weekday: "long",
  });
  const totalHabits = habitGroups.reduce((sum, group) => sum + group.habits.length, 0);

  return (
    <View style={[styles.todayBar, compact && styles.todayBarCompact]}>
      <View style={[styles.todayLabelRow, compact && styles.todayLabelRowCompact]}>
        <TodaySparkle size={compact ? 16 : 20} />
        <Text style={[styles.todayLabel, compact && styles.todayLabelCompact]}>Today</Text>
      </View>
      <View style={styles.todayDivider} />
      <Text
        numberOfLines={1}
        style={[styles.todayDate, compact && styles.todayDateCompact]}
      >
        {dateLabel}
      </Text>
      <Text style={[styles.todayCount, compact && styles.todayCountCompact]}>
        {totalHabits} habits
      </Text>
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

function DetailCheckbox() {
  return (
    <View style={styles.detailCheckbox}>
      <View style={styles.detailCheckboxGlow} />
    </View>
  );
}

function HabitDetailSectionView({
  compact,
  section,
}: {
  compact: boolean;
  section: HabitDetailSection;
}) {
  return (
    <View style={[styles.detailSection, compact && styles.detailSectionCompact]}>
      <View style={[styles.detailIconFrame, compact && styles.detailIconFrameCompact]}>
        <DetailIcon icon={section.icon} size={compact ? 44 : 58} />
      </View>
      <View style={styles.detailCopy}>
        <Text style={[styles.detailTitle, compact && styles.detailTitleCompact]}>
          {section.title}
        </Text>
        {section.rows.map((row) => (
          <View key={row} style={[styles.detailRow, compact && styles.detailRowCompact]}>
            <DetailCheckbox />
            <Text style={[styles.detailText, compact && styles.detailTextCompact]}>{row}</Text>
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
        compact && styles.habitRowCompact,
        expanded && styles.habitRowExpanded,
        expanded && compact && styles.habitRowExpandedCompact,
        pressed && styles.pressed,
      ]}
    >
      <HabitItemRow
        activeDayIndex={ACTIVE_DAY_INDEX}
        compact={compact}
        expanded={expanded}
        habit={habit}
      />
      {expanded ? (
        <View style={styles.detailPanel}>
          {habit.details.map((section) => (
            <HabitDetailSectionView compact={compact} key={section.title} section={section} />
          ))}
        </View>
      ) : null}
    </Pressable>
  );
}

function GroupHeader({ compact, group }: { compact: boolean; group: HabitGroup }) {
  return (
    <View style={[styles.groupHeader, compact && styles.groupHeaderCompact]}>
      <View style={[styles.groupTitleRow, compact && styles.groupTitleRowCompact]}>
        <GroupIcon icon={group.icon} tint={group.tint} />
        <Text
          numberOfLines={1}
          style={[styles.groupTitle, compact && styles.groupTitleCompact]}
        >
          {group.title}
        </Text>
        <Text style={[styles.groupCount, compact && styles.groupCountCompact]}>
          {group.count}
        </Text>
      </View>
      {group.habits.length === 0 ? <ChevronIcon /> : null}
    </View>
  );
}

export default function HabitsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const compact = width < COMPACT_BREAKPOINT;
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
        <View style={[styles.header, compact && styles.headerCompact]}>
          <Pressable
            accessibilityLabel="Open menu"
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.headerButton,
              compact && styles.headerButtonCompact,
              pressed && styles.pressed,
            ]}
          >
            <MenuIcon />
          </Pressable>
          <View style={[styles.titleBlock, compact && styles.titleBlockCompact]}>
            <Text
              numberOfLines={1}
              style={[styles.title, compact && styles.titleCompact]}
            >
              My Habits
            </Text>
            <HeaderOrnament compact={compact} />
          </View>
          <Pressable
            accessibilityLabel="Add habit"
            accessibilityRole="button"
            onPress={() => router.push("/create-habit")}
            style={({ pressed }) => [
              styles.headerButton,
              compact && styles.headerButtonCompact,
              pressed && styles.pressed,
            ]}
          >
            <PlusIcon size={compact ? 26 : 30} />
          </Pressable>
        </View>

        <TodayBar compact={compact} />

        <View style={styles.groups}>
          {habitGroups.map((group) => (
            <View key={group.title} style={styles.group}>
              <GroupHeader compact={compact} group={group} />
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
  content: {
    alignSelf: "center",
    maxWidth: 820,
    paddingHorizontal: 34,
    width: "100%",
  },
  contentCompact: {
    paddingHorizontal: spacing.md,
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
  detailIconFrameCompact: {
    height: 52,
    width: 52,
  },
  detailRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 18,
  },
  detailRowCompact: {
    gap: 12,
  },
  detailSection: {
    borderBottomColor: "rgba(246, 232, 200, 0.14)",
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: 22,
    paddingHorizontal: 12,
    paddingVertical: 24,
  },
  detailSectionCompact: {
    gap: 14,
    paddingHorizontal: 2,
    paddingVertical: 18,
  },
  detailText: {
    ...typography.body,
    color: "#D6C8BC",
    flex: 1,
  },
  detailTextCompact: {
    fontSize: fontSizes.sm,
    lineHeight: 20,
  },
  detailTitle: {
    ...typography.pill,
    color: colors.primary,
  },
  detailTitleCompact: {
    fontSize: fontSizes.lg,
    lineHeight: 22,
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
  groupHeaderCompact: {
    minHeight: 54,
    paddingHorizontal: 2,
  },
  groupTitle: {
    ...typography.button,
    color: colors.textPrimary,
    flexShrink: 1,
  },
  groupTitleCompact: {
    fontSize: fontSizes.xl,
    lineHeight: 25,
  },
  groupTitleRow: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: 13,
    minWidth: 0,
  },
  groupTitleRowCompact: {
    gap: 9,
  },
  groupCount: {
    ...typography.subtitle,
    color: "#8E929E",
    marginLeft: 7,
  },
  groupCountCompact: {
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    marginLeft: 0,
  },
  groups: {
    marginTop: 18,
  },
  todayBar: {
    alignItems: "center",
    flexDirection: "row",
    gap: 16,
    marginTop: 26,
    paddingHorizontal: 12,
  },
  todayBarCompact: {
    gap: 10,
    marginTop: 18,
    paddingHorizontal: 2,
  },
  todayCount: {
    ...typography.subtitle,
    color: "#8E929E",
  },
  todayCountCompact: {
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
  },
  todayDate: {
    ...typography.subtitle,
    color: "#C9CDD8",
    flex: 1,
  },
  todayDateCompact: {
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
  },
  todayDivider: {
    backgroundColor: "rgba(246, 232, 200, 0.24)",
    height: 22,
    width: 1,
  },
  todayLabel: {
    ...typography.pill,
    color: colors.primary,
    letterSpacing: 1.6,
    textTransform: "uppercase",
  },
  todayLabelCompact: {
    fontSize: fontSizes.sm,
    letterSpacing: 1.2,
    lineHeight: lineHeights.sm,
  },
  todayLabelRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 9,
  },
  todayLabelRowCompact: {
    gap: 6,
  },
  habitRow: {
    borderTopColor: "rgba(246, 232, 200, 0.12)",
    borderTopWidth: 1,
    paddingBottom: 23,
    paddingHorizontal: 18,
    paddingTop: 16,
  },
  habitRowCompact: {
    paddingBottom: 16,
    paddingHorizontal: 2,
    paddingTop: 14,
  },
  habitRowExpandedCompact: {
    paddingHorizontal: 10,
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
  headerButtonCompact: {
    borderRadius: 16,
    height: controls.iconButton.sm,
    width: controls.iconButton.sm,
  },
  headerCompact: {
    minHeight: 72,
  },
  ornamentLine: {
    backgroundColor: colors.primary,
    flex: 1,
    height: 1,
    maxWidth: 112,
    opacity: 0.6,
  },
  ornamentLineCompact: {
    maxWidth: 64,
  },
  ornamentRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    justifyContent: "center",
    marginTop: 5,
  },
  pressed: {
    opacity: 0.74,
    transform: [{ scale: 0.98 }],
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
  titleBlockCompact: {
    paddingHorizontal: 8,
  },
  titleCompact: {
    fontSize: fontSizes.cardTitle,
    lineHeight: lineHeights.cardTitle,
  },
});
