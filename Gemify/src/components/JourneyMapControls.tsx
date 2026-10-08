import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";

import {
  clampPhotoScale,
  DEFAULT_PHOTO_TRANSFORM,
  DreamPhoto,
  DreamPhotoAdjuster,
  type DreamPhotoTransform,
} from "@/components/DreamPhotoFrame";
import {
  AppButton,
  AppModal,
  AppText,
  ActionMenuSheet,
  CheckIcon,
  DotsIcon,
  IconButton,
  MilestoneIcon,
  MinusIcon,
  PencilIcon,
  PlusIcon,
  ScreenHeader,
  SparkIcon,
  TrashIcon,
} from "@/shared/components";
import { useOncePerDay } from "@/hooks/useOncePerDay";
import { useLayoutSize } from "@/hooks/useLayoutSize";
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
  withOpacity,
} from "@/theme/theme";

function SparklesIcon({
  color = colors.primary,
  size = 27,
}: {
  color?: string;
  size?: number;
}) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 24 24" width={size}>
      <Path
        d="M12 2.8c.55 3.52 2.48 5.45 6 6-3.52.55-5.45 2.48-6 6-.55-3.52-2.48-5.45-6-6 3.52-.55 5.45-2.48 6-6Z"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
      />
      <Path
        d="M19.2 14.5c.25 1.78 1.27 2.8 3 3-1.73.2-2.75 1.22-3 3-.25-1.78-1.27-2.8-3-3 1.73-.2 2.75-1.22 3-3ZM5 3.2c.18 1.2.85 1.87 2 2-1.15.13-1.82.8-2 2-.18-1.2-.85-1.87-2-2 1.15-.13 1.82-.8 2-2Z"
        stroke={color}
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
  /** Opens the ⋯ sheet: edit the dream, edit the path, complete, delete. */
  onOpenMenu: () => void;
  /**
   * "intro" is the once-a-day greeting — the dream, and an OK button.
   * "overview" is the ✨ sheet, with the menu.
   */
  variant: "intro" | "overview";
  photoTransform: DreamPhotoTransform;
  photoUri: string | null;
  visible: boolean;
  visionStatement: string;
};

const DREAM_OVERVIEW_GRADIENT = [
  "rgba(8, 15, 25, 0.96)",
  "rgba(5, 12, 21, 0.98)",
  "rgba(7, 14, 23, 0.96)",
] as const;

function JourneyOverviewModal({
  dreamName,
  onClose,
  onOpenMenu,
  photoTransform,
  photoUri,
  variant,
  visible,
  visionStatement,
}: JourneyOverviewModalProps) {
  const insets = useSafeAreaInsets();
  const { phone } = useLayoutSize();
  // The daily greeting has nothing to act on: it shows the dream and closes.
  const isIntro = variant === "intro";
  const description = visionStatement.trim();

  return (
    <AppModal
      contentContainerStyle={[
        phone && styles.readOnlyModalContentPhone,
        {
          paddingTop: Math.max(insets.top, spacing.lg),
          paddingBottom: Math.max(insets.bottom, spacing.lg),
        },
      ]}
      maxWidth={820}
      onClose={onClose}
      panelStyle={styles.readOnlyModalPanel}
      showHandle={false}
      variant="center"
      visible={visible}
    >
      <View
        style={[
          styles.readOnlyCardShadow,
          phone && styles.readOnlyCardShadowPhone,
        ]}
      >
        <LinearGradient
          colors={DREAM_OVERVIEW_GRADIENT}
          locations={[0, 0.5, 1]}
          style={[styles.readOnlyCard, phone && styles.readOnlyCardPhone]}
        >
          {isIntro ? null : (
            <Pressable
              accessibilityLabel="Dream options"
              accessibilityRole="button"
              hitSlop={10}
              onPress={onOpenMenu}
              style={({ pressed }) => [
                styles.readOnlyMenuButton,
                phone && styles.readOnlyMenuButtonPhone,
                pressed && pressedStyle,
              ]}
            >
              <DotsIcon color={colors.primary} size={iconSizes.md} />
            </Pressable>
          )}
          <AppText
            align="center"
            style={[
              styles.readOnlyEyebrow,
              phone && styles.readOnlyEyebrowPhone,
            ]}
            variant="eyebrow"
          >
            THE LIFE I&apos;M CREATING
          </AppText>
          <AppText
            align="center"
            style={[styles.readOnlyTitle, phone && styles.readOnlyTitlePhone]}
            variant="title"
          >
            {dreamName}
          </AppText>

          {photoUri ? (
            <View
              style={[
                styles.readOnlyPhotoFrame,
                phone && styles.readOnlyPhotoFramePhone,
              ]}
            >
              <DreamPhoto
                style={styles.readOnlyPhoto}
                transform={photoTransform}
                uri={photoUri}
              />
            </View>
          ) : null}

          {/* No description, no empty frame with a quote mark floating in it. */}
          {description ? (
            <View
              style={[
                styles.readOnlyQuoteRow,
                phone && styles.readOnlyQuoteRowPhone,
              ]}
            >
              <AppText
                accessible={false}
                style={[
                  styles.readOnlyQuoteMark,
                  phone && styles.readOnlyQuoteMarkPhone,
                ]}
              >
                {"\u201C"}
              </AppText>
              <AppText
                style={[
                  styles.readOnlyVisionText,
                  phone && styles.readOnlyVisionTextPhone,
                ]}
                variant="bodySerif"
              >
                {description}
              </AppText>
            </View>
          ) : null}

          {isIntro ? (
            <AppButton
              label="OK"
              onPress={onClose}
              style={styles.readOnlyAction}
              variant="primary"
            />
          ) : null}
        </LinearGradient>
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
    photoTransform: DreamPhotoTransform,
  ) => void;
  photoTransform: DreamPhotoTransform;
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
  photoTransform,
  photoUri,
  showDelete,
  visible,
  visionStatement,
}: DreamEditModalProps) {
  const insets = useSafeAreaInsets();
  const { height, phone } = useLayoutSize();
  const nameInputRef = useRef<TextInput>(null);
  const [draftName, setDraftName] = useState(dreamName);
  const [draftVision, setDraftVision] = useState(visionStatement);
  const [draftPhotoUri, setDraftPhotoUri] = useState(photoUri);
  const [draftTransform, setDraftTransform] = useState(photoTransform);
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
      setDraftTransform(photoTransform);
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
        // A fresh photo starts from the plain centered cover fit.
        setDraftTransform(DEFAULT_PHOTO_TRANSFORM);
      }
    } catch (cause) {
      console.error("Failed to pick the dream image", cause);
    }
  };

  const zoomPhoto = (factor: number) =>
    setDraftTransform((current) => ({
      ...current,
      scale: clampPhotoScale(current.scale * factor),
    }));

  const isDirty =
    draftName !== dreamName ||
    draftVision !== visionStatement ||
    draftPhotoUri !== photoUri ||
    draftTransform.focusX !== photoTransform.focusX ||
    draftTransform.focusY !== photoTransform.focusY ||
    draftTransform.scale !== photoTransform.scale;
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
            <View style={styles.titleRow}>
              <TextInput
                onChangeText={setDraftName}
                placeholder="Your Dream Name"
                placeholderTextColor={colors.textPlaceholder}
                ref={nameInputRef}
                selectionColor={colors.primary}
                style={styles.dreamNameInput}
                value={draftName}
              />
              <Pressable
                accessibilityLabel="Edit the dream name"
                accessibilityRole="button"
                hitSlop={10}
                onPress={() => nameInputRef.current?.focus()}
                style={({ pressed }) => [
                  styles.titleEditButton,
                  pressed && pressedStyle,
                ]}
              >
                <PencilIcon color={colors.primary} size={iconSizes.sm} />
              </Pressable>
            </View>
            {phone ? null : (
              <View style={styles.ornamentRow}>
                <View style={styles.ornamentLine} />
                <SparkIcon size={iconSizes.sm} />
                <View style={styles.ornamentLine} />
              </View>
            )}

            {draftPhotoUri ? (
              <>
                <View
                  style={[
                    styles.photoFrame,
                    { maxHeight: height * (phone ? 0.22 : 0.28) },
                  ]}
                >
                  <DreamPhotoAdjuster
                    onChange={setDraftTransform}
                    style={StyleSheet.absoluteFill}
                    transform={draftTransform}
                    uri={draftPhotoUri}
                  />
                  <View style={styles.photoZoomControls}>
                    <Pressable
                      accessibilityLabel="Zoom the photo out"
                      accessibilityRole="button"
                      onPress={() => zoomPhoto(1 / 1.25)}
                      style={({ pressed }) => [
                        styles.photoZoomButton,
                        pressed && pressedStyle,
                      ]}
                    >
                      <MinusIcon color={colors.textPrimary} size={iconSizes.sm} />
                    </Pressable>
                    <Pressable
                      accessibilityLabel="Zoom the photo in"
                      accessibilityRole="button"
                      onPress={() => zoomPhoto(1.25)}
                      style={({ pressed }) => [
                        styles.photoZoomButton,
                        pressed && pressedStyle,
                      ]}
                    >
                      <PlusIcon color={colors.textPrimary} size={iconSizes.sm} />
                    </Pressable>
                  </View>
                  <Pressable
                    accessibilityLabel="Change the dream photo"
                    accessibilityRole="button"
                    onPress={pickDreamPhoto}
                    style={({ pressed }) => [
                      styles.photoEditBadge,
                      pressed && pressedStyle,
                    ]}
                  >
                    <PencilIcon
                      color={colors.textOnPrimary}
                      size={iconSizes.sm}
                    />
                  </Pressable>
                </View>
                {/* The − / + buttons sit on the frame; dragging is
                    discoverable without being told. */}
                {phone ? null : (
                  <AppText
                    align="center"
                    color={colors.textMuted}
                    style={styles.photoHint}
                    variant="caption"
                  >
                    Drag the photo to choose its focus, zoom with − / +
                  </AppText>
                )}
              </>
            ) : (
              <Pressable
                accessibilityLabel="Add a dream photo"
                accessibilityRole="button"
                onPress={pickDreamPhoto}
                style={({ pressed }) => [
                  styles.photoFrame,
                  { maxHeight: height * (phone ? 0.22 : 0.28) },
                  pressed && pressedStyle,
                ]}
              >
                <View style={styles.photoPlaceholder}>
                  <AppText color={colors.textMuted} variant="bodySmall">
                    Add a photo of your dream
                  </AppText>
                </View>
                <View style={styles.photoEditBadge}>
                  <PencilIcon
                    color={colors.textOnPrimary}
                    size={iconSizes.sm}
                  />
                </View>
              </Pressable>
            )}

            <View style={[styles.visionCard, phone && styles.visionCardPhone]}>
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
              <View
                style={[
                  styles.dreamActionsRow,
                  // Two 17 pt labels do not share 370 pt — stack them.
                  phone && styles.dreamActionsRowPhone,
                ]}
              >
                <AppButton
                  density="compact"
                  label="Delete Dream"
                  onPress={() => setConfirmDelete(true)}
                  style={[styles.dreamActionButton, styles.deleteButton]}
                  textStyle={[styles.actionLabel, styles.deleteLabel]}
                  variant="secondary"
                />
                <AppButton
                  density="compact"
                  disabled={!canSave}
                  label="Save Changes"
                  onPress={() =>
                  onSave(draftName.trim(), draftVision.trim(), draftPhotoUri, draftTransform)
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
                  onSave(draftName.trim(), draftVision.trim(), draftPhotoUri, draftTransform)
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
                    density="compact"
                    label="Cancel"
                    onPress={() => setConfirmDelete(false)}
                    style={styles.dreamActionButton}
                    textStyle={styles.actionLabel}
                    variant="secondary"
                  />
                  <AppButton
                    density="compact"
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
  /** Marks the dream finished; the screen celebrates and offers a memory. */
  onCompleteDream: () => void;
  onDeleteDream: () => void;
  onEnterEditMode: () => void;
  onExitEditMode: () => void;
  onSaveDream: (
    dreamName: string,
    visionStatement: string,
    photoUri: string | null,
    photoTransform: DreamPhotoTransform,
  ) => void;
  /** Saved framing of the dream image (focus point + zoom). */
  photoTransform?: DreamPhotoTransform;
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
  onCompleteDream,
  onDeleteDream,
  onEnterEditMode,
  onExitEditMode,
  onSaveDream,
  photoTransform = DEFAULT_PHOTO_TRANSFORM,
  photoUri = null,
  showDeleteDream = true,
  visionStatement,
}: JourneyMapControlsProps) {
  const router = useRouter();
  // One sheet, two faces: the ✨ overview and the once-a-day greeting.
  const [overviewMode, setOverviewMode] = useState<
    "intro" | "overview" | null
  >(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dreamEditVisible, setDreamEditVisible] = useState(false);

  // The daily greeting, per dream. A dream with neither photo nor
  // description has nothing to greet the user with, so it stays quiet.
  const introKey = dreamId !== undefined ? `dream_intro:${dreamId}` : "";
  const { due: introDue, markSeen: markIntroSeen } = useOncePerDay(introKey);
  const hasIntroContent =
    photoUri !== null || visionStatement.trim().length > 0;

  // Render-time state adjustment (the documented "adjusting state when props
  // change" pattern, as on the Memories screen): React re-runs this component
  // immediately with the new state, so the greeting opens on the same frame
  // the flag resolves — no effect round-trip, and one open per day.
  const [introHandled, setIntroHandled] = useState(false);
  if (
    !introHandled &&
    introKey !== "" &&
    introDue &&
    hasIntroContent &&
    !editMode
  ) {
    setIntroHandled(true);
    setOverviewMode("intro");
  }

  // Storing the flag is a write, so it waits for after the render.
  useEffect(() => {
    if (introHandled) void markIntroSeen();
  }, [introHandled, markIntroSeen]);

  const openWhatIfPlan = () => {
    setOverviewMode(null);
    router.push({
      pathname: "/what-if-plan",
      params: { dreamId: dreamId !== undefined ? String(dreamId) : "" },
    });
  };

  // The ⋯ sheet replaces the overview rather than stacking on it: two
  // native modals at once do not reliably both appear on iOS.
  const openMenu = () => {
    setOverviewMode(null);
    setMenuOpen(true);
  };

  const runFromMenu = (action: () => void) => {
    setMenuOpen(false);
    action();
  };

  return (
    <>
      <ScreenHeader
        asStackHeader
        // The map is opened from Home, Milestone Quests and the end of goal
        // creation; leaving it always lands on Home.
        onBack={() => router.dismissTo("/")}
        rightAction={
          editMode
            ? undefined
            : {
                accessibilityLabel: "Open journey overview",
                icon: <SparklesIcon />,
                onPress: () => setOverviewMode("overview"),
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
        onClose={() => setOverviewMode(null)}
        onOpenMenu={openMenu}
        photoTransform={photoTransform}
        photoUri={photoUri}
        variant={overviewMode ?? "overview"}
        visible={overviewMode !== null}
        visionStatement={visionStatement}
      />

      <ActionMenuSheet
        eyebrow="Dream options"
        onClose={() => setMenuOpen(false)}
        title={dreamName}
        visible={menuOpen}
        options={[
          { id: "edit", icon: PencilIcon, label: "Edit Dream", onPress: () => runFromMenu(() => setDreamEditVisible(true)) },
          { id: "path", icon: MilestoneIcon, label: "Edit Path", onPress: () => runFromMenu(onEnterEditMode) },
          { id: "what-if", icon: SparklesIcon, label: "What If Plan", onPress: () => runFromMenu(openWhatIfPlan) },
          { id: "complete", icon: CheckIcon, label: "Complete Dream", kind: "completion", onPress: () => runFromMenu(onCompleteDream) },
          showDeleteDream && { id: "delete", icon: TrashIcon, label: "Delete Dream", kind: "destructive", onPress: () => runFromMenu(onDeleteDream) },
        ]}
      />

      <DreamEditModal
        dreamName={dreamName}
        onClose={() => setDreamEditVisible(false)}
        onDelete={() => {
          setDreamEditVisible(false);
          onDeleteDream();
        }}
        onSave={(nextName, nextVision, nextPhotoUri, nextTransform) => {
          onSaveDream(nextName, nextVision, nextPhotoUri, nextTransform);
          setDreamEditVisible(false);
        }}
        photoTransform={photoTransform}
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
  readOnlyModalPanel: {
    backgroundColor: colors.transparent,
    borderWidth: 0,
    padding: 0,
  },
  readOnlyModalContentPhone: {
    paddingHorizontal: 18,
  },
  readOnlyCardShadow: {
    width: "100%",
    borderRadius: 28,
    backgroundColor: colors.backgroundSoft,
    ...shadowStyle({
      color: colors.background,
      elevation: 18,
      offsetY: 20,
      opacity: 0.58,
      radius: 34,
    }),
  },
  readOnlyCardShadowPhone: {
    borderRadius: 18,
  },
  readOnlyCard: {
    overflow: "hidden",
    borderColor: withOpacity(colors.textPrimary, 0.18),
    borderRadius: 28,
    borderWidth: 1,
    paddingHorizontal: 32,
    paddingBottom: 56,
    paddingTop: 88,
  },
  readOnlyCardPhone: {
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingBottom: 32,
    paddingTop: 52,
  },
  readOnlyEyebrow: {
    alignSelf: "stretch",
    color: colors.primary,
    fontSize: fontSizes.md,
    letterSpacing: 5,
    lineHeight: lineHeights.lg,
    textAlign: "center",
  },
  readOnlyEyebrowPhone: {
    fontSize: fontSizes.xs,
    letterSpacing: 3,
    lineHeight: lineHeights.sm,
  },
  readOnlyMenuButton: {
    alignItems: "center",
    backgroundColor: withOpacity(colors.surfaceDeep, 0.7),
    borderColor: withOpacity(colors.primary, 0.2),
    borderRadius: radius.round,
    borderWidth: 1,
    height: 58,
    justifyContent: "center",
    position: "absolute",
    right: 28,
    top: 24,
    width: 58,
  },
  readOnlyMenuButtonPhone: {
    height: 40,
    right: 10,
    top: 12,
    width: 40,
  },
  readOnlyTitle: {
    color: "#FFF4DE",
    flexShrink: 0,
    fontFamily: fonts.serif,
    fontSize: 56,
    letterSpacing: 0,
    lineHeight: 64,
    marginBottom: 28,
    marginTop: spacing.md,
  },
  readOnlyTitlePhone: {
    fontSize: 34,
    lineHeight: 38,
    marginBottom: 14,
    marginTop: 12,
  },
  readOnlyPhotoFrame: {
    alignSelf: "stretch",
    aspectRatio: 1.46,
    backgroundColor: colors.surfaceDeep,
    borderRadius: 24,
    flexShrink: 0,
    marginBottom: 56,
    overflow: "hidden",
  },
  readOnlyPhotoFramePhone: {
    borderRadius: 22,
    marginBottom: 32,
  },
  readOnlyPhoto: {
    height: "100%",
    width: "100%",
  },
  readOnlyQuoteRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 32,
    paddingHorizontal: 24,
  },
  readOnlyQuoteRowPhone: {
    gap: 22,
    paddingHorizontal: 12,
  },
  readOnlyQuoteMark: {
    color: colors.primary,
    fontFamily: fonts.serif,
    flexShrink: 0,
    fontSize: 76,
    lineHeight: 72,
    marginTop: -2,
  },
  readOnlyQuoteMarkPhone: {
    fontSize: 52,
    lineHeight: 48,
  },
  readOnlyVisionText: {
    color: "#FFF4DE",
    flex: 1,
    fontFamily: fonts.serif,
    fontSize: 28,
    letterSpacing: 0,
    lineHeight: 42,
    minWidth: 0,
  },
  readOnlyVisionTextPhone: {
    fontSize: 18,
    lineHeight: 26,
  },
  readOnlyAction: {
    alignSelf: "stretch",
    marginTop: spacing.lg,
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
  /** How-to line under the adjustable photo. */
  photoHint: {
    marginBottom: spacing.md,
    marginTop: -spacing.xs,
  },
  /** Quiet − / + pair opposite the pencil badge. */
  photoZoomControls: {
    bottom: spacing.sm,
    flexDirection: "row",
    gap: spacing.sm,
    left: spacing.sm,
    position: "absolute",
  },
  photoZoomButton: {
    alignItems: "center",
    backgroundColor: withOpacity(colors.surfaceDeep, 0.8),
    borderColor: colors.borderStrong,
    borderRadius: radius.round,
    borderWidth: 1,
    height: 36,
    justifyContent: "center",
    width: 36,
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
  visionCardPhone: {
    padding: spacing.md,
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
  overviewEyebrowRow: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 42,
    position: "relative",
  },
  overviewEyebrow: {
    alignSelf: "stretch",
    paddingHorizontal: 42,
  },
  overviewMenuButton: {
    alignItems: "center",
    backgroundColor: colors.surfaceGlass,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    height: 42,
    justifyContent: "center",
    overflow: "hidden",
    position: "absolute",
    right: 0,
    top: 0,
    width: 42,
    ...shadowStyle({
      color: colors.primary,
      elevation: 8,
      opacity: 0.22,
      radius: 10,
    }),
  },
  overviewMenuInnerEdge: {
    ...StyleSheet.absoluteFill,
    borderBottomColor: colors.secondaryDark,
    borderColor: colors.borderSoft,
    borderRadius: radius.md,
    borderWidth: 1,
    margin: 2,
  },
  overviewAction: {
    alignSelf: "stretch",
    marginTop: spacing.lg,
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
  dreamActionsRowPhone: {
    flexDirection: "column",
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
  /** Input fills the row; the pencil floats at its right edge. */
  titleRow: {
    justifyContent: "center",
    marginTop: spacing.xs,
  },
  titleEditButton: {
    bottom: 0,
    justifyContent: "center",
    position: "absolute",
    right: 0,
    top: 0,
  },
  dreamNameInput: {
    ...typography.title,
    ...inputFocusReset,
    borderBottomColor: colors.borderSoft,
    borderBottomWidth: 1,
    paddingBottom: 2,
    // Keeps long names clear of the pencil on both sides of the centering.
    paddingHorizontal: spacing.xl,
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
  actionsRowPhone: {
    flexDirection: "column",
  },
  actionButton: {
    flex: 1,
  },
  actionLabel: {
    fontSize: fontSizes.lg,
    lineHeight: lineHeights.lg,
  },
});
