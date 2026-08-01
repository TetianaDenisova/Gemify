import { useState } from "react";
import { useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";

import {
  AppButton,
  AppModal,
  AppText,
  ScreenHeader,
} from "@/shared/components";
import { colors } from "@/theme/colors";
import { fonts, radius, shadows, spacing } from "@/theme/theme";

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
  onOpenWhatIfPlan: () => void;
  visible: boolean;
};

function JourneyOverviewModal({
  onClose,
  onOpenWhatIfPlan,
  visible,
}: JourneyOverviewModalProps) {
  const insets = useSafeAreaInsets();

  return (
    <AppModal
      onClose={onClose}
      panelStyle={[
        styles.modalPanel,
        { paddingBottom: Math.max(insets.bottom + 16, 30) },
      ]}
      showHandle={false}
      variant="sheet"
      visible={visible}
    >
      <View style={styles.overviewGlow}>
        <View style={styles.overviewCard}>
          <View style={styles.overviewOrnament} />
          <AppText align="center" variant="eyebrow">
            YOUR PATH
          </AppText>
          <AppText align="center" style={styles.title} variant="title">
            The Journey
          </AppText>
          <AppText align="center" style={styles.intro} variant="bodySmall">
            A living map of the person you are becoming. Each milestone turns
            focused action into lasting inner change.
          </AppText>

          <View style={styles.divider} />

          <View style={styles.stepRow}>
            <AppText color={colors.primary} style={styles.stepNumber} variant="bodySmall">
              I
            </AppText>
            <View style={styles.stepCopy}>
              <AppText variant="labelStrong">
                Follow the illuminated path
              </AppText>
              <AppText variant="caption">
                Your glowing milestone is the chapter currently unfolding.
              </AppText>
            </View>
          </View>
          <View style={styles.stepRow}>
            <AppText color={colors.primary} style={styles.stepNumber} variant="bodySmall">
              II
            </AppText>
            <View style={styles.stepCopy}>
              <AppText variant="labelStrong">
                Complete its quests
              </AppText>
              <AppText variant="caption">
                Small, deliberate actions build progress within each chapter.
              </AppText>
            </View>
          </View>
          <View style={styles.stepRow}>
            <AppText color={colors.primary} style={styles.stepNumber} variant="bodySmall">
              III
            </AppText>
            <View style={styles.stepCopy}>
              <AppText variant="labelStrong">
                Unlock what comes next
              </AppText>
              <AppText variant="caption">
                Finish a milestone to reveal the next realm of your journey.
              </AppText>
            </View>
          </View>

          <AppButton
            accessibilityLabel="Check What If Plan"
            label={'Check "What If" Plan'}
            onPress={onOpenWhatIfPlan}
            style={styles.continueButton}
            variant="secondary"
          />
        </View>
      </View>
    </AppModal>
  );
}

export function JourneyMapControls() {
  const router = useRouter();
  const [overviewVisible, setOverviewVisible] = useState(false);

  const openWhatIfPlan = () => {
    setOverviewVisible(false);
    router.push("/what-if-plan");
  };

  return (
    <>
      <ScreenHeader
        asStackHeader
        rightAction={{
          accessibilityLabel: "Open journey overview",
          icon: <SparklesIcon />,
          onPress: () => setOverviewVisible(true),
        }}
      />

      <JourneyOverviewModal
        onClose={() => setOverviewVisible(false)}
        onOpenWhatIfPlan={openWhatIfPlan}
        visible={overviewVisible}
      />
    </>
  );
}

const styles = StyleSheet.create({
  modalPanel: {
    backgroundColor: colors.transparent,
    borderWidth: 0,
    padding: 0,
    paddingHorizontal: spacing.md,
  },
  overviewGlow: {
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
  title: {
    marginTop: spacing.xs,
  },
  intro: {
    marginTop: spacing.sm,
  },
  divider: {
    height: 1,
    marginVertical: spacing.md,
    backgroundColor: colors.borderSoft,
  },
  stepRow: {
    flexDirection: "row",
    marginBottom: spacing.md,
  },
  stepNumber: {
    width: 32,
    fontFamily: fonts.serif,
  },
  stepCopy: {
    flex: 1,
  },
  continueButton: {
    marginTop: spacing.xs,
  },
});
