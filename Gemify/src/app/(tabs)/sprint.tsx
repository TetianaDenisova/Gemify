import type { ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Svg, { Circle, Path, Rect } from "react-native-svg";

import {
  AppText,
  Card,
  ChevronIcon,
  IconButton,
  ScreenHeader,
  ScreenScaffold,
} from "@/shared/components";
import { colors } from "@/theme/colors";
import { pressed, radius, spacing } from "@/theme/theme";

/** Bespoke night-sky gradient behind the sprint board. */
const SPRINT_BACKGROUND = ["#02050D", "#060716", "#080617", "#030712"] as const;

type WeekDay = {
  count: number;
  date: number;
  label: string;
  selected?: boolean;
};

type ScheduledTask = {
  dream: string;
  duration: string;
  milestone: string;
  quest: string;
  time: string;
  title: string;
};

type UnscheduledTask = {
  duration: string;
  title: string;
};

const weekDays: readonly WeekDay[] = [
  { count: 2, date: 20, label: "MON" },
  { count: 1, date: 21, label: "TUE" },
  { count: 2, date: 22, label: "WED" },
  { count: 1, date: 23, label: "THU" },
  { count: 2, date: 24, label: "FRI", selected: true },
  { count: 0, date: 25, label: "SAT" },
  { count: 1, date: 26, label: "SUN" },
];

const scheduledTasks: readonly ScheduledTask[] = [
  {
    dream: "Growth Mindset",
    duration: "45 min",
    milestone: "Become a Creator",
    quest: "Learn Video Making",
    time: "09:00",
    title: "Review video script",
  },
  {
    dream: "Growth Mindset",
    duration: "90 min",
    milestone: "Become a Creator",
    quest: "Learn Video Making",
    time: "11:00",
    title: "Record first lesson",
  },
];

const unscheduledGroup = {
  dream: "Growth Mindset",
  milestone: "Become a Creator",
  quest: { done: 3, title: "Learn Video Making", total: 5 },
  tasks: [
    { duration: "60 min", title: "Plan and write video script" },
    { duration: "90 min", title: "Edit and publish short clip" },
  ] as readonly UnscheduledTask[],
};

const collapsedDream = { taskCount: 1, title: "Build Confidence" };

function CalendarIcon({ color = colors.primary, size = 22 }: { color?: string; size?: number }) {
  return (
    <Svg height={size} viewBox="0 0 24 24" width={size}>
      <Rect fill="none" height={15} rx={2.4} stroke={color} strokeWidth={1.7} width={17} x={3.5} y={5.5} />
      <Path d="M7.5 3.5v4M16.5 3.5v4M3.5 10h17" fill="none" stroke={color} strokeLinecap="round" strokeWidth={1.7} />
    </Svg>
  );
}

function CalendarPlusIcon({ color = colors.primary, size = 18 }: { color?: string; size?: number }) {
  return (
    <Svg height={size} viewBox="0 0 24 24" width={size}>
      <Rect fill="none" height={15} rx={2.4} stroke={color} strokeWidth={1.7} width={17} x={3.5} y={5.5} />
      <Path d="M7.5 3.5v4M16.5 3.5v4M3.5 10h17" fill="none" stroke={color} strokeLinecap="round" strokeWidth={1.7} />
      <Path d="M9 15.5h6M12 12.5v6" fill="none" stroke={color} strokeLinecap="round" strokeWidth={1.7} />
    </Svg>
  );
}

function ClockIcon({ color = colors.textSecondary, size = 15 }: { color?: string; size?: number }) {
  return (
    <Svg height={size} viewBox="0 0 24 24" width={size}>
      <Circle cx={12} cy={12} fill="none" r={8.5} stroke={color} strokeWidth={1.7} />
      <Path d="M12 7.5V12l3 2" fill="none" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} />
    </Svg>
  );
}

function DragHandleIcon({ color = colors.textMuted, size = 26 }: { color?: string; size?: number }) {
  return (
    <Svg height={size} viewBox="0 0 24 24" width={size}>
      {[5, 12, 19].map((cy) =>
        [8, 16].map((cx) => (
          <Circle cx={cx} cy={cy} fill={color} key={`${cx}-${cy}`} r={1.8} />
        )),
      )}
    </Svg>
  );
}

function DreamIcon({ color = colors.accentViolet, size = 22 }: { color?: string; size?: number }) {
  return (
    <Svg height={size} viewBox="0 0 24 24" width={size}>
      <Path
        d="M4 6c3.2 0 5.3 1 8 3.4C14.7 7 16.8 6 20 6v12c-3.2 0-5.3 1-8 3.4C9.3 19 7.2 18 4 18V6Z"
        fill="none"
        stroke={color}
        strokeLinejoin="round"
        strokeWidth={1.8}
      />
      <Path d="M12 9.4v12" stroke={color} strokeLinecap="round" strokeWidth={1.8} />
    </Svg>
  );
}

function MilestoneIcon({ color = colors.primary, size = 22 }: { color?: string; size?: number }) {
  return (
    <Svg height={size} viewBox="0 0 24 24" width={size}>
      <Path
        d="M4.5 8.5 8 12l4-5.5L16 12l3.5-3.5V17a1.5 1.5 0 0 1-1.5 1.5H6A1.5 1.5 0 0 1 4.5 17V8.5Z"
        fill="none"
        stroke={color}
        strokeLinejoin="round"
        strokeWidth={1.8}
      />
    </Svg>
  );
}

function QuestTargetIcon({ color = colors.accentVioletStrong, size = 22 }: { color?: string; size?: number }) {
  return (
    <Svg height={size} viewBox="0 0 24 24" width={size}>
      <Circle cx={12} cy={12} fill="none" r={8.5} stroke={color} strokeWidth={1.8} />
      <Circle cx={12} cy={12} fill="none" r={4} stroke={color} strokeWidth={1.8} />
      <Circle cx={12} cy={12} fill={color} r={1.3} />
    </Svg>
  );
}

function DayCell({ day }: { day: WeekDay }) {
  const hasTasks = day.count > 0;
  const dotColor = day.selected
    ? colors.primary
    : hasTasks
      ? colors.accentVioletStrong
      : colors.textMuted;

  return (
    <View style={[styles.dayCell, day.selected && styles.dayCellSelected]}>
      <AppText
        color={day.selected ? colors.primary : colors.textMuted}
        style={styles.dayLabel}
        variant="micro"
      >
        {day.label}
      </AppText>
      <AppText
        color={day.selected ? colors.primary : colors.textPrimary}
        style={styles.dayNumber}
        variant="titleSm"
      >
        {day.date}
      </AppText>
      <View style={[styles.dayCountPill, day.selected && styles.dayCountPillSelected]}>
        <View style={[styles.dayCountDot, { backgroundColor: dotColor }]} />
        <AppText
          color={day.selected ? colors.primary : colors.textSecondary}
          variant="caption"
        >
          {day.count}
        </AppText>
      </View>
    </View>
  );
}

function TaskBreadcrumb({ task }: { task: ScheduledTask }) {
  return (
    <View style={styles.breadcrumb}>
      <AppText color={colors.accentViolet} numberOfLines={1} variant="bodySmall">
        {task.dream}
      </AppText>
      <AppText color={colors.textMuted} variant="bodySmall">/</AppText>
      <AppText color={colors.primary} numberOfLines={1} variant="bodySmall">
        {task.milestone}
      </AppText>
      <AppText color={colors.textMuted} variant="bodySmall">/</AppText>
      <AppText color={colors.accentViolet} numberOfLines={1} variant="bodySmall">
        {task.quest}
      </AppText>
    </View>
  );
}

function ScheduledTaskCard({ task }: { task: ScheduledTask }) {
  return (
    <Card style={styles.taskCard}>
      <View style={styles.taskCardRow}>
        <DragHandleIcon />
        <View style={styles.taskCardCopy}>
          <AppText numberOfLines={1} variant="pill">{task.title}</AppText>
          <View style={styles.taskMeta}>
            <ClockIcon />
            <AppText color={colors.textSecondary} variant="bodySmall">
              {task.time} · {task.duration}
            </AppText>
          </View>
          <TaskBreadcrumb task={task} />
        </View>
      </View>
    </Card>
  );
}

function TreeRow({
  divider,
  eyebrow,
  eyebrowColor,
  icon,
  iconColor,
  meta,
  title,
  trailing,
}: {
  divider?: boolean;
  eyebrow: string;
  eyebrowColor: string;
  icon: ReactNode;
  iconColor: string;
  meta?: string;
  title: string;
  trailing?: ReactNode;
}) {
  return (
    <View style={[styles.treeRow, divider && styles.treeRowDivider]}>
      <View style={[styles.treeIconFrame, { borderColor: `${iconColor}66` }]}>
        {icon}
      </View>
      <View style={styles.treeRowCopy}>
        <AppText color={eyebrowColor} variant="eyebrow">{eyebrow}</AppText>
        <View style={styles.treeRowTitleLine}>
          <AppText numberOfLines={1} variant="pill">{title}</AppText>
          {meta ? (
            <AppText color={colors.primary} variant="bodySmall"> · {meta}</AppText>
          ) : null}
        </View>
      </View>
      {trailing}
    </View>
  );
}

function UnscheduledTaskRow({
  divider,
  task,
}: {
  divider?: boolean;
  task: UnscheduledTask;
}) {
  return (
    <View style={[styles.unscheduledTaskRow, divider && styles.unscheduledTaskRowDivider]}>
      <DragHandleIcon size={22} />
      <View style={styles.taskCardCopy}>
        <AppText numberOfLines={2} variant="pill">{task.title}</AppText>
        <View style={styles.taskMeta}>
          <ClockIcon />
          <AppText color={colors.textSecondary} variant="bodySmall">{task.duration}</AppText>
        </View>
      </View>
      <Pressable
        accessibilityRole="button"
        style={({ pressed: isPressed }) => [styles.scheduleButton, isPressed && pressed]}
      >
        <CalendarPlusIcon />
        <AppText color={colors.primary} variant="controlLabel">Schedule</AppText>
      </Pressable>
    </View>
  );
}

export default function SprintScreen() {
  return (
    <ScreenScaffold
      backgroundGradient={SPRINT_BACKGROUND}
      tabClearance
      topInset
    >
      <ScreenHeader
        centerSlot={
          <AppText color={colors.primary} numberOfLines={1} variant="screenTitle">
            Weekly Plan
          </AppText>
        }
        leftAction={null}
        rightSlot={
          <IconButton
            accessibilityLabel="Open calendar"
            icon={<CalendarIcon />}
            onPress={() => {}}
          />
        }
        style={styles.header}
      />

      <View style={styles.weekStrip}>
        {weekDays.map((day) => (
          <DayCell day={day} key={day.label} />
        ))}
      </View>

      <AppText style={styles.dayHeading} variant="titleSm">
        Friday, May 24
      </AppText>

      {scheduledTasks.map((task) => (
        <ScheduledTaskCard key={task.title} task={task} />
      ))}

      <View style={styles.sectionHeader}>
        <AppText variant="titleSm">Unscheduled this week</AppText>
        <View style={styles.countBadge}>
          <AppText color={colors.accentViolet} variant="caption">
            {unscheduledGroup.tasks.length + collapsedDream.taskCount}
          </AppText>
        </View>
        <View style={styles.sectionHeaderSpacer} />
        <ChevronIcon direction="up" />
      </View>

      <Card padded={false} style={styles.treeCard}>
        <View style={styles.treeRail} />

        <TreeRow
          divider
          eyebrow="DREAM"
          eyebrowColor={colors.accentViolet}
          icon={<DreamIcon />}
          iconColor={colors.accentViolet}
          title={unscheduledGroup.dream}
          trailing={<ChevronIcon />}
        />
        <TreeRow
          divider
          eyebrow="MILESTONE"
          eyebrowColor={colors.primary}
          icon={<MilestoneIcon />}
          iconColor={colors.primary}
          title={unscheduledGroup.milestone}
          trailing={<ChevronIcon />}
        />
        <TreeRow
          eyebrow="QUEST"
          eyebrowColor={colors.accentViolet}
          icon={<QuestTargetIcon />}
          iconColor={colors.accentVioletStrong}
          meta={`${unscheduledGroup.quest.done} / ${unscheduledGroup.quest.total}`}
          title={unscheduledGroup.quest.title}
        />

        <View style={styles.unscheduledTaskBox}>
          {unscheduledGroup.tasks.map((task, index) => (
            <UnscheduledTaskRow
              divider={index < unscheduledGroup.tasks.length - 1}
              key={task.title}
              task={task}
            />
          ))}
        </View>
      </Card>

      <Card padded={false} style={styles.treeCard}>
        <View style={styles.treeRow}>
          <View style={[styles.treeIconFrame, { borderColor: `${colors.accentViolet}66` }]}>
            <DreamIcon />
          </View>
          <View style={styles.treeRowCopy}>
            <AppText color={colors.accentViolet} variant="eyebrow">DREAM</AppText>
            <AppText numberOfLines={1} variant="pill">{collapsedDream.title}</AppText>
            <AppText color={colors.textMuted} variant="caption">
              {collapsedDream.taskCount} task{collapsedDream.taskCount === 1 ? "" : "s"}
            </AppText>
          </View>
          <ChevronIcon />
        </View>
      </Card>
    </ScreenScaffold>
  );
}

const RAIL_LEFT = spacing.md + 24;

const styles = StyleSheet.create({
  breadcrumb: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  countBadge: {
    alignItems: "center",
    borderColor: colors.accentVioletGlow,
    borderRadius: radius.round,
    borderWidth: 1,
    height: 26,
    justifyContent: "center",
    minWidth: 26,
    paddingHorizontal: spacing.xs,
  },
  dayCell: {
    alignItems: "center",
    backgroundColor: colors.surfaceCard,
    borderColor: colors.borderSoft,
    borderRadius: radius.md,
    borderWidth: 1,
    flex: 1,
    minWidth: 0,
    paddingBottom: spacing.sm,
    paddingTop: spacing.sm + spacing.xs,
  },
  dayCellSelected: {
    borderColor: colors.borderStrong,
  },
  dayCountDot: {
    borderRadius: radius.round,
    height: 6,
    width: 6,
  },
  dayCountPill: {
    alignItems: "center",
    backgroundColor: colors.surfaceDeep,
    borderColor: colors.borderSoft,
    borderRadius: radius.round,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.xs,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  dayCountPillSelected: {
    borderColor: colors.borderFaint,
  },
  dayHeading: {
    marginBottom: spacing.md,
    marginTop: spacing.lg,
  },
  dayLabel: {
    letterSpacing: 1.4,
  },
  dayNumber: {
    marginTop: 2,
  },
  header: {
    marginBottom: spacing.md,
    paddingHorizontal: 0,
  },
  scheduleButton: {
    alignItems: "center",
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 44,
    paddingHorizontal: spacing.md,
  },
  sectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.md,
    marginTop: spacing.lg,
  },
  sectionHeaderSpacer: {
    flex: 1,
  },
  taskCard: {
    marginBottom: spacing.md,
  },
  taskCardCopy: {
    flex: 1,
    minWidth: 0,
  },
  taskCardRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
  },
  taskMeta: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.xs + 2,
    marginTop: spacing.xs,
  },
  treeCard: {
    marginBottom: spacing.md,
    overflow: "hidden",
    paddingBottom: spacing.md,
    paddingTop: spacing.xs,
  },
  treeIconFrame: {
    alignItems: "center",
    backgroundColor: colors.surfaceDeep,
    borderRadius: radius.round,
    borderWidth: 1,
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  treeRail: {
    backgroundColor: colors.divider,
    bottom: spacing.lg,
    left: RAIL_LEFT,
    position: "absolute",
    top: 64,
    width: 1,
  },
  treeRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + spacing.xs,
  },
  treeRowCopy: {
    flex: 1,
    minWidth: 0,
  },
  treeRowDivider: {
    borderBottomColor: colors.divider,
    borderBottomWidth: 1,
  },
  treeRowTitleLine: {
    alignItems: "baseline",
    flexDirection: "row",
    minWidth: 0,
  },
  unscheduledTaskBox: {
    borderColor: colors.borderFaint,
    borderRadius: radius.md,
    borderWidth: 1,
    marginLeft: RAIL_LEFT + 24 + spacing.md,
    marginRight: spacing.md,
    marginTop: spacing.xs,
  },
  unscheduledTaskRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.sm + spacing.xs,
    paddingVertical: spacing.sm + spacing.xs,
  },
  unscheduledTaskRowDivider: {
    borderBottomColor: colors.divider,
    borderBottomWidth: 1,
  },
  weekStrip: {
    flexDirection: "row",
    gap: spacing.sm,
  },
});
