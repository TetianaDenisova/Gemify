import { useState } from "react";
import { useRouter } from "expo-router";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";

import { NavigationHeader } from "@/components/NavigationHeader";
import { colors } from "@/theme/colors";
import { radius, shadows, spacing, typography } from "@/theme/theme";

const DESCRIPTION_MAX_LENGTH = 300;
const ENTERING_BACKGROUND = require("../../assets/create-goal/entering.png");

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(value, minimum), maximum);
}

function BulbIcon() {
  return (
    <Svg fill="none" height={24} viewBox="0 0 24 24" width={24}>
      <Path
        d="M9 18h6M10 22h4M8.4 15.3A6.2 6.2 0 1 1 15.6 15c-.9.7-1.3 1.4-1.4 2H9.8c-.1-.6-.5-1.1-1.4-1.7Z"
        stroke={colors.primary}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.7}
      />
    </Svg>
  );
}

function ArrowIcon() {
  return (
    <Svg fill="none" height={22} viewBox="0 0 24 24" width={22}>
      <Path
        d="M5 12h14M13 6l6 6-6 6"
        stroke={colors.primary}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
      />
    </Svg>
  );
}

export default function DescribeDreamScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [descriptionFocused, setDescriptionFocused] = useState(false);
  const [description, setDescription] = useState("");
  const { height, width } = useWindowDimensions();
  const compactLayout = height < 760 || width > height;
  const horizontalPadding = clamp(width * 0.06, spacing.md, spacing.xl);
  const titleFontSize = clamp(
    width * 0.094,
    compactLayout ? 28 : 32,
    compactLayout ? 32 : 37,
  );
  const inputHeight = compactLayout
    ? 150
    : clamp(height * 0.22, 180, 210);
  const sectionGap = compactLayout ? spacing.md : spacing.xl;

  return (
    <>
      <NavigationHeader />
      <View style={styles.screen}>
        <Image
          resizeMode="cover"
          source={ENTERING_BACKGROUND}
          style={[styles.backgroundImage, { height, width }]}
        />
        <View pointerEvents="none" style={styles.darkOverlay} />

        <SafeAreaView edges={["bottom"]} style={styles.safeArea}>
          <KeyboardAvoidingView
            behavior={
              Platform.OS === "ios"
                ? "padding"
                : Platform.OS === "android"
                  ? "height"
                  : undefined
            }
            style={styles.keyboardView}
          >
            <View
              style={[
                styles.content,
                {
                  paddingBottom: compactLayout ? spacing.md : spacing.lg,
                  paddingHorizontal: horizontalPadding,
                  paddingTop: insets.top + 68,
                },
              ]}
            >
              <View
                style={[
                  styles.topContent,
                  { marginTop: compactLayout ? spacing.xs : spacing.sm },
                ]}
              >
                <Text
                  style={[
                    styles.title,
                    {
                      fontSize: titleFontSize,
                      lineHeight: titleFontSize + 6,
                    },
                  ]}
                >
                  Describe{"\n"}your dream
                </Text>

                <Text
                  style={[styles.subtitle, { marginTop: spacing.lg }]}
                >
                  Not a goal. A reality.{"\n"}A life you want to live.
                </Text>
              </View>

              <View
                style={[
                  styles.formArea,
                  { marginTop: compactLayout ? spacing.sm : spacing.md },
                ]}
              >
                <View
                  style={[
                    styles.inputWrapper,
                    { minHeight: inputHeight },
                    descriptionFocused && styles.inputWrapperFocused,
                  ]}
                >
                  <TextInput
                    accessibilityLabel="Describe your future reality"
                    maxLength={DESCRIPTION_MAX_LENGTH}
                    multiline
                    onBlur={() => setDescriptionFocused(false)}
                    onChangeText={setDescription}
                    onFocus={() => setDescriptionFocused(true)}
                    placeholder="Write your future..."
                    placeholderTextColor={colors.textMuted}
                    selectionColor={colors.primary}
                    style={[
                      styles.input,
                      { minHeight: compactLayout ? 98 : 128 },
                    ]}
                    textAlignVertical="top"
                    value={description}
                  />

                  <Text style={styles.counter}>
                    {description.length}/{DESCRIPTION_MAX_LENGTH}
                  </Text>
                </View>
              </View>

              <View style={[styles.bottomArea, { marginTop: sectionGap }]}>
                <View
                  style={[
                    styles.hintRow,
                    { marginBottom: compactLayout ? spacing.md : spacing.lg },
                  ]}
                >
                  <View style={styles.iconCircle}>
                    <BulbIcon />
                  </View>

                  <Text style={styles.hintText}>
                    Be vivid. Be honest. Be you.{"\n"}
                    There&apos;s no right or wrong here.
                  </Text>
                </View>

                <Pressable
                  accessibilityRole="button"
                  onPress={() => router.navigate("/state")}
                  style={({ pressed }) => [
                    styles.continueButton,
                    { height: compactLayout ? 56 : 64 },
                    pressed && styles.continueButtonPressed,
                  ]}
                >
                  <Text style={styles.continueText}>Continue</Text>

                  <View style={styles.arrowCircle}>
                    <ArrowIcon />
                  </View>
                </Pressable>
              </View>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  arrowCircle: {
    alignItems: "center",
    backgroundColor: colors.secondaryDark,
    borderRadius: radius.round,
    height: 48,
    justifyContent: "center",
    position: "absolute",
    right: 10,
    width: 48,
  },
  backgroundImage: {
    ...StyleSheet.absoluteFill,
  },
  bottomArea: {
    width: "100%",
  },
  content: {
    alignSelf: "center",
    flexGrow: 1,
    justifyContent: "space-between",
    maxWidth: 560,
    width: "100%",
  },
  continueButton: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: radius.round,
    height: 64,
    justifyContent: "center",
    ...shadows.goldGlow,
  },
  continueButtonPressed: {
    backgroundColor: colors.primarySoft,
    transform: [{ scale: 0.99 }],
  },
  continueText: {
    color: colors.secondaryDark,
    fontSize: 18,
    fontWeight: "700",
  },
  counter: {
    ...typography.caption,
    bottom: spacing.md,
    color: colors.textMuted,
    position: "absolute",
    right: spacing.md,
  },
  darkOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.overlayDark,
    opacity: 0.45,
  },
  formArea: {
    alignItems: "center",
    width: "100%",
  },
  hintRow: {
    alignItems: "center",
    flexDirection: "row",
  },
  hintText: {
    ...typography.body,
    color: colors.textSecondary,
    flex: 1,
    fontSize: 14,
    lineHeight: 21,
  },
  iconCircle: {
    alignItems: "center",
    backgroundColor: colors.surfaceGlass,
    borderColor: colors.borderSoft,
    borderRadius: radius.round,
    borderWidth: 1,
    height: 52,
    justifyContent: "center",
    marginRight: spacing.md,
    width: 52,
  },
  input: {
    backgroundColor: colors.transparent,
    borderColor: colors.transparent,
    borderWidth: 0,
    color: colors.textPrimary,
    flex: 1,
    fontSize: 16,
    lineHeight: 23,
    outlineColor: colors.transparent,
    outlineWidth: 0,
    padding: 0,
  },
  inputWrapper: {
    backgroundColor: colors.surfaceGlass,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    width: "100%",
  },
  inputWrapperFocused: {
    borderWidth: 0,
  },
  keyboardView: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  screen: {
    backgroundColor: colors.background,
    flex: 1,
    overflow: "hidden",
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
  },
  title: {
    ...typography.title,
    letterSpacing: -0.4,
    textAlign: "center",
  },
  topContent: {
    alignItems: "center",
    width: "100%",
  },
});
