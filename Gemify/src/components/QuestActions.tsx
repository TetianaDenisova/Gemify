import { Image } from "expo-image";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Pressable, StyleSheet, View, type TextInput } from "react-native";

import { DatePickerModal } from "@/components/DatePickerModal";
import { BlockIconArt } from "@/components/TimeBlockTabs";
import { getTimeBlocks, type TimeBlockRecord } from "@/db";
import { useLayoutSize } from "@/hooks/useLayoutSize";
import type { BlockIcon } from "@/dto/timeBlocks";
import {
  AppButton,
  AppInput,
  AppModal,
  AppText,
  ArrowRightIcon,
  CalendarIcon,
  CheckIcon,
  ClockIcon,
  CloseIcon,
  DotsIcon,
  HintRow,
  MilestoneIcon,
  PencilIcon,
  SparkIcon,
  SunHorizonIcon,
  TrashIcon,
} from "@/shared/components";
import { colors } from "@/theme/colors";
import {
  fontSizes,
  iconSizes,
  lineHeights,
  pressed,
  radius,
  shadowStyle,
  spacing,
} from "@/theme/theme";
import { addDays, toDateKey, todayKey } from "@/utils/dates";

const ACCEPT_STAR_SOURCE = require("../../assets/images/accept-star.png");

/**
 * A time-of-day option in the accept modal — one shared My Day time block.
 * `time` is the block's start HH:MM stored on the quest (the flexible block
 * has none and leaves the time open).
 */
export type TimeSlot = {
  icon: BlockIcon;
  key: string;
  label: string;
  time: string | null;
};

/**
 * The scheduler's slots come straight from the shared `time_blocks` table,
 * so the quest scheduler, Habits, and My Day all speak the same names in the
 * same order.
 */
export function toTimeSlots(blocks: readonly TimeBlockRecord[]): TimeSlot[] {
  return blocks.map((block) => ({
    icon: block.iconKey as BlockIcon,
    key: block.key,
    label: block.label,
    time: block.startTime,
  }));
}

/**
 * Label of the time block a stored quest time falls under. Times typed via
 * "Exact time" show as-is; no time at all reads as the flexible block.
 */
export function scheduledTimeLabel(
  blocks: readonly TimeBlockRecord[],
  time: string | null,
): string {
  const match = blocks.find((block) => block.startTime === time);
  return match?.label ?? time ?? "Anytime";
}

export const WEEKDAY_LABELS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

/** Pre-selects the block whose start time most recently passed (else flexible). */
function suggestSlotKey(
  blocks: readonly TimeBlockRecord[],
  now: Date,
): string | null {
  const clock = `${String(now.getHours()).padStart(2, "0")}:${String(
    now.getMinutes(),
  ).padStart(2, "0")}`;
  let key: string | null = null;
  let latest = "";
  for (const block of blocks) {
    if (
      block.startTime !== null &&
      block.startTime <= clock &&
      block.startTime >= latest
    ) {
      latest = block.startTime;
      key = block.key;
    }
  }
  return (
    key ??
    blocks.find((block) => block.startTime === null)?.key ??
    blocks[0]?.key ??
    null
  );
}

export function SheetActionRow({
  danger = false,
  icon,
  label,
  onPress,
}: {
  danger?: boolean;
  icon: ReactNode;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed: isPressed }) => [
        styles.sheetActionRow,
        isPressed && pressed,
      ]}
    >
      {icon}
      <AppText color={danger ? colors.danger : colors.textPrimary} variant="button">
        {label}
      </AppText>
    </Pressable>
  );
}

/**
 * Bottom-sheet shell shared by the quest and habit action menus: violet
 * handle + border, the item title, then the caller's action rows.
 */
export function ActionSheet({
  children,
  onClose,
  title,
  visible,
}: {
  children: ReactNode;
  onClose: () => void;
  title: string | undefined;
  visible: boolean;
}) {
  return (
    <AppModal
      onClose={onClose}
      panelStyle={styles.actionSheetPanel}
      showHandle={false}
      variant="sheet"
      visible={visible}
    >
      <View style={styles.sheetHandle} />
      <AppText numberOfLines={3} style={styles.sheetTitle} variant="titleSm">
        {title}
      </AppText>
      {children}
    </AppModal>
  );
}

/**
 * Bottom sheet with the actions for one quest: Complete now (or "Do it
 * today" for an overdue quest), quick moves, Schedule (pick a date and time
 * via the accept modal), Edit, Delete.
 */
export function QuestActionSheet({
  onClose,
  onCompleteNow,
  onDelete,
  onDoToday,
  onEdit,
  onMoveToMilestone,
  onMoveToTomorrow,
  onSchedule,
  onUnschedule,
  quest,
  scheduleLabel = "Schedule",
}: {
  onClose: () => void;
  onCompleteNow: () => void;
  onDelete: () => void;
  /** With quest.overdue, replaces "Complete now" with "Do it today". */
  onDoToday?: () => void;
  onEdit: () => void;
  /** When given, adds "Move to another milestone" (opens a picker). */
  onMoveToMilestone?: () => void;
  /** When given, adds a "Move to tomorrow" quick action. */
  onMoveToTomorrow?: () => void;
  onSchedule: () => void;
  /** When given, adds "Remove from schedule" (shown for open quests). */
  onUnschedule?: () => void;
  quest: { isDone: boolean; overdue?: boolean; title: string } | null;
  /** Label of the schedule row, e.g. "Choose another date" for planned quests. */
  scheduleLabel?: string;
}) {
  return (
    <ActionSheet
      onClose={onClose}
      title={quest?.title}
      visible={quest !== null}
    >
      {quest?.isDone ? null : (
        <>
          {quest?.overdue && onDoToday ? (
            <SheetActionRow
              icon={<SunHorizonIcon size={iconSizes.lg} />}
              label="Do it today"
              onPress={onDoToday}
            />
          ) : (
            <SheetActionRow
              icon={<CheckIcon color={colors.primary} size={iconSizes.lg} />}
              label="Complete now"
              onPress={onCompleteNow}
            />
          )}
          {onMoveToTomorrow ? (
            <SheetActionRow
              icon={<ArrowRightIcon color={colors.primary} size={iconSizes.lg} />}
              label="Move to tomorrow"
              onPress={onMoveToTomorrow}
            />
          ) : null}
          <SheetActionRow
            icon={<CalendarIcon size={iconSizes.lg} />}
            label={scheduleLabel}
            onPress={onSchedule}
          />
          {onUnschedule ? (
            <SheetActionRow
              icon={<CloseIcon color={colors.textSecondary} size={iconSizes.lg} />}
              label="Remove from schedule"
              onPress={onUnschedule}
            />
          ) : null}
          {onMoveToMilestone ? (
            <SheetActionRow
              icon={<MilestoneIcon color={colors.primary} size={iconSizes.lg} />}
              label="Move to another milestone"
              onPress={onMoveToMilestone}
            />
          ) : null}
        </>
      )}
      <SheetActionRow
        icon={
          <PencilIcon size={iconSizes.lg} strokeWidth={1.7} variant="detailed" />
        }
        label="Edit"
        onPress={onEdit}
      />
      <SheetActionRow
        danger
        icon={<TrashIcon size={iconSizes.lg} />}
        label="Delete"
        onPress={onDelete}
      />
    </ActionSheet>
  );
}

/** Center modal with a single text field — add or rename a quest. */
export function TextPromptModal({
  hint,
  initialValue = "",
  onClose,
  onSubmit,
  placeholder,
  submitLabel = "Add",
  title,
  visible,
}: {
  hint?: string;
  initialValue?: string;
  onClose: () => void;
  onSubmit: (value: string) => void;
  placeholder: string;
  submitLabel?: string;
  title: string;
  visible: boolean;
}) {
  const [value, setValue] = useState("");
  const [wasVisible, setWasVisible] = useState(false);

  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) setValue(initialValue);
  }

  return (
    <AppModal onClose={onClose} visible={visible}>
      <AppText align="center" variant="titleSm">
        {title}
      </AppText>
      <AppInput
        autoFocus
        containerStyle={styles.promptInput}
        onChangeText={setValue}
        placeholder={placeholder}
        value={value}
      />
      {hint ? <HintRow style={styles.promptHint} text={hint} /> : null}
      <View style={styles.promptActions}>
        <AppButton
          label="Cancel"
          onPress={onClose}
          style={styles.promptButton}
          variant="secondary"
        />
        <AppButton
          disabled={!value.trim()}
          label={submitLabel}
          onPress={() => onSubmit(value.trim())}
          style={styles.promptButton}
        />
      </View>
    </AppModal>
  );
}

/**
 * Day the reschedule modal pre-selects: a past (or unset) date suggests
 * today, today suggests tomorrow, and a future date suggests one day later.
 */
export function suggestRescheduleDate(scheduledDate: string | null): Date {
  const key = todayKey();
  if (!scheduledDate || scheduledDate < key) return new Date();
  if (scheduledDate === key) return addDays(new Date(), 1);
  return addDays(new Date(`${scheduledDate}T12:00:00`), 1);
}

/**
 * "Accept quest" modal: pick a day (next 7, or any date via the ⋯ calendar
 * chip) and a time of day — the shared My Day time blocks plus an exact time
 * typed into inline HH:MM fields — with a pre-selected suggestion for the
 * current moment. Rescheduling reuses it with its own title, CTA, and
 * initial day.
 */
export function AcceptQuestModal({
  ctaLabel = "ACCEPT QUEST",
  initialDate,
  initialSlot,
  onAccept,
  onClose,
  title = "Accept quest",
}: {
  ctaLabel?: string;
  /** Day pre-selected on open (defaults to today). */
  initialDate?: Date;
  /** Time-block key pre-selected on open (defaults to the current moment). */
  initialSlot?: string;
  onAccept: (date: string, time: string | null) => void;
  onClose: () => void;
  title?: string;
}) {
  const { phone } = useLayoutSize();
  const [today] = useState(() => new Date());
  const [blocks, setBlocks] = useState<TimeBlockRecord[]>([]);
  // Day chips cover today + 6; a farther initial date lands on the ⋯ chip.
  const initialOffset: number | "custom" = (() => {
    if (!initialDate) return 0;
    const dayStart = (date: Date) =>
      new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
    const diff = Math.round(
      (dayStart(initialDate) - dayStart(today)) / 86_400_000,
    );
    if (diff <= 0) return 0;
    return diff <= 6 ? diff : "custom";
  })();
  const [dayOffset, setDayOffset] = useState<number | "custom">(initialOffset);
  const [customDate, setCustomDate] = useState<Date | null>(
    initialOffset === "custom" ? (initialDate ?? null) : null,
  );
  const [calendarOpen, setCalendarOpen] = useState(false);
  // null until the time blocks load (unless the caller pre-selected one).
  const [slotKey, setSlotKey] = useState<string | "customHour" | null>(
    initialSlot ?? null,
  );
  const [hourText, setHourText] = useState("");
  const [minuteText, setMinuteText] = useState("");
  const hourRef = useRef<TextInput>(null);
  const minuteRef = useRef<TextInput>(null);

  // The slots are the shared My Day time blocks; suggest the block matching
  // the current moment once they arrive (unless the caller picked one).
  useEffect(() => {
    let cancelled = false;
    getTimeBlocks()
      .then((list) => {
        if (cancelled) return;
        setBlocks(list);
        setSlotKey((current) => current ?? suggestSlotKey(list, new Date()));
      })
      .catch((cause: unknown) => {
        console.error("Failed to load the time blocks", cause);
      });
    return () => {
      cancelled = true;
    };
  }, []);
  const slots = toTimeSlots(blocks);

  const days = Array.from({ length: 7 }, (_, offset) => {
    const date = new Date(today);
    date.setDate(today.getDate() + offset);
    return date;
  });
  const customSelected = dayOffset === "custom";
  const selectedDate =
    customSelected && customDate ? customDate : days[customSelected ? 0 : dayOffset];
  const customHourSelected = slotKey === "customHour";

  // Digits only, clamped to a valid clock value while typing.
  const handleHourChange = (text: string) => {
    let digits = text.replace(/\D/g, "").slice(0, 2);
    if (digits.length > 0 && Number(digits) > 23) digits = "23";
    setHourText(digits);
    // Both digits typed — jump straight to the minutes field.
    if (digits.length === 2) minuteRef.current?.focus();
  };
  const handleMinuteChange = (text: string) => {
    let digits = text.replace(/\D/g, "").slice(0, 2);
    if (digits.length > 0 && Number(digits) > 59) digits = "59";
    setMinuteText(digits);
  };

  const customTimeValid = hourText.length > 0 && minuteText.length > 0;
  const customTime = customTimeValid
    ? `${hourText.padStart(2, "0")}:${minuteText.padStart(2, "0")}`
    : null;
  const acceptTime = customHourSelected
    ? customTime
    : (slots.find((entry) => entry.key === slotKey)?.time ?? null);

  return (
    <AppModal maxWidth={640} onClose={onClose} visible>
      <View style={styles.acceptHandle} />
      <Pressable
        accessibilityLabel="Close"
        accessibilityRole="button"
        hitSlop={8}
        onPress={onClose}
        style={({ pressed: isPressed }) => [
          styles.acceptClose,
          isPressed && pressed,
        ]}
      >
        <CloseIcon color={colors.textSecondary} size={iconSizes.sm} />
      </Pressable>

      <Image
        contentFit="contain"
        source={ACCEPT_STAR_SOURCE}
        style={[styles.acceptStar, phone && styles.acceptStarPhone]}
      />
      <AppText align="center" variant="titleSm">
        {title}
      </AppText>
      {/* The two section labels below say both halves of this. */}
      {phone ? null : (
        <AppText
          align="center"
          color={colors.textSecondary}
          style={styles.acceptSubtitle}
          variant="bodySmall"
        >
          Choose when you&rsquo;ll do it.{"\n"}We&rsquo;ve picked a time based on
          your current moment.
        </AppText>
      )}

      <View style={styles.acceptSectionLabel}>
        <CalendarIcon size={iconSizes.lg} />
        <AppText variant="pill">Pick a day</AppText>
      </View>
      <View style={styles.acceptChipWrap}>
        {days.map((date, offset) => {
          const selected = offset === dayOffset;
          const accent = selected ? colors.primary : colors.textMuted;
          const label =
            offset === 0 ? "TODAY" : offset === 1 ? "TMRW" : WEEKDAY_LABELS[date.getDay()];
          return (
            <View key={offset} style={styles.acceptChipSlot}>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => setDayOffset(offset)}
                style={[
                  styles.dayChip,
                  phone && styles.chipPhone,
                  selected && styles.acceptChipSelected,
                ]}
              >
                <AppText color={accent} numberOfLines={1} variant="captionStrong">
                  {label}
                </AppText>
                <AppText
                  color={selected ? colors.textPrimary : colors.textSecondary}
                  variant="pill"
                >
                  {date.getDate()}
                </AppText>
              </Pressable>
              {selected ? (
                <View style={styles.acceptChipCheck}>
                  <CheckIcon color={colors.textOnPrimary} size={12} />
                </View>
              ) : null}
            </View>
          );
        })}
        <View style={styles.acceptChipSlot}>
          <Pressable
            accessibilityLabel="Pick a specific date from the calendar"
            accessibilityRole="button"
            accessibilityState={{ selected: customSelected }}
            onPress={() => setCalendarOpen(true)}
            style={[
              styles.dayChip,
              phone && styles.chipPhone,
              customSelected && styles.acceptChipSelected,
            ]}
          >
            {customSelected && customDate ? (
              <>
                <AppText
                  color={colors.primary}
                  numberOfLines={1}
                  variant="captionStrong"
                >
                  {WEEKDAY_LABELS[customDate.getDay()]}
                </AppText>
                <AppText color={colors.textPrimary} variant="pill">
                  {customDate.getDate()}
                </AppText>
              </>
            ) : (
              <DotsIcon
                color={colors.textMuted}
                orientation="horizontal"
                size={iconSizes.md}
              />
            )}
          </Pressable>
          {customSelected ? (
            <View style={styles.acceptChipCheck}>
              <CheckIcon color={colors.textOnPrimary} size={12} />
            </View>
          ) : null}
        </View>
      </View>

      <View style={styles.acceptSectionLabel}>
        <ClockIcon size={iconSizes.lg} />
        <AppText variant="pill">Pick a time of day</AppText>
      </View>
      <View style={styles.acceptTimeWrap}>
        {slots.map((entry) => {
          const selected = entry.key === slotKey;
          const accent = selected ? colors.primary : colors.textMuted;
          return (
            <View key={entry.key} style={styles.acceptTimeSlot}>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => setSlotKey(entry.key)}
                style={[
                  styles.timeChip,
                  phone && styles.chipPhone,
                  selected && styles.acceptChipSelected,
                ]}
              >
                <BlockIconArt color={accent} icon={entry.icon} size={22} />
                <AppText
                  color={selected ? colors.textPrimary : colors.textMuted}
                  numberOfLines={1}
                  variant="labelStrong"
                >
                  {entry.label}
                </AppText>
              </Pressable>
              {selected ? (
                <View style={styles.acceptChipCheck}>
                  <CheckIcon color={colors.textOnPrimary} size={12} />
                </View>
              ) : null}
            </View>
          );
        })}
        <View style={styles.acceptTimeSlot}>
          <Pressable
            accessibilityLabel="Set a specific time"
            accessibilityRole="button"
            accessibilityState={{ selected: customHourSelected }}
            onPress={() => setSlotKey("customHour")}
            style={[
              styles.timeChip,
              phone && styles.chipPhone,
              customHourSelected && styles.acceptChipSelected,
            ]}
          >
            <ClockIcon
              color={customHourSelected ? colors.primary : colors.textMuted}
              size={22}
            />
            <AppText
              color={customHourSelected ? colors.textPrimary : colors.textMuted}
              numberOfLines={1}
              variant="labelStrong"
            >
              {customHourSelected && customTime ? customTime : "Exact time"}
            </AppText>
          </Pressable>
          {customHourSelected ? (
            <View style={styles.acceptChipCheck}>
              <CheckIcon color={colors.textOnPrimary} size={12} />
            </View>
          ) : null}
        </View>
      </View>

      {customHourSelected ? (
        <View style={styles.timeInputRow}>
          <Pressable
            onPress={() => hourRef.current?.focus()}
            style={styles.timeInputField}
          >
            <AppInput
              autoFocus
              containerStyle={styles.timeInputContainer}
              inputStyle={styles.timeInputText}
              keyboardType="number-pad"
              maxLength={2}
              onChangeText={handleHourChange}
              placeholder="HH"
              ref={hourRef}
              value={hourText}
            />
          </Pressable>
          <AppText variant="titleSm">:</AppText>
          <Pressable
            onPress={() => minuteRef.current?.focus()}
            style={styles.timeInputField}
          >
            <AppInput
              containerStyle={styles.timeInputContainer}
              inputStyle={styles.timeInputText}
              keyboardType="number-pad"
              maxLength={2}
              onChangeText={handleMinuteChange}
              placeholder="MM"
              ref={minuteRef}
              value={minuteText}
            />
          </Pressable>
        </View>
      ) : null}

      <AppButton
        disabled={slotKey === null || (customHourSelected && !customTimeValid)}
        icon={<SparkIcon color={colors.textOnPrimary} size={iconSizes.md} />}
        iconPosition="before"
        label={ctaLabel}
        onPress={() => onAccept(toDateKey(selectedDate), acceptTime)}
        size="lg"
        style={styles.acceptCta}
      />

      {calendarOpen ? (
        <DatePickerModal
          initialDate={customDate ?? today}
          minDate={today}
          onClose={() => setCalendarOpen(false)}
          onSelect={(date) => {
            setCustomDate(date);
            setDayOffset("custom");
            setCalendarOpen(false);
          }}
          today={today}
          visible
        />
      ) : null}

    </AppModal>
  );
}

const styles = StyleSheet.create({
  acceptChipCheck: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: radius.round,
    height: 20,
    justifyContent: "center",
    left: "50%",
    marginLeft: -10,
    position: "absolute",
    top: 0,
    width: 20,
    zIndex: 1,
  },
  acceptChipSelected: {
    backgroundColor: "rgba(245, 184, 75, 0.08)",
    borderColor: colors.borderStrong,
    ...shadowStyle({
      color: colors.primary,
      elevation: 6,
      opacity: 0.3,
      radius: 12,
    }),
  },
  acceptChipSlot: {
    flexBasis: "23%",
    flexGrow: 1,
    minWidth: 0,
    paddingTop: 10,
  },
  acceptChipWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  acceptClose: {
    alignItems: "center",
    borderColor: colors.borderSoft,
    borderRadius: radius.round,
    borderWidth: 1,
    height: 40,
    justifyContent: "center",
    position: "absolute",
    right: spacing.md,
    top: spacing.md,
    width: 40,
    zIndex: 2,
  },
  acceptCta: {
    marginTop: spacing.lg,
  },
  acceptHandle: {
    alignSelf: "center",
    backgroundColor: colors.borderSoft,
    borderRadius: radius.round,
    height: 4,
    marginBottom: spacing.md,
    width: 48,
  },
  acceptSectionLabel: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  acceptStar: {
    alignSelf: "center",
    height: 76,
    marginBottom: spacing.sm,
    width: 76,
  },
  acceptStarPhone: {
    height: 56,
    width: 56,
  },
  acceptSubtitle: {
    marginTop: spacing.sm,
  },
  acceptTimeSlot: {
    flexBasis: "31%",
    flexGrow: 1,
    minWidth: 0,
    paddingTop: 10,
  },
  acceptTimeWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  actionSheetPanel: {
    borderColor: colors.accentVioletGlow,
  },
  chipPhone: {
    height: 60,
  },
  dayChip: {
    alignItems: "center",
    borderColor: colors.borderSoft,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.xs,
    height: 72,
    justifyContent: "center",
    paddingHorizontal: spacing.xs,
    width: "100%",
  },
  promptActions: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  promptButton: {
    flex: 1,
    paddingHorizontal: spacing.sm,
  },
  promptHint: {
    marginTop: spacing.lg,
  },
  promptInput: {
    marginTop: spacing.lg,
  },
  sheetActionRow: {
    alignItems: "center",
    borderTopColor: "rgba(246, 232, 200, 0.13)",
    borderTopWidth: 1,
    flexDirection: "row",
    gap: spacing.lg,
    minHeight: 60,
    paddingVertical: spacing.sm,
  },
  sheetHandle: {
    alignSelf: "center",
    backgroundColor: colors.accentVioletStrong,
    borderRadius: radius.round,
    height: 5,
    marginBottom: spacing.lg,
    opacity: 0.85,
    width: 64,
  },
  sheetTitle: {
    marginBottom: spacing.lg,
  },
  timeChip: {
    alignItems: "center",
    borderColor: colors.borderSoft,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.sm,
    height: 72,
    justifyContent: "center",
    paddingHorizontal: spacing.xs,
    width: "100%",
  },
  timeInputContainer: {
    width: "100%",
  },
  timeInputField: {
    flexShrink: 1,
    width: 104,
  },
  timeInputRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "center",
    marginTop: spacing.lg,
  },
  timeInputText: {
    fontSize: fontSizes.xxl,
    lineHeight: lineHeights.xxl,
    minWidth: 0,
    textAlign: "center",
    width: "100%",
  },
});
