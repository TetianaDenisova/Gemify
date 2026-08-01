import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle, Path, Rect } from "react-native-svg";

import {
  AppText,
  BackIcon,
  Badge,
  Card,
  Checkbox,
  ChevronIcon,
  ListItem,
  ProgressBar,
  ProgressRing,
  ScreenHeader,
  ScreenScaffold,
  SparkIcon,
} from "@/shared/components";
import { colors } from "@/theme/colors";
import {
  fontSizes,
  layout,
  lineHeights,
  pressed,
  radius,
  shadows,
  spacing,
} from "@/theme/theme";

/** Extra scroll clearance so content can rise above the fixed weekly footer card. */
const FOOTER_CARD_CLEARANCE = 160;

/** Bespoke night-sky gradient behind the sprint board. */
const SPRINT_BACKGROUND = ["#02050D", "#060716", "#080617", "#030712"] as const;

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
    accent: colors.accentVioletStrong,
    done: 2,
    icon: "target",
    subtitle: "Becoming consistent in small daily actions.",
    title: "Build Daily Discipline",
    total: 4,
    tasks: [],
  },
  {
    accent: colors.accentVioletStrong,
    done: 1,
    icon: "book",
    subtitle: "Training focus and inner control.",
    title: "Master My Mind",
    total: 4,
    tasks: [],
  },
];

function CalendarIcon({ color = colors.primarySoft, size = 16 }: { color?: string; size?: number }) {
  return (
    <Svg height={size} viewBox="0 0 24 24" width={size}>
      <Rect fill="none" height={15} rx={2.4} stroke={color} strokeWidth={1.7} width={17} x={3.5} y={5.5} />
      <Path d="M7.5 3.5v4M16.5 3.5v4M3.5 10h17" fill="none" stroke={color} strokeLinecap="round" strokeWidth={1.7} />
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

function TaskRow({ task }: { task: QuestTask }) {
  return (
    <ListItem
      leading={<Checkbox checked={task.done} size={20} />}
      minHeight={40}
      title={task.title}
      trailing={
        <View style={styles.taskDate}>
          <CalendarIcon color={colors.textMuted} size={14} />
          <AppText variant="caption">{task.date}</AppText>
        </View>
      }
    />
  );
}

function QuestCard({ expanded, quest }: { expanded?: boolean; quest: Quest }) {
  return (
    <Card
      padded={false}
      style={[styles.questCard, expanded && styles.questCardExpanded]}
    >
      <View style={styles.questHeader}>
        <View style={[styles.questIconFrame, { borderColor: `${quest.accent}80`, shadowColor: quest.accent }]}>
          <QuestIcon accent={quest.accent} icon={quest.icon} />
        </View>
        <View style={styles.questCopy}>
          <AppText numberOfLines={1} variant="pill">{quest.title}</AppText>
          <AppText color={colors.textSecondary} numberOfLines={1} variant="caption">
            {quest.subtitle}
          </AppText>
        </View>
        <AppText color={colors.textPrimary} variant="bodySmall">{quest.done} / {quest.total} tasks</AppText>
        <ChevronIcon direction={expanded ? "up" : "down"} />
      </View>

      {expanded ? (
        <View style={styles.taskList}>
          <AppText color={colors.primarySoft} style={styles.miniLabel} variant="eyebrow">
            TASKS
          </AppText>
          {quest.tasks.map((task) => (
            <TaskRow key={task.title} task={task} />
          ))}
        </View>
      ) : null}
    </Card>
  );
}

function SkyDust() {
  return (
    <Svg height="100%" pointerEvents="none" style={StyleSheet.absoluteFill} width="100%">
      <Circle cx="14%" cy="9%" fill="#F8C56D" opacity={0.25} r={1.2} />
      <Circle cx="78%" cy="13%" fill={colors.accentVioletStrong} opacity={0.28} r={1.6} />
      <Circle cx="87%" cy="30%" fill="#F8C56D" opacity={0.18} r={1.1} />
      <Circle cx="22%" cy="44%" fill={colors.accentVioletStrong} opacity={0.18} r={1.3} />
      <Circle cx="67%" cy="58%" fill="#F8C56D" opacity={0.2} r={1.2} />
    </Svg>
  );
}

export default function SprintScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const compact = width < layout.compactBreakpoint;

  return (
    <View style={styles.screen}>
      <ScreenScaffold
        backgroundGradient={SPRINT_BACKGROUND}
        contentStyle={{
          paddingBottom:
            insets.bottom + layout.tabBarClearance + FOOTER_CARD_CLEARANCE,
        }}
        tabClearance
        topInset
      >
        <SkyDust />
        <ScreenHeader
          leftAction={{
            accessibilityLabel: "Back",
            icon: <BackIcon />,
            onPress: () => {
              if (router.canGoBack()) {
                router.back();
              }
            },
          }}
          rightAction={{
            accessibilityLabel: "Weekly focus",
            icon: <SparkIcon size={22} />,
            onPress: () => {},
          }}
          style={styles.header}
          subtitle="Your commitments for this week."
          title="Weekly Plan"
        />

        <Badge
          color={colors.border}
          icon={
            <>
              <ChevronIcon direction="left" />
              <CalendarIcon />
              <AppText color={colors.primary} variant="bodySmall">
                May 18 - May 24, 2025
              </AppText>
              <ChevronIcon direction="right" />
            </>
          }
          label=""
          style={[styles.datePill, compact && styles.datePillCompact]}
        />

        <Card style={styles.arcCard}>
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
              <AppText
                style={[styles.arcTitle, compact && styles.arcTitleCompact]}
                variant="cardTitle"
              >
                Build Unstoppable Discipline
              </AppText>
              <AppText style={styles.arcSubtitle} variant="bodySmall">
                Proving to myself that I can do hard things.
              </AppText>
            </View>
            <View style={[styles.arcProgress, compact && styles.arcProgressCompact]}>
              <ProgressRing
                backgroundColor={colors.surfaceDeep}
                color={colors.accentVioletStrong}
                meta="5 / 7 tasks"
                size={compact ? 78 : 92}
                value={72}
              />
              <AppText color={colors.primary} variant="caption">This week</AppText>
            </View>
          </View>

          <View style={styles.questSectionTitle}>
            <SparkIcon color={colors.accentViolet} size={14} />
            <AppText color={colors.accentViolet} variant="eyebrow">QUESTS</AppText>
          </View>
          <QuestCard expanded quest={quests[0]} />
          {quests.slice(1).map((quest) => (
            <QuestCard key={quest.title} quest={quest} />
          ))}

          <Pressable
            accessibilityRole="button"
            style={({ pressed: isPressed }) => [styles.viewAllButton, isPressed && pressed]}
          >
            <AppText color={colors.primary} variant="bodySmall">View all quests</AppText>
            <ChevronIcon />
          </Pressable>
        </Card>
      </ScreenScaffold>

      <View
        pointerEvents="box-none"
        style={[
          styles.fixedFooter,
          compact && styles.fixedFooterCompact,
          { bottom: insets.bottom + layout.tabBarClearance },
        ]}
      >
        <Card style={styles.weeklyCard}>
          <Image contentFit="cover" source={PORTAL_ART_SOURCE} style={styles.portalArt} />
          <View style={styles.weeklyCopy}>
            <AppText color={colors.textPrimary} variant="bodySmall">
              You&apos;re showing up for your future.
            </AppText>
            <AppText variant="bodySmall">Keep going, your future self is proud.</AppText>
            <ProgressBar glow style={styles.weeklyBar} value={72} />
          </View>
          <View style={styles.weeklyPercent}>
            <ProgressRing
              backgroundColor={colors.surfaceDeep}
              size={72}
              value={64}
            />
            <AppText color={colors.textSecondary} variant="caption">18 / 24 days</AppText>
          </View>
        </Card>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  arcCard: {
    backgroundColor: colors.surfaceDeep,
    borderColor: colors.borderSoft,
    marginBottom: spacing.sm,
    overflow: "hidden",
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
    marginTop: spacing.sm,
    maxWidth: 260,
  },
  arcTitle: {
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
  datePill: {
    alignSelf: "center",
    gap: spacing.sm,
    justifyContent: "center",
    marginBottom: spacing.md,
    minHeight: 40,
    minWidth: 280,
    paddingHorizontal: spacing.md,
  },
  datePillCompact: {
    minWidth: 0,
  },
  fixedFooter: {
    alignSelf: "center",
    left: 0,
    maxWidth: layout.contentMaxWidth,
    paddingHorizontal: layout.screenPaddingH,
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
    marginBottom: spacing.sm,
    paddingHorizontal: 0,
  },
  miniLabel: {
    marginBottom: 2,
  },
  portalArt: {
    borderColor: colors.borderSoft,
    borderRadius: 10,
    borderWidth: 1,
    height: 82,
    overflow: "hidden",
    width: 96,
  },
  questCard: {
    backgroundColor: colors.surfaceDeep,
    borderColor: colors.borderSoft,
    marginTop: 12,
    overflow: "hidden",
  },
  questCardExpanded: {
    backgroundColor: colors.surfaceCard,
  },
  questCopy: {
    flex: 1,
    minWidth: 0,
  },
  questHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 64,
    paddingHorizontal: spacing.md,
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
  questSectionTitle: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
    marginBottom: 2,
  },
  screen: {
    flex: 1,
  },
  taskDate: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.xs,
    justifyContent: "flex-end",
    minWidth: 70,
  },
  taskList: {
    borderTopColor: colors.borderSoft,
    borderTopWidth: 1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
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
  weeklyBar: {
    marginTop: 13,
  },
  weeklyCard: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.xs,
    overflow: "hidden",
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
});
