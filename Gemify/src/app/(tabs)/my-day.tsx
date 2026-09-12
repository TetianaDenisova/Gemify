import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import { StyleSheet, View } from "react-native";

import { DatePickerModal, formatDayTitle, isSameDay } from "@/components/DatePickerModal";
import { TodayProgressCard } from "@/components/home";
import {
  AcceptQuestModal,
  QuestActionSheet,
  suggestRescheduleDate,
  TextPromptModal,
} from "@/components/QuestActions";
import { QuestPickerSheet } from "@/components/QuestPickerSheet";
import { TimeBlockCard } from "@/components/TimeBlockCard";
import { TimeBlockSettingsModal } from "@/components/TimeBlockSettingsModal";
import { TimeBlockTabs } from "@/components/TimeBlockTabs";
import {
  deleteQuest,
  getSchedulableQuests,
  setQuestDone,
  updateQuest,
  type QuestWithBreadcrumb,
} from "@/db";
import { useBottomInset } from "@/hooks/useBottomInset";
import { habitIconForId, useDayHabits } from "@/hooks/useDayHabits";
import { currentBlockKey, useDayQuestBlocks } from "@/hooks/useDayQuestBlocks";
import {
  AppButton,
  ConfirmDialog,
  AppText,
  CalendarIcon,
  Card,
  GearIcon,
  PlusIcon,
  ScreenHeader,
  ScreenScaffold,
} from "@/shared/components";
import { useLayoutSize } from "@/hooks/useLayoutSize";
import { colors } from "@/theme/colors";
import {
  iconSizes,
  radius,
  spacing,
  tabBarClearanceFor,
  tabBarHeightFor,
} from "@/theme/theme";
import { addDays, toDateKey, todayKey } from "@/utils/dates";

const EMPTY_SPACE_SOURCE = require("../../../assets/images/empty-space.png");

/** Extra scroll clearance so content is not hidden behind the fixed footer. */
const FOOTER_CLEARANCE = 150;
const FOOTER_CLEARANCE_COMPACT = 120;
/** The phone footer card is shorter (64 pt art, tighter bar). */
const FOOTER_CLEARANCE_PHONE = 96;

/** The quest a day-plan row points at, for the action sheet and its modals. */
type DayQuestRef = { done: boolean; questId: number; title: string };

export default function MyDayScreen() {
  const bottomInset = useBottomInset();
  const { compact, height, phone } = useLayoutSize();
  const tabBarHeight = tabBarHeightFor(phone);
  // The copy and Add quest button overlay the artwork, so it can take most of
  // the free vertical space while everything stays visible.
  // 874 * 0.5 = 437 pt of empty art on a 402 pt-wide screen. Phones skip the
  // artwork entirely — the card sizes itself to the copy instead.
  const emptyImageHeight = Math.min(560, Math.max(300, Math.round(height * 0.5)));

  // No explicit selection yet → the block matching the clock right now.
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [blockSettingsOpen, setBlockSettingsOpen] = useState(false);
  const [questPickerOpen, setQuestPickerOpen] = useState(false);
  const [pickerQuests, setPickerQuests] = useState<QuestWithBreadcrumb[]>([]);
  const [menuQuest, setMenuQuest] = useState<DayQuestRef | null>(null);
  const [scheduleQuest, setScheduleQuest] = useState<DayQuestRef | null>(null);
  const [editQuest, setEditQuest] = useState<DayQuestRef | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DayQuestRef | null>(null);

  const dateKey = toDateKey(selectedDate);
  const { blocks, refresh, toggleQuest } = useDayQuestBlocks(dateKey);
  const { habits: dayHabits, setDone: setHabitDone } = useDayHabits(dateKey);

  const today = new Date();
  const headerTitle = isSameDay(selectedDate, today) ? "Today" : formatDayTitle(selectedDate);
  // Quests on past days are rolled over on the next load, so adding to a day
  // that has passed would silently vanish — don't offer it.
  const isPastDay = dateKey < todayKey();

  const resolvedActiveKey = activeKey ?? currentBlockKey(blocks, new Date());
  const activeBlock =
    blocks.find((block) => block.key === resolvedActiveKey) ?? blocks[0];

  // The open block's habits: its own, plus the "Anytime" ones (no block, or
  // the flexible block) that fit any moment — the same rule Home focuses by.
  const flexibleKey = blocks.find((block) => block.time === "Flexible")?.key;
  const blockHabits = activeBlock
    ? dayHabits.filter(
        (view) =>
          view.blockKey === activeBlock.key ||
          view.blockKey === null ||
          view.blockKey === flexibleKey,
      )
    : [];
  // Habit rows follow the block's quests, so a row index past the quests is a
  // habit — that keeps TimeBlockCard's index-based callbacks working.
  const questCount = activeBlock?.actions.length ?? 0;
  const blockActions = activeBlock
    ? [
        ...activeBlock.actions,
        ...blockHabits.map((view) => ({
          done: view.done,
          icon: habitIconForId(view.habit.id),
          subtitle: "Daily habit",
          title: view.habit.title,
        })),
      ]
    : [];
  const completedActions = blockActions.filter((action) => action.done).length;

  const openQuestPicker = async () => {
    try {
      setPickerQuests(await getSchedulableQuests());
    } catch (cause) {
      console.error("Failed to load quests", cause);
      setPickerQuests([]);
    }
    setQuestPickerOpen(true);
  };

  // "Add" schedules the quest into the visible block on the selected day; the
  // row leaves the picker so several quests can be added in a row.
  const handleAddQuestToBlock = async (quest: QuestWithBreadcrumb) => {
    if (!activeBlock) return;
    try {
      await updateQuest(quest.id, {
        scheduledDate: dateKey,
        scheduledTime:
          activeBlock.time === "Flexible" ? null : activeBlock.time,
        isPlanned: true,
      });
      setPickerQuests((current) =>
        current.filter((entry) => entry.id !== quest.id),
      );
      await refresh();
    } catch (cause) {
      console.error("Failed to add the quest", cause);
    }
  };

  const handleMenuCompleteNow = async () => {
    if (!menuQuest) return;
    setMenuQuest(null);
    try {
      await setQuestDone(menuQuest.questId, true);
      await refresh();
    } catch (cause) {
      console.error("Failed to complete the quest", cause);
    }
  };

  const handleScheduleQuest = async (date: string, time: string | null) => {
    if (!scheduleQuest) return;
    setScheduleQuest(null);
    try {
      await updateQuest(scheduleQuest.questId, {
        scheduledDate: date,
        scheduledTime: time,
        isPlanned: true,
      });
      await refresh();
    } catch (cause) {
      console.error("Failed to schedule the quest", cause);
    }
  };

  // ⋮ menu quick moves: send the quest straight to a given day, keeping its time.
  const handleMenuMoveTo = async (dateKey: string) => {
    if (!menuQuest) return;
    setMenuQuest(null);
    try {
      await updateQuest(menuQuest.questId, {
        scheduledDate: dateKey,
        isPlanned: true,
      });
      await refresh();
    } catch (cause) {
      console.error("Failed to move the quest", cause);
    }
  };

  // Takes the quest off the day and back to the not-accepted pool, so it
  // shows up again in the "Add quests" picker.
  const handleMenuUnschedule = async () => {
    if (!menuQuest) return;
    setMenuQuest(null);
    try {
      await updateQuest(menuQuest.questId, {
        scheduledDate: null,
        scheduledTime: null,
        isPlanned: false,
      });
      await refresh();
    } catch (cause) {
      console.error("Failed to unschedule the quest", cause);
    }
  };

  const handleEditSubmit = async (value: string) => {
    if (!editQuest) return;
    setEditQuest(null);
    try {
      await updateQuest(editQuest.questId, { title: value });
      await refresh();
    } catch (cause) {
      console.error("Failed to rename the quest", cause);
    }
  };

  const handleDeleteConfirmed = async () => {
    if (!deleteTarget) return;
    setDeleteTarget(null);
    try {
      await deleteQuest(deleteTarget.questId);
      await refresh();
    } catch (cause) {
      console.error("Failed to delete the quest", cause);
    }
  };

  return (
    <View style={styles.screen}>
      <ScreenScaffold
        contentStyle={{
          paddingBottom:
            bottomInset +
            tabBarClearanceFor(tabBarHeight) +
            (phone
              ? FOOTER_CLEARANCE_PHONE
              : compact
                ? FOOTER_CLEARANCE_COMPACT
                : FOOTER_CLEARANCE),
        }}
        tabClearance
        topInset
      >
        <ScreenHeader
          leftAction={{
            accessibilityLabel: "Open calendar",
            icon: <CalendarIcon size={compact ? 20 : 24} />,
            onPress: () => setCalendarOpen(true),
          }}
          rightAction={{
            accessibilityLabel: "Configure time blocks",
            icon: <GearIcon size={compact ? 20 : 24} />,
            onPress: () => setBlockSettingsOpen(true),
          }}
          style={styles.header}
          // A tagline costs a whole line under the title on every visit.
          subtitle={phone ? undefined : "Focus only on what matters now."}
          title={headerTitle}
        />

        <TimeBlockTabs
          activeKey={activeBlock?.key ?? ""}
          blocks={blocks}
          onSelect={setActiveKey}
          style={compact ? styles.tabsCompact : styles.tabs}
        />

        {activeBlock ? (
          <TimeBlockCard
            block={{ ...activeBlock, actions: blockActions }}
            emptySlot={
              <View
                style={[
                  styles.emptyBlock,
                  phone
                    ? styles.emptyBlockPlain
                    : { height: emptyImageHeight },
                ]}
              >
                {phone ? null : (
                  <>
                    <Image
                      contentFit="cover"
                      source={EMPTY_SPACE_SOURCE}
                      style={StyleSheet.absoluteFill}
                    />
                    <LinearGradient
                      colors={["rgba(4, 7, 17, 0)", "rgba(4, 7, 17, 0.88)"]}
                      style={styles.emptyBlockShade}
                    />
                  </>
                )}
                <View
                  style={[
                    styles.emptyBlockContent,
                    phone && styles.emptyBlockContentPhone,
                  ]}
                >
                  <AppText align="center" variant="titleSm">
                    {isPastDay
                      ? "Nothing was scheduled"
                      : "Nothing scheduled yet"}
                  </AppText>
                  <AppText
                    align="center"
                    color={colors.textSecondary}
                    style={styles.emptyBlockCopy}
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
                      style={[
                        styles.emptyBlockButton,
                        phone && styles.buttonPhone,
                      ]}
                      variant="secondary"
                    />
                  )}
                </View>
              </View>
            }
            onPressAction={(index) => {
              // Habit rows have no quest menu (reschedule, unschedule, delete).
              const action = activeBlock.actions[index];
              if (action) {
                setMenuQuest({
                  done: action.done,
                  questId: action.questId,
                  title: action.title,
                });
              }
            }}
            onToggleAction={(index) => {
              const action = activeBlock.actions[index];
              if (action) {
                toggleQuest(action.questId, !action.done);
                return;
              }
              const habit = blockHabits[index - questCount];
              if (habit) setHabitDone(habit.habit.id, !habit.done);
            }}
            separated
            showIntro={false}
            style={compact ? styles.blockSectionCompact : styles.blockSection}
          />
        ) : (
          <Card style={styles.emptyBlockCard}>
            <AppText align="center" variant="bodySmall">
              No quests scheduled for this block. Plan your week in the Sprint
              tab and they will show up here.
            </AppText>
          </Card>
        )}
      </ScreenScaffold>

      <View
        style={[
          styles.progressFooter,
          // Flush against the flat tab bar, spanning the full screen width.
          { bottom: bottomInset + tabBarHeight },
        ]}
      >
        <TodayProgressCard
          completedActions={completedActions}
          label={activeBlock ? `${activeBlock.label} progress` : "Today's progress"}
          totalActions={blockActions.length}
        />
      </View>

      {blockSettingsOpen ? (
        <TimeBlockSettingsModal
          onChanged={refresh}
          onClose={() => setBlockSettingsOpen(false)}
          visible={blockSettingsOpen}
        />
      ) : null}

      {activeBlock ? (
        <QuestPickerSheet
          onAdd={handleAddQuestToBlock}
          onClose={() => setQuestPickerOpen(false)}
          quests={pickerQuests}
          subtitle="Pick quests you want to add to this time block."
          targetLabel={activeBlock.label}
          time={activeBlock.time !== "Flexible" ? activeBlock.time : null}
          visible={questPickerOpen}
        />
      ) : null}

      <QuestActionSheet
        onClose={() => setMenuQuest(null)}
        onCompleteNow={handleMenuCompleteNow}
        onDoToday={() => handleMenuMoveTo(todayKey())}
        onMoveToTomorrow={() => handleMenuMoveTo(toDateKey(addDays(new Date(), 1)))}
        onSchedule={() => {
          setScheduleQuest(menuQuest);
          setMenuQuest(null);
        }}
        onUnschedule={handleMenuUnschedule}
        onDelete={() => {
          setDeleteTarget(menuQuest);
          setMenuQuest(null);
        }}
        onEdit={() => {
          setEditQuest(menuQuest);
          setMenuQuest(null);
        }}
        quest={
          menuQuest
            ? {
                isDone: menuQuest.done,
                overdue: dateKey < todayKey(),
                title: menuQuest.title,
              }
            : null
        }
        scheduleLabel="Choose another date"
      />

      {scheduleQuest ? (
        <AcceptQuestModal
          ctaLabel="RESCHEDULE QUEST"
          initialDate={suggestRescheduleDate(dateKey)}
          key={scheduleQuest.questId}
          onAccept={handleScheduleQuest}
          onClose={() => setScheduleQuest(null)}
          title="Reschedule quest"
        />
      ) : null}

      <TextPromptModal
        initialValue={editQuest?.title ?? ""}
        onClose={() => setEditQuest(null)}
        onSubmit={handleEditSubmit}
        placeholder="Quest title..."
        submitLabel="Save"
        title="Edit quest"
        visible={editQuest !== null}
      />

      <ConfirmDialog
        body={`“${deleteTarget?.title}” will be removed.`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirmed}
        title="Delete this quest?"
        visible={deleteTarget !== null}
      />

      {calendarOpen ? (
        <DatePickerModal
          initialDate={selectedDate}
          onClose={() => setCalendarOpen(false)}
          onSelect={(date) => {
            setSelectedDate(date);
            setCalendarOpen(false);
          }}
          today={today}
          visible={calendarOpen}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  blockSection: {
    marginTop: spacing.lg,
  },
  blockSectionCompact: {
    marginTop: spacing.md,
  },
  emptyBlock: {
    borderRadius: radius.lg,
    justifyContent: "flex-end",
    marginTop: spacing.md,
    overflow: "hidden",
  },
  emptyBlockButton: {
    marginTop: spacing.lg,
    minWidth: 220,
  },
  /** 220 pt does not fit beside anything on a 370 pt row. */
  buttonPhone: {
    flexShrink: 1,
    minWidth: 0,
  },
  emptyBlockCard: {
    marginTop: spacing.md,
    paddingVertical: spacing.lg,
  },
  emptyBlockContent: {
    alignItems: "center",
    padding: spacing.lg,
    paddingBottom: 64,
  },
  /** No artwork to sit above, so the copy keeps even padding. */
  emptyBlockContentPhone: {
    paddingVertical: spacing.xl,
  },
  /** The phone empty state is a plain card — no photo behind the copy. */
  emptyBlockPlain: {
    backgroundColor: colors.surfaceCard,
    borderColor: colors.borderSoft,
    borderWidth: 1,
    justifyContent: "center",
  },
  emptyBlockCopy: {
    marginTop: spacing.sm,
  },
  emptyBlockShade: {
    bottom: 0,
    height: "60%",
    left: 0,
    position: "absolute",
    right: 0,
  },
  header: {
    paddingHorizontal: 0,
  },
  progressFooter: {
    left: 0,
    position: "absolute",
    right: 0,
  },
  screen: {
    flex: 1,
  },
  tabs: {
    marginTop: 36,
  },
  tabsCompact: {
    marginTop: spacing.lg,
  },
});
