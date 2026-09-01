import type { ReactNode } from "react";
import { useWindowDimensions, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  AppButton,
  AppText,
  ArrowRightIcon,
  HintRow,
  ScreenHeader,
  ScreenScaffold,
} from "@/shared/components";
import { colors } from "@/theme/colors";
import { fontSizes, layout, lineHeights, spacing } from "@/theme/theme";

const ENTERING_BACKGROUND = require("../../assets/create-goal/entering.png");

export type OnboardingStepProps = {
  /** The step's form controls; a function form receives the compact-layout flag. */
  children: ReactNode | ((compactLayout: boolean) => ReactNode);
  continueDisabled?: boolean;
  hint: string;
  onContinue: () => void;
  subtitle: string;
  title: string;
};

/**
 * Shared shell of the dream-creation flow steps: transparent stack header,
 * forest background, centered title/subtitle, the step's input, a hint, and
 * the primary Continue button — with the compact spacing for short screens.
 */
export function OnboardingStep({
  children,
  continueDisabled = false,
  hint,
  onContinue,
  subtitle,
  title,
}: OnboardingStepProps) {
  const insets = useSafeAreaInsets();
  const { height, width } = useWindowDimensions();
  const compactLayout = height < layout.shortScreenBreakpoint || width > height;
  const sectionGap = compactLayout ? spacing.md : spacing.xl;

  return (
    <>
      <ScreenHeader asStackHeader />
      <ScreenScaffold
        backgroundImage={ENTERING_BACKGROUND}
        contentStyle={[
          styles.content,
          {
            paddingBottom: compactLayout ? spacing.md : spacing.lg,
            paddingTop: insets.top + layout.headerHeight,
          },
        ]}
        keyboardAvoiding
        overlayOpacity={0.45}
        scroll={false}
      >
        <View
          style={[
            styles.topContent,
            { marginTop: compactLayout ? spacing.xs : spacing.sm },
          ]}
        >
          <AppText
            align="center"
            style={compactLayout && styles.titleCompact}
            variant="screenTitle"
          >
            {title}
          </AppText>

          <AppText align="center" style={styles.subtitle} variant="subtitle">
            {subtitle}
          </AppText>
        </View>

        <View
          style={[
            styles.formArea,
            { marginTop: compactLayout ? spacing.sm : spacing.md },
          ]}
        >
          {typeof children === "function" ? children(compactLayout) : children}
        </View>

        <View style={[styles.bottomArea, { marginTop: sectionGap }]}>
          <HintRow
            style={{
              marginBottom: compactLayout ? spacing.md : spacing.lg,
            }}
            text={hint}
          />

          <AppButton
            disabled={continueDisabled}
            icon={<ArrowRightIcon color={colors.textOnPrimary} />}
            label="Continue"
            onPress={onContinue}
            size="lg"
            variant="primary"
          />
        </View>
      </ScreenScaffold>
    </>
  );
}

const styles = StyleSheet.create({
  bottomArea: {
    width: "100%",
  },
  content: {
    justifyContent: "space-between",
  },
  formArea: {
    alignItems: "center",
    width: "100%",
  },
  subtitle: {
    marginTop: spacing.lg,
  },
  titleCompact: {
    fontSize: fontSizes.cardTitle,
    lineHeight: lineHeights.cardTitle,
  },
  topContent: {
    alignItems: "center",
    width: "100%",
  },
});
