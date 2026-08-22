import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  useWindowDimensions,
  View,
  type StyleProp,
  type TextStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";

import {
  createRisk,
  deleteRisk,
  getDreams,
  getRisks,
  setRiskActions,
  updateRisk,
} from "@/db";
import {
  AppButton,
  AppInput,
  AppModal,
  AppText,
  Card,
  CheckIcon,
  CloseIcon,
  IconButton,
  PencilIcon,
  PlusIcon,
  ScreenHeader,
  ScreenScaffold,
  SparkIcon,
} from "@/shared/components";
import { colors } from "@/theme/colors";
import {
  fontSizes,
  iconSizes,
  inputFocusReset,
  lineHeights,
  pressed as pressedStyle,
  radius,
  shadows,
  spacing,
  textGlow,
  typography,
} from "@/theme/theme";

const BACKGROUND = require("../../assets/create-goal/risk-plan-background.png");
const RISK_IMAGE = require("../../assets/create-goal/risk-image.png");

type IconProps = {
  color: string;
  size?: number;
};

type RiskPlan = {
  actions: readonly string[];
  id: number;
  prompt: string;
  title: string;
};

export default function WhatIfPlanScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { dreamId: dreamIdParam } = useLocalSearchParams<{ dreamId?: string }>();
  const [dreamId, setDreamId] = useState<number | null>(null);
  const [plans, setPlans] = useState<readonly RiskPlan[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const compact = width < 380;
  const verySmall = width < 340;

  const loadPlans = useCallback(async () => {
    try {
      let id = Number(dreamIdParam);
      if (!Number.isFinite(id) || id <= 0) {
        const [firstDream] = await getDreams();
        if (!firstDream) {
          setDreamId(null);
          setPlans([]);
          return;
        }
        id = firstDream.id;
      }
      setDreamId(id);
      const risks = await getRisks(id);
      setPlans(
        risks.map((risk) => ({
          actions: risk.actions.map((action) => action.content),
          id: risk.id,
          prompt: risk.prompt,
          title: risk.title,
        })),
      );
    } catch (cause) {
      console.error("Failed to load the What-If plans", cause);
    }
  }, [dreamIdParam]);

  useFocusEffect(
    useCallback(() => {
      loadPlans();
    }, [loadPlans]),
  );

  const updatePlan = (updated: RiskPlan) =>
    setPlans((current) =>
      current.map((plan) => (plan.id === updated.id ? updated : plan)),
    );

  /** Persists all inline edits when leaving edit mode. */
  const finishEditing = async () => {
    setIsEditMode(false);
    try {
      for (const plan of plans) {
        if (plan.title.trim()) {
          await updateRisk(plan.id, { title: plan.title, prompt: plan.prompt });
        }
        const cleanActions = plan.actions
          .map((action) => action.trim())
          .filter(Boolean);
        if (cleanActions.length > 0) {
          await setRiskActions(plan.id, cleanActions);
        }
      }
    } catch (cause) {
      console.error("Failed to save the What-If plans", cause);
    }
    await loadPlans();
  };

  const handleAdd = async (plan: Omit<RiskPlan, "id">) => {
    if (dreamId === null) return;
    try {
      await createRisk(dreamId, {
        title: plan.title,
        prompt: plan.prompt,
        actions: plan.actions,
      });
      await loadPlans();
    } catch (cause) {
      console.error("Failed to add the risk", cause);
    }
  };

  const handleDeleteConfirmed = async () => {
    if (confirmDeleteId === null) return;
    try {
      await deleteRisk(confirmDeleteId);
      await loadPlans();
    } catch (cause) {
      console.error("Failed to delete the risk", cause);
    }
    setConfirmDeleteId(null);
  };

  const planPendingDelete =
    plans.find((plan) => plan.id === confirmDeleteId) ?? null;

  return (
    <>
      <ScreenHeader
        asStackHeader
        rightAction={
          isEditMode
            ? undefined
            : {
                accessibilityLabel: "Edit risks",
                icon: <PencilIcon color={colors.primary} size={iconSizes.sm} />,
                label: "Edit",
                onPress: () => setIsEditMode(true),
              }
        }
        rightSlot={
          isEditMode ? (
            <View style={styles.editActions}>
              <IconButton
                accessibilityLabel="Add risk"
                icon={<PlusIcon color={colors.primary} size={iconSizes.md} />}
                label="Add Risk"
                onPress={() => setModalVisible(true)}
                size="sm"
              />
              <IconButton
                accessibilityLabel="Finish editing risks"
                icon={<CheckIcon color={colors.primary} size={iconSizes.md} />}
                label="Done"
                onPress={finishEditing}
                size="sm"
              />
            </View>
          ) : undefined
        }
      />

      <ScreenScaffold
        backgroundImage={BACKGROUND}
        contentStyle={[
          styles.content,
          { paddingTop: insets.top + (compact ? 70 : 76) },
        ]}
        overlayOpacity={0.3}
      >
        <View style={[styles.heroCopy, { marginBottom: compact ? 116 : 128 }]}>
          <View style={styles.heroShield}>
            <ShieldStarIcon color={colors.primaryBright} size={compact ? 42 : 54} />
          </View>
          <AppText
            align="center"
            color={colors.primary}
            style={styles.title}
            variant="screenTitle"
          >
            What If Plan
          </AppText>
          <AppText align="center" style={styles.subtitle} variant="helper">
            When something goes off track,{"\n"}I already know what to do.
          </AppText>
        </View>

        {plans.length === 0 ? (
          <View style={styles.emptyState}>
            <AppText align="center" variant="helper">
              No plans yet. Think about what could get in the way,{"\n"}and
              decide now how you’ll respond.
            </AppText>
            <AppButton
              disabled={dreamId === null}
              label="Create a Plan"
              onPress={() => setModalVisible(true)}
            />
          </View>
        ) : (
          <View style={styles.cardList}>
            {plans.map((plan) => (
              <RiskCard
                key={plan.id}
                compact={compact}
                editMode={isEditMode}
                onChange={updatePlan}
                onRequestDelete={() => setConfirmDeleteId(plan.id)}
                plan={plan}
                showRiskImage={!verySmall}
              />
            ))}
          </View>
        )}
      </ScreenScaffold>

      <AddRiskModal
        maxWidth={Math.min(width - 32, 720)}
        onAdd={handleAdd}
        onClose={() => setModalVisible(false)}
        visible={modalVisible}
      />

      <AppModal
        onClose={() => setConfirmDeleteId(null)}
        variant="center"
        visible={confirmDeleteId !== null}
      >
        <AppText align="center" variant="titleSm">
          Delete this risk?
        </AppText>
        <AppText align="center" style={styles.confirmBody} variant="body">
          “{planPendingDelete?.title}” and its protection plan will be removed.
        </AppText>
        <View style={styles.confirmActions}>
          <AppButton
            label="Cancel"
            onPress={() => setConfirmDeleteId(null)}
            style={styles.confirmButton}
            textStyle={styles.confirmLabel}
            variant="secondary"
          />
          <AppButton
            label="Delete"
            onPress={handleDeleteConfirmed}
            style={[styles.confirmButton, styles.deleteButton]}
            textStyle={[styles.confirmLabel, styles.deleteLabel]}
            variant="secondary"
          />
        </View>
      </AppModal>
    </>
  );
}

function AddRiskModal({
  maxWidth,
  onAdd,
  onClose,
  visible,
}: {
  maxWidth: number;
  onAdd: (plan: Omit<RiskPlan, "id">) => void;
  onClose: () => void;
  visible: boolean;
}) {
  const compact = maxWidth < 420;
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [actions, setActions] = useState<readonly string[]>([""]);

  function resetAndClose() {
    setTitle("");
    setDescription("");
    setActions([""]);
    onClose();
  }

  function handleAdd() {
    const cleanTitle = title.trim();
    const cleanActions = actions
      .map((action) => action.trim())
      .filter(Boolean);

    if (!cleanTitle || cleanActions.length === 0) {
      return;
    }

    onAdd({
      actions: cleanActions.map((action) =>
        action.endsWith(".") ? action : `${action}.`,
      ),
      prompt: description.trim() || "If this gets in the way...",
      title: cleanTitle,
    });
    resetAndClose();
  }

  return (
    <AppModal
      dismissOnBackdrop={false}
      maxWidth={maxWidth}
      onClose={resetAndClose}
      panelStyle={[styles.modalPanelShell, { maxWidth }]}
      variant="center"
      visible={visible}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <LinearGradient
          colors={["rgba(12, 25, 41, 0.98)", "rgba(4, 13, 24, 0.98)"]}
          style={[styles.modalPanel, compact && styles.modalPanelCompact]}
        >
          <View style={styles.modalHeader}>
            <View style={styles.modalTitleRow}>
              <View style={[styles.modalIconRing, compact && styles.modalIconRingCompact]}>
                <ShieldStarIcon
                  color={colors.primaryBright}
                  size={compact ? 31 : 40}
                />
              </View>
              <AppText
                color={colors.primary}
                style={styles.modalTitle}
                variant="title"
              >
                Add New Risk
              </AppText>
            </View>

            <IconButton
              accessibilityLabel="Close add risk"
              icon={<CloseIcon size={compact ? 23 : 28} />}
              onPress={resetAndClose}
              size={compact ? "sm" : "md"}
            />
          </View>

          <FormField
            label="Risk title *"
            onChangeText={setTitle}
            placeholder="e.g. Lack of energy"
            value={title}
          />

          <FormField
            label="Description (optional)"
            multiline
            onChangeText={setDescription}
            placeholder="What could get in the way?"
            value={description}
          />

          <View style={styles.actionsHeader}>
            <AppText color={colors.primary} variant="subtitle">
              Protection actions *
            </AppText>
            <AppText style={styles.actionsHint} variant="body">
              Add as many actions as you need to mitigate this risk.
            </AppText>
          </View>

          {actions.map((action, index) => (
            <ActionField
              key={`action-${index}`}
              compact={compact}
              label={index === 0 ? "Action 1 *" : `Action ${index + 1} (optional)`}
              number={String(index + 1)}
              onChangeText={(text) =>
                setActions((current) =>
                  current.map((value, i) => (i === index ? text : value)),
                )
              }
              placeholder="e.g. Do a 5-minute version"
              value={action}
            />
          ))}

          <AppButton
            icon={<PlusIcon color={colors.primary} size={iconSizes.sm} />}
            iconPosition="before"
            label="Add Action"
            onPress={() => setActions((current) => [...current, ""])}
            style={styles.addActionButton}
            textStyle={styles.addActionLabel}
            variant="ghost"
          />

          <AppButton
            icon={<SparkIcon color={colors.textOnPrimary} size={22} />}
            label="Add Risk"
            onPress={handleAdd}
            size="lg"
            style={styles.submitButton}
            variant="primary"
          />

          <AppButton
            label="Cancel"
            onPress={resetAndClose}
            style={styles.cancelButton}
            variant="ghost"
          />
        </LinearGradient>
      </KeyboardAvoidingView>
    </AppModal>
  );
}

function FormField({
  label,
  multiline = false,
  onChangeText,
  placeholder,
  value,
}: {
  label: string;
  multiline?: boolean;
  onChangeText: (value: string) => void;
  placeholder: string;
  value: string;
}) {
  return (
    <AppInput
      containerStyle={styles.fieldBlock}
      label={label}
      multiline={multiline}
      onChangeText={onChangeText}
      placeholder={placeholder}
      selectionColor={colors.primary}
      value={value}
    />
  );
}

function ActionField({
  compact,
  label,
  number,
  onChangeText,
  placeholder,
  value,
}: {
  compact: boolean;
  label: string;
  number: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  value: string;
}) {
  return (
    <AppInput
      containerStyle={styles.actionField}
      icon={
        <View style={[styles.actionNumber, compact && styles.actionNumberCompact]}>
          <AppText
            color={colors.primary}
            style={compact && styles.actionNumberTextCompact}
            variant="titleSm"
          >
            {number}
          </AppText>
        </View>
      }
      label={label}
      onChangeText={onChangeText}
      placeholder={placeholder}
      selectionColor={colors.primary}
      value={value}
    />
  );
}

function UnderlineInput({
  multiline = false,
  onBlur,
  onChangeText,
  placeholder,
  style,
  value,
}: {
  multiline?: boolean;
  onBlur?: () => void;
  onChangeText: (text: string) => void;
  placeholder: string;
  style?: StyleProp<TextStyle>;
  value: string;
}) {
  const [focused, setFocused] = useState(false);

  return (
    <TextInput
      multiline={multiline}
      onBlur={() => {
        setFocused(false);
        onBlur?.();
      }}
      onChangeText={onChangeText}
      onFocus={() => setFocused(true)}
      placeholder={placeholder}
      placeholderTextColor={colors.textPlaceholder}
      selectionColor={colors.primary}
      style={[
        styles.underlineInput,
        focused && styles.underlineInputFocused,
        style,
      ]}
      value={value}
    />
  );
}

function RiskCard({
  compact,
  editMode,
  onChange,
  onRequestDelete,
  plan,
  showRiskImage,
}: {
  compact: boolean;
  editMode: boolean;
  onChange: (plan: RiskPlan) => void;
  onRequestDelete: () => void;
  plan: RiskPlan;
  showRiskImage: boolean;
}) {
  const setAction = (index: number, text: string) =>
    onChange({
      ...plan,
      actions: plan.actions.map((action, i) => (i === index ? text : action)),
    });

  // Emptied actions disappear on blur; a risk always keeps at least one.
  const removeActionIfEmpty = (index: number) => {
    if (plan.actions[index].trim() === "" && plan.actions.length > 1) {
      onChange({
        ...plan,
        actions: plan.actions.filter((_, i) => i !== index),
      });
    }
  };

  return (
    <Card
      accessibilityLabel={`${plan.title} protection plan`}
      onPress={editMode ? undefined : () => {}}
      style={[styles.card, compact && styles.cardCompact]}
      variant="strong"
    >
      {editMode ? (
        <Pressable
          accessibilityLabel={`Remove ${plan.title} risk`}
          accessibilityRole="button"
          hitSlop={8}
          onPress={onRequestDelete}
          style={({ pressed: isPressed }) => [
            styles.removeButton,
            isPressed && pressedStyle,
          ]}
        >
          <CloseIcon color={colors.danger} size={iconSizes.sm} />
        </Pressable>
      ) : null}

      <View style={[styles.riskSide, compact && styles.riskSideCompact]}>
        {showRiskImage ? (
          <View style={[styles.riskImageWrap, compact && styles.riskImageWrapCompact]}>
            <Image contentFit="cover" source={RISK_IMAGE} style={styles.riskImage} />
          </View>
        ) : null}

        <View style={styles.riskCopy}>
          <AppText variant="eyebrow">Risk</AppText>
          {editMode ? (
            <UnderlineInput
              onChangeText={(text) => onChange({ ...plan, title: text })}
              placeholder="Risk title"
              style={[styles.titleInput, compact && styles.riskTitleCompact]}
              value={plan.title}
            />
          ) : (
            <AppText
              color="#FFFFFF"
              style={[styles.riskTitle, compact && styles.riskTitleCompact]}
              variant="titleSm"
            >
              {plan.title}
            </AppText>
          )}
          {editMode ? (
            <UnderlineInput
              multiline
              onChangeText={(text) => onChange({ ...plan, prompt: text })}
              placeholder="What could get in the way?"
              style={[styles.promptInput, compact && styles.promptCompact]}
              value={plan.prompt}
            />
          ) : (
            <AppText
              style={[styles.prompt, compact && styles.promptCompact]}
              variant="body"
            >
              {plan.prompt}
            </AppText>
          )}
        </View>
      </View>

      <View style={[styles.dividerColumn, compact && styles.dividerColumnCompact]}>
        <View style={styles.dividerLine} />
        <SparkIcon color={colors.primary} size={26} />
      </View>

      <View style={[styles.planSide, compact && styles.planSideCompact]}>
        <View style={styles.planHeadingRow}>
          <View style={styles.planShield}>
            <ShieldStarIcon color={colors.primary} size={compact ? 18 : 22} />
          </View>
          <AppText
            color={colors.primary}
            style={styles.planHeading}
            variant="pill"
          >
            My protection plan
          </AppText>
        </View>

        <View style={styles.bulletList}>
          {plan.actions.map((action, actionIndex) => (
            <View key={`action-${actionIndex}`} style={styles.bulletRow}>
              <AppText color={colors.primary} style={styles.bullet}>
                {"•"}
              </AppText>
              {editMode ? (
                <UnderlineInput
                  multiline
                  onBlur={() => removeActionIfEmpty(actionIndex)}
                  onChangeText={(text) => setAction(actionIndex, text)}
                  placeholder="Protection action"
                  style={styles.actionInput}
                  value={action}
                />
              ) : (
                <AppText
                  color="rgba(255, 255, 255, 0.84)"
                  style={styles.bulletText}
                  variant="body"
                >
                  {action}
                </AppText>
              )}
            </View>
          ))}
        </View>
      </View>
    </Card>
  );
}

function ShieldStarIcon({ color, size = 24 }: IconProps) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 24 24" width={size}>
      <Path
        d="M12 3.2 18.2 5.4v5.2c0 4.1-2.5 7.5-6.2 9.2-3.7-1.7-6.2-5.1-6.2-9.2V5.4L12 3.2Z"
        stroke={color}
        strokeLinejoin="round"
        strokeWidth={1.7}
      />
      <Path
        d="M12 7.1c.5 2.3 1.6 3.4 3.9 3.9-2.3.5-3.4 1.6-3.9 3.9-.5-2.3-1.6-3.4-3.9-3.9 2.3-.5 3.4-1.6 3.9-3.9Z"
        fill={color}
      />
    </Svg>
  );
}

const styles = StyleSheet.create({
  actionField: {
    marginTop: spacing.md,
    width: "100%",
  },
  actionNumber: {
    alignItems: "center",
    borderColor: colors.borderStrong,
    borderRadius: radius.round,
    borderWidth: 1,
    height: 45,
    justifyContent: "center",
    width: 45,
    ...shadows.goldGlow,
  },
  actionNumberCompact: {
    height: 38,
    width: 38,
  },
  actionNumberTextCompact: {
    fontSize: fontSizes.xxl,
    lineHeight: lineHeights.xxl,
  },
  actionsHeader: {
    marginTop: spacing.xl,
    width: "100%",
  },
  actionsHint: {
    marginTop: spacing.xs,
  },
  bullet: {
    fontSize: fontSizes.xxl,
    lineHeight: lineHeights.xxl,
    marginRight: spacing.md,
    marginTop: -1,
  },
  bulletList: {
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  bulletRow: {
    alignItems: "flex-start",
    flexDirection: "row",
  },
  bulletText: {
    flex: 1,
  },
  cancelButton: {
    alignSelf: "center",
    marginTop: spacing.lg,
  },
  card: {
    alignItems: "center",
    flexDirection: "row",
    minHeight: 214,
    width: "100%",
  },
  cardCompact: {
    minHeight: 190,
  },
  cardList: {
    gap: spacing.md,
    width: "100%",
  },
  content: {
    alignItems: "center",
  },
  emptyState: {
    alignItems: "center",
    gap: spacing.lg,
    width: "100%",
  },
  dividerColumn: {
    alignItems: "center",
    alignSelf: "stretch",
    justifyContent: "center",
    marginHorizontal: spacing.lg,
    width: 28,
  },
  dividerColumnCompact: {
    marginHorizontal: spacing.sm,
    width: 22,
  },
  dividerLine: {
    backgroundColor: colors.border,
    bottom: 0,
    position: "absolute",
    top: 0,
    width: 1,
  },
  fieldBlock: {
    marginTop: spacing.lg,
    width: "100%",
  },
  heroCopy: {
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    width: "100%",
  },
  heroShield: {
    alignItems: "center",
    height: 70,
    justifyContent: "center",
    marginBottom: spacing.sm,
    width: 70,
    ...shadows.goldGlow,
  },
  modalHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  modalIconRing: {
    alignItems: "center",
    borderColor: colors.borderStrong,
    borderRadius: radius.round,
    borderWidth: 1,
    height: 70,
    justifyContent: "center",
    marginRight: spacing.md,
    width: 70,
    ...shadows.goldGlow,
  },
  modalIconRingCompact: {
    height: 54,
    marginRight: spacing.sm,
    width: 54,
  },
  modalPanel: {
    borderColor: colors.borderStrong,
    borderRadius: radius.sheet,
    borderWidth: 1,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    width: "100%",
    ...shadows.goldGlow,
  },
  modalPanelCompact: {
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
  },
  modalPanelShell: {
    backgroundColor: colors.transparent,
    borderWidth: 0,
    padding: 0,
  },
  modalTitle: {
    flexShrink: 1,
  },
  modalTitleRow: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    minWidth: 0,
    paddingRight: spacing.md,
  },
  planHeading: {
    flexShrink: 1,
    textTransform: "capitalize",
  },
  planHeadingRow: {
    alignItems: "center",
    flexDirection: "row",
  },
  planShield: {
    alignItems: "center",
    backgroundColor: colors.overlayLight,
    borderColor: colors.border,
    borderRadius: radius.round,
    borderWidth: 1,
    height: 42,
    justifyContent: "center",
    marginRight: spacing.sm,
    width: 42,
    ...shadows.goldGlow,
  },
  planSide: {
    flex: 0.96,
    minWidth: 0,
  },
  planSideCompact: {
    flex: 0.95,
  },
  prompt: {
    marginTop: spacing.md,
  },
  promptCompact: {
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.md,
    marginTop: spacing.sm,
  },
  riskCopy: {
    flex: 1,
    minWidth: 0,
  },
  riskImage: {
    height: "100%",
    width: "100%",
  },
  riskImageWrap: {
    borderRadius: radius.round,
    height: 66,
    marginRight: spacing.md,
    overflow: "hidden",
    width: 66,
    ...shadows.goldGlow,
  },
  riskImageWrapCompact: {
    height: 56,
    marginRight: spacing.sm,
    width: 56,
  },
  riskSide: {
    alignItems: "center",
    flex: 1.2,
    flexDirection: "row",
    minWidth: 0,
  },
  riskSideCompact: {
    flex: 1.05,
  },
  riskTitle: {
    marginTop: spacing.md,
    ...textGlow("rgba(0, 0, 0, 0.7)", 8),
  },
  riskTitleCompact: {
    fontSize: fontSizes.xl,
    lineHeight: lineHeights.xl,
    marginTop: spacing.sm,
  },
  submitButton: {
    marginTop: spacing.xl,
    width: "100%",
  },
  addActionButton: {
    alignSelf: "flex-start",
    marginTop: spacing.md,
  },
  addActionLabel: {
    fontSize: fontSizes.lg,
    lineHeight: lineHeights.lg,
  },
  editActions: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  removeButton: {
    alignItems: "center",
    backgroundColor: colors.surfaceGlass,
    borderColor: colors.border,
    borderRadius: radius.round,
    borderWidth: 1,
    height: spacing.xl,
    justifyContent: "center",
    position: "absolute",
    right: spacing.sm,
    top: spacing.sm,
    width: spacing.xl,
    zIndex: 2,
  },
  underlineInput: {
    ...inputFocusReset,
    borderBottomColor: colors.borderSoft,
    borderBottomWidth: 1,
    paddingBottom: 2,
    paddingHorizontal: 0,
    paddingTop: 0,
  },
  underlineInputFocused: {
    borderBottomColor: colors.primary,
  },
  titleInput: {
    ...typography.titleSm,
    color: "#FFFFFF",
    marginTop: spacing.md,
  },
  promptInput: {
    ...typography.body,
    marginTop: spacing.md,
  },
  actionInput: {
    ...typography.body,
    color: "rgba(255, 255, 255, 0.84)",
    flex: 1,
  },
  confirmBody: {
    marginTop: spacing.sm,
  },
  confirmActions: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  confirmButton: {
    flex: 1,
    paddingHorizontal: spacing.sm,
  },
  confirmLabel: {
    fontSize: fontSizes.lg,
    lineHeight: lineHeights.lg,
  },
  deleteButton: {
    borderColor: colors.danger,
  },
  deleteLabel: {
    color: colors.danger,
  },
  subtitle: {
    marginTop: spacing.sm,
  },
  title: {
    ...textGlow("rgba(0, 0, 0, 0.45)", 6),
  },
});
