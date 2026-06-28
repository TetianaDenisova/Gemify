import { useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { JourneyMapScroll, JOURNEY_FRAMES } from "@/components/JourneyMapScroll";
import { JourneyMilestone } from "@/components/JourneyMilestone";
import { useResponsiveJourneyImageLayout } from "@/components/ResponsiveJourneyBackground";
import {
  journeyMilestones,
  type JourneyMilestoneData,
} from "@/data/journeyMilestones";

type MilestoneModalProps = {
  milestone: JourneyMilestoneData | null;
  onClose: () => void;
};

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
  const [selectedMilestone, setSelectedMilestone] =
    useState<JourneyMilestoneData | null>(null);
  const imageLayout = useResponsiveJourneyImageLayout(
    JOURNEY_FRAMES[0].source,
    "contain",
  );

  return (
    <View style={styles.screen}>
      <JourneyMapScroll
        enabled={selectedMilestone === null}
        imageMode="contain"
        showAtmosphere
      >
        {journeyMilestones.map((milestone) => (
          <JourneyMilestone
            imageHeight={imageLayout.renderedImageHeight}
            imageWidth={imageLayout.renderedImageWidth}
            key={milestone.id}
            milestone={milestone}
            onPress={setSelectedMilestone}
          />
        ))}
      </JourneyMapScroll>

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
  },
  buttonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.99 }],
  },
});
