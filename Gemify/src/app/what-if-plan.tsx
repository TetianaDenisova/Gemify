import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";

import {
  AppButton,
  AppInput,
  AppModal,
  AppText,
  Card,
  CloseIcon,
  IconButton,
  PlusIcon,
  ScreenHeader,
  ScreenScaffold,
  SparkIcon,
} from "@/shared/components";
import { colors } from "@/theme/colors";
import { fontSizes, lineHeights, radius, shadows, spacing } from "@/theme/theme";

const BACKGROUND = require("../../assets/create-goal/risk-plan-background.png");
const RISK_IMAGE = require("../../assets/create-goal/risk-image.png");

type IconProps = {
  color: string;
  size?: number;
};

type RiskPlan = {
  actions: readonly string[];
  prompt: string;
  title: string;
};

const DEFAULT_PLANS: readonly RiskPlan[] = [
  {
    actions: [
      "I will make the step smaller.",
      "I'll do a 5-minute version.",
      "I'll rest briefly and continue.",
      "I'll move the task to my next available time.",
    ],
    prompt: "I may feel too tired to complete the planned action.",
    title: "Lack of energy",
  },
  {
    actions: [
      "I will choose the smallest useful version.",
      "I'll reschedule it immediately.",
      "I'll protect this time as a priority.",
    ],
    prompt: "I may not have enough time to do everything I planned.",
    title: "Lack of time",
  },
  {
    actions: [
      "I'll reconnect with why this goal matters.",
      "I'll take one tiny action to get started.",
      "I'll celebrate small wins to stay inspired.",
    ],
    prompt: "I may lose interest or forget why this matters.",
    title: "Loss of motivation",
  },
] as const;

export default function WhatIfPlanScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [plans, setPlans] = useState<readonly RiskPlan[]>(DEFAULT_PLANS);
  const [modalVisible, setModalVisible] = useState(false);
  const compact = width < 380;
  const verySmall = width < 340;

  return (
    <>
      <ScreenHeader
        asStackHeader
        rightAction={{
          accessibilityLabel: "Add risk",
          icon: <PlusIcon color={colors.primary} size={24} />,
          label: "Add Risk",
          onPress: () => setModalVisible(true),
        }}
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

        <View style={styles.cardList}>
          {plans.map((plan, index) => (
            <RiskCard
              key={`${plan.title}-${index}`}
              compact={compact}
              plan={plan}
              showRiskImage={!verySmall}
            />
          ))}
        </View>
      </ScreenScaffold>

      <AddRiskModal
        maxWidth={Math.min(width - 32, 720)}
        onAdd={(plan) => setPlans((current) => [plan, ...current])}
        onClose={() => setModalVisible(false)}
        visible={modalVisible}
      />
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
  onAdd: (plan: RiskPlan) => void;
  onClose: () => void;
  visible: boolean;
}) {
  const compact = maxWidth < 420;
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [actionOne, setActionOne] = useState("");
  const [actionTwo, setActionTwo] = useState("");
  const [actionThree, setActionThree] = useState("");

  function resetAndClose() {
    setTitle("");
    setDescription("");
    setActionOne("");
    setActionTwo("");
    setActionThree("");
    onClose();
  }

  function handleAdd() {
    const cleanTitle = title.trim();
    const actions = [actionOne, actionTwo, actionThree]
      .map((action) => action.trim())
      .filter(Boolean);

    if (!cleanTitle || actions.length === 0) {
      return;
    }

    onAdd({
      actions: actions.map((action) => (action.endsWith(".") ? action : `${action}.`)),
      prompt: description.trim() || "If this gets in the way...",
      title: cleanTitle,
    });
    resetAndClose();
  }

  return (
    <AppModal
      dismissOnBackdrop={false}
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
              Add 1 to 3 actions to mitigate this risk.
            </AppText>
          </View>

          <ActionField
            compact={compact}
            label="Action 1 *"
            number="1"
            onChangeText={setActionOne}
            placeholder="e.g. Do a 5-minute version"
            value={actionOne}
          />
          <ActionField
            compact={compact}
            label="Action 2 (optional)"
            number="2"
            onChangeText={setActionTwo}
            placeholder="e.g. Take a short rest"
            value={actionTwo}
          />
          <ActionField
            compact={compact}
            label="Action 3 (optional)"
            number="3"
            onChangeText={setActionThree}
            placeholder="e.g. Move it to my next available time"
            value={actionThree}
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

function RiskCard({
  compact,
  plan,
  showRiskImage,
}: {
  compact: boolean;
  plan: RiskPlan;
  showRiskImage: boolean;
}) {
  return (
    <Card
      accessibilityLabel={`${plan.title} protection plan`}
      onPress={() => {}}
      style={[styles.card, compact && styles.cardCompact]}
      variant="strong"
    >
      <View style={[styles.riskSide, compact && styles.riskSideCompact]}>
        {showRiskImage ? (
          <View style={[styles.riskImageWrap, compact && styles.riskImageWrapCompact]}>
            <Image contentFit="cover" source={RISK_IMAGE} style={styles.riskImage} />
          </View>
        ) : null}

        <View style={styles.riskCopy}>
          <AppText variant="eyebrow">Risk</AppText>
          <AppText
            color="#FFFFFF"
            style={[styles.riskTitle, compact && styles.riskTitleCompact]}
            variant="titleSm"
          >
            {plan.title}
          </AppText>
          <AppText
            style={[styles.prompt, compact && styles.promptCompact]}
            variant="body"
          >
            {plan.prompt}
          </AppText>
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
            <View key={`${action}-${actionIndex}`} style={styles.bulletRow}>
              <AppText color={colors.primary} style={styles.bullet}>
                {"•"}
              </AppText>
              <AppText
                color="rgba(255, 255, 255, 0.84)"
                style={styles.bulletText}
                variant="body"
              >
                {action}
              </AppText>
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
    textShadowColor: "rgba(0, 0, 0, 0.7)",
    textShadowRadius: 8,
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
  subtitle: {
    marginTop: spacing.sm,
  },
  title: {
    textShadowColor: "rgba(0, 0, 0, 0.45)",
    textShadowRadius: 6,
  },
});
