import { Image } from "expo-image";
import { useRef, useState, type ReactNode } from "react";
import { Pressable, StyleSheet, View, type TextInput } from "react-native";
import Svg, { Circle, Path, Rect } from "react-native-svg";

import { DatePickerModal } from "@/components/DatePickerModal";
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
  PencilIcon,
  SparkIcon,
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

export type TimeSlotKey =
  | "morning"
  | "beforeWork"
  | "afterWork"
  | "evening"
  | "anytime";

/**
 * Time-of-day options in the accept modal. `time` is the representative HH:MM
 * stored on the quest ("Anytime" leaves the time open).
 */
export const TIME_SLOTS: {
  key: TimeSlotKey;
  label: string;
  time: string | null;
}[] = [
  { key: "morning", label: "Morning", time: "08:00" },
  { key: "beforeWork", label: "Before work", time: "07:30" },
  { key: "afterWork", label: "After work", time: "18:00" },
  { key: "evening", label: "Evening", time: "20:30" },
  { key: "anytime", label: "Anytime", time: null },
];

export const WEEKDAY_LABELS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

/** Pre-selects the time-of-day slot that best matches the current hour. */
function suggestTimeSlot(hour: number): TimeSlotKey {
  if (hour < 9) return "morning";
  if (hour >= 20) return "evening";
  return "afterWork";
}

function SunHorizonIcon({
  color = colors.primary,
  size = iconSizes.lg,
}: {
  color?: string;
  size?: number;
}) {
  return (
    <Svg height={size} viewBox="0 0 24 24" width={size}>
      <Path
        d="M8.5 16.5a3.5 3.5 0 0 1 7 0"
        fill="none"
        stroke={color}
        strokeLinecap="round"
        strokeWidth={1.7}
      />
      <Path
        d="M12 8.5v-2M6.7 11.2 5.3 9.8M17.3 11.2l1.4-1.4M4.5 16.5H6M18 16.5h1.5M4.5 19.5h15"
        fill="none"
        stroke={color}
        strokeLinecap="round"
        strokeWidth={1.7}
      />
    </Svg>
  );
}

function BriefcaseIcon({
  color = colors.primary,
  size = iconSizes.lg,
}: {
  color?: string;
  size?: number;
}) {
  return (
    <Svg height={size} viewBox="0 0 24 24" width={size}>
      <Rect
        fill="none"
        height={11}
        rx={2}
        stroke={color}
        strokeWidth={1.7}
        width={16}
        x={4}
        y={8}
      />
      <Path
        d="M9.5 8V6.5A1.5 1.5 0 0 1 11 5h2a1.5 1.5 0 0 1 1.5 1.5V8M4 12.5h16"
        fill="none"
        stroke={color}
        strokeLinecap="round"
        strokeWidth={1.7}
      />
    </Svg>
  );
}

function MoonIcon({
  color = colors.primary,
  size = iconSizes.lg,
}: {
  color?: string;
  size?: number;
}) {
  return (
    <Svg height={size} viewBox="0 0 24 24" width={size}>
      <Path
        d="M18.8 14.6A7.2 7.2 0 0 1 9.4 5.2 7.2 7.2 0 1 0 18.8 14.6Z"
        fill="none"
        stroke={color}
        strokeLinejoin="round"
        strokeWidth={1.7}
      />
      <Path
        d="m17.6 4.2.5 1.5 1.5.5-1.5.5-.5 1.5-.5-1.5-1.5-.5 1.5-.5.5-1.5Z"
        fill={color}
      />
    </Svg>
  );
}

function InfinityIcon({
  color = colors.primary,
  size = iconSizes.lg,
}: {
  color?: string;
  size?: number;
}) {
  return (
    <Svg height={size} viewBox="0 0 24 24" width={size}>
      <Circle cx={7.8} cy={12} fill="none" r={3.8} stroke={color} strokeWidth={1.7} />
      <Circle cx={16.2} cy={12} fill="none" r={3.8} stroke={color} strokeWidth={1.7} />
    </Svg>
  );
}

function SlotIcon({
  color,
  size = iconSizes.lg,
  slotKey,
}: {
  color: string;
  size?: number;
  slotKey: TimeSlotKey;
}) {
  switch (slotKey) {
    case "beforeWork":
      return <BriefcaseIcon color={color} size={size} />;
    case "evening":
      return <MoonIcon color={color} size={size} />;
    case "anytime":
      return <InfinityIcon color={color} size={size} />;
    default:
      return <SunHorizonIcon color={color} size={size} />;
  }
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
 * chip) and a time of day — five named slots plus an exact time typed into
 * inline HH:MM fields — with a pre-selected suggestion for the current
 * moment. Rescheduling reuses it with its own title, CTA, and initial day.
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
  /** Time-of-day slot pre-selected on open (defaults to the current moment). */
  initialSlot?: TimeSlotKey;
  onAccept: (date: string, time: string | null) => void;
  onClose: () => void;
  title?: string;
}) {
  const [today] = useState(() => new Date());
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
  const [slotKey, setSlotKey] = useState<TimeSlotKey | "customHour">(
    () => initialSlot ?? suggestTimeSlot(today.getHours()),
  );
  const [hourText, setHourText] = useState("");
  const [minuteText, setMinuteText] = useState("");
  const hourRef = useRef<TextInput>(null);
  const minuteRef = useRef<TextInput>(null);

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
    : (TIME_SLOTS.find((entry) => entry.key === slotKey) ?? TIME_SLOTS[0]).time;

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
        style={styles.acceptStar}
      />
      <AppText align="center" variant="titleSm">
        {title}
      </AppText>
      <AppText
        align="center"
        color={colors.textSecondary}
        style={styles.acceptSubtitle}
        variant="bodySmall"
      >
        Choose when you&rsquo;ll do it.{"\n"}We&rsquo;ve picked a time based on
        your current moment.
      </AppText>

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
                style={[styles.dayChip, selected && styles.acceptChipSelected]}
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
            style={[styles.dayChip, customSelected && styles.acceptChipSelected]}
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
        {TIME_SLOTS.map((entry) => {
          const selected = entry.key === slotKey;
          const accent = selected ? colors.primary : colors.textMuted;
          return (
            <View key={entry.key} style={styles.acceptTimeSlot}>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => setSlotKey(entry.key)}
                style={[styles.timeChip, selected && styles.acceptChipSelected]}
              >
                <SlotIcon color={accent} size={22} slotKey={entry.key} />
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
        disabled={customHourSelected && !customTimeValid}
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
