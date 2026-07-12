import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import type { ReactElement } from "react";
import { useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle, Path } from "react-native-svg";

import { NavigationHeader } from "@/components/NavigationHeader";
import { colors } from "@/theme/colors";
import { radius, shadows, spacing, typography } from "@/theme/theme";

const BACKGROUND = require("../../assets/create-goal/entering.png");
const BANNER = require("../../assets/create-goal/banner-create-milestone.png");

const STEP_NAME_MAX_LENGTH = 40;
const SHORT_MAX_LENGTH = 40;
const LONG_MAX_LENGTH = 60;
const MIN_READABLE_BANNER_WIDTH = 380;

type FieldConfig = {
  id: string;
  label: string;
  maxLength: number;
  placeholder: string;
  renderIcon: () => ReactElement;
};

function InfoIcon() {
  return (
    <Svg fill="none" height={20} viewBox="0 0 24 24" width={20}>
      <Circle cx={12} cy={12} r={9} stroke={colors.primary} strokeWidth={1.7} />
      <Path
        d="M12 10.6v5.2M12 7.6h.01"
        stroke={colors.primary}
        strokeLinecap="round"
        strokeWidth={1.9}
      />
    </Svg>
  );
}

function FlagIcon() {
  return (
    <Svg fill="none" height={34} viewBox="0 0 24 24" width={34}>
      <Path
        d="M5 21V4.8c3.5-2 6 .9 10-.9 1-.4 1.9-.9 3-1.8v9.5c-1.1.9-2 1.4-3 1.8-4 1.8-6.5-1.1-10 .9"
        stroke={colors.primary}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.6}
      />
    </Svg>
  );
}

function HeartIcon() {
  return (
    <Svg fill="none" height={34} viewBox="0 0 24 24" width={34}>
      <Path
        d="M20.6 5.8c-2-2.3-5.2-1.7-6.9.5L12 8.4l-1.7-2.1C8.6 4.1 5.4 3.5 3.4 5.8c-2.3 2.7-.9 6.4 1.6 8.7l7 6.1 7-6.1c2.5-2.3 3.9-6 1.6-8.7Z"
        stroke={colors.primary}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.6}
      />
    </Svg>
  );
}

function UserIcon() {
  return (
    <Svg fill="none" height={34} viewBox="0 0 24 24" width={34}>
      <Path
        d="M12 12.5a4.1 4.1 0 1 0 0-8.2 4.1 4.1 0 0 0 0 8.2ZM4.2 21c.9-4.2 3.7-6.2 7.8-6.2s6.9 2 7.8 6.2"
        stroke={colors.primary}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.6}
      />
    </Svg>
  );
}

function SparkIcon() {
  return (
    <Svg fill="none" height={34} viewBox="0 0 24 24" width={34}>
      <Path
        d="M12 2.8c.7 4.4 2.8 6.5 7.2 7.2-4.4.7-6.5 2.8-7.2 7.2-.7-4.4-2.8-6.5-7.2-7.2 4.4-.7 6.5-2.8 7.2-7.2Z"
        stroke={colors.primary}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.6}
      />
    </Svg>
  );
}

function GiftIcon() {
  return (
    <Svg fill="none" height={34} viewBox="0 0 24 24" width={34}>
      <Path
        d="M4 10h16v11H4V10ZM3 6.8h18V10H3V6.8ZM12 6.8V21M8.2 6.8C6.3 6.5 5.1 5.6 5.1 4.3c0-1.1.9-2 2-2 2.2 0 3.6 2.6 4.9 4.5M15.8 6.8c1.9-.3 3.1-1.2 3.1-2.5 0-1.1-.9-2-2-2-2.2 0-3.6 2.6-4.9 4.5"
        stroke={colors.primary}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.6}
      />
    </Svg>
  );
}

const FIELDS: readonly FieldConfig[] = [
  {
    id: "stepName",
    label: "Step name",
    maxLength: STEP_NAME_MAX_LENGTH,
    placeholder: "e.g. Inner Clarity",
    renderIcon: FlagIcon,
  },
  {
    id: "feeling",
    label: "What will you feel when you finish?",
    maxLength: SHORT_MAX_LENGTH,
    placeholder: "e.g. Calm, confident, relieved",
    renderIcon: HeartIcon,
  },
  {
    id: "helper",
    label: "Who will help you?",
    maxLength: SHORT_MAX_LENGTH,
    placeholder: "e.g. Mentor, Guide, Friend",
    renderIcon: UserIcon,
  },
  {
    id: "artifact",
    label: "What artifact will mark completion?",
    maxLength: LONG_MAX_LENGTH,
    placeholder: "e.g. A letter, A symbol, A key",
    renderIcon: SparkIcon,
  },
  {
    id: "reward",
    label: "What reward will help you on the next steps?",
    maxLength: LONG_MAX_LENGTH,
    placeholder: "e.g. Confidence, Knowledge, New skill",
    renderIcon: GiftIcon,
  },
];

export default function CreatePreviousMilestoneScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { height, width } = useWindowDimensions();
  const compact = height < 760 || width < 380;
  const contentWidth = Math.min(width - 24, 620);
  const showBanner = contentWidth >= MIN_READABLE_BANNER_WIDTH;
  const [values, setValues] = useState<Record<string, string>>({});

  return (
    <>
      <NavigationHeader />

      <View style={styles.screen}>
        <Image
          resizeMode="cover"
          source={BACKGROUND}
          style={[styles.background, { height, width }]}
        />
        <View pointerEvents="none" style={styles.backgroundShade} />

        <SafeAreaView edges={["bottom"]} style={styles.safeArea}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.safeArea}
          >
            <ScrollView
              bounces={false}
              contentContainerStyle={[
                styles.content,
                {
                  minHeight: height,
                  paddingBottom: Math.max(insets.bottom, spacing.md),
                  paddingTop: insets.top + (compact ? 60 : 72),
                  width: contentWidth,
                },
              ]}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View
                style={[
                  styles.pageSurface,
                  { padding: compact ? spacing.md : spacing.lg },
                ]}
              >
                <View style={styles.titleBlock}>
                  <Text style={[styles.title, compact && styles.titleCompact]}>
                    Which milestone came before "Awakening"?
                  </Text>
                  <Text style={styles.subtitle}>
                    Trace your journey backward from{' '}
                    <Text style={styles.goldText}>Point B</Text>
                    {' '}to where it all begins.
                  </Text>
                </View>

                {showBanner ? (
                  <View style={styles.bannerContainer}>
                    <Image
                      source={BANNER}
                      resizeMode="cover"
                      style={styles.banner}
                    />
                  </View>
                ) : null}
                <View style={styles.form}>
                  {FIELDS.map((field) => {
                    const value = values[field.id] ?? "";
                    const Icon = field.renderIcon;

                    return (
                      <View key={field.id} style={styles.inputRow}>
                        <View style={styles.inputIcon}>
                          <Icon />
                        </View>
                        <View style={styles.inputTextBlock}>
                          <Text numberOfLines={1} style={styles.inputLabel}>
                            {field.label}
                          </Text>
                          <TextInput
                            accessibilityLabel={field.label}
                            maxLength={field.maxLength}
                            onChangeText={(nextValue) =>
                              setValues((current) => ({
                                ...current,
                                [field.id]: nextValue,
                              }))
                            }
                            placeholder={field.placeholder}
                            placeholderTextColor="rgba(211, 197, 185, 0.62)"
                            selectionColor={colors.primary}
                            style={styles.input}
                            value={value}
                          />
                        </View>
                        <Text style={styles.counter}>
                          {value.length}/{field.maxLength}
                        </Text>
                      </View>
                    );
                  })}
                </View>

                <Pressable
                  accessibilityLabel="Add new milestone"
                  accessibilityRole="button"
                  onPress={() => router.navigate("/journey-map")}
                  style={({ pressed }) => [
                    styles.placeButtonWrap,
                    pressed && styles.placeButtonPressed,
                  ]}
                >
                  <LinearGradient
                    colors={["#FFE08F", "#F5A12F", "#B66210"]}
                    end={{ x: 1, y: 0.5 }}
                    start={{ x: 0, y: 0.5 }}
                    style={styles.placeButton}
                  >
                    <Text style={styles.placeButtonText}>Add new milestone</Text>
                  </LinearGradient>
                </Pressable>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  background: {
    ...StyleSheet.absoluteFill,
  },
  backgroundShade: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(1, 5, 13, 0.58)",
  },
  content: {
    alignItems: "center",
    alignSelf: "center",
    paddingHorizontal: 0,
  },
  counter: {
    color: "rgba(224, 216, 208, 0.58)",
    fontSize: 16,
    marginLeft: spacing.sm,
  },
  form: {
    gap: 11,
    marginTop: spacing.lg,
    width: "100%",
  },
  goldText: {
    color: colors.primary,
  },
  bannerContainer: {
    alignSelf: 'stretch',
    aspectRatio: 1712 / 650,
    marginHorizontal: -spacing.md,
    marginTop: spacing.sm,
    overflow: 'hidden',
  },

  banner: {
    width: '100%',
    height: '100%',
  },
  input: {
    color: colors.textPrimary,
    fontSize: 16,
    marginTop: 3,
    outlineColor: colors.transparent,
    padding: 0,
  },
  inputIcon: {
    alignItems: "center",
    height: 44,
    justifyContent: "center",
    marginRight: spacing.md,
    width: 44,
  },
  inputLabel: {
    color: "#F3ECE6",
    fontSize: 16,
    lineHeight: 21,
  },
  inputRow: {
    alignItems: "center",
    backgroundColor: "rgba(2, 10, 18, 0.94)",
    borderColor: "rgba(230, 142, 42, 0.72)",
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    minHeight: 70,
    paddingHorizontal: spacing.md,
    width: "100%",
  },
  inputTextBlock: {
    flex: 1,
    minWidth: 0,
  },
  noteRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 11,
    justifyContent: "center",
    marginTop: spacing.md,
    width: "100%",
  },
  noteText: {
    color: "rgba(224, 213, 204, 0.62)",
    flexShrink: 1,
    fontSize: 14,
    lineHeight: 19,
  },
  pageSurface: {
    backgroundColor: "rgba(1, 8, 15, 0.88)",
    borderColor: "rgba(216, 126, 34, 0.45)",
    borderRadius: 26,
    borderWidth: 1,
    overflow: "hidden",
    width: "100%",
  },
  placeButton: {
    alignItems: "center",
    borderColor: "#FFE7A3",
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "center",
    minHeight: 64,
    overflow: "hidden",
    paddingHorizontal: spacing.lg,
  },
  placeButtonPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.99 }],
  },
  placeButtonText: {
    color: "#1A0F04",
    fontFamily: Platform.select({ ios: "Georgia", default: "serif" }),
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
  },
  placeButtonWrap: {
    borderRadius: radius.lg,
    marginTop: spacing.xl,
    width: "100%",
    ...shadows.goldGlow,
  },
  returnButtonWrap: {
    borderRadius: radius.lg,
    marginTop: spacing.sm,
    width: "100%",
    ...shadows.goldGlow,
  },
  placeSpark: {
    color: "#1A0F04",
    fontSize: 30,
    lineHeight: 32,
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
    color: "rgba(234, 219, 208, 0.76)",
    fontSize: 16,
    lineHeight: 23,
    marginTop: spacing.sm,
    textAlign: "center",
  },
  title: {
    ...typography.title,
    color: "#FFE2A1",
    fontSize: 27,
    lineHeight: 34,
    textAlign: "center",
  },
  titleBlock: {
    alignItems: "center",
    width: "100%",
  },
  titleCompact: {
    fontSize: 23,
    lineHeight: 29,
  },
});
