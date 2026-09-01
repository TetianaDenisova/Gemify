import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useMemo } from "react";
import { StyleSheet, View } from "react-native";

import { DayCompleteCard, GoalCard, HomeHeader } from "@/components/home";
import { BlockIconArt } from "@/components/TimeBlockTabs";
import type { Goal, GoalIconKey, GoalImageKey, ThemeColor } from "@/data/homeTypes";
import { rolloverOverdueQuests, type DreamSummary } from "@/db";
import type { ActionIcon } from "@/dto/timeBlocks";
import { currentBlockKey, useDayQuestBlocks } from "@/hooks/useDayQuestBlocks";
import { useDreamSummaries } from "@/hooks/useDreamSummaries";
import { useHabitWeek } from "@/hooks/useHabitWeek";
import {
  AppButton,
  AppText,
  ArrowRightIcon,
  Card,
  Checkbox,
  ChevronIcon,
  DreamIcon,
  MilestoneIcon,
  PlusIcon,
  ScreenScaffold,
  SectionHeader,
  SparkIcon,
} from "@/shared/components";
import { colors } from "@/theme/colors";
import { radius, shadowStyle, spacing } from "@/theme/theme";
import { todayKey } from "@/utils/dates";

// Same enchanted-forest path art as the Milestone Quests hero.
const NEXT_MOVE_ART = require("../../data/images/tree-milestone-header.png");

/** Left-to-right shade so the copy reads over the art's dark edge. */
const NEXT_MOVE_SHADE = [
  "rgba(4, 7, 17, 0.98)",
  "rgba(4, 7, 17, 0.74)",
  "rgba(4, 7, 17, 0.12)",
] as const;

/** Bespoke muted palette of the Later-today row, matched to the mock. */
const LATER_COLORS = {
  badgeBorder: "#4C4763",
  crumb: "#90909A",
  icon: "#9D95BA",
  label: "#9089A9",
  pillBorder: "#3C4150",
  pillText: "#A6A6AF",
  time: "#967E42",
  title: "#C7C6CD",
} as const;

/** Shared art card for empty states: forest art, shade, message, one CTA. */
function NextMoveCard({
  buttonLabel,
  message,
  onPress,
}: {
  buttonLabel: string;
  message: string;
  onPress: () => void;
}) {
  return (
    <Card padded={false} style={[styles.currentBlock, styles.nextMoveCard]}>
      <Image
        contentFit="cover"
        source={NEXT_MOVE_ART}
        style={styles.nextMoveArt}
      />
      <LinearGradient
        colors={[...NEXT_MOVE_SHADE]}
        end={{ x: 1, y: 0.5 }}
        start={{ x: 0, y: 0.5 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.nextMoveCopy}>
        <AppText color={colors.textPrimary} variant="body">
          {message}
        </AppText>
        <AppButton
          icon={<ArrowRightIcon size={20} />}
          label={buttonLabel}
          onPress={onPress}
          style={styles.nextMoveButton}
          variant="secondary"
        />
      </View>
    </Card>
  );
}

function greetingForNow(now: Date): string {
  const hour = now.getHours();
  if (hour < 12) return "Good morning ✦";
  if (hour < 18) return "Good afternoon ✦";
  return "Good evening ✦";
}

/** Dream-magic icon variety for habit rows, stable per habit id. */
const HABIT_ICONS: readonly ActionIcon[] = [
  "moon",
  "crystal",
  "feather",
  "star",
  "wand",
  "key",
];

const GOAL_VISUALS: readonly {
  themeColor: ThemeColor;
  imageKey: GoalImageKey;
  iconKey: GoalIconKey;
}[] = [
    { themeColor: "gold", imageKey: "dream_bg_5", iconKey: "spark" },
    { themeColor: "purple", imageKey: "dream_bg_8", iconKey: "lotus" },
    { themeColor: "gold", imageKey: "dream_bg_2", iconKey: "spark" },
    { themeColor: "purple", imageKey: "dream_bg_7", iconKey: "lotus" },
    { themeColor: "gold", imageKey: "dream_bg_9", iconKey: "mountains" },
    { themeColor: "purple", imageKey: "dream_bg_4", iconKey: "spark" },
    { themeColor: "gold", imageKey: "dream_bg_10", iconKey: "lotus" },
    { themeColor: "purple", imageKey: "dream_bg_1", iconKey: "mountains" },
];

function toGoal(dream: DreamSummary): Goal {
  // Keyed by the dream's id (not its list position) so a dream keeps its art
  // when other dreams are added or archived.
  const visuals = GOAL_VISUALS[dream.id % GOAL_VISUALS.length];
  return {
    id: String(dream.id),
    title: dream.title,
    progressPercent: dream.progressPercent,
    ...visuals,
  };
}

export default function HomeScreen() {
  const router = useRouter();
  const today = todayKey();
  const { dreams, loading } = useDreamSummaries();
  const { blocks, completedQuests, toggleQuest, totalQuests } =
    useDayQuestBlocks(today);

  const { habits: habitViews, setCompletion } = useHabitWeek();

  // Quests scheduled before today that never got done roll back into the
  // weekly backlog, so yesterday's leftovers wait under "Unscheduled this
  // week" on the Weekly Plan instead of silently staying on past days.
  useFocusEffect(
    useCallback(() => {
      rolloverOverdueQuests(today).catch((cause: unknown) => {
        console.error("Failed to roll over overdue quests", cause);
      });
    }, [today]),
  );

  // The whole focus/next-block derivation is pure computation over the loaded
  // data — memoized so it doesn't re-run (with fresh Dates and array churn)
  // on every unrelated re-render.
  const {
    allDone,
    currentBlock,
    gainedPercent,
    hasFocus,
    nextBlock,
    showCelebration,
  } = useMemo(() => {
    const now = new Date();

    // Current focus = the sprint quests scheduled into the time block that
    // matches the clock right now, plus today's Anytime (flexible) quests and
    // today's habits — always shown, ordered after the timed quests.
    const focusKey = currentBlockKey(blocks, now);
    const focusBlock =
      blocks.find((block) => block.key === focusKey) ?? blocks[0];
    const flexibleBlock = blocks.find((block) => block.time === "Flexible");

    // Monday-first index of today, matching the habit week arrays.
    const habitDayIndex = (now.getDay() + 6) % 7;
    const habitActions = habitViews
      .filter(
        (view) =>
          view.scheduleDays.length === 0 ||
          view.scheduleDays.includes(habitDayIndex),
      )
      .map((view) => ({
        done: view.weekProgress[habitDayIndex] === "done",
        habitId: view.habit.id,
        icon: HABIT_ICONS[view.habit.id % HABIT_ICONS.length],
        // The dream this habit supports — habit rows show it where quest rows
        // show their dream › milestone breadcrumb.
        subtitle:
          dreams.find((dream) => dream.id === view.habit.dreamId)?.title ?? "",
        title: view.habit.title,
      }));

    const questActions = focusBlock
      ? flexibleBlock && flexibleBlock.key !== focusBlock.key
        ? [...focusBlock.actions, ...flexibleBlock.actions]
        : focusBlock.actions
      : [];
    // Checked-off actions leave the focus list.
    const focusActions = [...questActions, ...habitActions].filter(
      (action) => !action.done,
    );
    const currentBlock = focusBlock
      ? { ...focusBlock, actions: focusActions }
      : focusBlock;

    const hasFocus =
      currentBlock !== undefined && currentBlock.actions.length > 0;

    // Everything planned for today (all time blocks' quests + today's habits)
    // is checked off — celebrate instead of nudging to plan.
    const habitsDone = habitActions.filter((action) => action.done).length;
    const plannedTotal = totalQuests + habitActions.length;
    const plannedDone = completedQuests + habitsDone;
    const allDone = plannedTotal > 0 && plannedDone === plannedTotal;

    // The current focus is clear and something got done — celebrate "so far",
    // with the dream % today's completed quests earned across all blocks.
    const showCelebration = !hasFocus && plannedDone > 0;
    const gainedPercent = blocks.reduce(
      (sum, block) =>
        sum +
        block.actions.reduce(
          (acc, action) => acc + (action.done ? action.progressPercent : 0),
          0,
        ),
      0,
    );

    // Current block clear but open quests remain elsewhere today: surface the
    // block that goes next (the nearest upcoming one, else earlier leftovers).
    const clock = `${String(now.getHours()).padStart(2, "0")}:${String(
      now.getMinutes(),
    ).padStart(2, "0")}`;
    const openBlocks = blocks
      .filter((block) => block.actions.some((action) => !action.done))
      .map((block) => ({
        ...block,
        actions: block.actions.filter((action) => !action.done),
      }));
    const nextBlock =
      !hasFocus && !allDone
        ? (openBlocks
          .filter((block) => block.time !== "Flexible" && block.time > clock)
          .sort((a, b) => (a.time < b.time ? -1 : 1))[0] ?? openBlocks[0])
        : undefined;

    return {
      allDone,
      currentBlock,
      gainedPercent,
      hasFocus,
      nextBlock,
      showCelebration,
    };
  }, [blocks, habitViews, dreams, completedQuests, totalQuests]);

  return (
    <ScreenScaffold tabClearance topInset>
      <HomeHeader greeting={greetingForNow(new Date())} />

      <SectionHeader
        action={{
          icon: <PlusIcon size={14} />,
          label: "Add Goal",
          onPress: () => router.push("/create-goal"),
        }}
        style={styles.sectionHeader}
        title="YOUR GOALS"
        variant="eyebrow"
      />

      {dreams.map((dream) => (
        <GoalCard
          goal={toGoal(dream)}
          key={dream.id}
          onPress={() =>
            router.push({
              pathname: "/journey-map",
              params: { dreamId: String(dream.id) },
            })
          }
        />
      ))}

      {!loading && dreams.length === 0 ? (
        <NextMoveCard
          buttonLabel="Create a dream"
          message={"Name the dream you want to live,\nand we will map the path."}
          onPress={() => router.push("/create-goal")}
        />
      ) : null}

      {/* Without a dream there is nothing to focus on or plan — the whole
          section stays hidden until the first dream exists. */}
      {dreams.length > 0 ? (
        <>
      <SectionHeader
        style={styles.sectionHeader}
        // The planning nudge only appears when nothing at all is planned for
        // today; otherwise the section names what it shows: the current
        // focus (open or celebrated) or the block that goes next.
        title={
          hasFocus || showCelebration
            ? "CURRENT FOCUS"
            : nextBlock
              ? "LATER TODAY"
              : "PLAN YOUR WEEK"
        }
        variant="eyebrow"
      />

      {showCelebration ? (
        <View style={styles.currentBlock}>
          <DayCompleteCard
            gainedPercent={gainedPercent}
            subtitle={
              allDone
                ? "Every quest planned for today is complete."
                : "Every quest so far is complete."
            }
          />
        </View>
      ) : null}

      {hasFocus && currentBlock ? (
        <View style={styles.currentBlock}>
          <Card padded={false} style={styles.focusCard}>
            {currentBlock.actions.map((action, index) => (
              <View
                key={"questId" in action ? `q${action.questId}` : `h${action.habitId}`}
                style={[styles.focusRow, index > 0 && styles.focusRowDivider]}
              >
                <View style={styles.focusMedallion}>
                  <SparkIcon color={colors.primary} size={22} />
                </View>
                <View style={styles.focusCopy}>
                  <AppText numberOfLines={2} variant="pill">
                    {action.title}
                  </AppText>
                  {"questId" in action ? (
                    <View style={styles.focusBreadcrumb}>
                      <DreamIcon size={16} />
                      <AppText
                        color={LATER_COLORS.label}
                        numberOfLines={1}
                        style={styles.laterCrumbLabel}
                        variant="subtitle"
                      >
                        {action.dreamTitle}
                      </AppText>
                      <ChevronIcon
                        color={colors.textMuted}
                        direction="right"
                        size={13}
                      />
                      <AppText
                        color={colors.primarySoft}
                        numberOfLines={1}
                        style={styles.laterCrumbLabel}
                        variant="subtitle"
                      >
                        {action.milestoneTitle}
                      </AppText>
                    </View>
                  ) : action.subtitle ? (
                    <View style={styles.focusBreadcrumb}>
                      <DreamIcon size={16} />
                      <AppText
                        color={LATER_COLORS.label}
                        numberOfLines={1}
                        style={styles.laterCrumbLabel}
                        variant="subtitle"
                      >
                        {action.subtitle}
                      </AppText>
                    </View>
                  ) : null}
                </View>
                {"questId" in action ? (
                  <AppText color={colors.primary} variant="cardTitle">
                    +{Math.max(1, Math.round(action.progressPercent))}%
                  </AppText>
                ) : null}
                <Checkbox
                  accessibilityLabel={`Mark ${action.title} done`}
                  checked={action.done}
                  onPress={() => {
                    if ("questId" in action) {
                      toggleQuest(action.questId, !action.done);
                    } else {
                      setCompletion(
                        action.habitId,
                        today,
                        action.done ? null : "done",
                      );
                    }
                  }}
                  shape="circle"
                  size={40}
                />
              </View>
            ))}
          </Card>
        </View>
      ) : nextBlock ? (
        <>
          {showCelebration ? (
            <>
              <View style={styles.laterDivider}>
                <View style={styles.laterDividerLine} />
                <SparkIcon color={colors.accentViolet} size={14} />
                <View style={styles.laterDividerLine} />
              </View>
              <SectionHeader
                style={styles.sectionHeader}
                title="LATER TODAY"
                variant="eyebrow"
              />
            </>
          ) : null}
        <View style={[styles.currentBlock, styles.laterRow]}>
          <View style={styles.laterBadge}>
            <BlockIconArt
              color={LATER_COLORS.icon}
              icon={nextBlock.icon}
              size={26}
            />
          </View>
          <View style={styles.laterCopy}>
            <View style={styles.laterTitleRow}>
              <AppText color={LATER_COLORS.label} variant="controlLabel">
                {nextBlock.label}
              </AppText>
              {nextBlock.time !== "Flexible" ? (
                <>
                  <AppText color={LATER_COLORS.crumb} variant="controlLabel">
                    ·
                  </AppText>
                  <AppText color={LATER_COLORS.time} variant="controlLabel">
                    {nextBlock.time}
                  </AppText>
                </>
              ) : null}
            </View>
            <AppText
              color={LATER_COLORS.title}
              numberOfLines={2}
              style={styles.laterQuestTitle}
              variant="body"
            >
              {nextBlock.actions[0]?.title}
            </AppText>
            <View style={styles.laterBreadcrumb}>
              <DreamIcon color={LATER_COLORS.icon} size={16} />
              <AppText
                color={LATER_COLORS.crumb}
                numberOfLines={1}
                style={styles.laterCrumbLabel}
                variant="subtitle"
              >
                {nextBlock.actions[0]?.dreamTitle}
              </AppText>
              <ChevronIcon
                color={LATER_COLORS.crumb}
                direction="right"
                size={13}
              />
              <MilestoneIcon color={LATER_COLORS.icon} size={16} />
              <AppText
                color={LATER_COLORS.crumb}
                numberOfLines={1}
                style={styles.laterCrumbLabel}
                variant="subtitle"
              >
                {nextBlock.actions[0]?.milestoneTitle}
              </AppText>
            </View>
          </View>
          <View style={styles.upcomingPill}>
            <AppText color={LATER_COLORS.pillText} variant="labelStrong">
              Upcoming
            </AppText>
          </View>
        </View>
        </>
      ) : showCelebration ? null : (
        <NextMoveCard
          buttonLabel="Plan my week"
          message={"A few focused steps can move\nyour dreams forward."}
                  onPress={() => router.navigate("/sprint")}
        />
      )}
        </>
      ) : null}
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  currentBlock: {
    marginBottom: spacing.md,
  },
  focusBreadcrumb: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.xs + 2,
    marginTop: spacing.xs + 2,
  },
  /** One card holds every focus action, rows split by faint dividers. */
  focusCard: {
    marginBottom: spacing.md,
  },
  focusCopy: {
    flex: 1,
    minWidth: 0,
  },
  /** Dark gold-ringed disc with the spark, standing in for the quest icon. */
  focusMedallion: {
    alignItems: "center",
    backgroundColor: colors.surfaceDeep,
    borderColor: "rgba(245, 184, 75, 0.55)",
    borderRadius: radius.round,
    borderWidth: 1,
    height: 44,
    justifyContent: "center",
    width: 44,
    ...shadowStyle({
      color: colors.primary,
      elevation: 5,
      opacity: 0.3,
      radius: 9,
    }),
  },
  focusRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  focusRowDivider: {
    borderTopColor: colors.borderFaint,
    borderTopWidth: 1,
  },
  sectionHeader: {
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  upcomingPill: {
    alignSelf: "center",
    borderColor: LATER_COLORS.pillBorder,
    borderRadius: radius.round,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  /** Quiet variant of the time-block disc, matched to the mock. */
  laterBadge: {
    alignItems: "center",
    backgroundColor: "rgba(24, 14, 42, 0.7)",
    borderColor: LATER_COLORS.badgeBorder,
    borderRadius: radius.round,
    borderWidth: 1,
    height: 56,
    justifyContent: "center",
    width: 56,
  },
  laterBreadcrumb: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.xs + 2,
    marginTop: spacing.sm,
  },
  laterCopy: {
    flex: 1,
    minWidth: 0,
  },
  laterCrumbLabel: {
    flexShrink: 1,
  },
  laterDivider: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.lg,
    marginTop: spacing.sm,
  },
  laterDividerLine: {
    backgroundColor: colors.borderSoft,
    flex: 1,
    height: 1,
  },
  laterQuestTitle: {
    marginTop: spacing.xs,
  },
  laterRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  laterTitleRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  nextMoveArt: {
    ...StyleSheet.absoluteFill,
  },
  nextMoveButton: {
    backgroundColor: colors.transparent,
    borderRadius: radius.round,
  },
  nextMoveCard: {
    minHeight: 180,
    overflow: "hidden",
  },
  nextMoveCopy: {
    alignItems: "flex-start",
    flex: 1,
    gap: spacing.lg,
    justifyContent: "center",
    maxWidth: "68%",
    padding: spacing.lg,
    zIndex: 1,
  },
});
