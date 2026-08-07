import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";

import {
  AppButton,
  AppModal,
  AppText,
  PencilIcon,
  ScreenHeader,
  SparkIcon,
} from "@/shared/components";
import { colors } from "@/theme/colors";
import {
  fonts,
  fontSizes,
  iconSizes,
  lineHeights,
  radius,
  shadows,
  spacing,
} from "@/theme/theme";

function SparklesIcon({ size = 27 }: { size?: number }) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 24 24" width={size}>
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

const DREAM_NAME = "Your Dream Name";
const VISION_STATEMENT =
  "I imagine waking up in the life I once dreamed about—my goal is real, my days reflect the person I have become, and I feel proud, fulfilled, and free. I can see where I live, how I spend my time, who shares this journey with me, and the new possibilities now open to me.";

type JourneyOverviewModalProps = {
  onClose: () => void;
  onEditPath: () => void;
  onOpenWhatIfPlan: () => void;
  visible: boolean;
};

function JourneyOverviewModal({
  onClose,
  onEditPath,
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
      <View style={styles.frameOuter}>
        <View style={styles.frameInner}>
          <AppText align="center" variant="eyebrow">
            THE LIFE I&apos;M CREATING
          </AppText>
          <AppText align="center" style={styles.title} variant="title">
            {DREAM_NAME}
          </AppText>
          <View style={styles.ornamentRow}>
            <View style={styles.ornamentLine} />
            <SparkIcon size={iconSizes.sm} />
            <View style={styles.ornamentLine} />
          </View>

          <View style={styles.visionCard}>
            <AppText style={styles.quoteMark}>{"“"}</AppText>
            <AppText style={styles.visionText} variant="bodySerif">
              {VISION_STATEMENT}
            </AppText>
          </View>

          <View style={styles.actionsRow}>
            <AppButton
              accessibilityLabel="Edit Path"
              icon={<PencilIcon color={colors.textOnPrimary} size={iconSizes.sm} />}
              iconPosition="before"
              label="Edit Path"
              onPress={onEditPath}
              style={styles.actionButton}
              textStyle={styles.actionLabel}
              variant="primary"
            />
            <AppButton
              accessibilityLabel="Check What If Plan"
              icon={<SparklesIcon size={iconSizes.sm} />}
              iconPosition="before"
              label={'Check "What If" Plan'}
              onPress={onOpenWhatIfPlan}
              style={styles.actionButton}
              textStyle={styles.actionLabel}
              variant="secondary"
            />
          </View>
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

  const openEditPath = () => {
    setOverviewVisible(false);
    router.push("/describe-dream");
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
        onEditPath={openEditPath}
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
  frameOuter: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surfaceCard,
    padding: spacing.xs,
    ...shadows.softDark,
  },
  frameInner: {
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.borderFaint,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  title: {
    marginTop: spacing.xs,
  },
  ornamentRow: {
    alignItems: "center",
    alignSelf: "center",
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  ornamentLine: {
    width: 72,
    height: 1,
    backgroundColor: colors.border,
  },
  visionCard: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.md,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.surfaceDeep,
    padding: spacing.lg,
  },
  quoteMark: {
    color: colors.primary,
    fontFamily: fonts.serif,
    fontSize: fontSizes.stat,
    lineHeight: lineHeights.stat,
  },
  visionText: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: fontSizes.lg,
    lineHeight: lineHeights.xl,
  },
  actionsRow: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  actionButton: {
    flex: 1,
    paddingHorizontal: spacing.sm,
  },
  actionLabel: {
    fontSize: fontSizes.lg,
    lineHeight: lineHeights.lg,
  },
});
