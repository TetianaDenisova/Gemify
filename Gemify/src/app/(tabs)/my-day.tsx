import { useState } from "react";
import { StyleSheet, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle, Path, Rect } from "react-native-svg";

import { DatePickerModal, formatDayTitle, isSameDay } from "@/components/DatePickerModal";
import { TodayProgressCard } from "@/components/home";
import { TimeBlockCard } from "@/components/TimeBlockCard";
import { TimeBlockSettingsModal } from "@/components/TimeBlockSettingsModal";
import { TimeBlockTabs } from "@/components/TimeBlockTabs";
import { currentBlockKey, useDayQuestBlocks } from "@/hooks/useDayQuestBlocks";
import { AppText, Card, ScreenHeader, ScreenScaffold } from "@/shared/components";
import { colors } from "@/theme/colors";
import { layout, spacing } from "@/theme/theme";
import { toDateKey } from "@/utils/dates";

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

export default function MyDayScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const compact = width < layout.compactBreakpoint;

  // No explicit selection yet → the block matching the clock right now.
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [blockSettingsOpen, setBlockSettingsOpen] = useState(false);

  const { blocks, completedQuests, refresh, totalQuests, toggleQuest } =
    useDayQuestBlocks(toDateKey(selectedDate));

  const today = new Date();
  const headerTitle = isSameDay(selectedDate, today) ? "Today" : formatDayTitle(selectedDate);

  const resolvedActiveKey = activeKey ?? currentBlockKey(blocks, new Date());
  const activeBlock =
    blocks.find((block) => block.key === resolvedActiveKey) ?? blocks[0];

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

        {activeBlock && activeBlock.actions.length > 0 ? (
          <TimeBlockCard
            block={activeBlock}
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
  emptyBlockCard: {
    marginTop: spacing.md,
    paddingVertical: spacing.lg,
  },
  header: {
    paddingHorizontal: 0,
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
