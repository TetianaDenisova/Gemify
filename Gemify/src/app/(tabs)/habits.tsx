import { useFocusEffect, useRouter } from "expo-router";
import {
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import { useCallback, useState } from "react";
import Svg, { Circle, Path } from "react-native-svg";

import { type HabitCompletion, HabitItemRow } from "@/components/HabitItem";
import {
  deleteHabit,
  getDreams,
  type Dream,
  type HabitDetailSection as DbHabitDetailSection,
} from "@/db";
import {
  habitTimeLabel,
  useHabitWeek,
  type HabitWeekView,
} from "@/hooks/useHabitWeek";
import {
  AppButton,
  AppModal,
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

/** Bespoke deep-night gradient behind the habits board. */
const HABITS_BACKGROUND = [
  "#020713",
  "rgba(3, 8, 19, 0.97)",
  "rgba(3, 8, 19, 0.92)",
  "rgba(3, 8, 19, 0.98)",
] as const;

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
  id: number;
  progress: readonly HabitCompletion[];
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

const GROUP_VISUAL_CYCLE = [
  { icon: "book", tint: colors.accentVioletStrong },
  { icon: "heart", tint: colors.primary },
] as const;

const HABIT_ICON_CYCLE = ["workout", "water", "book", "meditate"] as const;

const DETAIL_SECTION_META: Record<
  DbHabitDetailSection,
  { icon: HabitDetailSection["icon"]; title: string }
> = {
  easy_start: { icon: "sun", title: "How to make this habit easy to start" },
  easy_version: { icon: "feather", title: "Easy version for a bad day" },
  backup_plan: { icon: "shield", title: "Obstacles & backup plan" },
};

/** DB habit view → the row shape this screen renders. */
function toHabitRow(view: HabitWeekView, index: number, tint: string): Habit {
  const sections = (
    Object.keys(DETAIL_SECTION_META) as DbHabitDetailSection[]
  )
    .map((section) => ({
      ...DETAIL_SECTION_META[section],
      rows: view.details
        .filter((entry) => entry.section === section)
        .map((entry) => entry.content),
    }))
    .filter((section) => section.rows.length > 0);

  return {
    accent: tint,
    day: view.doneCount,
    details: sections,
    goal: view.habit.goalDays,
    icon: HABIT_ICON_CYCLE[index % HABIT_ICON_CYCLE.length],
    id: view.habit.id,
    progress: view.weekProgress,
    time: view.habit.cue || habitTimeLabel(view.habit.timeOfDay),
    title: view.habit.title,
  };
}

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

function TodayBar({
  compact,
  totalHabits,
}: {
  compact: boolean;
  totalHabits: number;
}) {
  const dateLabel = new Date().toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    weekday: "long",
  });

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
  activeDayIndex,
  compact,
  expanded,
  habit,
  onDayPress,
  onDelete,
  onEdit,
  onPress,
}: {
  activeDayIndex: number;
  compact: boolean;
  expanded: boolean;
  habit: Habit;
  onDayPress: (dayIndex: number) => void;
  onDelete: () => void;
  onEdit: () => void;
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
        activeDayIndex={activeDayIndex}
        compact={compact}
        expanded={expanded}
        habit={habit}
        onDayPress={expanded ? onDayPress : undefined}
      />
      {expanded ? (
        <View style={styles.detailPanel}>
          {habit.details.map((section) => (
            <HabitDetailSectionView compact={compact} key={section.title} section={section} />
          ))}
          <View style={styles.habitActionsRow}>
            <AppButton
              label="Edit"
              onPress={onEdit}
              style={styles.habitActionButton}
              variant="secondary"
            />
            <AppButton
              label="Delete"
              onPress={onDelete}
              style={[styles.habitActionButton, styles.habitDeleteButton]}
              textStyle={styles.habitDeleteLabel}
              variant="secondary"
            />
          </View>
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
  const [expandedHabit, setExpandedHabit] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Habit | null>(null);
  const [dreams, setDreams] = useState<Dream[]>([]);
  const { habits: habitViews, refresh, setCompletion, weekDates } =
    useHabitWeek();

  useFocusEffect(
    useCallback(() => {
      getDreams()
        .then(setDreams)
        .catch((cause: unknown) =>
          console.error("Failed to load dreams", cause),
        );
    }, []),
  );

  // Monday-first index of today, matching the week strip's order.
  const activeDayIndex = (new Date().getDay() + 6) % 7;

  const groups: (HabitGroup & { views: HabitWeekView[] })[] = dreams
    .map((dream, index) => {
      const visuals = GROUP_VISUAL_CYCLE[index % GROUP_VISUAL_CYCLE.length];
      const views = habitViews.filter(
        (view) => view.habit.dreamId === dream.id,
      );
      return {
        count: `${views.length} ${views.length === 1 ? "habit" : "habits"}`,
        icon: visuals.icon,
        tint: visuals.tint,
        title: dream.title,
        habits: views.map((view, habitIndex) =>
          toHabitRow(view, habitIndex, visuals.tint),
        ),
        views,
      };
    })
    .filter((group) => group.habits.length > 0);

  function handleHabitPress(id: number) {
    setExpandedHabit((current) => (current === id ? null : id));
  }

  function handleDayPress(habit: Habit, dayIndex: number) {
    const date = weekDates[dayIndex];
    const current = habit.progress[dayIndex];
    // Tap cycles done ↔ open; the create/edit form is where richer statuses
    // could live later.
    setCompletion(habit.id, date, current === "done" ? null : "done");
  }

  async function handleDeleteConfirmed() {
    if (!deleteTarget) return;
    try {
      await deleteHabit(deleteTarget.id);
      await refresh();
    } catch (cause) {
      console.error("Failed to delete the habit", cause);
    }
    setDeleteTarget(null);
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

      <TodayBar compact={compact} totalHabits={habitViews.length} />

      <View style={styles.groups}>
        {groups.map((group) => (
          <View key={group.title} style={styles.group}>
            <GroupHeader compact={compact} group={group} />
            {group.habits.map((habit) => (
              <HabitRow
                activeDayIndex={activeDayIndex}
                compact={compact}
                expanded={expandedHabit === habit.id}
                habit={habit}
                key={habit.id}
                onDayPress={(dayIndex) => handleDayPress(habit, dayIndex)}
                onDelete={() => setDeleteTarget(habit)}
                onEdit={() =>
                  router.push({
                    pathname: "/create-habit",
                    params: { habitId: String(habit.id) },
                  })
                }
                onPress={() => handleHabitPress(habit.id)}
              />
            ))}
          </View>
        ))}
      </View>

      {habitViews.length === 0 ? (
        <View style={styles.emptyState}>
          <AppText align="center" variant="bodySmall">
            No habits yet. Tap + to create the first one.
          </AppText>
        </View>
      ) : null}

      <AppModal
        onClose={() => setDeleteTarget(null)}
        visible={deleteTarget !== null}
      >
        <AppText align="center" variant="titleSm">
          Delete this habit?
        </AppText>
        <AppText align="center" style={styles.confirmBody} variant="bodySerif">
          “{deleteTarget?.title}” and its history will be removed.
        </AppText>
        <View style={styles.habitActionsRow}>
          <AppButton
            label="Cancel"
            onPress={() => setDeleteTarget(null)}
            style={styles.habitActionButton}
            variant="secondary"
          />
          <AppButton
            label="Delete"
            onPress={handleDeleteConfirmed}
            style={[styles.habitActionButton, styles.habitDeleteButton]}
            textStyle={styles.habitDeleteLabel}
            variant="secondary"
          />
        </View>
      </AppModal>
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
    lineHeight: lineHeights.md,
  },
  detailTitleCompact: {
    fontSize: fontSizes.lg,
    lineHeight: lineHeights.lg,
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
    lineHeight: lineHeights.xl,
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
  confirmBody: {
    marginTop: spacing.sm,
  },
  emptyState: {
    paddingVertical: spacing.xl,
  },
  habitActionButton: {
    flex: 1,
    paddingHorizontal: spacing.sm,
  },
  habitActionsRow: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  habitDeleteButton: {
    borderColor: colors.danger,
  },
  habitDeleteLabel: {
    color: colors.danger,
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
