import { useMemo, useState } from "react";
import { useRouter } from "expo-router";
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

import { NavigationHeader } from "@/components/NavigationHeader";
import { colors } from "@/theme/colors";
import { radius, shadows, spacing } from "@/theme/theme";

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
  return <Text style={styles.headerSparkle}>✦</Text>;
}

function Ornament() {
  return (
    <View style={styles.ornament}>
      <View style={styles.ornamentLine} />
      <Text style={styles.ornamentStar}>✦</Text>
      <View style={styles.ornamentLine} />
    </View>
  );
}

export default function StateScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { height, width } = useWindowDimensions();
  const [customState, setCustomState] = useState("");
  const [selected, setSelected] = useState<string[]>([
    "Alive",
    "Magnetic",
    "Peaceful",
  ]);
  const compact = height < 760;
  const contentWidth = Math.min(width - 28, 560);

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
      <NavigationHeader
        rightAction={{
          accessibilityLabel: "Gemify inspiration",
          icon: <SparkleIcon />,
          onPress: () => undefined,
        }}
      />

      <View style={styles.screen}>
        <Image
          resizeMode="cover"
          source={BACKGROUND}
          style={[styles.background, { height, width }]}
        />
        <View pointerEvents="none" style={styles.overlay} />

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
                  paddingTop: insets.top + (compact ? 61 : 70),
                  width: contentWidth,
                },
              ]}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.brandBlock}>
                <Text style={styles.brand}>G A M I F Y</Text>
                <Ornament />
              </View>

              <Text style={[styles.title, compact && styles.titleCompact]}>
                How do you want{"\n"}
                <Text style={styles.titleAccent}>to feel</Text> there?
              </Text>

              <Ornament />

              <Text style={styles.subtitle}>
                Choose what this life feels like,{"\n"}or write your own.
              </Text>

              <View style={styles.customInputWrap}>
                <TextInput
                  accessibilityLabel="Write your own desired state"
                  onChangeText={setCustomState}
                  onSubmitEditing={addCustomState}
                  placeholder="Type anything..."
                  placeholderTextColor="rgba(218, 189, 223, 0.58)"
                  returnKeyType="done"
                  selectionColor="#F8BD73"
                  style={styles.customInput}
                  value={customState}
                />
                <Pressable
                  accessibilityLabel="Add custom state"
                  accessibilityRole="button"
                  hitSlop={10}
                  onPress={addCustomState}
                >
                  <Text style={styles.inputSparkles}>✦</Text>
                </Pressable>
              </View>

              <View
                style={[
                  styles.chipGrid,
                  { rowGap: compact ? 7 : 9 },
                ]}
              >
                {STATES.map(({ icon, label }) => {
                  const isSelected = selectedSet.has(label);
                  return (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityState={{ selected: isSelected }}
                      key={label}
                      onPress={() => toggleState(label)}
                      style={({ pressed }) => [
                        styles.chip,
                        isSelected && styles.chipSelected,
                        pressed && styles.pressed,
                      ]}
                    >
                      <Text style={[styles.chipIcon, isSelected && styles.chipIconSelected]}>
                        {icon}
                      </Text>
                      <Text
                        numberOfLines={1}
                        style={[styles.chipLabel, isSelected && styles.chipLabelSelected]}
                      >
                        {label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <View style={styles.yourStateHeading}>
                <View style={styles.headingLine} />
                <Text style={styles.yourStateText}>YOUR STATE</Text>
                <View style={styles.headingLine} />
              </View>

              <View style={styles.selectedRow}>
                {selected.map((item) => (
                  <Pressable
                    accessibilityLabel={`Remove ${item}`}
                    accessibilityRole="button"
                    key={item}
                    onPress={() => toggleState(item)}
                    style={styles.selectedPill}
                  >
                    <Text numberOfLines={1} style={styles.selectedPillText}>
                      {item}
                    </Text>
                    <Text style={styles.remove}>×</Text>
                  </Pressable>
                ))}
              </View>

              <Pressable
                accessibilityLabel="Continue"
                accessibilityRole="button"
                onPress={() => router.navigate("/create-previous-milestone")}
                style={({ pressed }) => [
                  styles.continueImageButton,
                  pressed && styles.continuePressed,
                ]}
              >
                <Image
                  resizeMode="contain"
                  source={CONTINUE_BUTTON}
                  style={styles.continueImage}
                />
              </Pressable>

              <Text style={styles.footnote}>▣  You can change this anytime</Text>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  background: { ...StyleSheet.absoluteFill },
  brand: {
    color: "#F3C47E",
    fontFamily: Platform.select({ ios: "Georgia", default: "serif" }),
    fontSize: 13,
    letterSpacing: 4,
  },
  brandBlock: { alignItems: "center", gap: 8 },
  chip: {
    alignItems: "center",
    backgroundColor: "rgba(36, 23, 45, 0.64)",
    borderColor: "rgba(220, 148, 197, 0.28)",
    borderRadius: radius.round,
    borderWidth: 1,
    flexDirection: "row",
    height: 44,
    justifyContent: "center",
    paddingHorizontal: 8,
    width: "31.5%",
  },
  chipGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 14,
    width: "100%",
  },
  chipIcon: { color: "#E7A56F", fontSize: 18, marginRight: 7 },
  chipIconSelected: { color: "#FFD582" },
  chipLabel: { color: "#DDC9DF", fontSize: 13 },
  chipLabelSelected: { color: "#FFE09A" },
  chipSelected: {
    backgroundColor: "rgba(113, 60, 49, 0.67)",
    borderColor: "#FFD082",
    ...shadows.goldGlow,
  },
  content: {
    alignItems: "center",
    alignSelf: "center",
    paddingHorizontal: 2,
  },
  continueImage: {
    height: 140,
    width: 210,
  },
  continueImageButton: {
    marginTop: 17,
  },
  continuePressed: { opacity: 0.86, transform: [{ scale: 0.98 }] },
  customInput: {
    color: "#F6E8E6",
    flex: 1,
    fontSize: 16,
    outlineColor: "transparent",
    paddingHorizontal: 16,
    paddingVertical: 0,
  },
  customInputWrap: {
    alignItems: "center",
    backgroundColor: "rgba(42, 25, 50, 0.62)",
    borderColor: "rgba(244, 178, 215, 0.72)",
    borderRadius: 17,
    borderWidth: 1,
    flexDirection: "row",
    height: 56,
    marginTop: 17,
    paddingRight: 16,
    width: "94%",
  },
  footnote: {
    color: "rgba(213, 193, 215, 0.62)",
    fontSize: 12,
    marginTop: 13,
  },
  headerSparkle: { color: "#FFD28C", fontSize: 24 },
  headingLine: { backgroundColor: "rgba(236, 160, 91, 0.7)", height: 1, width: 62 },
  inputSparkles: { color: "#FFD08C", fontSize: 24 },
  ornament: { alignItems: "center", flexDirection: "row", gap: 9 },
  ornamentLine: { backgroundColor: "rgba(237, 171, 105, 0.65)", height: 1, width: 29 },
  ornamentStar: { color: "#F7BE77", fontSize: 10 },
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(7, 6, 20, 0.2)",
  },
  pressed: { opacity: 0.8, transform: [{ scale: 0.98 }] },
  remove: { color: "#FFE0A2", fontSize: 20, lineHeight: 20 },
  safeArea: { flex: 1 },
  screen: { backgroundColor: colors.background, flex: 1, overflow: "hidden" },
  selectedPill: {
    alignItems: "center",
    backgroundColor: "rgba(78, 46, 43, 0.74)",
    borderColor: "rgba(255, 201, 113, 0.82)",
    borderRadius: radius.round,
    borderWidth: 1,
    flex: 1,
    flexDirection: "row",
    height: 40,
    justifyContent: "center",
    maxWidth: 150,
    paddingHorizontal: 10,
  },
  selectedPillText: { color: "#FFE09B", flexShrink: 1, fontSize: 13, marginRight: 8 },
  selectedRow: { flexDirection: "row", gap: 8, justifyContent: "center", width: "94%" },
  subtitle: {
    color: "rgba(238, 224, 233, 0.85)",
    fontSize: 14,
    lineHeight: 21,
    marginTop: 9,
    textAlign: "center",
  },
  title: {
    color: "#F8ECE5",
    fontFamily: Platform.select({ ios: "Georgia", default: "serif" }),
    fontSize: 33,
    fontWeight: "400",
    lineHeight: 39,
    marginBottom: 10,
    marginTop: 11,
    textAlign: "center",
  },
  titleAccent: { color: "#F7C27B" },
  titleCompact: { fontSize: 29, lineHeight: 34, marginTop: 6 },
  yourStateHeading: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    marginBottom: 9,
    marginTop: 17,
  },
  yourStateText: { color: "#F5BE76", fontSize: 12, letterSpacing: 2.2 },
});
