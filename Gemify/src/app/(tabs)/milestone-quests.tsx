import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
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

import { HabitItemCard } from "@/components/HabitItem";
import { colors } from "@/theme/colors";
import { controls, radius, shadows, spacing, typography } from "@/theme/theme";

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

function BackIcon() {
  return (
    <Svg height={28} viewBox="0 0 24 24" width={28}>
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

function MoreIcon({ color = colors.primary }: { color?: string }) {
  return (
    <Svg height={22} viewBox="0 0 24 24" width={22}>
      {[7, 12, 17].map((cx) => (
        <Circle cx={cx} cy={12} fill={color} key={cx} r={1.55} />
      ))}
    </Svg>
  );
}

function PlusIcon({
  color = "#E889FF",
  size = 22,
}: {
  color?: string;
  size?: number;
}) {
  return (
    <Svg height={size} viewBox="0 0 24 24" width={size}>
      <Path
        d="M12 5v14M5 12h14"
        fill="none"
        stroke={color}
        strokeLinecap="round"
        strokeWidth={1.8}
      />
    </Svg>
  );
}

function CalendarIcon({ color = "#E6B66D" }: { color?: string }) {
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
        stroke="#B8A68C"
        strokeWidth={1.6}
      />
      <Path
        d="M12 8v5l3 2"
        fill="none"
        stroke="#B8A68C"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.6}
      />
    </Svg>
  );
}

function ChevronDownIcon({ color = colors.textPrimary }: { color?: string }) {
  return (
    <Svg height={22} viewBox="0 0 24 24" width={22}>
      <Path
        d="m6 9 6 6 6-6"
        fill="none"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
      />
    </Svg>
  );
}

function CheckIcon({ color = colors.primary }: { color?: string }) {
  return (
    <Svg height={18} viewBox="0 0 24 24" width={18}>
      <Path
        d="m5 12 4 4L19 6"
        fill="none"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
      />
    </Svg>
  );
}

function SparkleIcon({ color = "#E889FF", size = 30 }: { color?: string; size?: number }) {
  return (
    <Svg height={size} viewBox="0 0 48 48" width={size}>
      <Path d="M24 4 29 19 44 24 29 29 24 44 19 29 4 24 19 19 24 4Z" fill={color} />
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

function ProgressRing({
  color,
  progress,
  size,
  showLabel = false,
}: {
  color: string;
  progress: number;
  size: number;
    showLabel?: boolean;
}) {
  const strokeWidth = size >= 88 ? 5 : 4;
  const radiusValue = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radiusValue;
  const dashOffset = circumference * (1 - progress / 100);

  return (
    <View style={[styles.progressRing, { height: size, width: size }]}>
      <Svg height={size} viewBox={`0 0 ${size} ${size}`} width={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          fill="rgba(4, 8, 18, 0.72)"
          r={radiusValue}
          stroke="rgba(246, 232, 200, 0.16)"
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
      <Text style={[styles.ringValue, size < 86 && styles.ringValueSmall]}>
        {progress}%
      </Text>
      {showLabel ? <Text style={styles.ringLabel}>COMPLETE</Text> : null}
    </View>
  );
}

function PillButton({
  color = "#E889FF",
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
      style={({ pressed }) => [
        styles.pillButton,
        { borderColor: color, minWidth },
        pressed && styles.subtlePressed,
      ]}
    >
      <Text style={[styles.pillButtonText, { color }]}>{label}</Text>
    </Pressable>
  );
}

function GradientAction({
  label,
  tone = "purple",
}: {
  label: string;
  tone?: "pink" | "purple";
}) {
  const accent = tone === "pink" ? "#FF5FA7" : "#E889FF";

  return (
    <Pressable
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.gradientActionShell,
        { borderColor: accent },
        pressed && styles.subtlePressed,
      ]}
    >
      <LinearGradient
        colors={[
          tone === "pink" ? "rgba(255, 95, 167, 0.48)" : "rgba(176, 69, 255, 0.58)",
          "rgba(30, 15, 74, 0.9)",
        ]}
        style={styles.gradientAction}
      >
        <SparkleIcon color="#FFD68A" size={22} />
        <Text style={styles.gradientActionText}>{label}</Text>
      </LinearGradient>
    </Pressable>
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
      <Text
        numberOfLines={2}
        style={[styles.ideaTitle, compact && styles.ideaTitleCompact]}
      >
        {idea.title}
      </Text>
      <View style={[styles.scorePill, compact && styles.scorePillCompact]}>
        <Text style={styles.scoreText}>{idea.score}</Text>
      </View>
      <PillButton label="Approve" minWidth={compact ? 84 : 126} />
    </View>
  );
}

function TaskRow({ compact, task }: { compact: boolean; task: QuestTask }) {
  return (
    <View style={styles.taskRow}>
      <View style={[styles.checkbox, task.done && styles.checkboxDone]}>
        {task.done ? <CheckIcon /> : null}
      </View>
      <View style={styles.taskCopy}>
        <Text style={styles.taskTitle}>{task.title}</Text>
        <Text style={styles.taskFrequency}>{task.frequency}</Text>
      </View>
      <DragHandle />
    </View>
  );
}

function ActiveQuestCard({ compact }: { compact: boolean }) {
  return (
    <View style={styles.activeQuestCard}>
      <View
        style={[
          styles.activeQuestHeader,
          compact && styles.activeQuestHeaderCompact,
        ]}
      >
        <View style={styles.activeQuestProgressRing}>
          <ProgressRing color={colors.primary} progress={67} size={74} />
        </View>
        <View style={styles.activeQuestCopy}>
          <Text style={styles.activeQuestTitle}>Morning routine mastery</Text>
          <View style={styles.questMetaRow}>
            <View style={styles.metaItem}>
              <ClockIcon />
              <Text style={styles.questMetaText}>2 / 3 tasks</Text>
            </View>
            <Text style={styles.metaSeparator}>|</Text>
            <View style={styles.metaItem}>
              <CalendarIcon color="#B8A68C" />
              <Text style={styles.questMetaText}>7 days active</Text>
            </View>
          </View>
        </View>
        <PillButton label="Add to sprint" minWidth={compact ? 84 : 126} />
      </View>

      <View style={styles.taskList}>
        {questTasks.map((task) => (
          <TaskRow compact={compact} key={task.title} task={task} />
        ))}
        <Pressable
          accessibilityRole="button"
          style={({ pressed }) => [styles.addTaskButton, pressed && styles.subtlePressed]}
        >
          <PlusIcon size={24} />
          <Text style={styles.addTaskText}>Add Task</Text>
        </Pressable>
      </View>
    </View>
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
    <View style={styles.identityCard}>
      <View style={[styles.largeIconFrame, styles.identityIconFrame]}>
        <QuestIcon color={identity.color} icon={identity.icon} />
      </View>
      <View style={styles.identityCopy}>
        <Text style={styles.identityTitle}>{identity.title}</Text>
        <Text style={styles.identitySubtitle}>{identity.subtitle}</Text>
        <Text style={styles.identityMeta}>{identity.meta}</Text>
      </View>
      <ProgressRing color={identity.color} progress={identity.progress} size={86} />
      <ChevronDownIcon color="#FFE2A3" />
    </View>
  );
}

export default function MilestoneQuestsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isNarrow = width < 560;

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingBottom: Math.max(insets.bottom + 112, 132),
            paddingTop: Math.max(insets.top + 12, 22),
          },
          isNarrow && styles.contentNarrow,
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable
            accessibilityLabel="Back"
            accessibilityRole="button"
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
                return;
              }
              router.push("/journey-map");
            }}
            style={({ pressed }) => [styles.headerIconButton, pressed && styles.subtlePressed]}
          >
            <BackIcon />
          </Pressable>
          <Text style={styles.headerTitle}>Milestone Quests</Text>
          <Pressable
            accessibilityLabel="More options"
            accessibilityRole="button"
            style={({ pressed }) => [styles.headerIconButton, pressed && styles.subtlePressed]}
          >
            <MoreIcon />
          </Pressable>
        </View>

        <View style={styles.milestoneCard}>
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
              <PlusIcon size={18} />
              <Text style={styles.panelLabel}>CURRENT MILESTONE</Text>
            </View>
            <Text style={styles.milestoneTitle}>Build Unstoppable Discipline</Text>
            <View style={styles.metaItem}>
              <CalendarIcon />
              <Text style={styles.milestoneMetaText}>18 days in progress</Text>
            </View>
          </View>
          <View style={styles.milestoneProgress}>
            <ProgressRing color={colors.primary} progress={72} showLabel size={116} />
          </View>
        </View>

        <View style={styles.ideaPanel}>
          <Text style={styles.panelLabel}>IDEAS THAT CAN HELP ACHIEVE</Text>
          <View style={styles.sparkle}>
            <SparkleIcon />
          </View>
          <View style={styles.ideaList}>
            {ideas.map((idea, index) => (
              <IdeaRow
                compact={isNarrow}
                idea={idea}
                index={index}
                key={idea.title}
              />
            ))}
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>QUESTS</Text>
          <Pressable
            accessibilityRole="button"
            style={({ pressed }) => [styles.addQuestButton, pressed && styles.subtlePressed]}
          >
            <PlusIcon size={24} />
            <Text style={styles.addQuestText}>Add Quest</Text>
          </Pressable>
        </View>

        <ActiveQuestCard compact={isNarrow} />

        <View style={[styles.sectionHeader, styles.habitSectionHeader]}>
          <View style={styles.habitHeadingRow}>
            <Text style={[styles.sectionTitle]}>
              HABITS
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push("/create-habit")}
            style={({ pressed }) => [styles.addQuestButton, pressed && styles.subtlePressed]}
          >
            <PlusIcon size={24} />
            <Text style={styles.addQuestText}>Add Habit</Text>
          </Pressable>
        </View>

        <HabitItemCard habit={dummyHabit} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  activeQuestCard: {
    backgroundColor: "rgba(4, 10, 23, 0.92)",
    borderColor: "rgba(245, 184, 75, 0.82)",
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 14,
    overflow: "hidden",
    padding: 20,
    ...shadows.goldGlow,
    shadowOpacity: 0.28,
    shadowRadius: 14,
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
  activeQuestSubtitle: {
    ...typography.body,
    color: "#BDAE9A",
    marginTop: 8,
    maxWidth: 440,
  },
  activeQuestTitle: {
    ...typography.cardTitle,
  },
  addIdentityButton: {
    borderColor: "rgba(255, 95, 167, 0.45)",
  },
  addIdentityText: {
    color: identity.color,
  },
  addQuestButton: {
    alignItems: "center",
    backgroundColor: "rgba(22, 13, 40, 0.84)",
    borderColor: "rgba(232, 137, 255, 0.36)",
    borderRadius: controls.button.section.borderRadius,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    height: controls.button.section.height,
    justifyContent: "center",
    minWidth: controls.button.section.minWidth,
    paddingHorizontal: controls.button.section.paddingHorizontal,
  },
  addQuestText: {
    ...typography.button,
    color: "#E1A0FF",
  },
  addTaskButton: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    height: 58,
    paddingHorizontal: 18,
  },
  addTaskText: {
    ...typography.button,
    color: "#E1A0FF",
  },
  checkbox: {
    alignItems: "center",
    borderColor: "#B8A68C",
    borderRadius: 18,
    borderWidth: 1.4,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  checkboxDone: {
    borderColor: colors.primary,
  },
  content: {
    alignSelf: "center",
    maxWidth: 920,
    paddingHorizontal: 22,
    width: "100%",
  },
  contentNarrow: {
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
  gradientAction: {
    alignItems: "center",
    borderRadius: 10,
    flexDirection: "row",
    gap: 12,
    height: "100%",
    justifyContent: "center",
    paddingHorizontal: 22,
    width: "100%",
  },
  gradientActionShell: {
    borderRadius: 11,
    borderWidth: 1,
    height: 86,
    minWidth: 172,
    overflow: "hidden",
    shadowColor: "#E889FF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
  },
  gradientActionText: {
    color: colors.textPrimary,
    flexShrink: 1,
    fontFamily: "serif",
    fontSize: 22,
    lineHeight: 27,
    maxWidth: 104,
    textAlign: "center",
  },
  habitHeadingRow: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    minWidth: 260,
  },
  habitSectionHeader: {
    marginTop: 28,
    paddingHorizontal: 34,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    height: 68,
    justifyContent: "space-between",
    marginBottom: 10,
  },
  headerIconButton: {
    alignItems: "center",
    backgroundColor: "rgba(4, 8, 18, 0.72)",
    borderColor: "rgba(245, 184, 75, 0.48)",
    borderRadius: 28,
    borderWidth: 1,
    height: 56,
    justifyContent: "center",
    width: 56,
  },
  headerTitle: {
    ...typography.screenTitle,
    flex: 1,
    textAlign: "center",
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
    backgroundColor: "rgba(5, 13, 29, 0.9)",
    borderColor: "rgba(255, 95, 167, 0.2)",
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 22,
    minHeight: 116,
    padding: 18,
  },
  identityCopy: {
    flex: 1,
  },
  identityIconFrame: {
    borderColor: identity.color,
    shadowColor: identity.color,
  },
  identityMeta: {
    ...typography.meta,
    color: "#B8A68C",
    marginTop: 8,
  },
  identitySectionTitle: {
    color: identity.color,
  },
  identitySubtitle: {
    ...typography.subtitle,
    color: "#B8A68C",
    marginTop: 4,
  },
  identityTitle: {
    ...typography.cardTitle,
    fontSize: 28,
    lineHeight: 34,
  },
  ideaIconFrame: {
    alignItems: "center",
    borderColor: "rgba(232, 137, 255, 0.6)",
    borderRadius: 28,
    borderWidth: 1,
    height: 56,
    justifyContent: "center",
    width: 56,
  },
  ideaList: {
    backgroundColor: "rgba(4, 10, 23, 0.7)",
    borderColor: "rgba(246, 232, 200, 0.08)",
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 18,
    overflow: "hidden",
  },
  ideaPanel: {
    backgroundColor: "rgba(8, 11, 27, 0.9)",
    borderColor: "rgba(232, 137, 255, 0.24)",
    borderRadius: 22,
    borderWidth: 1,
    marginTop: 16,
    padding: 24,
  },
  ideaRow: {
    alignItems: "center",
    borderBottomColor: "rgba(246, 232, 200, 0.08)",
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: 22,
    minHeight: 70,
    paddingHorizontal: 14,
  },
  ideaRowCompact: {
    gap: 10,
    paddingHorizontal: 10,
  },
  ideaTitle: {
    color: colors.textPrimary,
    flex: 1,
    fontFamily: "serif",
    fontSize: 24,
    lineHeight: 31,
  },
  ideaTitleCompact: {
    fontSize: 17,
    lineHeight: 22,
  },
  labelRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  largeIconFrame: {
    alignItems: "center",
    backgroundColor: "rgba(5, 10, 24, 0.8)",
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
    gap: 10,
  },
  metaSeparator: {
    color: "#6F5E4F",
    fontSize: 20,
    lineHeight: 22,
  },
  milestoneCard: {
    borderColor: "rgba(232, 137, 255, 0.24)",
    borderRadius: 20,
    borderWidth: 1,
    minHeight: 184,
    overflow: "hidden",
    padding: 28,
  },
  milestoneCopy: {
    gap: 22,
    maxWidth: "66%",
    zIndex: 1,
  },
  milestoneMetaText: {
    color: "#E6B66D",
    fontSize: 19,
    lineHeight: 24,
  },
  milestoneProgress: {
    position: "absolute",
    right: 28,
    top: 28,
    zIndex: 2,
  },
  milestoneTitle: {
    ...typography.cardTitle,
    fontSize: 31,
    lineHeight: 38,
  },
  panelLabel: {
    color: "#E889FF",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 2.6,
    lineHeight: 21,
  },
  panelSubcopy: {
    color: "#C6B8A8",
    fontSize: 17,
    lineHeight: 24,
    marginTop: 6,
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
  pillButtonText: {
    ...typography.pill,
  },
  progressRing: {
    alignItems: "center",
    justifyContent: "center",
  },
  questMetaRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
    marginTop: 16,
  },
  questMetaText: {
    color: "#B8A68C",
    fontSize: 16,
    lineHeight: 20,
  },
  ringLabel: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 15,
    marginTop: 44,
    position: "absolute",
  },
  ringValue: {
    color: colors.textPrimary,
    fontFamily: "serif",
    fontSize: 36,
    lineHeight: 41,
    position: "absolute",
  },
  ringValueSmall: {
    fontSize: 22,
    lineHeight: 27,
  },
  scorePill: {
    alignItems: "center",
    borderColor: colors.primary,
    borderRadius: radius.round,
    borderWidth: 1,
    height: 42,
    justifyContent: "center",
    minWidth: 92,
  },
  scorePillCompact: {
    minWidth: 58,
  },
  scoreText: {
    color: colors.primary,
    fontFamily: "serif",
    fontSize: 21,
    lineHeight: 26,
  },
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  sectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
    marginTop: 18,
    paddingHorizontal: 10,
  },
  sectionTitle: {
    ...typography.sectionTitle,
  },
  sparkle: {
    position: "absolute",
    right: 30,
    top: 28,
  },
  statusDot: {
    backgroundColor: colors.primary,
    borderRadius: 5,
    height: 10,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    width: 10,
  },
  statusRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 9,
  },
  statusText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 18,
  },
  subtlePressed: {
    opacity: 0.72,
    transform: [{ scale: 0.98 }],
  },
  taskCopy: {
    flex: 1,
    paddingLeft: 4,
  },
  taskFrequency: {
    color: "#B8A68C",
    fontSize: 15,
    lineHeight: 19,
    marginTop: 2,
  },
  taskList: {
    backgroundColor: "rgba(3, 9, 22, 0.72)",
    borderColor: "rgba(246, 232, 200, 0.08)",
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 22,
    overflow: "hidden",
  },
  taskRow: {
    alignItems: "center",
    borderBottomColor: "rgba(246, 232, 200, 0.08)",
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: 18,
    minHeight: controls.row.task,
    paddingHorizontal: 16,
  },
  taskTitle: {
    ...typography.button,
    color: colors.textPrimary,
  },
});
