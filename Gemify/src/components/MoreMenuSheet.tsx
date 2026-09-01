import { useState } from "react";
import { StyleSheet, View } from "react-native";

import { exportBackup, pickAndImportBackup } from "@/db";
import { AppButton, AppModal, AppText, ListItem } from "@/shared/components";
import { colors } from "@/theme/colors";
import { spacing } from "@/theme/theme";

type MoreMenuSheetProps = {
  onClose: () => void;
  /** Called after a successful import so the host screen can reload data. */
  onImported?: () => void;
  visible: boolean;
};

type ResultNotice = {
  title: string;
  message: string;
};

/**
 * The ⋮ overflow menu: a bottom sheet with data backup actions. Export shares
 * a single JSON backup file (photos included); import replaces all current
 * data with a previously exported file, behind a confirmation step.
 */
export function MoreMenuSheet({
  onClose,
  onImported,
  visible,
}: MoreMenuSheetProps) {
  const [busy, setBusy] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [notice, setNotice] = useState<ResultNotice | null>(null);

  const handleExport = async () => {
    if (busy) return;
    onClose();
    setBusy(true);
    try {
      await exportBackup();
    } catch (cause) {
      setNotice({
        title: "Export failed",
        message:
          cause instanceof Error ? cause.message : "Could not export data.",
      });
    } finally {
      setBusy(false);
    }
  };

  const handleImport = async () => {
    if (busy) return;
    setConfirmVisible(false);
    setBusy(true);
    try {
      const summary = await pickAndImportBackup();
      if (summary) {
        onImported?.();
        setNotice({
          title: "Import complete",
          message:
            `Restored ${summary.dreams} dreams, ${summary.habits} habits, ` +
            `${summary.quests} quests and ${summary.moments} memories.`,
        });
      }
    } catch (cause) {
      setNotice({
        title: "Import failed",
        message:
          cause instanceof Error ? cause.message : "Could not import data.",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <AppModal onClose={onClose} variant="sheet" visible={visible}>
        <View style={styles.menu}>
          <ListItem onPress={handleExport} title="Export data" />
          <ListItem
            last
            onPress={() => {
              onClose();
              setConfirmVisible(true);
            }}
            title="Import data"
          />
        </View>
      </AppModal>

      <AppModal
        onClose={() => setConfirmVisible(false)}
        visible={confirmVisible}
      >
        <AppText variant="cardTitle">Replace all data?</AppText>
        <AppText style={styles.modalBody} variant="bodySmall">
          Importing a backup replaces everything currently in the app — dreams,
          milestones, habits, progress and memories. This cannot be undone.
        </AppText>
        <View style={styles.modalButtons}>
          <AppButton
            label="Import backup"
            onPress={handleImport}
            variant="primary"
          />
          <AppButton
            label="Cancel"
            onPress={() => setConfirmVisible(false)}
            variant="ghost"
          />
        </View>
      </AppModal>

      <AppModal onClose={() => setNotice(null)} visible={notice !== null}>
        <AppText variant="cardTitle">{notice?.title}</AppText>
        <AppText
          color={colors.textSecondary}
          style={styles.modalBody}
          variant="bodySmall"
        >
          {notice?.message}
        </AppText>
        <View style={styles.modalButtons}>
          <AppButton
            label="OK"
            onPress={() => setNotice(null)}
            variant="secondary"
          />
        </View>
      </AppModal>
    </>
  );
}

const styles = StyleSheet.create({
  menu: {
    marginTop: spacing.sm,
  },
  modalBody: {
    marginTop: spacing.sm,
  },
  modalButtons: {
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
});
