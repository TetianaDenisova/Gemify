import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import Svg, { Circle, Path, Rect } from "react-native-svg";

import { HabitItemCard } from "@/components/HabitItem";
import {
  AppButton,
  AppText,
  BackIcon,
  Badge,
  Card,
  Checkbox,
  ChevronIcon,
  ListItem,
  PlusIcon,
  ProgressRing,
  ScreenHeader,
  ScreenScaffold,
  SectionHeader,
  SparkIcon,
} from "@/shared/components";
import { colors } from "@/theme/colors";
import {
  controls,
  fontSizes,
  layout,
  lineHeights,
  pressed,
  spacing,
  typography,
} from "@/theme/theme";

const QUEST_HEADER_SOURCE = require("../../../assets/quest-header.png");

type Idea = {
  icon: "star" | "shirt" | "music" | "drop";
  score: number;
  title: string;
};

type QuestTask = {
  done: boolean;
  frequency: string;
  title: string;
};

type Quest = {
  color: string;
  icon: "spark" | "book" | "heart";
  meta: string;
  progress: number;
  status: string;
  subtitle: string;
  title: string;
};

const ideas: readonly Idea[] = [
  { icon: "star", score: 10, title: "Book a fitness coach call" },
  { icon: "shirt", score: 8, title: "Buy new workout clothes" },
  { icon: "music", score: 6, title: "Prepare your morning playlist" },
  { icon: "drop", score: 4, title: "Put water bottle on your desk" },
];

const questTasks: readonly QuestTask[] = [
  { done: false, frequency: "Daily", title: "Wake up at 6:00 AM" },
  { done: true, frequency: "10 min", title: "10 min meditation" },
  { done: false, frequency: "20 min workout", title: "Move my body" },
];

const identity: Quest = {
  color: "#FF5FA7",
  icon: "heart",
  meta: "2 / 5 actions    2 habits",
  progress: 46,
  status: "",
  subtitle: "Express myself clearly and calmly in any situation.",
  title: "Confident Communicator",
};

function MoreIcon({ color = colors.primary }: { color?: string }) {
  return (
    <Svg height={22} viewBox="0 0 24 24" width={22}>
      {[7, 12, 17].map((cx) => (
        <Circle cx={cx} cy={12} fill={color} key={cx} r={1.55} />
      ))}
    </Svg>
  );
}

function CalendarIcon({ color = colors.primary }: { color?: string }) {
  return (
    <Svg height={22} viewBox="0 0 24 24" width={22}>
      <Rect
        fill="none"
        height={15}
        rx={2}
        stroke={color}
        strokeWidth={1.5}
        width={18}
        x={3}
        y={5}
      />
      <Path
        d="M7 3v4M17 3v4M3 10h18"
        fill="none"
        stroke={color}
        strokeLinecap="round"
        strokeWidth={1.5}
      />
    </Svg>
  );
}

function ClockIcon() {
  return (
    <Svg height={18} viewBox="0 0 24 24" width={18}>
      <Circle
        cx={12}
        cy={12}
        fill="none"
        r={8}
        stroke={colors.textSecondary}
        strokeWidth={1.6}
      />
      <Path
        d="M12 8v5l3 2"
        fill="none"
        stroke={colors.textSecondary}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.6}
      />
    </Svg>
  );
}

function DragHandle() {
  return (
    <View style={styles.dragHandle}>
      {[0, 1, 2].map((row) => (
        <View key={row} style={styles.dragRow}>
          <View style={styles.dragDot} />
          <View style={styles.dragDot} />
        </View>
      ))}
    </View>
  );
}

function IdeaIcon({ icon }: { icon: Idea["icon"] }) {
  if (icon === "shirt") {
    return (
      <Svg height={29} viewBox="0 0 24 24" width={29}>
        <Path
          d="M8 4 5 6 2 9l3 4 2-1v8h10v-8l2 1 3-4-3-3-3-2c-1 2-7 2-8 0Z"
          fill="#C879FF"
        />
      </Svg>
    );
  }

  if (icon === "music") {
    return (
      <Svg height={29} viewBox="0 0 24 24" width={29}>
        <Path
          d="M9 18V6l10-2v12"
          fill="none"
          stroke="#D986FF"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2.3}
        />
        <Circle cx={6} cy={18} fill="#D986FF" r={3} />
        <Circle cx={16} cy={16} fill="#D986FF" r={3} />
      </Svg>
    );
  }

  if (icon === "drop") {
    return (
      <Svg height={29} viewBox="0 0 24 24" width={29}>
        <Path
          d="M12 3c4 5 6 8 6 11a6 6 0 0 1-12 0c0-3 2-6 6-11Z"
          fill="none"
          stroke="#7F91FF"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2.1}
        />
      </Svg>
    );
  }

  return (
    <Svg height={29} viewBox="0 0 24 24" width={29}>
      <Path
        d="m12 3 2.4 5.1 5.6.8-4 3.9.9 5.5-4.9-2.6-4.9 2.6.9-5.5-4-3.9 5.6-.8L12 3Z"
        fill="none"
        stroke={colors.primary}
        strokeLinejoin="round"
        strokeWidth={1.6}
      />
      <Path d="m12 8 1 2.3 2.5.4-1.8 1.7.4 2.5-2.1-1.2-2.1 1.2.4-2.5-1.8-1.7 2.5-.4L12 8Z" fill={colors.primary} />
    </Svg>
  );
}

function QuestIcon({ color, icon, size = 58 }: { color: string; icon: Quest["icon"]; size?: number }) {
  if (icon === "book") {
    return (
      <Svg height={size} viewBox="0 0 48 48" width={size}>
        <Path
          d="M9 12c7 0 11 2 15 7 4-5 8-7 15-7v24c-7 0-11 2-15 7-4-5-8-7-15-7V12Z"
          fill="none"
          stroke={color}
          strokeLinejoin="round"
          strokeWidth={3}
        />
        <Path d="M24 19v24" stroke={color} strokeLinecap="round" strokeWidth={3} />
      </Svg>
    );
  }

  if (icon === "heart") {
    return (
      <Svg height={size} viewBox="0 0 48 48" width={size}>
        <Path
          d="M24 40S9 31 9 18c0-6 8-10 15-2 7-8 15-4 15 2 0 13-15 22-15 22Z"
          fill={color}
        />
      </Svg>
    );
  }

  return (
    <Svg height={size} viewBox="0 0 48 48" width={size}>
      <Path
        d="M24 5 29 19 43 24 29 29 24 43 19 29 5 24 19 19 24 5Z"
        fill="none"
        stroke={color}
        strokeLinejoin="round"
        strokeWidth={2.3}
      />
      <Path d="M24 15 27 22 34 24 27 26 24 33 21 26 14 24 21 22 24 15Z" fill={color} />
    </Svg>
  );
}

function PillButton({
  color = colors.accentViolet,
  label,
  minWidth,
}: {
  color?: string;
  label: string;
  minWidth?: number;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      style={({ pressed: isPressed }) => [
        styles.pillButton,
        { borderColor: color, minWidth },
        isPressed && pressed,
      ]}
    >
      <AppText color={color} variant="pill">
        {label}
      </AppText>
    </Pressable>
  );
}

function GradientAction({ label }: { label: string }) {
  return (
    <AppButton
      icon={<SparkIcon color={colors.textOnPrimary} size={22} />}
      label={label}
      onPress={() => {}}
      variant="primary"
    />
  );
}

function IdeaRow({
  compact,
  idea,
  index,
}: {
  compact: boolean;
  idea: Idea;
  index: number;
}) {
  return (
    <View
      style={[
        styles.ideaRow,
        compact && styles.ideaRowCompact,
        index === ideas.length - 1 && styles.lastRow,
      ]}
    >
      <View style={styles.ideaIconFrame}>
        <IdeaIcon icon={idea.icon} />
      </View>
      <AppText
        numberOfLines={2}
        style={[styles.ideaTitle, compact && styles.ideaTitleCompact]}
        variant="button"
      >
        {idea.title}
      </AppText>
      <Badge
        label={String(idea.score)}
        style={[styles.scorePill, compact && styles.scorePillCompact]}
        textStyle={styles.scoreText}
      />
      <PillButton label="Approve" minWidth={compact ? 84 : 126} />
    </View>
  );
}

function TaskRow({ task }: { task: QuestTask }) {
  return (
    <ListItem
      leading={<Checkbox checked={task.done} shape="circle" size={36} />}
      style={styles.taskRow}
      subtitle={task.frequency}
      title={task.title}
      trailing={<DragHandle />}
    />
  );
}

function ActiveQuestCard({ compact }: { compact: boolean }) {
  return (
    <Card style={styles.activeQuestCard} variant="strong">
      <View
        style={[
          styles.activeQuestHeader,
          compact && styles.activeQuestHeaderCompact,
        ]}
      >
        <View style={styles.activeQuestProgressRing}>
          <ProgressRing
            backgroundColor={colors.surfaceDeep}
            color={colors.primary}
            size={74}
            strokeWidth={4}
            value={67}
          />
        </View>
        <View style={styles.activeQuestCopy}>
          <AppText variant="cardTitle">Morning routine mastery</AppText>
          <View style={styles.questMetaRow}>
            <View style={styles.metaItem}>
              <ClockIcon />
              <AppText variant="meta">2 / 3 tasks</AppText>
            </View>
            <AppText style={styles.metaSeparator}>|</AppText>
            <View style={styles.metaItem}>
              <CalendarIcon color={colors.textSecondary} />
              <AppText variant="meta">7 days active</AppText>
            </View>
          </View>
        </View>
        <PillButton label="Add to sprint" minWidth={compact ? 84 : 126} />
      </View>

      <Card padded={false} style={styles.taskList}>
        {questTasks.map((task) => (
          <TaskRow key={task.title} task={task} />
        ))}
        <Pressable
          accessibilityRole="button"
          style={({ pressed: isPressed }) => [styles.addTaskButton, isPressed && pressed]}
        >
          <PlusIcon color={colors.accentViolet} size={24} />
          <AppText color={colors.accentViolet} variant="button">
            Add Task
          </AppText>
        </Pressable>
      </Card>
    </Card>
  );
}

const dummyHabit = {
  accent: colors.primary,
  day: 12,
  goal: 24,
  icon: "workout" as const,
  progress: ["done", "done", "done", "missed", "open", "missed", "missed"] as const,
  time: "After work",
  title: "Workout",
};

function IdentityRow() {
  return (
    <Card style={styles.identityCard}>
      <View style={[styles.largeIconFrame, styles.identityIconFrame]}>
        <QuestIcon color={identity.color} icon={identity.icon} />
      </View>
      <View style={styles.identityCopy}>
        <AppText variant="cardTitle">{identity.title}</AppText>
        <AppText style={styles.identitySubtitle} variant="subtitle">
          {identity.subtitle}
        </AppText>
        <AppText style={styles.identityMeta} variant="meta">
          {identity.meta}
        </AppText>
      </View>
      <ProgressRing
        backgroundColor={colors.surfaceDeep}
        color={identity.color}
        size={86}
        strokeWidth={4}
        value={identity.progress}
      />
      <ChevronIcon direction="down" size={22} />
    </Card>
  );
}

export default function MilestoneQuestsScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isNarrow = width < layout.compactBreakpoint;

  return (
    <ScreenScaffold tabClearance topInset>
      <ScreenHeader
        buttonSize="md"
        leftAction={{
          accessibilityLabel: "Back",
          icon: <BackIcon />,
          onPress: () => {
            if (router.canGoBack()) {
              router.back();
              return;
            }
            router.push("/journey-map");
          },
        }}
        rightAction={{
          accessibilityLabel: "More options",
          icon: <MoreIcon />,
          onPress: () => {},
        }}
        style={styles.header}
        title="Milestone Quests"
      />

      <Card padded={false} style={styles.milestoneCard}>
        <Image contentFit="cover" source={QUEST_HEADER_SOURCE} style={styles.heroImage} />
        <LinearGradient
          colors={[
            "rgba(4, 7, 17, 0.98)",
            "rgba(4, 7, 17, 0.78)",
            "rgba(4, 7, 17, 0.24)",
          ]}
          end={{ x: 1, y: 0.5 }}
          start={{ x: 0, y: 0.5 }}
          style={StyleSheet.absoluteFill}
        />
        <LinearGradient
          colors={["rgba(4, 7, 17, 0)", "rgba(4, 7, 17, 0.92)"]}
          style={styles.heroBottomShade}
        />
        <View style={styles.milestoneCopy}>
          <View style={styles.labelRow}>
            <PlusIcon color={colors.accentViolet} size={18} />
            <AppText color={colors.accentViolet} variant="eyebrow">
              CURRENT MILESTONE
            </AppText>
          </View>
          <AppText variant="cardTitle">Build Unstoppable Discipline</AppText>
          <View style={styles.metaItem}>
            <CalendarIcon />
            <AppText color={colors.primary} variant="meta">
              18 days in progress
            </AppText>
          </View>
        </View>
        <View style={styles.milestoneProgress}>
          <ProgressRing
            backgroundColor={colors.surfaceDeep}
            color={colors.primary}
            meta="COMPLETE"
            size={116}
            strokeWidth={5}
            value={72}
          />
        </View>
      </Card>

      <Card style={styles.ideaPanel}>
        <AppText color={colors.accentViolet} variant="eyebrow">
          IDEAS THAT CAN HELP ACHIEVE
        </AppText>
        <View style={styles.sparkle}>
          <SparkIcon color={colors.accentViolet} size={30} />
        </View>
        <Card padded={false} style={styles.ideaList}>
          {ideas.map((idea, index) => (
            <IdeaRow
              compact={isNarrow}
              idea={idea}
              index={index}
              key={idea.title}
            />
          ))}
        </Card>
      </Card>

      <SectionHeader
        action={{
          icon: <PlusIcon />,
          label: "Add Quest",
          onPress: () => {},
        }}
        style={styles.sectionHeader}
        title="QUESTS"
      />

      <ActiveQuestCard compact={isNarrow} />

      <SectionHeader
        action={{
          icon: <PlusIcon />,
          label: "Add Habit",
          onPress: () => router.push("/create-habit"),
        }}
        style={[styles.sectionHeader, styles.habitSectionHeader]}
        title="HABITS"
      />

      <HabitItemCard habit={dummyHabit} />
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  activeQuestCard: {
    marginBottom: spacing.md,
    overflow: "hidden",
  },
  activeQuestCopy: {
    flex: 1,
    paddingHorizontal: 20,
  },
  activeQuestHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 20,
  },
  activeQuestHeaderCompact: {
    alignItems: "center",
  },
  activeQuestProgressRing: {
    alignItems: "center",
    justifyContent: "center",
    minWidth: 90,
  },
  addTaskButton: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    height: 58,
    paddingHorizontal: spacing.md,
  },
  dragDot: {
    backgroundColor: colors.textPrimary,
    borderRadius: 2,
    height: 3,
    width: 3,
  },
  dragHandle: {
    gap: 4,
    width: 24,
  },
  dragRow: {
    flexDirection: "row",
    gap: 5,
  },
  habitSectionHeader: {
    marginTop: 28,
    paddingHorizontal: spacing.xl,
  },
  header: {
    marginBottom: spacing.sm,
    paddingHorizontal: 0,
  },
  heroBottomShade: {
    bottom: 0,
    height: "52%",
    left: 0,
    position: "absolute",
    right: 0,
  },
  heroImage: {
    ...StyleSheet.absoluteFill,
  },
  identityCard: {
    alignItems: "center",
    borderColor: "rgba(255, 95, 167, 0.2)",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.lg,
    minHeight: 116,
  },
  identityCopy: {
    flex: 1,
  },
  identityIconFrame: {
    borderColor: identity.color,
    shadowColor: identity.color,
  },
  identityMeta: {
    marginTop: spacing.sm,
  },
  identitySubtitle: {
    marginTop: spacing.xs,
  },
  ideaIconFrame: {
    alignItems: "center",
    borderColor: colors.accentVioletGlow,
    borderRadius: 28,
    borderWidth: 1,
    height: 56,
    justifyContent: "center",
    width: 56,
  },
  ideaList: {
    backgroundColor: colors.surfaceDeep,
    borderColor: colors.divider,
    marginTop: spacing.md,
    overflow: "hidden",
  },
  ideaPanel: {
    borderColor: colors.accentVioletGlow,
    marginTop: spacing.md,
    padding: spacing.lg,
  },
  ideaRow: {
    alignItems: "center",
    borderBottomColor: colors.divider,
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: spacing.lg,
    minHeight: 70,
    paddingHorizontal: spacing.md,
  },
  ideaRowCompact: {
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  ideaTitle: {
    flex: 1,
  },
  ideaTitleCompact: {
    fontSize: fontSizes.lg,
    lineHeight: lineHeights.lg,
  },
  labelRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  largeIconFrame: {
    alignItems: "center",
    backgroundColor: colors.surfaceDeep,
    borderColor: colors.primary,
    borderRadius: 48,
    borderWidth: 1,
    height: 96,
    justifyContent: "center",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    width: 96,
  },
  lastRow: {
    borderBottomWidth: 0,
  },
  metaItem: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  metaSeparator: {
    color: colors.textMuted,
    fontSize: fontSizes.xl,
    lineHeight: lineHeights.xl,
  },
  milestoneCard: {
    borderColor: colors.accentVioletGlow,
    minHeight: 184,
    overflow: "hidden",
    padding: 28,
  },
  milestoneCopy: {
    gap: spacing.lg,
    maxWidth: "66%",
    zIndex: 1,
  },
  milestoneProgress: {
    position: "absolute",
    right: 28,
    top: 28,
    zIndex: 2,
  },
  pillButton: {
    alignItems: "center",
    backgroundColor: "rgba(22, 13, 40, 0.64)",
    borderRadius: controls.button.pill.borderRadius,
    borderWidth: 1,
    height: controls.button.pill.height,
    justifyContent: "center",
    paddingHorizontal: controls.button.pill.paddingHorizontal,
  },
  questMetaRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    marginTop: spacing.md,
  },
  scorePill: {
    height: 42,
    justifyContent: "center",
    minWidth: 92,
  },
  scorePillCompact: {
    minWidth: 58,
  },
  scoreText: {
    ...typography.pill,
    color: colors.primary,
  },
  sectionHeader: {
    marginBottom: spacing.sm,
    marginTop: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  sparkle: {
    position: "absolute",
    right: 30,
    top: 28,
  },
  taskList: {
    backgroundColor: colors.surfaceDeep,
    borderColor: colors.divider,
    marginTop: spacing.lg,
    overflow: "hidden",
  },
  taskRow: {
    paddingHorizontal: spacing.md,
  },
});
