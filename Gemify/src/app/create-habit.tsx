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
import Svg, { Circle, Line, Path, Rect } from "react-native-svg";

import { colors } from "@/theme/colors";
import { controls, spacing, typography } from "@/theme/theme";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
const TIMES = ["Morning", "After lunch", "Evening"] as const;

type Day = (typeof DAYS)[number];
type TimeOfDay = (typeof TIMES)[number];

type StepIconName =
  | "calendar"
  | "chat"
  | "clock"
  | "close"
  | "feather"
  | "leaf"
  | "shield"
  | "sprout";

type FormStep = {
  helper?: string;
  icon: StepIconName;
  input: "habitName" | "cue" | "easyStart" | "badDay" | "backupPlan";
  multiline?: boolean;
  placeholder: string;
  title: string;
};

const textSteps: readonly FormStep[] = [
  {
    icon: "feather",
    input: "habitName",
    placeholder: "Eat 5 vegetables",
    title: "1. Habit name",
  },
  {
    helper: "A short cue to remind you when to do this habit.",
    icon: "chat",
    input: "cue",
    placeholder: "After lunch",
    title: "2. Cue or description",
  },
  {
    helper: "A short cue to remind you when to do this habit.",
    icon: "sprout",
    input: "easyStart",
    placeholder: "Put vegetables on the lunch plate before I start eating.",
    title: "5. Make it easy to start",
  },
  {
    icon: "shield",
    input: "badDay",
    placeholder: "Eat just 1 vegetable serving.",
    title: "6. Easy version for bad day",
  },
  {
    icon: "shield",
    input: "backupPlan",
    multiline: true,
    placeholder: "If I don't have vegetables ready, I will add frozen vegetables or order a salad.",
    title: "7. Obstacles & backup plan",
  },
];

function BackIcon() {
  return (
    <Svg height={30} viewBox="0 0 24 24" width={30}>
      <Path
        d="M15.5 5 8.5 12l7 7M9 12h10"
        fill="none"
        stroke={colors.primary}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.9}
      />
    </Svg>
  );
}

function HeaderOrnament() {
  return (
    <View style={styles.ornamentRow} pointerEvents="none">
      <View style={styles.ornamentLine} />
      <Svg height={24} viewBox="0 0 32 32" width={24}>
        <Path
          d="M16 2c2.5 7.9 6.1 11.5 14 14-7.9 2.5-11.5 6.1-14 14C13.5 22.1 9.9 18.5 2 16 9.9 13.5 13.5 9.9 16 2Z"
          fill={colors.primary}
        />
      </Svg>
      <View style={styles.ornamentLine} />
    </View>
  );
}

function Icon({ name, size = 31 }: { name: StepIconName; size?: number }) {
  if (name === "close") {
    return (
      <Svg height={size} viewBox="0 0 24 24" width={size}>
        <Path
          d="m6 6 12 12M18 6 6 18"
          fill="none"
          stroke={colors.primary}
          strokeLinecap="round"
          strokeWidth={1.9}
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
          stroke="#D98AFF"
          strokeLinejoin="round"
          strokeWidth={2.6}
        />
        {[19, 25, 31].map((cx) => (
          <Circle cx={cx} cy={22} fill="#F1B3FF" key={cx} r={1.9} />
        ))}
      </Svg>
    );
  }

  if (name === "calendar") {
    return (
      <Svg height={size} viewBox="0 0 48 48" width={size}>
        <Rect
          fill="none"
          height={29}
          rx={4}
          stroke="#D98AFF"
          strokeWidth={2.5}
          width={32}
          x={8}
          y={11}
        />
        <Path
          d="M16 7v8M32 7v8M8 19h32M18 28h.01M24 28h.01M30 28h.01M18 34h.01M24 34h.01"
          fill="none"
          stroke="#F1B3FF"
          strokeLinecap="round"
          strokeWidth={2.5}
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
          r={15.5}
          stroke="#D98AFF"
          strokeWidth={2.6}
        />
        <Path
          d="M24 14v10.5l7 5"
          fill="none"
          stroke="#F1B3FF"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2.6}
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
          stroke="#D98AFF"
          strokeLinejoin="round"
          strokeWidth={2.7}
        />
        <Path
          d="m19 24 3.4 3.4L30 20"
          fill="none"
          stroke="#F1B3FF"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2.7}
        />
      </Svg>
    );
  }

  if (name === "sprout") {
    return (
      <Svg height={size} viewBox="0 0 48 48" width={size}>
        <Path
          d="M24 39V24M24 25c-9-1-14-7-14-15 9 0 14 6 14 15ZM24 27c10-2 15-9 15-18-10 1-15 8-15 18Z"
          fill="none"
          stroke="#D98AFF"
          strokeLinejoin="round"
          strokeWidth={2.7}
        />
        <Path
          d="M17 39h14"
          fill="none"
          stroke="#F1B3FF"
          strokeLinecap="round"
          strokeWidth={2.7}
        />
      </Svg>
    );
  }

  if (name === "leaf") {
    return (
      <Svg height={size} viewBox="0 0 48 48" width={size}>
        <Path
          d="M37 8C23 9 13 18 12 34c12-1 22-8 25-26Z"
          fill="none"
          stroke="#D98AFF"
          strokeLinejoin="round"
          strokeWidth={2.7}
        />
        <Path
          d="M14 34c7-8 13-13 21-18M18 30l-2 10"
          fill="none"
          stroke="#F1B3FF"
          strokeLinecap="round"
          strokeWidth={2.5}
        />
      </Svg>
    );
  }

  return (
    <Svg height={size} viewBox="0 0 48 48" width={size}>
      <Path
        d="M37 8C23 9 13 18 12 34c12-1 22-8 25-26Z"
        fill="#D98AFF"
      />
      <Path
        d="M14 34c7-8 13-13 21-18M18 30l-2 10"
        fill="none"
        stroke="#32143D"
        strokeLinecap="round"
        strokeWidth={2.4}
      />
    </Svg>
  );
}

function SunIcon({ muted = false }: { muted?: boolean }) {
  const tint = muted ? "#8D8F9B" : colors.primary;

  return (
    <Svg height={25} viewBox="0 0 32 32" width={25}>
      <Circle cx={16} cy={16} fill={tint} r={4.5} />
      <Path
        d="M16 3v4M16 25v4M3 16h4M25 16h4M6.8 6.8l2.8 2.8M22.4 22.4l2.8 2.8M25.2 6.8l-2.8 2.8M9.6 22.4l-2.8 2.8"
        fill="none"
        stroke={tint}
        strokeLinecap="round"
        strokeWidth={2}
      />
    </Svg>
  );
}

function MoonIcon() {
  return (
    <Svg height={25} viewBox="0 0 32 32" width={25}>
      <Path
        d="M23.5 21.7A10.5 10.5 0 0 1 10.3 8.5 10.5 10.5 0 1 0 23.5 21.7Z"
        fill="#A7A9B4"
      />
    </Svg>
  );
}

function StepIcon({ name }: { name: StepIconName }) {
  return (
    <View style={styles.stepIcon}>
      <View pointerEvents="none" style={styles.stepIconRing} />
      <Icon name={name} />
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

function DayChip({
  day,
  onPress,
  selected,
}: {
  day: Day;
  onPress: () => void;
  selected: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
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

function TimeChip({
  label,
  onPress,
  selected,
}: {
  label: TimeOfDay;
  onPress: () => void;
  selected: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.timeChip,
        selected && styles.timeChipSelected,
        pressed && styles.pressed,
      ]}
    >
      {label === "Morning" ? <SunIcon muted={!selected} /> : null}
      {label === "After lunch" ? <SunIcon muted={!selected} /> : null}
      {label === "Evening" ? <MoonIcon /> : null}
      <Text style={[styles.timeChipText, selected && styles.timeChipTextSelected]}>
        {label}
      </Text>
    </Pressable>
  );
}

function SparkIcon() {
  return (
    <Svg height={26} viewBox="0 0 32 32" width={26}>
      <Path
        d="M16 3c2.2 6.8 5.2 9.8 12 12-6.8 2.2-9.8 5.2-12 12-2.2-6.8-5.2-9.8-12-12 6.8-2.2 9.8-5.2 12-12Z"
        fill="#FFE9B2"
      />
    </Svg>
  );
}

type FormValues = {
  backupPlan: string;
  badDay: string;
  cue: string;
  easyStart: string;
  habitName: string;
};

export default function CreateHabitScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { height, width } = useWindowDimensions();
  const [selectedDays, setSelectedDays] = useState<ReadonlySet<Day>>(
    () => new Set(["Mon", "Tue", "Wed", "Fri"] as Day[]),
  );
  const [selectedTime, setSelectedTime] = useState<TimeOfDay>("After lunch");
  const [values, setValues] = useState<FormValues>({
    backupPlan:
      "If I don't have vegetables ready, I will add frozen vegetables or order a salad.",
    badDay: "Eat just 1 vegetable serving.",
    cue: "After lunch",
    easyStart: "Put vegetables on the lunch plate before I start eating.",
    habitName: "Eat 5 vegetables",
  });
  const compact = width < 620;

  function handleBack() {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace("/habits");
  }

  function updateValue(key: keyof FormValues, value: string) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function toggleDay(day: Day) {
    setSelectedDays((current) => {
      const next = new Set(current);

      if (next.has(day)) {
        next.delete(day);
      } else {
        next.add(day);
      }

      return next;
    });
  }

  function renderTextStep(step: FormStep) {
    return (
      <View key={step.title} style={styles.formRow}>
        <StepIcon name={step.icon} />
        <View style={styles.formMain}>
          <Text style={styles.stepTitle}>{step.title}</Text>
          <View style={[styles.inputShell, step.multiline && styles.textAreaShell]}>
            <TextInput
              accessibilityLabel={step.title}
              multiline={step.multiline}
              onChangeText={(value) => updateValue(step.input, value)}
              placeholder={step.placeholder}
              placeholderTextColor="rgba(246, 232, 200, 0.5)"
              selectionColor={colors.primary}
              style={[styles.input, step.multiline && styles.textArea]}
              textAlignVertical={step.multiline ? "top" : "center"}
              value={values[step.input]}
            />
          </View>
          {step.helper ? <Text style={styles.helperText}>{step.helper}</Text> : null}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={["#020713", "#071021", "#030814"]}
        pointerEvents="none"
        style={StyleSheet.absoluteFill}
      />
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
            <View style={styles.titleBlock}>
              <Text style={styles.title}>Create Habit</Text>
              <HeaderOrnament />
            </View>
            <HeaderIconButton label="Close" onPress={handleBack} type="close" />
          </View>

          <View style={styles.form}>
            {renderTextStep(textSteps[0])}
            {renderTextStep(textSteps[1])}

            <View style={styles.formRow}>
              <StepIcon name="calendar" />
              <View style={styles.formMain}>
                <Text style={styles.stepTitle}>3. Frequency</Text>
                <View style={styles.dayGrid}>
                  {DAYS.map((day) => (
                    <DayChip
                      day={day}
                      key={day}
                      onPress={() => toggleDay(day)}
                      selected={selectedDays.has(day)}
                    />
                  ))}
                </View>
                <Text style={styles.helperText}>
                  Select the days you want to practice this habit.
                </Text>
              </View>
            </View>

            <View style={styles.formRow}>
              <StepIcon name="clock" />
              <View style={styles.formMain}>
                <Text style={styles.stepTitle}>4. Reminder or time of day</Text>
                <View style={styles.timeGrid}>
                  {TIMES.map((time) => (
                    <TimeChip
                      key={time}
                      label={time}
                      onPress={() => setSelectedTime(time)}
                      selected={selectedTime === time}
                    />
                  ))}
                </View>
              </View>
            </View>

            {textSteps.slice(2).map(renderTextStep)}
          </View>

          <Pressable
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.continueButtonShell,
              pressed && styles.continueButtonPressed,
            ]}
          >
            <LinearGradient
              colors={["#FFE7A7", "#F4BE56", "#D8952E"]}
              end={{ x: 1, y: 0.5 }}
              start={{ x: 0, y: 0.5 }}
              style={styles.continueButton}
            >
              <SparkIcon />
              <Text style={styles.continueText}>Continue</Text>
              <SparkIcon />
            </LinearGradient>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    alignSelf: "center",
    maxWidth: 860,
    paddingHorizontal: 28,
    width: "100%",
  },
  contentCompact: {
    paddingHorizontal: spacing.md,
  },
  continueButton: {
    alignItems: "center",
    borderColor: "rgba(255, 238, 171, 0.84)",
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    height: 66,
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
  },
  continueButtonPressed: {
    opacity: 0.84,
    transform: [{ scale: 0.99 }],
  },
  continueButtonShell: {
    borderColor: "rgba(245, 184, 75, 0.44)",
    borderRadius: 16,
    borderWidth: 1,
    marginHorizontal: spacing.md,
    marginTop: spacing.lg,
    overflow: "hidden",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
  },
  continueText: {
    ...typography.title,
    color: "#170F0A",
    flex: 1,
    textAlign: "center",
  },
  dayChip: {
    alignItems: "center",
    backgroundColor: "rgba(8, 10, 25, 0.7)",
    borderColor: "rgba(168, 93, 138, 0.58)",
    borderRadius: 18,
    borderWidth: 1,
    height: 48,
    justifyContent: "center",
    minWidth: 80,
    paddingHorizontal: spacing.md,
  },
  dayChipSelected: {
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.58,
    shadowRadius: 10,
  },
  dayChipText: {
    ...typography.button,
    color: "#9C9EA9",
  },
  dayChipTextSelected: {
    color: "#FFD36E",
  },
  dayGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
    marginTop: spacing.sm,
  },
  form: {
    borderTopColor: "rgba(246, 232, 200, 0.14)",
    borderTopWidth: 1,
    marginTop: spacing.md,
  },
  formMain: {
    flex: 1,
    minWidth: 0,
  },
  formRow: {
    borderBottomColor: "rgba(246, 232, 200, 0.12)",
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between",
    minHeight: 76,
  },
  headerIconButton: {
    alignItems: "center",
    backgroundColor: "rgba(8, 10, 25, 0.62)",
    borderColor: "rgba(240, 202, 137, 0.45)",
    borderRadius: controls.iconButton.md / 2,
    borderWidth: 1,
    height: controls.iconButton.md,
    justifyContent: "center",
    width: controls.iconButton.md,
  },
  helperText: {
    ...typography.body,
    color: "#A8A9B3",
    marginTop: spacing.sm,
  },
  input: {
    ...typography.button,
    color: "#F7F1EA",
    flex: 1,
    outlineColor: colors.transparent,
    outlineWidth: 0,
    padding: 0,
  },
  inputShell: {
    alignItems: "center",
    backgroundColor: "rgba(18, 17, 34, 0.82)",
    borderColor: "rgba(168, 93, 138, 0.66)",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    minHeight: 55,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  keyboardView: {
    flex: 1,
  },
  ornamentLine: {
    backgroundColor: colors.primary,
    flex: 1,
    height: 1,
    maxWidth: 170,
    opacity: 0.62,
  },
  ornamentRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    justifyContent: "center",
    marginTop: spacing.xs,
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
    backgroundColor: "rgba(32, 13, 54, 0.8)",
    borderColor: "rgba(216, 138, 255, 0.74)",
    borderRadius: 36,
    borderWidth: 1,
    height: 70,
    justifyContent: "center",
    shadowColor: "#B46AFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.26,
    shadowRadius: 11,
    width: 70,
  },
  stepIconRing: {
    borderColor: "rgba(216, 138, 255, 0.68)",
    borderRadius: 31,
    borderWidth: 1,
    height: 62,
    position: "absolute",
    width: 62,
  },
  stepTitle: {
    ...typography.title,
    color: colors.primary,
  },
  textArea: {
    minHeight: 78,
    paddingTop: spacing.sm,
  },
  textAreaShell: {
    alignItems: "flex-start",
    minHeight: 88,
  },
  timeChip: {
    alignItems: "center",
    backgroundColor: "rgba(8, 10, 25, 0.7)",
    borderColor: "rgba(168, 93, 138, 0.58)",
    borderRadius: 18,
    borderWidth: 1,
    flex: 1,
    flexDirection: "row",
    gap: spacing.sm,
    height: 58,
    justifyContent: "center",
    minWidth: 180,
    paddingHorizontal: spacing.lg,
  },
  timeChipSelected: {
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.58,
    shadowRadius: 10,
  },
  timeChipText: {
    ...typography.button,
    color: "#9C9EA9",
  },
  timeChipTextSelected: {
    color: "#FFD36E",
  },
  timeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  title: {
    ...typography.screenTitle,
    color: "#F7D99B",
    fontWeight: "700",
    textAlign: "center",
    textShadowColor: "rgba(245, 184, 75, 0.42)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  titleBlock: {
    flex: 1,
    minWidth: 0,
  },
});
