import { Image } from "expo-image";
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
import { ActiveMilestonePicker } from "@/components/ActiveMilestonePicker";

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
  ArchiveIcon,
  CheckIcon,
  CloseIcon,
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

const DREAM_PHOTO_PLACEHOLDER = require("../../assets/dreams/add_photo_of_your_dream.png");

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
  onSave: (
    dreamName: string,
    visionStatement: string,
    photoUri: string | null,
    photoTransform: DreamPhotoTransform,
  ) => void;
  photoTransform: DreamPhotoTransform;
  photoUri: string | null;
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
  photoTransform,
  photoUri,
  visible,
  visionStatement,
}: DreamEditModalProps) {
  const insets = useSafeAreaInsets();
  const { phone } = useLayoutSize();
  const nameInputRef = useRef<TextInput>(null);
  const visionInputRef = useRef<TextInput>(null);
  const [nameHeight, setNameHeight] = useState(0);
  const [visionHeight, setVisionHeight] = useState(0);
  const [draftName, setDraftName] = useState(dreamName);
  const [draftVision, setDraftVision] = useState(visionStatement);
  const [draftPhotoUri, setDraftPhotoUri] = useState(photoUri);
  const [draftTransform, setDraftTransform] = useState(photoTransform);
  const [wasVisible, setWasVisible] = useState(false);

  // Reset the drafts each time the modal opens.
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) {
      setNameHeight(0);
      setVisionHeight(0);
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
      contentContainerStyle={[
        phone && styles.editModalContentPhone,
        {
          paddingTop: Math.max(insets.top, spacing.xl),
          paddingBottom: Math.max(insets.bottom, spacing.xl),
        },
      ]}
      maxWidth={820}
      onClose={onClose}
      panelStyle={styles.readOnlyModalPanel}
      showHandle={false}
      variant="center"
      visible={visible}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <LinearGradient colors={DREAM_OVERVIEW_GRADIENT} style={styles.frameOuter}>
          <Pressable
            accessibilityLabel="Close dream editor"
            accessibilityRole="button"
            hitSlop={8}
            onPress={onClose}
            style={({ pressed }) => [
              styles.editCloseButton,
              pressed && pressedStyle,
            ]}
          >
            <CloseIcon color={colors.textPrimary} size={iconSizes.md} />
          </Pressable>
          <View pointerEvents="none" style={styles.editTopOrnament}>
            <SparkIcon size={28} />
          </View>
          <View style={[styles.frameInner, phone && styles.frameInnerPhone]}>
            <AppText
              align="center"
              style={[styles.editEyebrow, phone && styles.editEyebrowPhone]}
              variant="eyebrow"
            >
              THE LIFE I&apos;M CREATING
            </AppText>
            <View style={styles.titleRow}>
              <TextInput
                accessibilityLabel="Dream name"
                multiline
                onChangeText={setDraftName}
                onContentSizeChange={(event) =>
                  setNameHeight(event.nativeEvent.contentSize.height)
                }
                placeholder="Your Dream Name"
                placeholderTextColor={colors.textPlaceholder}
                ref={nameInputRef}
                scrollEnabled={false}
                selectionColor={colors.primary}
                style={[
                  styles.dreamNameInput,
                  phone && styles.dreamNameInputPhone,
                  { height: Math.max(phone ? 44 : 64, nameHeight) },
                ]}
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
                <PencilIcon color={colors.textPrimary} size={iconSizes.sm} />
              </Pressable>
            </View>
            {draftPhotoUri ? (
                <View style={styles.photoFrame}>
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
            ) : (
              <Pressable
                accessibilityLabel="Add a dream photo"
                accessibilityRole="button"
                onPress={pickDreamPhoto}
                style={({ pressed }) => [
                  styles.photoFrame,
                  styles.photoPlaceholderFrame,
                  pressed && pressedStyle,
                ]}
              >
                <Image
                  contentFit="contain"
                  source={DREAM_PHOTO_PLACEHOLDER}
                  style={StyleSheet.absoluteFill}
                />
              </Pressable>
            )}

            <View style={[styles.visionCard, phone && styles.visionCardPhone]}>
              <AppText
                accessible={false}
                style={[styles.quoteMark, phone && styles.quoteMarkPhone]}
              >
                {"\u201C"}
              </AppText>
              <TextInput
                accessibilityLabel="Dream description"
                multiline
                onChangeText={setDraftVision}
                onContentSizeChange={(event) =>
                  setVisionHeight(event.nativeEvent.contentSize.height)
                }
                placeholder="Describe the life you are creating…"
                placeholderTextColor={colors.textPlaceholder}
                ref={visionInputRef}
                scrollEnabled={false}
                selectionColor={colors.primary}
                style={[
                  styles.visionInput,
                  phone && styles.visionInputPhone,
                  { height: Math.max(phone ? 84 : 126, visionHeight) },
                ]}
                value={draftVision}
              />
              <Pressable
                accessibilityLabel="Edit the dream description"
                accessibilityRole="button"
                hitSlop={10}
                onPress={() => visionInputRef.current?.focus()}
                style={({ pressed }) => [
                  styles.visionEditButton,
                  pressed && pressedStyle,
                ]}
              >
                <PencilIcon color={colors.primary} size={iconSizes.sm} />
              </Pressable>
            </View>

              <AppButton
                disabled={!canSave}
                label="Save Changes"
                onPress={() =>
                  onSave(draftName.trim(), draftVision.trim(), draftPhotoUri, draftTransform)
                }
                style={styles.dreamSaveButton}
                textStyle={[styles.saveLabel, phone && styles.saveLabelPhone]}
              />
          </View>
          <View pointerEvents="none" style={styles.editBottomOrnament}>
            <SparkIcon size={28} />
          </View>

        </LinearGradient>
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
  onArchiveDream: () => void;
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
  onArchiveDream,
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
  const [milestonePickerVisible, setMilestonePickerVisible] = useState(false);

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
          dreamId !== undefined && { id: "active-milestone", icon: MilestoneIcon, label: "Set Active Milestone", onPress: () => runFromMenu(() => setMilestonePickerVisible(true)) },
          { id: "what-if", icon: SparklesIcon, label: "What If Plan", onPress: () => runFromMenu(openWhatIfPlan) },
          dreamId !== undefined && { id: "archive", icon: ArchiveIcon, label: "Archive Dream", onPress: () => runFromMenu(onArchiveDream) },
          { id: "complete", icon: CheckIcon, label: "Complete Dream", kind: "completion", onPress: () => runFromMenu(onCompleteDream) },
          showDeleteDream && { id: "delete", icon: TrashIcon, label: "Delete Dream", kind: "destructive", onPress: () => runFromMenu(onDeleteDream) },
        ]}
      />

      {milestonePickerVisible && dreamId !== undefined ? (
        <ActiveMilestonePicker dreamId={dreamId} onClose={() => setMilestonePickerVisible(false)} />
      ) : null}

      <DreamEditModal
        dreamName={dreamName}
        onClose={() => setDreamEditVisible(false)}
        onSave={(nextName, nextVision, nextPhotoUri, nextTransform) => {
          onSaveDream(nextName, nextVision, nextPhotoUri, nextTransform);
          setDreamEditVisible(false);
        }}
        photoTransform={photoTransform}
        photoUri={photoUri}
        visible={dreamEditVisible}
        visionStatement={visionStatement}
      />
    </>
  );
}

const styles = StyleSheet.create({
  editModalContentPhone: {
    paddingHorizontal: 12,
  },
  editCloseButton: {
    alignItems: "center",
    backgroundColor: colors.transparent,
    borderWidth: 0,
    height: 40,
    justifyContent: "center",
    position: "absolute",
    right: 10,
    top: 8,
    width: 40,
    zIndex: 1,
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
    borderRadius: 26,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surfaceCard,
    padding: 5,
    ...shadows.softDark,
  },
  frameInner: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.borderFaint,
    paddingHorizontal: 28,
    paddingVertical: 44,
  },
  frameInnerPhone: {
    paddingHorizontal: 14,
    paddingVertical: 26,
    paddingTop: 42,
  },
  editEyebrow: {
    color: colors.primary,
    fontSize: fontSizes.md,
    letterSpacing: 5,
    lineHeight: lineHeights.lg,
  },
  editEyebrowPhone: {
    fontSize: 13,
    letterSpacing: 3,
    lineHeight: 20,
  },
  editTopOrnament: {
    alignItems: "center",
    left: 0,
    position: "absolute",
    right: 0,
    top: -15,
  },
  editBottomOrnament: {
    alignItems: "center",
    bottom: -15,
    left: 0,
    position: "absolute",
    right: 0,
  },
  /** The dream image frame: gold edge and soft glow, as on the See Dream step. */
  photoFrame: {
    alignSelf: "stretch",
    aspectRatio: 1.58,
    backgroundColor: colors.surfaceDeep,
    borderColor: colors.primary,
    borderRadius: radius.card,
    borderWidth: 1.5,
    flexShrink: 0,
    marginBottom: spacing.lg,
    marginHorizontal: 10,
    overflow: "hidden",
    ...shadowStyle({
      color: colors.primary,
      elevation: 10,
      opacity: 0.35,
      radius: 22,
    }),
  },
  photoPlaceholderFrame: {
    aspectRatio: 838 / 493,
    backgroundColor: colors.transparent,
    borderWidth: 0,
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
    gap: 20,
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 40,
  },
  visionCard: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 28,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: withOpacity(colors.textPrimary, 0.25),
    backgroundColor: colors.surfaceDeep,
    paddingHorizontal: 28,
    paddingTop: 28,
    paddingBottom: 44,
  },
  quoteMark: {
    color: colors.primary,
    fontFamily: fonts.serif,
    flexShrink: 0,
    fontSize: 60,
    lineHeight: 56,
  },
  quoteMarkPhone: {
    fontSize: 46,
    lineHeight: 44,
  },
  visionEditButton: {
    alignItems: "center",
    bottom: 12,
    height: 28,
    justifyContent: "center",
    position: "absolute",
    right: 14,
    width: 28,
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
    borderColor: colors.primaryBright,
    borderRadius: 22,
    borderWidth: 1,
    marginHorizontal: 6,
    marginTop: spacing.lg,
  },
  saveLabel: {
    fontFamily: fonts.serif,
    fontSize: 28,
    fontWeight: "700",
    lineHeight: 36,
  },
  saveLabelPhone: {
    fontSize: 22,
    lineHeight: 28,
  },
  /** Input fills the row; the pencil floats at its right edge. */
  titleRow: {
    justifyContent: "center",
    marginBottom: 18,
    marginTop: 12,
  },
  titleEditButton: {
    alignItems: "center",
    height: 44,
    justifyContent: "center",
    position: "absolute",
    right: 0,
    top: 2,
    width: 28,
  },
  dreamNameInput: {
    ...typography.title,
    ...inputFocusReset,
    color: "#FFF4DE",
    fontSize: 52,
    letterSpacing: 0,
    lineHeight: 60,
    paddingBottom: 0,
    // Keeps long names clear of the pencil on both sides of the centering.
    paddingHorizontal: 28,
    paddingTop: 0,
    textAlign: "center",
    textAlignVertical: "top",
  },
  dreamNameInputPhone: {
    fontSize: 36,
    lineHeight: 42,
  },
  visionInput: {
    ...typography.bodySerif,
    ...inputFocusReset,
    flex: 1,
    color: "#FFF4DE",
    fontSize: 28,
    letterSpacing: 0,
    lineHeight: 42,
    minWidth: 0,
    padding: 0,
    textAlignVertical: "top",
  },
  visionInputPhone: {
    fontSize: 20,
    lineHeight: 28,
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
