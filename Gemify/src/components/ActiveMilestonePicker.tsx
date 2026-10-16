import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";

import { getActiveMilestoneId, getMilestones, setActiveMilestone, type Milestone } from "@/db";
import { AppButton, AppModal, AppText, CheckIcon } from "@/shared/components";
import { colors } from "@/theme/colors";
import { pressed, radius, spacing } from "@/theme/theme";

/** Mounted only while open so every visit reads the current path and choice. */
export function ActiveMilestonePicker({ dreamId, onClose }: {
  dreamId: number;
  onClose: () => void;
}) {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getMilestones(dreamId), getActiveMilestoneId(dreamId)])
      .then(([path, activeId]) => {
        if (cancelled) return;
        setMilestones(path);
        setSelected(activeId);
      })
      .catch((cause: unknown) => {
        if (!cancelled) setError(cause instanceof Error ? cause.message : "Could not load milestones.");
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [dreamId]);

  async function save() {
    if (selected === null || saving) return;
    setSaving(true);
    setError(null);
    try {
      await setActiveMilestone(dreamId, selected);
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save the active milestone.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppModal onClose={onClose} visible>
      <AppText variant="titleSm">Active milestone</AppText>
      <AppText style={styles.description}>
        Choose the milestone shown on Home. Your first milestone is selected by default.
      </AppText>
      {loading ? <AppText>Loading milestones…</AppText> : null}
      {!loading && milestones.length === 0 && !error ? (
        <AppText>Add a milestone to your dream’s path to get started.</AppText>
      ) : null}
      <ScrollView style={styles.list}>
        {milestones.map((milestone) => (
          <Pressable
            accessibilityRole="radio"
            accessibilityState={{ checked: selected === milestone.id, disabled: saving }}
            disabled={saving}
            key={milestone.id}
            onPress={() => setSelected(milestone.id)}
            style={({ pressed: isPressed }) => [
              styles.option,
              selected === milestone.id && styles.selected,
              isPressed && pressed,
            ]}
          >
            <AppText color={colors.primary} variant="bodySerif">{milestone.sequenceNumber + 1}</AppText>
            <AppText style={styles.optionTitle} variant="bodySerif">{milestone.title}</AppText>
            {selected === milestone.id ? <CheckIcon size={20} /> : <View style={styles.checkSpace} />}
          </Pressable>
        ))}
      </ScrollView>
      {error ? <AppText accessibilityRole="alert" color={colors.danger}>{error}</AppText> : null}
      <View style={styles.actions}>
        <AppButton disabled={saving} label="Cancel" onPress={onClose} style={styles.button} variant="secondary" />
        <AppButton disabled={loading || saving || selected === null} label={saving ? "Saving…" : "Save"} onPress={save} style={styles.button} />
      </View>
    </AppModal>
  );
}

const styles = StyleSheet.create({
  description: { marginVertical: spacing.md },
  list: { maxHeight: 320 },
  option: { alignItems: "center", borderColor: colors.borderSoft, borderRadius: radius.sm, borderWidth: 1, flexDirection: "row", gap: spacing.md, marginBottom: spacing.sm, minHeight: 54, padding: spacing.md },
  selected: { backgroundColor: "rgba(245, 184, 75, 0.08)", borderColor: colors.border },
  optionTitle: { color: colors.textPrimary, flex: 1 },
  checkSpace: { width: 20 },
  actions: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.md },
  button: { flex: 1 },
});
