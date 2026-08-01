import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  AppButton,
  AppInput,
  AppText,
  ArrowRightIcon,
  HintRow,
  ScreenHeader,
  ScreenScaffold,
} from "@/shared/components";
import { colors } from "@/theme/colors";
import { fontSizes, lineHeights, spacing } from "@/theme/theme";

const DREAM_NAME_MAX_LENGTH = 60;
const ENTERING_BACKGROUND = require("../../assets/create-goal/entering.png");

export default function CreateGoalScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [dreamName, setDreamName] = useState("");
  const { height, width } = useWindowDimensions();
  const compactLayout = height < 760 || width > height;
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
            paddingTop: insets.top + 68,
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
            Give your{"\n"}dream a name
          </AppText>

          <AppText align="center" style={styles.subtitle} variant="subtitle">
            Write down the future you want to create. Give it a name, and let
            the journey begin.
          </AppText>
        </View>

        <View
          style={[
            styles.formArea,
            { marginTop: compactLayout ? spacing.sm : spacing.md },
          ]}
        >
          <AppInput
            accessibilityLabel="Name your dream"
            containerStyle={styles.inputContainer}
            maxLength={DREAM_NAME_MAX_LENGTH}
            onChangeText={setDreamName}
            placeholder="My dream name is..."
            returnKeyType="next"
            selectionColor={colors.primary}
            value={dreamName}
          />
        </View>

        <View style={[styles.bottomArea, { marginTop: sectionGap }]}>
          <HintRow
            style={{
              marginBottom: compactLayout ? spacing.md : spacing.lg,
            }}
            text={
              "Keep it simple, poetic, or practical.\nThe name only needs to mean something to you."
            }
          />

          <AppButton
            icon={<ArrowRightIcon color={colors.textOnPrimary} />}
            label="Continue"
            onPress={() => router.navigate("/describe-dream")}
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
  inputContainer: {
    marginBottom: spacing.sm,
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
