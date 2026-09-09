import { Image } from "expo-image";
import { LinearGradient as ExpoLinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import {
  Pressable,
  StyleSheet,
  View,
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

import type { FulfillmentPoint } from "@/data/progressData";
import { useLayoutSize } from "@/hooks/useLayoutSize";
import { useProgressContent } from "@/hooks/useProgressContent";
import {
  AppText,
  Card,
  CheckIcon,
  ChevronIcon,
  ListItem,
  ScreenScaffold,
  SparkleGlyphIcon,
} from "@/shared/components";
import { colors } from "@/theme/colors";
import {
  controlsPhone,
  fontSizes,
  fonts,
  layout,
  lineHeights,
  pressed,
  radius,
  shadows,
  spacing,
  textGlow,
} from "@/theme/theme";

const CHART_PLOT_HEIGHT = 150;
/** Shorter plot on the phone tier — the cards below still have to fit. */
const CHART_PLOT_HEIGHT_PHONE = 120;
/** Headroom above the line chart for the endpoint percent labels. */
const LINE_TOP_PAD = 44;
/** Gap between the lowest dot and the baseline, so dots never touch the axis. */
const LINE_BOTTOM_INSET = 18;
const BAR_TOP_PAD = 12;
const CHART_Y_AXIS_WIDTH = 34;
const CHART_Y_AXIS_WIDTH_PHONE = 26;
const CHART_X_LABEL_HEIGHT = 26;
/** Taller label band for the line chart so labels clear the pink baseline. */
const LINE_X_LABEL_HEIGHT = 36;
const CHART_POINT_INSET = 14;
const CHART_Y_TICKS = [100, 75, 50, 25, 0] as const;
/** Every other gridline on a phone: density, not removal. */
const CHART_Y_TICKS_PHONE = [100, 50, 0] as const;

const BAR_MAX_WIDTH = 34;
const BAR_MAX_WIDTH_PHONE = 24;
/** Muted navy pill track shown for every day, even when progress is 0%. */
const BAR_TRACK_FILL = "rgba(133, 149, 199, 0.18)";
const BAR_AXIS_STROKE = "rgba(246, 232, 200, 0.32)";
const CHART_GRID_STROKE = "rgba(246, 232, 200, 0.13)";
const SECTION_BORDER = "rgba(183, 140, 255, 0.58)";
const SECTION_SURFACE = "rgba(5, 10, 25, 0.86)";

const NO_PROGRESS_ART = require("../../data/images/no-progress.png");

/** Catmull-Rom → cubic bezier, so the trend line flows instead of kinking. */
function smoothLinePath(dots: readonly { x: number; y: number }[]) {
  if (dots.length === 0) return "";
  let path = `M ${dots[0].x} ${dots[0].y}`;
  for (let i = 0; i < dots.length - 1; i += 1) {
    const p0 = dots[i - 1] ?? dots[i];
    const p1 = dots[i];
    const p2 = dots[i + 1];
    const p3 = dots[i + 2] ?? p2;
    // Clamp control points to the segment's y-range so the curve never
    // overshoots past a flat run (e.g. dipping under the baseline).
    const yLo = Math.min(p1.y, p2.y);
    const yHi = Math.max(p1.y, p2.y);
    const clampY = (y: number) => Math.min(yHi, Math.max(yLo, y));
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = clampY(p1.y + (p2.y - p0.y) / 6);
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = clampY(p2.y - (p3.y - p1.y) / 6);
    path += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`;
  }
  return path;
}

/** Keep the first/last labels inside the plot: left/right-align at the edges. */
function labelLeftFor(x: number, index: number, count: number) {
  if (index === 0) return x - 4;
  if (index === count - 1) return x - 52;
  return x - 28;
}

function labelAlignFor(index: number, count: number): "center" | "left" | "right" {
  if (index === 0) return "left";
  if (index === count - 1) return "right";
  return "center";
}

function FulfillmentChart({
  compact,
  phone,
  points,
}: {
  compact: boolean;
  phone: boolean;
  points: readonly FulfillmentPoint[];
}) {
  const [chartWidth, setChartWidth] = useState(0);

  const plotHeight = phone ? CHART_PLOT_HEIGHT_PHONE : CHART_PLOT_HEIGHT;
  const svgHeight = LINE_TOP_PAD + plotHeight + 8;

  const values = points.map((point) => point.percent);
  const maxValue = Math.max(...values);
  const minValue = Math.min(...values);
  // Zoom the y-domain to the data so the trend fills the plot: the lowest
  // point sits just above the baseline, the highest just under the dotted
  // guide — instead of squashing everything into a fixed 0–100 scale.
  const span = Math.max(maxValue - minValue, 4);
  const domainLo = Math.max(0, minValue - span * 0.3);
  const domainHi = maxValue + span * 0.25;

  const yFor = (percent: number) =>
    LINE_TOP_PAD +
    (1 - (percent - domainLo) / (domainHi - domainLo)) *
      (plotHeight - LINE_BOTTOM_INSET);

  const startX = CHART_POINT_INSET;
  const endX = chartWidth - CHART_POINT_INSET;
  const step = points.length > 1 ? (endX - startX) / (points.length - 1) : 0;

  const dots = points.map((point, index) => ({
    ...point,
    x: startX + index * step,
    y: yFor(point.percent),
  }));
  const firstDot = dots[0];
  const lastDot = dots[dots.length - 1];

  const baselineY = LINE_TOP_PAD + plotHeight;
  const guideY = yFor(maxValue) - 12;
  const linePath = dots.length > 1 ? smoothLinePath(dots) : "";
  const areaPath =
    linePath
      ? `${linePath} L ${lastDot.x} ${baselineY} L ${firstDot.x} ${baselineY} Z`
      : "";

  return (
    <View
      onLayout={(event) => setChartWidth(event.nativeEvent.layout.width)}
      style={[
        styles.chartCanvas,
        styles.lineCanvas,
        phone && styles.lineCanvasPhone,
      ]}
    >
      {chartWidth > 0 ? (
        <>
          <Svg height={svgHeight} width={chartWidth}>
            <Defs>
              <LinearGradient id="fulfillmentArea" x1="0" x2="0" y1="0" y2="1">
                <Stop offset="0" stopColor={colors.accentViolet} stopOpacity={0.4} />
                <Stop offset="1" stopColor={colors.accentViolet} stopOpacity={0.04} />
              </LinearGradient>
            </Defs>
            <Line
              stroke={CHART_GRID_STROKE}
              strokeDasharray="2 6"
              strokeLinecap="round"
              strokeWidth={1}
              x1={4}
              x2={chartWidth - 4}
              y1={guideY}
              y2={guideY}
            />
            {areaPath ? <Path d={areaPath} fill="url(#fulfillmentArea)" /> : null}
            <Line
              stroke={colors.accentPink}
              strokeOpacity={0.55}
              strokeWidth={1.6}
              x1={0}
              x2={chartWidth}
              y1={baselineY}
              y2={baselineY}
            />
            {linePath ? (
              <Path
                d={linePath}
                fill="none"
                opacity={0.25}
                stroke={colors.accentPink}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={7}
              />
            ) : null}
            {linePath ? (
              <Path
                d={linePath}
                fill="none"
                stroke={colors.accentPink}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.6}
              />
            ) : null}
            {dots.map((dot) => (
              <Circle
                cx={dot.x}
                cy={dot.y}
                fill={colors.accentViolet}
                key={`glow-${dot.key}`}
                opacity={0.4}
                r={8}
              />
            ))}
            {dots.map((dot) => (
              <Circle
                cx={dot.x}
                cy={dot.y}
                fill={colors.textPrimary}
                key={`dot-${dot.key}`}
                r={3.4}
              />
            ))}
          </Svg>
          {[firstDot, ...(dots.length > 1 ? [lastDot] : [])].map((dot, i) => {
            const index = i === 0 ? 0 : dots.length - 1;
            return (
              <AppText
                align={labelAlignFor(index, dots.length)}
                color={index === 0 ? colors.textPrimary : colors.accentPink}
                key={`percent-${dot.key}`}
                style={[
                  styles.chartPointLabel,
                  compact && styles.chartPointLabelCompact,
                  {
                    left: labelLeftFor(dot.x, index, dots.length),
                    top: dot.y - 34,
                  },
                ]}
              >
                {Math.round(dot.percent)}%
              </AppText>
            );
          })}
          {dots.map((dot, index) => (
            <AppText
              align={labelAlignFor(index, dots.length)}
              color={colors.textSecondary}
              key={`label-${dot.key}`}
              style={[
                styles.lineAxisLabel,
                phone && styles.lineAxisLabelPhone,
                { left: labelLeftFor(dot.x, index, dots.length) },
              ]}
            >
              {dot.label}
            </AppText>
          ))}
        </>
      ) : null}
    </View>
  );
}

function QuestBarsChart({
  compact,
  phone,
  points,
}: {
  compact: boolean;
  phone: boolean;
  points: readonly FulfillmentPoint[];
}) {
  const [chartWidth, setChartWidth] = useState(0);

  const plotHeight = phone ? CHART_PLOT_HEIGHT_PHONE : CHART_PLOT_HEIGHT;
  const axisWidth = phone ? CHART_Y_AXIS_WIDTH_PHONE : CHART_Y_AXIS_WIDTH;
  const ticks = phone ? CHART_Y_TICKS_PHONE : CHART_Y_TICKS;
  const svgHeight = BAR_TOP_PAD + plotHeight + 8;
  const yFor = (percent: number) =>
    BAR_TOP_PAD + (1 - percent / 100) * plotHeight;

  const plotLeft = axisWidth + 6;
  const slot = points.length > 0 ? (chartWidth - plotLeft) / points.length : 0;
  // Seven slots share ~330 pt on a phone: a 72 pt label box would sit under
  // its neighbours, so the label never gets wider than its own slot.
  const axisLabelWidth = phone ? Math.max(32, Math.min(72, slot)) : 72;
  const valueLabelWidth = phone ? Math.max(30, Math.min(64, slot)) : 64;
  const barWidth = Math.max(
    14,
    Math.min(
      phone ? BAR_MAX_WIDTH_PHONE : compact ? 26 : BAR_MAX_WIDTH,
      slot * 0.45,
    ),
  );

  const bars = points.map((point, index) => ({
    ...point,
    center: plotLeft + slot * (index + 0.5),
    fillHeight: yFor(0) - yFor(point.percent),
    top: yFor(point.percent),
  }));

  return (
    <View
      onLayout={(event) => setChartWidth(event.nativeEvent.layout.width)}
      style={[
        styles.chartCanvas,
        styles.barsCanvas,
        phone && styles.barsCanvasPhone,
      ]}
    >
      {chartWidth > 0 ? (
        <>
          <Svg height={svgHeight} width={chartWidth}>
            <Line
              stroke={BAR_AXIS_STROKE}
              strokeWidth={1.2}
              x1={axisWidth}
              x2={axisWidth}
              y1={yFor(100)}
              y2={yFor(0)}
            />
            {ticks
              .filter((tick) => tick > 0)
              .map((tick) => (
                <Line
                  key={tick}
                  stroke={CHART_GRID_STROKE}
                  strokeDasharray="2 7"
                  strokeLinecap="round"
                  strokeWidth={1}
                  x1={axisWidth}
                  x2={chartWidth}
                  y1={yFor(tick)}
                  y2={yFor(tick)}
                />
              ))}
            <Line
              stroke={BAR_AXIS_STROKE}
              strokeWidth={1.2}
              x1={axisWidth}
              x2={chartWidth}
              y1={yFor(0)}
              y2={yFor(0)}
            />
            {bars.map((bar) => (
              <Rect
                fill={BAR_TRACK_FILL}
                height={plotHeight}
                key={`track-${bar.key}`}
                rx={barWidth / 2}
                width={barWidth}
                x={bar.center - barWidth / 2}
                y={yFor(100)}
              />
            ))}
            {bars
              .filter((bar) => bar.fillHeight > 0)
              .map((bar) => (
                <Rect
                  fill={colors.accentPink}
                  height={bar.fillHeight}
                  key={`fill-${bar.key}`}
                  rx={Math.min(barWidth / 2, bar.fillHeight / 2)}
                  width={barWidth}
                  x={bar.center - barWidth / 2}
                  y={bar.top}
                />
              ))}
          </Svg>
          {bars
            .filter((bar) => bar.fillHeight > 0)
            .map((bar) => {
              const labelInside = bar.fillHeight >= 30;
              return (
                <AppText
                  align="center"
                  color={labelInside ? colors.textPrimary : colors.accentPink}
                  key={`percent-${bar.key}`}
                  style={[
                    styles.barPercentLabel,
                    compact && styles.barPercentLabelCompact,
                    {
                      left: bar.center - valueLabelWidth / 2,
                      top: labelInside ? bar.top + 8 : bar.top - 20,
                      width: valueLabelWidth,
                    },
                  ]}
                >
                  {Math.round(bar.percent)}%
                </AppText>
              );
            })}
          {ticks.map((tick) => (
            <AppText
              color={colors.textMuted}
              key={`tick-${tick}`}
              style={[
                styles.chartTickLabel,
                phone && styles.chartTickLabelPhone,
                { top: yFor(tick) - 7 },
              ]}
              variant="caption"
            >
              {tick}%
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
                { left: bar.center - axisLabelWidth / 2, width: axisLabelWidth },
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

export default function ProgressScreen() {
  const { compact, phone, width } = useLayoutSize();

  const [goalKey, setGoalKey] = useState("");
  const { content: progressContent } = useProgressContent(goalKey);
  const { fulfillmentTabs } = progressContent;
  const lineTab =
    fulfillmentTabs.find((tab) => tab.chart === "line") ?? fulfillmentTabs[0];
  const barsTab = fulfillmentTabs.find((tab) => tab.chart === "bars");
  const [goalPickerOpen, setGoalPickerOpen] = useState(false);
  const [rangeKey, setRangeKey] = useState(lineTab.ranges[0].key);
  const [rangePickerOpen, setRangePickerOpen] = useState(false);

  const selectedGoal =
    progressContent.goals.find((goal) => goal.key === goalKey) ??
    progressContent.goals[0];
  const lineRange =
    lineTab.ranges.find((range) => range.key === rangeKey) ?? lineTab.ranges[0];
  const barsRange =
    barsTab?.ranges.find((range) => range.key === rangeKey) ??
    barsTab?.ranges[0];
  const currentPercent =
    lineRange.points[lineRange.points.length - 1].percent;

  const goalPicker = (
    <Card
      padded={false}
      style={[styles.goalPicker, phone && styles.goalPickerPhone]}
      variant="glass"
    >
      <ListItem
        accessibilityLabel="Choose goal"
        last
        leading={<SparkleGlyphIcon size={18} />}
        minHeight={phone ? controlsPhone.button.section.minHeight : undefined}
        onPress={() => setGoalPickerOpen((open) => !open)}
        style={[styles.goalPickerRow, phone && styles.goalPickerRowPhone]}
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
                minHeight={
                  phone ? controlsPhone.button.section.minHeight : undefined
                }
                onPress={() => {
                  setGoalKey(goal.key);
                  setGoalPickerOpen(false);
                }}
                style={[styles.goalOption, phone && styles.goalPickerRowPhone]}
                title={goal.label}
                titleColor={colors.textSecondary}
              />
            ))
        : null}
    </Card>
  );

  const rangePicker = (
    <View style={[styles.overviewRow, phone && styles.overviewRowPhone]}>
      {/* Each chart card below carries its own title; dropping this gives
          the range picker a full-width row of its own. */}
      {phone ? null : (
        <AppText color={colors.accentViolet} variant="bodySerif">
          Progress overview
        </AppText>
      )}
      <View>
        <Pressable
          accessibilityLabel="Choose range"
          accessibilityRole="button"
          onPress={() => setRangePickerOpen((open) => !open)}
          style={({ pressed: isPressed }) => [
            styles.rangeTrigger,
            compact && { width: Math.min(228, width * 0.45) },
            phone && styles.rangeTriggerPhone,
            phone && { width: Math.min(150, width * 0.42) },
            isPressed && pressed,
          ]}
        >
          <AppText
            numberOfLines={1}
            style={[styles.rangeLabel, phone && styles.rangeLabelPhone]}
            variant="pill"
          >
            {lineRange.label}
          </AppText>
          <View style={rangePickerOpen ? styles.chevronOpen : null}>
            <ChevronIcon color={colors.textSecondary} size={16} strokeWidth={1.8} />
          </View>
        </Pressable>
        {rangePickerOpen ? (
          <View style={styles.rangeMenu}>
            {lineTab.ranges
              .filter((range) => range.key !== lineRange.key)
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
  );

  return (
    <ScreenScaffold contentStyle={styles.content} tabClearance topInset>
      <View
        style={[
          styles.header,
          compact && styles.headerCompact,
          phone && styles.headerPhone,
        ]}
      >
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
      </View>

      {/* Two full-width selector cards eat a third of a phone screen before
          any data shows — side by side they cost one row. */}
      {phone ? (
        <View style={styles.selectorRowPhone}>
          {goalPicker}
          {rangePicker}
        </View>
      ) : (
        <>
          {goalPicker}
          {rangePicker}
        </>
      )}

      {!progressContent.hasChartData ? (
        <Card style={styles.sectionCard} variant="glass">
          <View
            style={[styles.emptyState, compact && styles.emptyStateCompact]}
          >
            <Image
              contentFit="contain"
              source={NO_PROGRESS_ART}
              style={[
                styles.emptyArt,
                compact && styles.emptyArtCompact,
                phone && styles.emptyArtPhone,
              ]}
            />
            <AppText
              align="center"
              style={styles.emptyTitle}
              variant="screenTitle"
            >
              Your journey starts here
            </AppText>
            <AppText
              align="center"
              color={colors.textSecondary}
              style={styles.emptyCaption}
              variant="body"
            >
              Complete your first quest to reveal your progress.
            </AppText>
          </View>
        </Card>
      ) : (
        <>
          <Card style={styles.sectionCard} variant="glass">
            <AppText style={styles.cardTitle} variant="title">{lineTab.label}</AppText>
            {lineRange.highlight ? (
              <View style={styles.highlightRow}>
                <View style={styles.highlightMain}>
                  <AppText color={colors.accentPink} variant="eyebrow">
                    {lineRange.highlight.eyebrow}
                  </AppText>
                  <AppText color={colors.accentPink} variant="labelStrong">
                    {`${lineRange.highlight.delta > 0 ? "+" : ""}${lineRange.highlight.delta}%`}
                  </AppText>
                  {/* The eyebrow and the delta beside it carry the fact. */}
                  {phone ? null : (
                    <AppText color={colors.textSecondary} variant="caption">
                      {lineRange.highlight.caption}
                    </AppText>
                  )}
                </View>
                <View style={styles.highlightTasks}>
                  <View style={styles.checkBubble}>
                    <CheckIcon
                      color={colors.accentViolet}
                      size={13}
                      strokeWidth={2.2}
                    />
                  </View>
                  <AppText color={colors.textPrimary} style={styles.tasksLabel} variant="caption">
                    {lineRange.highlight.tasksLabel}
                  </AppText>
                </View>
              </View>
            ) : null}
            <FulfillmentChart
              compact={compact}
              phone={phone}
              points={lineRange.points}
            />
            <View style={styles.overallHeader}>
              <AppText variant="eyebrow">{progressContent.overallLabel}</AppText>
              <AppText style={styles.overallPercent} variant="title">{Math.round(currentPercent)}%</AppText>
            </View>
            <View style={styles.overallTrack}>
              <ExpoLinearGradient
                colors={[colors.accentVioletStrong, colors.accentViolet]}
                end={{ x: 1, y: 0 }}
                start={{ x: 0, y: 0 }}
                style={[styles.overallFill, { width: `${currentPercent}%` }]}
              />
            </View>
          </Card>

          {barsTab && barsRange ? (
            <Card style={styles.sectionCard} variant="glass">
              <AppText style={styles.cardTitle} variant="title">{barsTab.label}</AppText>
              <View
                style={[
                  styles.chartRow,
                  compact && styles.chartRowCompact,
                  phone && styles.chartRowPhone,
                ]}
              >
                <QuestBarsChart
                  compact={compact}
                  phone={phone}
                  points={barsRange.points}
                />
                {barsRange.summary ? (
                  phone ? (
                    // Stacked under the bars, the average reads as a footer
                    // row — the same shape as the goal card's overall bar —
                    // instead of a centered column of three lines.
                    <View style={styles.summaryFooterPhone}>
                      <View style={styles.summaryFooterRowPhone}>
                        <AppText numberOfLines={1} style={styles.summaryEyebrowPhone} variant="eyebrow">
                          {barsRange.summary.eyebrow}
                        </AppText>
                        <AppText
                          color={colors.accentPink}
                          style={styles.summaryPercentPhone}
                          variant="title"
                        >
                          {barsRange.summary.percent}%
                        </AppText>
                      </View>
                      <AppText color={colors.textSecondary} variant="bodySmall">
                        {barsRange.summary.caption}
                      </AppText>
                    </View>
                  ) : (
                    <>
                      <View style={styles.panelDivider} />
                      <View
                        style={[
                          styles.summaryPanel,
                          compact && styles.summaryPanelCompact,
                        ]}
                      >
                        <AppText align="center" variant="eyebrow">
                          {barsRange.summary.eyebrow}
                        </AppText>
                        <AppText
                          color={colors.accentPink}
                          style={[
                            styles.summaryValue,
                            compact && styles.summaryValueCompact,
                          ]}
                          variant="stat"
                        >
                          {barsRange.summary.percent}%
                        </AppText>
                        <AppText
                          align="center"
                          color={colors.textPrimary}
                          style={styles.summaryCaption}
                          variant="body"
                        >
                          {barsRange.summary.caption}
                        </AppText>
                      </View>
                    </>
                  )
                ) : null}
              </View>
            </Card>
          ) : null}
        </>
      )}
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
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
  barsCanvas: {
    height: BAR_TOP_PAD + CHART_PLOT_HEIGHT + CHART_X_LABEL_HEIGHT,
  },
  /**
   * Stacked in a column (chartRowPhone), the inherited `flex: 1` would resolve
   * flexBasis to 0 and collapse the plot — same guard as lineCanvas.
   */
  barsCanvasPhone: {
    flexBasis: "auto",
    flexGrow: 0,
    flexShrink: 0,
    height: BAR_TOP_PAD + CHART_PLOT_HEIGHT_PHONE + CHART_X_LABEL_HEIGHT,
  },
  barPercentLabel: {
    fontSize: fontSizes.sm,
    fontWeight: "700",
    lineHeight: lineHeights.sm,
    position: "absolute",
    width: 64,
  },
  barPercentLabelCompact: {
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.xs,
  },
  cardTitle: {
    fontSize: fontSizes.xxl,
    fontWeight: "500",
    lineHeight: lineHeights.xxl,
  },
  chartCanvas: {
    flex: 1,
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
  chartTickLabelPhone: {
    width: CHART_Y_AXIS_WIDTH_PHONE - 6,
  },
  chartRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  chartRowCompact: {
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  /** 370 pt minus a 96 pt summary panel leaves the bars ~250 pt — stack. */
  chartRowPhone: {
    flexDirection: "column",
  },
  checkBubble: {
    alignItems: "center",
    borderColor: colors.accentViolet,
    borderRadius: radius.round,
    borderWidth: 1.4,
    height: 26,
    justifyContent: "center",
    width: 26,
  },
  chevronOpen: {
    transform: [{ rotate: "180deg" }],
  },
  content: {
    gap: spacing.md,
  },
  emptyArt: {
    aspectRatio: 3 / 2,
    maxWidth: 360,
    width: "78%",
  },
  emptyArtCompact: {
    width: "88%",
  },
  emptyArtPhone: {
    maxWidth: 220,
    width: "70%",
  },
  emptyCaption: {
    marginTop: spacing.sm,
    maxWidth: 320,
  },
  emptyState: {
    alignItems: "center",
    marginTop: spacing.lg,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  emptyStateCompact: {
    marginTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  emptyTitle: {
    marginTop: spacing.lg,
    ...textGlow(colors.primaryGlow, 12),
  },
  goalOption: {
    borderTopColor: colors.borderSoft,
    borderTopWidth: 1,
    paddingHorizontal: spacing.md,
  },
  goalPicker: {
    backgroundColor: colors.surfaceDeep,
    borderColor: colors.borderFaint,
    borderRadius: radius.md,
    overflow: "hidden",
  },
  /** Half of a shared row, so the card sizes to what is left of the pill. */
  goalPickerPhone: {
    flex: 1,
    minWidth: 0,
  },
  goalPickerRow: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  /** ~200 pt of row: the sparkle, chevron and gaps take all they can spare. */
  goalPickerRowPhone: {
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
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
  /** The title is the only thing in this row — it needs no 72 pt band. */
  headerPhone: {
    minHeight: 52,
  },
  highlightMain: {
    alignItems: "center",
    flexDirection: "row",
    flexShrink: 1,
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  highlightRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between",
    marginTop: spacing.md,
  },
  highlightTasks: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  lineAxisLabel: {
    fontSize: fontSizes.md,
    fontWeight: "600",
    lineHeight: lineHeights.md,
    position: "absolute",
    // Anchored below the baseline from the top, so a collapsed canvas
    // height can never push the labels up into the axis line.
    top: LINE_TOP_PAD + CHART_PLOT_HEIGHT + 12,
    width: 56,
  },
  lineAxisLabelPhone: {
    top: LINE_TOP_PAD + CHART_PLOT_HEIGHT_PHONE + 12,
  },
  lineCanvas: {
    flexBasis: "auto",
    flexGrow: 0,
    flexShrink: 0,
    height: LINE_TOP_PAD + CHART_PLOT_HEIGHT + LINE_X_LABEL_HEIGHT,
    marginTop: spacing.md,
  },
  lineCanvasPhone: {
    height: LINE_TOP_PAD + CHART_PLOT_HEIGHT_PHONE + LINE_X_LABEL_HEIGHT,
  },
  overallFill: {
    borderRadius: radius.round,
    height: "100%",
  },
  overallHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.md,
  },
  overallPercent: {
    fontSize: fontSizes.xxxl,
    lineHeight: lineHeights.xxxl,
  },
  overallTrack: {
    backgroundColor: colors.surfaceDeep,
    borderColor: colors.borderSoft,
    borderRadius: radius.round,
    borderWidth: 1,
    height: 10,
    marginTop: spacing.sm,
    overflow: "hidden",
  },
  overviewRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between",
    zIndex: 20,
  },
  overviewRowPhone: {
    justifyContent: "flex-end",
  },
  panelDivider: {
    alignSelf: "stretch",
    backgroundColor: "rgba(133, 149, 199, 0.46)",
    width: 1,
  },
  rangeLabel: {
    fontFamily: fonts.serif,
    fontSize: fontSizes.lg,
    fontWeight: "400",
    lineHeight: lineHeights.lg,
  },
  /** "This week" has to fit beside a chevron in ~150 pt. */
  rangeLabelPhone: {
    flexShrink: 1,
    fontSize: fontSizes.md,
    lineHeight: lineHeights.md,
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
    borderRadius: radius.round,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "space-between",
    minHeight: layout.minTouchTarget,
    minWidth: 150,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
  },
  rangeTriggerPhone: {
    gap: spacing.xs,
    minHeight: controlsPhone.button.section.minHeight,
    minWidth: 0,
    paddingHorizontal: spacing.md,
  },
  sectionCard: {
    backgroundColor: SECTION_SURFACE,
    borderColor: SECTION_BORDER,
    borderRadius: radius.md,
  },
  /**
   * Goal card and range pill share one row. Top-aligned so the goal card can
   * grow downward with its open option list without stretching the pill.
   */
  selectorRowPhone: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.sm,
    zIndex: 20,
  },
  summaryCaption: {
    marginTop: spacing.sm,
  },
  /** Gold label of the phone average row — yields to the percent beside it. */
  summaryEyebrowPhone: {
    flexShrink: 1,
  },
  /** Hairline above the average, in place of the tablet's vertical rule. */
  summaryFooterPhone: {
    borderTopColor: colors.divider,
    borderTopWidth: 1,
    marginTop: spacing.md,
    paddingTop: spacing.md,
  },
  summaryFooterRowPhone: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "space-between",
    marginBottom: spacing.xs,
  },
  /** Matches the goal card's overall percent, so the two cards rhyme. */
  summaryPercentPhone: {
    fontSize: fontSizes.xxxl,
    lineHeight: lineHeights.xxxl,
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
    marginTop: spacing.xs,
  },
  summaryValueCompact: {
    fontSize: fontSizes.screenTitle,
    lineHeight: lineHeights.screenTitle,
  },
  title: {
    ...textGlow(colors.primaryGlow, 12),
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
  tasksLabel: {
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
  },
});
