import { useState } from "react";
import { ScrollView, StyleSheet, View, useWindowDimensions } from "react-native";
import Svg, { Circle, Path, Rect } from "react-native-svg";

import {
  progressAccentLayout,
  progressContent,
  type ProgressAccent,
  type StatIconKey,
  type TimelineIconKey,
} from "@/data/progressData";
import {
  AppText,
  Badge,
  Card,
  ChevronIcon,
  IconButton,
  ListItem,
  ScreenScaffold,
} from "@/shared/components";
import { colors } from "@/theme/colors";
import {
  fontSizes,
  fonts,
  layout,
  lineHeights,
  radius,
  shadows,
  spacing,
} from "@/theme/theme";

const BAR_MAX_HEIGHT = 150;
const BAR_MIN_HEIGHT = 52;

const accentTints: Record<ProgressAccent, { glow: string; main: string }> = {
  ember: { glow: "rgba(184, 92, 74, 0.4)", main: colors.danger },
  gold: { glow: colors.primaryGlow, main: colors.primary },
  pink: { glow: colors.accentPinkGlow, main: colors.accentPink },
  violet: { glow: colors.accentVioletGlow, main: colors.accentViolet },
};

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

function LockGlyph({ color = colors.danger, size = 16 }: { color?: string; size?: number }) {
  return (
    <Svg height={size} viewBox="0 0 24 24" width={size}>
      <Rect fill="none" height={8.5} rx={2} stroke={color} strokeWidth={1.6} width={11} x={6.5} y={10.5} />
      <Path d="M9 10.5V8a3 3 0 0 1 6 0v2.5" fill="none" stroke={color} strokeLinecap="round" strokeWidth={1.6} />
    </Svg>
  );
}

function CalendarGlyph({ color = colors.primary, size = 64 }: { color?: string; size?: number }) {
  return (
    <Svg height={size} viewBox="0 0 48 48" width={size}>
      <Rect fill="none" height={30} rx={5} stroke={color} strokeWidth={2.2} width={36} x={6} y={10} />
      <Path d="M15 5v9M33 5v9M6 20h36" fill="none" stroke={color} strokeLinecap="round" strokeWidth={2.2} />
      <Circle cx={15} cy={28} fill={color} r={1.9} />
      <Circle cx={24} cy={28} fill={color} r={1.9} />
      <Circle cx={15} cy={35} fill={color} r={1.9} />
      <Circle cx={24} cy={35} fill={color} r={1.9} />
      <Circle cx={33} cy={28} fill={color} r={1.9} />
    </Svg>
  );
}

/** Faint arc + winding trail echoing the journey-map art in the forecast card. */
function ForecastArt({ height, width }: { height: number; width: number }) {
  return (
    <Svg height={height} pointerEvents="none" viewBox="0 0 200 260" width={width}>
      <Circle cx={130} cy={92} fill="none" opacity={0.4} r={72} stroke={colors.primarySoft} strokeWidth={1.6} />
      <Path
        d="M148 62c-26 24 24 44-8 72s16 50-14 78c-16 15-34 26-52 34"
        fill="none"
        opacity={0.55}
        stroke={colors.primary}
        strokeDasharray="1 10"
        strokeLinecap="round"
        strokeWidth={4}
      />
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

function StatGlyph({ color = colors.primary, icon, size = 30 }: { color?: string; icon: StatIconKey; size?: number }) {
  const stroke = { fill: "none", stroke: color, strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 1.6 } as const;

  switch (icon) {
    case "check":
      return (
        <Svg height={size} viewBox="0 0 24 24" width={size}>
          <Circle cx={12} cy={12} r={9} {...stroke} />
          <Path d="m8 12.3 2.6 2.7L16 9.5" {...stroke} />
        </Svg>
      );
    case "flame":
      return (
        <Svg height={size} viewBox="0 0 24 24" width={size}>
          <Path
            d="M12 3c.6 3.4-3.5 5.4-3.5 9a5.5 5.5 0 0 0 11 0c0-2.2-1-4-2.4-5.6-.4 1.6-1.3 2.4-2.6 2.6C14.9 6.6 13.8 4.6 12 3Z"
            {...stroke}
          />
        </Svg>
      );
    case "trend":
      return (
        <Svg height={size} viewBox="0 0 24 24" width={size}>
          <Path d="m4 17 5-5 3 3 8-8M15 7h5v5" {...stroke} />
        </Svg>
      );
    case "calendar":
      return (
        <Svg height={size} viewBox="0 0 24 24" width={size}>
          <Rect height={15} rx={2.4} width={18} x={3} y={5} {...stroke} />
          <Path d="M7 3v4M17 3v4M3 10h18" {...stroke} />
          <Circle cx={8} cy={14} fill={color} r={1} />
          <Circle cx={12} cy={14} fill={color} r={1} />
          <Circle cx={16} cy={14} fill={color} r={1} />
        </Svg>
      );
    case "gift":
      return (
        <Svg height={size} viewBox="0 0 24 24" width={size}>
          <Rect height={9} rx={1.5} width={16} x={4} y={11} {...stroke} />
          <Path d="M3 8h18v3H3zM12 8v12" {...stroke} />
          <Path d="M12 8c-1.5-3.2-6-3.2-5.2-.4.6 2 3.6 1.4 5.2.4Zm0 0c1.5-3.2 6-3.2 5.2-.4-.6 2-3.6 1.4-5.2.4Z" {...stroke} />
        </Svg>
      );
  }
}

export default function ProgressScreen() {
  const { width } = useWindowDimensions();
  const compact = width < layout.compactBreakpoint;

  const { forecast } = progressContent;
  const [goalKey, setGoalKey] = useState(progressContent.goals[0].key);
  const [goalPickerOpen, setGoalPickerOpen] = useState(false);

  const selectedGoal =
    progressContent.goals.find((goal) => goal.key === goalKey) ??
    progressContent.goals[0];

  return (
    <ScreenScaffold contentStyle={styles.content} tabClearance topInset>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <View style={styles.headerTitleRow}>
            <AppText variant="screenTitle">{progressContent.title}</AppText>
            <SparkleGlyph />
          </View>
          <AppText
            color={colors.primarySoft}
            style={styles.headerSubtitle}
            variant="subtitle"
          >
            {progressContent.subtitle}
          </AppText>
        </View>
        <IconButton
          accessibilityLabel="More options"
          icon={<DotsGlyph />}
          onPress={() => {}}
          size="sm"
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

      <Card style={styles.forecastCard} variant="glass">
        <View style={styles.forecastArt}>
          <ForecastArt height={compact ? 200 : 260} width={compact ? 154 : 200} />
        </View>

        <AppText variant="cardTitle">{forecast.headline}</AppText>
        <AppText style={styles.forecastSubline} variant="body">
          {forecast.subline}
        </AppText>

        <View style={[styles.forecastDateRow, compact && styles.forecastDateRowCompact]}>
          <View style={styles.forecastCalendarFrame}>
            <CalendarGlyph size={compact ? 52 : 64} />
          </View>
          <View style={styles.forecastDateCopy}>
            <AppText color={colors.textPrimary} variant="body">
              {forecast.dateIntro}
            </AppText>
            <AppText
              color={colors.primary}
              style={[styles.forecastDate, compact && styles.forecastDateCompact]}
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
        </View>

        <View style={styles.timelineHeader}>
          <View style={styles.timelineTitleRow}>
            <ClockGlyph size={20} />
            <AppText style={styles.timelineTitle} variant="cardTitle">
              {progressContent.timelineTitle}
            </AppText>
          </View>
          <Badge
            color={colors.textPrimary}
            icon={<ChevronIcon color={colors.textSecondary} size={15} strokeWidth={1.8} />}
            label={selectedGoal.label}
            style={styles.rangePill}
            textStyle={styles.serifPillLabel}
          />
        </View>
        <AppText style={styles.timelineSubtitle} variant="body">
          {progressContent.timelineSubtitle}
        </AppText>

        <ScrollView
          contentContainerStyle={styles.timelineTrack}
          horizontal
          showsHorizontalScrollIndicator={false}
        >
          {progressContent.moments.map((moment, index) => {
            const tint = accentTints[progressAccentLayout.moments[moment.key] ?? "gold"];

            return (
              <View key={moment.key} style={styles.timelineItemGroup}>
                {index > 0 ? <View style={styles.timelineConnector} /> : null}
                <View style={[styles.timelineItem, moment.locked && styles.timelineItemLocked]}>
                  <View style={styles.timelineBadgeSlot}>
                    {moment.locked ? <LockGlyph color={tint.main} /> : null}
                  </View>
                  <View
                    style={[
                      styles.timelineCircle,
                      { borderColor: tint.main, shadowColor: tint.main },
                      moment.locked && styles.timelineCircleLocked,
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
              </View>
            );
          })}
        </ScrollView>
      </Card>

      <Card style={styles.fulfillmentCard} variant="glass">
        <View style={styles.timelineHeader}>
          <View style={styles.timelineTitleRow}>
            <StatGlyph icon="check" size={22} />
            <AppText style={styles.timelineTitle} variant="cardTitle">
              {progressContent.fulfillmentTitle}
            </AppText>
          </View>
          <Badge
            color={colors.textPrimary}
            icon={<ChevronIcon color={colors.textSecondary} size={15} strokeWidth={1.8} />}
            label={progressContent.rangeLabel}
            style={styles.rangePill}
            textStyle={styles.serifPillLabel}
          />
        </View>
        <AppText style={styles.timelineSubtitle} variant="body">
          {progressContent.fulfillmentSubtitle}
        </AppText>

        <View style={[styles.chartRow, compact && styles.chartRowCompact]}>
          <View style={styles.chartBars}>
            {progressContent.week.map((day) => {
              const tint = accentTints[progressAccentLayout.bars[day.key] ?? "violet"];
              const barHeight =
                BAR_MIN_HEIGHT + (day.percent / 100) * (BAR_MAX_HEIGHT - BAR_MIN_HEIGHT);

              return (
                <View key={day.key} style={styles.chartColumn}>
                  <AppText color={tint.main} style={styles.chartPercent} variant="pill">
                    {day.percent}%
                  </AppText>
                  <View
                    style={[
                      styles.chartCapsule,
                      { borderColor: tint.glow, height: barHeight },
                    ]}
                  >
                    <View
                      style={[
                        styles.chartFill,
                        {
                          backgroundColor: tint.main,
                          height: barHeight - 24,
                          shadowColor: tint.main,
                        },
                      ]}
                    />
                  </View>
                  <AppText color={colors.textSecondary} variant="caption">
                    {day.day}
                  </AppText>
                </View>
              );
            })}
          </View>
          <View style={[styles.chartDivider, compact && styles.chartDividerCompact]} />
          <View style={styles.chartAverage}>
            <AppText style={styles.chartAverageLabel} variant="subtitle">
              {progressContent.averageLabel}
            </AppText>
            <AppText color={colors.primary} style={styles.chartAverageValue}>
              {progressContent.averagePercent}%
            </AppText>
          </View>
        </View>
      </Card>

      <Card style={styles.statsCard} variant="glass">
        {progressContent.stats.map((stat) => (
          <View key={stat.key} style={styles.statItem}>
            <StatGlyph icon={stat.icon} />
            <View style={styles.statCopy}>
              <AppText color={colors.primarySoft} variant="caption">
                {stat.label}
              </AppText>
              <AppText color={colors.primary} style={styles.statValue}>
                {stat.value}
              </AppText>
            </View>
          </View>
        ))}
      </Card>
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  chartAverage: {
    alignItems: "center",
    justifyContent: "center",
    minWidth: 108,
  },
  chartAverageLabel: {
    color: colors.textPrimary,
    fontFamily: fonts.serif,
    fontSize: fontSizes.lg,
  },
  chartAverageValue: {
    fontFamily: fonts.serif,
    fontSize: 44,
    fontWeight: "500",
    lineHeight: 54,
    marginTop: spacing.xs,
  },
  chartBars: {
    alignItems: "flex-end",
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  chartCapsule: {
    alignItems: "center",
    borderRadius: radius.round,
    borderWidth: 1.5,
    justifyContent: "flex-end",
    paddingBottom: spacing.xs,
    width: 24,
  },
  chartColumn: {
    alignItems: "center",
    flex: 1,
    gap: spacing.sm,
  },
  chartDivider: {
    alignSelf: "stretch",
    backgroundColor: colors.borderSoft,
    marginHorizontal: spacing.md,
    width: 1,
  },
  chartDividerCompact: {
    marginHorizontal: spacing.sm,
  },
  chartFill: {
    borderRadius: radius.round,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.75,
    shadowRadius: 8,
    width: 14,
  },
  chartPercent: {
    fontSize: fontSizes.lg,
    lineHeight: lineHeights.lg,
  },
  chartRow: {
    flexDirection: "row",
    marginTop: spacing.lg,
  },
  chartRowCompact: {
    marginTop: spacing.md,
  },
  content: {
    gap: spacing.md,
  },
  etaPill: {
    borderColor: colors.border,
    marginTop: spacing.sm,
  },
  forecastArt: {
    bottom: 0,
    opacity: 0.85,
    position: "absolute",
    right: 0,
    top: 0,
  },
  forecastCalendarFrame: {
    alignItems: "center",
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1.4,
    height: 104,
    justifyContent: "center",
    width: 104,
    ...shadows.goldGlow,
    shadowOpacity: 0.2,
  },
  forecastCard: {
    overflow: "hidden",
  },
  forecastDate: {
    marginTop: spacing.xs,
  },
  forecastDateCompact: {
    fontSize: fontSizes.xxl + 2,
    lineHeight: lineHeights.xxl + 4,
  },
  forecastDateCopy: {
    flex: 1,
    minWidth: 0,
  },
  forecastDateRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.lg,
    marginTop: spacing.lg,
  },
  forecastDateRowCompact: {
    gap: spacing.md,
  },
  forecastSubline: {
    marginTop: spacing.xs,
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
  },
  header: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between",
  },
  headerCopy: {
    flex: 1,
  },
  headerSubtitle: {
    marginTop: spacing.xs,
  },
  headerTitleRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  rangePill: {
    borderColor: colors.borderSoft,
    flexDirection: "row-reverse",
  },
  /** Serif pill/badge label, matching the pre-migration ETA/range pills. */
  serifPillLabel: {
    fontFamily: fonts.serif,
    fontSize: fontSizes.sm,
    fontWeight: "400",
    lineHeight: lineHeights.sm,
  },
  statCopy: {
    minWidth: 0,
  },
  statItem: {
    alignItems: "center",
    flexDirection: "row",
    flexGrow: 1,
    gap: spacing.md,
    minWidth: 150,
  },
  statValue: {
    fontFamily: fonts.serif,
    fontSize: fontSizes.xxl,
    fontWeight: "500",
    lineHeight: lineHeights.xxl,
    marginTop: 2,
  },
  statsCard: {
    columnGap: spacing.lg,
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: spacing.md,
  },
  timelineBadgeSlot: {
    alignItems: "center",
    height: 20,
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
  timelineCircleLocked: {
    shadowOpacity: 0.15,
  },
  timelineConnector: {
    alignSelf: "flex-start",
    borderColor: "rgba(246, 232, 200, 0.28)",
    borderStyle: "dotted",
    borderTopWidth: 2,
    marginTop: 56,
    width: 26,
  },
  timelineDate: {
    fontSize: fontSizes.lg,
    lineHeight: lineHeights.lg,
    marginTop: spacing.sm,
  },
  timelineHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between",
    marginTop: spacing.xl,
  },
  timelineItem: {
    alignItems: "center",
    width: 104,
  },
  timelineItemGroup: {
    flexDirection: "row",
  },
  timelineItemLocked: {
    opacity: 0.8,
  },
  timelineLabel: {
    marginTop: spacing.xs,
  },
  timelineSubtitle: {
    marginTop: spacing.xs,
  },
  timelineTitle: {
    fontSize: fontSizes.xxl + 2,
    lineHeight: lineHeights.xxl + 4,
  },
  timelineTitleRow: {
    alignItems: "center",
    flexDirection: "row",
    flexShrink: 1,
    gap: spacing.sm,
  },
  timelineTrack: {
    paddingBottom: spacing.xs,
    paddingTop: spacing.md,
  },
});
