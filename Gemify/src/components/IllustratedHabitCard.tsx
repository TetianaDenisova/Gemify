import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, View, type ImageSourcePropType } from "react-native";

import type { BoardHabit } from "@/data/habitBoard";
import type { HabitCompletion } from "@/components/HabitItem";
import { getHabitCompletions, type Dream, type HabitDetailSection } from "@/db";
import {
  AppText, CheckIcon, Checkbox, ChevronIcon, ClockIcon, DotsIcon,
  DreamIcon, FlameIcon, SunHorizonIcon,
} from "@/shared/components";
import { colors } from "@/theme/colors";
import { pressed, radius, shadowStyle, spacing } from "@/theme/theme";
import { addDays, startOfWeek, toDateKey, todayKey } from "@/utils/dates";

const CARD_BACKGROUND = "#040D17";
const METADATA_COLOR = "#A4A0B6";
const DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"] as const;

type Props = {
  activeDayIndex: number;
  checkedSections: readonly HabitDetailSection[];
  compact: boolean;
  dream?: Dream;
  expanded: boolean;
  habit: BoardHabit;
  imageSource: ImageSourcePropType;
  onDateToggle: (date: string, status: HabitCompletion) => Promise<void>;
  onDetailToggle: (section: HabitDetailSection) => void;
  onOpenMenu: () => void;
  onPress: () => void;
  onToggleDone: () => void;
};

export function IllustratedHabitCard({
  activeDayIndex, checkedSections, compact, dream, expanded, habit,
  imageSource, onDateToggle, onDetailToggle, onOpenMenu, onPress, onToggleDone,
}: Props) {
  const [weekOffset, setWeekOffset] = useState(0);
  const [history, setHistory] = useState<readonly HabitCompletion[] | null>(null);
  const [historyError, setHistoryError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const done = habit.progress[activeDayIndex] === "done";
  const weekDates = useMemo(() => {
    const monday = addDays(startOfWeek(new Date()), weekOffset * 7);
    return Array.from({ length: 7 }, (_, index) => toDateKey(addDays(monday, index)));
  }, [weekOffset]);

  useEffect(() => {
    if (!expanded || weekOffset === 0) return;
    let cancelled = false;
    getHabitCompletions(habit.id, weekDates[0], weekDates[6])
      .then((records) => {
        if (cancelled) return;
        const byDate = new Map(records.map((record) => [record.date, record.status]));
        setHistory(weekDates.map((date) => byDate.get(date) ?? "open"));
        setHistoryError(false);
      })
      .catch((cause: unknown) => {
        if (cancelled) return;
        setHistoryError(true);
        console.error("Failed to load the habit week", cause);
      });
    return () => { cancelled = true; };
  }, [expanded, habit.id, habit.progress, weekDates, weekOffset]);

  const progress = weekOffset === 0 ? habit.progress : history;
  const weekLabel = weekOffset === 0 ? "This week" :
    `${new Date(`${weekDates[0]}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${new Date(`${weekDates[6]}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;

  async function toggleDate(index: number) {
    if (!progress || saving) return;
    setSelectedDate(weekDates[index]);
    setSaving(true);
    try {
      await onDateToggle(weekDates[index], progress[index]);
    } finally {
      setSaving(false);
    }
  }

  function changeWeek(offset: number) {
    setHistory(null);
    setHistoryError(false);
    setSelectedDate(null);
    setWeekOffset((current) => current + offset);
  }

  return (
    <View style={[
      styles.card, expanded && styles.cardExpanded,
      done && styles.cardDone,
    ]}>
      <View style={done && styles.completedContent}>
        <View style={[styles.header, compact && styles.headerCompact, expanded && styles.headerExpanded, compact && expanded && styles.headerExpandedCompact]}>
          <View pointerEvents="none" style={styles.art}>
            <Image
              contentFit="cover"
              contentPosition={dream?.photoUri ? {
                left: `${dream.photoFocusX * 100}%`, top: `${dream.photoFocusY * 100}%`,
              } : "right center"}
              source={imageSource}
              style={[StyleSheet.absoluteFill, dream?.photoUri ? {
                transform: [{ scale: dream.photoScale }],
              } : undefined]}
            />
            <LinearGradient
              colors={[CARD_BACKGROUND, "rgba(4, 13, 23, 0.65)", "rgba(4, 13, 23, 0.08)", "rgba(4, 13, 23, 0.35)"]}
              locations={[0, 0.25, 0.65, 1]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
            <LinearGradient
              colors={["rgba(4, 13, 23, 0.12)", "transparent", CARD_BACKGROUND]}
              locations={[0, 0.55, 1]}
              style={StyleSheet.absoluteFill}
            />
          </View>
          <Pressable
            accessibilityLabel={`Details for the habit ${habit.title}`}
            accessibilityRole="button" accessibilityState={{ expanded }}
            onPress={onPress}
            style={({ pressed: isPressed }) => [styles.content, compact && styles.contentCompact, isPressed && pressed]}
          >
            <AppText
              color={expanded ? colors.primary : "#F3EDE3"}
              style={[styles.title, compact && styles.titleCompact, expanded && styles.expandedTitle, compact && expanded && styles.expandedTitleCompact]}
              variant="cardTitle"
            >
              {habit.title}
            </AppText>
            <View style={styles.streak}>
              <FlameIcon size={compact ? 23 : 28} />
              <AppText color={habit.streakDays ? colors.primary : METADATA_COLOR} style={compact && styles.streakCompact} variant="subtitle">
                {habit.streakDays === 0 ? (expanded ? "0 days" : "Start streak") : `${habit.streakDays} ${habit.streakDays === 1 ? "day" : "days"}`}
              </AppText>
            </View>
            <View style={styles.metadata}>
              <View style={styles.metadataItem}>
                {/sleep|night/i.test(habit.time) ? <ClockIcon color={METADATA_COLOR} size={19} /> : <SunHorizonIcon color={METADATA_COLOR} size={19} />}
                <AppText color={METADATA_COLOR} style={styles.metaText} variant="bodySmall">{habit.time}</AppText>
              </View>
              {expanded && habit.dreamTitle ? (
                <View style={styles.metadataItem}>
                  <DreamIcon color={METADATA_COLOR} size={18} />
                  <AppText color={METADATA_COLOR} style={styles.metaText} variant="bodySmall">{habit.dreamTitle}</AppText>
                </View>
              ) : null}
            </View>
          </Pressable>
          <View style={styles.controls}>
            {expanded ? (
              <Pressable accessibilityLabel={`Options for ${habit.title}`} accessibilityRole="button" onPress={onOpenMenu} style={({ pressed: isPressed }) => [styles.iconButton, isPressed && pressed]}>
                <View style={styles.menuDots}><DotsIcon color="#E9E5EF" size={23} /></View>
              </Pressable>
            ) : null}
            {!expanded ? <Checkbox
              accessibilityLabel={done ? `Mark ${habit.title} not done today` : `Mark ${habit.title} done today`}
              appearance="outline" borderColor={done ? METADATA_COLOR : colors.primary}
              checkColor={done ? METADATA_COLOR : colors.primary}
              checked={done} onPress={onToggleDone} shape="circle" size={compact ? 26 : 32}
              style={styles.completion}
            /> : null}
          </View>
        </View>
        {expanded ? (
          <View style={[styles.details, compact && styles.detailsCompact]}>
            <View style={styles.calendar}>
              <View style={styles.progressHeader}>
                <AppText color={colors.primary} style={styles.dayCount} variant="subtitle">
                  Day {habit.day}<AppText color={METADATA_COLOR} style={styles.dayCount} variant="subtitle"> of {habit.goal}</AppText>
                </AppText>
                <View style={styles.weekNavigation}>
                  <AppText color={METADATA_COLOR} style={styles.weekLabel} variant="caption">{weekLabel}</AppText>
                  <Pressable accessibilityLabel={`Previous week for ${habit.title}`} accessibilityRole="button" disabled={saving} hitSlop={6} onPress={() => changeWeek(-1)} style={styles.weekArrow}>
                    <ChevronIcon color={METADATA_COLOR} direction="left" size={18} />
                  </Pressable>
                  <Pressable accessibilityLabel={`Next week for ${habit.title}`} accessibilityRole="button" disabled={saving} hitSlop={6} onPress={() => changeWeek(1)} style={styles.weekArrow}>
                    <ChevronIcon color={METADATA_COLOR} direction="right" size={18} />
                  </Pressable>
                </View>
              </View>
              <View style={styles.week}>
                {DAYS.map((day, index) => {
                  const status = progress?.[index] ?? "open";
                  const highlighted = weekDates[index] === (selectedDate ?? todayKey());
                  return (
                    <Pressable
                      accessibilityLabel={`${day}, ${weekDates[index]}, ${progress ? status : "loading"}`}
                      accessibilityRole="checkbox" accessibilityState={{ checked: status === "partial" ? "mixed" : status === "done", disabled: !progress || saving }}
                      disabled={!progress || saving} key={day} onPress={() => void toggleDate(index)}
                      style={({ pressed: isPressed }) => [styles.day, isPressed && pressed]}
                    >
                      <AppText color={METADATA_COLOR} style={styles.dayLabel} variant="caption">{day}</AppText>
                      <View style={[styles.dayHalo, highlighted && !done && styles.dayHaloActive]}>
                        <View style={[styles.dayCircle, status === "done" && styles.dayCircleDone, status === "missed" && styles.dayCircleMissed, !progress && styles.loadingCircle]}>
                          {status === "partial" ? <View style={styles.partialFill} /> : null}
                          {status === "done" ? <CheckIcon color={colors.primary} size={15} /> : null}
                        </View>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
              {historyError ? <AppText color={colors.danger} variant="caption">Could not load this week.</AppText> : null}
            </View>
            {habit.details.map((section) => (
              <View key={section.key} style={[styles.detailSection, compact && styles.detailSectionCompact]}>
                <AppText color={colors.textPrimary} style={[styles.sectionTitle, compact && styles.sectionTitleCompact]} variant="pill">
                  {section.key === "easy_start" ? "Make it easy" : section.key === "easy_version" ? "Bad day version" : section.title}
                </AppText>
                {section.rows.map((row, index) => (
                  <View key={`${section.key}-${index}`} style={styles.detailRow}>
                    {section.checkable ? <Checkbox
                      accessibilityLabel={`Mark today as a small step: ${row}`}
                      appearance="outline" borderColor={colors.primaryDark}
                      checked={checkedSections.includes(section.key)}
                      onPress={() => onDetailToggle(section.key)} shape="square" size={22}
                    /> : null}
                    <AppText color={METADATA_COLOR} style={styles.detailText} variant="body">{row}</AppText>
                  </View>
                ))}
              </View>
            ))}
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: CARD_BACKGROUND, borderColor: "rgba(80, 104, 130, 0.22)", borderRadius: radius.md, borderWidth: 1, overflow: "hidden" },
  cardExpanded: { borderColor: "rgba(190, 153, 89, 0.35)", ...shadowStyle({ color: colors.primary, opacity: 0.07, radius: 12 }) },
  cardDone: { borderColor: "rgba(80, 104, 130, 0.12)", ...shadowStyle({ color: colors.transparent, opacity: 0, radius: 0 }) },
  completedContent: { opacity: 0.48 },
  header: { minHeight: 126 },
  headerCompact: { minHeight: 90 },
  headerExpanded: { minHeight: 150 },
  headerExpandedCompact: { minHeight: 124 },
  art: { position: "absolute", top: 0, bottom: 0, right: 0, width: "56%", overflow: "hidden" },
  content: { padding: 22, paddingRight: 66, gap: 10 },
  contentCompact: { paddingHorizontal: 14, paddingVertical: 10, paddingRight: 52, gap: 4 },
  title: { fontSize: 24, lineHeight: 30, fontWeight: "400", letterSpacing: 0 },
  titleCompact: { fontSize: 18, lineHeight: 23 },
  expandedTitle: { fontSize: 30, lineHeight: 37, maxWidth: "76%" },
  expandedTitleCompact: { fontSize: 24, lineHeight: 29, maxWidth: "82%" },
  streak: { alignItems: "center", flexDirection: "row", gap: 8 },
  streakCompact: { fontSize: 15, lineHeight: 21 },
  metadata: { flexDirection: "row", flexWrap: "wrap", columnGap: 14, rowGap: 6, marginTop: 2 },
  metadataItem: { alignItems: "center", flexDirection: "row", gap: 7, flexShrink: 1, maxWidth: "100%" },
  metaText: { flexShrink: 1, fontSize: 13, lineHeight: 19 },
  controls: { position: "absolute", right: 8, top: 8, alignItems: "center", gap: 6 },
  iconButton: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  menuDots: { transform: [{ rotate: "90deg" }] },
  completion: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  details: { paddingHorizontal: 22, paddingBottom: 6 },
  detailsCompact: { paddingHorizontal: 14 },
  calendar: { borderTopColor: "rgba(123, 139, 164, 0.2)", borderTopWidth: 1, paddingTop: 12, paddingBottom: 14 },
  progressHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", columnGap: 6 },
  dayCount: { fontSize: 17, lineHeight: 24 },
  weekNavigation: { flexDirection: "row", alignItems: "center" },
  weekLabel: { fontSize: 12, letterSpacing: 0, flexShrink: 1 },
  weekArrow: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  week: { flexDirection: "row", justifyContent: "space-between", marginTop: 6 },
  day: { flex: 1, minWidth: 0, alignItems: "center", gap: 7, paddingVertical: 4 },
  dayLabel: { fontSize: 10, letterSpacing: 0 },
  dayHalo: { width: 36, height: 36, borderRadius: radius.round, borderWidth: 1, borderColor: "transparent", alignItems: "center", justifyContent: "center" },
  dayHaloActive: { borderColor: "#A63DED", backgroundColor: "rgba(137, 30, 216, 0.16)", ...shadowStyle({ color: "#B62EFF", opacity: 0.65, radius: 12 }) },
  dayCircle: { width: 23, height: 23, borderRadius: radius.round, borderWidth: 1.5, borderColor: colors.primary, overflow: "hidden", alignItems: "center", justifyContent: "center" },
  dayCircleDone: { backgroundColor: "rgba(245, 184, 75, 0.18)" },
  dayCircleMissed: { borderColor: colors.danger },
  partialFill: { position: "absolute", left: 0, bottom: 0, top: 0, width: "50%", backgroundColor: colors.primary },
  loadingCircle: { opacity: 0.3 },
  detailSection: { borderTopColor: "rgba(123, 139, 164, 0.2)", borderTopWidth: 1, paddingVertical: 16, gap: 12 },
  detailSectionCompact: { paddingVertical: 12, gap: 8 },
  sectionTitle: { fontSize: 21, lineHeight: 27, fontWeight: "400", letterSpacing: 0 },
  sectionTitleCompact: { fontSize: 19, lineHeight: 25 },
  detailRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, minHeight: 32 },
  detailText: { flex: 1, fontSize: 15, lineHeight: 22 },
});
