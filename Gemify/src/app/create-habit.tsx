import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState, type ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Circle, Path, Rect } from "react-native-svg";

import { BlockIconArt } from "@/components/TimeBlockTabs";
import {
  createHabit,
  getDreams,
  getHabitById,
  getHabitDetails,
  getHabitScheduleDays,
  getTimeBlocks,
  setHabitDetails,
  setHabitScheduleDays,
  updateHabit,
  type Dream,
  type HabitDetailSection,
  type TimeBlockRecord,
} from "@/db";
import type { BlockIcon } from "@/dto/timeBlocks";
import {
  AppButton,
  AppInput,
  AppText,
  Card,
  ChevronIcon,
  Chip,
  CloseIcon,
  ListItem,
  ScreenHeader,
  ScreenScaffold,
  SparkIcon,
} from "@/shared/components";
import { colors } from "@/theme/colors";
import { gradients, radius, shadowStyle, spacing } from "@/theme/theme";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

/** Feature-art tints for the step medallions (no violet-border tokens). */
const ICON_HIGHLIGHT = "#F1B3FF";
const ICON_RING_BORDER = "rgba(216, 138, 255, 0.74)";
const ICON_RING_INNER = "rgba(216, 138, 255, 0.68)";
const ICON_RING_FILL = "rgba(32, 13, 54, 0.8)";

type Day = (typeof DAYS)[number];

type StepIconName =
  | "calendar"
  | "chat"
  | "clock"
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
    helper: "Choose a moment in your routine that will trigger this habit.",
    icon: "chat",
    input: "cue",
    placeholder: "After lunch, before work, during my commute…",
    title: "2. When to do it",
  },
  {
    helper: "A short cue to remind you when to do this habit.",
    icon: "sprout",
    input: "easyStart",
    placeholder: "Put vegetables on the lunch plate before I start eating.",
    title: "6. Make it easy to start",
  },
  {
    icon: "shield",
    input: "badDay",
    placeholder: "Eat just 1 vegetable serving.",
    title: "7. Easy version for bad day",
  },
  {
    icon: "shield",
    input: "backupPlan",
    multiline: true,
    placeholder: "If I don't have vegetables ready, I will add frozen vegetables or order a salad.",
    title: "8. Obstacles & backup plan",
  },
];

function HeaderOrnament() {
  return (
    <View style={[styles.ornamentRow, { pointerEvents: "none" }]}>
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
  if (name === "chat") {
    return (
      <Svg height={size} viewBox="0 0 48 48" width={size}>
        <Path
          d="M9 22c0-8 7-14 16-14s16 6 16 14-7 14-16 14c-2 0-4-.3-5.8-.9L10 40l3-8.1A13 13 0 0 1 9 22Z"
          fill="none"
          stroke={colors.accentViolet}
          strokeLinejoin="round"
          strokeWidth={2.6}
        />
        {[19, 25, 31].map((cx) => (
          <Circle cx={cx} cy={22} fill={ICON_HIGHLIGHT} key={cx} r={1.9} />
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
          stroke={colors.accentViolet}
          strokeWidth={2.5}
          width={32}
          x={8}
          y={11}
        />
        <Path
          d="M16 7v8M32 7v8M8 19h32M18 28h.01M24 28h.01M30 28h.01M18 34h.01M24 34h.01"
          fill="none"
          stroke={ICON_HIGHLIGHT}
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
          stroke={colors.accentViolet}
          strokeWidth={2.6}
        />
        <Path
          d="M24 14v10.5l7 5"
          fill="none"
          stroke={ICON_HIGHLIGHT}
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
          stroke={colors.accentViolet}
          strokeLinejoin="round"
          strokeWidth={2.7}
        />
        <Path
          d="m19 24 3.4 3.4L30 20"
          fill="none"
          stroke={ICON_HIGHLIGHT}
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
          stroke={colors.accentViolet}
          strokeLinejoin="round"
          strokeWidth={2.7}
        />
        <Path
          d="M17 39h14"
          fill="none"
          stroke={ICON_HIGHLIGHT}
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
          stroke={colors.accentViolet}
          strokeLinejoin="round"
          strokeWidth={2.7}
        />
        <Path
          d="M14 34c7-8 13-13 21-18M18 30l-2 10"
          fill="none"
          stroke={ICON_HIGHLIGHT}
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
        fill={colors.accentViolet}
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

type DropdownOption = {
  icon?: ReactNode;
  key: string;
  label: string;
};

/**
 * Tap-to-expand select: a field-like row showing the current choice; open, it
 * lists the other options below (same pattern as the Memories goal picker).
 */
function DropdownField({
  accessibilityLabel,
  onSelect,
  options,
  placeholder,
  selectedKey,
}: {
  accessibilityLabel: string;
  onSelect: (key: string) => void;
  options: readonly DropdownOption[];
  placeholder: string;
  selectedKey: string | null;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.key === selectedKey);

  return (
    <Card padded={false} style={styles.dropdown} variant="glass">
      <ListItem
        accessibilityLabel={accessibilityLabel}
        last
        leading={selected?.icon}
        onPress={() => setOpen((current) => !current)}
        style={styles.dropdownRow}
        title={selected?.label ?? placeholder}
        titleColor={selected ? colors.textPrimary : colors.textMuted}
        trailing={
          <ChevronIcon
            color={colors.textSecondary}
            direction={open ? "up" : "down"}
            size={18}
          />
        }
      />
      {open
        ? options
            .filter((option) => option.key !== selectedKey)
            .map((option) => (
              <ListItem
                key={option.key}
                last
                leading={option.icon}
                onPress={() => {
                  onSelect(option.key);
                  setOpen(false);
                }}
                style={styles.dropdownOption}
                title={option.label}
                titleColor={colors.textSecondary}
              />
            ))
        : null}
    </Card>
  );
}

function StepIcon({ name }: { name: StepIconName }) {
  return (
    <View style={styles.stepIcon}>
      <View style={[styles.stepIconRing, { pointerEvents: "none" }]} />
      <Icon name={name} />
    </View>
  );
}

type FormValues = {
  backupPlan: string;
  badDay: string;
  cue: string;
  easyStart: string;
  habitName: string;
};

const SECTION_BY_INPUT: Partial<Record<FormStep["input"], HabitDetailSection>> =
  {
    easyStart: "easy_start",
    badDay: "easy_version",
    backupPlan: "backup_plan",
  };

const EMPTY_FORM: FormValues = {
  backupPlan: "",
  badDay: "",
  cue: "",
  easyStart: "",
  habitName: "",
};

export default function CreateHabitScreen() {
  const router = useRouter();
  const { dreamId: dreamIdParam, habitId: habitIdParam } =
    useLocalSearchParams<{ dreamId?: string; habitId?: string }>();
  const editHabitId = Number(habitIdParam);
  const isEditMode = Number.isFinite(editHabitId) && editHabitId > 0;

  const [selectedDays, setSelectedDays] = useState<ReadonlySet<Day>>(
    () => new Set(),
  );
  /** Time-block key ("morning-focus", "anytime", …), null = Anytime. */
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [timeBlocks, setTimeBlocks] = useState<TimeBlockRecord[]>([]);
  const [dreams, setDreams] = useState<Dream[]>([]);
  const [selectedDreamId, setSelectedDreamId] = useState<number | null>(() => {
    const parsed = Number(dreamIdParam);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  });
  const [values, setValues] = useState<FormValues>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // The dream list (a habit must attach to one) and the routine time blocks —
  // the same blocks My Day is built from.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const [dreamList, blocks] = await Promise.all([
          getDreams(),
          getTimeBlocks(),
        ]);
        if (cancelled) return;
        setDreams(dreamList);
        setTimeBlocks(blocks);
        if (!isEditMode) {
          setSelectedDreamId(
            (current) => current ?? dreamList[0]?.id ?? null,
          );
          setSelectedTime((current) => current ?? blocks[0]?.key ?? null);
        }
      } catch (cause) {
        console.error("Failed to load dreams and time blocks", cause);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isEditMode]);

  // Edit mode: prefill the form from the stored habit.
  useEffect(() => {
    if (!isEditMode) return;
    let cancelled = false;

    (async () => {
      try {
        const [habit, scheduleDays, details] = await Promise.all([
          getHabitById(editHabitId),
          getHabitScheduleDays(editHabitId),
          getHabitDetails(editHabitId),
        ]);
        if (cancelled || !habit) return;

        const bySection = new Map(
          details.map((entry) => [entry.section, entry.content]),
        );
        setValues({
          habitName: habit.title,
          cue: habit.cue ?? "",
          easyStart: bySection.get("easy_start") ?? "",
          badDay: bySection.get("easy_version") ?? "",
          backupPlan: bySection.get("backup_plan") ?? "",
        });
        setSelectedDays(new Set(scheduleDays.map((weekday) => DAYS[weekday])));
        setSelectedDreamId(habit.dreamId);
        setSelectedTime(habit.timeOfDay);
      } catch (cause) {
        console.error("Failed to load the habit", cause);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [editHabitId, isEditMode]);

  const details = (): { content: string; section: HabitDetailSection }[] =>
    (Object.keys(SECTION_BY_INPUT) as FormStep["input"][]).map((input) => ({
      content: values[input as keyof FormValues],
      section: SECTION_BY_INPUT[input] as HabitDetailSection,
    }));

  async function handleSave() {
    if (saving) return;
    if (!values.habitName.trim()) {
      setFormError("Give your habit a name.");
      return;
    }
    if (selectedDays.size === 0) {
      setFormError("Pick at least one day.");
      return;
    }
    if (selectedDreamId === null) {
      setFormError("Create a dream first — habits live inside one.");
      return;
    }

    setSaving(true);
    setFormError(null);
    const scheduleDays = DAYS.reduce<number[]>(
      (list, day, index) => (selectedDays.has(day) ? [...list, index] : list),
      [],
    );

    try {
      if (isEditMode) {
        await updateHabit(editHabitId, {
          dreamId: selectedDreamId,
          title: values.habitName,
          cue: values.cue || null,
          timeOfDay: selectedTime,
        });
        await setHabitScheduleDays(editHabitId, scheduleDays);
        await setHabitDetails(editHabitId, details());
      } else {
        await createHabit({
          dreamId: selectedDreamId,
          title: values.habitName,
          cue: values.cue || null,
          timeOfDay: selectedTime,
          scheduleDays,
          details: details(),
        });
      }
      handleBack();
    } catch (cause) {
      console.error("Failed to save the habit", cause);
      setFormError("Something went wrong while saving. Please try again.");
      setSaving(false);
    }
  }

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
          <AppInput
            accessibilityLabel={step.title}
            label={step.title}
            multiline={step.multiline}
            onChangeText={(value) => updateValue(step.input, value)}
            placeholder={step.placeholder}
            selectionColor={colors.primary}
            value={values[step.input]}
          />
          {step.helper ? (
            <AppText color={colors.textMuted} style={styles.helperText}>
              {step.helper}
            </AppText>
          ) : null}
        </View>
      </View>
    );
  }

  return (
    <ScreenScaffold
      backgroundGradient={gradients.background}
      keyboardAvoiding
      topInset
    >
      <ScreenHeader
        onBack={handleBack}
        rightAction={{
          accessibilityLabel: "Close",
          icon: <CloseIcon size={24} />,
          onPress: handleBack,
        }}
        style={styles.header}
        title={isEditMode ? "Edit Habit" : "Create Habit"}
      />
      <HeaderOrnament />

      <View style={styles.form}>
        {renderTextStep(textSteps[0])}
        {renderTextStep(textSteps[1])}

        <View style={styles.formRow}>
          <StepIcon name="leaf" />
          <View style={styles.formMain}>
            <AppText
              color={colors.primary}
              style={styles.stepLabel}
              variant="subtitle"
            >
              3. Attach to a dream
            </AppText>
            <DropdownField
              accessibilityLabel="Choose a dream"
              onSelect={(key) => setSelectedDreamId(Number(key))}
              options={dreams.map((dream) => ({
                key: String(dream.id),
                label: dream.title,
              }))}
              placeholder="Choose a dream"
              selectedKey={
                selectedDreamId === null ? null : String(selectedDreamId)
              }
            />
            <AppText color={colors.textMuted} style={styles.helperText}>
              {dreams.length > 0
                ? "This habit will support the dream you pick."
                : "Create a dream first — habits live inside one."}
            </AppText>
          </View>
        </View>

        <View style={styles.formRow}>
          <StepIcon name="calendar" />
          <View style={styles.formMain}>
            <AppText
              color={colors.primary}
              style={styles.stepLabel}
              variant="subtitle"
            >
              4. Frequency
            </AppText>
            <View style={styles.dayGrid}>
              {DAYS.map((day) => (
                <Chip
                  key={day}
                  label={day}
                  onPress={() => toggleDay(day)}
                  selected={selectedDays.has(day)}
                  style={styles.dayChip}
                />
              ))}
            </View>
            <AppText color={colors.textMuted} style={styles.helperText}>
              Select the days you want to practice this habit.
            </AppText>
          </View>
        </View>

        <View style={styles.formRow}>
          <StepIcon name="clock" />
          <View style={styles.formMain}>
            <AppText
              color={colors.primary}
              style={styles.stepLabel}
              variant="subtitle"
            >
              5. Time of day
            </AppText>
            <DropdownField
              accessibilityLabel="Choose a time of day"
              onSelect={setSelectedTime}
              options={timeBlocks.map((block) => ({
                icon: (
                  <BlockIconArt
                    color={colors.primary}
                    icon={block.iconKey as BlockIcon}
                    size={20}
                  />
                ),
                key: block.key,
                label: block.startTime
                  ? `${block.label} · ${block.startTime}`
                  : block.label,
              }))}
              placeholder="Choose a time of day"
              selectedKey={selectedTime}
            />
            <AppText color={colors.textMuted} style={styles.helperText}>
              Your My Day time blocks — the habit will live in the one you
              pick.
            </AppText>
          </View>
        </View>

        {textSteps.slice(2).map(renderTextStep)}
      </View>

      {formError ? (
        <AppText
          align="center"
          color={colors.danger}
          style={styles.formErrorText}
          variant="caption"
        >
          {formError}
        </AppText>
      ) : null}

      <AppButton
        disabled={saving}
        icon={<SparkIcon color={colors.textOnPrimary} size={22} />}
        label={isEditMode ? "Save Habit" : "Create Habit"}
        onPress={handleSave}
        size="lg"
        style={styles.continueButton}
        variant="primary"
      />
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  continueButton: {
    marginHorizontal: spacing.md,
    marginTop: spacing.lg,
  },
  dayChip: {
    minWidth: 80,
  },
  dayGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  dropdown: {
    overflow: "hidden",
  },
  dropdownOption: {
    borderTopColor: colors.borderSoft,
    borderTopWidth: 1,
    paddingHorizontal: spacing.md,
  },
  dropdownRow: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  form: {
    borderTopColor: colors.borderSoft,
    borderTopWidth: 1,
    marginTop: spacing.md,
  },
  formErrorText: {
    marginTop: spacing.md,
  },
  formMain: {
    flex: 1,
    minWidth: 0,
  },
  formRow: {
    borderBottomColor: colors.borderSoft,
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  header: {
    paddingHorizontal: 0,
  },
  helperText: {
    marginTop: spacing.sm,
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
    gap: spacing.sm,
    justifyContent: "center",
    marginTop: spacing.xs,
  },
  stepIcon: {
    alignItems: "center",
    backgroundColor: ICON_RING_FILL,
    borderColor: ICON_RING_BORDER,
    borderRadius: radius.round,
    borderWidth: 1,
    height: 70,
    justifyContent: "center",
    ...shadowStyle({ color: colors.accentVioletStrong, opacity: 0.26, radius: 11 }),
    width: 70,
  },
  stepIconRing: {
    borderColor: ICON_RING_INNER,
    borderRadius: radius.round,
    borderWidth: 1,
    height: 64,
    position: "absolute",
    width: 64,
  },
  stepLabel: {
    marginBottom: spacing.sm,
  },
});
