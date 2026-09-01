import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import {
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import Svg, { Circle, Path } from "react-native-svg";

import {
  approveIdea,
  createIdea,
  getDreams,
  getIdeas,
  getMilestoneById,
  getMilestones,
  type Idea,
  type Milestone,
} from "@/db";
import {
  AppButton,
  AppInput,
  AppModal,
  AppText,
  Badge,
  Card,
  ScreenHeader,
  ScreenScaffold,
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

type IdeaIconKey = "star" | "shirt" | "music" | "drop";

const IDEA_ICON_CYCLE: readonly IdeaIconKey[] = [
  "star",
  "shirt",
  "music",
  "drop",
];

function IdeaIcon({ icon }: { icon: IdeaIconKey }) {
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

function PillButton({
  color = colors.accentViolet,
  label,
  onPress,
  width,
}: {
  color?: string;
  label: string;
  onPress?: () => void;
  width?: number;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed: isPressed }) => [
        styles.pillButton,
        { borderColor: color, width },
        isPressed && pressed,
      ]}
    >
      <AppText color={color} variant="pill">
        {label}
      </AppText>
    </Pressable>
  );
}

function IdeaRow({
  compact,
  idea,
  index,
  isLast,
  onApprove,
}: {
  compact: boolean;
  idea: Idea;
  index: number;
  isLast: boolean;
  onApprove: () => void;
}) {
  return (
    <View
      style={[
        styles.ideaRow,
        compact && styles.ideaRowCompact,
        isLast && styles.lastRow,
      ]}
    >
      <View style={styles.ideaIconFrame}>
        <IdeaIcon icon={IDEA_ICON_CYCLE[index % IDEA_ICON_CYCLE.length]} />
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
      <PillButton
        label="Approve"
        onPress={onApprove}
        width={compact ? 84 : 126}
      />
    </View>
  );
}

export default function MilestoneIdeasScreen() {
  const { width } = useWindowDimensions();
  const isNarrow = width < layout.compactBreakpoint;
  const { milestoneId: milestoneIdParam } = useLocalSearchParams<{
    milestoneId?: string;
  }>();

  const [milestone, setMilestone] = useState<Milestone | null>(null);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [promptVisible, setPromptVisible] = useState(false);
  const [draft, setDraft] = useState("");
  const [scoreDraft, setScoreDraft] = useState("");

  const parsedScore = Number.parseInt(scoreDraft, 10);
  const scoreValid = Number.isFinite(parsedScore) && parsedScore > 0;

  const loadScreen = useCallback(async () => {
    try {
      let resolved: Milestone | null = null;
      const paramId = Number(milestoneIdParam);
      if (milestoneIdParam && Number.isFinite(paramId) && paramId > 0) {
        resolved = await getMilestoneById(paramId);
      }
      if (!resolved) {
        // Opened without a milestone param: fall back to the first dream's
        // first active milestone so the screen always shows something real.
        const [firstDream] = await getDreams();
        if (firstDream) {
          const milestones = await getMilestones(firstDream.id);
          resolved =
            milestones.find((entry) => entry.status === "active") ??
            milestones[0] ??
            null;
        }
      }

      setMilestone(resolved);
      setIdeas(resolved ? await getIdeas(resolved.id) : []);
    } catch (cause) {
      console.error("Failed to load milestone ideas", cause);
    }
  }, [milestoneIdParam]);

  useFocusEffect(
    useCallback(() => {
      loadScreen();
    }, [loadScreen]),
  );

  const handleApproveIdea = async (idea: Idea) => {
    try {
      await approveIdea(idea.id);
      await loadScreen();
    } catch (cause) {
      console.error("Failed to approve the idea", cause);
    }
  };

  const openPrompt = () => {
    setDraft("");
    setScoreDraft("");
    setPromptVisible(true);
  };

  const handleAddIdea = async () => {
    const title = draft.trim();
    if (!title || !scoreValid || !milestone) return;
    try {
      await createIdea(milestone.id, title, parsedScore);
      await loadScreen();
    } catch (cause) {
      console.error("Failed to add the idea", cause);
    }
    setPromptVisible(false);
  };

  return (
    <ScreenScaffold topInset>
      <ScreenHeader
        backFallback="/milestone-quests"
        buttonSize="md"
        style={styles.header}
        subtitle={milestone?.title}
        title="Ideas"
      />

      <Card style={styles.ideaPanel}>
        <View style={styles.panelHeader}>
          <AppText color={colors.accentViolet} variant="eyebrow">
            IDEAS THAT CAN HELP ACHIEVE
          </AppText>
          <SparkIcon color={colors.accentViolet} size={30} />
        </View>
        {ideas.length > 0 ? (
          <Card padded={false} style={styles.ideaList}>
            {ideas.map((idea, index) => (
              <IdeaRow
                compact={isNarrow}
                idea={idea}
                index={index}
                isLast={index === ideas.length - 1}
                key={idea.id}
                onApprove={() => handleApproveIdea(idea)}
              />
            ))}
          </Card>
        ) : (
          <AppText style={styles.emptyHint} variant="bodySmall">
            Capture small ideas here, then approve the best ones into quests.
          </AppText>
        )}
      </Card>

      <AppButton
        label="Add Idea"
        onPress={openPrompt}
        style={styles.addButton}
        variant="secondary"
      />

      <AppModal onClose={() => setPromptVisible(false)} visible={promptVisible}>
        <AppText align="center" variant="titleSm">
          Add an idea
        </AppText>
        <AppInput
          autoFocus
          containerStyle={styles.promptInput}
          onChangeText={setDraft}
          placeholder="Idea title..."
          value={draft}
        />
        <AppInput
          containerStyle={styles.promptInput}
          keyboardType="number-pad"
          label="Points"
          maxLength={3}
          onChangeText={setScoreDraft}
          placeholder="e.g. 5"
          value={scoreDraft}
        />
        <View style={styles.promptActions}>
          <AppButton
            label="Cancel"
            onPress={() => setPromptVisible(false)}
            style={styles.promptButton}
            variant="secondary"
          />
          <AppButton
            disabled={!draft.trim() || !scoreValid}
            label="Add"
            onPress={handleAddIdea}
            style={styles.promptButton}
          />
        </View>
      </AppModal>
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  addButton: {
    marginTop: spacing.lg,
  },
  emptyHint: {
    marginTop: spacing.md,
  },
  header: {
    marginBottom: spacing.sm,
    paddingHorizontal: 0,
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
  lastRow: {
    borderBottomWidth: 0,
  },
  panelHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
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
  promptActions: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  promptButton: {
    flex: 1,
    paddingHorizontal: spacing.sm,
  },
  promptInput: {
    marginTop: spacing.lg,
  },
  scorePill: {
    alignItems: "center",
    alignSelf: "center",
    height: 42,
    justifyContent: "center",
    width: 92,
  },
  scorePillCompact: {
    width: 58,
  },
  scoreText: {
    ...typography.pill,
    color: colors.primary,
  },
});
