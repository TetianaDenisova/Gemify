import { useEffect, useRef } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import Svg, { Circle, Path, Rect } from "react-native-svg";

import type { BlockIcon, TimeBlock } from "@/data/timeBlocks";
import { AppText, ChevronIcon } from "@/shared/components";
import { colors } from "@/theme/colors";
import { fontSizes, layout, lineHeights, pressed, radius } from "@/theme/theme";

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
      style={({ pressed: isPressed }) => [
        styles.timeTab,
        compact && styles.timeTabCompact,
        active && styles.timeTabActive,
        active && compact && styles.timeTabActiveCompact,
        isPressed && pressed,
      ]}
    >
      <BlockIconArt
        color={active ? colors.accentViolet : colors.textSecondary}
        icon={block.icon}
        size={compact ? 22 : 28}
      />
      <AppText
        color={colors.textSecondary}
        numberOfLines={1}
        style={[
          compact && styles.timeTabLabelCompact,
          active && styles.timeTabLabelActive,
        ]}
        variant="pill"
      >
        {block.label}
      </AppText>
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
  const compact = width < layout.compactBreakpoint;

  const scrollRef = useRef<ScrollView>(null);
  const tabLayoutsRef = useRef<Record<string, { width: number; x: number }>>({});
  const viewportWidthRef = useRef(0);

  // Slide the strip so the selected tab is centered in the viewport.
  function centerTab(key: string) {
    const layoutRect = tabLayoutsRef.current[key];
    const viewportWidth = viewportWidthRef.current;
    if (!layoutRect || viewportWidth === 0) return;
    scrollRef.current?.scrollTo({
      animated: true,
      x: Math.max(0, layoutRect.x + layoutRect.width / 2 - viewportWidth / 2),
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
        style={({ pressed: isPressed }) => [
          styles.tabsArrow,
          compact && styles.tabsArrowCompact,
          isPressed && pressed,
        ]}
      >
        <ChevronIcon
          color={colors.textSecondary}
          direction="left"
          size={compact ? 20 : 24}
          strokeWidth={1.9}
        />
      </Pressable>
      <ScrollView
        contentContainerStyle={[styles.tabsContent, compact && styles.tabsContentCompact]}
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
        style={({ pressed: isPressed }) => [
          styles.tabsArrow,
          compact && styles.tabsArrowCompact,
          isPressed && pressed,
        ]}
      >
        <ChevronIcon
          color={colors.textSecondary}
          direction="right"
          size={compact ? 20 : 24}
          strokeWidth={1.9}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  tabsArrow: {
    alignItems: "center",
    height: 48,
    justifyContent: "center",
    width: 44,
  },
  tabsArrowCompact: {
    height: 40,
    width: 34,
  },
  tabsContent: {
    alignItems: "center",
    minHeight: 96,
    paddingHorizontal: 4,
    paddingVertical: 12,
  },
  tabsContentCompact: {
    minHeight: 72,
    paddingVertical: 8,
  },
  tabsRow: {
    alignItems: "center",
    backgroundColor: colors.surfaceDeep,
    borderColor: colors.borderSoft,
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
    borderColor: colors.accentViolet,
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 28,
  },
  timeTabActiveCompact: {
    gap: 8,
    paddingHorizontal: 18,
  },
  timeTabCompact: {
    gap: 4,
    minHeight: 54,
    paddingHorizontal: 14,
  },
  timeTabDivider: {
    backgroundColor: colors.borderSoft,
    height: 30,
    width: 1,
  },
  timeTabLabelActive: {
    color: colors.accentViolet,
  },
  timeTabLabelCompact: {
    fontSize: fontSizes.md,
    lineHeight: lineHeights.md,
  },
  timeTabSlot: {
    alignItems: "center",
    flexDirection: "row",
  },
});
