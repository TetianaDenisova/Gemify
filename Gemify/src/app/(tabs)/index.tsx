import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback } from "react";
import { StyleSheet, View } from "react-native";

import { DayCompleteCard, GoalCard, HomeHeader } from "@/components/home";
import { BlockIconArt } from "@/components/TimeBlockTabs";
import type { Goal, GoalIconKey, GoalImageKey, ThemeColor } from "@/data/homeData";
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
} from "@/shared/components";
import { colors } from "@/theme/colors";
import { radius, spacing } from "@/theme/theme";
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
  { themeColor: "gold", imageKey: "mountain_sunrise", iconKey: "spark" },
  { themeColor: "purple", imageKey: "sailboat_sunset", iconKey: "lotus" },
  { themeColor: "purple", imageKey: "balloon_mountains", iconKey: "mountains" },
];

function toGoal(dream: DreamSummary, index: number): Goal {
  const visuals = GOAL_VISUALS[index % GOAL_VISUALS.length];
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

  // Current focus = the sprint quests scheduled into the time block that
  // matches the clock right now, plus today's Anytime (flexible) quests and
  // today's habits — always shown, ordered after the timed quests.
  const focusKey = currentBlockKey(blocks, new Date());
  const focusBlock =
    blocks.find((block) => block.key === focusKey) ?? blocks[0];
  const flexibleBlock = blocks.find((block) => block.time === "Flexible");

  // Monday-first index of today, matching the habit week arrays.
  const habitDayIndex = (new Date().getDay() + 6) % 7;
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
      subtitle: view.timeLabel,
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

  const hasFocus = currentBlock !== undefined && currentBlock.actions.length > 0;

  // Everything planned for today (all time blocks' quests + today's habits)
  // is checked off — celebrate instead of nudging to plan.
  const habitsDone = habitActions.filter((action) => action.done).length;
  const plannedTotal = totalQuests + habitActions.length;
  const plannedDone = completedQuests + habitsDone;
  const allDone = plannedTotal > 0 && plannedDone === plannedTotal;

  // Current block clear but open quests remain elsewhere today: surface the
  // block that goes next (the nearest upcoming one, else earlier leftovers).
  const now = new Date();
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

      {dreams.map((dream, index) => (
        <GoalCard
          goal={toGoal(dream, index)}
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
        <Card style={styles.emptyCard}>
          <AppText align="center" variant="cardTitle">
            Start your first journey
          </AppText>
          <AppText align="center" style={styles.emptyText} variant="bodySmall">
            Name the dream you want to live, and we will turn it into a path of
            milestones.
          </AppText>
          <View style={styles.emptyButton}>
            <AppButton
              label="Create a dream"
              onPress={() => router.push("/create-goal")}
              variant="primary"
            />
          </View>
        </Card>
      ) : null}

      <SectionHeader
        style={styles.sectionHeader}
        // The planning nudge only appears when nothing at all is planned for
        // today; otherwise the section names what it shows: the current
        // focus (open or complete) or the block that goes next.
        title={
          hasFocus || allDone
            ? "CURRENT FOCUS"
            : nextBlock
              ? "LATER TODAY"
              : "PLAN YOUR WEEK"
        }
        variant="eyebrow"
      />

      {allDone ? (
        <View style={styles.currentBlock}>
          <DayCompleteCard completed={plannedDone} total={plannedTotal} />
        </View>
      ) : hasFocus && currentBlock ? (
        <View style={styles.currentBlock}>
          {currentBlock.actions.map((action) => (
            <Card
              key={"questId" in action ? `q${action.questId}` : `h${action.habitId}`}
              style={styles.focusCard}
            >
              <View style={styles.focusRow}>
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
                  size={44}
                />
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
                    <AppText
                      color={colors.textSecondary}
                      style={styles.focusSubtitle}
                      variant="subtitle"
                    >
                      {action.subtitle}
                    </AppText>
                  ) : null}
                </View>
              </View>
            </Card>
          ))}
        </View>
      ) : nextBlock ? (
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
      ) : (
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
              A few focused steps can move{"\n"}your dreams forward.
            </AppText>
            <AppButton
              icon={<ArrowRightIcon size={20} />}
              label="Plan my week"
              onPress={() => router.push("/sprint")}
              style={styles.nextMoveButton}
              variant="secondary"
            />
          </View>
        </Card>
      )}
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  currentBlock: {
    marginBottom: spacing.md,
  },
  emptyButton: {
    alignItems: "center",
    marginTop: spacing.md,
  },
  emptyCard: {
    marginBottom: spacing.sm,
    paddingVertical: spacing.lg,
  },
  emptyText: {
    marginTop: spacing.sm,
  },
  focusBreadcrumb: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.xs + 2,
    marginTop: spacing.xs + 2,
  },
  /** Gold-edged card per focus action, per the mock. */
  focusCard: {
    borderLeftColor: colors.primary,
    borderLeftWidth: 3,
    marginBottom: spacing.md,
  },
  focusCopy: {
    flex: 1,
    minWidth: 0,
  },
  focusRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.lg,
  },
  focusSubtitle: {
    marginTop: spacing.xs,
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
