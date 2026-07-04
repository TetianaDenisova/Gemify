import { useEffect, useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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
import {
  getJourneyPageConfig,
  journeyPageConfigs,
} from "@/data/journeyPageConfig";
import {
  getMilestoneRingY,
  paginateMilestones,
} from "@/utils/milestonePagination";

type MilestoneModalProps = {
  milestone: JourneyMilestoneData | null;
  onClose: () => void;
};

const JOURNEY_MAP_SOURCE = require("../../assets/journey-top/level2.png");
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
              colors={[
                "rgba(255, 220, 145, 0)",
                "rgba(255, 224, 157, 0.28)",
                "rgba(255, 246, 216, 0.42)",
                "rgba(255, 220, 145, 0)",
              ]}
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
                "rgba(255, 239, 196, 0)",
                "rgba(255, 230, 164, 0.36)",
                "rgba(255, 253, 239, 0.78)",
                "rgba(255, 224, 145, 0.3)",
                "rgba(255, 239, 196, 0)",
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

function MilestoneModal({ milestone, onClose }: MilestoneModalProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      presentationStyle="overFullScreen"
      statusBarTranslucent
      transparent
      visible={milestone !== null}
    >
      <View style={[styles.modalRoot, { paddingBottom: Math.max(insets.bottom, 14) }]}>
        <Pressable
          accessibilityLabel="Close milestone details"
          accessibilityRole="button"
          onPress={onClose}
          style={styles.backdrop}
        />

        {milestone ? (
          <View style={styles.sheetShadow}>
            <LinearGradient
              colors={["rgba(27, 20, 52, 0.98)", "rgba(8, 10, 24, 0.99)"]}
              style={styles.sheet}
            >
              <View style={styles.sheetHeader}>
                <View style={styles.modalNumber}>
                  <Text style={styles.modalNumberText}>{milestone.id}</Text>
                </View>

                <View style={styles.modalTitleBlock}>
                  <Text style={styles.modalEyebrow}>JOURNEY MILESTONE</Text>
                  <Text style={styles.modalTitle}>{milestone.title}</Text>
                  <Text style={styles.modalSubtitle}>{milestone.subtitle}</Text>
                </View>

                <Pressable
                  accessibilityLabel="Close"
                  accessibilityRole="button"
                  hitSlop={10}
                  onPress={onClose}
                  style={styles.closeButton}
                >
                  <Text style={styles.closeText}>{"\u00D7"}</Text>
                </Pressable>
              </View>

              <View style={styles.divider} />

              <Text style={styles.sectionLabel}>STATE</Text>
              <Text style={styles.stateValue}>{milestone.state}</Text>

              <Text style={styles.sectionLabel}>STORY</Text>
              <Text style={styles.description}>{milestone.description}</Text>

              <Pressable
                accessibilityRole="button"
                onPress={() => console.log("Open milestone quests", milestone.id)}
                style={({ pressed }) => pressed && styles.buttonPressed}
              >
                <LinearGradient
                  colors={["#8d50f5", "#c06cff", "#e7a96d"]}
                  end={{ x: 1, y: 0.5 }}
                  start={{ x: 0, y: 0.5 }}
                  style={styles.questButton}
                >
                  <QuestButtonShimmer />
                  <Text style={styles.questButtonText}>Go to Quests</Text>
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
  const currentPageIndex = 0;
  const milestonePages = useMemo(
    () => paginateMilestones(journeyMilestones),
    [],
  );
  const journeyPages = useMemo(
    () =>
      milestonePages.map((milestones, pageIndex) => ({
        config: getJourneyPageConfig(pageIndex),
        milestones,
      })),
    [milestonePages],
  );
  const currentPage = journeyPages[currentPageIndex];
  const currentConfig = currentPage?.config ?? journeyPageConfigs[0];
  const currentMilestones = currentPage?.milestones ?? [];
  const positions = useMemo<readonly JourneyMilestonePosition[]>(
    () =>
      currentMilestones.map((milestone, index) => ({
        x: 0.5,
        y: getMilestoneRingY(index, currentMilestones.length, currentConfig),
      })),
    [currentConfig, currentMilestones],
  );

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace("/");
  };

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

      <JourneyMapControls onBack={handleBack} />

      <MilestoneModal
        milestone={selectedMilestone}
        onClose={() => setSelectedMilestone(null)}
      />
    </View>
  );
}

export default GoalJourneyMapScreen;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#02040c",
  },
  modalRoot: {
    flex: 1,
    justifyContent: "flex-end",
    paddingTop: 64,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(1, 2, 10, 0.76)",
  },
  sheetShadow: {
    marginHorizontal: 14,
    borderRadius: 28,
    backgroundColor: "#080a18",
    shadowColor: "#a568ff",
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.38,
    shadowRadius: 24,
    elevation: 22,
  },
  sheet: {
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "rgba(211, 179, 255, 0.24)",
    padding: 22,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  modalNumber: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(8, 8, 22, 0.9)",
    borderWidth: 1.5,
    borderColor: "#ffd77e",
    shadowColor: "#ffca64",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 14,
  },
  modalNumberText: {
    color: "#ffe7ad",
    fontFamily: "serif",
    fontSize: 28,
    lineHeight: 33,
  },
  modalTitleBlock: {
    flex: 1,
    marginLeft: 14,
  },
  modalEyebrow: {
    color: "#c38aff",
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1.4,
    lineHeight: 12,
  },
  modalTitle: {
    color: "#fff8e9",
    fontFamily: "serif",
    fontSize: 25,
    lineHeight: 30,
  },
  modalSubtitle: {
    color: "rgba(231, 225, 238, 0.68)",
    fontSize: 12,
    lineHeight: 16,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.07)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
  },
  closeText: {
    color: "#fff9ff",
    fontSize: 25,
    fontWeight: "300",
    lineHeight: 28,
  },
  divider: {
    height: 1,
    marginVertical: 18,
    backgroundColor: "rgba(217, 190, 255, 0.14)",
  },
  sectionLabel: {
    color: "#b77dff",
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1.6,
    lineHeight: 12,
    marginTop: 10,
  },
  stateValue: {
    color: "#ffe3a3",
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 21,
    marginTop: 3,
  },
  description: {
    color: "rgba(235, 230, 239, 0.72)",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 4,
    marginBottom: 20,
  },
  questButton: {
    minHeight: 52,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    shadowColor: "#b568ff",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 10,
  },
  questButtonText: {
    color: "#fffaff",
    fontSize: 15,
    fontWeight: "700",
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
