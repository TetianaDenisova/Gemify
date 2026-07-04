import { useState, type ReactNode } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";

const GOLD = "#D8B56A";

type FantasyIconButtonProps = {
  accessibilityLabel: string;
  disabled?: boolean;
  icon: ReactNode;
  onPress: () => void;
};

function FantasyIconButton({
  accessibilityLabel,
  disabled = false,
  icon,
  onPress,
}: FantasyIconButtonProps) {
  return (
    <View style={[styles.buttonGlow, disabled && styles.buttonDisabled]}>
      <Pressable
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="button"
        disabled={disabled}
        hitSlop={8}
        onPress={onPress}
        style={({ pressed }) => [
          styles.button,
          pressed && styles.buttonPressed,
        ]}
      >
        <View pointerEvents="none" style={styles.buttonInnerEdge} />
        {icon}
      </Pressable>
    </View>
  );
}

function ArrowLeftIcon() {
  return (
    <Svg fill="none" height={25} viewBox="0 0 24 24" width={25}>
      <Path
        d="M19 12H5M11 18l-6-6 6-6"
        stroke={GOLD}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
      />
    </Svg>
  );
}

function SparklesIcon() {
  return (
    <Svg fill="none" height={27} viewBox="0 0 24 24" width={27}>
      <Path
        d="M12 2.8c.55 3.52 2.48 5.45 6 6-3.52.55-5.45 2.48-6 6-.55-3.52-2.48-5.45-6-6 3.52-.55 5.45-2.48 6-6Z"
        stroke={GOLD}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
      />
      <Path
        d="M19.2 14.5c.25 1.78 1.27 2.8 3 3-1.73.2-2.75 1.22-3 3-.25-1.78-1.27-2.8-3-3 1.73-.2 2.75-1.22 3-3ZM5 3.2c.18 1.2.85 1.87 2 2-1.15.13-1.82.8-2 2-.18-1.2-.85-1.87-2-2 1.15-.13 1.82-.8 2-2Z"
        stroke={GOLD}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
      />
    </Svg>
  );
}

type JourneyOverviewModalProps = {
  onClose: () => void;
  visible: boolean;
};

function JourneyOverviewModal({ onClose, visible }: JourneyOverviewModalProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      presentationStyle="overFullScreen"
      statusBarTranslucent
      transparent
      visible={visible}
    >
      <View
        style={[
          styles.modalRoot,
          { paddingBottom: Math.max(insets.bottom + 16, 30) },
        ]}
      >
        <Pressable
          accessibilityLabel="Close journey overview"
          accessibilityRole="button"
          onPress={onClose}
          style={styles.backdrop}
        />

        <View style={styles.overviewGlow}>
          <View style={styles.overviewCard}>
            <View style={styles.overviewOrnament} />
            <Text style={styles.eyebrow}>YOUR PATH</Text>
            <Text style={styles.title}>The Journey</Text>
            <Text style={styles.intro}>
              A living map of the person you are becoming. Each milestone turns
              focused action into lasting inner change.
            </Text>

            <View style={styles.divider} />

            <View style={styles.stepRow}>
              <Text style={styles.stepNumber}>I</Text>
              <View style={styles.stepCopy}>
                <Text style={styles.stepTitle}>Follow the illuminated path</Text>
                <Text style={styles.stepBody}>
                  Your glowing milestone is the chapter currently unfolding.
                </Text>
              </View>
            </View>
            <View style={styles.stepRow}>
              <Text style={styles.stepNumber}>II</Text>
              <View style={styles.stepCopy}>
                <Text style={styles.stepTitle}>Complete its quests</Text>
                <Text style={styles.stepBody}>
                  Small, deliberate actions build progress within each chapter.
                </Text>
              </View>
            </View>
            <View style={styles.stepRow}>
              <Text style={styles.stepNumber}>III</Text>
              <View style={styles.stepCopy}>
                <Text style={styles.stepTitle}>Unlock what comes next</Text>
                <Text style={styles.stepBody}>
                  Finish a milestone to reveal the next realm of your journey.
                </Text>
              </View>
            </View>

            <Pressable
              accessibilityRole="button"
              onPress={onClose}
              style={({ pressed }) => [
                styles.continueButton,
                pressed && styles.continueButtonPressed,
              ]}
            >
              <Text style={styles.continueText}>Continue the Journey</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

type JourneyMapControlsProps = {
  onBack: () => void;
};

export function JourneyMapControls({ onBack }: JourneyMapControlsProps) {
  const insets = useSafeAreaInsets();
  const [overviewVisible, setOverviewVisible] = useState(false);

  return (
    <>
      <View
        pointerEvents="box-none"
        style={[styles.controls, { top: insets.top + 22 }]}
      >
        <FantasyIconButton
          accessibilityLabel="Navigate back"
          icon={<ArrowLeftIcon />}
          onPress={onBack}
        />
        <FantasyIconButton
          accessibilityLabel="Open journey overview"
          icon={<SparklesIcon />}
          onPress={() => setOverviewVisible(true)}
        />
      </View>

      <JourneyOverviewModal
        onClose={() => setOverviewVisible(false)}
        visible={overviewVisible}
      />
    </>
  );
}

const styles = StyleSheet.create({
  controls: {
    position: "absolute",
    left: 20,
    right: 20,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  buttonGlow: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: "rgba(8, 7, 7, 0.86)",
    shadowColor: "#C99A42",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 11,
    elevation: 9,
  },
  button: {
    width: 60,
    height: 60,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    backgroundColor: "rgba(8, 8, 9, 0.82)",
    borderWidth: 1,
    borderColor: "rgba(216, 181, 106, 0.76)",
  },
  buttonInnerEdge: {
    ...StyleSheet.absoluteFill,
    margin: 2,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "rgba(255, 226, 159, 0.08)",
    borderBottomColor: "rgba(0, 0, 0, 0.7)",
  },
  buttonPressed: {
    backgroundColor: "rgba(25, 20, 13, 0.92)",
    borderColor: "rgba(239, 205, 127, 0.96)",
    transform: [{ scale: 0.97 }],
  },
  buttonDisabled: {
    opacity: 0.38,
  },
  modalRoot: {
    flex: 1,
    justifyContent: "flex-end",
    paddingTop: 80,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(1, 2, 5, 0.78)",
  },
  overviewGlow: {
    marginHorizontal: 16,
    borderRadius: 28,
    backgroundColor: "#090909",
    shadowColor: "#C69A4D",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.22,
    shadowRadius: 22,
    elevation: 22,
  },
  overviewCard: {
    overflow: "hidden",
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "rgba(216, 181, 106, 0.42)",
    backgroundColor: "rgba(9, 9, 11, 0.98)",
    paddingHorizontal: 24,
    paddingBottom: 22,
    paddingTop: 26,
  },
  overviewOrnament: {
    alignSelf: "center",
    width: 34,
    height: 2,
    marginBottom: 17,
    borderRadius: 1,
    backgroundColor: GOLD,
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
  },
  eyebrow: {
    color: "rgba(216, 181, 106, 0.82)",
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 2.2,
    lineHeight: 13,
    textAlign: "center",
  },
  title: {
    marginTop: 3,
    color: "#F8EBD0",
    fontFamily: "serif",
    fontSize: 30,
    lineHeight: 36,
    textAlign: "center",
  },
  intro: {
    marginTop: 9,
    color: "rgba(239, 231, 216, 0.66)",
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
  },
  divider: {
    height: 1,
    marginVertical: 20,
    backgroundColor: "rgba(216, 181, 106, 0.16)",
  },
  stepRow: {
    flexDirection: "row",
    marginBottom: 17,
  },
  stepNumber: {
    width: 32,
    color: GOLD,
    fontFamily: "serif",
    fontSize: 13,
    lineHeight: 19,
  },
  stepCopy: {
    flex: 1,
  },
  stepTitle: {
    color: "#F5E8CC",
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 19,
  },
  stepBody: {
    marginTop: 2,
    color: "rgba(231, 224, 211, 0.58)",
    fontSize: 12,
    lineHeight: 17,
  },
  continueButton: {
    minHeight: 50,
    marginTop: 4,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(216, 181, 106, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(216, 181, 106, 0.58)",
  },
  continueButtonPressed: {
    backgroundColor: "rgba(216, 181, 106, 0.2)",
    transform: [{ scale: 0.99 }],
  },
  continueText: {
    color: "#E6C783",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.35,
  },
});
