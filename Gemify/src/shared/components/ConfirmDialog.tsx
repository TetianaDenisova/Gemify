import { StyleSheet, View } from "react-native";

import { colors } from "@/theme/colors";
import { fontSizes, lineHeights, spacing } from "@/theme/theme";

import { AppButton } from "./AppButton";
import { AppModal } from "./AppModal";
import { AppText } from "./AppText";

export type ConfirmDialogProps = {
  /** Copy under the title, e.g. "“Morning run” and its history will be removed." */
  body: string;
  /** Typography of the body copy; matches the host screen's tone. */
  bodyVariant?: "body" | "bodySerif";
  cancelLabel?: string;
  confirmLabel?: string;
  /** Renders the confirm button in the danger tint (deletes). */
  destructive?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  title: string;
  visible: boolean;
};

/**
 * The app-wide confirmation dialog: centered title · body · Cancel/Confirm
 * row. Replaces every hand-rolled delete-confirmation modal.
 */
export function ConfirmDialog({
  body,
  bodyVariant = "bodySerif",
  cancelLabel = "Cancel",
  confirmLabel = "Delete",
  destructive = true,
  onCancel,
  onConfirm,
  title,
  visible,
}: ConfirmDialogProps) {
  return (
    <AppModal onClose={onCancel} variant="center" visible={visible}>
      <AppText align="center" variant="titleSm">
        {title}
      </AppText>
      <AppText align="center" style={styles.body} variant={bodyVariant}>
        {body}
      </AppText>
      <View style={styles.actions}>
        <AppButton
          label={cancelLabel}
          onPress={onCancel}
          style={styles.button}
          textStyle={styles.buttonLabel}
          variant="secondary"
        />
        <AppButton
          label={confirmLabel}
          onPress={onConfirm}
          style={[styles.button, destructive && styles.destructiveButton]}
          textStyle={[styles.buttonLabel, destructive && styles.destructiveLabel]}
          variant="secondary"
        />
      </View>
    </AppModal>
  );
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  body: {
    marginTop: spacing.sm,
  },
  button: {
    flex: 1,
    paddingHorizontal: spacing.sm,
  },
  buttonLabel: {
    fontSize: fontSizes.lg,
    lineHeight: lineHeights.lg,
  },
  destructiveButton: {
    borderColor: colors.danger,
  },
  destructiveLabel: {
    color: colors.danger,
  },
});
