import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import type { ReactNode } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle, Path, Rect } from "react-native-svg";

import { colors } from "@/theme/colors";
import {
  fontSizes,
  lineHeights,
  radius,
  shadows,
  spacing,
  typography,
} from "@/theme/theme";

/** Below this width the roomy layout overflows, so switch to the phone scale. */
const COMPACT_BREAKPOINT = 560;

/** Floating tab bar height (72) plus its bottom margin and a small gap. */
const FOOTER_BOTTOM_OFFSET = 72 + spacing.sm * 2;

/** Saturated violet used by the arc ring and quest accents (softer than colors.accentViolet). */
const arcViolet = "#9B4DFF";

const PORTAL_ART_SOURCE = require("../../../assets/sprint-door-icon.png");

type QuestTask = {
  date: string;
  done: boolean;
  title: string;
};

type Quest = {
  accent: string;
  done: number;
  icon: "film" | "target" | "book";
  tasks: readonly QuestTask[];
  title: string;
  total: number;
  subtitle: string;
};

const quests: readonly Quest[] = [
  {
    accent: colors.primary,
    done: 3,
    icon: "film",
    subtitle: "Becoming someone who creates.",
    title: "Learn Video Making",
    total: 5,
    tasks: [
      { date: "May 18", done: true, title: "Watch video editing tutorial" },
      { date: "May 19", done: true, title: "Analyze 3 video creators" },
      { date: "May 20", done: true, title: "Plan and write video script" },
      { date: "May 22", done: false, title: "Record my first video" },
      { date: "May 24", done: false, title: "Edit and publish short clip" },
    ],
  },
  {
    accent: "#A552FF",
    done: 2,
    icon: "target",
    subtitle: "Becoming consistent in small daily actions.",
    title: "Build Daily Discipline",
    total: 4,
    tasks: [],
  },
  {
    accent: "#884DFF",
    done: 1,
    icon: "book",
    subtitle: "Training focus and inner control.",
    title: "Master My Mind",
    total: 4,
    tasks: [],
  },
];

function BackIcon() {
  return (
    <Svg height={22} viewBox="0 0 24 24" width={22}>
      <Path
        d="M15 5 8 12l7 7M9 12h10"
        fill="none"
        stroke={colors.primary}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
      />
    </Svg>
  );
}

function CalendarIcon({ color = colors.primarySoft, size = 16 }: { color?: string; size?: number }) {
  return (
    <Svg height={size} viewBox="0 0 24 24" width={size}>
      <Rect fill="none" height={15} rx={2.4} stroke={color} strokeWidth={1.7} width={17} x={3.5} y={5.5} />
      <Path d="M7.5 3.5v4M16.5 3.5v4M3.5 10h17" fill="none" stroke={color} strokeLinecap="round" strokeWidth={1.7} />
    </Svg>
  );
}

function ChevronIcon({ direction = "down", color = colors.primary, size = 18 }: { color?: string; direction?: "down" | "left" | "right" | "up"; size?: number }) {
  const path = {
    down: "m7 9 5 5 5-5",
    left: "m15 6-6 6 6 6",
    right: "m9 6 6 6-6 6",
    up: "m7 15 5-5 5 5",
  }[direction];

  return (
    <Svg height={size} viewBox="0 0 24 24" width={size}>
      <Path d={path} fill="none" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.9} />
    </Svg>
  );
}

function SparkIcon({ color = colors.primary, size = 24 }: { color?: string; size?: number }) {
  return (
    <Svg height={size} viewBox="0 0 32 32" width={size}>
      <Path d="M16 2.5c2.4 7.4 6.1 11.1 13.5 13.5C22.1 18.4 18.4 22.1 16 29.5 13.6 22.1 9.9 18.4 2.5 16 9.9 13.6 13.6 9.9 16 2.5Z" fill={color} />
    </Svg>
  );
}

function FlameIcon({ size = 72 }: { size?: number }) {
  return (
    <Svg height={size} viewBox="0 0 80 80" width={size}>
      <Circle cx={40} cy={40} fill="rgba(245, 184, 75, 0.1)" r={36} stroke="rgba(245, 184, 75, 0.42)" />
      <Circle cx={40} cy={40} fill="none" r={27} stroke="rgba(245, 184, 75, 0.34)" strokeDasharray="2 7" strokeLinecap="round" strokeWidth={1.8} />
      <Path
        d="M40 61c-11.1-5-17-12.4-17-21.7 0-9.7 8.7-17 13.8-24 .2 9 6.8 12.1 6.8 18.5 3.6-2.3 5.9-5.6 6.8-10 5.3 5.1 8.4 10.6 8.4 17.3C58.8 51.1 51.6 58 40 61Z"
        fill={colors.primary}
      />
      <Path
        d="M39.6 59.5c-6.3-4.1-9.4-8.8-9.4-14.1 0-5.7 4.3-9.4 7.1-14.1 1.2 5.5 6.3 7.1 6.3 12.4 1.6-1.1 2.9-2.9 3.6-5.2 2.9 3.1 4.1 6.3 4.1 9.8 0 5.3-4 9.1-11.7 11.2Z"
        fill="#FFE3A8"
        opacity={0.9}
      />
    </Svg>
  );
}

function QuestIcon({ accent, icon }: { accent: string; icon: Quest["icon"] }) {
  if (icon === "target") {
    return (
      <Svg height={30} viewBox="0 0 36 36" width={30}>
        <Circle cx={18} cy={18} fill="none" r={12} stroke={accent} strokeWidth={2} />
        <Circle cx={18} cy={18} fill="none" r={6} stroke={accent} strokeWidth={2} />
        <Path d="M18 8v4M18 24v4M8 18h4M24 18h4" stroke={accent} strokeLinecap="round" strokeWidth={2} />
      </Svg>
    );
  }

  if (icon === "book") {
    return (
      <Svg height={30} viewBox="0 0 36 36" width={30}>
        <Path d="M8 9c4.6 0 7.6 1.4 10 5 2.4-3.6 5.4-5 10-5v18c-4.6 0-7.6 1.4-10 5-2.4-3.6-5.4-5-10-5V9Z" fill="none" stroke={accent} strokeLinejoin="round" strokeWidth={2} />
        <Path d="M18 14v18" stroke={accent} strokeLinecap="round" strokeWidth={2} />
      </Svg>
    );
  }

  return (
    <Svg height={30} viewBox="0 0 36 36" width={30}>
      <Rect fill="none" height={18} rx={2.5} stroke={accent} strokeWidth={2} width={22} x={7} y={9} />
      <Path d="M11 6v6M25 6v6M7 15h22M13 20l4 3 6-7" fill="none" stroke={accent} strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
    </Svg>
  );
}

function ProgressRing({
  color = colors.primary,
  meta,
  progress,
  size = 92,
  value,
}: {
  color?: string;
  meta?: string;
  progress: number;
  size?: number;
  value: string;
}) {
  const strokeWidth = 5;
  const small = size < 80;
  const radiusValue = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radiusValue;
  const dashOffset = circumference * (1 - progress / 100);

  return (
    <View style={[styles.progressRing, { height: size, width: size }]}>
      <Svg height={size} viewBox={`0 0 ${size} ${size}`} width={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          fill="rgba(6, 8, 18, 0.9)"
          r={radiusValue}
          stroke={colors.borderSoft}
          strokeWidth={strokeWidth}
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          fill="none"
          r={radiusValue}
          stroke={color}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          strokeWidth={strokeWidth}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={styles.ringCenter}>
        <Text style={[styles.ringValue, small && styles.ringValueSmall]}>{value}</Text>
        {meta ? <Text style={styles.ringMeta}>{meta}</Text> : null}
      </View>
    </View>
  );
}

function HeaderButton({ children, label, onPress }: { children: ReactNode; label: string; onPress?: () => void }) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.headerButton, pressed && styles.pressed]}
    >
      {children}
    </Pressable>
  );
}

function SectionLabel({ title }: { title: string }) {
  return <Text style={styles.sectionLabel}>{title}</Text>;
}

function TaskRow({ task }: { task: QuestTask }) {
  return (
    <View style={styles.taskRow}>
      <View style={[styles.taskCheck, task.done && styles.taskCheckDone]}>
        {task.done ? <PathCheck /> : null}
      </View>
      <Text numberOfLines={2} style={styles.taskTitle}>{task.title}</Text>
      <View style={styles.taskDate}>
        <CalendarIcon color={colors.textMuted} size={14} />
        <Text style={styles.taskDateText}>{task.date}</Text>
      </View>
    </View>
  );
}

function PathCheck() {
  return (
    <Svg height={14} viewBox="0 0 24 24" width={14}>
      <Path d="m6 12 4 4 8-9" fill="none" stroke={colors.background} strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} />
    </Svg>
  );
}

function QuestCard({ expanded, quest }: { expanded?: boolean; quest: Quest }) {
  return (
    <View style={[styles.questCard, expanded && styles.questCardExpanded]}>
      <View style={styles.questHeader}>
        <View style={[styles.questIconFrame, { borderColor: `${quest.accent}80`, shadowColor: quest.accent }]}>
          <QuestIcon accent={quest.accent} icon={quest.icon} />
        </View>
        <View style={styles.questCopy}>
          <Text numberOfLines={1} style={styles.questTitle}>{quest.title}</Text>
          <Text numberOfLines={1} style={styles.questSubtitle}>{quest.subtitle}</Text>
        </View>
        <Text style={styles.questCount}>{quest.done} / {quest.total} tasks</Text>
        <ChevronIcon direction={expanded ? "up" : "down"} />
      </View>

      {expanded ? (
        <View style={styles.taskList}>
          <Text style={styles.miniLabel}>TASKS</Text>
          {quest.tasks.map((task) => (
            <TaskRow key={task.title} task={task} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

function SkyDust() {
  return (
    <Svg height="100%" pointerEvents="none" style={StyleSheet.absoluteFill} width="100%">
      <Circle cx="14%" cy="9%" fill="#F8C56D" opacity={0.25} r={1.2} />
      <Circle cx="78%" cy="13%" fill="#B56DFF" opacity={0.28} r={1.6} />
      <Circle cx="87%" cy="30%" fill="#F8C56D" opacity={0.18} r={1.1} />
      <Circle cx="22%" cy="44%" fill="#B56DFF" opacity={0.18} r={1.3} />
      <Circle cx="67%" cy="58%" fill="#F8C56D" opacity={0.2} r={1.2} />
    </Svg>
  );
}

export default function SprintScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const compact = width < COMPACT_BREAKPOINT;

  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={["#02050D", "#060716", "#080617", "#030712"]}
        locations={[0, 0.35, 0.72, 1]}
        pointerEvents="none"
        style={StyleSheet.absoluteFill}
      />
      <SkyDust />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingBottom: insets.bottom + FOOTER_BOTTOM_OFFSET + 160,
            paddingTop: Math.max(insets.top + 10, 20),
          },
          compact && styles.contentCompact,
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <HeaderButton
            label="Back"
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              }
            }}
          >
            <BackIcon />
          </HeaderButton>
          <View style={styles.headerTitleBlock}>
            <Text style={[styles.title, compact && styles.titleCompact]}>Weekly Plan</Text>
            <Text style={styles.subtitle}>Your commitments for this week.</Text>
          </View>
          <HeaderButton label="Weekly focus">
            <SparkIcon size={22} />
          </HeaderButton>
        </View>

        <Pressable accessibilityRole="button" style={({ pressed }) => [styles.datePill, compact && styles.datePillCompact, pressed && styles.pressed]}>
          <ChevronIcon direction="left" />
          <CalendarIcon />
          <Text style={styles.dateText}>May 18 - May 24, 2025</Text>
          <ChevronIcon direction="right" />
        </Pressable>

        <View style={[styles.arcCard, compact && styles.arcCardCompact]}>
          <LinearGradient
            colors={["rgba(245, 184, 75, 0.06)", "rgba(126, 58, 205, 0.03)", "rgba(3, 8, 18, 0)"]}
            pointerEvents="none"
            style={StyleSheet.absoluteFill}
          />
          <View style={[styles.arcTop, compact && styles.arcTopCompact]}>
            <View style={[styles.flameFrame, compact && styles.flameFrameCompact]}>
              <FlameIcon size={compact ? 56 : 72} />
            </View>
            <View style={[styles.arcCopy, compact && styles.arcCopyCompact]}>
              <Text style={[styles.arcTitle, compact && styles.arcTitleCompact]}>Build Unstoppable Discipline</Text>
              <Text style={styles.arcSubtitle}>Proving to myself that I can do hard things.</Text>
            </View>
            <View style={[styles.arcProgress, compact && styles.arcProgressCompact]}>
              <ProgressRing
                color={arcViolet}
                meta="5 / 7 tasks"
                progress={72}
                size={compact ? 78 : 92}
                value="72%"
              />
              <Text style={styles.thisWeek}>This week</Text>
            </View>
          </View>

          <View style={styles.questSectionTitle}>
            <SparkIcon color={colors.accentViolet} size={14} />
            <Text style={styles.questLabel}>QUESTS</Text>
          </View>
          <QuestCard expanded quest={quests[0]} />
          {quests.slice(1).map((quest) => (
            <QuestCard key={quest.title} quest={quest} />
          ))}

          <Pressable accessibilityRole="button" style={({ pressed }) => [styles.viewAllButton, pressed && styles.pressed]}>
            <Text style={styles.viewAllText}>View all quests</Text>
            <ChevronIcon />
          </Pressable>
        </View>

      </ScrollView>

      <View
        pointerEvents="box-none"
        style={[
          styles.fixedFooter,
          compact && styles.fixedFooterCompact,
          { bottom: insets.bottom + FOOTER_BOTTOM_OFFSET },
        ]}
      >
        <View style={styles.weeklyCard}>
          <Image contentFit="cover" source={PORTAL_ART_SOURCE} style={styles.portalArt} />
          <View style={styles.weeklyCopy}>
            <Text style={styles.weeklyText}>You&apos;re showing up for your future.</Text>
            <Text style={styles.weeklyTextMuted}>Keep going, your future self is proud.</Text>
            <View style={styles.weeklyBarTrack}>
              <View style={styles.weeklyBarFill} />
              <View style={styles.weeklyBarSpark} />
            </View>
          </View>
          <View style={styles.weeklyPercent}>
            <ProgressRing progress={64} size={72} value="64%" />
            <Text style={styles.percentMeta}>18 / 24 days</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  arcCard: {
    backgroundColor: "rgba(4, 8, 18, 0.74)",
    borderColor: colors.borderSoft,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: spacing.sm,
    overflow: "hidden",
    padding: spacing.md,
  },
  arcCardCompact: {
    padding: 12,
  },
  arcCopy: {
    flex: 1,
    minWidth: 170,
  },
  arcCopyCompact: {
    minWidth: 140,
  },
  arcProgress: {
    alignItems: "center",
    gap: spacing.xs,
    justifyContent: "center",
    minWidth: 100,
  },
  arcProgressCompact: {
    minWidth: 0,
  },
  arcSubtitle: {
    ...typography.subtitle,
    color: colors.textSecondary,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.md,
    marginTop: spacing.sm,
    maxWidth: 260,
  },
  arcTitle: {
    ...typography.cardTitle,
    fontSize: 26,
    lineHeight: 32,
  },
  arcTitleCompact: {
    fontSize: fontSizes.xxl,
    lineHeight: lineHeights.xxl,
  },
  arcTop: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    marginBottom: 12,
  },
  arcTopCompact: {
    gap: 10,
  },
  content: {
    alignSelf: "center",
    maxWidth: 820,
    paddingHorizontal: 22,
    width: "100%",
  },
  contentCompact: {
    paddingHorizontal: spacing.md,
  },
  datePill: {
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: "rgba(8, 9, 22, 0.86)",
    borderColor: colors.border,
    borderRadius: radius.round,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    height: 40,
    justifyContent: "center",
    marginBottom: spacing.md,
    minWidth: 280,
    paddingHorizontal: spacing.md,
  },
  datePillCompact: {
    minWidth: 0,
  },
  dateText: {
    color: colors.primary,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
  },
  fixedFooter: {
    alignSelf: "center",
    left: 0,
    maxWidth: 820,
    paddingHorizontal: 22,
    position: "absolute",
    right: 0,
    width: "100%",
  },
  fixedFooterCompact: {
    paddingHorizontal: spacing.md,
  },
  flameFrame: {
    alignItems: "center",
    height: 92,
    justifyContent: "center",
    width: 104,
  },
  flameFrameCompact: {
    height: 68,
    width: 72,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  headerButton: {
    alignItems: "center",
    backgroundColor: "rgba(4, 8, 18, 0.72)",
    borderColor: "rgba(245, 184, 75, 0.28)",
    borderRadius: radius.round,
    borderWidth: 1,
    height: 44,
    justifyContent: "center",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.16,
    shadowRadius: 10,
    width: 44,
  },
  headerTitleBlock: {
    alignItems: "center",
    flex: 1,
    paddingHorizontal: 10,
  },
  miniLabel: {
    ...typography.caption,
    color: colors.primarySoft,
    fontWeight: "700",
    letterSpacing: 1.4,
    marginBottom: 2,
  },
  percentMeta: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  portalArt: {
    borderColor: colors.borderSoft,
    borderRadius: 10,
    borderWidth: 1,
    height: 82,
    overflow: "hidden",
    width: 96,
  },
  pressed: {
    opacity: 0.72,
    transform: [{ scale: 0.98 }],
  },
  progressRing: {
    alignItems: "center",
    justifyContent: "center",
  },
  questCard: {
    backgroundColor: "rgba(5, 8, 18, 0.72)",
    borderColor: "rgba(246, 232, 200, 0.16)",
    borderRadius: radius.md,
    borderWidth: 1,
    marginTop: 12,
    overflow: "hidden",
  },
  questCardExpanded: {
    backgroundColor: "rgba(5, 8, 18, 0.88)",
  },
  questCopy: {
    flex: 1,
    minWidth: 0,
  },
  questCount: {
    ...typography.subtitle,
    color: colors.textPrimary,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
  },
  questHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    minHeight: 64,
    paddingHorizontal: 14,
  },
  questIconFrame: {
    alignItems: "center",
    backgroundColor: "rgba(12, 7, 26, 0.82)",
    borderRadius: radius.round,
    borderWidth: 1,
    height: 48,
    justifyContent: "center",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    width: 48,
  },
  questLabel: {
    ...typography.caption,
    color: colors.accentViolet,
    fontWeight: "800",
    letterSpacing: 1.4,
  },
  questSectionTitle: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
    marginBottom: 2,
  },
  questSubtitle: {
    ...typography.subtitle,
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.xs,
  },
  questTitle: {
    ...typography.pill,
    fontSize: fontSizes.lg,
    lineHeight: lineHeights.lg,
  },
  ringCenter: {
    alignItems: "center",
    position: "absolute",
  },
  ringMeta: {
    color: colors.textSecondary,
    fontSize: 11,
    lineHeight: 14,
  },
  ringValue: {
    color: colors.primary,
    fontFamily: "serif",
    fontSize: 24,
    lineHeight: 28,
  },
  ringValueSmall: {
    fontSize: 19,
    lineHeight: 23,
  },
  screen: {
    backgroundColor: colors.background,
    flex: 1,
    overflow: "hidden",
  },
  sectionLabel: {
    ...typography.caption,
    color: colors.accentViolet,
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 1.2,
    lineHeight: 18,
    marginBottom: spacing.sm,
    marginLeft: 2,
    marginTop: 2,
  },
  subtitle: {
    color: colors.primary,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.md,
    marginTop: 2,
    textAlign: "center",
  },
  taskCheck: {
    alignItems: "center",
    borderColor: colors.textMuted,
    borderRadius: radius.round,
    borderWidth: 1.3,
    height: 20,
    justifyContent: "center",
    width: 20,
  },
  taskCheckDone: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  taskDate: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.xs,
    justifyContent: "flex-end",
    minWidth: 70,
  },
  taskDateText: {
    ...typography.caption,
    color: colors.textMuted,
  },
  taskList: {
    borderTopColor: colors.borderSoft,
    borderTopWidth: 1,
    paddingHorizontal: 14,
    paddingTop: spacing.sm,
  },
  taskRow: {
    alignItems: "center",
    borderBottomColor: "rgba(246, 232, 200, 0.07)",
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: 10,
    minHeight: 40,
  },
  taskTitle: {
    color: colors.textPrimary,
    flex: 1,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
  },
  thisWeek: {
    ...typography.caption,
    color: colors.primary,
  },
  title: {
    ...typography.screenTitle,
    color: colors.primary,
    textAlign: "center",
    textShadowColor: "rgba(245, 184, 75, 0.28)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  titleCompact: {
    fontSize: 32,
    lineHeight: 38,
  },
  viewAllButton: {
    alignItems: "center",
    alignSelf: "center",
    flexDirection: "row",
    gap: 3,
    height: 40,
    justifyContent: "center",
    marginTop: spacing.xs,
  },
  viewAllText: {
    color: colors.primary,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
  },
  weeklyBarFill: {
    backgroundColor: colors.primary,
    borderRadius: 3,
    height: 5,
    width: "72%",
  },
  weeklyBarSpark: {
    backgroundColor: "#FFF0BF",
    borderRadius: 5,
    height: 10,
    left: "71%",
    position: "absolute",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
    top: -2.5,
    width: 10,
  },
  weeklyBarTrack: {
    backgroundColor: colors.borderSoft,
    borderRadius: 3,
    height: 5,
    marginTop: 13,
    overflow: "visible",
    width: "100%",
  },
  weeklyCard: {
    alignItems: "center",
    backgroundColor: "#060914",
    borderColor: "rgba(245, 184, 75, 0.28)",
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.xs,
    overflow: "hidden",
    padding: spacing.md,
    ...shadows.goldGlow,
    shadowOpacity: 0.12,
  },
  weeklyCopy: {
    flex: 1,
    minWidth: 130,
  },
  weeklyPercent: {
    alignItems: "center",
    gap: spacing.xs,
  },
  weeklyText: {
    color: colors.textPrimary,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.md,
  },
  weeklyTextMuted: {
    color: colors.textSecondary,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.md,
  },
});
