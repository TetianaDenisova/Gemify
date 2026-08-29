import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import Svg, { Circle, Path, Rect } from "react-native-svg";

import { DatePickerModal } from "@/components/DatePickerModal";
import type { TimelineIconKey, TimelineMoment } from "@/data/progressData";
import {
  addTimelineMoment,
  deleteTimelineMoment,
  updateTimelineMoment,
} from "@/db";
import { useProgressContent } from "@/hooks/useProgressContent";
import {
  AppButton,
  AppInput,
  AppModal,
  AppText,
  Badge,
  Card,
  ChevronIcon,
  CloseIcon,
  IconButton,
  ListItem,
  PlusIcon,
  ScreenScaffold,
} from "@/shared/components";
import { colors } from "@/theme/colors";
import {
  fontSizes,
  fonts,
  layout,
  lineHeights,
  radius,
  shadowStyle,
  spacing,
  textGlow,
} from "@/theme/theme";
import { toDateKey, todayKey } from "@/utils/dates";
import { deleteMemoryPhotos, persistMemoryPhoto } from "@/utils/memoryPhotos";

const TIMELINE_ITEM_WIDTH = 104;
const TIMELINE_CONNECTOR_WIDTH = 26;
/** Vertical offset from a row's top to the centre of its circles (badge slot + half circle). */
const TIMELINE_CIRCLE_CENTER_Y = 67;
/** Horizontal distance from an item's edge to the edge of its circle. */
const TIMELINE_TURN_LEAD = (TIMELINE_ITEM_WIDTH - 64) / 2;
const TIMELINE_TURN_WIDTH = 36;
const MAX_MEMORY_PHOTOS = 5;

const MEMORIES_BACK = require("../../../assets/images/memory-custle.png");

const goldTint = { glow: colors.primaryGlow, main: colors.primary };

/** "Aug 23, 2026" for a YYYY-MM-DD key (noon guards against TZ day shifts). */
function formatDateKey(dateKey: string): string {
  return new Date(`${dateKey}T12:00:00`).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function CalendarGlyph({ color = colors.primary, size = 20 }: { color?: string; size?: number }) {
  return (
    <Svg height={size} viewBox="0 0 24 24" width={size}>
      <Rect
        fill="none"
        height={15}
        rx={2.4}
        stroke={color}
        strokeWidth={1.6}
        width={18}
        x={3}
        y={5}
      />
      <Path
        d="M7 3v4M17 3v4M3 10h18"
        fill="none"
        stroke={color}
        strokeLinecap="round"
        strokeWidth={1.6}
      />
    </Svg>
  );
}

function SparkleGlyph({ color = colors.accentViolet, size = 22 }: { color?: string; size?: number }) {
  return (
    <Svg height={size} viewBox="0 0 24 24" width={size}>
      <Path
        d="M12 2c.9 4.6 2.4 6.1 7 7-4.6.9-6.1 2.4-7 7-.9-4.6-2.4-6.1-7-7 4.6-.9 6.1-2.4 7-7Z"
        fill={color}
      />
      <Path d="M19 15c.4 2 1 2.6 3 3-2 .4-2.6 1-3 3-.4-2-1-2.6-3-3 2-.4 2.6-1 3-3Z" fill={color} opacity={0.7} />
    </Svg>
  );
}

function DotsGlyph({ color = colors.textSecondary, size = 20 }: { color?: string; size?: number }) {
  return (
    <Svg height={size} viewBox="0 0 24 24" width={size}>
      <Circle cx={5} cy={12} fill={color} r={1.7} />
      <Circle cx={12} cy={12} fill={color} r={1.7} />
      <Circle cx={19} cy={12} fill={color} r={1.7} />
    </Svg>
  );
}

function LockGlyph({ color = colors.primary, size = 14 }: { color?: string; size?: number }) {
  return (
    <Svg height={size} viewBox="0 0 24 24" width={size}>
      <Rect fill="none" height={8.5} rx={2} stroke={color} strokeWidth={1.8} width={11} x={6.5} y={10.5} />
      <Path d="M9 10.5V8a3 3 0 0 1 6 0v2.5" fill="none" stroke={color} strokeLinecap="round" strokeWidth={1.8} />
    </Svg>
  );
}

function TimelineGlyph({ color, icon, size = 26 }: { color: string; icon: TimelineIconKey; size?: number }) {
  const stroke = { fill: "none", stroke: color, strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 1.6 } as const;

  switch (icon) {
    case "spark":
      return (
        <Svg height={size} viewBox="0 0 24 24" width={size}>
          <Path d="M12 3v18M3 12h18M6 6l12 12M18 6 6 18" {...stroke} />
        </Svg>
      );
    case "code":
      return (
        <Svg height={size} viewBox="0 0 24 24" width={size}>
          <Path d="m9 8-5 4 5 4M15 8l5 4-5 4" {...stroke} />
        </Svg>
      );
    case "userPlus":
      return (
        <Svg height={size} viewBox="0 0 24 24" width={size}>
          <Circle cx={10} cy={9} r={3.2} {...stroke} />
          <Path d="M4.5 19c.8-3 2.9-4.5 5.5-4.5s4.7 1.5 5.5 4.5M18 8v6M15 11h6" {...stroke} />
        </Svg>
      );
    case "rocket":
      return (
        <Svg height={size} viewBox="0 0 24 24" width={size}>
          <Path
            d="M19.5 4.5c-4.3.4-7.5 2.3-10 5.3l-2.2 2.7 4.2 4.2 2.7-2.2c3-2.5 4.9-5.7 5.3-10Z"
            {...stroke}
          />
          <Circle cx={14.6} cy={9.4} r={1.5} {...stroke} />
          <Path d="M8.2 15.8 5 19M7 12.5l-2.6.9M11.5 17l-.9 2.6" {...stroke} />
        </Svg>
      );
    case "chat":
      return (
        <Svg height={size} viewBox="0 0 24 24" width={size}>
          <Path
            d="M5 5h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-8l-4 3.5V16H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z"
            {...stroke}
          />
          <Path d="M8 9.5h8M8 12.5h5" {...stroke} />
        </Svg>
      );
    case "target":
      return (
        <Svg height={size} viewBox="0 0 24 24" width={size}>
          <Circle cx={12} cy={12} r={8} {...stroke} />
          <Circle cx={12} cy={12} r={4.4} {...stroke} />
          <Circle cx={12} cy={12} fill={color} r={1.5} />
        </Svg>
      );
  }
}

function PhotoGlyph({ color = colors.primary, size = 13 }: { color?: string; size?: number }) {
  return (
    <Svg height={size} viewBox="0 0 24 24" width={size}>
      <Rect
        fill="none"
        height={14}
        rx={2.5}
        stroke={color}
        strokeWidth={1.8}
        width={17}
        x={3.5}
        y={5}
      />
      <Circle cx={8.6} cy={9.6} fill={color} r={1.6} />
      <Path
        d="m6 17 4.4-4.6 3 3 2.6-2.4 2.5 4"
        fill="none"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
      />
    </Svg>
  );
}

function TimelineMomentItem({
  moment,
  onPress,
}: {
  moment: TimelineMoment;
  onPress: (moment: TimelineMoment) => void;
}) {
  return (
    <Pressable
      accessibilityLabel={`Open memory ${moment.label}`}
      accessibilityRole="button"
      onPress={() => onPress(moment)}
      style={styles.timelineItem}
    >
      <View style={styles.timelineBadgeSlot}>
        {moment.locked ? (
          <View style={[styles.lockBubble, { borderColor: goldTint.main }]}>
            <LockGlyph color={goldTint.main} />
          </View>
        ) : null}
      </View>
      <View>
        <View
          style={[
            styles.timelineCircle,
            { borderColor: goldTint.main },
            shadowStyle({ color: goldTint.main, opacity: 0.45, radius: 10 }),
          ]}
        >
          <TimelineGlyph color={goldTint.main} icon={moment.icon} />
        </View>
        {moment.photoUris.length > 0 ? (
          <View style={[styles.photoBubble, { borderColor: goldTint.main }]}>
            <PhotoGlyph color={goldTint.main} />
          </View>
        ) : null}
      </View>
      <AppText
        align="center"
        numberOfLines={2}
        style={styles.timelineName}
        variant="pill"
      >
        {moment.label}
      </AppText>
      <AppText
        align="center"
        color={colors.textSecondary}
        style={styles.timelineDate}
        variant="caption"
      >
        {moment.date}
      </AppText>
    </Pressable>
  );
}

export default function MemoriesScreen() {
  const { width } = useWindowDimensions();
  const compact = width < layout.compactBreakpoint;

  const [goalKey, setGoalKey] = useState("");
  const { content: progressContent, dreamId, refresh } =
    useProgressContent(goalKey);
  const [goalPickerOpen, setGoalPickerOpen] = useState(false);
  const [timelineWidth, setTimelineWidth] = useState(0);
  const [rowTops, setRowTops] = useState<Record<number, number>>({});

  const [formOpen, setFormOpen] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formDate, setFormDate] = useState(todayKey);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [formPhotos, setFormPhotos] = useState<string[]>([]);
  const [originalPhotos, setOriginalPhotos] = useState<string[]>([]);
  const [photoSourceOpen, setPhotoSourceOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [detailKey, setDetailKey] = useState<string | null>(null);
  const [detailMenuOpen, setDetailMenuOpen] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  /** Thumbnail promoted to the hero spot; null = the moment's first photo. */
  const [detailPhoto, setDetailPhoto] = useState<string | null>(null);

  const detailMoment =
    progressContent.moments.find((moment) => moment.key === detailKey) ?? null;
  // With photos or a description the title leads the header (design mock);
  // a bare title instead drops below the action buttons in a compact card.
  const detailHasBody =
    detailMoment !== null &&
    (detailMoment.photoUris.length > 0 || Boolean(detailMoment.description));
  // Falls back to the first photo whenever the promoted one is stale (other
  // moment opened, or the photo was removed in an edit).
  const detailHeroPhoto =
    detailPhoto !== null && detailMoment?.photoUris.includes(detailPhoto)
      ? detailPhoto
      : detailMoment?.photoUris[0];

  const openAddForm = (prefillName = "") => {
    setEditingKey(null);
    setFormName(prefillName);
    setFormDescription("");
    setFormDate(todayKey());
    setFormPhotos([]);
    setOriginalPhotos([]);
    setFormOpen(true);
  };

  // Deep link from the milestone-complete celebration: open the add form for
  // the right dream, prefilled with the milestone's name. `addMemory` carries
  // a unique value per navigation so each arrival opens the form once.
  const {
    addMemory: addMemoryParam,
    goalKey: goalKeyParam,
    memoryName: memoryNameParam,
  } = useLocalSearchParams<{
    addMemory?: string;
    goalKey?: string;
    memoryName?: string;
  }>();
  const [consumedAddParam, setConsumedAddParam] = useState<string | null>(
    null,
  );
  if (addMemoryParam && addMemoryParam !== consumedAddParam) {
    setConsumedAddParam(addMemoryParam);
    if (goalKeyParam) setGoalKey(goalKeyParam);
    openAddForm(memoryNameParam ?? "");
  }

  const openEditForm = (moment: TimelineMoment) => {
    setEditingKey(moment.key);
    setFormName(moment.label);
    setFormDescription(moment.description ?? "");
    setFormDate(moment.occurredOn);
    setFormPhotos([...moment.photoUris]);
    setOriginalPhotos([...moment.photoUris]);
    setDetailKey(null);
    setDetailMenuOpen(false);
    setConfirmingDelete(false);
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setPhotoSourceOpen(false);
    setDatePickerOpen(false);
  };

  const closeDetail = () => {
    setDetailKey(null);
    setDetailMenuOpen(false);
    setConfirmingDelete(false);
    setDetailPhoto(null);
  };

  const pickPhotos = async (source: "camera" | "library") => {
    setPhotoSourceOpen(false);
    const remaining = MAX_MEMORY_PHOTOS - formPhotos.length;
    if (remaining <= 0) return;
    try {
      if (Platform.OS !== "web") {
        const permission =
          source === "camera"
            ? await ImagePicker.requestCameraPermissionsAsync()
            : await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) return;
      }
      const result =
        source === "camera"
          ? await ImagePicker.launchCameraAsync({
            mediaTypes: ["images"],
            quality: 0.7,
          })
          : await ImagePicker.launchImageLibraryAsync({
            allowsMultipleSelection: remaining > 1,
            mediaTypes: ["images"],
            quality: 0.7,
            selectionLimit: remaining,
          });
      if (!result.canceled && result.assets) {
        const picked = result.assets.map((asset) => asset.uri);
        setFormPhotos((prev) =>
          [...prev, ...picked].slice(0, MAX_MEMORY_PHOTOS),
        );
      }
    } catch (cause) {
      console.error("Failed to pick photos", cause);
    }
  };

  const handleAddPhotos = () => {
    // The web picker has no camera and must launch inside the tap gesture.
    if (Platform.OS === "web") {
      pickPhotos("library");
    } else {
      setPhotoSourceOpen(true);
    }
  };

  const handleSaveMemory = async () => {
    const name = formName.trim();
    if (!name || dreamId === null || saving) return;
    setSaving(true);
    try {
      // Freshly picked photos still live in the picker cache — copy them to
      // permanent storage; photos kept from the original set stay as they are.
      const persisted: string[] = [];
      for (const uri of formPhotos) {
        persisted.push(
          originalPhotos.includes(uri) ? uri : await persistMemoryPhoto(uri),
        );
      }

      if (editingKey !== null) {
        await updateTimelineMoment(Number(editingKey), {
          description: formDescription,
          label: name,
          occurredOn: formDate,
          photoUris: persisted,
        });
        await deleteMemoryPhotos(
          originalPhotos.filter((uri) => !formPhotos.includes(uri)),
        );
      } else {
        await addTimelineMoment({
          description: formDescription,
          dreamId,
          label: name,
          occurredOn: formDate,
          photoUris: persisted,
        });
      }
      await refresh();
      closeForm();
    } catch (cause) {
      console.error("Failed to save the memory", cause);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMemory = async () => {
    if (!detailMoment) return;
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      return;
    }
    try {
      await deleteTimelineMoment(Number(detailMoment.key));
      await deleteMemoryPhotos(detailMoment.photoUris);
      await refresh();
    } catch (cause) {
      console.error("Failed to delete the memory", cause);
    }
    closeDetail();
  };

  const selectedGoal =
    progressContent.goals.find((goal) => goal.key === goalKey) ??
    progressContent.goals[0];

  // Lay the timeline out as a snake: moments wrap into rows that alternate
  // direction (left→right, then right→left), joined by a dotted curve on the
  // edge where the direction flips, so chronology flows continuously.
  // Nothing renders until the track width is known — otherwise the full row
  // stretches the layout on web and the measurement reads the inflated width.
  const { moments } = progressContent;
  const itemsPerRow =
    timelineWidth > 0
      ? Math.max(
          1,
          Math.floor(
            (timelineWidth + TIMELINE_CONNECTOR_WIDTH) /
              (TIMELINE_ITEM_WIDTH + TIMELINE_CONNECTOR_WIDTH),
          ),
        )
      : 0;
  const momentRows: TimelineMoment[][] = [];
  if (itemsPerRow > 0) {
    for (let start = 0; start < moments.length; start += itemsPerRow) {
      momentRows.push(moments.slice(start, start + itemsPerRow));
    }
  }
  const fullRowWidth =
    itemsPerRow * TIMELINE_ITEM_WIDTH +
    (itemsPerRow - 1) * TIMELINE_CONNECTOR_WIDTH;

  return (
    <ScreenScaffold contentStyle={styles.content} tabClearance topInset>
      <View style={[styles.header, compact && styles.headerCompact]}>
        {/* Spacer with the add-button's footprint keeps the title centred. */}
        <View
          style={compact ? styles.headerSpacerCompact : styles.headerSpacer}
        />
        <View style={[styles.titleBlock, compact && styles.titleBlockCompact]}>
          <AppText
            align="center"
            color={colors.primary}
            numberOfLines={1}
            style={[styles.title, compact && styles.titleCompact]}
            variant="screenTitle"
          >
            Memories
          </AppText>
        </View>
        <IconButton
          accessibilityLabel="Add a memory"
          icon={<PlusIcon size={20} />}
          onPress={() => openAddForm()}
          size={compact ? "sm" : "md"}
        />
      </View>

      <Card padded={false} style={styles.goalPicker} variant="glass">
        <ListItem
          accessibilityLabel="Choose goal"
          last
          leading={<SparkleGlyph size={18} />}
          onPress={() => setGoalPickerOpen((open) => !open)}
          style={styles.goalPickerRow}
          title={selectedGoal.label}
          trailing={<ChevronIcon color={colors.textSecondary} size={18} strokeWidth={1.8} />}
        />
        {goalPickerOpen
          ? progressContent.goals
              .filter((goal) => goal.key !== selectedGoal.key)
              .map((goal) => (
                <ListItem
                  key={goal.key}
                  last
                  onPress={() => {
                    setGoalKey(goal.key);
                    setGoalPickerOpen(false);
                  }}
                  style={styles.goalOption}
                  title={goal.label}
                  titleColor={colors.textSecondary}
                />
              ))
          : null}
      </Card>

      <Card padded={false} style={styles.forecastCard} variant="glass">
        <Image
          contentFit="cover"
          source={MEMORIES_BACK}
          style={styles.heroImage}
        />
        <View style={styles.countRow}>
          <Badge
            color={colors.primary}
            label={`${moments.length} ${moments.length === 1 ? "memory" : "memories"}`}
            style={styles.countPill}
            textStyle={styles.serifPillLabel}
          />
        </View>

        <View
          onLayout={(event) =>
            setTimelineWidth(event.nativeEvent.layout.width - spacing.lg * 2)
          }
          style={styles.timelineTrack}
        >
          <View style={styles.timelineRows}>
            {momentRows.map((rowMoments, rowIndex) => {
              const reversed = rowIndex % 2 === 1;
              const displayMoments = reversed
                ? [...rowMoments].reverse()
                : rowMoments;
              return (
                <View
                  key={rowMoments[0].key}
                  onLayout={(event) => {
                    const { y } = event.nativeEvent.layout;
                    setRowTops((prev) =>
                      prev[rowIndex] === y ? prev : { ...prev, [rowIndex]: y },
                    );
                  }}
                  style={[
                    styles.timelineRow,
                    { width: fullRowWidth },
                    reversed && styles.timelineRowReversed,
                  ]}
                >
                  {displayMoments.map((moment, index) => (
                    <View key={moment.key} style={styles.timelineItemGroup}>
                      {index > 0 ? (
                        <View style={styles.timelineConnector} />
                      ) : null}
                      <TimelineMomentItem
                        moment={moment}
                        onPress={(pressed) => setDetailKey(pressed.key)}
                      />
                    </View>
                  ))}
                </View>
              );
            })}
            {momentRows.slice(0, -1).map((rowMoments, rowIndex) => {
              const top = rowTops[rowIndex];
              const nextTop = rowTops[rowIndex + 1];
              if (top === undefined || nextTop === undefined) return null;
              const height = nextTop - top;
              if (height <= 0) return null;
              const radius = Math.min(height / 2, TIMELINE_TURN_WIDTH - 2);
              const turnsRight = rowIndex % 2 === 0;
              return (
                <View
                  key={`turn-${rowMoments[0].key}`}
                  pointerEvents="none"
                  style={[
                    styles.timelineTurn,
                    {
                      height,
                      top: top + TIMELINE_CIRCLE_CENTER_Y,
                      width: TIMELINE_TURN_WIDTH,
                    },
                    turnsRight
                      ? {
                          borderBottomRightRadius: radius,
                          borderRightWidth: 2,
                          borderTopRightRadius: radius,
                          left: fullRowWidth - TIMELINE_TURN_LEAD,
                        }
                      : {
                          borderBottomLeftRadius: radius,
                          borderLeftWidth: 2,
                          borderTopLeftRadius: radius,
                          left: TIMELINE_TURN_LEAD - TIMELINE_TURN_WIDTH,
                        },
                  ]}
                />
              );
            })}
          </View>
          {moments.length === 0 && timelineWidth > 0 ? (
            <AppText
              align="center"
              color={colors.textSecondary}
              style={styles.timelineEmpty}
              variant="caption"
            >
              Capture your first meaningful moment with the button below.
            </AppText>
          ) : null}
        </View>

        <View style={styles.addFooter}>
          <View style={styles.addFooterCopy}>
            <AppText color={colors.textPrimary} variant="controlLabel">
              Add memories from your journey
            </AppText>
            <AppText
              color={colors.textSecondary}
              style={styles.addFooterSubtitle}
              variant="bodySmall"
            >
              Save moments that show how this goal is changing your real life.
            </AppText>
          </View>
          <AppButton
            icon={<PlusIcon size={16} />}
            iconPosition="before"
            label="Add memory"
            onPress={() => openAddForm()}
            variant="secondary"
          />
        </View>
      </Card>

      <AppModal onClose={closeForm} visible={formOpen}>
        <AppText align="center" variant="titleSm">
          {editingKey !== null ? "Edit memory" : "Add a memory"}
        </AppText>
        <AppInput
          autoFocus={editingKey === null}
          containerStyle={styles.formField}
          label="Name"
          onChangeText={setFormName}
          placeholder="Give this moment a name"
          value={formName}
        />
        <AppInput
          containerStyle={styles.formField}
          inputStyle={styles.descriptionInput}
          label="Description"
          multiline
          onChangeText={setFormDescription}
          placeholder="What changed in your life?"
          value={formDescription}
        />
        <View style={styles.formField}>
          <AppText color={colors.primary} style={styles.dateLabel} variant="label">
            Date
          </AppText>
          <Pressable
            accessibilityLabel="Choose the memory date"
            accessibilityRole="button"
            onPress={() => setDatePickerOpen(true)}
            style={styles.dateField}
          >
            <CalendarGlyph />
            <AppText color={colors.textPrimary} variant="body">
              {formatDateKey(formDate)}
            </AppText>
          </Pressable>
        </View>
        <View style={styles.photosHeader}>
          <AppText color={colors.primary} variant="label">
            Photos
          </AppText>
          <AppText color={colors.textSecondary} variant="label">
            {formPhotos.length} / {MAX_MEMORY_PHOTOS}
          </AppText>
        </View>
        <View style={styles.photoRow}>
          {Array.from({ length: MAX_MEMORY_PHOTOS }, (_, slot) => {
            const uri = formPhotos[slot];
            if (uri) {
              return (
                <View key={uri} style={styles.photoTile}>
                  <Image
                    contentFit="cover"
                    source={{ uri }}
                    style={styles.photoThumb}
                  />
                  <IconButton
                    accessibilityLabel="Remove photo"
                    icon={<CloseIcon size={12} />}
                    onPress={() =>
                      setFormPhotos((prev) =>
                        prev.filter((item) => item !== uri),
                      )
                    }
                    size="sm"
                    style={styles.photoRemove}
                  />
                </View>
              );
            }
            if (slot === formPhotos.length) {
              return (
                <Pressable
                  accessibilityLabel="Add photos"
                  accessibilityRole="button"
                  key="add"
                  onPress={handleAddPhotos}
                  style={styles.photoAddTile}
                >
                  <PlusIcon size={18} />
                  <AppText color={colors.primary} variant="caption">
                    Add
                  </AppText>
                </Pressable>
              );
            }
            return <View key={`empty-${slot}`} style={styles.photoEmptyTile} />;
          })}
        </View>
        <View style={styles.momentActions}>
          <AppButton
            label="Cancel"
            onPress={closeForm}
            style={styles.momentButton}
            variant="secondary"
          />
          <AppButton
            disabled={!formName.trim() || dreamId === null || saving}
            label={saving ? "Saving…" : "Save"}
            onPress={handleSaveMemory}
            style={styles.momentButton}
          />
        </View>
      </AppModal>

      {datePickerOpen ? (
        <DatePickerModal
          initialDate={new Date(`${formDate}T12:00:00`)}
          onClose={() => setDatePickerOpen(false)}
          onSelect={(date) => {
            setFormDate(toDateKey(date));
            setDatePickerOpen(false);
          }}
          today={new Date()}
          visible
        />
      ) : null}

      <AppModal
        onClose={() => setPhotoSourceOpen(false)}
        visible={photoSourceOpen}
      >
        <AppText align="center" variant="titleSm">
          Add photos
        </AppText>
        <View style={styles.sourceActions}>
          <AppButton
            label="Take a photo"
            onPress={() => pickPhotos("camera")}
            variant="secondary"
          />
          <AppButton
            label="Choose from gallery"
            onPress={() => pickPhotos("library")}
          />
        </View>
      </AppModal>

      <AppModal
        maxWidth={560}
        onClose={closeDetail}
        panelStyle={styles.detailPanel}
        visible={detailMoment !== null}
      >
        {detailMoment ? (
          <>
            <View style={styles.detailHeader}>
              {detailHasBody ? (
                <View style={styles.detailHeading}>
                  <AppText variant="titleSm">{detailMoment.label}</AppText>
                  <AppText
                    color={colors.textSecondary}
                    style={styles.detailDate}
                    variant="caption"
                  >
                    {detailMoment.date}
                  </AppText>
                </View>
              ) : (
                <View style={[styles.detailHeading, styles.detailEyebrowSlot]}>
                  <AppText variant="eyebrow">Memory</AppText>
                </View>
              )}
              <IconButton
                accessibilityLabel="Memory actions"
                icon={<DotsGlyph color={colors.primary} />}
                onPress={() => setDetailMenuOpen((open) => !open)}
                size="sm"
              />
              <IconButton
                accessibilityLabel="Close memory"
                icon={<CloseIcon size={16} />}
                onPress={closeDetail}
                size="sm"
              />
            </View>
            {!detailHasBody ? (
              <View style={styles.detailTitleBlock}>
                <AppText variant="titleSm">{detailMoment.label}</AppText>
                <AppText
                  color={colors.textSecondary}
                  style={styles.detailDate}
                  variant="caption"
                >
                  {detailMoment.date}
                </AppText>
              </View>
            ) : null}
            {detailMenuOpen ? (
              <Card padded={false} style={styles.detailMenu}>
                <ListItem
                  last
                  onPress={() => openEditForm(detailMoment)}
                  style={styles.detailMenuRow}
                  title="Edit"
                />
                <ListItem
                  last
                  onPress={handleDeleteMemory}
                  style={[styles.detailMenuRow, styles.detailMenuRowDivider]}
                  title={confirmingDelete ? "Confirm delete" : "Delete"}
                  titleColor={colors.danger}
                />
              </Card>
            ) : null}
            {detailMoment.photoUris.length > 0 ? (
              <Image
                contentFit="cover"
                source={{ uri: detailHeroPhoto }}
                style={styles.detailPhotoHero}
              />
            ) : null}
            {detailMoment.photoUris.length > 1 ? (
              <ScrollView
                contentContainerStyle={styles.detailPhotoRow}
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.detailPhotos}
              >
                {detailMoment.photoUris
                  .filter((uri) => uri !== detailHeroPhoto)
                  .map((uri) => (
                    <Pressable
                      accessibilityLabel="Show this photo"
                      accessibilityRole="button"
                      key={uri}
                      onPress={() => setDetailPhoto(uri)}
                    >
                      <Image
                        contentFit="cover"
                        source={{ uri }}
                        style={styles.detailPhoto}
                      />
                    </Pressable>
                  ))}
              </ScrollView>
            ) : null}
            {detailMoment.description ? (
              <View style={styles.detailBody}>
                <AppText color={colors.textSecondary} variant="eyebrow">
                  Memory
                </AppText>
                <AppText
                  color={colors.textPrimary}
                  style={styles.detailDescription}
                  variant="bodySerif"
                >
                  {detailMoment.description}
                </AppText>
              </View>
            ) : null}
          </>
        ) : null}
      </AppModal>
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  addFooter: {
    alignItems: "center",
    borderTopColor: colors.borderSoft,
    borderTopWidth: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    justifyContent: "space-between",
    padding: spacing.lg,
  },
  addFooterCopy: {
    flexShrink: 1,
    minWidth: 220,
  },
  addFooterSubtitle: {
    marginTop: spacing.xs,
  },
  content: {
    gap: spacing.md,
  },
  /** Mirrors AppInput's field shell for the tap-to-pick date control. */
  dateField: {
    alignItems: "center",
    backgroundColor: colors.surfaceGlass,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 58,
    paddingHorizontal: spacing.md,
  },
  dateLabel: {
    marginBottom: spacing.sm,
  },
  /** Overlaps the hero image's dark lower slope, as in the design. */
  countRow: {
    alignItems: "flex-start",
    marginTop: -(spacing.xl + spacing.lg + spacing.md),
    paddingHorizontal: spacing.lg,
  },
  countPill: {
    borderColor: colors.border,
  },
  descriptionInput: {
    minHeight: 140,
  },
  detailBody: {
    marginTop: spacing.xl,
  },
  detailDate: {
    marginTop: spacing.xs,
  },
  detailDescription: {
    fontSize: fontSizes.xxl,
    lineHeight: lineHeights.xxxl,
    marginTop: spacing.xs,
  },
  detailHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.sm,
  },
  detailHeading: {
    flex: 1,
  },
  detailMenu: {
    minWidth: 176,
    overflow: "hidden",
    position: "absolute",
    right: spacing.xl,
    top: 72,
    zIndex: 20,
  },
  detailMenuRow: {
    paddingHorizontal: spacing.md,
  },
  detailMenuRowDivider: {
    borderTopColor: colors.borderSoft,
    borderTopWidth: 1,
  },
  detailPanel: {
    padding: spacing.xl,
  },
  detailPhoto: {
    borderRadius: radius.md,
    height: 96,
    width: 96,
  },
  /** Keeps the eyebrow on the action buttons' centreline in the compact card. */
  detailEyebrowSlot: {
    justifyContent: "center",
  },
  detailTitleBlock: {
    marginTop: spacing.sm,
  },
  detailPhotoHero: {
    aspectRatio: 1,
    borderRadius: radius.card,
    marginTop: spacing.lg,
    width: "100%",
  },
  detailPhotoRow: {
    gap: spacing.sm,
  },
  detailPhotos: {
    flexGrow: 0,
    marginTop: spacing.md,
  },
  /** Opaque, image-matched ground: the artwork's dark edges dissolve into
   * it, so the content below the hero image sits on a seamless background. */
  forecastCard: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    overflow: "hidden",
  },
  /** Shallow banner crop of the panoramic art (source is 3:1), keeping the
   * hero short so the whole card fits on one page; the centred castle stays
   * in the middle of the crop. */
  heroImage: {
    aspectRatio: 2.6,
    width: "100%",
  },
  formField: {
    marginTop: spacing.lg,
  },
  goalOption: {
    borderTopColor: colors.borderSoft,
    borderTopWidth: 1,
    paddingHorizontal: spacing.md,
  },
  goalPicker: {
    overflow: "hidden",
  },
  goalPickerRow: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 92,
  },
  headerCompact: {
    minHeight: 72,
  },
  headerSpacer: {
    width: 56,
  },
  headerSpacerCompact: {
    width: 48,
  },
  lockBubble: {
    alignItems: "center",
    backgroundColor: colors.surfaceDeep,
    borderRadius: radius.round,
    borderWidth: 1.4,
    height: 28,
    justifyContent: "center",
    width: 28,
  },
  momentActions: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  momentButton: {
    flex: 1,
  },
  photoAddTile: {
    alignItems: "center",
    aspectRatio: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    borderWidth: 1.4,
    flex: 1,
    gap: spacing.xs,
    justifyContent: "center",
  },
  /** Small photo indicator pinned to a timeline circle's bottom-right. */
  photoBubble: {
    alignItems: "center",
    backgroundColor: colors.surfaceDeep,
    borderRadius: radius.round,
    borderWidth: 1.4,
    bottom: -2,
    height: 26,
    justifyContent: "center",
    position: "absolute",
    right: -4,
    width: 26,
  },
  photoEmptyTile: {
    aspectRatio: 1,
    borderColor: colors.borderFaint,
    borderRadius: radius.md,
    borderWidth: 1.2,
    flex: 1,
  },
  photoHint: {
    marginTop: spacing.sm,
  },
  photoRemove: {
    position: "absolute",
    right: -spacing.xs,
    top: -spacing.xs,
    zIndex: 1,
  },
  photoRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  photoThumb: {
    borderRadius: radius.md,
    height: "100%",
    width: "100%",
  },
  photoTile: {
    aspectRatio: 1,
    flex: 1,
  },
  photosHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
    marginTop: spacing.lg,
  },
  /** Serif pill/badge label, matching the pre-migration ETA/range pills. */
  serifPillLabel: {
    fontFamily: fonts.serif,
    fontSize: fontSizes.sm,
    fontWeight: "400",
    lineHeight: lineHeights.sm,
  },
  timelineBadgeSlot: {
    alignItems: "center",
    height: 32,
    justifyContent: "center",
    marginBottom: spacing.xs,
  },
  timelineCircle: {
    alignItems: "center",
    backgroundColor: colors.surfaceDeep,
    borderRadius: radius.round,
    borderWidth: 1.5,
    height: 64,
    justifyContent: "center",
    width: 64,
  },
  timelineConnector: {
    alignSelf: "flex-start",
    borderColor: "rgba(246, 232, 200, 0.28)",
    borderStyle: "dotted",
    borderTopWidth: 2,
    marginTop: 67,
    width: 26,
  },
  sourceActions: {
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  timelineDate: {
    marginTop: spacing.xs,
  },
  timelineEmpty: {
    paddingVertical: spacing.lg,
  },
  timelineItem: {
    alignItems: "center",
    width: 104,
  },
  timelineItemGroup: {
    flexDirection: "row",
  },
  timelineName: {
    marginTop: spacing.sm,
  },
  timelineRow: {
    flexDirection: "row",
  },
  timelineRowReversed: {
    justifyContent: "flex-end",
  },
  timelineRows: {
    rowGap: spacing.xl,
  },
  timelineTrack: {
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  timelineTurn: {
    borderBottomWidth: 2,
    borderColor: "rgba(246, 232, 200, 0.28)",
    borderStyle: "dotted",
    borderTopWidth: 2,
    position: "absolute",
  },
  title: {
    ...textGlow(colors.primaryGlow, 12),
  },
  titleBlock: {
    flex: 1,
    paddingHorizontal: 18,
  },
  titleBlockCompact: {
    paddingHorizontal: spacing.sm,
  },
  titleCompact: {
    fontSize: fontSizes.cardTitle,
    lineHeight: lineHeights.cardTitle,
  },
});
