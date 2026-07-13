import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle, Path, Rect } from "react-native-svg";

import { colors } from "@/theme/colors";
import { controls, radius, shadows, spacing, typography } from "@/theme/theme";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
const SELECTED_DAYS = new Set(["Mon", "Tue", "Wed", "Fri"]);
const TIMES = ["Morning", "After lunch", "Evening"] as const;

type IconName =
  | "calendar"
  | "chat"
  | "clock"
  | "close"
  | "fire"
  | "heart"
  | "leaf"
  | "shield"
  | "spark"
  | "target";

type PlanningRow = {
  icon: IconName;
  label: string;
};

const PLANNING_ROWS: readonly PlanningRow[] = [
  { icon: "fire", label: "Make it easy to start" },
  { icon: "heart", label: "Easy version for bad day" },
  { icon: "shield", label: "Obstacles & backup plan" },
];

function BackIcon() {
  return (
    <Svg height={30} viewBox="0 0 24 24" width={30}>
      <Path
        d="M15 5 8 12l7 7M9 12h10"
        fill="none"
        stroke={colors.primary}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
      />
    </Svg>
  );
}

function Icon({ name, size = 32 }: { name: IconName; size?: number }) {
  if (name === "close") {
    return (
      <Svg height={size} viewBox="0 0 24 24" width={size}>
        <Path
          d="m6 6 12 12M18 6 6 18"
          fill="none"
          stroke={colors.primary}
          strokeLinecap="round"
          strokeWidth={1.8}
        />
      </Svg>
    );
  }

  if (name === "leaf") {
    return (
      <Svg height={size} viewBox="0 0 48 48" width={size}>
        <Path
          d="M37 8C23 9 13 18 12 34c12-1 22-8 25-26Z"
          fill={colors.primary}
        />
        <Path
          d="M14 34c7-8 13-13 21-18M18 30l-2 10"
          fill="none"
          stroke="#25132E"
          strokeLinecap="round"
          strokeWidth={2.4}
        />
      </Svg>
    );
  }

  if (name === "chat") {
    return (
      <Svg height={size} viewBox="0 0 48 48" width={size}>
        <Path
          d="M9 22c0-8 7-14 16-14s16 6 16 14-7 14-16 14c-2 0-4-.3-5.8-.9L10 40l3-8.1A13 13 0 0 1 9 22Z"
          fill="none"
          stroke={colors.primary}
          strokeLinejoin="round"
          strokeWidth={2.5}
        />
        {[19, 25, 31].map((cx) => (
          <Circle cx={cx} cy={22} fill={colors.primary} key={cx} r={1.8} />
        ))}
      </Svg>
    );
  }

  if (name === "calendar") {
    return (
      <Svg height={size} viewBox="0 0 48 48" width={size}>
        <Rect
          fill="none"
          height={30}
          rx={4}
          stroke={colors.primary}
          strokeWidth={2.4}
          width={32}
          x={8}
          y={11}
        />
        <Path
          d="M16 7v8M32 7v8M8 19h32M18 28h.01M24 28h.01M30 28h.01M18 34h.01M24 34h.01"
          fill="none"
          stroke={colors.primary}
          strokeLinecap="round"
          strokeWidth={2.4}
        />
      </Svg>
    );
  }

  if (name === "clock") {
    return (
      <Svg height={size} viewBox="0 0 48 48" width={size}>
        <Circle
          cx={24}
          cy={24}
          fill="none"
          r={16}
          stroke={colors.primary}
          strokeWidth={2.5}
        />
        <Path
          d="M24 14v11l7 5"
          fill="none"
          stroke={colors.primary}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2.5}
        />
      </Svg>
    );
  }

  if (name === "spark") {
    return (
      <Svg height={size} viewBox="0 0 48 48" width={size}>
        <Path d="M24 5 29 19 43 24 29 29 24 43 19 29 5 24 19 19 24 5Z" fill={colors.primary} />
      </Svg>
    );
  }

  if (name === "fire") {
    return (
      <Svg height={size} viewBox="0 0 48 48" width={size}>
        <Path
          d="M26 4c3 8-3 10 4 17 2-5 7-6 8-1 2 11-5 20-15 20S7 33 10 23c1-5 5-9 10-14 0 8 3 10 6 14 2-7-3-10 0-19Z"
          fill="#FF6A2E"
        />
        <Path d="M25 25c4 5 1 11-4 11-4 0-7-3-6-8 2 3 5 2 10-3Z" fill={colors.primary} />
      </Svg>
    );
  }

  if (name === "heart") {
    return (
      <Svg height={size} viewBox="0 0 48 48" width={size}>
        <Path
          d="M24 39S8 29 8 17c0-6 8-10 16-1 8-9 16-5 16 1 0 12-16 22-16 22Z"
          fill="none"
          stroke={colors.primary}
          strokeLinejoin="round"
          strokeWidth={3}
        />
      </Svg>
    );
  }

  if (name === "shield") {
    return (
      <Svg height={size} viewBox="0 0 48 48" width={size}>
        <Path
          d="M24 5 39 11v11c0 10-6 17-15 21C15 39 9 32 9 22V11l15-6Z"
          fill="none"
          stroke={colors.primary}
          strokeLinejoin="round"
          strokeWidth={2.6}
        />
        <Path
          d="M24 17v14M18 24h12"
          stroke={colors.primary}
          strokeLinecap="round"
          strokeWidth={2.6}
        />
      </Svg>
    );
  }

  return (
    <Svg height={size} viewBox="0 0 48 48" width={size}>
      <Circle
        cx={24}
        cy={24}
        fill="none"
        r={15}
        stroke={colors.primary}
        strokeWidth={2.6}
      />
      <Circle
        cx={24}
        cy={24}
        fill="none"
        r={8}
        stroke={colors.primary}
        strokeWidth={2.6}
      />
      <Path
        d="M24 3v8M45 24h-8M24 45v-8M3 24h8M30 18l10-10"
        fill="none"
        stroke={colors.primary}
        strokeLinecap="round"
        strokeWidth={2.6}
      />
    </Svg>
  );
}

function StepIcon({ name }: { name: IconName }) {
  return (
    <View style={styles.stepIcon}>
      <Icon name={name} size={26} />
    </View>
  );
}

function HeaderIconButton({
  label,
  onPress,
  type,
}: {
  label: string;
  onPress: () => void;
  type: "back" | "close";
}) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.headerIconButton,
        pressed && styles.pressed,
      ]}
    >
      {type === "back" ? <BackIcon /> : <Icon name="close" size={30} />}
    </Pressable>
  );
}

function ClearButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      accessibilityLabel="Clear habit name"
      accessibilityRole="button"
      hitSlop={10}
      onPress={onPress}
      style={({ pressed }) => pressed && styles.pressed}
    >
      <Icon name="close" size={22} />
    </Pressable>
  );
}

function DayChip({ day, selected }: { day: string; selected: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.dayChip,
        selected && styles.dayChipSelected,
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.dayChipText, selected && styles.dayChipTextSelected]}>
        {day}
      </Text>
    </Pressable>
  );
}

function TimeChip({ label }: { label: string }) {
  const selected = label === "After lunch";

  return (
    <Pressable
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.timeChip,
        selected && styles.timeChipSelected,
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.timeChipText, selected && styles.timeChipTextSelected]}>
        {label}
      </Text>
    </Pressable>
  );
}

function ChevronRightIcon() {
  return (
    <Svg height={24} viewBox="0 0 24 24" width={24}>
      <Path
        d="m9 5 7 7-7 7"
        fill="none"
        stroke={colors.primary}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.9}
      />
    </Svg>
  );
}

function PlanningOption({ option }: { option: PlanningRow }) {
  return (
    <Pressable
      accessibilityRole="button"
      style={({ pressed }) => [styles.optionRow, pressed && styles.pressed]}
    >
      <View style={styles.optionIcon}>
        <Icon name={option.icon} size={32} />
      </View>
      <Text style={styles.optionText}>{option.label}</Text>
      <ChevronRightIcon />
    </Pressable>
  );
}

export default function CreateHabitScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { height, width } = useWindowDimensions();
  const [habitName, setHabitName] = useState("Eat 5 vegetables");
  const [cue, setCue] = useState("After lunch");
  const compact = width < 520;

  function handleBack() {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace("/milestone-quests");
  }

  return (
    <View style={styles.screen}>
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
        <ScrollView
          contentContainerStyle={[
            styles.content,
            {
              minHeight: height,
              paddingBottom: Math.max(insets.bottom + 24, 40),
              paddingTop: Math.max(insets.top + 18, 28),
            },
            compact && styles.contentCompact,
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <HeaderIconButton label="Back" onPress={handleBack} type="back" />
            <Text style={styles.title}>Create Habit</Text>
            <HeaderIconButton label="Close" onPress={handleBack} type="close" />
          </View>

          <View style={styles.formCard}>
            <View style={styles.formRow}>
              <StepIcon name="leaf" />
              <View style={styles.formMain}>
                <Text style={styles.stepTitle}>1. Habit name</Text>
                <View style={styles.inputShell}>
                  <TextInput
                    accessibilityLabel="Habit name"
                    onChangeText={setHabitName}
                    placeholder="Eat 5 vegetables"
                    placeholderTextColor="rgba(246, 232, 200, 0.5)"
                    selectionColor={colors.primary}
                    style={styles.input}
                    value={habitName}
                  />
                  {habitName.length > 0 ? (
                    <ClearButton onPress={() => setHabitName("")} />
                  ) : null}
                </View>
              </View>
            </View>

            <View style={styles.formRow}>
              <StepIcon name="chat" />
              <View style={styles.formMain}>
                <Text style={styles.stepTitle}>2. Cue or description</Text>
                <View style={styles.inputShell}>
                  <TextInput
                    accessibilityLabel="Cue or description"
                    onChangeText={setCue}
                    placeholder="After lunch"
                    placeholderTextColor="rgba(246, 232, 200, 0.5)"
                    selectionColor={colors.primary}
                    style={styles.input}
                    value={cue}
                  />
                </View>
                <Text style={styles.helperText}>
                  A short cue to remind you when to do this habit.
                </Text>
              </View>
            </View>

            <View style={styles.formRow}>
              <StepIcon name="calendar" />
              <View style={styles.formMain}>
                <Text style={styles.stepTitle}>3. Frequency</Text>
                <View style={styles.dayGrid}>
                  {DAYS.map((day) => (
                    <DayChip
                      day={day}
                      key={day}
                      selected={SELECTED_DAYS.has(day)}
                    />
                  ))}
                </View>
                <Text style={styles.helperText}>
                  Select the days you want to practice this habit.
                </Text>
              </View>
            </View>

            <View style={[styles.formRow, styles.lastFormRow]}>
              <StepIcon name="clock" />
              <View style={styles.formMain}>
                <Text style={styles.stepTitle}>4. Reminder or time of day</Text>
                <View style={styles.timeGrid}>
                  {TIMES.map((time) => (
                    <TimeChip key={time} label={time} />
                  ))}
                </View>
                <Text style={styles.helperText}>
                  When will you be reminded to do this habit?
                </Text>
              </View>
            </View>
            <View style={styles.formRow}>
              <StepIcon name="chat" />
              <View style={styles.formMain}>
                <Text style={styles.stepTitle}>Make it easy to start</Text>
                <View style={styles.inputShell}>
                  <TextInput
                    accessibilityLabel="Cue or description"
                    onChangeText={setCue}
                    placeholder="Prepare everything to quickly start"
                    placeholderTextColor="rgba(246, 232, 200, 0.5)"
                    selectionColor={colors.primary}
                    style={styles.input}
                    value={cue}
                  />
                </View>
                <Text style={styles.helperText}>
                  A short cue to remind you when to do this habit.
                </Text>
              </View>
            </View>
            <View style={styles.formRow}>
              <StepIcon name="chat" />
              <View style={styles.formMain}>
                <Text style={styles.stepTitle}>Easy version for bad day</Text>
                <View style={styles.inputShell}>
                  <TextInput
                    accessibilityLabel="Cue or description"
                    onChangeText={setCue}
                    placeholder="Prepare everything to quickly start"
                    placeholderTextColor="rgba(246, 232, 200, 0.5)"
                    selectionColor={colors.primary}
                    style={styles.input}
                    value={cue}
                  />
                </View>
              </View>
            </View>

            <View style={styles.formRow}>
              <StepIcon name="chat" />
              <View style={styles.formMain}>
                <Text style={styles.stepTitle}>Obstacles & backup plan</Text>
                <View style={styles.inputShell}>
                  <TextInput
                    accessibilityLabel="Obstacles & backup plan"
                    onChangeText={setCue}
                    placeholder="Prepare everything to quickly start"
                    placeholderTextColor="rgba(246, 232, 200, 0.5)"
                    selectionColor={colors.primary}
                    style={styles.input}
                    value={cue}
                  />
                </View>
              </View>
            </View>
          </View>

          <View style={styles.planCard}>

            <Pressable
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.continueButtonShell,
                pressed && styles.continueButtonPressed,
              ]}
            >
              <LinearGradient
                colors={["#FFE59D", "#F5A92F", "#A96512"]}
                end={{ x: 1, y: 0.5 }}
                start={{ x: 0, y: 0.5 }}
                style={styles.continueButton}
              >
                <Text style={styles.continueSpark}>+</Text>
                <Text style={styles.continueText}>Continue</Text>
                <Text style={styles.continueSpark}>+</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    alignSelf: "center",
    maxWidth: 760,
    paddingHorizontal: 22,
    width: "100%",
  },
  contentCompact: {
    paddingHorizontal: spacing.md,
  },
  continueButton: {
    alignItems: "center",
    borderColor: "rgba(255, 238, 171, 0.8)",
    borderRadius: controls.button.hero.borderRadius,
    borderWidth: 1,
    flexDirection: "row",
    height: 64,
    justifyContent: "space-between",
    overflow: "hidden",
    paddingHorizontal: spacing.xl,
  },
  continueButtonPressed: {
    opacity: 0.84,
    transform: [{ scale: 0.99 }],
  },
  continueButtonShell: {
    borderRadius: controls.button.hero.borderRadius,
    marginTop: spacing.lg,
    overflow: "hidden",
    ...shadows.goldGlow,
  },
  continueSpark: {
    color: "#FFE7A7",
    fontSize: 24,
    lineHeight: 28,
  },
  continueText: {
    ...typography.cardTitle,
    color: colors.secondaryDark,
    textAlign: "center",
  },
  dayChip: {
    alignItems: "center",
    backgroundColor: "rgba(7, 10, 25, 0.74)",
    borderColor: "rgba(160, 87, 54, 0.58)",
    borderRadius: controls.chip.day.borderRadius,
    borderWidth: 1,
    height: 58,
    justifyContent: "center",
    width: 58,
  },
  dayChipSelected: {
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
  },
  dayChipText: {
    ...typography.body,
    color: "#BFB1A5",
  },
  dayChipTextSelected: {
    color: "#FFE775",
  },
  dayGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: spacing.md,
  },
  formCard: {
    backgroundColor: "rgba(8, 10, 24, 0.8)",
    borderColor: "rgba(159, 76, 40, 0.54)",
    borderRadius: controls.surface.borderRadius,
    borderWidth: 1,
    marginTop: spacing.md,
    paddingBottom: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  formMain: {
    flex: 1,
    minWidth: 0,
  },
  formRow: {
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 54,
  },
  headerIconButton: {
    alignItems: "center",
    backgroundColor: "rgba(13, 10, 21, 0.78)",
    borderColor: "rgba(159, 76, 40, 0.56)",
    borderRadius: controls.iconButton.sm / 2,
    borderWidth: 1,
    height: controls.iconButton.sm,
    justifyContent: "center",
    width: controls.iconButton.sm,
  },
  helperText: {
    ...typography.body,
    color: "#BFB1A5",
    marginTop: spacing.sm,
  },
  input: {
    ...typography.input,
    color: colors.textPrimary,
    flex: 1,
    fontSize: 20,
    lineHeight: 26,
    outlineColor: colors.transparent,
    outlineWidth: 0,
    padding: 0,
  },
  inputShell: {
    alignItems: "center",
    backgroundColor: "rgba(11, 13, 28, 0.88)",
    borderColor: "rgba(159, 76, 40, 0.5)",
    borderRadius: controls.field.borderRadius,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    height: 54,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  keyboardView: {
    flex: 1,
  },
  lastFormRow: {
    marginBottom: spacing.lg,
  },
  optionIcon: {
    alignItems: "center",
    height: 36,
    justifyContent: "center",
    width: 44,
  },
  optionList: {
    borderColor: "rgba(159, 76, 40, 0.28)",
    borderRadius: radius.sm,
    borderWidth: 1,
    marginTop: spacing.md,
    overflow: "hidden",
  },
  optionRow: {
    alignItems: "center",
    backgroundColor: "rgba(15, 17, 32, 0.76)",
    borderBottomColor: "rgba(159, 76, 40, 0.28)",
    borderBottomWidth: 1,
    flexDirection: "row",
    minHeight: 56,
    paddingHorizontal: spacing.md,
  },
  optionText: {
    color: colors.textPrimary,
    flex: 1,
    fontSize: 18,
    lineHeight: 24,
    paddingLeft: spacing.sm,
  },
  planCard: {
    backgroundColor: "rgba(8, 10, 24, 0.8)",
    borderColor: "rgba(159, 76, 40, 0.54)",
    borderRadius: controls.surface.borderRadius,
    borderWidth: 1,
    marginTop: spacing.md,
    padding: spacing.lg,
  },
  planHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
  },
  planHeaderText: {
    flex: 1,
  },
  planSubtitle: {
    ...typography.body,
    color: "#BFB1A5",
    marginTop: 6,
  },
  pressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  stepIcon: {
    alignItems: "center",
    backgroundColor: "rgba(19, 11, 37, 0.75)",
    borderColor: "rgba(245, 184, 75, 0.72)",
    borderRadius: 32,
    borderWidth: 1,
    height: 64,
    justifyContent: "center",
    width: 64,
  },
  stepTitle: {
    ...typography.label,
    color: colors.primary,
    fontSize: 23,
    lineHeight: 30,
  },
  timeChip: {
    alignItems: "center",
    backgroundColor: "rgba(7, 10, 25, 0.74)",
    borderColor: "rgba(159, 76, 40, 0.58)",
    borderRadius: controls.chip.time.borderRadius,
    borderWidth: 1,
    flex: 1,
    height: 52,
    justifyContent: "center",
    minWidth: 132,
    paddingHorizontal: spacing.md,
  },
  timeChipSelected: {
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 12,
  },
  timeChipText: {
    ...typography.body,
    color: "#BFB1A5",
  },
  timeChipTextSelected: {
    color: "#FFE775",
  },
  timeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: spacing.md,
  },
  title: {
    ...typography.screenTitle,
    flex: 1,
    textAlign: "center",
  },
});
