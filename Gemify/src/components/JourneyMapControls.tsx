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

import { colors } from "@/theme/colors";
import { radius, shadows, spacing, typography } from "@/theme/theme";

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
        stroke={colors.primary}
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
        stroke={colors.primary}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
      />
      <Path
        d="M19.2 14.5c.25 1.78 1.27 2.8 3 3-1.73.2-2.75 1.22-3 3-.25-1.78-1.27-2.8-3-3 1.73-.2 2.75-1.22 3-3ZM5 3.2c.18 1.2.85 1.87 2 2-1.15.13-1.82.8-2 2-.18-1.2-.85-1.87-2-2 1.15-.13 1.82-.8 2-2Z"
        stroke={colors.primary}
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
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  buttonGlow: {
    width: 60,
    height: 60,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceGlass,
    ...shadows.goldGlow,
  },
  button: {
    width: 60,
    height: 60,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    backgroundColor: colors.surfaceGlass,
    borderWidth: 1,
    borderColor: colors.border,
  },
  buttonInnerEdge: {
    ...StyleSheet.absoluteFill,
    margin: 2,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderBottomColor: colors.secondaryDark,
  },
  buttonPressed: {
    backgroundColor: colors.secondary,
    borderColor: colors.primary,
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
    backgroundColor: colors.overlayDark,
  },
  overviewGlow: {
    marginHorizontal: 16,
    borderRadius: radius.lg,
    backgroundColor: colors.backgroundSoft,
    ...shadows.softDark,
  },
  overviewCard: {
    overflow: "hidden",
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceGlass,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    paddingTop: spacing.lg,
  },
  overviewOrnament: {
    alignSelf: "center",
    width: 34,
    height: 2,
    marginBottom: 17,
    borderRadius: 1,
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
  },
  eyebrow: {
    ...typography.caption,
    color: colors.primary,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 2.2,
    lineHeight: 13,
    textAlign: "center",
  },
  title: {
    ...typography.title,
    marginTop: 3,
    textAlign: "center",
  },
  intro: {
    ...typography.body,
    marginTop: 9,
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
  },
  divider: {
    height: 1,
    marginVertical: 20,
    backgroundColor: colors.borderSoft,
  },
  stepRow: {
    flexDirection: "row",
    marginBottom: 17,
  },
  stepNumber: {
    width: 32,
    color: colors.primary,
    fontFamily: "serif",
    fontSize: 13,
    lineHeight: 19,
  },
  stepCopy: {
    flex: 1,
  },
  stepTitle: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 19,
  },
  stepBody: {
    ...typography.caption,
    marginTop: 2,
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 17,
  },
  continueButton: {
    minHeight: 50,
    marginTop: 4,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceGlass,
    borderWidth: 1,
    borderColor: colors.border,
  },
  continueButtonPressed: {
    backgroundColor: colors.secondary,
    transform: [{ scale: 0.99 }],
  },
  continueText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.35,
  },
});
