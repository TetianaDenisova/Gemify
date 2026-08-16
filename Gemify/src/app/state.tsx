import { useMemo, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  Image,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { createDream } from "@/db";
import {
  AppInput,
  AppText,
  Chip,
  ScreenHeader,
  ScreenScaffold,
} from "@/shared/components";
import { colors } from "@/theme/colors";
import { fonts, fontSizes, iconSizes, pressed, spacing } from "@/theme/theme";

const BACKGROUND = require("../../assets/state_background.png");
const CONTINUE_BUTTON = require("../../assets/state/continue-btn.png");
const MAX_SELECTIONS = 3;

const STATES = [
  { icon: "♠", label: "Alive" },
  { icon: "⌁", label: "Free" },
  { icon: "♕", label: "Powerful" },
  { icon: "♨", label: "Calm" },
  { icon: "☾", label: "Peaceful" },
  { icon: "∪", label: "Magnetic" },
  { icon: "✣", label: "Creative" },
  { icon: "♡", label: "Loved" },
  { icon: "✦", label: "Clear" },
  { icon: "♢", label: "Confident" },
  { icon: "♙", label: "Connected" },
  { icon: "☀", label: "Joyful" },
  { icon: "⌂", label: "Safe" },
  { icon: "ϟ", label: "Energized" },
  { icon: "✧", label: "Desired" },
] as const;

function SparkleIcon() {
  return <AppText style={styles.headerSparkle}>✦</AppText>;
}

function Ornament() {
  return (
    <View style={styles.ornament}>
      <View style={styles.ornamentLine} />
      <AppText style={styles.ornamentStar}>✦</AppText>
      <View style={styles.ornamentLine} />
    </View>
  );
}

export default function StateScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const { name, description } = useLocalSearchParams<{
    name?: string;
    description?: string;
  }>();
  const [customState, setCustomState] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([
    "Alive",
    "Magnetic",
    "Peaceful",
  ]);
  const compact = height < 760;

  const finishDream = async () => {
    if (saving) return;
    setSaving(true);
    setSaveError(null);
    try {
      const dream = await createDream({
        title: name?.trim() || "My dream",
        visionStatement: description?.trim() || null,
        feelingStates: selected,
      });
      router.dismissAll();
      router.push({
        pathname: "/journey-map",
        params: { dreamId: String(dream.id) },
      });
    } catch (error) {
      console.error("Failed to save the dream", error);
      setSaveError("Something went wrong while saving. Please try again.");
      setSaving(false);
    }
  };

  const selectedSet = useMemo(() => new Set(selected), [selected]);

  const toggleState = (label: string) => {
    setSelected((current) => {
      if (current.includes(label)) {
        return current.filter((item) => item !== label);
      }

      if (current.length >= MAX_SELECTIONS) {
        return [...current.slice(1), label];
      }

      return [...current, label];
    });
  };

  const addCustomState = () => {
    const state = customState.trim();
    if (!state) return;
    setSelected((current) =>
      current.includes(state)
        ? current
        : [...current.slice(-(MAX_SELECTIONS - 1)), state],
    );
    setCustomState("");
  };

  return (
    <>
      <ScreenHeader
        asStackHeader
        rightAction={{
          accessibilityLabel: "Gemify inspiration",
          icon: <SparkleIcon />,
          onPress: () => undefined,
        }}
      />

      <ScreenScaffold
        backgroundImage={BACKGROUND}
        contentStyle={[
          styles.content,
          { paddingTop: insets.top + (compact ? 61 : 70) },
        ]}
        keyboardAvoiding
        overlayOpacity={0.2}
      >
        <View style={styles.brandBlock}>
          <AppText style={styles.brand} variant="eyebrow">
            G A M I F Y
          </AppText>
          <Ornament />
        </View>

        <AppText
          align="center"
          style={[styles.title, compact && styles.titleCompact]}
          variant="cardTitle"
        >
          How do you want{"\n"}
          <AppText color={colors.primary} variant="cardTitle">
            to feel
          </AppText>{" "}
          there?
        </AppText>

        <Ornament />

        <AppText align="center" style={styles.subtitle} variant="bodySmall">
          Choose what this life feels like,{"\n"}or write your own.
        </AppText>

        <View style={styles.customInputWrap}>
          <AppInput
            accessibilityLabel="Write your own desired state"
            inputStyle={styles.customInputText}
            onChangeText={setCustomState}
            onSubmitEditing={addCustomState}
            placeholder="Type anything..."
            returnKeyType="done"
            selectionColor={colors.primary}
            value={customState}
          />
          <Pressable
            accessibilityLabel="Add custom state"
            accessibilityRole="button"
            hitSlop={10}
            onPress={addCustomState}
            style={styles.inputSparkleButton}
          >
            <AppText style={styles.inputSparkles}>✦</AppText>
          </Pressable>
        </View>

        <View style={styles.chipGrid}>
          {STATES.map(({ icon, label }) => {
            const isSelected = selectedSet.has(label);
            return (
              <Chip
                icon={
                  <AppText
                    color={
                      isSelected ? colors.primaryBright : colors.primary
                    }
                    style={styles.chipIcon}
                  >
                    {icon}
                  </AppText>
                }
                key={label}
                label={label}
                onPress={() => toggleState(label)}
                selected={isSelected}
                style={styles.chip}
              />
            );
          })}
        </View>

        <View style={styles.yourStateHeading}>
          <View style={styles.headingLine} />
          <AppText variant="eyebrow">YOUR STATE</AppText>
          <View style={styles.headingLine} />
        </View>

        <View style={styles.selectedRow}>
          {selected.map((item) => (
            <Chip
              accessibilityLabel={`Remove ${item}`}
              key={item}
              label={`${item} ×`}
              onPress={() => toggleState(item)}
              selected
              style={styles.selectedPill}
            />
          ))}
        </View>

        <Pressable
          accessibilityLabel="Continue"
          accessibilityRole="button"
          disabled={saving}
          onPress={finishDream}
          style={({ pressed: isPressed }) => [
            styles.continueImageButton,
            saving && styles.continueImageButtonSaving,
            isPressed && !saving && pressed,
          ]}
        >
          <Image
            resizeMode="contain"
            source={CONTINUE_BUTTON}
            style={styles.continueImage}
          />
        </Pressable>

        {saveError ? (
          <AppText align="center" color={colors.danger} variant="caption">
            {saveError}
          </AppText>
        ) : null}

        <AppText style={styles.footnote} variant="caption">
          ▣  You can change this anytime
        </AppText>
      </ScreenScaffold>
    </>
  );
}

const styles = StyleSheet.create({
  brand: {
    fontFamily: fonts.serif,
    letterSpacing: 4,
  },
  brandBlock: {
    alignItems: "center",
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.sm,
    width: "31.5%",
  },
  chipGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: spacing.md,
    rowGap: spacing.sm,
    width: "100%",
  },
  chipIcon: {
    fontSize: iconSizes.sm,
  },
  content: {
    alignItems: "center",
  },
  continueImage: {
    height: 140,
    width: 210,
  },
  continueImageButton: {
    marginTop: spacing.md,
  },
  continueImageButtonSaving: {
    opacity: 0.5,
  },
  customInputText: {
    paddingRight: spacing.xl,
  },
  customInputWrap: {
    marginTop: spacing.md,
    width: "94%",
  },
  footnote: {
    marginTop: spacing.md,
  },
  headerSparkle: {
    color: colors.primaryBright,
    fontSize: iconSizes.md,
  },
  headingLine: {
    backgroundColor: colors.borderStrong,
    height: 1,
    width: 62,
  },
  inputSparkleButton: {
    bottom: 0,
    justifyContent: "center",
    position: "absolute",
    right: spacing.md,
    top: 0,
  },
  inputSparkles: {
    color: colors.primaryBright,
    fontSize: iconSizes.md,
  },
  ornament: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  ornamentLine: {
    backgroundColor: colors.borderStrong,
    height: 1,
    width: 29,
  },
  ornamentStar: {
    color: colors.primary,
    fontSize: fontSizes.xxs,
  },
  selectedPill: {
    flex: 1,
    maxWidth: 150,
  },
  selectedRow: {
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "center",
    width: "94%",
  },
  subtitle: {
    marginTop: spacing.sm,
  },
  title: {
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  titleCompact: {
    marginTop: spacing.xs,
  },
  yourStateHeading: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
});
