import { useFocusEffect } from "expo-router";
import { useCallback, useState, type ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Svg, { Circle, Path, Rect } from "react-native-svg";

import { DatePickerModal } from "@/components/DatePickerModal";
import {
  getScheduledTaskCounts,
  getScheduledTasks,
  getUnscheduledTasks,
  setTaskDone,
  updateTask,
  type TaskWithBreadcrumb,
} from "@/db";
import {
  AppButton,
  AppInput,
  AppModal,
  AppText,
  Card,
  Checkbox,
  ChevronIcon,
  Chip,
  IconButton,
  ScreenHeader,
  ScreenScaffold,
} from "@/shared/components";
import { colors } from "@/theme/colors";
import { pressed, radius, spacing } from "@/theme/theme";
import { addDays, startOfWeek, toDateKey, todayKey } from "@/utils/dates";

/** Bespoke night-sky gradient behind the sprint board. */
const SPRINT_BACKGROUND = ["#02050D", "#060716", "#080617", "#030712"] as const;

type WeekDay = {
  count: number;
  date: number;
  dateKey: string;
  label: string;
  selected: boolean;
};

/** Unscheduled tasks regrouped dream → milestone → quest for the tree card. */
type DreamGroup = {
  dream: string;
  taskCount: number;
  milestones: {
    milestone: string;
    quests: { quest: string; tasks: TaskWithBreadcrumb[] }[];
  }[];
};

function groupUnscheduled(tasks: TaskWithBreadcrumb[]): DreamGroup[] {
  const groups: DreamGroup[] = [];
  for (const task of tasks) {
    let dream = groups.find((entry) => entry.dream === task.dreamTitle);
    if (!dream) {
      dream = { dream: task.dreamTitle, taskCount: 0, milestones: [] };
      groups.push(dream);
    }
    dream.taskCount += 1;

    let milestone = dream.milestones.find(
      (entry) => entry.milestone === task.milestoneTitle,
    );
    if (!milestone) {
      milestone = { milestone: task.milestoneTitle, quests: [] };
      dream.milestones.push(milestone);
    }

    let quest = milestone.quests.find(
      (entry) => entry.quest === task.questTitle,
    );
    if (!quest) {
      quest = { quest: task.questTitle, tasks: [] };
      milestone.quests.push(quest);
    }
    quest.tasks.push(task);
  }
  return groups;
}

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

function DayCell({ day, onPress }: { day: WeekDay; onPress: () => void }) {
  const hasTasks = day.count > 0;
  const dotColor = day.selected
    ? colors.primary
    : hasTasks
      ? colors.accentVioletStrong
      : colors.textMuted;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed: isPressed }) => [
        styles.dayCell,
        day.selected && styles.dayCellSelected,
        isPressed && pressed,
      ]}
    >
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
    </Pressable>
  );
}

function TaskBreadcrumb({ task }: { task: TaskWithBreadcrumb }) {
  return (
    <View style={styles.breadcrumb}>
      <AppText color={colors.accentViolet} numberOfLines={1} variant="bodySmall">
        {task.dreamTitle}
      </AppText>
      <AppText color={colors.textMuted} variant="bodySmall">/</AppText>
      <AppText color={colors.primary} numberOfLines={1} variant="bodySmall">
        {task.milestoneTitle}
      </AppText>
      <AppText color={colors.textMuted} variant="bodySmall">/</AppText>
      <AppText color={colors.accentViolet} numberOfLines={1} variant="bodySmall">
        {task.questTitle}
      </AppText>
    </View>
  );
}

function ScheduledTaskCard({
  onReschedule,
  onToggleDone,
  task,
}: {
  onReschedule: () => void;
  onToggleDone: () => void;
  task: TaskWithBreadcrumb;
}) {
  return (
    <Card style={styles.taskCard}>
      <View style={styles.taskCardRow}>
        <Pressable accessibilityRole="checkbox" hitSlop={8} onPress={onToggleDone}>
          <Checkbox checked={task.isDone} shape="circle" size={32} />
        </Pressable>
        <View style={styles.taskCardCopy}>
          <AppText numberOfLines={1} variant="pill">{task.title}</AppText>
          <View style={styles.taskMeta}>
            <ClockIcon />
            <AppText color={colors.textSecondary} variant="bodySmall">
              {task.scheduledTime ?? "Anytime"}
            </AppText>
          </View>
          <TaskBreadcrumb task={task} />
        </View>
        <IconButton
          accessibilityLabel="Reschedule task"
          icon={<CalendarPlusIcon />}
          onPress={onReschedule}
          size="sm"
        />
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
  onSchedule,
  task,
}: {
  divider?: boolean;
  onSchedule: () => void;
  task: TaskWithBreadcrumb;
}) {
  return (
    <View style={[styles.unscheduledTaskRow, divider && styles.unscheduledTaskRowDivider]}>
      <View style={styles.taskCardCopy}>
        <AppText numberOfLines={2} variant="pill">{task.title}</AppText>
      </View>
      <Pressable
        accessibilityRole="button"
        onPress={onSchedule}
        style={({ pressed: isPressed }) => [styles.scheduleButton, isPressed && pressed]}
      >
        <CalendarPlusIcon />
        <AppText color={colors.primary} variant="controlLabel">Schedule</AppText>
      </Pressable>
    </View>
  );
}

const TIME_PATTERN = /^([01]?\d|2[0-3]):[0-5]\d$/;

/** Day-of-week + optional time picker used to (re)schedule a task. */
function ScheduleModal({
  onClose,
  onSave,
  onUnschedule,
  task,
  weekDays,
}: {
  onClose: () => void;
  onSave: (date: string, time: string | null) => void;
  onUnschedule: () => void;
  task: TaskWithBreadcrumb | null;
  weekDays: WeekDay[];
}) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [time, setTime] = useState("");
  const [lastTaskId, setLastTaskId] = useState<number | null>(null);

  if (task && task.id !== lastTaskId) {
    setLastTaskId(task.id);
    setSelectedDate(task.scheduledDate);
    setTime(task.scheduledTime ?? "");
  }

  const timeValid = time.trim() === "" || TIME_PATTERN.test(time.trim());

  return (
    <AppModal onClose={onClose} visible={task !== null}>
      <AppText align="center" variant="titleSm">
        Schedule task
      </AppText>
      <AppText align="center" style={styles.modalSubtitle} variant="bodySmall">
        {task?.title}
      </AppText>

      <View style={styles.modalDayGrid}>
        {weekDays.map((day) => (
          <Chip
            key={day.dateKey}
            label={`${day.label} ${day.date}`}
            onPress={() => setSelectedDate(day.dateKey)}
            selected={selectedDate === day.dateKey}
            style={styles.modalDayChip}
          />
        ))}
      </View>

      <AppInput
        containerStyle={styles.modalTimeInput}
        label="Time (optional)"
        onChangeText={setTime}
        placeholder="09:00"
        value={time}
      />

      <View style={styles.modalActions}>
        {task?.scheduledDate ? (
          <AppButton
            label="Unschedule"
            onPress={onUnschedule}
            style={styles.modalButton}
            variant="secondary"
          />
        ) : (
          <AppButton
            label="Cancel"
            onPress={onClose}
            style={styles.modalButton}
            variant="secondary"
          />
        )}
        <AppButton
          disabled={!selectedDate || !timeValid}
          label="Save"
          onPress={() => {
            if (selectedDate) onSave(selectedDate, time.trim() || null);
          }}
          style={styles.modalButton}
        />
      </View>
    </AppModal>
  );
}

export default function SprintScreen() {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [selectedDate, setSelectedDate] = useState(todayKey);
  const [counts, setCounts] = useState<Map<string, number>>(new Map());
  const [scheduled, setScheduled] = useState<TaskWithBreadcrumb[]>([]);
  const [unscheduled, setUnscheduled] = useState<TaskWithBreadcrumb[]>([]);
  const [collapsedDreams, setCollapsedDreams] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const [scheduleTarget, setScheduleTarget] =
    useState<TaskWithBreadcrumb | null>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);

  const weekDates = Array.from({ length: 7 }, (_, index) =>
    addDays(weekStart, index),
  );
  const weekDayCells: WeekDay[] = weekDates.map((date) => {
    const dateKey = toDateKey(date);
    return {
      count: counts.get(dateKey) ?? 0,
      date: date.getDate(),
      dateKey,
      label: date
        .toLocaleDateString("en-US", { weekday: "short" })
        .toUpperCase(),
      selected: dateKey === selectedDate,
    };
  });

  const loadBoard = useCallback(async () => {
    try {
      const from = toDateKey(weekStart);
      const to = toDateKey(addDays(weekStart, 6));
      const [countMap, dayTasks, backlog] = await Promise.all([
        getScheduledTaskCounts(from, to),
        getScheduledTasks(selectedDate),
        getUnscheduledTasks(),
      ]);
      setCounts(countMap);
      setScheduled(dayTasks);
      setUnscheduled(backlog);
    } catch (cause) {
      console.error("Failed to load the weekly plan", cause);
    }
  }, [selectedDate, weekStart]);

  useFocusEffect(
    useCallback(() => {
      loadBoard();
    }, [loadBoard]),
  );

  const shiftWeek = (weeks: number) => {
    const nextStart = addDays(weekStart, weeks * 7);
    setWeekStart(nextStart);
    setSelectedDate(toDateKey(nextStart));
  };

  const jumpToDate = (date: Date) => {
    setWeekStart(startOfWeek(date));
    setSelectedDate(toDateKey(date));
    setCalendarOpen(false);
  };

  const handleToggleDone = async (task: TaskWithBreadcrumb) => {
    setScheduled((current) =>
      current.map((entry) =>
        entry.id === task.id ? { ...entry, isDone: !entry.isDone } : entry,
      ),
    );
    try {
      await setTaskDone(task.id, !task.isDone);
    } catch (cause) {
      console.error("Failed to toggle the task", cause);
      await loadBoard();
    }
  };

  const handleSchedule = async (date: string, time: string | null) => {
    if (!scheduleTarget) return;
    try {
      await updateTask(scheduleTarget.id, {
        scheduledDate: date,
        scheduledTime: time,
      });
      await loadBoard();
    } catch (cause) {
      console.error("Failed to schedule the task", cause);
    }
    setScheduleTarget(null);
  };

  const handleUnschedule = async () => {
    if (!scheduleTarget) return;
    try {
      await updateTask(scheduleTarget.id, {
        scheduledDate: null,
        scheduledTime: null,
      });
      await loadBoard();
    } catch (cause) {
      console.error("Failed to unschedule the task", cause);
    }
    setScheduleTarget(null);
  };

  const toggleDream = (dream: string) =>
    setCollapsedDreams((current) => {
      const next = new Set(current);
      if (next.has(dream)) {
        next.delete(dream);
      } else {
        next.add(dream);
      }
      return next;
    });

  const dreamGroups = groupUnscheduled(unscheduled);
  const selectedHeading = new Date(
    `${selectedDate}T12:00:00`,
  ).toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    weekday: "long",
  });

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
            onPress={() => setCalendarOpen(true)}
          />
        }
        style={styles.header}
      />

      <View style={styles.weekStrip}>
        {weekDayCells.map((day) => (
          <DayCell
            day={day}
            key={day.dateKey}
            onPress={() => setSelectedDate(day.dateKey)}
          />
        ))}
      </View>

      <View style={styles.dayHeadingRow}>
        <IconButton
          accessibilityLabel="Previous week"
          icon={<ChevronIcon direction="left" />}
          onPress={() => shiftWeek(-1)}
          size="sm"
        />
        <AppText style={styles.dayHeading} variant="titleSm">
          {selectedHeading}
        </AppText>
        <IconButton
          accessibilityLabel="Next week"
          icon={<ChevronIcon direction="right" />}
          onPress={() => shiftWeek(1)}
          size="sm"
        />
      </View>

      {scheduled.map((task) => (
        <ScheduledTaskCard
          key={task.id}
          onReschedule={() => setScheduleTarget(task)}
          onToggleDone={() => handleToggleDone(task)}
          task={task}
        />
      ))}

      {scheduled.length === 0 ? (
        <Card style={styles.emptyCard}>
          <AppText align="center" variant="bodySmall">
            Nothing planned for this day yet. Schedule a task from the backlog
            below.
          </AppText>
        </Card>
      ) : null}

      <View style={styles.sectionHeader}>
        <AppText variant="titleSm">Unscheduled this week</AppText>
        <View style={styles.countBadge}>
          <AppText color={colors.accentViolet} variant="caption">
            {unscheduled.length}
          </AppText>
        </View>
        <View style={styles.sectionHeaderSpacer} />
      </View>

      {dreamGroups.map((group) => {
        const collapsed = collapsedDreams.has(group.dream);

        if (collapsed) {
          return (
            <Card key={group.dream} padded={false} style={styles.treeCard}>
              <Pressable
                onPress={() => toggleDream(group.dream)}
                style={styles.treeRow}
              >
                <View style={[styles.treeIconFrame, { borderColor: `${colors.accentViolet}66` }]}>
                  <DreamIcon />
                </View>
                <View style={styles.treeRowCopy}>
                  <AppText color={colors.accentViolet} variant="eyebrow">DREAM</AppText>
                  <AppText numberOfLines={1} variant="pill">{group.dream}</AppText>
                  <AppText color={colors.textMuted} variant="caption">
                    {group.taskCount} task{group.taskCount === 1 ? "" : "s"}
                  </AppText>
                </View>
                <ChevronIcon />
              </Pressable>
            </Card>
          );
        }

        return (
          <Card key={group.dream} padded={false} style={styles.treeCard}>
            <View style={styles.treeRail} />

            <Pressable onPress={() => toggleDream(group.dream)}>
              <TreeRow
                divider
                eyebrow="DREAM"
                eyebrowColor={colors.accentViolet}
                icon={<DreamIcon />}
                iconColor={colors.accentViolet}
                title={group.dream}
                trailing={<ChevronIcon direction="up" />}
              />
            </Pressable>

            {group.milestones.map((milestoneGroup) => (
              <View key={milestoneGroup.milestone}>
                <TreeRow
                  divider
                  eyebrow="MILESTONE"
                  eyebrowColor={colors.primary}
                  icon={<MilestoneIcon />}
                  iconColor={colors.primary}
                  title={milestoneGroup.milestone}
                />
                {milestoneGroup.quests.map((questGroup) => (
                  <View key={questGroup.quest}>
                    <TreeRow
                      eyebrow="QUEST"
                      eyebrowColor={colors.accentViolet}
                      icon={<QuestTargetIcon />}
                      iconColor={colors.accentVioletStrong}
                      meta={`${questGroup.tasks.length} task${questGroup.tasks.length === 1 ? "" : "s"}`}
                      title={questGroup.quest}
                    />
                    <View style={styles.unscheduledTaskBox}>
                      {questGroup.tasks.map((task, index) => (
                        <UnscheduledTaskRow
                          divider={index < questGroup.tasks.length - 1}
                          key={task.id}
                          onSchedule={() => setScheduleTarget(task)}
                          task={task}
                        />
                      ))}
                    </View>
                  </View>
                ))}
              </View>
            ))}
          </Card>
        );
      })}

      {unscheduled.length === 0 ? (
        <Card style={styles.emptyCard}>
          <AppText align="center" variant="bodySmall">
            The backlog is clear — add tasks from a quest to plan your week.
          </AppText>
        </Card>
      ) : null}

      <ScheduleModal
        onClose={() => setScheduleTarget(null)}
        onSave={handleSchedule}
        onUnschedule={handleUnschedule}
        task={scheduleTarget}
        weekDays={weekDayCells}
      />

      {calendarOpen ? (
        <DatePickerModal
          initialDate={new Date(`${selectedDate}T12:00:00`)}
          onClose={() => setCalendarOpen(false)}
          onSelect={jumpToDate}
          today={new Date()}
          visible={calendarOpen}
        />
      ) : null}
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
    flex: 1,
    textAlign: "center",
  },
  dayHeadingRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.md,
    marginTop: spacing.lg,
  },
  dayLabel: {
    letterSpacing: 1.4,
  },
  dayNumber: {
    marginTop: 2,
  },
  emptyCard: {
    marginBottom: spacing.md,
    paddingVertical: spacing.lg,
  },
  header: {
    marginBottom: spacing.md,
    paddingHorizontal: 0,
  },
  modalActions: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  modalButton: {
    flex: 1,
    paddingHorizontal: spacing.sm,
  },
  modalDayChip: {
    minWidth: 92,
  },
  modalDayGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    justifyContent: "center",
    marginTop: spacing.lg,
  },
  modalSubtitle: {
    marginTop: spacing.xs,
  },
  modalTimeInput: {
    marginTop: spacing.lg,
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
