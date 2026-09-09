import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState, type ReactNode } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import Svg, { Path } from "react-native-svg";

import { ActionSheet, SheetActionRow } from "@/components/QuestActions";
import { BlockIconArt } from "@/components/TimeBlockTabs";
import {
  createHabit,
  createQuest,
  deleteHabit,
  getDreams,
  getHabitById,
  getHabitDetails,
  getHabitScheduleDays,
  getMilestones,
  getTimeBlocks,
  setHabitDetails,
  setHabitScheduleDays,
  updateHabit,
  type Dream,
  type HabitDetailSection,
  type Milestone,
  type TimeBlockRecord,
} from "@/db";
import type { BlockIcon } from "@/dto/timeBlocks";
import {
  AppButton,
  AppInput,
  ConfirmDialog,
  AppText,
  Card,
  CheckIcon,
  ChevronIcon,
  Chip,
  CloseIcon,
  ListItem,
  MilestoneIcon,
  PlusIcon,
  ScreenHeader,
  ScreenScaffold,
  SparkIcon,
  StepIcon,
  type StepIconName,
} from "@/shared/components";
import { useLayoutSize } from "@/hooks/useLayoutSize";
import { colors } from "@/theme/colors";
import {
  gradients,
  inputFocusReset,
  pressed,
  radius,
  shadowStyle,
  spacing,
  typography,
} from "@/theme/theme";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

/** Feature-art tints for the step medallions (no violet-border tokens). */
const ICON_RING_BORDER = "rgba(216, 138, 255, 0.74)";
const ICON_RING_INNER = "rgba(216, 138, 255, 0.68)";
const ICON_RING_FILL = "rgba(32, 13, 54, 0.8)";

type Day = (typeof DAYS)[number];

type FormStep = {
  helper?: string;
  icon: StepIconName;
  input: "habitName" | "cue" | "badDay" | "backupPlan";
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

/**
 * One "Make it easy to start" row. A step sent to a milestone as a task is
 * consumed — it shows as "Added", locks, and is NOT saved with the habit.
 */
type EasyStep = {
  /** Title of the milestone the step became a task in; null = plain step. */
  addedTo: string | null;
  text: string;
};

const EMPTY_EASY_STEP: EasyStep = { addedTo: null, text: "" };

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

function StepIconMedallion({
  name,
  size,
}: {
  name: StepIconName;
  size?: number;
}) {
  const { phone } = useLayoutSize();
  // A decorative rail down the left of every field — half the cost on a phone.
  const side = size ?? (phone ? 48 : 70);

  return (
    <View style={[styles.stepIcon, { height: side, width: side }]}>
      <View
        style={[
          styles.stepIconRing,
          { height: side - 6, pointerEvents: "none", width: side - 6 },
        ]}
      />
      <StepIcon name={name} size={Math.round(side * 0.44)} />
    </View>
  );
}

type FormValues = {
  backupPlan: string;
  badDay: string;
  cue: string;
  habitName: string;
};

type DetailInput = "badDay" | "backupPlan";

const SECTION_BY_INPUT: Record<DetailInput, HabitDetailSection> = {
  badDay: "easy_version",
  backupPlan: "backup_plan",
};

const EMPTY_FORM: FormValues = {
  backupPlan: "",
  badDay: "",
  cue: "",
  habitName: "",
};

export default function CreateHabitScreen() {
  // Every field carries a numbered label; the sentence under it is the one
  // thing a 402 pt screen can drop six times over.
  const { phone } = useLayoutSize();
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
  const [easySteps, setEasySteps] = useState<EasyStep[]>([EMPTY_EASY_STEP]);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  /** Milestone picker for "Add as task"; null = closed. */
  const [taskMilestones, setTaskMilestones] = useState<Milestone[] | null>(
    null,
  );
  /** Index of the easy step awaiting its milestone pick. */
  const [taskStepIndex, setTaskStepIndex] = useState<number | null>(null);

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
          badDay: bySection.get("easy_version") ?? "",
          backupPlan: bySection.get("backup_plan") ?? "",
        });
        const storedEasySteps = details
          .filter((entry) => entry.section === "easy_start")
          .map((entry) => ({ addedTo: null, text: entry.content }));
        setEasySteps(
          storedEasySteps.length > 0 ? storedEasySteps : [EMPTY_EASY_STEP],
        );
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

  const details = (): { content: string; section: HabitDetailSection }[] => [
    // Steps already sent to a milestone as tasks are consumed — they live as
    // quests now and are NOT kept on the habit.
    ...easySteps
      .filter((step) => step.addedTo === null && step.text.trim().length > 0)
      .map((step) => ({
        content: step.text,
        section: "easy_start" as HabitDetailSection,
      })),
    ...(Object.keys(SECTION_BY_INPUT) as DetailInput[]).map((input) => ({
      content: values[input],
      section: SECTION_BY_INPUT[input],
    })),
  ];

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

  async function handleDeleteConfirmed() {
    if (saving) return;
    setDeleteConfirmOpen(false);
    setSaving(true);
    try {
      await deleteHabit(editHabitId);
      handleBack();
    } catch (cause) {
      console.error("Failed to delete the habit", cause);
      setFormError("Something went wrong while deleting. Please try again.");
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

  function updateEasyStep(index: number, text: string) {
    setEasySteps((current) =>
      current.map((step, stepIndex) =>
        stepIndex === index ? { ...step, text } : step,
      ),
    );
  }

  function addEasyStep() {
    setEasySteps((current) => [...current, EMPTY_EASY_STEP]);
  }

  // "Add as task": the step's text becomes a quest in one of the dream's
  // milestones (habits attach to a dream, so the milestone is picked here).
  async function handleAddAsTask(index: number) {
    if (selectedDreamId === null) {
      setFormError("Pick a dream first — the task lives in its milestone.");
      return;
    }
    try {
      const milestones = await getMilestones(selectedDreamId);
      if (milestones.length === 0) {
        setFormError(
          "This dream has no milestones yet — add one on the journey map first.",
        );
        return;
      }
      setFormError(null);
      setTaskStepIndex(index);
      setTaskMilestones(milestones);
    } catch (cause) {
      console.error("Failed to load the milestones", cause);
    }
  }

  async function handleTaskMilestonePicked(milestone: Milestone) {
    const index = taskStepIndex;
    setTaskMilestones(null);
    setTaskStepIndex(null);
    const step = index !== null ? easySteps[index] : undefined;
    if (!step || !step.text.trim()) return;
    try {
      await createQuest(milestone.id, step.text.trim());
      // The step is a quest now: mark and lock it — it won't be saved with
      // the habit.
      setEasySteps((current) =>
        current.map((entry, entryIndex) =>
          entryIndex === index ? { ...entry, addedTo: milestone.title } : entry,
        ),
      );
    } catch (cause) {
      console.error("Failed to add the starter task", cause);
      setFormError("Something went wrong while adding the task.");
    }
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
      <View key={step.title} style={[styles.formRow, phone && styles.formRowPhone]}>
        <StepIconMedallion name={step.icon} />
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
          {step.helper && !phone ? (
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

        <View style={[styles.formRow, phone && styles.formRowPhone]}>
          <StepIconMedallion name="leaf" />
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
            {/* The "no dreams yet" branch reports state rather than
                explaining, so it survives on every tier. */}
            {phone && dreams.length > 0 ? null : (
              <AppText color={colors.textMuted} style={styles.helperText}>
                {dreams.length > 0
                  ? "This habit will support the dream you pick."
                  : "Create a dream first — habits live inside one."}
              </AppText>
            )}
          </View>
        </View>

        <View style={[styles.formRow, phone && styles.formRowPhone]}>
          <StepIconMedallion name="calendar" />
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
                  style={[styles.dayChip, phone && styles.dayChipPhone]}
                />
              ))}
            </View>
            {phone ? null : (
              <AppText color={colors.textMuted} style={styles.helperText}>
                Select the days you want to practice this habit.
              </AppText>
            )}
          </View>
        </View>

        <View style={[styles.formRow, phone && styles.formRowPhone]}>
          <StepIconMedallion name="clock" />
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
            {phone ? null : (
              <AppText color={colors.textMuted} style={styles.helperText}>
                Your My Day time blocks — the habit will live in the one you
                pick.
              </AppText>
            )}
          </View>
        </View>

        <View style={[styles.formRow, phone && styles.formRowPhone]}>
          <StepIconMedallion name="sprout" />
          <View style={styles.formMain}>
            <AppText
              color={colors.primary}
              style={styles.stepLabel}
              variant="subtitle"
            >
              6. Make it easy to start
            </AppText>
            {easySteps.map((step, index) => {
              const isAdded = step.addedTo !== null;
              const canAdd = step.text.trim().length > 0;
              return (
                <View
                  key={index}
                  style={[
                    styles.easyStepField,
                    index > 0 && styles.easyStepFieldSpacing,
                  ]}
                >
                  <TextInput
                    accessibilityLabel={`Easy step ${index + 1}`}
                    editable={!isAdded}
                    multiline
                    onChangeText={(text) => updateEasyStep(index, text)}
                    placeholder={
                      index === 0
                        ? "Put vegetables on the lunch plate before I start eating."
                        : "Another small step…"
                    }
                    placeholderTextColor={colors.textPlaceholder}
                    selectionColor={colors.primary}
                    style={[
                      styles.easyStepInput,
                      isAdded && styles.easyStepInputAdded,
                    ]}
                    value={step.text}
                  />
                  <View style={styles.easyStepDivider} />
                  {isAdded ? (
                    <View style={styles.easyStepAction}>
                      <View style={styles.easyStepAddedCircle}>
                        <CheckIcon color={colors.textMuted} size={11} />
                      </View>
                      <AppText color={colors.textMuted} variant="labelStrong">
                        Added
                      </AppText>
                    </View>
                  ) : (
                    <Pressable
                      accessibilityLabel={`Add step ${index + 1} as a task`}
                      accessibilityRole="button"
                      disabled={!canAdd}
                      hitSlop={6}
                      onPress={() => handleAddAsTask(index)}
                      style={({ pressed: isPressed }) => [
                        styles.easyStepAction,
                        !canAdd && styles.easyStepActionDisabled,
                        isPressed && pressed,
                      ]}
                    >
                      <View style={styles.easyStepPlusBox}>
                        <PlusIcon size={12} strokeWidth={2.2} />
                      </View>
                      <AppText color={colors.primary} variant="labelStrong">
                        Add as task
                      </AppText>
                    </Pressable>
                  )}
                </View>
              );
            })}
            <Pressable
              accessibilityLabel="Add another step"
              accessibilityRole="button"
              hitSlop={6}
              onPress={addEasyStep}
              style={({ pressed: isPressed }) => [
                styles.addStepRow,
                isPressed && pressed,
              ]}
            >
              <View style={styles.addStepCircle}>
                <PlusIcon color={colors.accentViolet} size={13} strokeWidth={2} />
              </View>
              <AppText color={colors.accentViolet} variant="labelStrong">
                Add another step
              </AppText>
            </Pressable>
            {phone ? null : (
              <AppText color={colors.textMuted} style={styles.helperText}>
                Small steps that make starting effortless. “Add as task” turns a
                step into a milestone quest instead of saving it here.
              </AppText>
            )}
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

      {isEditMode ? (
        <AppButton
          disabled={saving}
          label="Delete Habit"
          onPress={() => setDeleteConfirmOpen(true)}
          style={[styles.continueButton, styles.deleteButton]}
          textStyle={styles.deleteLabel}
          variant="secondary"
        />
      ) : null}

      <ConfirmDialog
        body={`“${values.habitName || "This habit"}” and its progress will be removed.`}
        onCancel={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDeleteConfirmed}
        title="Delete this habit?"
        visible={deleteConfirmOpen}
      />

      {/* Milestone picker for the "Add as task" starter quest. */}
      <ActionSheet
        onClose={() => setTaskMilestones(null)}
        title="Add the task to which milestone?"
        visible={taskMilestones !== null}
      >
        {(taskMilestones ?? []).map((milestone) => (
          <SheetActionRow
            icon={<MilestoneIcon color={colors.primary} size={22} />}
            key={milestone.id}
            label={milestone.title}
            onPress={() => handleTaskMilestonePicked(milestone)}
          />
        ))}
      </ActionSheet>
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  /** "+ Add another step" — quiet violet row under the step fields. */
  addStepCircle: {
    alignItems: "center",
    borderColor: colors.accentViolet,
    borderRadius: radius.round,
    borderWidth: 1,
    height: 24,
    justifyContent: "center",
    width: 24,
  },
  addStepRow: {
    alignItems: "center",
    alignSelf: "flex-start",
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  /** One easy-start step: input · divider · Add-as-task / Added. */
  easyStepField: {
    alignItems: "center",
    backgroundColor: colors.surfaceGlass,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm + 2,
    minHeight: 58,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  easyStepFieldSpacing: {
    marginTop: spacing.sm,
  },
  easyStepAction: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.xs + 2,
  },
  easyStepActionDisabled: {
    opacity: 0.45,
  },
  easyStepAddedCircle: {
    alignItems: "center",
    borderColor: colors.textMuted,
    borderRadius: radius.round,
    borderWidth: 1,
    height: 20,
    justifyContent: "center",
    width: 20,
  },
  easyStepDivider: {
    alignSelf: "stretch",
    backgroundColor: colors.borderSoft,
    marginVertical: spacing.xs,
    width: 1,
  },
  easyStepInput: {
    ...typography.input,
    ...inputFocusReset,
    flex: 1,
    padding: 0,
    textAlignVertical: "top",
  },
  easyStepInputAdded: {
    color: colors.textMuted,
  },
  easyStepPlusBox: {
    alignItems: "center",
    borderColor: colors.primary,
    borderRadius: radius.sm,
    borderWidth: 1,
    height: 20,
    justifyContent: "center",
    width: 20,
  },
  continueButton: {
    marginHorizontal: spacing.md,
    marginTop: spacing.lg,
  },
  deleteButton: {
    borderColor: colors.danger,
  },
  deleteLabel: {
    color: colors.danger,
  },
  dayChip: {
    minWidth: 80,
  },
  /** Seven chips over two rows at 370 pt — the padding gives way first. */
  dayChipPhone: {
    minWidth: 64,
    paddingHorizontal: spacing.xs,
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
  formRowPhone: {
    gap: spacing.md,
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
    justifyContent: "center",
    ...shadowStyle({ color: colors.accentVioletStrong, opacity: 0.26, radius: 11 }),
  },
  stepIconRing: {
    borderColor: ICON_RING_INNER,
    borderRadius: radius.round,
    borderWidth: 1,
    position: "absolute",
  },
  stepLabel: {
    marginBottom: spacing.sm,
  },
});
