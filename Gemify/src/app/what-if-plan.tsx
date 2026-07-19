import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import type { ReactNode } from "react";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
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
import Svg, { Path } from "react-native-svg";

import { NavigationHeader } from "@/components/NavigationHeader";
import { colors } from "@/theme/colors";
import { radius, spacing } from "@/theme/theme";

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

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(value, minimum), maximum);
}

export default function WhatIfPlanScreen() {
  const insets = useSafeAreaInsets();
  const { height, width } = useWindowDimensions();
  const [plans, setPlans] = useState<readonly RiskPlan[]>(DEFAULT_PLANS);
  const [modalVisible, setModalVisible] = useState(false);
  const compact = width < 380;
  const verySmall = width < 340;
  const horizontalInset = compact ? 14 : clamp(width * 0.08, 31, 77);
  const contentWidth = Math.min(width - horizontalInset * 2, 790);
  const titleSize = clamp(width * 0.085, compact ? 31 : 36, 54);

  return (
    <>
      <NavigationHeader
        rightAction={{
          accessibilityLabel: "Add risk",
          icon: <PlusIcon color={colors.primary} size={24} />,
          label: "Add Risk",
          onPress: () => setModalVisible(true),
        }}
      />

      <View style={styles.screen}>
        <Image
          contentFit="cover"
          source={BACKGROUND}
          style={[styles.background, { height, width }]}
        />
        <LinearGradient
          colors={[
            "rgba(1, 5, 12, 0.08)",
            "rgba(1, 5, 12, 0.2)",
            "rgba(1, 5, 12, 0.36)",
          ]}
          locations={[0, 0.48, 1]}
          pointerEvents="none"
          style={StyleSheet.absoluteFill}
        />

        <ScrollView
          bounces={false}
          contentContainerStyle={[
            styles.content,
            {
              minHeight: height,
              paddingBottom: Math.max(insets.bottom + spacing.xl, 40),
              paddingTop: insets.top + (compact ? 70 : 76),
            },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.heroCopy, { marginBottom: compact ? 116 : 128 }]}>
            <View style={styles.heroShield}>
              <ShieldStarIcon color="#FFE2A1" size={compact ? 42 : 54} />
            </View>
            <Text
              style={[
                styles.title,
                {
                  fontSize: titleSize,
                  lineHeight: titleSize + 8,
                },
              ]}
            >
              What If Plan
            </Text>
            <Text style={styles.subtitle}>
              When something goes off track,{"\n"}I already know what to do.
            </Text>
          </View>

          <View style={[styles.cardList, { width: contentWidth }]}>
            {plans.map((plan, index) => (
              <RiskCard
                key={`${plan.title}-${index}`}
                compact={compact}
                plan={plan}
                showRiskImage={!verySmall}
              />
            ))}
          </View>
        </ScrollView>

        <AddRiskModal
          maxWidth={Math.min(width - 32, 720)}
          onAdd={(plan) => setPlans((current) => [plan, ...current])}
          onClose={() => setModalVisible(false)}
          visible={modalVisible}
        />
      </View>
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
    <Modal animationType="fade" onRequestClose={resetAndClose} transparent visible={visible}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.modalRoot}
      >
        <View style={styles.modalScrim}>
          <ScrollView
            bounces={false}
            contentContainerStyle={styles.modalScrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <LinearGradient
              colors={["rgba(12, 25, 41, 0.98)", "rgba(4, 13, 24, 0.98)"]}
              style={[styles.modalPanel, compact && styles.modalPanelCompact, { maxWidth }]}
            >
              <View style={styles.modalHeader}>
                <View style={styles.modalTitleRow}>
                  <View style={[styles.modalIconRing, compact && styles.modalIconRingCompact]}>
                    <ShieldStarIcon color="#FFE2A1" size={compact ? 31 : 40} />
                  </View>
                  <Text style={[styles.modalTitle, compact && styles.modalTitleCompact]}>
                    Add New Risk
                  </Text>
                </View>

                <Pressable
                  accessibilityLabel="Close add risk"
                  accessibilityRole="button"
                  onPress={resetAndClose}
                  style={({ pressed }) => [
                    styles.closeButton,
                    compact && styles.closeButtonCompact,
                    pressed && styles.controlPressed,
                  ]}
                >
                  <XIcon color={colors.primary} size={compact ? 23 : 28} />
                </Pressable>
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
                <Text style={styles.fieldLabel}>Protection actions *</Text>
                <Text style={styles.actionsHint}>
                  Add 1 to 3 actions to mitigate this risk.
                </Text>
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

              <Pressable
                accessibilityRole="button"
                onPress={handleAdd}
                style={({ pressed }) => [
                  styles.submitButton,
                  pressed && styles.submitButtonPressed,
                ]}
              >
                <LinearGradient
                  colors={["#FFE08F", "#F6B53D", "#A96312"]}
                  end={{ x: 1, y: 0.5 }}
                  start={{ x: 0, y: 0.5 }}
                  style={styles.submitFill}
                >
                  <SparkIcon color="#1A0F04" size={22} />
                  <Text style={styles.submitText}>Add Risk</Text>
                </LinearGradient>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                onPress={resetAndClose}
                style={({ pressed }) => [
                  styles.cancelButton,
                  pressed && styles.controlPressed,
                ]}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
            </LinearGradient>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
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
    <View style={styles.fieldBlock}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        multiline={multiline}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="rgba(238, 231, 224, 0.62)"
        selectionColor={colors.primary}
        style={[styles.input, multiline && styles.textArea]}
        value={value}
      />
    </View>
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
    <View style={[styles.actionField, compact && styles.actionFieldCompact]}>
      <View style={[styles.actionNumber, compact && styles.actionNumberCompact]}>
        <Text style={[styles.actionNumberText, compact && styles.actionNumberTextCompact]}>
          {number}
        </Text>
      </View>
      <View style={[styles.actionDivider, compact && styles.actionDividerCompact]} />
      <View style={styles.actionCopy}>
        <Text style={[styles.actionLabel, compact && styles.actionLabelCompact]}>
          {label}
        </Text>
        <TextInput
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="rgba(238, 231, 224, 0.62)"
          selectionColor={colors.primary}
          style={[styles.actionInput, compact && styles.actionInputCompact]}
          value={value}
        />
      </View>
    </View>
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
    <Pressable
      accessibilityLabel={`${plan.title} protection plan`}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.cardShell,
        compact && styles.cardShellCompact,
        pressed && styles.cardPressed,
      ]}
    >
      <LinearGradient
        colors={[
          "rgba(8, 18, 32, 0.95)",
          "rgba(5, 13, 24, 0.9)",
          "rgba(6, 17, 31, 0.96)",
        ]}
        end={{ x: 1, y: 1 }}
        start={{ x: 0, y: 0 }}
        style={[styles.cardFill, compact && styles.cardFillCompact]}
      >
        <View style={[styles.riskSide, compact && styles.riskSideCompact]}>
          {showRiskImage ? (
            <View style={[styles.riskImageWrap, compact && styles.riskImageWrapCompact]}>
              <Image contentFit="cover" source={RISK_IMAGE} style={styles.riskImage} />
            </View>
          ) : null}

          <View style={styles.riskCopy}>
            <Text style={styles.riskEyebrow}>Risk</Text>
            <Text style={[styles.riskTitle, compact && styles.riskTitleCompact]}>
              {plan.title}
            </Text>
            <Text style={[styles.prompt, compact && styles.promptCompact]}>
              {plan.prompt}
            </Text>
          </View>
        </View>

        <View style={[styles.dividerColumn, compact && styles.dividerColumnCompact]}>
          <View style={styles.dividerLine} />
          <SparkIcon color="#FFD26A" size={26} />
        </View>

        <View style={[styles.planSide, compact && styles.planSideCompact]}>
          <View style={styles.planHeadingRow}>
            <View style={styles.planShield}>
              <ShieldStarIcon color={colors.primary} size={compact ? 18 : 22} />
            </View>
            <Text style={[styles.planHeading, compact && styles.planHeadingCompact]}>
              My protection plan
            </Text>
          </View>

          <View style={styles.bulletList}>
            {plan.actions.map((action, actionIndex) => (
              <View key={`${action}-${actionIndex}`} style={styles.bulletRow}>
                <Text style={styles.bullet}>{"\u2022"}</Text>
                <Text style={[styles.bulletText, compact && styles.bulletTextCompact]}>
                  {action}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </LinearGradient>
    </Pressable>
  );
}

function SvgShell({
  children,
  size = 24,
  viewBox = "0 0 24 24",
}: {
  children: ReactNode;
  size?: number;
  viewBox?: string;
}) {
  return (
    <Svg fill="none" height={size} viewBox={viewBox} width={size}>
      {children}
    </Svg>
  );
}

function PlusIcon({ color, size = 24 }: IconProps) {
  return (
    <SvgShell size={size}>
      <Path d="M12 5v14M5 12h14" stroke={color} strokeLinecap="round" strokeWidth={2} />
    </SvgShell>
  );
}

function XIcon({ color, size = 24 }: IconProps) {
  return (
    <SvgShell size={size}>
      <Path
        d="M6.5 6.5 17.5 17.5M17.5 6.5 6.5 17.5"
        stroke={color}
        strokeLinecap="round"
        strokeWidth={2}
      />
    </SvgShell>
  );
}

function ShieldStarIcon({ color, size = 24 }: IconProps) {
  return (
    <SvgShell size={size}>
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
    </SvgShell>
  );
}

function SparkIcon({ color, size = 24 }: IconProps) {
  return (
    <SvgShell size={size}>
      <Path
        d="M12 2.8c.9 5.2 3 7.3 8.2 8.2-5.2.9-7.3 3-8.2 8.2-.9-5.2-3-7.3-8.2-8.2 5.2-.9 7.3-3 8.2-8.2Z"
        fill={color}
      />
    </SvgShell>
  );
}

const serif = Platform.select({
  ios: "Georgia",
  web: "Georgia, 'Times New Roman', serif",
  default: "serif",
});

const styles = StyleSheet.create({
  background: {
    ...StyleSheet.absoluteFill,
  },
  cardFill: {
    alignItems: "center",
    borderColor: "rgba(245, 184, 75, 0.88)",
    borderRadius: 25,
    borderWidth: 1,
    flexDirection: "row",
    minHeight: 214,
    overflow: "hidden",
    paddingHorizontal: 30,
    paddingVertical: 26,
  },
  cardFillCompact: {
    minHeight: 190,
    paddingHorizontal: 13,
    paddingVertical: 18,
  },
  cardList: {
    gap: 16,
  },
  cardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.992 }],
  },
  cardShell: {
    borderRadius: 25,
    shadowColor: "#000",
    shadowOffset: { height: 12, width: 0 },
    shadowOpacity: 0.38,
    shadowRadius: 22,
    width: "100%",
  },
  cardShellCompact: {
    borderRadius: 21,
  },
  content: {
    alignItems: "center",
  },
  dividerColumn: {
    alignItems: "center",
    alignSelf: "stretch",
    justifyContent: "center",
    marginHorizontal: 28,
    width: 28,
  },
  dividerColumnCompact: {
    marginHorizontal: 12,
    width: 22,
  },
  dividerLine: {
    backgroundColor: "rgba(245, 184, 75, 0.32)",
    bottom: 0,
    position: "absolute",
    top: 0,
    width: 1,
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
    marginBottom: 10,
    shadowColor: colors.primary,
    shadowOffset: { height: 0, width: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 18,
    width: 70,
  },
  actionCopy: {
    flex: 1,
    minWidth: 0,
  },
  actionDivider: {
    backgroundColor: "rgba(245, 184, 75, 0.32)",
    height: 54,
    marginHorizontal: 18,
    width: 1,
  },
  actionDividerCompact: {
    height: 44,
    marginHorizontal: 11,
  },
  actionField: {
    alignItems: "center",
    borderColor: "rgba(245, 184, 75, 0.55)",
    borderRadius: 15,
    borderWidth: 1,
    flexDirection: "row",
    minHeight: 84,
    paddingHorizontal: 18,
    width: "100%",
  },
  actionFieldCompact: {
    minHeight: 74,
    paddingHorizontal: 12,
  },
  actionInput: {
    color: colors.textPrimary,
    fontSize: 18,
    lineHeight: 24,
    marginTop: 6,
    outlineColor: colors.transparent,
    outlineWidth: 0,
    padding: 0,
  },
  actionInputCompact: {
    fontSize: 15,
    lineHeight: 21,
  },
  actionLabel: {
    color: colors.primary,
    fontSize: 20,
    fontWeight: "600",
    lineHeight: 25,
  },
  actionLabelCompact: {
    fontSize: 17,
    lineHeight: 22,
  },
  actionNumber: {
    alignItems: "center",
    borderColor: "rgba(245, 184, 75, 0.7)",
    borderRadius: radius.round,
    borderWidth: 1,
    height: 45,
    justifyContent: "center",
    shadowColor: colors.primary,
    shadowOffset: { height: 0, width: 0 },
    shadowOpacity: 0.58,
    shadowRadius: 10,
    width: 45,
  },
  actionNumberCompact: {
    height: 38,
    width: 38,
  },
  actionNumberText: {
    color: colors.primary,
    fontFamily: serif,
    fontSize: 27,
    lineHeight: 31,
  },
  actionNumberTextCompact: {
    fontSize: 22,
    lineHeight: 26,
  },
  actionsHeader: {
    marginTop: 29,
    width: "100%",
  },
  actionsHint: {
    color: "rgba(238, 231, 224, 0.76)",
    fontSize: 17,
    lineHeight: 23,
    marginTop: 6,
  },
  cancelButton: {
    alignItems: "center",
    alignSelf: "center",
    marginTop: 24,
    paddingHorizontal: 18,
    paddingVertical: 4,
  },
  cancelText: {
    color: colors.primary,
    fontSize: 23,
    fontWeight: "600",
    lineHeight: 30,
  },
  bullet: {
    color: "#FFD17A",
    fontSize: 22,
    lineHeight: 28,
    marginRight: 13,
    marginTop: -1,
  },
  bulletList: {
    gap: 9,
    marginTop: 15,
  },
  bulletRow: {
    alignItems: "flex-start",
    flexDirection: "row",
  },
  bulletText: {
    color: "rgba(255, 255, 255, 0.84)",
    flex: 1,
    fontSize: 18,
    lineHeight: 27,
  },
  bulletTextCompact: {
    fontSize: 13,
    lineHeight: 19,
  },
  planSide: {
    flex: 0.96,
    minWidth: 0,
  },
  planSideCompact: {
    flex: 0.95,
  },
  planHeading: {
    color: colors.primary,
    flexShrink: 1,
    fontFamily: serif,
    fontSize: 22,
    fontWeight: "700",
    lineHeight: 27,
    textTransform: "capitalize",
  },
  planHeadingCompact: {
    fontSize: 15,
    lineHeight: 20,
  },
  planHeadingRow: {
    alignItems: "center",
    flexDirection: "row",
  },
  planShield: {
    alignItems: "center",
    backgroundColor: "rgba(255, 205, 102, 0.1)",
    borderColor: "rgba(245, 184, 75, 0.34)",
    borderRadius: radius.round,
    borderWidth: 1,
    height: 42,
    justifyContent: "center",
    marginRight: 11,
    shadowColor: colors.primary,
    shadowOffset: { height: 0, width: 0 },
    shadowOpacity: 0.34,
    shadowRadius: 10,
    width: 42,
  },
  closeButton: {
    alignItems: "center",
    borderColor: "rgba(245, 184, 75, 0.62)",
    borderRadius: radius.round,
    borderWidth: 1,
    height: 58,
    justifyContent: "center",
    width: 58,
  },
  closeButtonCompact: {
    height: 46,
    width: 46,
  },
  controlPressed: {
    opacity: 0.72,
    transform: [{ scale: 0.97 }],
  },
  fieldBlock: {
    marginTop: 25,
    width: "100%",
  },
  fieldLabel: {
    color: colors.primary,
    fontSize: 20,
    fontWeight: "600",
    lineHeight: 26,
  },
  input: {
    borderColor: "rgba(245, 184, 75, 0.55)",
    borderRadius: 14,
    borderWidth: 1,
    color: colors.textPrimary,
    fontSize: 19,
    lineHeight: 25,
    marginTop: 12,
    minHeight: 62,
    outlineColor: colors.transparent,
    outlineWidth: 0,
    paddingHorizontal: 20,
  },
  modalHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  modalIconRing: {
    alignItems: "center",
    borderColor: "rgba(245, 184, 75, 0.62)",
    borderRadius: radius.round,
    borderWidth: 1,
    height: 70,
    justifyContent: "center",
    marginRight: 19,
    shadowColor: colors.primary,
    shadowOffset: { height: 0, width: 0 },
    shadowOpacity: 0.68,
    shadowRadius: 14,
    width: 70,
  },
  modalIconRingCompact: {
    height: 54,
    marginRight: 13,
    width: 54,
  },
  modalPanel: {
    borderColor: "rgba(245, 184, 75, 0.9)",
    borderRadius: 27,
    borderWidth: 1,
    paddingBottom: 34,
    paddingHorizontal: 38,
    paddingTop: 27,
    shadowColor: colors.primary,
    shadowOffset: { height: 0, width: 0 },
    shadowOpacity: 0.42,
    shadowRadius: 18,
    width: "100%",
  },
  modalPanelCompact: {
    borderRadius: 22,
    paddingBottom: 28,
    paddingHorizontal: 20,
    paddingTop: 22,
  },
  modalRoot: {
    flex: 1,
  },
  modalScrim: {
    backgroundColor: "rgba(0, 0, 0, 0.68)",
    flex: 1,
  },
  modalScrollContent: {
    alignItems: "center",
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 32,
  },
  modalTitle: {
    color: "#FFE2A1",
    flexShrink: 1,
    fontFamily: serif,
    fontSize: 36,
    fontWeight: "700",
    lineHeight: 43,
  },
  modalTitleCompact: {
    fontSize: 28,
    lineHeight: 34,
  },
  modalTitleRow: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    minWidth: 0,
    paddingRight: 14,
  },
  prompt: {
    color: "rgba(238, 231, 224, 0.66)",
    fontSize: 19,
    lineHeight: 29,
    marginTop: 16,
  },
  promptCompact: {
    fontSize: 14,
    lineHeight: 21,
    marginTop: 8,
  },
  riskCopy: {
    flex: 1,
    minWidth: 0,
  },
  riskEyebrow: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0,
    lineHeight: 18,
    textTransform: "uppercase",
  },
  riskImage: {
    height: "100%",
    width: "100%",
  },
  riskImageWrap: {
    borderRadius: radius.round,
    height: 66,
    marginRight: 18,
    overflow: "hidden",
    shadowColor: colors.primary,
    shadowOffset: { height: 0, width: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 18,
    width: 66,
  },
  riskImageWrapCompact: {
    height: 56,
    marginRight: 9,
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
    color: "#FFFFFF",
    fontFamily: serif,
    fontSize: 28,
    lineHeight: 34,
    marginTop: 14,
    textShadowColor: "rgba(0, 0, 0, 0.7)",
    textShadowRadius: 8,
  },
  riskTitleCompact: {
    fontSize: 19,
    lineHeight: 24,
    marginTop: 8,
  },
  screen: {
    backgroundColor: colors.background,
    flex: 1,
    overflow: "hidden",
  },
  subtitle: {
    color: "rgba(238, 231, 224, 0.7)",
    fontSize: 21,
    lineHeight: 30,
    marginTop: 10,
    textAlign: "center",
  },
  title: {
    color: "#FFE2A1",
    fontFamily: serif,
    fontWeight: "700",
    letterSpacing: 0,
    textAlign: "center",
    textShadowColor: "rgba(0, 0, 0, 0.45)",
    textShadowRadius: 6,
  },
  submitButton: {
    borderRadius: 15,
    marginTop: 30,
    shadowColor: colors.primary,
    shadowOffset: { height: 0, width: 0 },
    shadowOpacity: 0.88,
    shadowRadius: 14,
    width: "100%",
  },
  submitButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  submitFill: {
    alignItems: "center",
    borderColor: "#FFE7A3",
    borderRadius: 15,
    borderWidth: 1,
    flexDirection: "row",
    gap: 19,
    justifyContent: "center",
    minHeight: 76,
    overflow: "hidden",
  },
  submitText: {
    color: "#1A0F04",
    fontFamily: serif,
    fontSize: 32,
    fontWeight: "700",
    lineHeight: 38,
  },
  textArea: {
    minHeight: 132,
    paddingTop: 18,
    textAlignVertical: "top",
  },
});
