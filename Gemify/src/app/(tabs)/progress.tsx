import { Image } from "expo-image";
import { useState } from "react";
import {
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import Svg, { Line, Rect } from "react-native-svg";

import type { FulfillmentPoint } from "@/data/progressData";
import { useLayoutSize } from "@/hooks/useLayoutSize";
import { useProgressContent } from "@/hooks/useProgressContent";
import {
  AppText,
  Card,
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
const BAR_TOP_PAD = 12;
const CHART_Y_AXIS_WIDTH = 34;
const CHART_Y_AXIS_WIDTH_PHONE = 26;
const CHART_X_LABEL_HEIGHT = 26;
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
const WILL_ACHIEVE_ART = require("../../../assets/will-achieve.png");

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
  const barsTab =
    fulfillmentTabs.find((tab) => tab.chart === "bars") ?? fulfillmentTabs[0];
  const [goalPickerOpen, setGoalPickerOpen] = useState(false);
  const [rangeKey, setRangeKey] = useState(barsTab.ranges[0].key);
  const [rangePickerOpen, setRangePickerOpen] = useState(false);

  const selectedGoal =
    progressContent.goals.find((goal) => goal.key === goalKey) ??
    progressContent.goals[0];
  const barsRange =
    barsTab.ranges.find((range) => range.key === rangeKey) ?? barsTab.ranges[0];

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
            {barsRange.label}
          </AppText>
          <View style={rangePickerOpen ? styles.chevronOpen : null}>
            <ChevronIcon color={colors.textSecondary} size={16} strokeWidth={1.8} />
          </View>
        </Pressable>
        {rangePickerOpen ? (
          <View style={styles.rangeMenu}>
            {barsTab.ranges
              .filter((range) => range.key !== barsRange.key)
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
          {/* The finish date the current pace points at, over the
              destination art — the reason the charts below matter. */}
          <Card padded={false} style={styles.forecastCard} variant="glass">
            <View
              style={[styles.forecastCopy, phone && styles.forecastCopyPhone]}
            >
              <AppText variant={phone ? "pill" : "titleSm"}>
                {progressContent.forecast.headline}
              </AppText>
              <AppText
                color={colors.primary}
                style={styles.forecastDate}
                variant={phone ? "titleSm" : "cardTitle"}
              >
                {progressContent.forecast.date}
              </AppText>
            </View>
            <Image
              contentFit="cover"
              source={WILL_ACHIEVE_ART}
              style={[styles.forecastArt, phone && styles.forecastArtPhone]}
            />
          </Card>

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
                  // row instead of a centered column of three lines.
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
  /** Wide crop of the destination art (source is ~1.55:1) under the copy. */
  forecastArt: {
    aspectRatio: 1.7,
    width: "100%",
  },
  /** Shallower crop on a phone, so the banner never eats the first chart. */
  forecastArtPhone: {
    aspectRatio: 1.9,
  },
  /**
   * Opaque, art-matched ground: the artwork's dark sky dissolves into the
   * copy above it, so the banner reads as one image with a headline.
   */
  forecastCard: {
    backgroundColor: colors.background,
    borderColor: SECTION_BORDER,
    borderRadius: radius.md,
    overflow: "hidden",
  },
  forecastCopy: {
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  forecastCopyPhone: {
    paddingBottom: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  forecastDate: {
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
});
