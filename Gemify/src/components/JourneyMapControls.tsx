import { useRouter } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";

import {
  AppButton,
  AppModal,
  AppText,
  CheckIcon,
  CloseIcon,
  IconButton,
  PencilIcon,
  ScreenHeader,
  SparkIcon,
} from "@/shared/components";
import { colors } from "@/theme/colors";
import {
  controls,
  fonts,
  fontSizes,
  iconSizes,
  lineHeights,
  radius,
  shadows,
  spacing,
  typography,
} from "@/theme/theme";

function SparklesIcon({ size = 27 }: { size?: number }) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 24 24" width={size}>
      <Path
        d="M12 2.8c.55 3.52 2.48 5.45 6 6-3.52.55-5.45 2.48-6 6-.55-3.52-2.48-5.45-6-6 3.52-.55 5.45-2.48 6-6Z"
        stroke={colors.primary}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
      />
      <Path
        d="M19.2 14.5c.25 1.78 1.27 2.8 3 3-1.73.2-2.75 1.22-3 3-.25-1.78-1.27-2.8-3-3 1.73-.2 2.75-1.22 3-3ZM5 3.2c.18 1.2.85 1.87 2 2-1.15.13-1.82.8-2 2-.18-1.2-.85-1.87-2-2 1.15-.13 1.82-.8 2-2Z"
        stroke={colors.primary}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
      />
    </Svg>
  );
}

const DREAM_NAME = "Your Dream Name";
const VISION_STATEMENT =
  "I imagine waking up in the life I once dreamed about—my goal is real, my days reflect the person I have become, and I feel proud, fulfilled, and free. I can see where I live, how I spend my time, who shares this journey with me, and the new possibilities now open to me.";

type JourneyOverviewModalProps = {
  dreamName: string;
  onClose: () => void;
  onEditPath: () => void;
  onOpenWhatIfPlan: () => void;
  visible: boolean;
  visionStatement: string;
};

function JourneyOverviewModal({
  dreamName,
  onClose,
  onEditPath,
  onOpenWhatIfPlan,
  visible,
  visionStatement,
}: JourneyOverviewModalProps) {
  const insets = useSafeAreaInsets();

  return (
    <AppModal
      onClose={onClose}
      panelStyle={[
        styles.modalPanel,
        { paddingBottom: Math.max(insets.bottom + 16, 30) },
      ]}
      showHandle={false}
      variant="sheet"
      visible={visible}
    >
      <View style={styles.frameOuter}>
        <View style={styles.frameInner}>
          <AppText align="center" variant="eyebrow">
            THE LIFE I&apos;M CREATING
          </AppText>
          <AppText align="center" style={styles.title} variant="title">
            {dreamName}
          </AppText>
          <View style={styles.ornamentRow}>
            <View style={styles.ornamentLine} />
            <SparkIcon size={iconSizes.sm} />
            <View style={styles.ornamentLine} />
          </View>

          <View style={styles.visionCard}>
            <AppText style={styles.quoteMark}>{"“"}</AppText>
            <AppText style={styles.visionText} variant="bodySerif">
              {visionStatement}
            </AppText>
          </View>

          <View style={styles.actionsRow}>
            <AppButton
              accessibilityLabel="Edit Path"
              icon={<PencilIcon color={colors.textOnPrimary} size={iconSizes.sm} />}
              iconPosition="before"
              label="Edit Path"
              onPress={onEditPath}
              style={styles.actionButton}
              textStyle={styles.actionLabel}
              variant="primary"
            />
            <AppButton
              accessibilityLabel="Check What If Plan"
              icon={<SparklesIcon size={iconSizes.sm} />}
              iconPosition="before"
              label={'Check "What If" Plan'}
              onPress={onOpenWhatIfPlan}
              style={styles.actionButton}
              textStyle={styles.actionLabel}
              variant="secondary"
            />
          </View>
        </View>
      </View>
    </AppModal>
  );
}

type DreamEditModalProps = {
  dreamName: string;
  onClose: () => void;
  onSave: (dreamName: string, visionStatement: string) => void;
  visible: boolean;
  visionStatement: string;
};

/**
 * Edit-mode variant of the overview sheet: same frame, but the dream name and
 * vision statement are editable in place. Save Changes enables once something
 * actually changed.
 */
function DreamEditModal({
  dreamName,
  onClose,
  onSave,
  visible,
  visionStatement,
}: DreamEditModalProps) {
  const insets = useSafeAreaInsets();
  const [draftName, setDraftName] = useState(dreamName);
  const [draftVision, setDraftVision] = useState(visionStatement);
  const [wasVisible, setWasVisible] = useState(false);

  // Reset the drafts each time the modal opens.
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) {
      setDraftName(dreamName);
      setDraftVision(visionStatement);
    }
  }

  const isDirty = draftName !== dreamName || draftVision !== visionStatement;
  const canSave = isDirty && draftName.trim().length > 0;

  return (
    <AppModal
      onClose={onClose}
      panelStyle={[
        styles.modalPanel,
        { paddingBottom: Math.max(insets.bottom + 16, 30) },
      ]}
      showHandle={false}
      variant="sheet"
      visible={visible}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.frameOuter}>
          <View style={styles.frameInner}>
            <AppText align="center" variant="eyebrow">
              THE LIFE I&apos;M CREATING
            </AppText>
            <TextInput
              onChangeText={setDraftName}
              placeholder="Your Dream Name"
              placeholderTextColor={colors.textPlaceholder}
              style={styles.dreamNameInput}
              value={draftName}
            />
            <View style={styles.ornamentRow}>
              <View style={styles.ornamentLine} />
              <SparkIcon size={iconSizes.sm} />
              <View style={styles.ornamentLine} />
            </View>

            <View style={styles.visionCard}>
              <AppText style={styles.quoteMark}>{"“"}</AppText>
              <TextInput
                multiline
                onChangeText={setDraftVision}
                placeholder="Describe the life you are creating…"
                placeholderTextColor={colors.textPlaceholder}
                style={styles.visionInput}
                value={draftVision}
              />
            </View>

            <AppButton
              disabled={!canSave}
              label="Save Changes"
              onPress={() => onSave(draftName.trim(), draftVision.trim())}
              style={styles.dreamSaveButton}
              textStyle={styles.actionLabel}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </AppModal>
  );
}

export type JourneyMapControlsProps = {
  editMode: boolean;
  onEnterEditMode: () => void;
  onExitEditMode: () => void;
  /** Hidden in the goal-creation flow, where the dream doesn't exist yet. */
  showDeleteDream?: boolean;
};

export function JourneyMapControls({
  editMode,
  onEnterEditMode,
  onExitEditMode,
  showDeleteDream = true,
}: JourneyMapControlsProps) {
  const router = useRouter();
  const [overviewVisible, setOverviewVisible] = useState(false);
  const [dreamEditVisible, setDreamEditVisible] = useState(false);
  const [confirmDreamDelete, setConfirmDreamDelete] = useState(false);
  const [dreamName, setDreamName] = useState(DREAM_NAME);
  const [visionStatement, setVisionStatement] = useState(VISION_STATEMENT);

  const openWhatIfPlan = () => {
    setOverviewVisible(false);
    router.push("/what-if-plan");
  };

  const openEditPath = () => {
    setOverviewVisible(false);
    onEnterEditMode();
  };

  return (
    <>
      <ScreenHeader
        asStackHeader
        rightAction={
          editMode
            ? undefined
            : {
                accessibilityLabel: "Open journey overview",
                icon: <SparklesIcon />,
                onPress: () => setOverviewVisible(true),
              }
        }
        rightSlot={
          editMode ? (
            <View style={styles.editActions}>
              {showDeleteDream ? (
                <AppButton
                  accessibilityLabel="Delete dream"
                  icon={<CloseIcon color={colors.danger} size={iconSizes.sm} />}
                  iconPosition="before"
                  label="Delete"
                  onPress={() => setConfirmDreamDelete(true)}
                  style={styles.deleteDreamButton}
                  textStyle={styles.deleteDreamLabel}
                  variant="secondary"
                />
              ) : null}
              <IconButton
                accessibilityLabel="Edit dream"
                icon={<PencilIcon color={colors.primary} size={iconSizes.sm} />}
                label="Dream"
                onPress={() => setDreamEditVisible(true)}
                size="sm"
              />
              <IconButton
                accessibilityLabel="Finish editing path"
                icon={<CheckIcon color={colors.primary} size={iconSizes.md} />}
                label="Done"
                onPress={onExitEditMode}
                size="sm"
              />
            </View>
          ) : undefined
        }
      />

      <JourneyOverviewModal
        dreamName={dreamName}
        onClose={() => setOverviewVisible(false)}
        onEditPath={openEditPath}
        onOpenWhatIfPlan={openWhatIfPlan}
        visible={overviewVisible}
        visionStatement={visionStatement}
      />

      <DreamEditModal
        dreamName={dreamName}
        onClose={() => setDreamEditVisible(false)}
        onSave={(nextName, nextVision) => {
          setDreamName(nextName);
          setVisionStatement(nextVision);
          setDreamEditVisible(false);
        }}
        visible={dreamEditVisible}
        visionStatement={visionStatement}
      />

      <AppModal
        onClose={() => setConfirmDreamDelete(false)}
        variant="center"
        visible={confirmDreamDelete}
      >
        <AppText align="center" variant="titleSm">
          Delete this dream?
        </AppText>
        <AppText align="center" style={styles.confirmBody} variant="bodySerif">
          Your dream name and vision statement will be cleared.
        </AppText>
        <View style={styles.confirmActionsRow}>
          <AppButton
            label="Cancel"
            onPress={() => setConfirmDreamDelete(false)}
            style={styles.dreamActionButton}
            textStyle={styles.actionLabel}
            variant="secondary"
          />
          <AppButton
            label="Delete"
            onPress={() => {
              setDreamName("");
              setVisionStatement("");
              setConfirmDreamDelete(false);
            }}
            style={[styles.dreamActionButton, styles.deleteButton]}
            textStyle={[styles.actionLabel, styles.deleteLabel]}
            variant="secondary"
          />
        </View>
      </AppModal>
    </>
  );
}

const styles = StyleSheet.create({
  modalPanel: {
    backgroundColor: colors.transparent,
    borderWidth: 0,
    padding: 0,
    paddingHorizontal: spacing.md,
  },
  frameOuter: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surfaceCard,
    padding: spacing.xs,
    ...shadows.softDark,
  },
  frameInner: {
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.borderFaint,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  title: {
    marginTop: spacing.xs,
  },
  ornamentRow: {
    alignItems: "center",
    alignSelf: "center",
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  ornamentLine: {
    width: 72,
    height: 1,
    backgroundColor: colors.border,
  },
  visionCard: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.md,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.surfaceDeep,
    padding: spacing.lg,
  },
  quoteMark: {
    color: colors.primary,
    fontFamily: fonts.serif,
    fontSize: fontSizes.stat,
    lineHeight: lineHeights.stat,
  },
  visionText: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: fontSizes.lg,
    lineHeight: lineHeights.xl,
  },
  editActions: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  dreamSaveButton: {
    marginTop: spacing.lg,
  },
  dreamActionButton: {
    flex: 1,
    paddingHorizontal: spacing.sm,
  },
  deleteButton: {
    borderColor: colors.danger,
  },
  deleteLabel: {
    color: colors.danger,
  },
  deleteDreamButton: {
    borderColor: colors.danger,
    minHeight: controls.iconButton.sm,
    paddingHorizontal: spacing.md,
  },
  deleteDreamLabel: {
    ...typography.controlLabel,
    color: colors.danger,
  },
  confirmBody: {
    marginTop: spacing.sm,
  },
  confirmActionsRow: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  dreamNameInput: {
    ...typography.title,
    borderBottomColor: colors.borderSoft,
    borderBottomWidth: 1,
    marginTop: spacing.xs,
    paddingBottom: 2,
    paddingHorizontal: 0,
    paddingTop: 0,
    textAlign: "center",
  },
  visionInput: {
    ...typography.bodySerif,
    flex: 1,
    color: colors.textPrimary,
    fontSize: fontSizes.lg,
    lineHeight: lineHeights.xl,
    minHeight: 120,
    padding: 0,
    textAlignVertical: "top",
  },
  actionsRow: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  actionButton: {
    flex: 1,
    paddingHorizontal: spacing.sm,
  },
  actionLabel: {
    fontSize: fontSizes.lg,
    lineHeight: lineHeights.lg,
  },
});
