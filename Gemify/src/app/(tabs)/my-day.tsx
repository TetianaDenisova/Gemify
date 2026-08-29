import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle, Path, Rect } from "react-native-svg";

import { DatePickerModal, formatDayTitle, isSameDay } from "@/components/DatePickerModal";
import { TodayProgressCard } from "@/components/home";
import {
  AcceptQuestModal,
  QuestActionSheet,
  TextPromptModal,
} from "@/components/QuestActions";
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
import {
  currentBlockKey,
  useDayQuestBlocks,
  type QuestBlockView,
} from "@/hooks/useDayQuestBlocks";
import {
  AppButton,
  AppModal,
  AppText,
  Card,
  ChevronIcon,
  CloseIcon,
  DreamIcon,
  MilestoneIcon,
  PlusIcon,
  ScreenHeader,
  ScreenScaffold,
  SparkIcon
} from "@/shared/components";
import { colors } from "@/theme/colors";
import {
  iconSizes,
  layout,
  pressed,
  radius,
  shadowStyle,
  spacing,
} from "@/theme/theme";
import { toDateKey } from "@/utils/dates";

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

type QuestGroup = {
  dreamTitle: string;
  milestones: { milestoneTitle: string; quests: QuestWithBreadcrumb[] }[];
};

/** Dream → milestone → quests, in the order the repository returns them. */
function groupQuests(quests: QuestWithBreadcrumb[]): QuestGroup[] {
  const groups: QuestGroup[] = [];
  for (const quest of quests) {
    let group = groups.find((entry) => entry.dreamTitle === quest.dreamTitle);
    if (!group) {
      group = { dreamTitle: quest.dreamTitle, milestones: [] };
      groups.push(group);
    }
    let milestone = group.milestones.find(
      (entry) => entry.milestoneTitle === quest.milestoneTitle,
    );
    if (!milestone) {
      milestone = { milestoneTitle: quest.milestoneTitle, quests: [] };
      group.milestones.push(milestone);
    }
    milestone.quests.push(quest);
  }
  return groups;
}

/**
 * "Add quests" sheet: every quest not yet accepted, grouped by dream with the
 * milestone as a sub-header. "ADD" accepts the quest straight into the given
 * time block.
 */
function QuestPickerModal({
  block,
  onAdd,
  onClose,
  quests,
  visible,
}: {
  block: QuestBlockView;
  onAdd: (quest: QuestWithBreadcrumb) => void;
  onClose: () => void;
  quests: QuestWithBreadcrumb[];
  visible: boolean;
}) {
  const [collapsedDreams, setCollapsedDreams] = useState<Set<string>>(
    () => new Set(),
  );
  const groups = groupQuests(quests);

  const toggleDream = (dreamTitle: string) => {
    setCollapsedDreams((current) => {
      const next = new Set(current);
      if (next.has(dreamTitle)) next.delete(dreamTitle);
      else next.add(dreamTitle);
      return next;
    });
  };

  return (
    <AppModal maxWidth={720} onClose={onClose} variant="sheet" visible={visible}>
      <Pressable
        accessibilityLabel="Close"
        accessibilityRole="button"
        hitSlop={8}
        onPress={onClose}
        style={({ pressed: isPressed }) => [
          styles.pickerClose,
          isPressed && pressed,
        ]}
      >
        <CloseIcon color={colors.textSecondary} size={iconSizes.sm} />
      </Pressable>

      <AppText align="center" variant="titleSm">
        Add to{" "}
        <AppText color={colors.accentViolet} variant="titleSm">
          {block.label}
        </AppText>
      </AppText>
      {block.time !== "Flexible" ? (
        <View style={styles.pickerTimeRow}>
          <SparkIcon color={colors.primary} size={iconSizes.sm} />
          <AppText color={colors.primary} variant="titleSm">
            {block.time}
          </AppText>
          <SparkIcon color={colors.primary} size={iconSizes.sm} />
        </View>
      ) : null}
      <AppText
        align="center"
        color={colors.textSecondary}
        style={styles.pickerSubtitle}
        variant="bodySmall"
      >
        Pick quests you want to add to this time block.
      </AppText>

      {groups.length > 0 ? (
        <ScrollView style={styles.pickerList}>
          {groups.map((group) => {
            const collapsed = collapsedDreams.has(group.dreamTitle);
            return (
              <View key={group.dreamTitle} style={styles.pickerGroup}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ expanded: !collapsed }}
                  onPress={() => toggleDream(group.dreamTitle)}
                  style={({ pressed: isPressed }) => [
                    styles.pickerGroupHeader,
                    isPressed && pressed,
                  ]}
                >
                  <View style={styles.pickerGroupIcon}>
                    <DreamIcon color={colors.primary} size={26} />
                  </View>
                  <AppText
                    color={colors.primary}
                    numberOfLines={1}
                    style={styles.pickerGroupTitle}
                    variant="cardTitle"
                  >
                    {group.dreamTitle}
                  </AppText>
                  <ChevronIcon
                    color={colors.accentViolet}
                    direction={collapsed ? "down" : "up"}
                    size={20}
                  />
                </Pressable>

                {collapsed
                  ? null
                  : group.milestones.map((milestone) => (
                    <View key={milestone.milestoneTitle}>
                      <View style={styles.pickerMilestoneRow}>
                        <MilestoneIcon size={16} />
                        <AppText
                          color={colors.primary}
                          numberOfLines={1}
                          variant="subtitle"
                        >
                          {milestone.milestoneTitle}
                        </AppText>
                        <View style={styles.pickerMilestoneRule} />
                      </View>
                      {milestone.quests.map((quest) => (
                        <View key={quest.id} style={styles.pickerQuestRow}>
                            <SparkIcon
                              color={colors.accentViolet}
                              size={22}
                            />
                            <AppText
                              numberOfLines={2}
                              style={styles.pickerQuestTitle}
                              variant="pill"
                            >
                              {quest.title}
                            </AppText>
                            <Pressable
                              accessibilityLabel={`Add the quest ${quest.title} to ${block.label}`}
                              accessibilityRole="button"
                              hitSlop={8}
                              onPress={() => onAdd(quest)}
                              style={({ pressed: isPressed }) => [
                                styles.pickerAddButton,
                                isPressed && pressed,
                              ]}
                            >
                              <PlusIcon
                                color={colors.primary}
                                size={iconSizes.md}
                              />
                            </Pressable>
                          </View>
                        ))}
                    </View>
                  ))}
              </View>
            );
          })}
        </ScrollView>
      ) : (
        <AppText
          align="center"
          color={colors.textSecondary}
          style={styles.pickerEmpty}
          variant="bodySmall"
        >
          No quests waiting to be accepted. Create quests in your milestones
          and they will show up here.
        </AppText>
      )}
    </AppModal>
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
                    Nothing scheduled yet
                  </AppText>
                  <AppText
                    align="center"
                    color={colors.textSecondary}
                    style={styles.emptyBlockCopy}
                    variant="bodySmall"
                  >
                    Add a quest to make progress.
                  </AppText>
                  <AppButton
                    icon={<PlusIcon color={colors.primary} size={iconSizes.md} />}
                    iconPosition="before"
                    label="Add quest"
                    onPress={openQuestPicker}
                    style={styles.emptyBlockButton}
                    variant="secondary"
                  />
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
          { bottom: insets.bottom + layout.tabBarClearance },
          compact && styles.progressFooterCompact,
        ]}
      >
        <TodayProgressCard
          completedActions={completedQuests}
          style={styles.progressCard}
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
        <QuestPickerModal
          block={activeBlock}
          onAdd={handleAddQuestToBlock}
          onClose={() => setQuestPickerOpen(false)}
          quests={pickerQuests}
          visible={questPickerOpen}
        />
      ) : null}

      <QuestActionSheet
        onClose={() => setMenuQuest(null)}
        onCompleteNow={handleMenuCompleteNow}
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
          menuQuest ? { isDone: menuQuest.done, title: menuQuest.title } : null
        }
      />

      {scheduleQuest ? (
        <AcceptQuestModal
          key={scheduleQuest.questId}
          onAccept={handleScheduleQuest}
          onClose={() => setScheduleQuest(null)}
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
  pickerAddButton: {
    alignItems: "center",
    borderColor: colors.primary,
    borderRadius: radius.round,
    borderWidth: 1.5,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  pickerClose: {
    alignItems: "center",
    borderColor: colors.borderSoft,
    borderRadius: radius.round,
    borderWidth: 1,
    height: 40,
    justifyContent: "center",
    position: "absolute",
    right: spacing.md,
    top: spacing.md,
    width: 40,
    zIndex: 2,
  },
  pickerEmpty: {
    marginVertical: spacing.lg,
  },
  pickerGroup: {
    backgroundColor: colors.surfaceDeep,
    borderColor: colors.borderFaint,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  pickerGroupHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
    minHeight: 52,
  },
  pickerGroupIcon: {
    alignItems: "center",
    borderColor: "rgba(245, 184, 75, 0.55)",
    borderRadius: radius.round,
    borderWidth: 1,
    height: 52,
    justifyContent: "center",
    width: 52,
    ...shadowStyle({
      color: colors.primary,
      elevation: 6,
      opacity: 0.35,
      radius: 10,
    }),
  },
  pickerGroupTitle: {
    flex: 1,
    minWidth: 0,
  },
  pickerHint: {
    marginTop: spacing.md,
  },
  pickerList: {
    marginTop: spacing.md,
    maxHeight: 460,
  },
  pickerMilestoneRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  pickerMilestoneRule: {
    backgroundColor: "rgba(245, 184, 75, 0.25)",
    flex: 1,
    height: 1,
    marginLeft: spacing.sm,
  },
  pickerQuestRow: {
    alignItems: "center",
    backgroundColor: colors.surfaceCard,
    borderColor: colors.borderFaint,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.sm,
    minHeight: 64,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  pickerQuestTitle: {
    flex: 1,
    minWidth: 0,
  },
  pickerSubtitle: {
    marginTop: spacing.xs,
  },
  pickerTimeRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "center",
    marginTop: spacing.xs,
  },
  progressCard: {
    maxWidth: layout.contentMaxWidth,
    width: "100%",
  },
  progressFooter: {
    alignItems: "center",
    left: 0,
    paddingHorizontal: layout.screenPaddingH,
    position: "absolute",
    right: 0,
  },
  progressFooterCompact: {
    paddingHorizontal: spacing.md,
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
