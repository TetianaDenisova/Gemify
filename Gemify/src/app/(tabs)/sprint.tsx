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
import { radius, shadows, spacing, typography } from "@/theme/theme";

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

type Identity = {
  accent: string;
  doneDays: number;
  icon: "star" | "heart" | "moon";
  task: string;
  taskDate: string;
  title: string;
  subtitle: string;
};

const weekDays = ["M", "T", "W", "T", "F", "S", "S"] as const;

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

const identities: readonly Identity[] = [
  {
    accent: colors.primary,
    doneDays: 5,
    icon: "star",
    subtitle: "I keep promises to myself.",
    task: "Create my ideal daily routine",
    taskDate: "Due May 24",
    title: "Disciplined",
  },
  {
    accent: "#FF5C9F",
    doneDays: 4,
    icon: "heart",
    subtitle: "I treat myself with kindness and care.",
    task: "Write a letter of forgiveness to myself",
    taskDate: "Due May 20",
    title: "Loving",
  },
  {
    accent: "#934DFF",
    doneDays: 3,
    icon: "moon",
    subtitle: "I protect my peace and my energy.",
    task: "Declutter my space",
    taskDate: "Due May 23",
    title: "Peaceful",
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

function CalendarIcon({ color = "#DDA35A", size = 16 }: { color?: string; size?: number }) {
  return (
    <Svg height={size} viewBox="0 0 24 24" width={size}>
      <Rect fill="none" height={15} rx={2.4} stroke={color} strokeWidth={1.7} width={17} x={3.5} y={5.5} />
      <Path d="M7.5 3.5v4M16.5 3.5v4M3.5 10h17" fill="none" stroke={color} strokeLinecap="round" strokeWidth={1.7} />
    </Svg>
  );
}

function ChevronIcon({ direction = "down", color = "#F4C477", size = 18 }: { color?: string; direction?: "down" | "left" | "right" | "up"; size?: number }) {
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
        fill="#F5B84B"
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
      <Svg height={34} viewBox="0 0 36 36" width={34}>
        <Circle cx={18} cy={18} fill="none" r={12} stroke={accent} strokeWidth={2} />
        <Circle cx={18} cy={18} fill="none" r={6} stroke={accent} strokeWidth={2} />
        <Path d="M18 8v4M18 24v4M8 18h4M24 18h4" stroke={accent} strokeLinecap="round" strokeWidth={2} />
      </Svg>
    );
  }

  if (icon === "book") {
    return (
      <Svg height={34} viewBox="0 0 36 36" width={34}>
        <Path d="M8 9c4.6 0 7.6 1.4 10 5 2.4-3.6 5.4-5 10-5v18c-4.6 0-7.6 1.4-10 5-2.4-3.6-5.4-5-10-5V9Z" fill="none" stroke={accent} strokeLinejoin="round" strokeWidth={2} />
        <Path d="M18 14v18" stroke={accent} strokeLinecap="round" strokeWidth={2} />
      </Svg>
    );
  }

  return (
    <Svg height={34} viewBox="0 0 36 36" width={34}>
      <Rect fill="none" height={18} rx={2.5} stroke={accent} strokeWidth={2} width={22} x={7} y={9} />
      <Path d="M11 6v6M25 6v6M7 15h22M13 20l4 3 6-7" fill="none" stroke={accent} strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
    </Svg>
  );
}

function IdentityIcon({ accent, icon }: { accent: string; icon: Identity["icon"] }) {
  if (icon === "heart") {
    return (
      <Svg height={54} viewBox="0 0 58 58" width={54}>
        <Circle cx={29} cy={29} fill={`${accent}26`} r={25} />
        <Path d="M29 43S14 34.6 14 23.8c0-5.8 7.4-8.6 15-1.3 7.6-7.3 15-4.5 15 1.3C44 34.6 29 43 29 43Z" fill="none" stroke={accent} strokeLinejoin="round" strokeWidth={2.4} />
      </Svg>
    );
  }

  if (icon === "moon") {
    return (
      <Svg height={54} viewBox="0 0 58 58" width={54}>
        <Circle cx={29} cy={29} fill={`${accent}24`} r={25} />
        <Path d="M38.8 39.1c-10.7 2-19.9-6.8-17.7-17.8-5.4 3.1-8.7 9.4-7.2 16.1 1.9 8.5 10.3 13.8 18.8 11.9 6.7-1.5 11.5-6.4 12.8-12.5-1.9 1.1-4.1 1.9-6.7 2.3Z" fill={accent} />
        <Path d="M42 13.5 43.6 18 48 19.5 43.6 21 42 25.5 40.4 21 36 19.5 40.4 18 42 13.5Z" fill="#F4D28C" />
      </Svg>
    );
  }

  return (
    <Svg height={54} viewBox="0 0 58 58" width={54}>
      <Circle cx={29} cy={29} fill={`${accent}24`} r={25} />
      <Path d="M29 9.5 33.5 24 48 29 33.5 34 29 48.5 24.5 34 10 29 24.5 24 29 9.5Z" fill={accent} />
    </Svg>
  );
}

function ProgressRing({ progress, size = 92 }: { progress: number; size?: number }) {
  const strokeWidth = 5;
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
          stroke="rgba(246, 232, 200, 0.12)"
          strokeWidth={strokeWidth}
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          fill="none"
          r={radiusValue}
          stroke="#9B4DFF"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          strokeWidth={strokeWidth}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          fill="none"
          r={radiusValue - 3}
          stroke={colors.primary}
          strokeDasharray={`${circumference * 0.58} ${circumference}`}
          strokeLinecap="round"
          strokeWidth={2}
          transform={`rotate(-86 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <Text style={styles.ringValue}>72%</Text>
      <Text style={styles.ringMeta}>5 / 7 tasks</Text>
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
        {task.done ? (
          <PathCheck />
        ) : null}
      </View>
      <Text numberOfLines={2} style={styles.taskTitle}>{task.title}</Text>
      <View style={styles.taskDate}>
        <CalendarIcon color="#847A79" size={13} />
        <Text style={styles.taskDateText}>{task.date}</Text>
      </View>
    </View>
  );
}

function PathCheck() {
  return (
    <Svg height={15} viewBox="0 0 24 24" width={15}>
      <Path d="m6 12 4 4 8-9" fill="none" stroke="#1E1422" strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} />
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

function WeekDots({ accent, doneDays }: { accent: string; doneDays: number }) {
  return (
    <View style={styles.weekDots}>
      <View style={styles.dayLetters}>
        {weekDays.map((day, index) => (
          <Text key={`${day}-${index}`} style={styles.dayLetter}>{day}</Text>
        ))}
      </View>
      <View style={styles.dayDots}>
        {weekDays.map((day, index) => {
          const active = index < doneDays;

          return (
            <View
              key={`${day}-dot-${index}`}
              style={[
                styles.dayDot,
                active && {
                  backgroundColor: accent,
                  borderColor: "#F8D6A2",
                  shadowColor: accent,
                },
              ]}
            />
          );
        })}
      </View>
    </View>
  );
}

function IdentityRow({ identity }: { identity: Identity }) {
  return (
    <View style={styles.identityRow}>
      <View style={[styles.identityIconFrame, { borderColor: `${identity.accent}30`, shadowColor: identity.accent }]}>
        <IdentityIcon accent={identity.accent} icon={identity.icon} />
      </View>
      <View style={styles.identityMain}>
        <View style={styles.identityTop}>
          <View style={styles.identityCopy}>
            <Text style={styles.identityTitle}>{identity.title} <Text style={[styles.tinySpark, { color: identity.accent }]}>*</Text></Text>
            <Text numberOfLines={2} style={styles.identitySubtitle}>{identity.subtitle}</Text>
          </View>
          <View style={styles.identityProgress}>
            <Text style={styles.identityDays}>{identity.doneDays} / 7 days this week</Text>
            <WeekDots accent={identity.accent} doneDays={identity.doneDays} />
          </View>
          <ChevronIcon color="#A59671" direction="right" />
        </View>
        <View style={styles.oneTimeTask}>
          <Text style={styles.oneTimeLabel}>ONE TIME TASK</Text>
          <View style={styles.oneTimeRow}>
            <View style={styles.smallEmptyCircle} />
            <Text numberOfLines={1} style={styles.oneTimeText}>{identity.task}</Text>
            <View style={styles.taskDue}>
              <CalendarIcon color="#87777A" size={13} />
              <Text style={styles.taskDueText}>{identity.taskDate}</Text>
            </View>
          </View>
        </View>
      </View>
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
  const compact = width < 520;

  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={["#02050D", "#060716", "#080617", "#030712"]}
        locations={[0, 0.35, 0.72, 1]}
        pointerEvents="none"
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={["rgba(132, 64, 255, 0)", "rgba(132, 64, 255, 0.2)", "rgba(245, 184, 75, 0.1)", "rgba(3, 7, 18, 0)"]}
        pointerEvents="none"
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={styles.arcGlow}
      />
      <SkyDust />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingBottom: Math.max(insets.bottom + 108, 132),
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
            <Text style={styles.title}>Weekly Plan</Text>
            <Text style={styles.subtitle}>Your commitments for this week.</Text>
          </View>
          <HeaderButton label="Weekly focus">
            <SparkIcon size={22} />
          </HeaderButton>
        </View>

        <Pressable accessibilityRole="button" style={({ pressed }) => [styles.datePill, pressed && styles.pressed]}>
          <ChevronIcon direction="left" />
          <CalendarIcon />
          <Text style={styles.dateText}>May 18 - May 24, 2025</Text>
          <ChevronIcon direction="right" />
        </Pressable>

        <SectionLabel title="TRANSFORMATION ARC" />
        <View style={styles.arcCard}>
          <LinearGradient
            colors={["rgba(245, 184, 75, 0.1)", "rgba(126, 58, 205, 0.08)", "rgba(3, 8, 18, 0)"]}
            pointerEvents="none"
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.arcTop}>
            <View style={styles.flameFrame}>
              <FlameIcon />
            </View>
            <View style={styles.arcCopy}>
              <Text style={styles.arcTitle}>Build Unstoppable Discipline</Text>
              <Text style={styles.arcSubtitle}>Proving to myself that I can do hard things.</Text>
            </View>
            <View style={styles.arcProgress}>
              <ProgressRing progress={72} />
              <Text style={styles.thisWeek}>This week</Text>
            </View>
            <ChevronIcon color="#F8D28B" direction="up" />
          </View>

          <View style={styles.questSectionTitle}>
            <SparkIcon color={colors.primary} size={14} />
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

        <SectionLabel title="IDENTITIES I'M BUILDING THIS WEEK" />
        <View style={styles.identityPanel}>
          {identities.map((identity) => (
            <IdentityRow identity={identity} key={identity.title} />
          ))}
          <Pressable accessibilityRole="button" style={({ pressed }) => [styles.addIdentity, pressed && styles.pressed]}>
            <Text style={styles.addIdentityText}>+ Add new identity</Text>
          </Pressable>
        </View>

        <SectionLabel title="WEEKLY PROGRESS" />
        <View style={styles.weeklyCard}>
          <View style={styles.portalArt}>
            <Svg height={82} viewBox="0 0 96 82" width={96}>
              <Rect fill="#09081D" height={82} rx={10} width={96} />
              <Path d="M4 76c18-24 30-33 48-30 18 3 25 14 40 30H4Z" fill="#21102D" />
              <Path d="M48 70V28c0-10 7-18 15-18s15 8 15 18v42" fill="none" stroke={colors.primary} strokeWidth={3} />
              <Path d="M54 70V31c0-6 4-11 9-11s9 5 9 11v39" fill="rgba(245, 184, 75, 0.22)" stroke="#9B4DFF" strokeWidth={2} />
              <Path d="M45 70V36c0-7-5-12-11-12s-11 5-11 12v34" fill="none" opacity={0.6} stroke="#7E3DFF" strokeWidth={2} />
              <Circle cx={63} cy={36} fill="#FFE5A7" r={3} />
            </Svg>
          </View>
          <View style={styles.weeklyCopy}>
            <Text style={styles.weeklyText}>You're showing up for your future.</Text>
            <Text style={styles.weeklyTextMuted}>Keep going, your future self is proud.</Text>
            <View style={styles.weeklyBarTrack}>
              <View style={styles.weeklyBarFill} />
              <View style={styles.weeklyBarSpark} />
            </View>
          </View>
          <View style={styles.weeklyPercent}>
            <Text style={styles.percentText}>64%</Text>
            <Text style={styles.percentMeta}>18 / 24 days</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  addIdentity: {
    alignItems: "center",
    borderTopColor: "rgba(246, 232, 200, 0.08)",
    borderTopWidth: 1,
    height: 42,
    justifyContent: "center",
  },
  addIdentityText: {
    color: "#B272FF",
    fontSize: 14,
    lineHeight: 18,
  },
  arcCard: {
    backgroundColor: "rgba(4, 8, 18, 0.74)",
    borderColor: "rgba(245, 184, 75, 0.4)",
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
    overflow: "hidden",
    padding: 14,
  },
  arcCopy: {
    flex: 1,
    minWidth: 170,
  },
  arcGlow: {
    height: 360,
    left: -30,
    position: "absolute",
    right: -30,
    top: 58,
  },
  arcProgress: {
    alignItems: "center",
    gap: 4,
    justifyContent: "center",
    minWidth: 100,
  },
  arcSubtitle: {
    ...typography.subtitle,
    color: "#C6B69C",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
    maxWidth: 260,
  },
  arcTitle: {
    ...typography.cardTitle,
    fontSize: 22,
    lineHeight: 28,
  },
  arcTop: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    marginBottom: 12,
  },
  content: {
    alignSelf: "center",
    maxWidth: 620,
    paddingHorizontal: 18,
    width: "100%",
  },
  contentCompact: {
    paddingHorizontal: spacing.md,
  },
  datePill: {
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: "rgba(8, 9, 22, 0.86)",
    borderColor: "rgba(245, 184, 75, 0.48)",
    borderRadius: radius.round,
    borderWidth: 1,
    flexDirection: "row",
    gap: 9,
    height: 38,
    justifyContent: "center",
    marginBottom: 14,
    minWidth: 262,
    paddingHorizontal: 13,
  },
  dateText: {
    color: "#F3C274",
    fontSize: 14,
    lineHeight: 18,
  },
  dayDot: {
    backgroundColor: "rgba(4, 8, 18, 0.82)",
    borderColor: "#4F5465",
    borderRadius: 7,
    borderWidth: 1.2,
    height: 14,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.62,
    shadowRadius: 8,
    width: 14,
  },
  dayDots: {
    flexDirection: "row",
    gap: 13,
  },
  dayLetter: {
    color: "#B7A88E",
    fontSize: 10,
    lineHeight: 13,
    textAlign: "center",
    width: 14,
  },
  dayLetters: {
    flexDirection: "row",
    gap: 13,
  },
  flameFrame: {
    alignItems: "center",
    height: 92,
    justifyContent: "center",
    width: 104,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  headerButton: {
    alignItems: "center",
    backgroundColor: "rgba(4, 7, 16, 0.74)",
    borderColor: "rgba(245, 184, 75, 0.22)",
    borderRadius: 20,
    borderWidth: 1,
    height: 40,
    justifyContent: "center",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.16,
    shadowRadius: 10,
    width: 40,
  },
  headerTitleBlock: {
    alignItems: "center",
    flex: 1,
    paddingHorizontal: 10,
  },
  identityCopy: {
    flex: 1,
    minWidth: 120,
  },
  identityDays: {
    color: "#C9BA9C",
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 3,
  },
  identityIconFrame: {
    alignItems: "center",
    borderRadius: 30,
    borderWidth: 1,
    height: 60,
    justifyContent: "center",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 14,
    width: 60,
  },
  identityMain: {
    flex: 1,
    minWidth: 0,
  },
  identityPanel: {
    backgroundColor: "rgba(5, 8, 18, 0.78)",
    borderColor: "rgba(245, 184, 75, 0.24)",
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 14,
    overflow: "hidden",
  },
  identityProgress: {
    alignItems: "flex-start",
    minWidth: 206,
  },
  identityRow: {
    borderBottomColor: "rgba(246, 232, 200, 0.08)",
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: 13,
    paddingHorizontal: 13,
    paddingVertical: 12,
  },
  identitySubtitle: {
    color: "#B6AA96",
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
  },
  identityTitle: {
    ...typography.cardTitle,
    fontSize: 18,
    lineHeight: 23,
  },
  identityTop: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  miniLabel: {
    color: "#C48C4D",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.5,
    lineHeight: 14,
    marginBottom: 2,
  },
  oneTimeLabel: {
    color: "#D08D52",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.6,
    lineHeight: 12,
    marginLeft: 22,
  },
  oneTimeRow: {
    alignItems: "center",
    borderTopColor: "rgba(246, 232, 200, 0.07)",
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: 7,
    minHeight: 26,
    paddingTop: 5,
  },
  oneTimeTask: {
    marginTop: 7,
  },
  oneTimeText: {
    color: "#E0D1B7",
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
  },
  percentMeta: {
    color: "#BCA98A",
    fontSize: 12,
    lineHeight: 17,
  },
  percentText: {
    color: "#F8C56D",
    fontFamily: "serif",
    fontSize: 34,
    lineHeight: 40,
  },
  portalArt: {
    borderRadius: 10,
    overflow: "hidden",
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
    borderColor: "rgba(246, 232, 200, 0.1)",
    borderRadius: 11,
    borderWidth: 1,
    marginTop: 8,
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
    color: "#C8BAA8",
    fontSize: 13,
    lineHeight: 18,
  },
  questHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    minHeight: 62,
    paddingHorizontal: 12,
  },
  questIconFrame: {
    alignItems: "center",
    backgroundColor: "rgba(12, 7, 26, 0.82)",
    borderRadius: 25,
    borderWidth: 1,
    height: 50,
    justifyContent: "center",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    width: 50,
  },
  questLabel: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.4,
    lineHeight: 15,
  },
  questSectionTitle: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
    marginBottom: 2,
  },
  questSubtitle: {
    color: "#AFA18F",
    fontSize: 12,
    lineHeight: 16,
  },
  questTitle: {
    ...typography.cardTitle,
    fontSize: 18,
    lineHeight: 24,
  },
  ringMeta: {
    color: "#D9C3A2",
    fontSize: 11,
    lineHeight: 14,
    marginTop: 32,
    position: "absolute",
  },
  ringValue: {
    color: "#F8C56D",
    fontFamily: "serif",
    fontSize: 24,
    lineHeight: 30,
    position: "absolute",
  },
  screen: {
    backgroundColor: colors.background,
    flex: 1,
    overflow: "hidden",
  },
  sectionLabel: {
    color: "#DFA75B",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.7,
    lineHeight: 16,
    marginBottom: 7,
    marginLeft: 10,
    marginTop: 2,
  },
  smallEmptyCircle: {
    borderColor: "#555869",
    borderRadius: 7,
    borderWidth: 1.2,
    height: 14,
    width: 14,
  },
  subtitle: {
    ...typography.subtitle,
    color: "#E4D4BB",
    fontSize: 14,
    lineHeight: 19,
    textAlign: "center",
  },
  taskCheck: {
    alignItems: "center",
    borderColor: "#61677A",
    borderRadius: 8,
    borderWidth: 1.3,
    height: 16,
    justifyContent: "center",
    width: 16,
  },
  taskCheckDone: {
    backgroundColor: "#D99A4B",
    borderColor: "#D99A4B",
  },
  taskDate: {
    alignItems: "center",
    flexDirection: "row",
    gap: 4,
    justifyContent: "flex-end",
    minWidth: 70,
  },
  taskDateText: {
    color: "#887F7B",
    fontSize: 11,
    lineHeight: 14,
  },
  taskDue: {
    alignItems: "center",
    flexDirection: "row",
    gap: 4,
    justifyContent: "flex-end",
    minWidth: 82,
  },
  taskDueText: {
    color: "#9B8C88",
    fontSize: 11,
    lineHeight: 14,
  },
  taskList: {
    borderTopColor: "rgba(246, 232, 200, 0.08)",
    borderTopWidth: 1,
    paddingHorizontal: 12,
    paddingTop: 7,
  },
  taskRow: {
    alignItems: "center",
    borderBottomColor: "rgba(246, 232, 200, 0.07)",
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: 10,
    minHeight: 34,
  },
  taskTitle: {
    color: "#DFD2BA",
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
  },
  thisWeek: {
    color: colors.primary,
    fontSize: 11,
    lineHeight: 14,
  },
  tinySpark: {
    fontFamily: "serif",
    fontSize: 14,
  },
  title: {
    ...typography.screenTitle,
    color: "#FFF1D4",
    fontSize: 34,
    lineHeight: 40,
    textAlign: "center",
    textShadowColor: "rgba(245, 184, 75, 0.28)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  viewAllButton: {
    alignItems: "center",
    alignSelf: "center",
    flexDirection: "row",
    gap: 3,
    height: 36,
    justifyContent: "center",
    marginTop: 5,
  },
  viewAllText: {
    color: "#F0B967",
    fontSize: 13,
    lineHeight: 17,
  },
  weekDots: {
    gap: 3,
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
    backgroundColor: "rgba(246, 232, 200, 0.08)",
    borderRadius: 3,
    height: 5,
    marginTop: 13,
    overflow: "visible",
    width: "100%",
  },
  weeklyCard: {
    alignItems: "center",
    backgroundColor: "rgba(6, 9, 20, 0.82)",
    borderColor: "rgba(245, 184, 75, 0.22)",
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    gap: 14,
    marginBottom: 4,
    overflow: "hidden",
    padding: 12,
    ...shadows.goldGlow,
    shadowOpacity: 0.12,
  },
  weeklyCopy: {
    flex: 1,
    minWidth: 130,
  },
  weeklyPercent: {
    alignItems: "flex-end",
    minWidth: 70,
  },
  weeklyText: {
    color: "#E3D2B4",
    fontSize: 13,
    lineHeight: 19,
  },
  weeklyTextMuted: {
    color: "#D4C0A0",
    fontSize: 13,
    lineHeight: 19,
  },
});
