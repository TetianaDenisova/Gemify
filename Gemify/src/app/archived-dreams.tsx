import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { getArchivedDreams, updateDream, type Dream } from "@/db";
import { useRefreshOnSync } from "@/hooks/useRefreshOnSync";
import {
  AppButton, AppText, ArchiveIcon, Card, ScreenHeader, ScreenScaffold, SyncIcon,
} from "@/shared/components";
import { colors } from "@/theme/colors";
import { spacing } from "@/theme/theme";

export default function ArchivedDreamsScreen() {
  const router = useRouter();
  const [dreams, setDreams] = useState<Dream[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const [restoringId, setRestoringId] = useState<number | null>(null);
  const restoring = useRef(false);

  const refresh = useCallback(async () => {
    try {
      setDreams(await getArchivedDreams());
      setLoadError(null);
    } catch (cause) {
      setLoadError(cause instanceof Error ? cause.message : "Failed to load archived dreams.");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { void refresh(); }, [refresh]));
  useRefreshOnSync(refresh);

  async function restoreDream(dream: Dream) {
    if (restoring.current) return;
    restoring.current = true;
    setRestoringId(dream.id);
    setRestoreError(null);
    try {
      const updated = await updateDream(dream.id, { isArchived: false, isCompleted: false });
      if (!updated) throw new Error("This dream is no longer available.");
      setDreams((current) => current.filter((item) => item.id !== dream.id));
      router.dismissTo("/");
    } catch (cause) {
      setRestoreError(cause instanceof Error ? cause.message : "Failed to restore the dream.");
    } finally {
      restoring.current = false;
      setRestoringId(null);
    }
  }

  return (
    <ScreenScaffold topInset contentStyle={styles.content}>
      <ScreenHeader title="Archived dreams" backFallback="/account-subscription" />
      <AppText color={colors.textSecondary} style={styles.description}>
        Your dreams and their journeys are saved here. Restore a dream to bring it back to your main screen.
      </AppText>

      {loading ? <ActivityIndicator accessibilityLabel="Loading archived dreams" color={colors.primary} /> : null}
      {loadError ? (
        <View style={styles.message}>
          <AppText accessibilityRole="alert" color={colors.danger}>{loadError}</AppText>
          <AppButton label="Try again" variant="secondary" onPress={() => void refresh()} />
        </View>
      ) : null}
      {restoreError ? <AppText accessibilityRole="alert" color={colors.danger}>{restoreError}</AppText> : null}
      {!loading && !loadError && dreams.length === 0 ? (
        <Card style={styles.empty}>
          <ArchiveIcon size={32} />
          <AppText variant="cardTitle" align="center">No archived dreams yet</AppText>
          <AppText variant="bodySmall" align="center" color={colors.textSecondary}>
            Choose Archive Dream from a dream&apos;s options menu to save it for later.
          </AppText>
        </Card>
      ) : null}
      <View style={styles.list}>
        {dreams.map((dream) => (
          <Card key={dream.id} style={styles.dream}>
            <AppText variant="cardTitle">{dream.title}</AppText>
            {dream.visionStatement ? (
              <AppText variant="bodySmall" color={colors.textSecondary} numberOfLines={3}>
                {dream.visionStatement}
              </AppText>
            ) : null}
            <AppButton label={restoringId === dream.id ? "Restoring..." : "Restore dream"}
              accessibilityLabel={`Restore ${dream.title}`}
              icon={<SyncIcon size={18} />} variant="secondary" disabled={restoringId !== null}
              onPress={() => void restoreDream(dream)} />
          </Card>
        ))}
      </View>
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  content: { maxWidth: 660 },
  description: { marginVertical: spacing.lg },
  message: { gap: spacing.md },
  list: { gap: spacing.md, marginTop: spacing.md },
  dream: { gap: spacing.md },
  empty: { alignItems: "center", gap: spacing.md },
});
