import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  useWindowDimensions,
  View,
  type StyleProp,
  type TextStyle,
} from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle, Line, Path, Rect } from "react-native-svg";

import { JourneyMapControls } from "@/components/JourneyMapControls";
import { JourneyMapScroll } from "@/components/JourneyMapScroll";
import {
  JourneyMilestone,
  type JourneyMilestonePosition,
} from "@/components/JourneyMilestone";
import { journeyMilestoneBoardLayout } from "@/data/journeyMilestoneBoardLayout";
import type {
  JourneyMilestoneBoardConfig,
  JourneyMilestoneData,
} from "@/data/journeyMilestones";
import { journeyPageConfigs } from "@/data/journeyPageConfig";
import {
  createQuest,
  createTask,
  deleteDream,
  deleteMilestone,
  getDreamById,
  getDreams,
  getMilestones,
  insertMilestone,
  updateDream,
  updateMilestone,
  type Dream,
  type Milestone,
} from "@/db";
import {
  AppButton,
  AppInput,
  AppModal,
  AppText,
  ArrowRightIcon,
  CloseIcon,
  IconButton,
} from "@/shared/components";
import { colors } from "@/theme/colors";
import { deleteMemoryPhotos } from "@/utils/memoryPhotos";
import {
  fontSizes,
  gradients,
  inputFocusReset,
  lineHeights,
  pressed as pressedStyle,
  radius,
  shadowStyle,
  shadows,
  spacing,
  typography,
} from "@/theme/theme";

type MilestoneModalMode = "view" | "edit" | "add";

type MilestoneModalState =
  | { milestone: JourneyMilestoneData; mode: "view" | "edit" }
  | { insertIndex: number; mode: "add" };

/** Editable milestone fields collected by the edit/add form. */
type MilestoneFormValues = {
  artifact: string;
  mentor: string;
  reward: string;
  state: string;
  title: string;
};

type MilestoneModalProps = {
  onClose: () => void;
  onDelete: () => void;
  onOpenQuests: () => void;
  onSave: (values: MilestoneFormValues) => void;
  state: MilestoneModalState | null;
};

const JOURNEY_MAP_SOURCE = require("../../assets/journey-top/level2.png");
const MILESTONE_DOOR_SOURCE = require("../../assets/create-goal/milestone-door.png");
const PLUS_SOURCE = require("../../assets/plus.png");
const PLUS_IMAGE_SIZE = 52;
const PLUS_TOUCH_SIZE = 60;
const GUIDED_HINT_WIDTH = 276;
const SHIMMER_DURATION = 2200;
const SHIMMER_PAUSE = 2500;
/** Bespoke night-sky gradient behind the milestone sheet (feature art). */
const SHEET_GRADIENT = ["#0A1325", "#050A15", "#08101F"] as const;

const EMPTY_MILESTONE_FORM: MilestoneFormValues = {
  artifact: "",
  mentor: "",
  reward: "",
  state: "",
  title: "",
};

/** Board visuals applied to milestones created from the map editor. */
const NEW_MILESTONE_VISUALS: Omit<JourneyMilestoneBoardConfig, "milestoneId"> = {
  glowIntensity: 0.8,
  opacity: 0.9,
  rotation: 0,
  size: 100,
  tilt: 0.26,
  variant: "simple",
  x: 0.5,
  y: 0.7,
};

function QuestButtonShimmer() {
  const [buttonWidth, setButtonWidth] = useState(0);
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withSequence(
        withTiming(1, {
          duration: SHIMMER_DURATION,
          easing: Easing.inOut(Easing.cubic),
        }),
        withDelay(SHIMMER_PAUSE, withTiming(0, { duration: 0 })),
      ),
      -1,
      false,
    );

    return () => cancelAnimation(progress);
  }, [progress]);

  const streakWidth = buttonWidth * 0.26;
  const travelStart = -streakWidth * 1.6;
  const travelEnd = buttonWidth + streakWidth * 0.6;

  const bloomStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      progress.value,
      [0, 0.08, 0.82, 1],
      [0, 0.2, 0.2, 0],
    ),
    transform: [
      {
        translateX:
          interpolate(progress.value, [0, 1], [travelStart, travelEnd]) -
          streakWidth * 0.18,
      },
      { rotate: "-24deg" },
    ],
  }));

  const streakStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      progress.value,
      [0, 0.08, 0.88, 1],
      [0, 0.62, 0.62, 0],
    ),
    transform: [
      {
        translateX: interpolate(
          progress.value,
          [0, 1],
          [travelStart, travelEnd],
        ),
      },
      { rotate: "-24deg" },
    ],
  }));

  return (
    <View
      onLayout={({ nativeEvent }) =>
        setButtonWidth(nativeEvent.layout.width)
      }
      style={[styles.shimmerClip, { pointerEvents: "none" }]}
    >
      {buttonWidth > 0 ? (
        <>
          <Animated.View
            style={[
              styles.shimmerBloom,
              { width: streakWidth * 1.45 },
              bloomStyle,
            ]}
          >
            <LinearGradient
              colors={gradients.shimmer}
              end={{ x: 1, y: 0.5 }}
              locations={[0, 0.35, 0.56, 1]}
              start={{ x: 0, y: 0.5 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>

          <Animated.View
            style={[styles.shimmerStreak, { width: streakWidth }, streakStyle]}
          >
            <LinearGradient
              colors={[
                colors.transparent,
                colors.overlayLight,
                colors.primaryGlow,
                colors.overlayLight,
                colors.transparent,
              ]}
              end={{ x: 1, y: 0.5 }}
              locations={[0, 0.28, 0.5, 0.72, 1]}
              start={{ x: 0, y: 0.5 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        </>
      ) : null}
    </View>
  );
}

type MilestoneDetailIconName = "artifact" | "state" | "mentor" | "reward";

type MilestoneDetailKey = "artifact" | "state" | "mentor" | "reward";

type MilestoneDetailField = {
  description: string;
  icon: MilestoneDetailIconName;
  key: MilestoneDetailKey;
  label: string;
  placeholder: string;
  required?: boolean;
};

const MILESTONE_DETAIL_FIELDS: readonly MilestoneDetailField[] = [
  {
    description:
      "",
    icon: "artifact",
    key: "artifact",
    label: "ARTIFACT",
    placeholder: "What will show that your goal has been achieved?",
  },
  {
    description: "",
    icon: "state",
    key: "state",
    label: "STATE",
    placeholder: "How do you want to feel at this stage?",
    required: true,
  },
  {
    description: "",
    icon: "mentor",
    key: "mentor",
    label: "MENTOR",
    placeholder: "Who can guide and support you?",
  },
  {
    description: "",
    icon: "reward",
    key: "reward",
    label: "REWARD",
    placeholder: "How will you reward your progress?",
  },
];

function MilestoneDetailIcon({ name }: { name: MilestoneDetailIconName }) {
  const stroke = colors.primary;

  if (name === "artifact") {
    return (
      <Svg height={48} viewBox="0 0 48 48" width={48}>
        <Path
          d="M24 4 L29.2 18.8 L44 24 L29.2 29.2 L24 44 L18.8 29.2 L4 24 L18.8 18.8 Z"
          fill={stroke}
          opacity={0.96}
        />
      </Svg>
    );
  }

  if (name === "state") {
    return (
      <Svg height={48} viewBox="0 0 48 48" width={48}>
        <Path
          d="M24 7 C31 13 34 20 31 29 C28 36 20 36 17 29 C14 20 17 13 24 7 Z"
          fill="none"
          stroke={stroke}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2.8}
        />
        <Path
          d="M15 18 C8 20 6 27 9 33 C13 40 22 39 24 32"
          fill="none"
          stroke={stroke}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2.8}
        />
        <Path
          d="M33 18 C40 20 42 27 39 33 C35 40 26 39 24 32"
          fill="none"
          stroke={stroke}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2.8}
        />
        <Line
          stroke={stroke}
          strokeLinecap="round"
          strokeWidth={2.8}
          x1={24}
          x2={24}
          y1={32}
          y2={41}
        />
      </Svg>
    );
  }

  if (name === "mentor") {
    return (
      <Svg height={48} viewBox="0 0 48 48" width={48}>
        <Circle
          cx={24}
          cy={15}
          fill="none"
          r={6.5}
          stroke={stroke}
          strokeWidth={3}
        />
        <Path
          d="M11 41 C11 31.5 16.5 25.5 24 25.5 C31.5 25.5 37 31.5 37 41 Z"
          fill="none"
          stroke={stroke}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={3}
        />
      </Svg>
    );
  }

  return (
    <Svg height={48} viewBox="0 0 48 48" width={48}>
      <Rect
        fill="none"
        height={27}
        rx={3}
        stroke={stroke}
        strokeWidth={3}
        width={30}
        x={9}
        y={17}
      />
      <Path
        d="M7 17 H41 V24 H7 Z"
        fill="none"
        stroke={stroke}
        strokeLinejoin="round"
        strokeWidth={3}
      />
      <Path
        d="M24 17 V44"
        fill="none"
        stroke={stroke}
        strokeLinecap="round"
        strokeWidth={3}
      />
      <Path
        d="M24 17 C17 10 14 7 11 10 C8.5 12.5 11 17 18 17"
        fill="none"
        stroke={stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={3}
      />
      <Path
        d="M24 17 C31 10 34 7 37 10 C39.5 12.5 37 17 30 17"
        fill="none"
        stroke={stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={3}
      />
    </Svg>
  );
}

type MilestoneFieldInputProps = {
  onChangeText: (text: string) => void;
  placeholder: string;
  style?: StyleProp<TextStyle>;
  value: string;
};

/** Serif value input with the thin underline used by the milestone form. */
function MilestoneFieldInput({
  onChangeText,
  placeholder,
  style,
  value,
}: MilestoneFieldInputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <TextInput
      onBlur={() => setFocused(false)}
      onChangeText={onChangeText}
      onFocus={() => setFocused(true)}
      placeholder={placeholder}
      placeholderTextColor={colors.textPlaceholder}
      style={[styles.fieldInput, focused && styles.fieldInputFocused, style]}
      value={value}
    />
  );
}

function MilestoneModal({
  onClose,
  onDelete,
  onOpenQuests,
  onSave,
  state,
}: MilestoneModalProps) {
  const insets = useSafeAreaInsets();
  const { height, width } = useWindowDimensions();
  const [draft, setDraft] = useState<MilestoneFormValues>(EMPTY_MILESTONE_FORM);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [lastState, setLastState] = useState<MilestoneModalState | null>(null);

  const initialValues: MilestoneFormValues =
    state === null || state.mode === "add"
      ? EMPTY_MILESTONE_FORM
      : {
          artifact: state.milestone.artifact ?? "",
          mentor: state.milestone.mentor ?? "",
          reward: state.milestone.reward ?? "",
          state: state.milestone.state,
          title: state.milestone.title,
        };

  // Reset the form whenever the modal opens for a different milestone/slot.
  if (state !== lastState) {
    setLastState(state);
    setConfirmDelete(false);
    if (state) {
      setDraft(initialValues);
    }
  }

  const mode: MilestoneModalMode = state?.mode ?? "view";
  const milestone = state && state.mode !== "add" ? state.milestone : null;
  const displayNumber =
    state?.mode === "add" ? state.insertIndex + 1 : milestone?.id ?? 0;
  const isCompact = width < 520;
  const isShort = height < 760;
  const sheetMaxHeight = Math.min(
    height - Math.max(insets.top, 10),
    height * (isCompact ? 0.72 : 0.82),
  );
  const sheetBottomPadding = Math.max(insets.bottom + 14, isCompact ? 18 : 22);

  const isDirty = MILESTONE_DETAIL_FIELDS.some(
    (field) => draft[field.key] !== initialValues[field.key],
  );
  // Only title and state are mandatory (title is read-only in edit mode);
  // artifact, mentor, and reward are optional.
  const requiredKeys: readonly (keyof MilestoneFormValues)[] =
    mode === "add" ? ["title", "state"] : ["state"];
  const requiredComplete = requiredKeys.every(
    (key) => draft[key].trim().length > 0,
  );
  const canSave =
    mode === "add" ? requiredComplete : isDirty && requiredComplete;

  const setDraftField = (key: keyof MilestoneFormValues, text: string) =>
    setDraft((current) => ({ ...current, [key]: text }));

  // Read-only view hides optional sections (artifact, mentor, reward) the
  // user left empty; add/edit modes always show every field for input.
  const visibleFields =
    mode === "view"
      ? MILESTONE_DETAIL_FIELDS.filter(
          (field) => (milestone?.[field.key] ?? "").trim().length > 0,
        )
      : MILESTONE_DETAIL_FIELDS;

  return (
    <AppModal
      onClose={onClose}
      panelStyle={styles.modalPanel}
      variant="sheet"
      visible={state !== null}
    >
      {state ? (
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.sheetShadow}>
            <LinearGradient
              colors={SHEET_GRADIENT}
              style={[
                styles.sheet,
                { maxHeight: sheetMaxHeight, paddingBottom: sheetBottomPadding },
                isCompact && styles.sheetCompact,
                isShort && styles.sheetShort,
              ]}
            >
              <Image
                resizeMode="contain"
                source={MILESTONE_DOOR_SOURCE}
                style={[
                  styles.doorImage,
                  isCompact && styles.doorImageCompact,
                  isShort && styles.doorImageShort,
                ]}
              />

              <IconButton
                accessibilityLabel="Close"
                icon={<CloseIcon size={26} strokeWidth={1.8} />}
                onPress={onClose}
                size="sm"
                style={[
                  styles.closeButton,
                  isCompact && styles.closeButtonCompact,
                ]}
              />

              <View
                style={[
                  styles.sheetHeader,
                  isCompact && styles.sheetHeaderCompact,
                  isShort && styles.sheetHeaderShort,
                ]}
              >
                <View
                  style={[
                    styles.modalNumber,
                    isCompact && styles.modalNumberCompact,
                  ]}
                >
                  <AppText
                    color={colors.primary}
                    style={isCompact && styles.modalNumberTextCompact}
                    variant="stat"
                  >
                    {displayNumber}
                  </AppText>
                </View>

                <View style={styles.modalTitleBlock}>
                  {mode === "add" ? (
                    <View style={styles.requiredInputRow}>
                      <MilestoneFieldInput
                        onChangeText={(text) => setDraftField("title", text)}
                        placeholder="Milestone title"
                        style={[
                          styles.titleInput,
                          styles.requiredInput,
                          isCompact && styles.modalTitleCompact,
                          isShort && styles.modalTitleShort,
                        ]}
                        value={draft.title}
                      />
                      <AppText
                        color={colors.primary}
                        style={styles.requiredMark}
                        variant="titleSm"
                      >
                        *
                      </AppText>
                    </View>
                  ) : (
                    <AppText
                      style={[
                        isCompact && styles.modalTitleCompact,
                        isShort && styles.modalTitleShort,
                      ]}
                      variant="title"
                    >
                      {milestone?.title}
                    </AppText>
                  )}
                </View>
              </View>

              <ScrollView
                bounces={false}
                contentContainerStyle={styles.detailContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                style={styles.detailScroll}
              >
                {visibleFields.map((field, index) => (
                  <View
                    key={field.label}
                    style={[
                      styles.detailRow,
                      isCompact && styles.detailRowCompact,
                      isShort && styles.detailRowShort,
                      index === visibleFields.length - 1 &&
                        styles.lastDetailRow,
                    ]}
                  >
                    <View
                      style={[
                        styles.detailIcon,
                        isCompact && styles.detailIconCompact,
                      ]}
                    >
                      <MilestoneDetailIcon name={field.icon} />
                    </View>

                    <View
                      style={[
                        styles.detailCopy,
                        isCompact && styles.detailCopyCompact,
                      ]}
                    >
                      <AppText
                        style={isCompact && styles.sectionLabelCompact}
                        variant="eyebrow"
                      >
                        {field.label}
                        {mode !== "view" && field.required ? (
                          <AppText color={colors.primary} variant="eyebrow">
                            {" *"}
                          </AppText>
                        ) : null}
                      </AppText>
                      {mode === "view" ? (
                        <AppText
                          style={[
                            styles.detailValue,
                            isCompact && styles.detailValueCompact,
                          ]}
                          variant="titleSm"
                        >
                          {(milestone?.[field.key] ?? "") || field.placeholder}
                        </AppText>
                      ) : (
                        <MilestoneFieldInput
                          onChangeText={(text) =>
                            setDraftField(field.key, text)
                          }
                          placeholder={field.placeholder}
                          style={isCompact && styles.fieldInputCompact}
                          value={draft[field.key]}
                        />
                      )}
                      <AppText
                        style={isCompact && styles.descriptionCompact}
                        variant="bodySerif"
                      >
                        {field.description}
                      </AppText>
                    </View>
                  </View>
                ))}
              </ScrollView>

              {mode === "view" ? (
                <View style={styles.questButtonWrap}>
                  <AppButton
                    icon={
                      <ArrowRightIcon
                        color={colors.textOnPrimary}
                        size={isCompact ? 24 : 30}
                        strokeWidth={2.5}
                      />
                    }
                    label="Go to Quests"
                    onPress={onOpenQuests}
                    size={isCompact ? "md" : "lg"}
                  />
                  <View style={[styles.questShimmerOverlay, { pointerEvents: "none" }]}>
                    <QuestButtonShimmer />
                  </View>
                </View>
              ) : (
                <View style={styles.formActionsRow}>
                  {mode === "edit" ? (
                    <AppButton
                      label="Delete Milestone"
                      onPress={() => setConfirmDelete(true)}
                      style={[styles.formActionButton, styles.deleteButton]}
                      textStyle={[styles.formActionLabel, styles.deleteLabel]}
                      variant="secondary"
                    />
                  ) : (
                    <AppButton
                      label="Cancel"
                      onPress={onClose}
                      style={styles.formActionButton}
                      textStyle={styles.formActionLabel}
                      variant="secondary"
                    />
                  )}
                  <AppButton
                    disabled={!canSave}
                    label="Save Changes"
                    onPress={() => onSave(draft)}
                    style={styles.formActionButton}
                    textStyle={styles.formActionLabel}
                  />
                </View>
              )}
            </LinearGradient>

            {confirmDelete ? (
              <View style={styles.confirmOverlay}>
                <View style={styles.confirmCard}>
                  <AppText align="center" variant="titleSm">
                    Delete this milestone?
                  </AppText>
                  <AppText
                    align="center"
                    style={styles.confirmBody}
                    variant="bodySerif"
                  >
                    “{milestone?.title}” and its details will be removed from
                    your path.
                  </AppText>
                  <View style={styles.confirmActionsRow}>
                    <AppButton
                      label="Cancel"
                      onPress={() => setConfirmDelete(false)}
                      style={styles.formActionButton}
                      textStyle={styles.formActionLabel}
                      variant="secondary"
                    />
                    <AppButton
                      label="Delete"
                      onPress={() => {
                        setConfirmDelete(false);
                        onDelete();
                      }}
                      style={[styles.formActionButton, styles.deleteButton]}
                      textStyle={[styles.formActionLabel, styles.deleteLabel]}
                      variant="secondary"
                    />
                  </View>
                </View>
              </View>
            ) : null}
          </View>
        </KeyboardAvoidingView>
      ) : null}
    </AppModal>
  );
}

const FIRST_STEPS_QUEST_TITLE = "First steps";

type FirstStepModalProps = {
  onClose: () => void;
  onSave: (taskTitles: string[]) => void;
  visible: boolean;
};

/**
 * Shown when the guided dream initialization ends: offers to capture a few
 * tiny tasks that become the "First steps" quest on the first milestone.
 */
function FirstStepModal({ onClose, onSave, visible }: FirstStepModalProps) {
  const [asking, setAsking] = useState(true);
  const [tasks, setTasks] = useState<string[]>([]);
  const [draft, setDraft] = useState("");
  const [wasVisible, setWasVisible] = useState(false);

  // Reset to the question phase each time the modal opens.
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) {
      setAsking(true);
      setTasks([]);
      setDraft("");
    }
  }

  const pendingTasks = draft.trim() ? [...tasks, draft.trim()] : tasks;

  return (
    <AppModal onClose={onClose} visible={visible}>
      <AppText align="center" variant="titleSm">
        Begin your journey
      </AppText>

      {asking ? (
        <>
          <AppText
            align="center"
            style={styles.firstStepBody}
            variant="bodySerif"
          >
            Would you like to add a small first step — a task you can complete
            in just a few minutes — to begin your journey?
          </AppText>
          <View style={styles.formActionsRow}>
            <AppButton
              label="Not now"
              onPress={onClose}
              style={styles.formActionButton}
              textStyle={styles.formActionLabel}
              variant="secondary"
            />
            <AppButton
              label="Yes, add it"
              onPress={() => setAsking(false)}
              style={styles.formActionButton}
              textStyle={styles.formActionLabel}
            />
          </View>
        </>
      ) : (
        <>
          <AppText
            align="center"
            style={styles.firstStepBody}
            variant="bodySmall"
          >
            These tasks become the “{FIRST_STEPS_QUEST_TITLE}” quest on your
            first milestone.
          </AppText>

          {tasks.map((task, index) => (
            <View key={`${task}-${index}`} style={styles.firstStepTaskRow}>
              <View style={styles.firstStepBullet} />
              <AppText
                numberOfLines={1}
                style={styles.firstStepTaskTitle}
                variant="pill"
              >
                {task}
              </AppText>
              <IconButton
                accessibilityLabel={`Remove ${task}`}
                icon={<CloseIcon size={16} />}
                onPress={() =>
                  setTasks((current) =>
                    current.filter((_, taskIndex) => taskIndex !== index),
                  )
                }
                size="sm"
              />
            </View>
          ))}

          <AppInput
            containerStyle={styles.firstStepInput}
            label={tasks.length === 0 ? "First tiny task" : "Another tiny task"}
            onChangeText={setDraft}
            placeholder="e.g. Write one sentence about why this matters"
            value={draft}
          />
          <AppButton
            disabled={!draft.trim()}
            label="+ Add another"
            onPress={() => {
              setTasks((current) => [...current, draft.trim()]);
              setDraft("");
            }}
            style={styles.firstStepAddButton}
            variant="ghost"
          />

          <View style={styles.formActionsRow}>
            <AppButton
              label="Cancel"
              onPress={onClose}
              style={styles.formActionButton}
              textStyle={styles.formActionLabel}
              variant="secondary"
            />
            <AppButton
              disabled={pendingTasks.length === 0}
              label="Save"
              onPress={() => onSave(pendingTasks)}
              style={styles.formActionButton}
              textStyle={styles.formActionLabel}
            />
          </View>
        </>
      )}
    </AppModal>
  );
}

/** DB milestone mapped to the board shape, keeping the DB id for mutations. */
function toJourneyData(milestone: Milestone): JourneyMilestoneData {
  const displayId = milestone.sequenceNumber + 1;
  const layout = journeyMilestoneBoardLayout.find(
    (config) => config.milestoneId === displayId,
  );
  const { milestoneId: _milestoneId, ...visuals } = layout ?? {
    milestoneId: displayId,
    ...NEW_MILESTONE_VISUALS,
  };

  return {
    ...visuals,
    active: true,
    artifact: milestone.artifact ?? undefined,
    completed: milestone.status === "completed",
    description: "",
    id: displayId,
    mentor: milestone.mentor ?? undefined,
    reward: milestone.reward ?? undefined,
    state: milestone.state ?? "",
    subtitle: "",
    title: milestone.title,
  };
}

export function GoalJourneyMapScreen() {
  const router = useRouter();
  // Goal-creation flow used to open the map in edit mode (?edit=1); it now
  // lands here right after the dream is created, with its id in the params.
  const { dreamId: dreamIdParam, edit } = useLocalSearchParams<{
    dreamId?: string;
    edit?: string;
  }>();
  const openedInEditFlow = edit === "1";
  const [dream, setDream] = useState<Dream | null>(null);
  const [dbMilestones, setDbMilestones] = useState<Milestone[]>([]);
  const [isEditMode, setIsEditMode] = useState(openedInEditFlow);
  // Guided reverse planning: the journey is built backwards from the dream —
  // one plus at a time, growing down from the castle. Ends with edit mode.
  const [isGuidedAdd, setIsGuidedAdd] = useState(openedInEditFlow);
  const [firstStepVisible, setFirstStepVisible] = useState(false);
  const [modalState, setModalState] = useState<MilestoneModalState | null>(
    null,
  );

  const loadJourney = useCallback(async () => {
    try {
      const resolved = dreamIdParam
        ? await getDreamById(Number(dreamIdParam))
        : ((await getDreams())[0] ?? null);
      setDream(resolved);
      setDbMilestones(resolved ? await getMilestones(resolved.id) : []);
    } catch (cause) {
      console.error("Failed to load the journey", cause);
    }
  }, [dreamIdParam]);

  useFocusEffect(
    useCallback(() => {
      loadJourney();
    }, [loadJourney]),
  );

  const milestones = useMemo(
    () => dbMilestones.map(toJourneyData),
    [dbMilestones],
  );
  /** Board display id (sequence + 1) → DB row id, for mutations. */
  const dbIdByDisplayId = useMemo(
    () =>
      new Map(
        dbMilestones.map((milestone) => [
          milestone.sequenceNumber + 1,
          milestone.id,
        ]),
      ),
    [dbMilestones],
  );

  const currentConfig = journeyPageConfigs[0];
  // The path anchors at the castle gates and grows downward with a fixed
  // step: the chronologically last milestone sits at the entrance, earlier
  // ones below it. Once five rings exist the spacing matches the stretched
  // full-path layout, so long journeys still reach the bottom of the map.
  const ringStep =
    (currentConfig.bottomY - currentConfig.castleY) /
    Math.max(4, milestones.length - 1);
  const positions = useMemo<readonly JourneyMilestonePosition[]>(
    () =>
      milestones.map((_, index) => ({
        x: 0.5,
        y:
          currentConfig.castleY +
          ringStep * (milestones.length - 1 - index),
      })),
    [currentConfig, ringStep, milestones],
  );
  const insertSlots =
    isEditMode && !isGuidedAdd
      ? Array.from({ length: milestones.length + 1 }, (_, index) => index)
      : [];
  /** Map Y for the guided plus: at the gates when empty, else one step below
   * the newest (lowest) milestone. */
  const guidedPlusY = Math.min(
    Math.max(
      currentConfig.castleY + ringStep * milestones.length,
      0.03,
    ),
    0.97,
  );
  /** Map Y for the plus that inserts at `slot`: midway between neighbours. */
  const getInsertSlotY = (slot: number) => {
    if (milestones.length === 0) {
      return currentConfig.castleY;
    }

    const y =
      currentConfig.castleY +
      ringStep * (milestones.length - 1 - slot) +
      ringStep / 2;

    return Math.min(Math.max(y, 0.03), 0.97);
  };

  const handleMilestonePress = (milestone: JourneyMilestoneData) =>
    setModalState({ milestone, mode: isEditMode ? "edit" : "view" });

  const handleSave = async (values: MilestoneFormValues) => {
    if (!modalState || !dream) {
      return;
    }

    try {
      if (modalState.mode === "add") {
        await insertMilestone(dream.id, modalState.insertIndex, {
          title: values.title,
          state: values.state,
          artifact: values.artifact,
          mentor: values.mentor,
          reward: values.reward,
        });
      } else {
        const dbId = dbIdByDisplayId.get(modalState.milestone.id);
        if (dbId !== undefined) {
          await updateMilestone(dbId, {
            state: values.state,
            artifact: values.artifact,
            mentor: values.mentor,
            reward: values.reward,
          });
        }
      }
      await loadJourney();
    } catch (cause) {
      console.error("Failed to save the milestone", cause);
    }

    setModalState(null);
  };

  const handleDelete = async () => {
    if (!modalState || modalState.mode !== "edit") {
      return;
    }

    try {
      const dbId = dbIdByDisplayId.get(modalState.milestone.id);
      if (dbId !== undefined) {
        await deleteMilestone(dbId);
      }
      await loadJourney();
    } catch (cause) {
      console.error("Failed to delete the milestone", cause);
    }
    setModalState(null);
  };

  const handleSaveDream = async (name: string, vision: string) => {
    if (!dream) return;
    try {
      const updated = await updateDream(dream.id, {
        title: name,
        visionStatement: vision || null,
      });
      if (updated) setDream(updated);
    } catch (cause) {
      console.error("Failed to save the dream", cause);
    }
  };

  const handleSaveFirstSteps = async (taskTitles: string[]) => {
    const firstMilestone = dbMilestones[0];
    if (firstMilestone) {
      try {
        const quest = await createQuest(
          firstMilestone.id,
          FIRST_STEPS_QUEST_TITLE,
        );
        for (const title of taskTitles) {
          await createTask({ questId: quest.id, title });
        }
      } catch (cause) {
        console.error("Failed to save the first steps", cause);
      }
    }
    setFirstStepVisible(false);
  };

  const handleDeleteDream = async () => {
    if (!dream) return;
    try {
      await deleteDream(dream.id);
      if (dream.photoUri) {
        await deleteMemoryPhotos([dream.photoUri]);
      }
      router.back();
    } catch (cause) {
      console.error("Failed to delete the dream", cause);
    }
  };

  return (
    <View style={styles.screen}>
      <JourneyMapScroll
        enabled={modalState === null}
        showAtmosphere
        source={JOURNEY_MAP_SOURCE}
      >
        {({ imageHeight, imageWidth }) => (
          <>
            {milestones.map((milestone, index) => (
              <JourneyMilestone
                imageHeight={imageHeight}
                imageWidth={imageWidth}
                key={milestone.id}
                milestone={milestone}
                onPress={handleMilestonePress}
                position={positions[index]}
              />
            ))}

            {insertSlots.map((slot) => {
              const slotY = getInsertSlotY(slot);

              return (
                <Pressable
                  accessibilityLabel={`Add milestone at position ${slot + 1}`}
                  accessibilityRole="button"
                  hitSlop={8}
                  key={`insert-${slot}`}
                  onPress={() =>
                    setModalState({ insertIndex: slot, mode: "add" })
                  }
                  style={({ pressed }) => [
                    styles.plusButton,
                    {
                      left: imageWidth / 2 - PLUS_TOUCH_SIZE / 2,
                      top: slotY * imageHeight - PLUS_TOUCH_SIZE / 2,
                    },
                    pressed && pressedStyle,
                  ]}
                >
                  <Image
                    resizeMode="contain"
                    source={PLUS_SOURCE}
                    style={styles.plusImage}
                  />
                </Pressable>
              );
            })}

            {isEditMode && isGuidedAdd ? (
              <>
                <Pressable
                  accessibilityLabel="Add the milestone that comes before"
                  accessibilityRole="button"
                  hitSlop={8}
                  onPress={() =>
                    setModalState({ insertIndex: 0, mode: "add" })
                  }
                  style={({ pressed }) => [
                    styles.plusButton,
                    {
                      left: imageWidth / 2 - PLUS_TOUCH_SIZE / 2,
                      top: guidedPlusY * imageHeight - PLUS_TOUCH_SIZE / 2,
                    },
                    pressed && pressedStyle,
                  ]}
                >
                  <Image
                    resizeMode="contain"
                    source={PLUS_SOURCE}
                    style={styles.plusImage}
                  />
                </Pressable>
                <View
                  style={[
                    styles.guidedHint,
                    {
                      pointerEvents: "none",
                      left: imageWidth / 2 - GUIDED_HINT_WIDTH / 2,
                      top:
                        guidedPlusY * imageHeight + PLUS_TOUCH_SIZE / 2 + 6,
                    },
                  ]}
                >
                  <AppText
                    align="center"
                    color={colors.textPrimary}
                    variant="bodySerif"
                  >
                    {milestones.length === 0
                      ? "What's the final milestone before your dream becomes reality?"
                      : `What happened before “${milestones[0].title}”?`}
                  </AppText>
                </View>
              </>
            ) : null}
          </>
        )}
      </JourneyMapScroll>

      <JourneyMapControls
        dreamId={dream?.id}
        dreamName={dream?.title ?? ""}
        editMode={isEditMode}
        onDeleteDream={handleDeleteDream}
        onEnterEditMode={() => {
          setIsEditMode(true);
          // An empty journey restarts the guided backwards build.
          if (dbMilestones.length === 0) setIsGuidedAdd(true);
        }}
        onExitEditMode={() => {
          // Leaving the guided initialization with a path in place is the
          // moment to offer a tiny first task.
          if (isGuidedAdd && dbMilestones.length > 0) {
            setFirstStepVisible(true);
          }
          setIsEditMode(false);
          setIsGuidedAdd(false);
        }}
        onSaveDream={handleSaveDream}
        showDeleteDream={!openedInEditFlow}
        visionStatement={dream?.visionStatement ?? ""}
      />

      <MilestoneModal
        onClose={() => setModalState(null)}
        onDelete={handleDelete}
        onOpenQuests={() => {
          const displayId =
            modalState && modalState.mode !== "add"
              ? modalState.milestone.id
              : null;
          const dbId =
            displayId !== null ? dbIdByDisplayId.get(displayId) : undefined;
          setModalState(null);
          router.push({
            pathname: "/milestone-quests",
            params: {
              milestoneId: dbId !== undefined ? String(dbId) : "",
              dreamId: dream ? String(dream.id) : "",
            },
          });
        }}
        onSave={handleSave}
        state={modalState}
      />

      <FirstStepModal
        onClose={() => setFirstStepVisible(false)}
        onSave={handleSaveFirstSteps}
        visible={firstStepVisible}
      />
    </View>
  );
}

export default GoalJourneyMapScreen;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalPanel: {
    backgroundColor: colors.transparent,
    borderWidth: 0,
    padding: 0,
    paddingHorizontal: spacing.sm,
  },
  sheetShadow: {
    width: "100%",
    borderRadius: radius.sheet,
    backgroundColor: colors.backgroundSoft,
    ...shadowStyle({
      color: colors.background,
      elevation: 12,
      offsetY: 18,
      opacity: 0.48,
      radius: 28,
    }),
  },
  sheet: {
    overflow: "hidden",
    borderRadius: radius.sheet,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    paddingHorizontal: 30,
    paddingTop: 44,
  },
  sheetCompact: {
    paddingHorizontal: 28,
    paddingTop: 28,
  },
  sheetShort: {
    paddingHorizontal: 22,
    paddingTop: 24,
  },
  doorImage: {
    position: "absolute",
    top: 30,
    right: 90,
    width: 190,
    height: 132,
  },
  doorImageCompact: {
    top: 22,
    right: 82,
    width: 116,
    height: 88,
    opacity: 0.88,
  },
  doorImageShort: {
    top: 20,
    width: 104,
    height: 78,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 116,
    paddingRight: 246,
  },
  sheetHeaderCompact: {
    minHeight: 88,
    paddingRight: 150,
  },
  sheetHeaderShort: {
    minHeight: 78,
    paddingRight: 138,
  },
  modalNumber: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceDeep,
    borderWidth: 1.5,
    borderColor: colors.primary,
    ...shadows.goldGlow,
  },
  modalNumberCompact: {
    width: 58,
    height: 58,
    borderRadius: 29,
  },
  modalNumberTextCompact: {
    fontSize: fontSizes.screenTitle,
    lineHeight: lineHeights.screenTitle,
  },
  modalTitleBlock: {
    flex: 1,
    marginLeft: 18,
  },
  modalTitleCompact: {
    fontSize: fontSizes.xxxl,
    lineHeight: lineHeights.xxxl,
  },
  modalTitleShort: {
    fontSize: fontSizes.xxl,
    lineHeight: lineHeights.xxl,
  },
  closeButton: {
    position: "absolute",
    right: 22,
    top: 34,
    zIndex: 3,
  },
  closeButtonCompact: {
    right: 18,
    top: 28,
  },
  detailScroll: {
    flexShrink: 1,
    marginTop: 0,
  },
  detailContent: {
    paddingBottom: 10,
  },
  detailRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSoft,
    paddingBottom: 17,
    paddingTop: 18,
  },
  detailRowCompact: {
    paddingBottom: 10,
    paddingTop: 11,
  },
  detailRowShort: {
    paddingBottom: 8,
    paddingTop: 8,
  },
  lastDetailRow: {
    borderBottomWidth: 0,
    paddingBottom: 18,
  },
  detailIcon: {
    width: 66,
    alignItems: "center",
    paddingTop: 3,
  },
  detailIconCompact: {
    width: 42,
    transform: [{ scale: 0.72 }],
  },
  detailCopy: {
    flex: 1,
    paddingLeft: 16,
  },
  detailCopyCompact: {
    paddingLeft: 6,
  },
  sectionLabelCompact: {
    fontSize: fontSizes.xxs,
    letterSpacing: 1.2,
    lineHeight: lineHeights.xxs,
  },
  detailValue: {
    marginTop: spacing.xs,
  },
  detailValueCompact: {
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    marginTop: 2,
  },
  descriptionCompact: {
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.xs,
    marginTop: 1,
  },
  fieldInput: {
    ...typography.titleSm,
    ...inputFocusReset,
    borderBottomColor: colors.borderSoft,
    borderBottomWidth: 1,
    marginTop: spacing.xs,
    paddingBottom: spacing.xs,
    paddingTop: 0,
    paddingHorizontal: 0,
  },
  fieldInputFocused: {
    borderBottomColor: colors.primary,
  },
  fieldInputCompact: {
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    marginTop: 2,
  },
  titleInput: {
    ...typography.title,
    borderBottomColor: colors.borderSoft,
    borderBottomWidth: 1,
    paddingBottom: 2,
    paddingTop: 0,
    paddingHorizontal: 0,
  },
  requiredInputRow: {
    alignItems: "center",
    flexDirection: "row",
  },
  requiredInput: {
    flex: 1,
  },
  requiredMark: {
    marginLeft: spacing.xs,
  },
  formActionsRow: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  formActionButton: {
    flex: 1,
    paddingHorizontal: spacing.sm,
  },
  formActionLabel: {
    fontSize: fontSizes.lg,
    lineHeight: lineHeights.lg,
  },
  deleteButton: {
    borderColor: colors.danger,
  },
  deleteLabel: {
    color: colors.danger,
  },
  confirmOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    backgroundColor: colors.scrim,
    borderRadius: radius.sheet,
    justifyContent: "center",
    padding: spacing.lg,
    zIndex: 10,
  },
  confirmCard: {
    backgroundColor: colors.surfaceCard,
    borderColor: colors.border,
    borderRadius: radius.card,
    borderWidth: 1,
    padding: spacing.lg,
    width: "100%",
    ...shadows.softDark,
  },
  confirmBody: {
    marginTop: spacing.sm,
  },
  confirmActionsRow: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  questButtonWrap: {
    marginTop: 2,
  },
  questShimmerOverlay: {
    ...StyleSheet.absoluteFill,
    borderRadius: radius.md,
    overflow: "hidden",
  },
  shimmerClip: {
    ...StyleSheet.absoluteFill,
    overflow: "hidden",
  },
  plusButton: {
    position: "absolute",
    width: PLUS_TOUCH_SIZE,
    height: PLUS_TOUCH_SIZE,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 30,
  },
  plusImage: {
    width: PLUS_IMAGE_SIZE,
    height: PLUS_IMAGE_SIZE,
  },
  firstStepBody: {
    marginTop: spacing.sm,
  },
  firstStepTaskRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  firstStepBullet: {
    backgroundColor: colors.primary,
    borderRadius: radius.round,
    height: 6,
    width: 6,
  },
  firstStepTaskTitle: {
    flex: 1,
  },
  firstStepInput: {
    marginTop: spacing.md,
  },
  firstStepAddButton: {
    alignSelf: "center",
    marginTop: spacing.xs,
  },
  guidedHint: {
    position: "absolute",
    width: GUIDED_HINT_WIDTH,
    backgroundColor: colors.surfaceDeep,
    borderColor: colors.borderSoft,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs + 2,
    zIndex: 30,
    ...shadows.softDark,
  },
  shimmerBloom: {
    position: "absolute",
    top: -32,
    bottom: -32,
  },
  shimmerStreak: {
    position: "absolute",
    top: -28,
    bottom: -28,
  },
});
