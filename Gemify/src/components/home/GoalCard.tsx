import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Pressable, StyleSheet, View } from "react-native";

import type { Goal } from "@/data/homeTypes";
import { goalImages } from "@/data/images";
import { useLayoutSize } from "@/hooks/useLayoutSize";
import { AppText, LockIcon, ProgressRing } from "@/shared/components";
import { colors } from "@/theme/colors";
import { fonts, pressed, radius } from "@/theme/theme";

interface GoalCardProps {
  goal: Goal;
  locked?: boolean;
  onPress?: (goal: Goal) => void;
}

export function GoalCard({ goal, locked = false, onPress }: GoalCardProps) {
  const { phone } = useLayoutSize();
  const milestoneProgress = goal.totalQuests > 0 ? goal.completedQuests / goal.totalQuests : 0;

  return (
    <Pressable
      accessibilityLabel={locked
        ? `${goal.title}, Premium required`
        : `${goal.title}, ${Math.round(goal.progressPercent)} percent. ${goal.activeMilestone ?? "No milestones yet"}. ${goal.completedQuests} of ${goal.totalQuests} quests complete`}
      accessibilityRole="button"
      onPress={() => onPress?.(goal)}
      style={({ pressed: isPressed }) => [styles.card, phone && styles.cardPhone, isPressed && pressed]}
    >
      <Image contentFit="cover" source={goalImages[goal.imageKey]} style={styles.art} transition={180} />
      <LinearGradient
        colors={["rgba(5, 12, 19, 0.95)", "rgba(5, 12, 19, 0.68)", "rgba(5, 12, 19, 0)", "rgba(5, 12, 19, 0.14)"]}
        locations={[0, 0.25, 0.64, 1]}
        end={{ x: 1, y: 0.5 }} start={{ x: 0, y: 0.5 }}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={["rgba(5, 12, 19, 0)", "rgba(5, 12, 19, 0.24)"]}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.content, phone && styles.contentPhone]}>
        <AppText numberOfLines={2} style={[styles.title, phone && styles.titlePhone]} variant="cardTitle">
          {goal.title}
        </AppText>
        <View style={styles.milestone}>
          <AppText color="#A6A39C" numberOfLines={1} style={styles.milestoneTitle} variant="bodySerif">
            {goal.activeMilestone ?? "Add your first milestone"}
          </AppText>
        </View>
        <View style={styles.progressRow}>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${Math.min(1, milestoneProgress) * 100}%` }]} />
          </View>
          <AppText color="#8E9399" style={styles.count} variant="bodySerif">
            {goal.completedQuests}/{goal.totalQuests}
          </AppText>
        </View>
      </View>
      <View style={[styles.ring, phone && styles.ringPhone]}>
        {locked ? (
          <View style={styles.lock}><LockIcon color={colors.primary} size={28} /></View>
        ) : (
          <ProgressRing
            color={colors.primary}
            labelColor={colors.primary}
            size={phone ? 52 : 62}
            strokeWidth={3}
            trackColor="#1C252D"
            value={goal.progressPercent}
          />
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#050C13",
    borderColor: "rgba(154, 163, 173, 0.13)",
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: 10,
    minHeight: 164,
    overflow: "hidden",
  },
  cardPhone: { minHeight: 136 },
  art: {
    bottom: 0,
    position: "absolute",
    right: 0,
    top: 0,
    width: "100%",
  },
  content: { paddingHorizontal: 22, paddingVertical: 18 },
  contentPhone: { paddingHorizontal: 18, paddingVertical: 18 },
  title: {
    color: "#F3EFDF",
    fontSize: 30,
    fontWeight: "400",
    lineHeight: 33,
    minHeight: 66,
    width: "72%",
  },
  titlePhone: { fontSize: 25, lineHeight: 27, minHeight: 54, width: "72%" },
  milestone: {
    alignItems: "center",
    flexDirection: "row",
    marginTop: 12,
    width: "78%",
  },
  milestoneTitle: { flex: 1, fontSize: 14, lineHeight: 19 },
  progressRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    marginTop: 7,
    width: "58%",
  },
  track: {
    backgroundColor: "#1C252D",
    borderRadius: radius.round,
    flex: 1,
    height: 7,
    overflow: "hidden",
  },
  fill: { backgroundColor: "#89775A", borderRadius: radius.round, height: "100%" },
  count: { fontFamily: fonts.serif, fontSize: 15, lineHeight: 18 },
  ring: { position: "absolute", right: 18, top: 20 },
  ringPhone: { right: 13, top: 16 },
  lock: { alignItems: "center", height: 52, justifyContent: "center", width: 52 },
});
