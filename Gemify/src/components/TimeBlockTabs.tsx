import { useEffect, useRef } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import Svg, { Circle, Path, Rect } from "react-native-svg";

import type { BlockIcon, TimeBlock } from "@/data/timeBlocks";
import { colors } from "@/theme/colors";
import { fontSizes, lineHeights, radius } from "@/theme/theme";

/** Below this width the roomy tab layout overflows, so switch to the phone scale. */
const COMPACT_BREAKPOINT = 560;

const PURPLE = "#C79BFF";

function ChevronIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <Svg height={24} viewBox="0 0 24 24" width={24}>
      <Path
        d={direction === "left" ? "m14 6-6 6 6 6" : "m10 6 6 6-6 6"}
        fill="none"
        stroke="#C6B8A8"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.9}
      />
    </Svg>
  );
}

export function BlockIconArt({ color, icon, size = 22 }: { color: string; icon: BlockIcon; size?: number }) {
  const stroke = { fill: "none" as const, stroke: color, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

  if (icon === "sunrise") {
    return (
      <Svg height={size} viewBox="0 0 24 24" width={size}>
        <Path d="M3 18h18M6 18a6 6 0 0 1 12 0" strokeWidth={1.7} {...stroke} />
        <Path d="M12 3v3M4.5 8.5 6 10M19.5 8.5 18 10M2 14h2M20 14h2" strokeWidth={1.5} {...stroke} />
      </Svg>
    );
  }
  if (icon === "briefcase") {
    return (
      <Svg height={size} viewBox="0 0 24 24" width={size}>
        <Rect height={12} rx={2.2} strokeWidth={1.7} width={18} x={3} y={7} {...stroke} />
        <Path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7M3 12h18" strokeWidth={1.6} {...stroke} />
      </Svg>
    );
  }
  if (icon === "sun") {
    return (
      <Svg height={size} viewBox="0 0 24 24" width={size}>
        <Circle cx={12} cy={12} r={4.2} strokeWidth={1.7} {...stroke} />
        <Path
          d="M12 2.5v2.6M12 18.9v2.6M4.2 4.2l1.9 1.9M17.9 17.9l1.9 1.9M2.5 12h2.6M18.9 12h2.6M4.2 19.8l1.9-1.9M17.9 6.1l1.9-1.9"
          strokeWidth={1.5}
          {...stroke}
        />
      </Svg>
    );
  }
  if (icon === "moon") {
    return (
      <Svg height={size} viewBox="0 0 24 24" width={size}>
        <Path d="M20 14.5A8 8 0 1 1 9.5 4 6.4 6.4 0 0 0 20 14.5Z" strokeWidth={1.7} {...stroke} />
      </Svg>
    );
  }
  return (
    <Svg height={size} viewBox="0 0 24 24" width={size}>
      <Circle cx={12} cy={12} r={8.4} strokeWidth={1.7} {...stroke} />
      <Path d="M12 7.6V12l3 1.8" strokeWidth={1.7} {...stroke} />
    </Svg>
  );
}

function TimeTab({
  active,
  block,
  compact,
  onPress,
}: {
  active: boolean;
  block: TimeBlock;
  compact: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.timeTab,
        compact && styles.timeTabCompact,
        active && styles.timeTabActive,
        pressed && styles.pressed,
      ]}
    >
      <BlockIconArt color={active ? "#E6B4FF" : "rgba(246, 232, 200, 0.68)"} icon={block.icon} size={28} />
      <Text
        numberOfLines={1}
        style={[styles.timeTabLabel, active && styles.timeTabLabelActive]}
      >
        {block.label}
      </Text>
    </Pressable>
  );
}

type TimeBlockTabsProps = {
  activeKey: string;
  blocks: readonly TimeBlock[];
  onSelect: (key: string) => void;
  style?: StyleProp<ViewStyle>;
};

export function TimeBlockTabs({ activeKey, blocks, onSelect, style }: TimeBlockTabsProps) {
  const { width } = useWindowDimensions();
  const compact = width < COMPACT_BREAKPOINT;

  const scrollRef = useRef<ScrollView>(null);
  const tabLayoutsRef = useRef<Record<string, { width: number; x: number }>>({});
  const viewportWidthRef = useRef(0);

  // Slide the strip so the selected tab is centered in the viewport.
  function centerTab(key: string) {
    const layout = tabLayoutsRef.current[key];
    const viewportWidth = viewportWidthRef.current;
    if (!layout || viewportWidth === 0) return;
    scrollRef.current?.scrollTo({
      animated: true,
      x: Math.max(0, layout.x + layout.width / 2 - viewportWidth / 2),
    });
  }

  useEffect(() => {
    centerTab(activeKey);
  }, [activeKey]);

  function shiftActive(delta: -1 | 1) {
    const activeIndex = blocks.findIndex((block) => block.key === activeKey);
    const next = blocks[activeIndex + delta];
    if (next) onSelect(next.key);
  }

  return (
    <View style={[styles.tabsRow, style]}>
      <Pressable
        accessibilityLabel="Previous time block"
        accessibilityRole="button"
        hitSlop={8}
        onPress={() => shiftActive(-1)}
        style={({ pressed }) => [styles.tabsArrow, pressed && styles.pressed]}
      >
        <ChevronIcon direction="left" />
      </Pressable>
      <ScrollView
        contentContainerStyle={styles.tabsContent}
        horizontal
        onLayout={(event) => {
          viewportWidthRef.current = event.nativeEvent.layout.width;
        }}
        ref={scrollRef}
        showsHorizontalScrollIndicator={false}
        style={styles.tabsScroll}
      >
        {blocks.map((block, index) => (
          <View
            key={block.key}
            onLayout={(event) => {
              tabLayoutsRef.current[block.key] = {
                width: event.nativeEvent.layout.width,
                x: event.nativeEvent.layout.x,
              };
              // The active tab widens on selection; re-center once its fresh layout lands.
              if (block.key === activeKey) centerTab(block.key);
            }}
            style={styles.timeTabSlot}
          >
            <TimeTab
              active={block.key === activeKey}
              block={block}
              compact={compact}
              onPress={() => onSelect(block.key)}
            />
            {index < blocks.length - 1 ? <View style={styles.timeTabDivider} /> : null}
          </View>
        ))}
      </ScrollView>
      <Pressable
        accessibilityLabel="Next time block"
        accessibilityRole="button"
        hitSlop={8}
        onPress={() => shiftActive(1)}
        style={({ pressed }) => [styles.tabsArrow, pressed && styles.pressed]}
      >
        <ChevronIcon direction="right" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.72,
    transform: [{ scale: 0.98 }],
  },
  tabsArrow: {
    alignItems: "center",
    height: 48,
    justifyContent: "center",
    width: 44,
  },
  tabsContent: {
    alignItems: "center",
    minHeight: 96,
    paddingHorizontal: 4,
    paddingVertical: 12,
  },
  tabsRow: {
    alignItems: "center",
    backgroundColor: "rgba(5, 9, 20, 0.7)",
    borderColor: "rgba(246, 232, 200, 0.16)",
    borderRadius: radius.round,
    borderWidth: 1,
    flexDirection: "row",
    overflow: "hidden",
    paddingHorizontal: 8,
  },
  tabsScroll: {
    flex: 1,
  },
  timeTab: {
    alignItems: "center",
    borderColor: colors.transparent,
    borderRadius: radius.round,
    borderWidth: 1.5,
    flexDirection: "column",
    gap: 6,
    justifyContent: "center",
    minHeight: 72,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  timeTabActive: {
    backgroundColor: "rgba(90, 55, 140, 0.28)",
    borderColor: "rgba(199, 155, 255, 0.75)",
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 28,
  },
  timeTabCompact: {
    minHeight: 64,
    paddingHorizontal: 16,
  },
  timeTabDivider: {
    backgroundColor: "rgba(246, 232, 200, 0.12)",
    height: 30,
    width: 1,
  },
  timeTabLabel: {
    color: "rgba(246, 232, 200, 0.68)",
    fontFamily: "serif",
    fontSize: fontSizes.xl,
    fontWeight: "500",
    lineHeight: lineHeights.lg,
  },
  timeTabLabelActive: {
    color: PURPLE,
    fontWeight: "700",
  },
  timeTabSlot: {
    alignItems: "center",
    flexDirection: "row",
  },
});
