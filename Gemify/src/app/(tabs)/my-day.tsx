import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import { StyleSheet, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle, Path, Rect } from "react-native-svg";

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
import { currentBlockKey, useDayQuestBlocks } from "@/hooks/useDayQuestBlocks";
import {
  AppButton,
  AppModal,
  AppText,
  Card,
  PlusIcon,
  ScreenHeader,
  ScreenScaffold,
} from "@/shared/components";
import { colors } from "@/theme/colors";
import { iconSizes, layout, radius, spacing } from "@/theme/theme";
import { addDays, toDateKey, todayKey } from "@/utils/dates";

const EMPTY_SPACE_SOURCE = require("../../../assets/images/empty-space.png");

/** Extra scroll clearance so content is not hidden behind the fixed footer. */
const FOOTER_CLEARANCE = 150;
const FOOTER_CLEARANCE_COMPACT = 120;

function CalendarIcon({ color = colors.primary, size = 20 }: { color?: string; size?: number }) {
  return (
    <Svg height={size} viewBox="0 0 24 24" width={size}>
      <Rect fill="none" height={15} rx={2.4} stroke={color} strokeWidth={1.6} width={18} x={3} y={5} />
      <Path
        d="M7 3v4M17 3v4M3 10h18"
        fill="none"
        stroke={color}
        strokeLinecap="round"
        strokeWidth={1.6}
      />
    </Svg>
  );
}

function GearIcon({ color = colors.primary, size = 20 }: { color?: string; size?: number }) {
  return (
    <Svg height={size} viewBox="0 0 24 24" width={size}>
      <Circle cx={12} cy={12} fill="none" r={3.1} stroke={color} strokeWidth={1.6} />
      <Path
        d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1Z"
        fill="none"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.6}
      />
    </Svg>
  );
}

/** The quest a day-plan row points at, for the action sheet and its modals. */
type DayQuestRef = { done: boolean; questId: number; title: string };

export default function MyDayScreen() {
  const insets = useSafeAreaInsets();
  const { height, width } = useWindowDimensions();
  const compact = width < layout.compactBreakpoint;
  // The copy and Add quest button overlay the artwork, so it can take most of
  // the free vertical space while everything stays visible.
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

  const { blocks, completedQuests, refresh, totalQuests, toggleQuest } =
    useDayQuestBlocks(toDateKey(selectedDate));

  const today = new Date();
  const headerTitle = isSameDay(selectedDate, today) ? "Today" : formatDayTitle(selectedDate);
  // Quests on past days are rolled over on the next load, so adding to a day
  // that has passed would silently vanish — don't offer it.
  const isPastDay = toDateKey(selectedDate) < todayKey();

  const resolvedActiveKey = activeKey ?? currentBlockKey(blocks, new Date());
  const activeBlock =
    blocks.find((block) => block.key === resolvedActiveKey) ?? blocks[0];

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
        scheduledDate: toDateKey(selectedDate),
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
            insets.bottom +
            layout.tabBarClearance +
            (compact ? FOOTER_CLEARANCE_COMPACT : FOOTER_CLEARANCE),
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
          subtitle="Focus only on what matters now."
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
            block={activeBlock}
            emptySlot={
              <View style={[styles.emptyBlock, { height: emptyImageHeight }]}>
                <Image
                  contentFit="cover"
                  source={EMPTY_SPACE_SOURCE}
                  style={StyleSheet.absoluteFill}
                />
                <LinearGradient
                  colors={["rgba(4, 7, 17, 0)", "rgba(4, 7, 17, 0.88)"]}
                  style={styles.emptyBlockShade}
                />
                <View style={styles.emptyBlockContent}>
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
                      style={styles.emptyBlockButton}
                      variant="secondary"
                    />
                  )}
                </View>
              </View>
            }
            onPressAction={(index) => {
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
              if (action) toggleQuest(action.questId, !action.done);
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
          { bottom: insets.bottom + layout.tabBarHeight },
        ]}
      >
        <TodayProgressCard
          completedActions={completedQuests}
          totalActions={totalQuests}
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
                overdue: toDateKey(selectedDate) < todayKey(),
                title: menuQuest.title,
              }
            : null
        }
        scheduleLabel="Choose another date"
      />

      {scheduleQuest ? (
        <AcceptQuestModal
          ctaLabel="RESCHEDULE QUEST"
          initialDate={suggestRescheduleDate(toDateKey(selectedDate))}
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
        <View style={styles.confirmActions}>
          <AppButton
            label="Cancel"
            onPress={() => setDeleteTarget(null)}
            style={styles.confirmButton}
            variant="secondary"
          />
          <AppButton
            label="Delete"
            onPress={handleDeleteConfirmed}
            style={[styles.confirmButton, styles.confirmDeleteButton]}
            textStyle={styles.confirmDeleteLabel}
            variant="secondary"
          />
        </View>
      </AppModal>

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
  confirmActions: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  confirmBody: {
    marginTop: spacing.sm,
  },
  confirmButton: {
    flex: 1,
    paddingHorizontal: spacing.sm,
  },
  confirmDeleteButton: {
    borderColor: colors.danger,
  },
  confirmDeleteLabel: {
    color: colors.danger,
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
  emptyBlockCard: {
    marginTop: spacing.md,
    paddingVertical: spacing.lg,
  },
  emptyBlockContent: {
    alignItems: "center",
    padding: spacing.lg,
    paddingBottom: 64,
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
