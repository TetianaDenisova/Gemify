import { useEffect, useMemo, useState } from "react";
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle, Line, Path, Rect } from "react-native-svg";
import Animated, {
  cancelAnimation,
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useRouter } from "expo-router";

import { JourneyMapControls } from "@/components/JourneyMapControls";
import { JourneyMapScroll } from "@/components/JourneyMapScroll";
import {
  JourneyMilestone,
  type JourneyMilestonePosition,
} from "@/components/JourneyMilestone";
import {
  journeyMilestones,
  type JourneyMilestoneData,
} from "@/data/journeyMilestones";
import { journeyPageConfigs } from "@/data/journeyPageConfig";
import {
  getMilestoneRingY,
  paginateMilestones,
} from "@/utils/milestonePagination";
import { colors } from "@/theme/colors";
import { gradients, radius, shadows, typography } from "@/theme/theme";

type MilestoneModalProps = {
  milestone: JourneyMilestoneData | null;
  onClose: () => void;
  onOpenQuests: () => void;
};

const JOURNEY_MAP_SOURCE = require("../../assets/journey-top/level2.png");
const MILESTONE_DOOR_SOURCE = require("../../assets/create-goal/milestone-door.png");
const SHIMMER_DURATION = 2200;
const SHIMMER_PAUSE = 2500;

function QuestButtonShimmer() {
  const [buttonWidth, setButtonWidth] = useState(0);
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withSequence(
        withTiming(1, {
          duration: SHIMMER_DURATION,
          easing: Easing.inOut(Easing.cubic),
        }),
        withDelay(SHIMMER_PAUSE, withTiming(0, { duration: 0 })),
      ),
      -1,
      false,
    );

    return () => cancelAnimation(progress);
  }, [progress]);

  const streakWidth = buttonWidth * 0.26;
  const travelStart = -streakWidth * 1.6;
  const travelEnd = buttonWidth + streakWidth * 0.6;

  const bloomStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      progress.value,
      [0, 0.08, 0.82, 1],
      [0, 0.2, 0.2, 0],
    ),
    transform: [
      {
        translateX:
          interpolate(progress.value, [0, 1], [travelStart, travelEnd]) -
          streakWidth * 0.18,
      },
      { rotate: "-24deg" },
    ],
  }));

  const streakStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      progress.value,
      [0, 0.08, 0.88, 1],
      [0, 0.62, 0.62, 0],
    ),
    transform: [
      {
        translateX: interpolate(
          progress.value,
          [0, 1],
          [travelStart, travelEnd],
        ),
      },
      { rotate: "-24deg" },
    ],
  }));

  return (
    <View
      onLayout={({ nativeEvent }) =>
        setButtonWidth(nativeEvent.layout.width)
      }
      pointerEvents="none"
      style={styles.shimmerClip}
    >
      {buttonWidth > 0 ? (
        <>
          <Animated.View
            style={[
              styles.shimmerBloom,
              { width: streakWidth * 1.45 },
              bloomStyle,
            ]}
          >
            <LinearGradient
              colors={gradients.shimmer}
              end={{ x: 1, y: 0.5 }}
              locations={[0, 0.35, 0.56, 1]}
              start={{ x: 0, y: 0.5 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>

          <Animated.View
            style={[styles.shimmerStreak, { width: streakWidth }, streakStyle]}
          >
            <LinearGradient
              colors={[
                colors.transparent,
                colors.overlayLight,
                colors.primaryGlow,
                colors.overlayLight,
                colors.transparent,
              ]}
              end={{ x: 1, y: 0.5 }}
              locations={[0, 0.28, 0.5, 0.72, 1]}
              start={{ x: 0, y: 0.5 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        </>
      ) : null}
    </View>
  );
}

type MilestoneDetailIconName = "artifact" | "state" | "mentor" | "reward";

type MilestoneDetailRow = {
  description: string;
  icon: MilestoneDetailIconName;
  label: string;
  value: string;
};

function MilestoneDetailIcon({ name }: { name: MilestoneDetailIconName }) {
  const stroke = colors.primary;

  if (name === "artifact") {
    return (
      <Svg height={48} viewBox="0 0 48 48" width={48}>
        <Path
          d="M24 4 L29.2 18.8 L44 24 L29.2 29.2 L24 44 L18.8 29.2 L4 24 L18.8 18.8 Z"
          fill={stroke}
          opacity={0.96}
        />
      </Svg>
    );
  }

  if (name === "state") {
    return (
      <Svg height={48} viewBox="0 0 48 48" width={48}>
        <Path
          d="M24 7 C31 13 34 20 31 29 C28 36 20 36 17 29 C14 20 17 13 24 7 Z"
          fill="none"
          stroke={stroke}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2.8}
        />
        <Path
          d="M15 18 C8 20 6 27 9 33 C13 40 22 39 24 32"
          fill="none"
          stroke={stroke}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2.8}
        />
        <Path
          d="M33 18 C40 20 42 27 39 33 C35 40 26 39 24 32"
          fill="none"
          stroke={stroke}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2.8}
        />
        <Line
          stroke={stroke}
          strokeLinecap="round"
          strokeWidth={2.8}
          x1={24}
          x2={24}
          y1={32}
          y2={41}
        />
      </Svg>
    );
  }

  if (name === "mentor") {
    return (
      <Svg height={48} viewBox="0 0 48 48" width={48}>
        <Circle
          cx={24}
          cy={15}
          fill="none"
          r={6.5}
          stroke={stroke}
          strokeWidth={3}
        />
        <Path
          d="M11 41 C11 31.5 16.5 25.5 24 25.5 C31.5 25.5 37 31.5 37 41 Z"
          fill="none"
          stroke={stroke}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={3}
        />
      </Svg>
    );
  }

  return (
    <Svg height={48} viewBox="0 0 48 48" width={48}>
      <Rect
        fill="none"
        height={27}
        rx={3}
        stroke={stroke}
        strokeWidth={3}
        width={30}
        x={9}
        y={17}
      />
      <Path
        d="M7 17 H41 V24 H7 Z"
        fill="none"
        stroke={stroke}
        strokeLinejoin="round"
        strokeWidth={3}
      />
      <Path
        d="M24 17 V44"
        fill="none"
        stroke={stroke}
        strokeLinecap="round"
        strokeWidth={3}
      />
      <Path
        d="M24 17 C17 10 14 7 11 10 C8.5 12.5 11 17 18 17"
        fill="none"
        stroke={stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={3}
      />
      <Path
        d="M24 17 C31 10 34 7 37 10 C39.5 12.5 37 17 30 17"
        fill="none"
        stroke={stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={3}
      />
    </Svg>
  );
}

function ArrowRightIcon() {
  return (
    <Svg height={30} viewBox="0 0 30 30" width={30}>
      <Path
        d="M4 15 H25"
        fill="none"
        stroke={colors.secondaryDark}
        strokeLinecap="round"
        strokeWidth={2.5}
      />
      <Path
        d="M16.5 6.5 L25 15 L16.5 23.5"
        fill="none"
        stroke={colors.secondaryDark}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2.5}
      />
    </Svg>
  );
}

function MilestoneModal({
  milestone,
  onClose,
  onOpenQuests,
}: MilestoneModalProps) {
  const insets = useSafeAreaInsets();
  const { height, width } = useWindowDimensions();
  const isCompact = width < 520;
  const isShort = height < 760;
  const sheetMaxHeight = Math.min(
    height - Math.max(insets.top, 10),
    height * (isCompact ? 0.72 : 0.82),
  );
  const sheetBottomPadding = Math.max(insets.bottom + 14, isCompact ? 18 : 22);
  const detailRows: readonly MilestoneDetailRow[] = milestone
    ? [
        {
          description:
            "This will be the proof of your progress and show that the goal is achieved.",
          icon: "artifact",
          label: "ARTIFACT",
          value: milestone.artifact ?? "Proof of progress",
        },
        {
          description:
            "Your mental and emotional state that supports this stage.",
          icon: "state",
          label: "STATE",
          value: milestone.state,
        },
        {
          description: "Someone who guides, supports, and helps you grow.",
          icon: "mentor",
          label: "MENTOR",
          value: milestone.mentor ?? "Trusted guide",
        },
        {
          description: "A meaningful reward that celebrates your progress.",
          icon: "reward",
          label: "REWARD",
          value: milestone.reward ?? "Meaningful reward",
        },
      ]
    : [];

  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      presentationStyle="overFullScreen"
      statusBarTranslucent
      transparent
      visible={milestone !== null}
    >
      <View
        style={[
          styles.modalRoot,
          {
            paddingTop: Math.max(insets.top, 14),
          },
        ]}
      >
        <Pressable
          accessibilityLabel="Close milestone details"
          accessibilityRole="button"
          onPress={onClose}
          style={styles.backdrop}
        />

        {milestone ? (
          <View style={styles.sheetShadow}>
            <LinearGradient
              colors={["#0A1325", "#050A15", "#08101F"]}
              style={[
                styles.sheet,
                { maxHeight: sheetMaxHeight, paddingBottom: sheetBottomPadding },
                isCompact && styles.sheetCompact,
                isShort && styles.sheetShort,
              ]}
            >
              <View style={styles.cardHandle} />

              <Image
                resizeMode="contain"
                source={MILESTONE_DOOR_SOURCE}
                style={[
                  styles.doorImage,
                  isCompact && styles.doorImageCompact,
                  isShort && styles.doorImageShort,
                ]}
              />

              <Pressable
                accessibilityLabel="Close"
                accessibilityRole="button"
                hitSlop={10}
                onPress={onClose}
                style={[styles.closeButton, isCompact && styles.closeButtonCompact]}
              >
                <Text
                  style={[
                    styles.closeText,
                    isCompact && styles.closeTextCompact,
                  ]}
                >
                  {"\u00D7"}
                </Text>
              </Pressable>

              <View
                style={[
                  styles.sheetHeader,
                  isCompact && styles.sheetHeaderCompact,
                  isShort && styles.sheetHeaderShort,
                ]}
              >
                <View
                  style={[
                    styles.modalNumber,
                    isCompact && styles.modalNumberCompact,
                  ]}
                >
                  <Text
                    style={[
                      styles.modalNumberText,
                      isCompact && styles.modalNumberTextCompact,
                    ]}
                  >
                    {milestone.id}
                  </Text>
                </View>

                <View style={styles.modalTitleBlock}>
                  <Text
                    style={[
                      styles.modalTitle,
                      isCompact && styles.modalTitleCompact,
                      isShort && styles.modalTitleShort,
                    ]}
                  >
                    {milestone.title}
                  </Text>
                  <Text
                    style={[
                      styles.modalSubtitle,
                      isCompact && styles.modalSubtitleCompact,
                    ]}
                  >
                    {milestone.subtitle}
                  </Text>
                </View>
              </View>

              <ScrollView
                bounces={false}
                contentContainerStyle={styles.detailContent}
                showsVerticalScrollIndicator={false}
                style={styles.detailScroll}
              >
                {detailRows.map((row, index) => (
                  <View
                    key={row.label}
                    style={[
                      styles.detailRow,
                      isCompact && styles.detailRowCompact,
                      isShort && styles.detailRowShort,
                      index === detailRows.length - 1 && styles.lastDetailRow,
                    ]}
                  >
                    <View
                      style={[
                        styles.detailIcon,
                        isCompact && styles.detailIconCompact,
                      ]}
                    >
                      <MilestoneDetailIcon name={row.icon} />
                    </View>

                    <View
                      style={[
                        styles.detailCopy,
                        isCompact && styles.detailCopyCompact,
                      ]}
                    >
                      <Text
                        style={[
                          styles.sectionLabel,
                          isCompact && styles.sectionLabelCompact,
                        ]}
                      >
                        {row.label}
                      </Text>
                      <Text
                        style={[
                          styles.detailValue,
                          isCompact && styles.detailValueCompact,
                        ]}
                      >
                        {row.value}
                      </Text>
                      <Text
                        style={[
                          styles.description,
                          isCompact && styles.descriptionCompact,
                        ]}
                      >
                        {row.description}
                      </Text>
                    </View>
                  </View>
                ))}
              </ScrollView>

              <Pressable
                accessibilityRole="button"
                onPress={onOpenQuests}
                style={({ pressed }) => pressed && styles.buttonPressed}
              >
                <LinearGradient
                  colors={gradients.primary}
                  end={{ x: 1, y: 0.5 }}
                  start={{ x: 0, y: 0.5 }}
                  style={[
                    styles.questButton,
                    isCompact && styles.questButtonCompact,
                  ]}
                >
                  <QuestButtonShimmer />
                  <Text
                    style={[
                      styles.questButtonText,
                      isCompact && styles.questButtonTextCompact,
                    ]}
                  >
                    Go to Quests
                  </Text>
                  <View style={styles.questButtonIcon}>
                    <ArrowRightIcon />
                  </View>
                </LinearGradient>
              </Pressable>
            </LinearGradient>
          </View>
        ) : null}
      </View>
    </Modal>
  );
}

export function GoalJourneyMapScreen() {
  const router = useRouter();
  const [selectedMilestone, setSelectedMilestone] =
    useState<JourneyMilestoneData | null>(null);
  const milestonePages = useMemo(
    () => paginateMilestones(journeyMilestones),
    [],
  );
  const currentConfig = journeyPageConfigs[0];
  const currentMilestones = milestonePages[0] ?? [];
  const positions = useMemo<readonly JourneyMilestonePosition[]>(
    () =>
      currentMilestones.map((_, index) => ({
        x: 0.5,
        y: getMilestoneRingY(index, currentMilestones.length, currentConfig),
      })),
    [currentConfig, currentMilestones],
  );

  return (
    <View style={styles.screen}>
      <JourneyMapScroll
        enabled={selectedMilestone === null}
        showAtmosphere
        source={JOURNEY_MAP_SOURCE}
      >
        {({ imageHeight, imageWidth }) =>
          currentMilestones.map((milestone, index) => (
            <JourneyMilestone
              imageHeight={imageHeight}
              imageWidth={imageWidth}
              key={milestone.id}
              milestone={milestone}
              onPress={setSelectedMilestone}
              position={positions[index]}
            />
          ))
        }
      </JourneyMapScroll>

      <JourneyMapControls />

      <MilestoneModal
        milestone={selectedMilestone}
        onClose={() => setSelectedMilestone(null)}
        onOpenQuests={() => {
          setSelectedMilestone(null);
          router.push("/today");
        }}
      />
    </View>
  );
}

export default GoalJourneyMapScreen;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalRoot: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
    paddingHorizontal: 8,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(1, 5, 13, 0.76)",
  },
  sheetShadow: {
    width: "100%",
    maxWidth: 760,
    borderRadius: 28,
    backgroundColor: colors.backgroundSoft,
    shadowColor: colors.background,
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.48,
    shadowRadius: 28,
    elevation: 12,
  },
  sheet: {
    overflow: "hidden",
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "rgba(245, 184, 75, 0.66)",
    paddingHorizontal: 30,
    paddingTop: 44,
  },
  sheetCompact: {
    paddingHorizontal: 28,
    paddingTop: 28,
  },
  sheetShort: {
    paddingHorizontal: 22,
    paddingTop: 24,
  },
  cardHandle: {
    position: "absolute",
    top: 12,
    alignSelf: "center",
    width: 48,
    height: 5,
    borderRadius: 999,
    backgroundColor: "rgba(246, 232, 200, 0.42)",
  },
  doorImage: {
    position: "absolute",
    top: 30,
    right: 90,
    width: 190,
    height: 132,
  },
  doorImageCompact: {
    top: 22,
    right: 82,
    width: 116,
    height: 88,
    opacity: 0.88,
  },
  doorImageShort: {
    top: 20,
    width: 104,
    height: 78,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 116,
    paddingRight: 246,
  },
  sheetHeaderCompact: {
    minHeight: 88,
    paddingRight: 150,
  },
  sheetHeaderShort: {
    minHeight: 78,
    paddingRight: 138,
  },
  modalNumber: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(6, 12, 25, 0.74)",
    borderWidth: 1.5,
    borderColor: colors.primary,
    ...shadows.goldGlow,
  },
  modalNumberCompact: {
    width: 58,
    height: 58,
    borderRadius: 29,
  },
  modalNumberText: {
    color: colors.primary,
    fontFamily: "serif",
    fontSize: 42,
    lineHeight: 48,
  },
  modalNumberTextCompact: {
    fontSize: 34,
    lineHeight: 39,
  },
  modalTitleBlock: {
    flex: 1,
    marginLeft: 18,
  },
  modalTitle: {
    ...typography.title,
    fontSize: 36,
    lineHeight: 42,
  },
  modalTitleCompact: {
    fontSize: 25,
    lineHeight: 30,
  },
  modalTitleShort: {
    fontSize: 23,
    lineHeight: 27,
  },
  modalSubtitle: {
    color: "#D0BE99",
    fontFamily: "serif",
    fontSize: 18,
    lineHeight: 24,
    marginTop: 3,
  },
  modalSubtitleCompact: {
    fontSize: 14,
    lineHeight: 18,
    marginTop: 0,
  },
  closeButton: {
    position: "absolute",
    right: 22,
    top: 34,
    zIndex: 3,
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(6, 12, 25, 0.58)",
    borderWidth: 1,
    borderColor: "rgba(245, 184, 75, 0.36)",
  },
  closeButtonCompact: {
    right: 18,
    top: 28,
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  closeText: {
    color: colors.primary,
    fontSize: 36,
    fontWeight: "300",
    lineHeight: 40,
  },
  closeTextCompact: {
    fontSize: 30,
    lineHeight: 34,
  },
  detailScroll: {
    flexShrink: 1,
    marginTop: 0,
  },
  detailContent: {
    paddingBottom: 10,
  },
  detailRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(246, 232, 200, 0.13)",
    paddingBottom: 17,
    paddingTop: 18,
  },
  detailRowCompact: {
    paddingBottom: 10,
    paddingTop: 11,
  },
  detailRowShort: {
    paddingBottom: 8,
    paddingTop: 8,
  },
  lastDetailRow: {
    borderBottomWidth: 0,
    paddingBottom: 18,
  },
  detailIcon: {
    width: 66,
    alignItems: "center",
    paddingTop: 3,
  },
  detailIconCompact: {
    width: 42,
    transform: [{ scale: 0.72 }],
  },
  detailCopy: {
    flex: 1,
    paddingLeft: 16,
  },
  detailCopyCompact: {
    paddingLeft: 6,
  },
  sectionLabel: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 2.4,
    lineHeight: 17,
  },
  sectionLabelCompact: {
    fontSize: 10,
    letterSpacing: 1.2,
    lineHeight: 12,
  },
  detailValue: {
    color: colors.textPrimary,
    fontFamily: "serif",
    fontSize: 24,
    fontWeight: "600",
    lineHeight: 30,
    marginTop: 5,
  },
  detailValueCompact: {
    fontSize: 14,
    lineHeight: 18,
    marginTop: 2,
  },
  description: {
    color: "#BCA989",
    fontFamily: "serif",
    fontSize: 16,
    lineHeight: 21,
    marginTop: 4,
  },
  descriptionCompact: {
    fontSize: 12,
    lineHeight: 16,
    marginTop: 1,
  },
  questButton: {
    minHeight: 62,
    borderRadius: radius.round,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 220, 124, 0.76)",
    ...shadows.goldGlow,
  },
  questButtonCompact: {
    minHeight: 54,
  },
  questButtonText: {
    color: colors.secondaryDark,
    fontFamily: "serif",
    fontSize: 28,
    fontWeight: "600",
    lineHeight: 34,
    zIndex: 2,
  },
  questButtonTextCompact: {
    fontSize: 20,
    lineHeight: 25,
  },
  questButtonIcon: {
    position: "absolute",
    right: 22,
    zIndex: 2,
  },
  shimmerClip: {
    ...StyleSheet.absoluteFill,
    overflow: "hidden",
  },
  shimmerBloom: {
    position: "absolute",
    top: -32,
    bottom: -32,
  },
  shimmerStreak: {
    position: "absolute",
    top: -28,
    bottom: -28,
  },
  buttonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.99 }],
  },
});
