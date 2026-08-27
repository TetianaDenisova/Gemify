import { useLocalSearchParams, useRouter } from "expo-router";
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

const DESCRIPTION_MAX_LENGTH = 300;
const ENTERING_BACKGROUND = require("../../assets/create-goal/entering.png");

export default function DescribeDreamScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { name } = useLocalSearchParams<{ name?: string }>();
  const [description, setDescription] = useState("");
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
            Describe{"\n"}your dream
          </AppText>

          <AppText align="center" style={styles.subtitle} variant="subtitle">
            Not a goal. A reality.{"\n"}A life you want to live.
          </AppText>
        </View>

        <View
          style={[
            styles.formArea,
            { marginTop: compactLayout ? spacing.sm : spacing.md },
          ]}
        >
          <AppInput
            accessibilityLabel="Describe your future reality"
            containerStyle={styles.inputContainer}
            inputStyle={{ minHeight: compactLayout ? 98 : 128 }}
            maxLength={DESCRIPTION_MAX_LENGTH}
            multiline
            onChangeText={setDescription}
            placeholder="Write your future..."
            selectionColor={colors.primary}
            showCounter
            value={description}
          />
        </View>

        <View style={[styles.bottomArea, { marginTop: sectionGap }]}>
          <HintRow
            style={{
              marginBottom: compactLayout ? spacing.md : spacing.lg,
            }}
            text={
              "Be vivid. Be honest. Be you.\nThere's no right or wrong here."
            }
          />

          <AppButton
            icon={<ArrowRightIcon color={colors.textOnPrimary} />}
            label="Continue"
            onPress={() =>
              router.navigate({
                pathname: "/see-dream",
                params: { name: name ?? "", description: description.trim() },
              })
            }
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
