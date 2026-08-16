import { useState } from "react";
import { StyleSheet, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path, Rect } from "react-native-svg";

import { DatePickerModal, formatDayTitle, isSameDay } from "@/components/DatePickerModal";
import { TodayProgressCard } from "@/components/home";
import { TimeBlockCard } from "@/components/TimeBlockCard";
import { TimeBlockTabs } from "@/components/TimeBlockTabs";
import { useTimeBlocks } from "@/hooks/useTimeBlocks";
import { ScreenHeader, ScreenScaffold } from "@/shared/components";
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

export default function MyDayScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const compact = width < layout.compactBreakpoint;

  const [activeKey, setActiveKey] = useState("wake-up");
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [calendarOpen, setCalendarOpen] = useState(false);

  const { blocks, completedActions, totalActions, toggleAction } =
    useTimeBlocks(toDateKey(selectedDate));

  const today = new Date();
  const headerTitle = isSameDay(selectedDate, today) ? "Today" : formatDayTitle(selectedDate);

  const activeBlock = blocks.find((block) => block.key === activeKey) ?? blocks[0];

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
          leftAction={null}
          rightAction={{
            accessibilityLabel: "Open calendar",
            icon: <CalendarIcon size={compact ? 20 : 24} />,
            onPress: () => setCalendarOpen(true),
          }}
          style={styles.header}
          subtitle="Focus only on what matters now."
          title={headerTitle}
        />

        <TimeBlockTabs
          activeKey={activeKey}
          blocks={blocks}
          onSelect={setActiveKey}
          style={compact ? styles.tabsCompact : styles.tabs}
        />

        {activeBlock ? (
          <TimeBlockCard
            block={activeBlock}
            onToggleAction={(index) => {
              const action = activeBlock.actions[index];
              if (action) toggleAction(action.id, !action.done);
            }}
            style={compact ? styles.blockSectionCompact : styles.blockSection}
          />
        ) : null}
      </ScreenScaffold>

      <View
        style={[
          styles.progressFooter,
          { bottom: insets.bottom + layout.tabBarClearance },
          compact && styles.progressFooterCompact,
        ]}
      >
        <TodayProgressCard
          completedActions={completedActions}
          style={styles.progressCard}
          totalActions={totalActions}
        />
      </View>

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
