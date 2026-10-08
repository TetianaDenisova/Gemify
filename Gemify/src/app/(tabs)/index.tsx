import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useMemo } from "react";
import { StyleSheet, View } from "react-native";

import { DayActionCard, DayActionList } from "@/components/DayActionCard";
import { HabitActionRow } from "@/components/HabitActionRow";
import { QuestActionRow } from "@/components/QuestActionRow";
import { DayCompleteCard, GoalCard, HomeHeader } from "@/components/home";
import { BlockIconArt } from "@/components/TimeBlockTabs";
import { habitVisualsFor } from "@/data/habitVisuals";
import type { Goal, GoalIconKey, GoalImageKey, ThemeColor } from "@/data/homeTypes";
import type { DreamSummary } from "@/db";
import { useCloudSync } from "@/hooks/useCloudSync";
import { useLayoutSize } from "@/hooks/useLayoutSize";
import { habitIconForId } from "@/hooks/useDayHabits";
import { currentBlockKey, useDayQuestBlocks } from "@/hooks/useDayQuestBlocks";
import { useDreamSummaries } from "@/hooks/useDreamSummaries";
import { useHabitWeek } from "@/hooks/useHabitWeek";
import {
  AppButton,
  AppText,
  ArrowRightIcon,
  Badge,
  Card,
  ChevronIcon,
  DreamIcon,
  IconButton,
  MilestoneIcon,
  PlusIcon,
  ScreenScaffold,
  SectionHeader,
  SparkIcon,
  SyncIcon,
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
  const { phone } = useLayoutSize();
  const today = todayKey();
  const { dreams, loading, refresh: refreshDreams } = useDreamSummaries();
  const { blocks, completedQuests, toggleQuest, totalQuests } =
    useDayQuestBlocks(today);

  const { habits: habitViews, setCompletion } = useHabitWeek();
  const cloudSync = useCloudSync();


  // The whole focus/next-block derivation is pure computation over the loaded
  // data — memoized so it doesn't re-run (with fresh Dates and array churn)
  // on every unrelated re-render.
  const {
    allDone,
    currentBlock,
    gainedPercent,
    hasFocus,
    laterBlocks,
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
    const todaysHabitViews = habitViews.filter(
      (view) =>
        view.scheduleDays.length === 0 ||
        view.scheduleDays.includes(habitDayIndex),
    );
    const toHabitAction = (
      view: (typeof habitViews)[number],
      overdue = false,
    ) => ({
      cue: view.habit.cue,
      done: view.weekProgress[habitDayIndex] === "done",
      habitId: view.habit.id,
      icon: habitIconForId(view.habit.id),
      // The dream this habit supports — habit rows show it where quest rows
      // show their dream › milestone breadcrumb.
      subtitle:
        dreams.find((dream) => dream.id === view.habit.dreamId)?.title ?? "",
      streakDays: view.streakDays,
      title: view.habit.title,
      visuals: habitVisualsFor(view.habit),
      overdue,
    });
    // Every habit scheduled today, for the day's completion math.
    const habitActions = todaysHabitViews.map((view) => toHabitAction(view));
    // Only habits whose time block is the current focus join the focus list;
    // "Anytime" habits (no block, or the flexible block) fit any moment.
    const overdueBlockKeys = new Set(
      focusBlock?.time === "Flexible"
        ? []
        : blocks
            .filter(
              (block) =>
                block.time !== "Flexible" &&
                focusBlock !== undefined &&
                block.time < focusBlock.time,
            )
            .map((block) => block.key),
    );
    const focusHabitActions = todaysHabitViews
      .filter(
        (view) =>
          view.habit.timeOfDay === null ||
          view.habit.timeOfDay === flexibleBlock?.key ||
          view.habit.timeOfDay === focusBlock?.key ||
          (view.habit.timeOfDay !== null &&
            overdueBlockKeys.has(view.habit.timeOfDay)),
      )
      .map((view) =>
        toHabitAction(
          view,
          view.habit.timeOfDay !== null &&
            overdueBlockKeys.has(view.habit.timeOfDay),
        ),
      );

    const overdueQuestActions = blocks.flatMap((block) =>
      overdueBlockKeys.has(block.key)
        ? block.actions.map((action) => ({ ...action, overdue: true }))
        : [],
    );
    const currentQuestActions = focusBlock
      ? focusBlock.actions.map((action) => ({ ...action, overdue: false }))
      : [];
    const flexibleQuestActions =
      flexibleBlock && flexibleBlock.key !== focusBlock?.key
        ? flexibleBlock.actions.map((action) => ({ ...action, overdue: false }))
        : [];
    const questActions = [
      ...overdueQuestActions,
      ...currentQuestActions,
      ...flexibleQuestActions,
    ];
    // Checked-off actions leave the focus list.
    const focusActions = [...questActions, ...focusHabitActions].filter(
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

    // Everything still waiting later today outside the current focus. Earlier
    // leftovers have already been promoted into focus as overdue actions.
    const clock = `${String(now.getHours()).padStart(2, "0")}:${String(
      now.getMinutes(),
    ).padStart(2, "0")}`;
    // Open habits grouped under their (non-focus, timed) block, so they wait
    // under "Later today" exactly like the block's quests.
    const laterHabitsByBlock = new Map<
      string,
      ReturnType<typeof toHabitAction>[]
    >();
    for (const view of todaysHabitViews) {
      const blockKey = view.habit.timeOfDay;
      if (
        blockKey === null ||
        blockKey === flexibleBlock?.key ||
        blockKey === focusBlock?.key ||
        overdueBlockKeys.has(blockKey)
      ) {
        continue;
      }
      const action = toHabitAction(view);
      if (action.done) continue;
      const list = laterHabitsByBlock.get(blockKey) ?? [];
      list.push(action);
      laterHabitsByBlock.set(blockKey, list);
    }
    const laterBlocks = blocks
      .filter(
        (block) =>
          block.key !== focusBlock?.key &&
          block.time !== "Flexible" &&
          block.time > clock,
      )
      .map((block) => ({
        ...block,
        actions: [
          ...block.actions.filter((action) => !action.done),
          ...(laterHabitsByBlock.get(block.key) ?? []),
        ],
        upcoming: block.time > clock,
      }))
      .filter((block) => block.actions.length > 0)
      .sort((a, b) => {
        if (a.upcoming !== b.upcoming) return a.upcoming ? -1 : 1;
        return a.time < b.time ? -1 : 1;
      });

    return {
      allDone,
      currentBlock,
      gainedPercent,
      hasFocus,
      laterBlocks,
      showCelebration,
    };
  }, [blocks, habitViews, dreams, completedQuests, totalQuests]);

  // Future actions remain visible even while the current focus has work. The
  // blocks are loaded for `today`, so tomorrow's plan never enters this list.
  const showLater = laterBlocks.length > 0;

  const focusActions = currentBlock?.actions ?? [];

  return (
    <ScreenScaffold tabClearance topInset>
      <HomeHeader
        action={
          // Only an invitation to connect: once the device is signed in the
          // syncing is automatic, and Cloud sync stays in the ⋮ menu.
          cloudSync.ready && !cloudSync.signedIn ? (
            <IconButton
              accessibilityLabel="Set up cloud sync"
              icon={<SyncIcon />}
              onPress={() => router.push("/cloud-sync")}
            />
          ) : undefined
        }
        greeting={greetingForNow(new Date())}
      />

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
            : showLater
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
        <DayActionList style={styles.currentBlock}>
          {focusActions.map((action) => (
            <DayActionCard
              done={action.done}
              key={"questId" in action ? `q${action.questId}` : `h${action.habitId}`}
            >
              {"questId" in action ? (
                <QuestActionRow
                  done={action.done}
                  dreamTitle={action.dreamTitle}
                  last
                  onToggle={() => {
                    toggleQuest(action.questId, !action.done).then(refreshDreams);
                  }}
                  progressPercent={action.progressPercent}
                  title={action.title}
                />
              ) : (
                <HabitActionRow
                  done={action.done}
                  last
                  onToggle={() =>
                    setCompletion(
                      action.habitId,
                      today,
                      action.done ? null : "done",
                    )
                  }
                  streakDays={action.streakDays}
                  subtitle={action.cue || action.subtitle}
                  title={action.title}
                />
              )}
            </DayActionCard>
          ))}
        </DayActionList>
      ) : null}

      {showLater ? (
        <>
          {/* Current focus (or its celebration) already owns the first heading,
              so a following future list needs its own. */}
          {hasFocus || showCelebration ? (
            <>
              {phone ? null : (
                <View style={styles.laterDivider}>
                  <View style={styles.laterDividerLine} />
                  <SparkIcon color={colors.accentViolet} size={14} />
                  <View style={styles.laterDividerLine} />
                </View>
              )}
              <SectionHeader
                style={styles.sectionHeader}
                title="LATER TODAY"
                variant="eyebrow"
              />
            </>
          ) : null}
          {laterBlocks.map((block) => (
            <View key={block.key} style={[styles.currentBlock, styles.laterRow]}>
              <View style={styles.laterBadge}>
                <BlockIconArt
                  color={LATER_COLORS.icon}
                  icon={block.icon}
                  size={phone ? 22 : 26}
                />
              </View>
              <View style={styles.laterCopy}>
                <View style={styles.laterTitleRow}>
                  <AppText color={LATER_COLORS.label} variant="controlLabel">
                    {block.label}
                  </AppText>
                  <AppText color={LATER_COLORS.crumb} variant="controlLabel">
                    ·
                  </AppText>
                  <AppText color={LATER_COLORS.time} variant="controlLabel">
                    {block.time}
                  </AppText>
                </View>
                {/* Quests and habits share one muted row: nothing here is
                    actionable yet, so nothing gets an active treatment. */}
                {block.actions.map((action, index) => (
                  <View
                    key={
                      "questId" in action
                        ? `q${action.questId}`
                        : `h${action.habitId}`
                    }
                    style={index > 0 ? styles.laterActionSpacing : undefined}
                  >
                    <View style={styles.laterActionTitleRow}>
                      <AppText
                        color={LATER_COLORS.title}
                        numberOfLines={phone ? undefined : 2}
                        style={[
                          styles.laterQuestTitle,
                          styles.laterActionTitleText,
                        ]}
                        variant="body"
                      >
                        {action.title}
                      </AppText>
                      {"questId" in action ? null : (
                        <Badge
                          color={LATER_COLORS.time}
                          label="HABIT"
                          style={styles.habitBadge}
                          textStyle={styles.habitBadgeText}
                        />
                      )}
                    </View>
                    <View style={styles.laterBreadcrumb}>
                      <DreamIcon color={LATER_COLORS.icon} size={16} />
                      <AppText
                        color={LATER_COLORS.crumb}
                        numberOfLines={1}
                        style={styles.laterCrumbLabel}
                        variant="subtitle"
                      >
                        {"questId" in action
                          ? action.dreamTitle
                          : action.subtitle}
                      </AppText>
                      {"questId" in action && !phone ? (
                        <>
                          <ChevronIcon
                            color={LATER_COLORS.crumb}
                            direction="right"
                            size={13}
                          />
                          <MilestoneIcon
                            color={LATER_COLORS.icon}
                            size={16}
                          />
                          <AppText
                            color={LATER_COLORS.crumb}
                            numberOfLines={1}
                            style={styles.laterCrumbLabel}
                            variant="subtitle"
                          >
                            {action.milestoneTitle}
                          </AppText>
                        </>
                      ) : null}
                    </View>
                  </View>
                ))}
              </View>
              {/* A status word for a row whose time is printed above it —
                  ~90 pt of a 370 pt row buys nothing on a phone. */}
              {phone ? null : (
                <View style={styles.upcomingPill}>
                  <AppText color={LATER_COLORS.pillText} variant="labelStrong">
                    {block.upcoming ? "Upcoming" : "Waiting"}
                  </AppText>
                </View>
              )}
            </View>
          ))}
        </>
      ) : null}

      {!hasFocus && !showCelebration && !showLater ? (
        <NextMoveCard
          buttonLabel="Plan my week"
          message={"A few focused steps can move\nyour dreams forward."}
          onPress={() => router.navigate("/sprint")}
        />
      ) : null}
        </>
      ) : null}
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  currentBlock: {
    marginBottom: spacing.md,
  },
  /** Compact outlined HABIT tag beside the habit's name. */
  habitBadge: {
    minHeight: 0,
    paddingVertical: 2,
  },
  habitBadgeText: {
    letterSpacing: 1,
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
  /** Breathing room between stacked quests inside one Later-today block. */
  laterActionSpacing: {
    marginTop: spacing.sm,
  },
  laterActionTitleRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  laterActionTitleText: {
    flexShrink: 1,
  },
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
