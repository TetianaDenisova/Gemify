import { Image, type ImageSource } from "expo-image";
import { StyleSheet } from "react-native";

import { AppButton, AppModal, AppText, ImageIcon } from "@/shared/components";
import { colors } from "@/theme/colors";
import { spacing } from "@/theme/theme";

export type CompletionCelebrationProps = {
  /** Art above the copy — the milestone door, the dream's castle, … */
  art: ImageSource;
  /** Label of the dismiss button ("Close", "Skip"). */
  closeLabel?: string;
  onAddMemory: () => void;
  onClose: () => void;
  /** Line under the title, e.g. "You've completed Star". */
  subtitle: string;
  title: string;
  visible: boolean;
};

/**
 * The moment something is finished: a milestone, or a whole dream. Offers to
 * capture it as a memory while it is still fresh, and takes no for an answer.
 */
export function CompletionCelebration({
  art,
  closeLabel = "Close",
  onAddMemory,
  onClose,
  subtitle,
  title,
  visible,
}: CompletionCelebrationProps) {
  return (
    <AppModal onClose={onClose} visible={visible}>
      <Image contentFit="contain" source={art} style={styles.art} />
      <AppText align="center" variant="title">
        {title}
      </AppText>
      <AppText align="center" style={styles.subtitle} variant="bodySerif">
        {subtitle}
      </AppText>
      <AppText
        align="center"
        color={colors.primary}
        style={styles.hint}
        variant="caption"
      >
        Take a moment to capture what changed.
      </AppText>
      <AppButton
        icon={<ImageIcon color={colors.textOnPrimary} />}
        iconPosition="before"
        label="Add a Memory"
        onPress={onAddMemory}
        size="lg"
        style={styles.addButton}
      />
      <AppButton
        label={closeLabel}
        onPress={onClose}
        style={styles.closeButton}
        variant="secondary"
      />
    </AppModal>
  );
}

const styles = StyleSheet.create({
  addButton: {
    marginTop: spacing.lg,
  },
  art: {
    alignSelf: "center",
    height: 150,
    marginBottom: spacing.sm,
    width: 220,
  },
  closeButton: {
    marginTop: spacing.sm,
  },
  hint: {
    marginTop: spacing.md,
  },
  subtitle: {
    marginTop: spacing.sm,
  },
});
