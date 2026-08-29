import { useFocusEffect } from "expo-router";
import { useCallback, useRef, useState, type ReactNode } from "react";
import {
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import {
  Gesture,
  GestureDetector,
  type PanGesture,
} from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  type SharedValue,
  useSharedValue,
} from "react-native-reanimated";
import Svg, { Circle, Path, Rect } from "react-native-svg";

import { DatePickerModal } from "@/components/DatePickerModal";
import { MoreMenuSheet } from "@/components/MoreMenuSheet";
import { BlockIconArt } from "@/components/TimeBlockTabs";
import {
  deleteQuest,
  getScheduledQuestCounts,
  getScheduledQuests,
  getTimeBlocks,
  getUnscheduledQuests,
  rolloverOverdueQuests,
  setQuestDone,
  updateQuest,
  type QuestWithBreadcrumb,
  type TimeBlockRecord,
} from "@/db";
import type { BlockIcon } from "@/dto/timeBlocks";
import {
  AppButton,
  AppInput,
  AppModal,
  AppText,
  Card,
  Checkbox,
  ChevronIcon,
  Chip,
  DotsIcon,
  DreamIcon,
  HintRow,
  IconButton,
  ListItem,
  MilestoneIcon,
  ScreenHeader,
  ScreenScaffold,
} from "@/shared/components";
import { colors } from "@/theme/colors";
import { pressed, radius, spacing } from "@/theme/theme";
import { addDays, startOfWeek, toDateKey, todayKey } from "@/utils/dates";

/** Bespoke night-sky gradient behind the sprint board. */
const SPRINT_BACKGROUND = ["#02050D", "#060716", "#080617", "#030712"] as const;

/** How long a press must be held before a quest card lifts into a drag. */
const DRAG_ACTIVATION_MS = 220;

type WeekDay = {
  count: number;
  date: number;
  dateKey: string;
  label: string;
  selected: boolean;
};

/** Window-coordinate rect of a drop target (day cell or section header). */
type DropRect = { height: number; width: number; x: number; y: number };

/**
 * Key of the block a quest belongs to — same bucketing as My Day: the timed
 * block whose start time most recently precedes the quest's time; a time-less
 * quest belongs to the flexible block.
 */
function blockKeyForQuest(
  quest: Pick<QuestWithBreadcrumb, "scheduledTime">,
  blocks: readonly TimeBlockRecord[],
): string | undefined {
  const flexibleKey =
    blocks.find((block) => block.startTime === null)?.key ?? blocks[0]?.key;
  if (!quest.scheduledTime) return flexibleKey;
  let key = flexibleKey;
  let latest: string | null = null;
  for (const block of blocks) {
    if (
      block.startTime !== null &&
      block.startTime <= quest.scheduledTime &&
      (latest === null || block.startTime > latest)
    ) {
      latest = block.startTime;
      key = block.key;
    }
  }
  return key;
}

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

function DayCell({
  cellRef,
  day,
  hoveredDay,
  index,
  onPress,
}: {
  cellRef: (cell: View | null) => void;
  day: WeekDay;
  hoveredDay: SharedValue<number>;
  index: number;
  onPress: () => void;
}) {
  const hasQuests = day.count > 0;
  const dotColor = day.selected
    ? colors.primary
    : hasQuests
      ? colors.accentVioletStrong
      : colors.textMuted;

  const dropHighlightStyle = useAnimatedStyle(() => ({
    opacity: hoveredDay.value === index ? 1 : 0,
  }));

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      ref={cellRef}
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
      <Animated.View
        style={[StyleSheet.absoluteFill, styles.dayDropTarget, dropHighlightStyle]}
      />
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

function QuestBreadcrumb({ quest }: { quest: QuestWithBreadcrumb }) {
  return (
    <View style={styles.breadcrumb}>
      <BreadcrumbPart
        color={colors.textSecondary}
        icon={<DreamIcon size={16} />}
        label={quest.dreamTitle}
      />
      <ChevronIcon color={colors.textMuted} direction="right" size={13} />
      <BreadcrumbPart
        color={colors.textSecondary}
        icon={<MilestoneIcon size={16} />}
        label={quest.milestoneTitle}
      />
    </View>
  );
}

/**
 * Tappable header of a collapsible quest section: icon · label · quest count,
 * with a chevron pointing down while wrapped and up while expanded.
 */
function SectionToggleHeader({
  count,
  expanded,
  headerRef,
  hoveredSection,
  icon,
  index,
  label,
  onToggle,
  time,
}: {
  count: number;
  expanded: boolean;
  headerRef: (view: View | null) => void;
  hoveredSection: SharedValue<number>;
  icon: ReactNode;
  index: number;
  label: string;
  onToggle: () => void;
  /** Block start time ("13:00"); omitted for the flexible block. */
  time?: string | null;
}) {
  const dropHighlightStyle = useAnimatedStyle(() => ({
    opacity: hoveredSection.value === index ? 1 : 0,
  }));

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ expanded }}
      onPress={onToggle}
      ref={headerRef}
      style={({ pressed: isPressed }) => [
        styles.sectionToggle,
        isPressed && pressed,
      ]}
    >
      {icon}
      <AppText color={colors.primary} variant="eyebrow">
        {label}
      </AppText>
      <View style={styles.sectionToggleDivider} />
      <AppText color={colors.textSecondary} variant="bodySmall">
        {count} {count === 1 ? "quest" : "quests"}
      </AppText>
      <View style={styles.sectionToggleSpacer} />
      {time ? (
        <AppText color={colors.textSecondary} variant="bodySmall">
          {time}
        </AppText>
      ) : null}
      <ChevronIcon
        color={colors.textSecondary}
        direction={expanded ? "up" : "down"}
        size={18}
      />
      <Animated.View
        style={[StyleSheet.absoluteFill, styles.sectionDropTarget, dropHighlightStyle]}
      />
    </Pressable>
  );
}

/**
 * A weekly-plan quest item: grip (opens the schedule modal) · title with the
 * dream › milestone breadcrumb · circle done-toggle.
 *
 * Long-pressing anywhere on the card lifts it into a drag; dropping it on a
 * week-strip day cell schedules the quest for that day.
 */
function QuestItemCard({
  dragGesture,
  dragging,
  onOpenMenu,
  onOpenSchedule,
  onToggleDone,
  quest,
  showTime = false,
}: {
  dragGesture: PanGesture;
  dragging: boolean;
  onOpenMenu: () => void;
  onOpenSchedule: () => void;
  onToggleDone: () => void;
  quest: QuestWithBreadcrumb;
  showTime?: boolean;
}) {
  return (
    <GestureDetector gesture={dragGesture}>
      <Card style={[styles.questCard, dragging && styles.questCardDragging]}>
        <View style={styles.questCardRow}>
          <Pressable
            accessibilityLabel="Schedule quest"
            accessibilityRole="button"
            hitSlop={8}
            onPress={onOpenSchedule}
            style={({ pressed: isPressed }) => [styles.gripButton, isPressed && pressed]}
          >
            <GripIcon />
          </Pressable>
          <View style={styles.questCardCopy}>
            <AppText numberOfLines={2} variant="button">{quest.title}</AppText>
            {showTime ? (
              <View style={styles.questMeta}>
                <ClockIcon />
                <AppText color={colors.textSecondary} variant="bodySmall">
                  {quest.scheduledTime ?? "Anytime"}
                </AppText>
              </View>
            ) : null}
            <QuestBreadcrumb quest={quest} />
          </View>
          <Checkbox
            accessibilityLabel="Mark quest done"
            checked={quest.isDone}
            onPress={onToggleDone}
            shape="circle"
            size={44}
          />
          <Pressable
            accessibilityLabel="Quest options"
            accessibilityRole="button"
            hitSlop={8}
            onPress={onOpenMenu}
            style={({ pressed: isPressed }) => [
              styles.questMenuButton,
              isPressed && pressed,
            ]}
          >
            <DotsIcon color={colors.textSecondary} size={18} />
          </Pressable>
        </View>
      </Card>
    </GestureDetector>
  );
}

/** Floating copy of the dragged quest that follows the finger. */
function DragGhost({
  dragX,
  dragY,
  quest,
  width,
}: {
  dragX: SharedValue<number>;
  dragY: SharedValue<number>;
  quest: QuestWithBreadcrumb;
  width: number;
}) {
  const followStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: dragX.value - width / 2 },
      { translateY: dragY.value - 36 },
    ],
  }));

  return (
    <Animated.View style={[styles.dragGhost, { width }, followStyle]}>
      <Card style={styles.dragGhostCard} variant="strong">
        <AppText numberOfLines={2} variant="button">{quest.title}</AppText>
        <QuestBreadcrumb quest={quest} />
      </Card>
    </Animated.View>
  );
}

const TIME_PATTERN = /^([01]?\d|2[0-3]):[0-5]\d$/;

/** Day-of-week + optional time picker used to (re)schedule a quest. */
function ScheduleModal({
  onClose,
  onSave,
  onUnschedule,
  quest,
  weekDays,
}: {
  onClose: () => void;
  onSave: (date: string, time: string | null) => void;
  onUnschedule: () => void;
  quest: QuestWithBreadcrumb | null;
  weekDays: WeekDay[];
}) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [time, setTime] = useState("");
  const [lastQuestId, setLastQuestId] = useState<number | null>(null);

  if (quest && quest.id !== lastQuestId) {
    setLastQuestId(quest.id);
    setSelectedDate(quest.scheduledDate);
    setTime(quest.scheduledTime ?? "");
  }

  const timeValid = time.trim() === "" || TIME_PATTERN.test(time.trim());

  return (
    <AppModal onClose={onClose} visible={quest !== null}>
      <AppText align="center" variant="titleSm">
        Schedule quest
      </AppText>
      <AppText align="center" style={styles.modalSubtitle} variant="bodySmall">
        {quest?.title}
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
        {quest?.scheduledDate ? (
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
  const [scheduled, setScheduled] = useState<QuestWithBreadcrumb[]>([]);
  const [unscheduled, setUnscheduled] = useState<QuestWithBreadcrumb[]>([]);
  const [blocks, setBlocks] = useState<TimeBlockRecord[]>([]);
  // Every section starts wrapped; a key's presence here means it is expanded.
  const [expandedBlocks, setExpandedBlocks] = useState<Set<string>>(new Set());
  const [backlogExpanded, setBacklogExpanded] = useState(false);
  const [scheduleTarget, setScheduleTarget] =
    useState<QuestWithBreadcrumb | null>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [moreVisible, setMoreVisible] = useState(false);
  const [menuQuest, setMenuQuest] = useState<QuestWithBreadcrumb | null>(null);
  const [draggingQuest, setDraggingQuest] =
    useState<QuestWithBreadcrumb | null>(null);

  const { width: windowWidth } = useWindowDimensions();
  const ghostWidth = Math.min(windowWidth - spacing.lg * 2, 360);

  // Drag plumbing shared by every quest card: finger position, drop-target
  // rects (measured at lift), and the currently hovered day cell / section
  // header. Section index blocks.length is the unscheduled backlog.
  const dragX = useSharedValue(0);
  const dragY = useSharedValue(0);
  const hoveredDay = useSharedValue(-1);
  const hoveredSection = useSharedValue(-1);
  const dayRects = useSharedValue<DropRect[]>([]);
  const sectionRects = useSharedValue<DropRect[]>([]);
  const dayCellRefs = useRef<(View | null)[]>([]);
  const sectionHeaderRefs = useRef<(View | null)[]>([]);

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
      // Undone quests stuck on past days (yesterday included) fall back into
      // the "Unscheduled this week" backlog.
      await rolloverOverdueQuests(todayKey());
      const from = toDateKey(weekStart);
      const to = toDateKey(addDays(weekStart, 6));
      const [countMap, dayQuests, backlog, blockDefs] = await Promise.all([
        getScheduledQuestCounts(from, to),
        getScheduledQuests(selectedDate),
        getUnscheduledQuests(),
        getTimeBlocks(),
      ]);
      setCounts(countMap);
      setScheduled(dayQuests);
      setUnscheduled(backlog);
      setBlocks(blockDefs);
    } catch (cause) {
      console.error("Failed to load the weekly plan", cause);
    }
  }, [selectedDate, weekStart]);

  useFocusEffect(
    useCallback(() => {
      loadBoard();
    }, [loadBoard]),
  );

  /**
   * Snapshot every drop target in window coordinates (drag just lifted):
   * the week-strip cells and the section headers.
   */
  const measureDropTargets = () => {
    const emptyRect = () => ({ height: 0, width: 0, x: -1, y: -1 });
    const cellRects: DropRect[] = Array.from({ length: 7 }, emptyRect);
    dayCellRefs.current.forEach((cell, index) => {
      cell?.measureInWindow((x, y, width, height) => {
        cellRects[index] = { height, width, x, y };
        dayRects.value = [...cellRects];
      });
    });

    const sectionCount = blocks.length + 1;
    const headerRects: DropRect[] = Array.from({ length: sectionCount }, emptyRect);
    sectionHeaderRefs.current.slice(0, sectionCount).forEach((header, index) => {
      header?.measureInWindow((x, y, width, height) => {
        headerRects[index] = { height, width, x, y };
        sectionRects.value = [...headerRects];
      });
    });
  };

  const handleDragStart = (quest: QuestWithBreadcrumb) => {
    setDraggingQuest(quest);
    measureDropTargets();
  };

  const handleDragRelease = () => {
    setDraggingQuest(null);
  };

  const handleDrop = async (
    quest: QuestWithBreadcrumb,
    dayIndex: number,
    sectionIndex: number,
  ) => {
    setDraggingQuest(null);
    try {
      // A week-strip day cell: move the quest to that day, keeping its time.
      if (dayIndex >= 0) {
        const dateKey = toDateKey(addDays(weekStart, dayIndex));
        if (quest.scheduledDate === dateKey) return;
        await updateQuest(quest.id, { scheduledDate: dateKey, isPlanned: true });
        await loadBoard();
        return;
      }
      if (sectionIndex < 0) return;

      // The backlog header: unschedule the quest.
      if (sectionIndex >= blocks.length) {
        setBacklogExpanded(true);
        if (quest.scheduledDate === null) return;
        await updateQuest(quest.id, {
          scheduledDate: null,
          scheduledTime: null,
          isPlanned: true,
        });
        await loadBoard();
        return;
      }

      // A time-block header: schedule on the selected day at the block's start.
      const block = blocks[sectionIndex];
      setExpandedBlocks((current) => new Set(current).add(block.key));
      const alreadyThere =
        quest.scheduledDate === selectedDate &&
        blockKeyForQuest(quest, blocks) === block.key;
      if (alreadyThere) return;
      await updateQuest(quest.id, {
        scheduledDate: selectedDate,
        scheduledTime: block.startTime,
        isPlanned: true,
      });
      await loadBoard();
    } catch (cause) {
      console.error("Failed to move the quest", cause);
      await loadBoard();
    }
  };

  /**
   * Long-press-to-lift pan gesture for one quest card. Tracks the finger in
   * window coordinates, hit-tests the week-strip cells, and reports the drop.
   */
  const makeDragGesture = (quest: QuestWithBreadcrumb) =>
    Gesture.Pan()
      .activateAfterLongPress(DRAG_ACTIVATION_MS)
      .maxPointers(1)
      .onStart((event) => {
        dragX.value = event.absoluteX;
        dragY.value = event.absoluteY;
        runOnJS(handleDragStart)(quest);
      })
      .onUpdate((event) => {
        dragX.value = event.absoluteX;
        dragY.value = event.absoluteY;
        const hitTest = (rects: DropRect[]) => {
          for (let index = 0; index < rects.length; index += 1) {
            const rect = rects[index];
            if (
              event.absoluteX >= rect.x &&
              event.absoluteX <= rect.x + rect.width &&
              event.absoluteY >= rect.y &&
              event.absoluteY <= rect.y + rect.height
            ) {
              return index;
            }
          }
          return -1;
        };
        const hitDay = hitTest(dayRects.value);
        hoveredDay.value = hitDay;
        hoveredSection.value = hitDay >= 0 ? -1 : hitTest(sectionRects.value);
      })
      .onEnd(() => {
        runOnJS(handleDrop)(quest, hoveredDay.value, hoveredSection.value);
      })
      .onFinalize(() => {
        hoveredDay.value = -1;
        hoveredSection.value = -1;
        runOnJS(handleDragRelease)();
      });

  // Gestures must be constructed at render time for GestureDetector. The lint
  // sees shared-value access in the worklet closures as a render-time ref
  // read, but the values are only touched on the UI thread mid-gesture.
  /* eslint-disable react-hooks/refs */
  const dragGestures = new Map<number, PanGesture>(
    [...scheduled, ...unscheduled].map((quest) => [
      quest.id,
      makeDragGesture(quest),
    ]),
  );
  /* eslint-enable react-hooks/refs */

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

  const handleToggleDone = async (quest: QuestWithBreadcrumb) => {
    // Optimistic flip in whichever list holds the quest; reload fixes drift.
    const flip = (list: QuestWithBreadcrumb[]) =>
      list.map((entry) =>
        entry.id === quest.id ? { ...entry, isDone: !entry.isDone } : entry,
      );
    setScheduled(flip);
    setUnscheduled(flip);
    try {
      await setQuestDone(quest.id, !quest.isDone);
    } catch (cause) {
      console.error("Failed to toggle the quest", cause);
      await loadBoard();
    }
  };

  const handleSchedule = async (date: string, time: string | null) => {
    if (!scheduleTarget) return;
    try {
      await updateQuest(scheduleTarget.id, {
        scheduledDate: date,
        scheduledTime: time,
        isPlanned: true,
      });
      await loadBoard();
    } catch (cause) {
      console.error("Failed to schedule the quest", cause);
    }
    setScheduleTarget(null);
  };

  const handleUnschedule = async () => {
    if (!scheduleTarget) return;
    try {
      await updateQuest(scheduleTarget.id, {
        scheduledDate: null,
        scheduledTime: null,
        isPlanned: true,
      });
      await loadBoard();
    } catch (cause) {
      console.error("Failed to unschedule the quest", cause);
    }
    setScheduleTarget(null);
  };

  // ⋮ menu: drop the quest off its day, back into the weekly backlog.
  const handleUnscheduleFromMenu = async () => {
    if (!menuQuest) return;
    setMenuQuest(null);
    try {
      await updateQuest(menuQuest.id, {
        scheduledDate: null,
        scheduledTime: null,
        isPlanned: true,
      });
      await loadBoard();
    } catch (cause) {
      console.error("Failed to unschedule the quest", cause);
    }
  };

  // ⋮ menu: take the quest off the sprint board entirely (back to its milestone).
  const handleRemoveFromWeek = async () => {
    if (!menuQuest) return;
    setMenuQuest(null);
    try {
      await updateQuest(menuQuest.id, {
        scheduledDate: null,
        scheduledTime: null,
        isPlanned: false,
      });
      await loadBoard();
    } catch (cause) {
      console.error("Failed to remove the quest from the plan", cause);
    }
  };

  const handleDeleteQuest = async () => {
    if (!menuQuest) return;
    setMenuQuest(null);
    try {
      await deleteQuest(menuQuest.id);
      await loadBoard();
    } catch (cause) {
      console.error("Failed to delete the quest", cause);
    }
  };

  const selectedHeading = new Date(
    `${selectedDate}T12:00:00`,
  ).toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    weekday: "long",
  });

  const questsByBlock = new Map<string, QuestWithBreadcrumb[]>();
  for (const quest of scheduled) {
    const key = blockKeyForQuest(quest, blocks);
    if (key === undefined) continue;
    const list = questsByBlock.get(key) ?? [];
    list.push(quest);
    questsByBlock.set(key, list);
  }

  const backlogSectionIndex = blocks.length;
  const backlogHighlightStyle = useAnimatedStyle(() => ({
    opacity: hoveredSection.value === backlogSectionIndex ? 1 : 0,
  }));

  const toggleBlock = (key: string) =>
    setExpandedBlocks((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  return (
    <View style={styles.screenWrap}>
      <ScreenScaffold
        backgroundGradient={SPRINT_BACKGROUND}
        scrollProps={{ scrollEnabled: draggingQuest === null }}
        tabClearance
        topInset
      >
        <ScreenHeader
          centerSlot={
            <AppText color={colors.primary} numberOfLines={1} variant="screenTitle">
              Weekly Plan
            </AppText>
          }
          leftAction={{
            accessibilityLabel: "More options",
            icon: <DotsIcon />,
            onPress: () => setMoreVisible(true),
          }}
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
          {weekDayCells.map((day, index) => (
            <DayCell
              cellRef={(cell) => {
                dayCellRefs.current[index] = cell;
              }}
              day={day}
              hoveredDay={hoveredDay}
              index={index}
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

        {blocks.map((block, blockIndex) => {
          const blockQuests = questsByBlock.get(block.key) ?? [];
          const expanded = expandedBlocks.has(block.key);
          return (
            <View key={block.key} style={styles.blockSection}>
              <SectionToggleHeader
                count={blockQuests.length}
                expanded={expanded}
                headerRef={(view) => {
                  sectionHeaderRefs.current[blockIndex] = view;
                }}
                hoveredSection={hoveredSection}
                icon={
                  <BlockIconArt
                    color={colors.primary}
                    icon={block.iconKey as BlockIcon}
                    size={20}
                  />
                }
                index={blockIndex}
                label={block.label}
                onToggle={() => toggleBlock(block.key)}
                time={block.startTime}
              />
              {expanded ? (
                blockQuests.length > 0 ? (
                  blockQuests.map((quest) => (
                    <QuestItemCard
                      dragGesture={dragGestures.get(quest.id)!}
                      dragging={draggingQuest?.id === quest.id}
                      key={quest.id}
                      onOpenMenu={() => setMenuQuest(quest)}
                      onOpenSchedule={() => setScheduleTarget(quest)}
                      onToggleDone={() => handleToggleDone(quest)}
                      quest={quest}
                      showTime
                    />
                  ))
                ) : (
                  <AppText
                    color={colors.textMuted}
                    style={styles.blockEmpty}
                    variant="bodySmall"
                  >
                    Nothing planned here yet.
                  </AppText>
                )
              ) : null}
            </View>
          );
        })}

        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded: backlogExpanded }}
          onPress={() => setBacklogExpanded((current) => !current)}
          ref={(view) => {
            sectionHeaderRefs.current[backlogSectionIndex] = view;
          }}
          style={({ pressed: isPressed }) => [
            styles.sectionHeader,
            isPressed && pressed,
          ]}
        >
          <AppText variant="titleSm">Unscheduled this week</AppText>
          <View style={styles.countBadge}>
            <AppText color={colors.accentViolet} variant="caption">
              {unscheduled.length}
            </AppText>
          </View>
          <View style={styles.sectionHeaderSpacer} />
          <ChevronIcon
            color={colors.textSecondary}
            direction={backlogExpanded ? "up" : "down"}
            size={18}
          />
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              styles.sectionDropTarget,
              backlogHighlightStyle,
            ]}
          />
        </Pressable>

        {backlogExpanded ? (
          <>
            {unscheduled.map((quest) => (
              <QuestItemCard
                dragGesture={dragGestures.get(quest.id)!}
                dragging={draggingQuest?.id === quest.id}
                key={quest.id}
                onOpenMenu={() => setMenuQuest(quest)}
                onOpenSchedule={() => setScheduleTarget(quest)}
                onToggleDone={() => handleToggleDone(quest)}
                quest={quest}
              />
            ))}

            {unscheduled.length === 0 ? (
              <Card style={styles.emptyCard}>
                <AppText align="center" variant="bodySmall">
                  The backlog is clear — add quests from a milestone to plan
                  your week.
                </AppText>
              </Card>
            ) : (
              <HintRow
                style={styles.hintRow}
                text="Hold a quest, then drag it onto a day or a time section to schedule it."
              />
            )}
          </>
        ) : null}

        <MoreMenuSheet
          onClose={() => setMoreVisible(false)}
          onImported={loadBoard}
          visible={moreVisible}
        />

        <AppModal
          onClose={() => setMenuQuest(null)}
          variant="sheet"
          visible={menuQuest !== null}
        >
          <AppText numberOfLines={2} variant="cardTitle">
            {menuQuest?.title}
          </AppText>
          <View style={styles.questMenu}>
            {menuQuest?.scheduledDate ? (
              <ListItem
                onPress={handleUnscheduleFromMenu}
                subtitle="Back to Unscheduled this week"
                title="Unschedule"
              />
            ) : null}
            <ListItem
              onPress={handleRemoveFromWeek}
              subtitle="Quest stays on its milestone"
              title="Remove from this week plan"
            />
            <ListItem
              last
              onPress={handleDeleteQuest}
              title="Delete"
              titleColor={colors.danger}
            />
          </View>
        </AppModal>

        <ScheduleModal
          onClose={() => setScheduleTarget(null)}
          onSave={handleSchedule}
          onUnschedule={handleUnschedule}
          quest={scheduleTarget}
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

      {draggingQuest ? (
        <DragGhost
          dragX={dragX}
          dragY={dragY}
          quest={draggingQuest}
          width={ghostWidth}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  blockEmpty: {
    marginBottom: spacing.md,
    paddingLeft: spacing.xl,
  },
  blockSection: {
    marginBottom: spacing.sm,
  },
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
  dayDropTarget: {
    borderColor: colors.accentVioletStrong,
    borderRadius: radius.md,
    borderWidth: 1.5,
    pointerEvents: "none",
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
  dragGhost: {
    left: 0,
    pointerEvents: "none",
    position: "absolute",
    top: 0,
    zIndex: 20,
  },
  dragGhostCard: {
    opacity: 0.95,
  },
  emptyCard: {
    marginBottom: spacing.md,
    paddingVertical: spacing.lg,
  },
  header: {
    marginBottom: spacing.md,
    paddingHorizontal: 0,
  },
  hintRow: {
    marginBottom: spacing.md,
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
  questCard: {
    marginBottom: spacing.md,
  },
  questCardCopy: {
    flex: 1,
    minWidth: 0,
  },
  questCardDragging: {
    opacity: 0.35,
  },
  questCardRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
  },
  questMenu: {
    marginTop: spacing.sm,
  },
  questMenuButton: {
    alignItems: "center",
    height: 44,
    justifyContent: "center",
    width: 28,
  },
  questMeta: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.xs + 2,
    marginTop: spacing.xs,
  },
  screenWrap: {
    flex: 1,
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
  sectionDropTarget: {
    borderColor: colors.accentVioletStrong,
    borderRadius: radius.md,
    borderWidth: 1.5,
    pointerEvents: "none",
  },
  sectionToggle: {
    alignItems: "center",
    borderBottomColor: colors.divider,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.md,
    paddingVertical: spacing.sm,
  },
  sectionToggleDivider: {
    backgroundColor: colors.divider,
    height: 18,
    width: 1,
  },
  sectionToggleSpacer: {
    flex: 1,
  },
  weekStrip: {
    flexDirection: "row",
    gap: spacing.sm,
  },
});
