import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";

import {
  AppButton,
  AppModal,
  AppText,
  CheckIcon,
  IconButton,
  PencilIcon,
  ScreenHeader,
  SparkIcon,
} from "@/shared/components";
import { colors } from "@/theme/colors";
import {
  fonts,
  fontSizes,
  iconSizes,
  inputFocusReset,
  lineHeights,
  pressed as pressedStyle,
  radius,
  shadows,
  shadowStyle,
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

type JourneyOverviewModalProps = {
  dreamName: string;
  onClose: () => void;
  onEditPath: () => void;
  onOpenWhatIfPlan: () => void;
  photoUri: string | null;
  visible: boolean;
  visionStatement: string;
};

function JourneyOverviewModal({
  dreamName,
  onClose,
  onEditPath,
  onOpenWhatIfPlan,
  photoUri,
  visible,
  visionStatement,
}: JourneyOverviewModalProps) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();

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

          {photoUri ? (
            <View style={[styles.photoFrame, { maxHeight: height * 0.32 }]}>
              <Image
                contentFit="cover"
                source={{ uri: photoUri }}
                style={styles.photo}
              />
            </View>
          ) : null}

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
  onDelete: () => void;
  onSave: (
    dreamName: string,
    visionStatement: string,
    photoUri: string | null,
  ) => void;
  photoUri: string | null;
  /** Hidden in the goal-creation flow, where the dream doesn't exist yet. */
  showDelete: boolean;
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
  onDelete,
  onSave,
  photoUri,
  showDelete,
  visible,
  visionStatement,
}: DreamEditModalProps) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const [draftName, setDraftName] = useState(dreamName);
  const [draftVision, setDraftVision] = useState(visionStatement);
  const [draftPhotoUri, setDraftPhotoUri] = useState(photoUri);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [wasVisible, setWasVisible] = useState(false);

  // Reset the drafts each time the modal opens.
  if (visible !== wasVisible) {
    setWasVisible(visible);
    setConfirmDelete(false);
    if (visible) {
      setDraftName(dreamName);
      setDraftVision(visionStatement);
      setDraftPhotoUri(photoUri);
    }
  }

  const pickDreamPhoto = async () => {
    try {
      if (Platform.OS !== "web") {
        const permission =
          await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) {
        setDraftPhotoUri(result.assets[0].uri);
      }
    } catch (cause) {
      console.error("Failed to pick the dream image", cause);
    }
  };

  const isDirty =
    draftName !== dreamName ||
    draftVision !== visionStatement ||
    draftPhotoUri !== photoUri;
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

            <Pressable
              accessibilityLabel={
                draftPhotoUri ? "Change the dream photo" : "Add a dream photo"
              }
              accessibilityRole="button"
              onPress={pickDreamPhoto}
              style={({ pressed }) => [
                styles.photoFrame,
                { maxHeight: height * 0.28 },
                pressed && pressedStyle,
              ]}
            >
              {draftPhotoUri ? (
                <Image
                  contentFit="cover"
                  source={{ uri: draftPhotoUri }}
                  style={styles.photo}
                />
              ) : (
                <View style={styles.photoPlaceholder}>
                  <AppText color={colors.textMuted} variant="bodySmall">
                    Add a photo of your dream
                  </AppText>
                </View>
              )}
              <View style={styles.photoEditBadge}>
                <PencilIcon color={colors.textOnPrimary} size={iconSizes.sm} />
              </View>
            </Pressable>

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

            {showDelete ? (
              <View style={styles.dreamActionsRow}>
                <AppButton
                  label="Delete Dream"
                  onPress={() => setConfirmDelete(true)}
                  style={[styles.dreamActionButton, styles.deleteButton]}
                  textStyle={[styles.actionLabel, styles.deleteLabel]}
                  variant="secondary"
                />
                <AppButton
                  disabled={!canSave}
                  label="Save Changes"
                  onPress={() =>
                  onSave(draftName.trim(), draftVision.trim(), draftPhotoUri)
                }
                  style={styles.dreamActionButton}
                  textStyle={styles.actionLabel}
                />
              </View>
            ) : (
              <AppButton
                disabled={!canSave}
                label="Save Changes"
                onPress={() =>
                  onSave(draftName.trim(), draftVision.trim(), draftPhotoUri)
                }
                style={styles.dreamSaveButton}
                textStyle={styles.actionLabel}
              />
            )}
          </View>

          {confirmDelete ? (
            <View style={styles.confirmOverlay}>
              <View style={styles.confirmCard}>
                <AppText align="center" variant="titleSm">
                  Delete this dream?
                </AppText>
                <AppText
                  align="center"
                  style={styles.confirmBody}
                  variant="bodySerif"
                >
                  Your dream name and vision statement will be cleared.
                </AppText>
                <View style={styles.confirmActionsRow}>
                  <AppButton
                    label="Cancel"
                    onPress={() => setConfirmDelete(false)}
                    style={styles.dreamActionButton}
                    textStyle={styles.actionLabel}
                    variant="secondary"
                  />
                  <AppButton
                    label="Delete"
                    onPress={() => {
                      setConfirmDelete(false);
                      onDelete();
                    }}
                    style={[styles.dreamActionButton, styles.deleteButton]}
                    textStyle={[styles.actionLabel, styles.deleteLabel]}
                    variant="secondary"
                  />
                </View>
              </View>
            </View>
          ) : null}
        </View>
      </KeyboardAvoidingView>
    </AppModal>
  );
}

export type JourneyMapControlsProps = {
  /** Id of the dream shown on the map; forwarded to the What-If screen. */
  dreamId?: number;
  dreamName: string;
  editMode: boolean;
  onDeleteDream: () => void;
  onEnterEditMode: () => void;
  onExitEditMode: () => void;
  onSaveDream: (
    dreamName: string,
    visionStatement: string,
    photoUri: string | null,
  ) => void;
  /** Dream image shown in the overview sheet; hidden when null. */
  photoUri?: string | null;
  /** Hidden in the goal-creation flow, where the dream doesn't exist yet. */
  showDeleteDream?: boolean;
  visionStatement: string;
};

export function JourneyMapControls({
  dreamId,
  dreamName,
  editMode,
  onDeleteDream,
  onEnterEditMode,
  onExitEditMode,
  onSaveDream,
  photoUri = null,
  showDeleteDream = true,
  visionStatement,
}: JourneyMapControlsProps) {
  const router = useRouter();
  const [overviewVisible, setOverviewVisible] = useState(false);
  const [dreamEditVisible, setDreamEditVisible] = useState(false);

  const openWhatIfPlan = () => {
    setOverviewVisible(false);
    router.push({
      pathname: "/what-if-plan",
      params: { dreamId: dreamId !== undefined ? String(dreamId) : "" },
    });
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
        photoUri={photoUri}
        visible={overviewVisible}
        visionStatement={visionStatement}
      />

      <DreamEditModal
        dreamName={dreamName}
        onClose={() => setDreamEditVisible(false)}
        onDelete={() => {
          setDreamEditVisible(false);
          onDeleteDream();
        }}
        onSave={(nextName, nextVision, nextPhotoUri) => {
          onSaveDream(nextName, nextVision, nextPhotoUri);
          setDreamEditVisible(false);
        }}
        photoUri={photoUri}
        showDelete={showDeleteDream}
        visible={dreamEditVisible}
        visionStatement={visionStatement}
      />
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
  /** The dream image frame: gold edge and soft glow, as on the See Dream step. */
  photoFrame: {
    alignSelf: "stretch",
    aspectRatio: 1.45,
    backgroundColor: colors.surfaceDeep,
    borderColor: colors.primary,
    borderRadius: radius.card,
    borderWidth: 1.5,
    marginBottom: spacing.md,
    overflow: "hidden",
    ...shadowStyle({
      color: colors.primary,
      elevation: 10,
      opacity: 0.35,
      radius: 22,
    }),
  },
  photo: {
    height: "100%",
    width: "100%",
  },
  photoPlaceholder: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  /** Gold pencil badge signalling the photo is editable. */
  photoEditBadge: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: radius.round,
    bottom: spacing.sm,
    height: 36,
    justifyContent: "center",
    position: "absolute",
    right: spacing.sm,
    width: 36,
    ...shadows.softDark,
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
  dreamActionsRow: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  confirmOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    backgroundColor: colors.scrim,
    borderRadius: radius.lg,
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
  dreamNameInput: {
    ...typography.title,
    ...inputFocusReset,
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
    ...inputFocusReset,
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
