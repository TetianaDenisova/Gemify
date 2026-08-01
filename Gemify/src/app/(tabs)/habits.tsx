import { useRouter } from "expo-router";
import {
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import { useState } from "react";
import Svg, { Circle, Path } from "react-native-svg";

import { type HabitCompletion, HabitItemRow } from "@/components/HabitItem";
import {
  AppText,
  Checkbox,
  ChevronIcon,
  IconButton,
  PlusIcon,
  ScreenScaffold,
  SparkIcon,
} from "@/shared/components";
import { colors } from "@/theme/colors";
import {
  fontSizes,
  layout,
  lineHeights,
  pressed,
  radius,
  shadows,
  spacing,
} from "@/theme/theme";

const ACTIVE_DAY_INDEX = 2;

/** Bespoke deep-night gradient behind the habits board. */
const HABITS_BACKGROUND = [
  "#020713",
  "rgba(3, 8, 19, 0.97)",
  "rgba(3, 8, 19, 0.92)",
  "rgba(3, 8, 19, 0.98)",
] as const;

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
    tint: colors.accentVioletStrong,
    title: "Growth Mindset",
    habits: [
      {
        accent: colors.accentVioletStrong,
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
        accent: colors.accentVioletStrong,
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

function DetailIcon({ icon, size = 58 }: { icon: HabitDetailSection["icon"]; size?: number }) {
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

function HeaderOrnament({ compact }: { compact: boolean }) {
  return (
    <View style={styles.ornamentRow} pointerEvents="none">
      <View style={[styles.ornamentLine, compact && styles.ornamentLineCompact]} />
      <SparkIcon size={compact ? 24 : 32} />
      <View style={[styles.ornamentLine, compact && styles.ornamentLineCompact]} />
    </View>
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
        <SparkIcon size={compact ? 16 : 20} />
        <AppText
          color={colors.primary}
          style={[styles.todayLabel, compact && styles.todayLabelCompact]}
          variant="pill"
        >
          Today
        </AppText>
      </View>
      <View style={styles.todayDivider} />
      <AppText
        numberOfLines={1}
        style={[styles.todayDate, compact && styles.todayDateCompact]}
        variant="subtitle"
      >
        {dateLabel}
      </AppText>
      <AppText
        color={colors.textMuted}
        style={compact && styles.todayCountCompact}
        variant="subtitle"
      >
        {totalHabits} habits
      </AppText>
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
        <AppText
          color={colors.primary}
          style={compact && styles.detailTitleCompact}
          variant="pill"
        >
          {section.title}
        </AppText>
        {section.rows.map((row) => (
          <View key={row} style={[styles.detailRow, compact && styles.detailRowCompact]}>
            <Checkbox checked={false} shape="square" />
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
      style={({ pressed: isPressed }) => [
        styles.habitRow,
        compact && styles.habitRowCompact,
        expanded && styles.habitRowExpanded,
        expanded && compact && styles.habitRowExpandedCompact,
        isPressed && pressed,
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
        <AppText
          numberOfLines={1}
          style={[styles.groupTitle, compact && styles.groupTitleCompact]}
          variant="button"
        >
          {group.title}
        </AppText>
        <AppText
          color={colors.textMuted}
          style={[styles.groupCount, compact && styles.groupCountCompact]}
          variant="subtitle"
        >
          {group.count}
        </AppText>
      </View>
      {group.habits.length === 0 ? <ChevronIcon /> : null}
    </View>
  );
}

export default function HabitsScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const compact = width < layout.compactBreakpoint;
  const [expandedHabit, setExpandedHabit] = useState<string | null>(null);

  function handleHabitPress(title: string) {
    setExpandedHabit((current) => (current === title ? null : title));
  }

  return (
    <ScreenScaffold backgroundGradient={HABITS_BACKGROUND} tabClearance topInset>
      <View style={[styles.header, compact && styles.headerCompact]}>
        <IconButton
          accessibilityLabel="Open menu"
          icon={<MenuIcon />}
          onPress={() => {}}
          size={compact ? "sm" : "md"}
        />
        <View style={[styles.titleBlock, compact && styles.titleBlockCompact]}>
          <AppText
            align="center"
            color={colors.primary}
            numberOfLines={1}
            style={[styles.title, compact && styles.titleCompact]}
            variant="screenTitle"
          >
            My Habits
          </AppText>
          <HeaderOrnament compact={compact} />
        </View>
        <IconButton
          accessibilityLabel="Add habit"
          icon={<PlusIcon size={compact ? 26 : 30} />}
          onPress={() => router.push("/create-habit")}
          size={compact ? "sm" : "md"}
        />
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
    </ScreenScaffold>
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
    lineHeight: 20,
  },
  detailTitleCompact: {
    fontSize: fontSizes.lg,
    lineHeight: 22,
  },
  group: {
    borderTopColor: colors.borderSoft,
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
    gap: spacing.sm,
  },
  groupCount: {
    marginLeft: 7,
  },
  groupCountCompact: {
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    marginLeft: 0,
  },
  groups: {
    marginTop: spacing.md,
  },
  todayBar: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.lg,
    paddingHorizontal: 12,
  },
  todayBarCompact: {
    gap: 10,
    marginTop: 18,
    paddingHorizontal: 2,
  },
  todayCountCompact: {
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
  },
  todayDate: {
    flex: 1,
  },
  todayDateCompact: {
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
  },
  todayDivider: {
    backgroundColor: colors.borderSoft,
    height: 22,
    width: 1,
  },
  todayLabel: {
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
    borderTopColor: colors.borderSoft,
    borderTopWidth: 1,
    paddingBottom: 23,
    paddingHorizontal: 18,
    paddingTop: spacing.md,
  },
  habitRowCompact: {
    paddingBottom: spacing.md,
    paddingHorizontal: 2,
    paddingTop: 14,
  },
  habitRowExpandedCompact: {
    paddingHorizontal: 10,
  },
  habitRowExpanded: {
    backgroundColor: colors.surfaceCard,
    borderColor: colors.border,
    borderRadius: radius.card,
    borderWidth: 1,
    marginBottom: spacing.md,
    marginTop: 6,
    paddingHorizontal: spacing.lg,
    ...shadows.goldGlow,
    shadowOpacity: 0.18,
    shadowRadius: 18,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 92,
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
  title: {
    fontWeight: "700",
    textShadowColor: colors.primaryGlow,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  titleBlock: {
    flex: 1,
    paddingHorizontal: 18,
  },
  titleBlockCompact: {
    paddingHorizontal: spacing.sm,
  },
  titleCompact: {
    fontSize: fontSizes.cardTitle,
    lineHeight: lineHeights.cardTitle,
  },
});
