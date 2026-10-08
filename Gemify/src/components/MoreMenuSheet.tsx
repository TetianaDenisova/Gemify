import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, View } from "react-native";

import { exportBackup, pickAndImportBackup } from "@/db";
import { ActionMenuSheet, AppButton, AppModal, AppText, ArrowRightIcon, PlusIcon, SyncIcon } from "@/shared/components";
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
 * The ⋮ overflow menu: a bottom sheet with the data actions. Cloud sync keeps
 * this device and the user's other one on the same journey; export shares a
 * single JSON backup file (photos included); import adds new dreams and
 * replaces only dreams with matching permanent identities.
 */
export function MoreMenuSheet({
  onClose,
  onImported,
  visible,
}: MoreMenuSheetProps) {
  const router = useRouter();
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
            `Imported ${summary.dreams} dreams, ${summary.habits} habits, ` +
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
      <ActionMenuSheet
        eyebrow="App options"
        onClose={onClose}
        title="Gemify"
        visible={visible}
        options={[
          { id: "sync", icon: SyncIcon, label: "Cloud sync", onPress: () => { onClose(); router.push("/cloud-sync"); } },
          { id: "export", icon: ArrowRightIcon, label: "Export data", disabled: busy, onPress: handleExport },
          { id: "import", icon: PlusIcon, label: "Import data", disabled: busy, onPress: () => { onClose(); setConfirmVisible(true); } },
        ]}
      />

      <AppModal
        onClose={() => setConfirmVisible(false)}
        visible={confirmVisible}
      >
        <AppText variant="cardTitle">Import dreams?</AppText>
        <AppText style={styles.modalBody} variant="bodySmall">
          New dreams will be added. If a dream already exists, that dream and
          its milestones, habits, progress and memories will be replaced by the
          imported version. Other dreams and app settings stay unchanged.
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
  modalBody: {
    marginTop: spacing.sm,
  },
  modalButtons: {
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
});
