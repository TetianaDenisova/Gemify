import { useCallback, useEffect, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { BlockIconArt } from "@/components/TimeBlockTabs";
import {
  createTimeBlock,
  deleteTimeBlock,
  getTimeBlocks,
  updateTimeBlock,
  type TimeBlockRecord,
} from "@/db";
import type { BlockIcon } from "@/dto/timeBlocks";
import {
  AppButton,
  AppInput,
  AppModal,
  AppText,
  CloseIcon,
  PlusIcon,
} from "@/shared/components";
import { colors } from "@/theme/colors";
import { pressed, radius, spacing } from "@/theme/theme";

const BLOCK_ICONS: readonly BlockIcon[] = [
  "clock",
  "sunrise",
  "briefcase",
  "sun",
  "moon",
];

const BLOCK_ICON_LABELS: Record<BlockIcon, string> = {
  briefcase: "Briefcase",
  clock: "Clock",
  moon: "Moon",
  sun: "Sun",
  sunrise: "Sunrise",
};

type EditorState = {
  /** null while creating a new block. */
  id: number | null;
  icon: BlockIcon;
  label: string;
  time: string;
};

/**
 * "HH:MM" for a valid time, null for empty (flexible block), undefined for
 * unparseable input.
 */
function normalizeTime(raw: string): string | null | undefined {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const match = /^(\d{1,2}):(\d{2})$/.exec(trimmed);
  if (!match) return undefined;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return undefined;
  return `${String(hours).padStart(2, "0")}:${match[2]}`;
}

function toBlockIcon(iconKey: string): BlockIcon {
  return (BLOCK_ICONS as readonly string[]).includes(iconKey)
    ? (iconKey as BlockIcon)
    : "clock";
}

function BlockRow({
  block,
  canRemove,
  onEdit,
  onRemove,
}: {
  block: TimeBlockRecord;
  canRemove: boolean;
  onEdit: () => void;
  onRemove: () => void;
}) {
  return (
    <View style={styles.blockRow}>
      <Pressable
        accessibilityLabel={`Edit ${block.label}`}
        accessibilityRole="button"
        onPress={onEdit}
        style={({ pressed: isPressed }) => [
          styles.blockRowBody,
          isPressed && pressed,
        ]}
      >
        <View style={styles.blockIconFrame}>
          <BlockIconArt
            color={colors.accentViolet}
            icon={toBlockIcon(block.iconKey)}
            size={20}
          />
        </View>
        <AppText numberOfLines={1} style={styles.blockLabel} variant="button">
          {block.label}
        </AppText>
        <AppText color={colors.primary} variant="meta">
          {block.startTime ?? "Flexible"}
        </AppText>
      </Pressable>
      <Pressable
        accessibilityLabel={`Remove ${block.label}`}
        accessibilityRole="button"
        disabled={!canRemove}
        hitSlop={8}
        onPress={onRemove}
        style={({ pressed: isPressed }) => [
          styles.removeButton,
          !canRemove && styles.removeButtonDisabled,
          isPressed && pressed,
        ]}
      >
        <CloseIcon color={colors.textSecondary} size={16} />
      </Pressable>
    </View>
  );
}

type TimeBlockSettingsModalProps = {
  /** Fires after any block is added, edited, or removed. */
  onChanged: () => void;
  onClose: () => void;
  visible: boolean;
};

/**
 * Sheet for configuring the day's routine time blocks ("After wake-up",
 * "Before work", ...): rename, retime, re-icon, add, or remove them.
 */
export function TimeBlockSettingsModal({
  onChanged,
  onClose,
  visible,
}: TimeBlockSettingsModalProps) {
  const [blocks, setBlocks] = useState<TimeBlockRecord[]>([]);
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      setBlocks(await getTimeBlocks());
    } catch (cause) {
      console.error("Failed to load time blocks", cause);
    }
  }, []);

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    getTimeBlocks()
      .then((rows) => {
        if (!cancelled) setBlocks(rows);
      })
      .catch((cause: unknown) => {
        console.error("Failed to load time blocks", cause);
      });
    return () => {
      cancelled = true;
    };
  }, [visible]);

  const openEditor = (block: TimeBlockRecord | null) => {
    setError(null);
    setEditor(
      block
        ? {
            icon: toBlockIcon(block.iconKey),
            id: block.id,
            label: block.label,
            time: block.startTime ?? "",
          }
        : { icon: "clock", id: null, label: "", time: "" },
    );
  };

  const handleRemove = async (block: TimeBlockRecord) => {
    try {
      await deleteTimeBlock(block.id);
      await reload();
      onChanged();
    } catch (cause) {
      console.error("Failed to remove the time block", cause);
    }
  };

  const handleSave = async () => {
    if (!editor) return;
    const label = editor.label.trim();
    if (!label) return;

    const startTime = normalizeTime(editor.time);
    if (startTime === undefined) {
      setError("Enter the time as HH:MM (e.g. 07:30), or leave it empty.");
      return;
    }

    try {
      if (editor.id === null) {
        await createTimeBlock({ iconKey: editor.icon, label, startTime });
      } else {
        await updateTimeBlock(editor.id, {
          iconKey: editor.icon,
          label,
          startTime,
        });
      }
      await reload();
      onChanged();
      setEditor(null);
    } catch (cause) {
      console.error("Failed to save the time block", cause);
    }
  };

  return (
    <AppModal onClose={onClose} variant="sheet" visible={visible}>
      <AppText align="center" variant="titleSm">
        {editor
          ? editor.id === null
            ? "Add time block"
            : "Edit time block"
          : "Time blocks"}
      </AppText>

      {editor ? (
        <>
          <AppInput
            autoFocus
            containerStyle={styles.editorField}
            label="Name"
            onChangeText={(label) => setEditor({ ...editor, label })}
            placeholder="e.g. After lunch"
            value={editor.label}
          />
          <AppInput
            autoCapitalize="none"
            containerStyle={styles.editorField}
            label="Start time"
            onChangeText={(time) => {
              setError(null);
              setEditor({ ...editor, time });
            }}
            placeholder="07:30 — empty for flexible"
            value={editor.time}
          />
          {error ? (
            <AppText color={colors.danger} style={styles.errorText} variant="caption">
              {error}
            </AppText>
          ) : null}
          <AppText color={colors.primary} style={styles.iconLabel} variant="label">
            Icon
          </AppText>
          <View style={styles.iconRow}>
            {BLOCK_ICONS.map((icon) => {
              const active = editor.icon === icon;
              return (
                <Pressable
                  accessibilityLabel={BLOCK_ICON_LABELS[icon]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  key={icon}
                  onPress={() => setEditor({ ...editor, icon })}
                  style={({ pressed: isPressed }) => [
                    styles.iconOption,
                    active && styles.iconOptionActive,
                    isPressed && pressed,
                  ]}
                >
                  <BlockIconArt
                    color={active ? colors.accentViolet : colors.textSecondary}
                    icon={icon}
                    size={22}
                  />
                </Pressable>
              );
            })}
          </View>
          <View style={styles.editorActions}>
            <AppButton
              label="Cancel"
              onPress={() => setEditor(null)}
              style={styles.editorButton}
              variant="secondary"
            />
            <AppButton
              disabled={!editor.label.trim()}
              label="Save"
              onPress={handleSave}
              style={styles.editorButton}
            />
          </View>
        </>
      ) : (
        <>
          <AppText align="center" style={styles.hint} variant="bodySmall">
            Tap a block to edit its name, time, or icon.
          </AppText>
          <View style={styles.blockList}>
            {blocks.map((block, index) => (
              <View key={block.id}>
                <BlockRow
                  block={block}
                  canRemove={blocks.length > 1}
                  onEdit={() => openEditor(block)}
                  onRemove={() => handleRemove(block)}
                />
                {index < blocks.length - 1 ? (
                  <View style={styles.rowDivider} />
                ) : null}
              </View>
            ))}
          </View>
          <Pressable
            accessibilityLabel="Add time block"
            accessibilityRole="button"
            onPress={() => openEditor(null)}
            style={({ pressed: isPressed }) => [
              styles.addRow,
              isPressed && pressed,
            ]}
          >
            <PlusIcon color={colors.accentViolet} size={20} />
            <AppText color={colors.accentViolet} variant="button">
              Add time block
            </AppText>
          </Pressable>
        </>
      )}
    </AppModal>
  );
}

const styles = StyleSheet.create({
  addRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "center",
    marginTop: spacing.md,
    minHeight: 52,
  },
  blockIconFrame: {
    alignItems: "center",
    borderColor: colors.accentVioletGlow,
    borderRadius: radius.round,
    borderWidth: 1,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  blockLabel: {
    flex: 1,
  },
  blockList: {
    backgroundColor: colors.surfaceDeep,
    borderColor: colors.divider,
    borderRadius: radius.md,
    borderWidth: 1,
    marginTop: spacing.md,
    overflow: "hidden",
  },
  blockRow: {
    alignItems: "center",
    flexDirection: "row",
  },
  blockRowBody: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: spacing.md,
    minHeight: 62,
    paddingHorizontal: spacing.md,
  },
  editorActions: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  editorButton: {
    flex: 1,
    paddingHorizontal: spacing.sm,
  },
  editorField: {
    marginTop: spacing.lg,
  },
  errorText: {
    marginTop: spacing.sm,
  },
  hint: {
    marginTop: spacing.sm,
  },
  iconLabel: {
    marginBottom: spacing.sm,
    marginTop: spacing.lg,
  },
  iconOption: {
    alignItems: "center",
    borderColor: colors.borderSoft,
    borderRadius: radius.round,
    borderWidth: 1,
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  iconOptionActive: {
    backgroundColor: "rgba(90, 55, 140, 0.28)",
    borderColor: colors.accentViolet,
  },
  iconRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  removeButton: {
    alignItems: "center",
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  removeButtonDisabled: {
    opacity: 0.3,
  },
  rowDivider: {
    backgroundColor: colors.divider,
    height: 1,
  },
});
