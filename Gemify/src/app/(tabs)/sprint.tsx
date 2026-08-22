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

function CalendarIcon({ color = colors.primary, size = 22 }: { color?: string; size?: number }) {
  return (
    <Svg height={size} viewBox="0 0 24 24" width={size}>
      <Rect fill="none" height={15} rx={2.4} stroke={color} strokeWidth={1.7} width={17} x={3.5} y={5.5} />
      <Path d="M7.5 3.5v4M16.5 3.5v4M3.5 10h17" fill="none" stroke={color} strokeLinecap="round" strokeWidth={1.7} />
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

function GripIcon({ color = colors.textSecondary, size = 22 }: { color?: string; size?: number }) {
  return (
    <Svg height={size} viewBox="0 0 24 24" width={size}>
      {[9, 15].map((cx) =>
        [6, 12, 18].map((cy) => (
          <Circle cx={cx} cy={cy} fill={color} key={`${cx}-${cy}`} r={1.6} />
        )),
      )}
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

function BreadcrumbPart({
  color,
  icon,
  label,
}: {
  color: string;
  icon: ReactNode;
  label: string;
}) {
  return (
    <View style={styles.breadcrumbPart}>
      {icon}
      <AppText
        color={color}
        numberOfLines={1}
        style={styles.breadcrumbLabel}
        variant="bodySmall"
      >
        {label}
      </AppText>
    </View>
  );
}

function TaskBreadcrumb({ task }: { task: TaskWithBreadcrumb }) {
  return (
    <View style={styles.breadcrumb}>
      <BreadcrumbPart
        color={colors.textSecondary}
        icon={<DreamIcon size={16} />}
        label={task.dreamTitle}
      />
      <ChevronIcon color={colors.textMuted} direction="right" size={13} />
      <BreadcrumbPart
        color={colors.textSecondary}
        icon={<MilestoneIcon size={16} />}
        label={task.milestoneTitle}
      />
      <ChevronIcon color={colors.textMuted} direction="right" size={13} />
      <BreadcrumbPart
        color={colors.textSecondary}
        icon={<QuestTargetIcon size={16} />}
        label={task.questTitle}
      />
    </View>
  );
}

/**
 * A weekly-plan task item: grip (opens the schedule modal) · title with the
 * dream › milestone › quest breadcrumb · circle done-toggle.
 */
function TaskItemCard({
  onOpenSchedule,
  onToggleDone,
  showTime = false,
  task,
}: {
  onOpenSchedule: () => void;
  onToggleDone: () => void;
  showTime?: boolean;
  task: TaskWithBreadcrumb;
}) {
  return (
    <Card style={styles.taskCard}>
      <View style={styles.taskCardRow}>
        <Pressable
          accessibilityLabel="Schedule task"
          accessibilityRole="button"
          hitSlop={8}
          onPress={onOpenSchedule}
          style={({ pressed: isPressed }) => [styles.gripButton, isPressed && pressed]}
        >
          <GripIcon />
        </Pressable>
        <View style={styles.taskCardCopy}>
          <AppText numberOfLines={2} variant="button">{task.title}</AppText>
          {showTime ? (
            <View style={styles.taskMeta}>
              <ClockIcon />
              <AppText color={colors.textSecondary} variant="bodySmall">
                {task.scheduledTime ?? "Anytime"}
              </AppText>
            </View>
          ) : null}
          <TaskBreadcrumb task={task} />
        </View>
        <Checkbox
          accessibilityLabel="Mark task done"
          checked={task.isDone}
          onPress={onToggleDone}
          shape="circle"
          size={44}
        />
      </View>
    </Card>
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
    // Optimistic flip in whichever list holds the task; reload fixes drift.
    const flip = (list: TaskWithBreadcrumb[]) =>
      list.map((entry) =>
        entry.id === task.id ? { ...entry, isDone: !entry.isDone } : entry,
      );
    setScheduled(flip);
    setUnscheduled(flip);
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
        <TaskItemCard
          key={task.id}
          onOpenSchedule={() => setScheduleTarget(task)}
          onToggleDone={() => handleToggleDone(task)}
          showTime
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

      {unscheduled.map((task) => (
        <TaskItemCard
          key={task.id}
          onOpenSchedule={() => setScheduleTarget(task)}
          onToggleDone={() => handleToggleDone(task)}
          task={task}
        />
      ))}

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

const styles = StyleSheet.create({
  breadcrumb: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  breadcrumbLabel: {
    flexShrink: 1,
  },
  breadcrumbPart: {
    alignItems: "center",
    flexDirection: "row",
    flexShrink: 1,
    gap: spacing.xs,
    minWidth: 0,
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
  gripButton: {
    alignItems: "center",
    height: 44,
    justifyContent: "center",
    width: 36,
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
  weekStrip: {
    flexDirection: "row",
    gap: spacing.sm,
  },
});
