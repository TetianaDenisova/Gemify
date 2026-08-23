import { Image } from "expo-image";
import { useState } from "react";
import { StyleSheet, View, useWindowDimensions } from "react-native";
import Svg, { Circle, Path, Rect } from "react-native-svg";

import type { TimelineIconKey, TimelineMoment } from "@/data/progressData";
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
import { colors } from "@/theme/colors";
import {
  fontSizes,
  fonts,
  layout,
  lineHeights,
  radius,
  shadowStyle,
  spacing,
  textGlow,
} from "@/theme/theme";
import { todayKey } from "@/utils/dates";

const TIMELINE_ITEM_WIDTH = 104;
const TIMELINE_CONNECTOR_WIDTH = 26;
const TIMELINE_ELLIPSIS_MIN_WIDTH = 34;

const MEMORIES_BACK = require("../../data/images/progress-map-img.png");

const goldTint = { glow: colors.primaryGlow, main: colors.primary };

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
  return (
    <View style={styles.timelineItem}>
      <View style={styles.timelineBadgeSlot}>
        {moment.locked ? (
          <View style={[styles.lockBubble, { borderColor: goldTint.main }]}>
            <LockGlyph color={goldTint.main} />
          </View>
        ) : null}
      </View>
      <View
        style={[
          styles.timelineCircle,
          { borderColor: goldTint.main },
          shadowStyle({ color: goldTint.main, opacity: 0.45, radius: 10 }),
        ]}
      >
        <TimelineGlyph color={goldTint.main} icon={moment.icon} />
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

export default function MemoriesScreen() {
  const { width } = useWindowDimensions();
  const compact = width < layout.compactBreakpoint;

  const [goalKey, setGoalKey] = useState("");
  const { content: progressContent, dreamId, refresh } =
    useProgressContent(goalKey);
  const [goalPickerOpen, setGoalPickerOpen] = useState(false);
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
            Memories
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

      <Card padded={false} style={styles.forecastCard} variant="glass">
        <Image
          contentFit="cover"
          source={MEMORIES_BACK}
          style={styles.forecastBackground}
        />
        <View style={styles.forecastCopy}>
          <AppText
            color={colors.textPrimary}
            style={styles.forecastHeadline}
            variant="bodySerif"
          >
            Your{" "}
            <AppText color={colors.primary} style={styles.forecastHeadline} variant="bodySerif">
              dream
            </AppText>{" "}
            is becoming your{" "}
            <AppText color={colors.primary} style={styles.forecastHeadline} variant="bodySerif">
              life
            </AppText>
            .
          </AppText>
          <AppText
            color={colors.textPrimary}
            style={styles.forecastSubline}
            variant="body"
          >
            Save the memories that show it’s already happening.
          </AppText>
          <Badge
            color={colors.primary}
            label={`${moments.length} ${moments.length === 1 ? "memory" : "memories"}`}
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
  content: {
    gap: spacing.md,
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
  forecastHeadline: {
    fontSize: fontSizes.xxl,
    lineHeight: lineHeights.xxxl,
  },
  forecastSubline: {
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.md,
    marginTop: spacing.sm,
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
  /** Serif pill/badge label, matching the pre-migration ETA/range pills. */
  serifPillLabel: {
    fontFamily: fonts.serif,
    fontSize: fontSizes.sm,
    fontWeight: "400",
    lineHeight: lineHeights.sm,
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
  timelineEllipsis: {
    flex: 1,
    marginHorizontal: spacing.xs,
    minWidth: TIMELINE_ELLIPSIS_MIN_WIDTH - spacing.xs * 2,
  },
  timelineEmpty: {
    flex: 1,
    paddingVertical: spacing.lg,
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
  timelineTrack: {
    alignItems: "flex-start",
    flexDirection: "row",
    padding: spacing.lg,
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
