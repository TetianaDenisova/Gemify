import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
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
  useSharedValue,
  type SharedValue,
} from "react-native-reanimated";
import Svg, { Circle, Path, Rect } from "react-native-svg";

import { DatePickerModal } from "@/components/DatePickerModal";
import { MoreMenuSheet } from "@/components/MoreMenuSheet";
import {
  AcceptQuestModal,
  QuestActionSheet,
  suggestRescheduleDate,
  TextPromptModal,
} from "@/components/QuestActions";
import { QuestPickerSheet } from "@/components/QuestPickerSheet";
import { ActionIconArt } from "@/components/TimeBlockCard";
import { WeekAscentCard } from "@/components/WeekAscentCard";
import {
  deleteQuest,
  getSchedulableQuests,
  getScheduledQuestCounts,
  getScheduledQuests,
  getWeekAscent,
  rolloverOverdueQuests,
  setQuestDone,
  updateQuest,
  type QuestWithBreadcrumb,
  type WeekAscentEntry,
} from "@/db";
import { questIconForId } from "@/hooks/useDayQuestBlocks";
import {
  AppButton,
  AppModal,
  AppText,
  Card,
  Checkbox,
  ChevronIcon,
  DotsIcon,
  DreamIcon,
  IconButton,
  MilestoneIcon,
  PlusIcon,
  ScreenHeader,
  ScreenScaffold,
} from "@/shared/components";
import { colors } from "@/theme/colors";
import { iconSizes, pressed, radius, spacing } from "@/theme/theme";
import { addDays, startOfWeek, toDateKey, todayKey } from "@/utils/dates";

/** Bespoke night-sky gradient behind the sprint board. */
const SPRINT_BACKGROUND = ["#02050D", "#060716", "#080617", "#030712"] as const;

const EMPTY_SPACE_SOURCE = require("../../../assets/images/empty-space.png");

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
        variant="subtitle"
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
 * A weekly-plan quest item styled like a My Day row: dream-magic icon ·
 * title with a gold time label and the dream › milestone breadcrumb · circle
 * done-toggle. Tapping the row body opens the quest options sheet.
 *
 * Long-pressing anywhere on the card lifts it into a drag; dropping it on a
 * week-strip day cell schedules the quest for that day.
 */
function QuestItemCard({
  dragGesture,
  dragging,
  onOpenMenu,
  onToggleDone,
  quest,
  showTime = false,
}: {
  dragGesture: PanGesture;
  dragging: boolean;
  onOpenMenu: () => void;
  onToggleDone: () => void;
  quest: QuestWithBreadcrumb;
  showTime?: boolean;
}) {
  return (
    <GestureDetector gesture={dragGesture}>
      <Card style={[styles.questCard, dragging && styles.questCardDragging]}>
        <View style={styles.questCardRow}>
          <Pressable
            accessibilityLabel={`Options for the quest ${quest.title}`}
            accessibilityRole="button"
            onPress={onOpenMenu}
            style={({ pressed: isPressed }) => [
              styles.questCardBody,
              isPressed && pressed,
            ]}
          >
            <View style={styles.questIcon}>
              <ActionIconArt icon={questIconForId(quest.id)} size={36} />
            </View>
            <View style={styles.questCardCopy}>
              <AppText numberOfLines={2} variant="pill">{quest.title}</AppText>
              <QuestBreadcrumb quest={quest} />
            </View>
          </Pressable>
          {showTime ? (
            <View style={styles.questMeta}>
              <ClockIcon color={colors.primary} size={18} />
              <AppText color={colors.primary} variant="labelStrong">
                {quest.scheduledTime ?? "Anytime"}
              </AppText>
            </View>
          ) : null}
          <Checkbox
            accessibilityLabel="Mark quest done"
            checked={quest.isDone}
            onPress={onToggleDone}
            shape="circle"
            size={38}
          />
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

export default function SprintScreen() {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [selectedDate, setSelectedDate] = useState(todayKey);
  const [counts, setCounts] = useState<Map<string, number>>(new Map());
  const [ascent, setAscent] = useState<WeekAscentEntry[]>([]);
  const [ascentOpen, setAscentOpen] = useState(false);
  const [scheduled, setScheduled] = useState<QuestWithBreadcrumb[]>([]);
  const [scheduleTarget, setScheduleTarget] =
    useState<QuestWithBreadcrumb | null>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [moreVisible, setMoreVisible] = useState(false);
  const [menuQuest, setMenuQuest] = useState<QuestWithBreadcrumb | null>(null);
  const [editTarget, setEditTarget] = useState<QuestWithBreadcrumb | null>(
    null,
  );
  const [deleteTarget, setDeleteTarget] = useState<QuestWithBreadcrumb | null>(
    null,
  );
  const [draggingQuest, setDraggingQuest] =
    useState<QuestWithBreadcrumb | null>(null);
  const [questPickerOpen, setQuestPickerOpen] = useState(false);
  const [pickerQuests, setPickerQuests] = useState<QuestWithBreadcrumb[]>([]);
  const [addTarget, setAddTarget] = useState<QuestWithBreadcrumb | null>(null);

  const { height: windowHeight, width: windowWidth } = useWindowDimensions();
  const ghostWidth = Math.min(windowWidth - spacing.lg * 2, 360);
  // The copy and Add quest button overlay the artwork; the week strip and day
  // heading sit above it, so it takes a bit less height than on My Day.
  const emptyImageHeight = Math.min(480, Math.max(280, Math.round(windowHeight * 0.42)));

  // Drag plumbing shared by every quest card: finger position, week-strip
  // cell rects (measured at lift), and the currently hovered day cell.
  const dragX = useSharedValue(0);
  const dragY = useSharedValue(0);
  const hoveredDay = useSharedValue(-1);
  const dayRects = useSharedValue<DropRect[]>([]);
  const dayCellRefs = useRef<(View | null)[]>([]);

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
      // Undone quests stuck on past days (yesterday included) lose their date
      // so they can be rescheduled from their milestone.
      await rolloverOverdueQuests(todayKey());
      const from = toDateKey(weekStart);
      const to = toDateKey(addDays(weekStart, 6));
      const [countMap, dayQuests, weekAscent] = await Promise.all([
        getScheduledQuestCounts(from, to),
        getScheduledQuests(selectedDate),
        getWeekAscent(from, to),
      ]);
      setCounts(countMap);
      setScheduled(dayQuests);
      setAscent(weekAscent);
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
   * Snapshot the week-strip cells in window coordinates (drag just lifted).
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
  };

  const handleDragStart = (quest: QuestWithBreadcrumb) => {
    setDraggingQuest(quest);
    measureDropTargets();
  };

  const handleDragRelease = () => {
    setDraggingQuest(null);
  };

  const handleDrop = async (quest: QuestWithBreadcrumb, dayIndex: number) => {
    setDraggingQuest(null);
    try {
      // A week-strip day cell: move the quest to that day, keeping its time.
      if (dayIndex < 0) return;
      const dateKey = toDateKey(addDays(weekStart, dayIndex));
      if (quest.scheduledDate === dateKey) return;
      await updateQuest(quest.id, { scheduledDate: dateKey, isPlanned: true });
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
        hoveredDay.value = hitTest(dayRects.value);
      })
      .onEnd(() => {
        runOnJS(handleDrop)(quest, hoveredDay.value);
      })
      .onFinalize(() => {
        hoveredDay.value = -1;
        runOnJS(handleDragRelease)();
      });

  // Gestures must be constructed at render time for GestureDetector. The lint
  // sees shared-value access in the worklet closures as a render-time ref
  // read, but the values are only touched on the UI thread mid-gesture.
  /* eslint-disable react-hooks/refs */
  const dragGestures = new Map<number, PanGesture>(
    scheduled.map((quest) => [quest.id, makeDragGesture(quest)]),
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

  const openQuestPicker = async () => {
    try {
      setPickerQuests(await getSchedulableQuests());
    } catch (cause) {
      console.error("Failed to load quests", cause);
      setPickerQuests([]);
    }
    setQuestPickerOpen(true);
  };

  // "Add" in the picker hands the quest to the accept modal, pre-filled with
  // the picked day and "Anytime". Modals can't stack, so the picker closes
  // while the accept modal is up (and comes back on cancel).
  const handlePickQuest = (quest: QuestWithBreadcrumb) => {
    setQuestPickerOpen(false);
    setAddTarget(quest);
  };

  const handleAddQuestAccept = async (date: string, time: string | null) => {
    if (!addTarget) return;
    const quest = addTarget;
    setAddTarget(null);
    try {
      await updateQuest(quest.id, {
        scheduledDate: date,
        scheduledTime: time,
        isPlanned: true,
      });
      setPickerQuests((current) =>
        current.filter((entry) => entry.id !== quest.id),
      );
      // Jump the board to the day the quest landed on, so it's visible.
      setWeekStart(startOfWeek(new Date(`${date}T12:00:00`)));
      setSelectedDate(date);
      await loadBoard();
    } catch (cause) {
      console.error("Failed to add the quest", cause);
    }
  };

  const handleToggleDone = async (quest: QuestWithBreadcrumb) => {
    // Optimistic flip; reload fixes drift.
    setScheduled((list) =>
      list.map((entry) =>
        entry.id === quest.id ? { ...entry, isDone: !entry.isDone } : entry,
      ),
    );
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

  const handleMenuCompleteNow = async () => {
    if (!menuQuest) return;
    setMenuQuest(null);
    try {
      await setQuestDone(menuQuest.id, true);
      await loadBoard();
    } catch (cause) {
      console.error("Failed to complete the quest", cause);
    }
  };

  // ⋮ menu quick moves: send the quest straight to a given day, keeping its time.
  const handleMenuMoveTo = async (dateKey: string) => {
    if (!menuQuest) return;
    setMenuQuest(null);
    try {
      await updateQuest(menuQuest.id, {
        scheduledDate: dateKey,
        isPlanned: true,
      });
      await loadBoard();
    } catch (cause) {
      console.error("Failed to move the quest", cause);
    }
  };

  const handleEditSubmit = async (value: string) => {
    if (!editTarget) return;
    setEditTarget(null);
    try {
      await updateQuest(editTarget.id, { title: value });
      await loadBoard();
    } catch (cause) {
      console.error("Failed to rename the quest", cause);
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

  const handleDeleteConfirmed = async () => {
    if (!deleteTarget) return;
    setDeleteTarget(null);
    try {
      await deleteQuest(deleteTarget.id);
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

  // Quests scheduled on past days are rolled over on the next load, so
  // adding to a day that has passed would silently vanish — don't offer it.
  const isPastDay = selectedDate < todayKey();

  return (
    <View style={styles.screenWrap}>
      <ScreenScaffold
        backgroundGradient={SPRINT_BACKGROUND}
        footer={
          ascent.length > 0 ? (
            <WeekAscentCard
              entries={ascent}
              expanded={ascentOpen}
              onToggle={() => setAscentOpen((open) => !open)}
            />
          ) : undefined
        }
        footerFullBleed
        footerScrim={{
          onPress: () => setAscentOpen(false),
          visible: ascentOpen && ascent.length > 0,
        }}
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

        {scheduled.length > 0 ? (
          <>
            {scheduled.map((quest) => (
              <QuestItemCard
                dragGesture={dragGestures.get(quest.id)!}
                dragging={draggingQuest?.id === quest.id}
                key={quest.id}
                onOpenMenu={() => setMenuQuest(quest)}
                onToggleDone={() => handleToggleDone(quest)}
                quest={quest}
                showTime
              />
            ))}
            {isPastDay ? null : (
              <AppButton
                icon={<PlusIcon color={colors.primary} size={iconSizes.md} />}
                iconPosition="before"
                label="Add quest"
                onPress={openQuestPicker}
                style={styles.addMoreButton}
                variant="secondary"
              />
            )}
          </>
        ) : (
          <View style={[styles.emptyDay, { height: emptyImageHeight }]}>
            <Image
              contentFit="cover"
              source={EMPTY_SPACE_SOURCE}
              style={StyleSheet.absoluteFill}
            />
            <LinearGradient
              colors={["rgba(4, 7, 17, 0)", "rgba(4, 7, 17, 0.88)"]}
              style={styles.emptyDayShade}
            />
            <View style={styles.emptyDayContent}>
              <AppText align="center" variant="titleSm">
                {isPastDay ? "Nothing was scheduled" : "Nothing scheduled yet"}
              </AppText>
              <AppText
                align="center"
                color={colors.textSecondary}
                style={styles.emptyDayCopy}
                variant="bodySmall"
              >
                {isPastDay
                  ? "This day has passed — plan from today onward."
                  : "Add a quest to make progress."}
              </AppText>
              {isPastDay ? null : (
                <AppButton
                  icon={<PlusIcon color={colors.primary} size={iconSizes.md} />}
                  iconPosition="before"
                  label="Add quest"
                  onPress={openQuestPicker}
                  style={styles.emptyDayButton}
                  variant="secondary"
                />
              )}
            </View>
          </View>
        )}

        <MoreMenuSheet
          onClose={() => setMoreVisible(false)}
          onImported={loadBoard}
          visible={moreVisible}
        />

        <QuestActionSheet
          onClose={() => setMenuQuest(null)}
          onCompleteNow={handleMenuCompleteNow}
          onDoToday={() => handleMenuMoveTo(todayKey())}
          onMoveToTomorrow={() => handleMenuMoveTo(toDateKey(addDays(new Date(), 1)))}
          onSchedule={() => {
            setScheduleTarget(menuQuest);
            setMenuQuest(null);
          }}
          onUnschedule={handleRemoveFromWeek}
          onDelete={() => {
            setDeleteTarget(menuQuest);
            setMenuQuest(null);
          }}
          onEdit={() => {
            setEditTarget(menuQuest);
            setMenuQuest(null);
          }}
          quest={
            menuQuest
              ? {
                  isDone: menuQuest.isDone,
                  overdue: Boolean(
                    menuQuest.scheduledDate &&
                      menuQuest.scheduledDate < todayKey(),
                  ),
                  title: menuQuest.title,
                }
              : null
          }
          scheduleLabel="Choose another date"
        />

        <AppModal
          onClose={() => setDeleteTarget(null)}
          visible={deleteTarget !== null}
        >
          <AppText align="center" variant="titleSm">
            Delete this quest?
          </AppText>
          <AppText align="center" style={styles.confirmBody} variant="bodySerif">
            “{deleteTarget?.title}” will be removed.
          </AppText>
          <View style={styles.modalActions}>
            <AppButton
              label="Cancel"
              onPress={() => setDeleteTarget(null)}
              style={styles.modalButton}
              variant="secondary"
            />
            <AppButton
              label="Delete"
              onPress={handleDeleteConfirmed}
              style={[styles.modalButton, styles.confirmDeleteButton]}
              textStyle={styles.confirmDeleteLabel}
              variant="secondary"
            />
          </View>
        </AppModal>

        {scheduleTarget ? (
          <AcceptQuestModal
            ctaLabel="RESCHEDULE QUEST"
            initialDate={suggestRescheduleDate(scheduleTarget.scheduledDate)}
            key={scheduleTarget.id}
            onAccept={handleSchedule}
            onClose={() => setScheduleTarget(null)}
            title="Reschedule quest"
          />
        ) : null}

        <QuestPickerSheet
          onAdd={handlePickQuest}
          onClose={() => setQuestPickerOpen(false)}
          quests={pickerQuests}
          subtitle="Pick quests you want to add to this day."
          targetLabel={selectedHeading}
          visible={questPickerOpen}
        />

        {addTarget ? (
          <AcceptQuestModal
            initialDate={new Date(`${selectedDate}T12:00:00`)}
            initialSlot="anytime"
            key={addTarget.id}
            onAccept={handleAddQuestAccept}
            onClose={() => {
              setAddTarget(null);
              setQuestPickerOpen(true);
            }}
          />
        ) : null}

        <TextPromptModal
          initialValue={editTarget?.title ?? ""}
          onClose={() => setEditTarget(null)}
          onSubmit={handleEditSubmit}
          placeholder="Quest title..."
          submitLabel="Save"
          title="Edit quest"
          visible={editTarget !== null}
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
  addMoreButton: {
    alignSelf: "center",
    marginBottom: spacing.md,
    marginTop: spacing.xs,
    minWidth: 220,
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
  confirmBody: {
    marginTop: spacing.sm,
  },
  confirmDeleteButton: {
    borderColor: colors.danger,
  },
  confirmDeleteLabel: {
    color: colors.danger,
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
  emptyDay: {
    borderRadius: radius.lg,
    justifyContent: "flex-end",
    marginBottom: spacing.md,
    overflow: "hidden",
  },
  emptyDayButton: {
    marginTop: spacing.lg,
    minWidth: 220,
  },
  emptyDayContent: {
    alignItems: "center",
    padding: spacing.lg,
    paddingBottom: spacing.lg,
  },
  emptyDayCopy: {
    marginTop: spacing.sm,
  },
  emptyDayShade: {
    bottom: 0,
    height: "60%",
    left: 0,
    position: "absolute",
    right: 0,
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
  questCard: {
    borderColor: colors.accentVioletGlow,
    marginBottom: spacing.md,
  },
  questCardBody: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: spacing.lg,
    minWidth: 0,
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
  questIcon: {
    alignItems: "center",
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  questMeta: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.xs + 2,
  },
  screenWrap: {
    flex: 1,
  },
  weekStrip: {
    flexDirection: "row",
    gap: spacing.sm,
  },
});
