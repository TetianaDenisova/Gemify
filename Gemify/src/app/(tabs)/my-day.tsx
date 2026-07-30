import { useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle, Path, Rect } from "react-native-svg";

import { DatePickerModal, formatDayTitle, isSameDay } from "@/components/DatePickerModal";
import { TimeBlockCard } from "@/components/TimeBlockCard";
import { TimeBlockTabs } from "@/components/TimeBlockTabs";
import type { TimeBlock } from "@/data/timeBlocks";
import { timeBlocks } from "@/data/timeBlocks";
import { colors } from "@/theme/colors";
import { fontSizes, lineHeights, shadows, spacing, typography } from "@/theme/theme";

/** Below this width the roomy layout overflows, so switch to the phone scale. */
const COMPACT_BREAKPOINT = 560;

/** Floating tab bar height (72) plus its bottom margin and a small gap. */
const FOOTER_BOTTOM_OFFSET = 72 + spacing.sm * 2;

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

function StarBadge({ size = 26 }: { size?: number }) {
  return (
    <Svg height={size} viewBox="0 0 32 32" width={size}>
      <Path
        d="M16 2 19.7 12.3 30 16 19.7 19.7 16 30 12.3 19.7 2 16 12.3 12.3 16 2Z"
        fill={colors.primary}
      />
    </Svg>
  );
}

function ProgressRing({ percent, size = 62 }: { percent: number; size?: number }) {
  const strokeWidth = 5;
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const dashOffset = circumference * (1 - percent / 100);

  return (
    <View style={{ alignItems: "center", height: size, justifyContent: "center", width: size }}>
      <Svg height={size} viewBox={`0 0 ${size} ${size}`} width={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          fill="rgba(4, 8, 18, 0.7)"
          r={r}
          stroke="rgba(246, 232, 200, 0.16)"
          strokeWidth={strokeWidth}
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          fill="none"
          r={r}
          stroke={colors.primary}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          strokeWidth={strokeWidth}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <Text style={styles.ringValue}>{percent}%</Text>
    </View>
  );
}

export default function MyDayScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const compact = width < COMPACT_BREAKPOINT;

  const [blocks, setBlocks] = useState<readonly TimeBlock[]>(timeBlocks);
  const [activeKey, setActiveKey] = useState("wake-up");
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [calendarOpen, setCalendarOpen] = useState(false);

  const today = new Date();
  const headerTitle = isSameDay(selectedDate, today) ? "Today" : formatDayTitle(selectedDate);

  const activeBlock = blocks.find((block) => block.key === activeKey) ?? blocks[0];

  const { completed, percent, total } = useMemo(() => {
    const all = blocks.flatMap((block) => block.actions);
    const doneCount = all.filter((action) => action.done).length;
    return {
      completed: doneCount,
      percent: all.length === 0 ? 0 : Math.round((doneCount / all.length) * 100),
      total: all.length,
    };
  }, [blocks]);

  function toggleAction(blockKey: string, index: number) {
    setBlocks((current) =>
      current.map((block) =>
        block.key === blockKey
          ? {
              ...block,
              actions: block.actions.map((action, i) =>
                i === index ? { ...action, done: !action.done } : action,
              ),
            }
          : block,
      ),
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingBottom: insets.bottom + FOOTER_BOTTOM_OFFSET + 150,
            paddingTop: Math.max(insets.top + 10, 20),
          },
          compact && styles.contentCompact,
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.headerSpacer} />
          <View style={styles.headerTitleBlock}>
            <Text style={styles.headerTitle}>{headerTitle}</Text>
            <Text style={styles.headerSubtitle}>Focus only on what matters now.</Text>
          </View>
          <Pressable
            accessibilityLabel="Open calendar"
            accessibilityRole="button"
            onPress={() => setCalendarOpen(true)}
            style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
          >
            <CalendarIcon size={24} />
          </Pressable>
        </View>

        <TimeBlockTabs
          activeKey={activeKey}
          blocks={blocks}
          onSelect={setActiveKey}
          style={styles.tabs}
        />

        <TimeBlockCard
          block={activeBlock}
          onToggleAction={(index) => toggleAction(activeBlock.key, index)}
          style={styles.blockSection}
        />
      </ScrollView>

      <View
        style={[
          styles.progressFooter,
          { bottom: insets.bottom + FOOTER_BOTTOM_OFFSET },
          compact && styles.progressFooterCompact,
        ]}
      >
        <View style={styles.progressCard}>
          <StarBadge />
          <View style={styles.progressCopy}>
            <Text style={styles.progressTitle}>{"Today's progress"}</Text>
            <Text style={styles.progressMeta}>
              {completed} / {total} actions completed
            </Text>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${percent}%` }]} />
            </View>
          </View>
          <ProgressRing percent={percent} />
        </View>
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
    marginTop: 24,
  },
  content: {
    alignSelf: "center",
    maxWidth: 820,
    paddingHorizontal: 22,
    width: "100%",
  },
  contentCompact: {
    paddingHorizontal: spacing.md,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  headerSpacer: {
    width: 52,
  },
  headerSubtitle: {
    color: colors.primary,
    fontSize: fontSizes.md,
    lineHeight: 22,
    marginTop: 4,
    textAlign: "center",
  },
  headerTitle: {
    ...typography.screenTitle,
    textAlign: "center",
  },
  headerTitleBlock: {
    alignItems: "center",
    flex: 1,
  },
  iconButton: {
    alignItems: "center",
    backgroundColor: "rgba(4, 8, 18, 0.72)",
    borderColor: "rgba(245, 184, 75, 0.48)",
    borderRadius: 26,
    borderWidth: 1,
    height: 52,
    justifyContent: "center",
    width: 52,
  },
  pressed: {
    opacity: 0.72,
    transform: [{ scale: 0.98 }],
  },
  progressCard: {
    alignItems: "center",
    backgroundColor: "rgba(6, 11, 26, 0.9)",
    borderColor: "rgba(245, 184, 75, 0.28)",
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: "row",
    gap: 16,
    maxWidth: 820,
    padding: 20,
    width: "100%",
    ...shadows.goldGlow,
    shadowOpacity: 0.16,
    shadowRadius: 12,
  },
  progressCopy: {
    flex: 1,
    minWidth: 0,
  },
  progressFill: {
    backgroundColor: colors.primary,
    borderRadius: 3,
    height: "100%",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 6,
  },
  progressFooter: {
    alignItems: "center",
    left: 0,
    paddingHorizontal: 22,
    position: "absolute",
    right: 0,
  },
  progressFooterCompact: {
    paddingHorizontal: spacing.md,
  },
  progressMeta: {
    ...typography.subtitle,
    color: colors.textSecondary,
    marginTop: 2,
  },
  progressTitle: {
    ...typography.cardTitle,
    fontSize: fontSizes.xxl,
    lineHeight: lineHeights.xxl,
  },
  progressTrack: {
    backgroundColor: "rgba(246, 232, 200, 0.12)",
    borderRadius: 3,
    height: 6,
    marginTop: 12,
    overflow: "hidden",
    width: "100%",
  },
  ringValue: {
    color: colors.primary,
    fontFamily: "serif",
    fontSize: 20,
    lineHeight: 24,
    position: "absolute",
  },
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  tabs: {
    marginTop: 36,
  },
});
