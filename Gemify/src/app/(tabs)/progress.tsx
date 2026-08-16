import { Image } from "expo-image";
import { LinearGradient as ExpoLinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import {
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import Svg, {
  Circle,
  Defs,
  Line,
  LinearGradient,
  Path,
  Rect,
  Stop,
} from "react-native-svg";

import {
  progressAccentLayout,
  type FulfillmentPoint,
  type ProgressAccent,
  type TimelineIconKey,
  type TimelineMoment,
} from "@/data/progressData";
import { addTimelineMoment } from "@/db";
import { useProgressContent } from "@/hooks/useProgressContent";
import {
  AppButton,
  AppInput,
  AppModal,
  AppText,
  Badge,
  Card,
  ChevronIcon,
  IconButton,
  ListItem,
  PlusIcon,
  ScreenScaffold,
} from "@/shared/components";
import { todayKey } from "@/utils/dates";
import { colors } from "@/theme/colors";
import {
  fontSizes,
  fonts,
  layout,
  lineHeights,
  pressed,
  radius,
  shadows,
  spacing,
} from "@/theme/theme";

const CHART_PLOT_HEIGHT = 150;
const CHART_TOP_PAD = 52;
const CHART_Y_AXIS_WIDTH = 34;
/** Wider axis gutter for the line chart — fits fractional ticks like "62.5%". */
const LINE_Y_AXIS_WIDTH = 48;
const CHART_X_LABEL_HEIGHT = 26;
const CHART_POINT_INSET = 14;
const CHART_Y_TICKS = [100, 75, 50, 25, 0] as const;

const BAR_MAX_WIDTH = 58;
/** How far the glassy track cap rises above the 100% gridline. */
const BAR_TRACK_OVERSHOOT = 12;
const BAR_TRACK_FILL = "rgba(133, 149, 199, 0.16)";
const BAR_AXIS_STROKE = "rgba(246, 232, 200, 0.32)";

const TIMELINE_ITEM_WIDTH = 104;
const TIMELINE_CONNECTOR_WIDTH = 26;
const TIMELINE_ELLIPSIS_MIN_WIDTH = 34;

const PROGRESS_BACK = require("../../data/images/progress-map-img.png");

const accentTints: Record<ProgressAccent, { glow: string; main: string }> = {
  ember: { glow: "rgba(184, 92, 74, 0.4)", main: colors.danger },
  gold: { glow: colors.primaryGlow, main: colors.primary },
  muted: { glow: "rgba(111, 120, 144, 0.35)", main: colors.textMuted },
  pink: { glow: colors.accentPinkGlow, main: colors.accentPink },
  violet: { glow: colors.accentVioletGlow, main: colors.accentViolet },
};

/** Mix two hex colors (returns hex, so results can be mixed again). */
function lerpColor(from: string, to: string, t: number) {
  const a = parseInt(from.slice(1), 16);
  const b = parseInt(to.slice(1), 16);
  const channel = (shift: number) => {
    const x = (a >> shift) & 0xff;
    const y = (b >> shift) & 0xff;
    return Math.round(x + (y - x) * t);
  };
  const mixed = (channel(16) << 16) | (channel(8) << 8) | channel(0);
  return `#${mixed.toString(16).padStart(6, "0")}`;
}

function FulfillmentChart({
  compact,
  points,
}: {
  compact: boolean;
  points: readonly FulfillmentPoint[];
}) {
  const [chartWidth, setChartWidth] = useState(0);

  const svgHeight = CHART_TOP_PAD + CHART_PLOT_HEIGHT + 8;

  // Zoom the y-axis to a "nice" domain around the data (52..64 → 50..65)
  // so small week-to-week changes stay readable.
  const values = points.map((point) => point.percent);
  let domainLo = Math.floor(Math.min(...values) / 5) * 5;
  let domainHi = Math.ceil(Math.max(...values) / 5) * 5;
  if (domainLo === Math.min(...values)) domainLo = Math.max(0, domainLo - 5);
  if (domainHi === Math.max(...values)) domainHi = Math.min(100, domainHi + 5);
  const ticks = Array.from(
    { length: Math.floor((domainHi - domainLo) / 5) + 1 },
    (_, i) => domainHi - i * 5,
  );

  const yFor = (percent: number) =>
    CHART_TOP_PAD +
    (1 - (percent - domainLo) / (domainHi - domainLo)) * CHART_PLOT_HEIGHT;

  const startX = LINE_Y_AXIS_WIDTH + CHART_POINT_INSET;
  const endX = chartWidth - CHART_POINT_INSET;
  const step = points.length > 1 ? (endX - startX) / (points.length - 1) : 0;

  const dots = points.map((point, index) => ({
    ...point,
    tint: lerpColor(
      colors.accentViolet,
      colors.accentPink,
      points.length > 1 ? index / (points.length - 1) : 0,
    ),
    x: startX + index * step,
    y: yFor(point.percent),
  }));

  // Straight glowing segments, like the mock (no spline).
  const linePath = dots
    .map((dot, index) => `${index === 0 ? "M" : "L"} ${dot.x} ${dot.y}`)
    .join(" ");
  const areaPath =
    dots.length > 1
      ? `${linePath} L ${dots[dots.length - 1].x} ${yFor(domainLo)} L ${dots[0].x} ${yFor(domainLo)} Z`
      : "";

  // Mid-segment change badges, in percent ("+2%", "0%").
  const segments = dots.slice(1).map((dot, index) => {
    const prev = dots[index];
    const delta = dot.percent - prev.percent;
    return {
      delta,
      key: dot.key,
      label: `${delta > 0 ? "+" : ""}${delta}%`,
      x: (prev.x + dot.x) / 2,
      y: (prev.y + dot.y) / 2,
    };
  });

  return (
    <View
      onLayout={(event) => setChartWidth(event.nativeEvent.layout.width)}
      style={styles.chartCanvas}
    >
      {chartWidth > 0 ? (
        <>
          <Svg height={svgHeight} width={chartWidth}>
            <Defs>
              <LinearGradient id="fulfillmentLine" x1="0" x2="1" y1="0" y2="0">
                <Stop offset="0" stopColor={colors.accentViolet} />
                <Stop offset="1" stopColor={colors.accentPink} />
              </LinearGradient>
              <LinearGradient id="fulfillmentArea" x1="0" x2="0" y1="0" y2="1">
                <Stop offset="0" stopColor={colors.accentViolet} stopOpacity={0.4} />
                <Stop offset="1" stopColor={colors.accentViolet} stopOpacity={0.04} />
              </LinearGradient>
            </Defs>
            {ticks.map((tick) => (
              <Line
                key={`grid-${tick}`}
                stroke={colors.borderSoft}
                strokeDasharray="3 7"
                strokeWidth={1}
                x1={LINE_Y_AXIS_WIDTH}
                x2={chartWidth}
                y1={yFor(tick)}
                y2={yFor(tick)}
              />
            ))}
            <Line
              stroke={BAR_AXIS_STROKE}
              strokeWidth={1.4}
              x1={LINE_Y_AXIS_WIDTH}
              x2={LINE_Y_AXIS_WIDTH}
              y1={yFor(domainHi)}
              y2={yFor(domainLo)}
            />
            <Line
              stroke={BAR_AXIS_STROKE}
              strokeWidth={1.4}
              x1={LINE_Y_AXIS_WIDTH}
              x2={LINE_Y_AXIS_WIDTH + 10}
              y1={yFor(domainHi)}
              y2={yFor(domainHi)}
            />
            <Line
              stroke={BAR_AXIS_STROKE}
              strokeWidth={1.4}
              x1={LINE_Y_AXIS_WIDTH}
              x2={LINE_Y_AXIS_WIDTH + 10}
              y1={yFor(domainLo)}
              y2={yFor(domainLo)}
            />
            {areaPath ? <Path d={areaPath} fill="url(#fulfillmentArea)" /> : null}
            {linePath ? (
              <Path
                d={linePath}
                fill="none"
                stroke="url(#fulfillmentLine)"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
              />
            ) : null}
            {dots.map((dot) => (
              <Circle
                cx={dot.x}
                cy={dot.y}
                fill={dot.tint}
                key={`glow-${dot.key}`}
                opacity={0.35}
                r={10}
              />
            ))}
            {dots.map((dot) => (
              <Circle
                cx={dot.x}
                cy={dot.y}
                fill={colors.textPrimary}
                key={`dot-${dot.key}`}
                r={4.5}
                stroke={dot.tint}
                strokeWidth={2}
              />
            ))}
          </Svg>
          <AppText
            color={colors.textMuted}
            style={styles.zoomLabel}
            variant="captionStrong"
          >
            {`ZOOMED VIEW · ${domainLo}–${domainHi}%`}
          </AppText>
          {ticks.map((tick) => (
            <AppText
              color={colors.textPrimary}
              key={`tick-${tick}`}
              style={[styles.lineTickLabel, { top: yFor(tick) - 10 }]}
            >
              {tick}%
            </AppText>
          ))}
          {dots.map((dot) => (
            <AppText
              align="center"
              color={colors.textPrimary}
              key={`percent-${dot.key}`}
              style={[
                styles.chartPointLabel,
                compact && styles.chartPointLabelCompact,
                { left: dot.x - 28, top: dot.y - 34 },
              ]}
            >
              {dot.percent}%
            </AppText>
          ))}
          {segments.map((segment) => (
            <View
              key={`delta-${segment.key}`}
              style={[
                styles.deltaBadge,
                { left: segment.x - 31, top: segment.y + 14 },
              ]}
            >
              <AppText
                color={
                  segment.delta > 0
                    ? colors.accentPink
                    : segment.delta < 0
                      ? colors.danger
                      : colors.accentViolet
                }
                variant="labelStrong"
              >
                {segment.label}
              </AppText>
            </View>
          ))}
          {dots.map((dot) => (
            <AppText
              align="center"
              color={colors.textPrimary}
              key={`label-${dot.key}`}
              style={[styles.lineAxisLabel, { left: dot.x - 28 }]}
            >
              {dot.label}
            </AppText>
          ))}
        </>
      ) : null}
    </View>
  );
}

/** Bar tints: violet→pink across the range, gold for the current (last) bar. */
function barTint(index: number, count: number) {
  if (index === count - 1) return colors.primary;
  const span = Math.max(count - 2, 1);
  return lerpColor(colors.accentVioletStrong, colors.accentPink, index / span);
}

function TaskBarsChart({
  compact,
  points,
}: {
  compact: boolean;
  points: readonly FulfillmentPoint[];
}) {
  const [chartWidth, setChartWidth] = useState(0);

  const svgHeight = CHART_TOP_PAD + CHART_PLOT_HEIGHT + 8;
  const yFor = (percent: number) =>
    CHART_TOP_PAD + (1 - percent / 100) * CHART_PLOT_HEIGHT;

  const plotLeft = CHART_Y_AXIS_WIDTH + 6;
  const slot = points.length > 0 ? (chartWidth - plotLeft) / points.length : 0;
  const barWidth = Math.max(
    22,
    Math.min(compact ? 42 : BAR_MAX_WIDTH, slot * 0.45),
  );

  const bars = points.map((point, index) => ({
    ...point,
    center: plotLeft + slot * (index + 0.5),
    tint: barTint(index, points.length),
    top: yFor(point.percent),
  }));

  return (
    <View
      onLayout={(event) => setChartWidth(event.nativeEvent.layout.width)}
      style={styles.chartCanvas}
    >
      {chartWidth > 0 ? (
        <>
          <Svg height={svgHeight} width={chartWidth}>
            <Defs>
              {bars.map((bar, index) => (
                <LinearGradient
                  id={`barFill-${index}`}
                  key={`grad-${bar.key}`}
                  x1="0"
                  x2="0"
                  y1="0"
                  y2="1"
                >
                  <Stop
                    offset="0"
                    stopColor={lerpColor(bar.tint, colors.background, 0.3)}
                  />
                  <Stop offset="1" stopColor={bar.tint} />
                </LinearGradient>
              ))}
            </Defs>
            {CHART_Y_TICKS.map((tick) => (
              <Line
                key={tick}
                stroke={colors.borderSoft}
                strokeDasharray="3 6"
                strokeWidth={1}
                x1={CHART_Y_AXIS_WIDTH}
                x2={chartWidth}
                y1={yFor(tick)}
                y2={yFor(tick)}
              />
            ))}
            <Line
              stroke={BAR_AXIS_STROKE}
              strokeWidth={1.4}
              x1={CHART_Y_AXIS_WIDTH}
              x2={CHART_Y_AXIS_WIDTH}
              y1={yFor(100)}
              y2={yFor(0)}
            />
            <Line
              stroke={BAR_AXIS_STROKE}
              strokeWidth={1.4}
              x1={CHART_Y_AXIS_WIDTH}
              x2={chartWidth}
              y1={yFor(0)}
              y2={yFor(0)}
            />
            {bars.map((bar) => (
              <Rect
                fill={BAR_TRACK_FILL}
                height={CHART_PLOT_HEIGHT + BAR_TRACK_OVERSHOOT}
                key={`track-${bar.key}`}
                rx={barWidth / 2}
                stroke={colors.borderSoft}
                strokeWidth={1}
                width={barWidth}
                x={bar.center - barWidth / 2}
                y={yFor(100) - BAR_TRACK_OVERSHOOT}
              />
            ))}
            {bars.map((bar, index) => (
              <Rect
                fill={`url(#barFill-${index})`}
                height={yFor(0) - bar.top}
                key={`fill-${bar.key}`}
                rx={Math.min(barWidth / 2, (yFor(0) - bar.top) / 2)}
                width={barWidth}
                x={bar.center - barWidth / 2}
                y={bar.top}
              />
            ))}
          </Svg>
          {CHART_Y_TICKS.map((tick) => (
            <AppText
              color={colors.textMuted}
              key={`tick-${tick}`}
              style={[styles.chartTickLabel, { top: yFor(tick) - 7 }]}
              variant="caption"
            >
              {tick}%
            </AppText>
          ))}
          {bars.map((bar) => (
            <AppText
              align="center"
              color={colors.textPrimary}
              key={`percent-${bar.key}`}
              style={[
                styles.barPercentLabel,
                compact && styles.chartPointLabelCompact,
                { left: bar.center - 28, top: bar.top + spacing.sm },
              ]}
              variant="pill"
            >
              {bar.percent}%
            </AppText>
          ))}
          {bars.map((bar) => (
            <AppText
              align="center"
              color={colors.textPrimary}
              key={`label-${bar.key}`}
              style={[
                styles.barAxisLabel,
                compact && styles.barAxisLabelCompact,
                { left: bar.center - 36 },
              ]}
              variant="pill"
            >
              {bar.label}
            </AppText>
          ))}
        </>
      ) : null}
    </View>
  );
}

function SparkleGlyph({ color = colors.accentViolet, size = 22 }: { color?: string; size?: number }) {
  return (
    <Svg height={size} viewBox="0 0 24 24" width={size}>
      <Path
        d="M12 2c.9 4.6 2.4 6.1 7 7-4.6.9-6.1 2.4-7 7-.9-4.6-2.4-6.1-7-7 4.6-.9 6.1-2.4 7-7Z"
        fill={color}
      />
      <Path d="M19 15c.4 2 1 2.6 3 3-2 .4-2.6 1-3 3-.4-2-1-2.6-3-3 2-.4 2.6-1 3-3Z" fill={color} opacity={0.7} />
    </Svg>
  );
}

function MenuIcon() {
  return (
    <Svg height={27} viewBox="0 0 24 24" width={27}>
      <Path
        d="M5 7h14M5 12h14M5 17h14"
        fill="none"
        stroke={colors.primary}
        strokeLinecap="round"
        strokeWidth={1.7}
      />
    </Svg>
  );
}

function DotsGlyph({ color = colors.textSecondary, size = 20 }: { color?: string; size?: number }) {
  return (
    <Svg height={size} viewBox="0 0 24 24" width={size}>
      <Circle cx={5} cy={12} fill={color} r={1.7} />
      <Circle cx={12} cy={12} fill={color} r={1.7} />
      <Circle cx={19} cy={12} fill={color} r={1.7} />
    </Svg>
  );
}

function ClockGlyph({ color = colors.primary, size = 18 }: { color?: string; size?: number }) {
  return (
    <Svg height={size} viewBox="0 0 24 24" width={size}>
      <Circle cx={12} cy={12} fill="none" r={9} stroke={color} strokeWidth={1.6} />
      <Path d="M12 7v5l3.4 2" fill="none" stroke={color} strokeLinecap="round" strokeWidth={1.6} />
    </Svg>
  );
}

function LockGlyph({ color = colors.primary, size = 14 }: { color?: string; size?: number }) {
  return (
    <Svg height={size} viewBox="0 0 24 24" width={size}>
      <Rect fill="none" height={8.5} rx={2} stroke={color} strokeWidth={1.8} width={11} x={6.5} y={10.5} />
      <Path d="M9 10.5V8a3 3 0 0 1 6 0v2.5" fill="none" stroke={color} strokeLinecap="round" strokeWidth={1.8} />
    </Svg>
  );
}

function TimelineGlyph({ color, icon, size = 26 }: { color: string; icon: TimelineIconKey; size?: number }) {
  const stroke = { fill: "none", stroke: color, strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 1.6 } as const;

  switch (icon) {
    case "spark":
      return (
        <Svg height={size} viewBox="0 0 24 24" width={size}>
          <Path d="M12 3v18M3 12h18M6 6l12 12M18 6 6 18" {...stroke} />
        </Svg>
      );
    case "code":
      return (
        <Svg height={size} viewBox="0 0 24 24" width={size}>
          <Path d="m9 8-5 4 5 4M15 8l5 4-5 4" {...stroke} />
        </Svg>
      );
    case "userPlus":
      return (
        <Svg height={size} viewBox="0 0 24 24" width={size}>
          <Circle cx={10} cy={9} r={3.2} {...stroke} />
          <Path d="M4.5 19c.8-3 2.9-4.5 5.5-4.5s4.7 1.5 5.5 4.5M18 8v6M15 11h6" {...stroke} />
        </Svg>
      );
    case "rocket":
      return (
        <Svg height={size} viewBox="0 0 24 24" width={size}>
          <Path
            d="M19.5 4.5c-4.3.4-7.5 2.3-10 5.3l-2.2 2.7 4.2 4.2 2.7-2.2c3-2.5 4.9-5.7 5.3-10Z"
            {...stroke}
          />
          <Circle cx={14.6} cy={9.4} r={1.5} {...stroke} />
          <Path d="M8.2 15.8 5 19M7 12.5l-2.6.9M11.5 17l-.9 2.6" {...stroke} />
        </Svg>
      );
    case "chat":
      return (
        <Svg height={size} viewBox="0 0 24 24" width={size}>
          <Path
            d="M5 5h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-8l-4 3.5V16H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z"
            {...stroke}
          />
          <Path d="M8 9.5h8M8 12.5h5" {...stroke} />
        </Svg>
      );
    case "target":
      return (
        <Svg height={size} viewBox="0 0 24 24" width={size}>
          <Circle cx={12} cy={12} r={8} {...stroke} />
          <Circle cx={12} cy={12} r={4.4} {...stroke} />
          <Circle cx={12} cy={12} fill={color} r={1.5} />
        </Svg>
      );
  }
}

function TimelineMomentItem({ moment }: { moment: TimelineMoment }) {
  const tint = accentTints[progressAccentLayout.moments[moment.key] ?? "gold"];

  return (
    <View style={styles.timelineItem}>
      <View style={styles.timelineBadgeSlot}>
        {moment.locked ? (
          <View style={[styles.lockBubble, { borderColor: tint.main }]}>
            <LockGlyph color={tint.main} />
          </View>
        ) : null}
      </View>
      <View
        style={[
          styles.timelineCircle,
          { borderColor: tint.main, shadowColor: tint.main },
        ]}
      >
        <TimelineGlyph color={tint.main} icon={moment.icon} />
      </View>
      <AppText style={styles.timelineDate} variant="pill">
        {moment.date}
      </AppText>
      <AppText
        align="center"
        color={colors.textSecondary}
        style={styles.timelineLabel}
        variant="caption"
      >
        {moment.label}
      </AppText>
    </View>
  );
}

export default function ProgressScreen() {
  const { width } = useWindowDimensions();
  const compact = width < layout.compactBreakpoint;

  const [goalKey, setGoalKey] = useState("");
  const { content: progressContent, dreamId, refresh } =
    useProgressContent(goalKey);
  const { forecast, fulfillmentTabs } = progressContent;
  const [goalPickerOpen, setGoalPickerOpen] = useState(false);
  const [tabKey, setTabKey] = useState(fulfillmentTabs[0].key);
  const [rangeKey, setRangeKey] = useState(fulfillmentTabs[0].ranges[0].key);
  const [rangePickerOpen, setRangePickerOpen] = useState(false);
  const [timelineWidth, setTimelineWidth] = useState(0);
  const [momentModalOpen, setMomentModalOpen] = useState(false);
  const [momentLabel, setMomentLabel] = useState("");

  const handleAddMoment = async () => {
    const label = momentLabel.trim();
    if (!label || dreamId === null) return;
    try {
      await addTimelineMoment({
        dreamId,
        occurredOn: todayKey(),
        label,
      });
      await refresh();
    } catch (cause) {
      console.error("Failed to add the moment", cause);
    }
    setMomentLabel("");
    setMomentModalOpen(false);
  };

  const selectedGoal =
    progressContent.goals.find((goal) => goal.key === goalKey) ??
    progressContent.goals[0];
  const selectedTab =
    fulfillmentTabs.find((tab) => tab.key === tabKey) ?? fulfillmentTabs[0];
  const selectedRange =
    selectedTab.ranges.find((range) => range.key === rangeKey) ??
    selectedTab.ranges[0];
  const currentPercent =
    selectedRange.points[selectedRange.points.length - 1].percent;

  // Show only the milestones that fit; past that, collapse the middle into a
  // dotted ellipsis so the last milestone stays visible without scrolling.
  // Nothing renders until the track width is known — otherwise the full row
  // stretches the layout on web and the measurement reads the inflated width.
  const { moments } = progressContent;
  const fullTimelineWidth =
    moments.length * TIMELINE_ITEM_WIDTH +
    (moments.length - 1) * TIMELINE_CONNECTOR_WIDTH;
  const timelineTruncated =
    timelineWidth > 0 && fullTimelineWidth > timelineWidth;

  let leadingMoments: readonly TimelineMoment[] =
    timelineWidth > 0 ? moments : [];
  if (timelineTruncated) {
    let fit = 1;
    while (
      fit < moments.length - 1 &&
      (fit + 2) * TIMELINE_ITEM_WIDTH +
        fit * TIMELINE_CONNECTOR_WIDTH +
        TIMELINE_ELLIPSIS_MIN_WIDTH <=
        timelineWidth
    ) {
      fit += 1;
    }
    leadingMoments = moments.slice(0, fit);
  }
  const lastMoment = moments[moments.length - 1];

  return (
    <ScreenScaffold contentStyle={styles.content} tabClearance topInset>
      <View style={[styles.header, compact && styles.headerCompact]}>
        <IconButton
          accessibilityLabel="Open menu"
          icon={<MenuIcon />}
          onPress={() => {}}
          size={compact ? "sm" : "md"}
        />
        <View style={[styles.titleBlock, compact && styles.titleBlockCompact]}>
          <AppText
            align="center"
            color={colors.primary}
            numberOfLines={1}
            style={[styles.title, compact && styles.titleCompact]}
            variant="screenTitle"
          >
            {progressContent.title}
          </AppText>
        </View>
        <IconButton
          accessibilityLabel="More options"
          icon={<DotsGlyph />}
          onPress={() => {}}
          size={compact ? "sm" : "md"}
        />
      </View>

      <Card padded={false} style={styles.goalPicker} variant="glass">
        <ListItem
          accessibilityLabel="Choose goal"
          last
          leading={<SparkleGlyph size={18} />}
          onPress={() => setGoalPickerOpen((open) => !open)}
          style={styles.goalPickerRow}
          title={selectedGoal.label}
          trailing={<ChevronIcon color={colors.textSecondary} size={18} strokeWidth={1.8} />}
        />
        {goalPickerOpen
          ? progressContent.goals
              .filter((goal) => goal.key !== selectedGoal.key)
              .map((goal) => (
                <ListItem
                  key={goal.key}
                  last
                  onPress={() => {
                    setGoalKey(goal.key);
                    setGoalPickerOpen(false);
                  }}
                  style={styles.goalOption}
                  title={goal.label}
                  titleColor={colors.textSecondary}
                />
              ))
          : null}
      </Card>

      <Card style={styles.fulfillmentCard} variant="glass">
        <View style={styles.controlsRow}>
          <View style={styles.tabsRow}>
            {fulfillmentTabs.map((tab) => {
              const active = tab.key === selectedTab.key;
              return (
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  key={tab.key}
                  onPress={() => {
                    setTabKey(tab.key);
                    setRangePickerOpen(false);
                  }}
                  style={({ pressed: isPressed }) => [
                    styles.tab,
                    active && styles.tabActive,
                    isPressed && pressed,
                  ]}
                >
                  <AppText
                    align="center"
                    color={active ? colors.textPrimary : colors.textMuted}
                    numberOfLines={1}
                    style={compact && styles.tabLabelCompact}
                    variant="controlLabel"
                  >
                    {tab.label}
                  </AppText>
                </Pressable>
              );
            })}
          </View>
          <View>
            <Pressable
              accessibilityLabel="Choose range"
              accessibilityRole="button"
              onPress={() => setRangePickerOpen((open) => !open)}
              style={({ pressed: isPressed }) => [
                styles.rangeTrigger,
                isPressed && pressed,
              ]}
            >
              <AppText variant="pill">
                {selectedRange.label}
              </AppText>
              <View style={rangePickerOpen ? styles.chevronOpen : null}>
                <ChevronIcon color={colors.textSecondary} size={16} strokeWidth={1.8} />
              </View>
            </Pressable>
            {rangePickerOpen ? (
              <View style={styles.rangeMenu}>
                {selectedTab.ranges
                  .filter((range) => range.key !== selectedRange.key)
                  .map((range, index) => (
                    <Pressable
                      key={range.key}
                      onPress={() => {
                        setRangeKey(range.key);
                        setRangePickerOpen(false);
                      }}
                      style={({ pressed: isPressed }) => [
                        styles.rangeOption,
                        index === 0 && styles.rangeOptionFirst,
                        isPressed && pressed,
                      ]}
                    >
                      <AppText color={colors.textSecondary} variant="pill">
                        {range.label}
                      </AppText>
                    </Pressable>
                  ))}
              </View>
            ) : null}
          </View>
        </View>

        <View style={[styles.chartRow, compact && styles.chartRowCompact]}>
          {selectedTab.chart === "bars" ? (
            <TaskBarsChart compact={compact} points={selectedRange.points} />
          ) : (
            <FulfillmentChart compact={compact} points={selectedRange.points} />
          )}
          {selectedRange.summary ? (
            <>
              <View style={styles.panelDivider} />
              <View
                style={[
                  styles.summaryPanel,
                  compact && styles.summaryPanelCompact,
                ]}
              >
                <AppText align="center" variant="eyebrow">
                  {selectedRange.summary.eyebrow}
                </AppText>
                <AppText
                  color={colors.accentPink}
                  style={[
                    styles.summaryValue,
                    compact && styles.summaryValueCompact,
                  ]}
                  variant="stat"
                >
                  {selectedRange.summary.percent}%
                </AppText>
                <AppText
                  align="center"
                  color={colors.textPrimary}
                  style={styles.summaryCaption}
                  variant="body"
                >
                  {selectedRange.summary.caption}
                </AppText>
              </View>
            </>
          ) : null}
        </View>

        {selectedTab.chart === "line" ? (
          <>
            <View style={styles.overallDivider} />
            <View style={styles.overallRow}>
              <View style={styles.overallBlock}>
                <AppText color={colors.textMuted} variant="eyebrow">
                  {progressContent.overallLabel}
                </AppText>
                <View style={styles.overallTrack}>
                  <ExpoLinearGradient
                    colors={[
                      colors.accentVioletStrong,
                      colors.accentViolet,
                      colors.accentPink,
                    ]}
                    end={{ x: 1, y: 0 }}
                    start={{ x: 0, y: 0 }}
                    style={[styles.overallFill, { width: `${currentPercent}%` }]}
                  />
                </View>
              </View>
              <AppText variant="title">{currentPercent}%</AppText>
            </View>
          </>
        ) : null}
      </Card>

      <Card padded={false} style={styles.forecastCard} variant="glass">
        <Image
          contentFit="cover"
          source={PROGRESS_BACK}
          style={styles.forecastBackground}
        />
        <View style={styles.forecastCopy}>
          <AppText
            color={colors.textPrimary}
            style={styles.forecastHeadline}
            variant="bodySerif"
          >
            {forecast.headline}
          </AppText>
          <AppText
            color={colors.primary}
            style={styles.forecastDate}
            variant="cardTitle"
          >
            {forecast.date}
          </AppText>
          <Badge
            color={colors.primary}
            icon={<ClockGlyph size={15} />}
            label={forecast.eta}
            style={styles.etaPill}
            textStyle={styles.serifPillLabel}
          />
        </View>

        <IconButton
          accessibilityLabel="Add a timeline moment"
          icon={<PlusIcon size={20} />}
          onPress={() => setMomentModalOpen(true)}
          size="sm"
          style={styles.addMomentButton}
        />

        <View
          onLayout={(event) =>
            setTimelineWidth(event.nativeEvent.layout.width - spacing.lg * 2)
          }
          style={styles.timelineTrack}
        >
          {leadingMoments.map((moment, index) => (
            <View key={moment.key} style={styles.timelineItemGroup}>
              {index > 0 ? <View style={styles.timelineConnector} /> : null}
              <TimelineMomentItem moment={moment} />
            </View>
          ))}
          {timelineTruncated ? (
            <>
              <View style={[styles.timelineConnector, styles.timelineEllipsis]} />
              <TimelineMomentItem moment={lastMoment} />
            </>
          ) : null}
          {moments.length === 0 && timelineWidth > 0 ? (
            <AppText
              align="center"
              color={colors.textSecondary}
              style={styles.timelineEmpty}
              variant="caption"
            >
              Capture your first meaningful moment with the + button.
            </AppText>
          ) : null}
        </View>
      </Card>

      <AppModal
        onClose={() => setMomentModalOpen(false)}
        visible={momentModalOpen}
      >
        <AppText align="center" variant="titleSm">
          Add a moment
        </AppText>
        <AppInput
          autoFocus
          containerStyle={styles.momentInput}
          onChangeText={setMomentLabel}
          placeholder="What just became real?"
          value={momentLabel}
        />
        <View style={styles.momentActions}>
          <AppButton
            label="Cancel"
            onPress={() => setMomentModalOpen(false)}
            style={styles.momentButton}
            variant="secondary"
          />
          <AppButton
            disabled={!momentLabel.trim() || dreamId === null}
            label="Add"
            onPress={handleAddMoment}
            style={styles.momentButton}
          />
        </View>
      </AppModal>
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  addMomentButton: {
    position: "absolute",
    right: spacing.md,
    top: spacing.md,
    zIndex: 2,
  },
  momentActions: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  momentButton: {
    flex: 1,
    paddingHorizontal: spacing.sm,
  },
  momentInput: {
    marginTop: spacing.lg,
  },
  timelineEmpty: {
    flex: 1,
    paddingVertical: spacing.lg,
  },
  barAxisLabel: {
    bottom: 0,
    fontSize: fontSizes.md,
    lineHeight: lineHeights.md,
    position: "absolute",
    width: 72,
  },
  barAxisLabelCompact: {
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
  },
  barPercentLabel: {
    fontSize: fontSizes.lg,
    lineHeight: lineHeights.lg,
    position: "absolute",
    width: 56,
  },
  chartCanvas: {
    flex: 1,
    height: CHART_TOP_PAD + CHART_PLOT_HEIGHT + CHART_X_LABEL_HEIGHT,
    minWidth: 0,
  },
  // Chart axis/point labels are a data-viz exception: token-sized, but kept
  // as local styles because they are absolutely positioned over the SVG plot.
  chartPointLabel: {
    fontSize: fontSizes.lg,
    fontWeight: "600",
    lineHeight: lineHeights.lg,
    position: "absolute",
    width: 56,
  },
  chartPointLabelCompact: {
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
  },
  chartTickLabel: {
    fontSize: fontSizes.xs,
    left: 0,
    lineHeight: lineHeights.xs,
    position: "absolute",
    textAlign: "right",
    width: CHART_Y_AXIS_WIDTH - 8,
  },
  chartRow: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  chartRowCompact: {
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  chevronOpen: {
    transform: [{ rotate: "180deg" }],
  },
  content: {
    gap: spacing.md,
  },
  controlsRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    zIndex: 20,
  },
  deltaBadge: {
    alignItems: "center",
    backgroundColor: colors.surfaceDeep,
    borderColor: colors.accentVioletStrong,
    borderRadius: radius.round,
    borderWidth: 1.2,
    paddingVertical: spacing.xs,
    position: "absolute",
    width: 62,
  },
  etaPill: {
    borderColor: colors.border,
    marginTop: spacing.md,
  },
  forecastBackground: {
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
  forecastCard: {
    borderColor: colors.border,
    overflow: "hidden",
  },
  forecastCopy: {
    justifyContent: "center",
    maxWidth: "70%",
    minHeight: 200,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
  },
  forecastDate: {
    marginTop: spacing.xs,
  },
  forecastHeadline: {
    fontSize: fontSizes.xxl,
    lineHeight: lineHeights.xxxl,
  },
  fulfillmentCard: {
    borderColor: colors.accentVioletGlow,
  },
  goalOption: {
    borderTopColor: colors.borderSoft,
    borderTopWidth: 1,
    paddingHorizontal: spacing.md,
  },
  goalPicker: {
    overflow: "hidden",
  },
  goalPickerRow: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 92,
  },
  headerCompact: {
    minHeight: 72,
  },
  lockBubble: {
    alignItems: "center",
    backgroundColor: colors.surfaceDeep,
    borderRadius: radius.round,
    borderWidth: 1.4,
    height: 28,
    justifyContent: "center",
    width: 28,
  },
  lineAxisLabel: {
    bottom: 0,
    fontSize: fontSizes.md,
    fontWeight: "600",
    lineHeight: lineHeights.md,
    position: "absolute",
    width: 56,
  },
  lineTickLabel: {
    fontSize: fontSizes.md,
    fontWeight: "600",
    left: 0,
    lineHeight: lineHeights.md,
    position: "absolute",
    textAlign: "right",
    width: LINE_Y_AXIS_WIDTH - 8,
  },
  overallBlock: {
    flex: 1,
    gap: spacing.sm,
    minWidth: 0,
  },
  overallDivider: {
    backgroundColor: colors.borderSoft,
    height: 1,
    marginTop: spacing.lg,
  },
  overallFill: {
    borderRadius: radius.round,
    height: "100%",
  },
  overallRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.md,
  },
  overallTrack: {
    backgroundColor: colors.surfaceDeep,
    borderColor: colors.borderSoft,
    borderRadius: radius.round,
    borderWidth: 1,
    height: 14,
    overflow: "hidden",
  },
  panelDivider: {
    alignSelf: "stretch",
    backgroundColor: colors.borderSoft,
    width: 1,
  },
  rangeMenu: {
    ...shadows.softDark,
    backgroundColor: colors.surface,
    borderColor: colors.borderSoft,
    borderRadius: radius.md,
    borderWidth: 1,
    elevation: 12,
    marginTop: spacing.xs,
    minWidth: 148,
    overflow: "hidden",
    position: "absolute",
    right: 0,
    top: "100%",
    zIndex: 30,
  },
  rangeOption: {
    borderTopColor: colors.divider,
    borderTopWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  rangeOptionFirst: {
    borderTopWidth: 0,
  },
  rangeTrigger: {
    alignItems: "center",
    backgroundColor: colors.surfaceDeep,
    borderColor: colors.borderSoft,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: layout.minTouchTarget,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  /** Serif pill/badge label, matching the pre-migration ETA/range pills. */
  serifPillLabel: {
    fontFamily: fonts.serif,
    fontSize: fontSizes.sm,
    fontWeight: "400",
    lineHeight: lineHeights.sm,
  },
  summaryCaption: {
    marginTop: spacing.sm,
  },
  summaryPanel: {
    alignItems: "center",
    justifyContent: "center",
    maxWidth: 168,
    minWidth: 128,
    paddingHorizontal: spacing.xs,
  },
  summaryPanelCompact: {
    minWidth: 96,
  },
  summaryValue: {
    marginTop: spacing.sm,
  },
  summaryValueCompact: {
    fontSize: fontSizes.screenTitle,
    lineHeight: lineHeights.screenTitle,
  },
  tab: {
    alignItems: "center",
    borderColor: colors.transparent,
    borderRadius: radius.md - spacing.xs,
    borderWidth: 1,
    flex: 1,
    justifyContent: "center",
    minHeight: layout.minTouchTarget,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  tabActive: {
    backgroundColor: "rgba(183, 140, 255, 0.12)",
    borderColor: colors.accentViolet,
    elevation: 6,
    shadowColor: colors.accentViolet,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
  tabLabelCompact: {
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
  },
  tabsRow: {
    backgroundColor: colors.surfaceDeep,
    borderColor: colors.borderSoft,
    borderRadius: radius.md,
    borderWidth: 1,
    flex: 1,
    flexDirection: "row",
    gap: spacing.xs,
    minWidth: 0,
    padding: spacing.xs,
  },
  timelineBadgeSlot: {
    alignItems: "center",
    height: 32,
    justifyContent: "center",
    marginBottom: spacing.xs,
  },
  timelineCircle: {
    alignItems: "center",
    backgroundColor: colors.surfaceDeep,
    borderRadius: radius.round,
    borderWidth: 1.5,
    height: 64,
    justifyContent: "center",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    width: 64,
  },
  timelineConnector: {
    alignSelf: "flex-start",
    borderColor: "rgba(246, 232, 200, 0.28)",
    borderStyle: "dotted",
    borderTopWidth: 2,
    marginTop: 67,
    width: 26,
  },
  timelineDate: {
    marginTop: spacing.sm,
  },
  timelineItem: {
    alignItems: "center",
    width: 104,
  },
  timelineItemGroup: {
    flexDirection: "row",
  },
  timelineLabel: {
    marginTop: spacing.xs,
  },
  timelineEllipsis: {
    flex: 1,
    marginHorizontal: spacing.xs,
    minWidth: TIMELINE_ELLIPSIS_MIN_WIDTH - spacing.xs * 2,
  },
  timelineTrack: {
    alignItems: "flex-start",
    flexDirection: "row",
    padding: spacing.lg,
  },
  zoomLabel: {
    left: LINE_Y_AXIS_WIDTH,
    letterSpacing: 1.6,
    position: "absolute",
    top: 0,
  },
  title: {
    textShadowColor: colors.primaryGlow,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  titleBlock: {
    flex: 1,
    paddingHorizontal: 18,
  },
  titleBlockCompact: {
    paddingHorizontal: spacing.sm,
  },
  titleCompact: {
    fontSize: fontSizes.cardTitle,
    lineHeight: lineHeights.cardTitle,
  },
});
