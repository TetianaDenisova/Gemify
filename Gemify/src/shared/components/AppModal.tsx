import type { ReactNode } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { colors } from "@/theme/colors";
import { radius, spacing } from "@/theme/theme";

export type AppModalProps = {
  children: ReactNode;
  /** Tap on the scrim closes the modal. Default true. */
  dismissOnBackdrop?: boolean;
  onClose: () => void;
  /** Styles for the panel wrapper around children. */
  panelStyle?: StyleProp<ViewStyle>;
  /** Show the drag handle on sheet modals. Default true. */
  showHandle?: boolean;
  /** "center" floats a card mid-screen; "sheet" docks to the bottom. */
  variant?: "center" | "sheet";
  visible: boolean;
};

/**
 * App-wide modal shell: transparent fade Modal + scrim + positioned panel.
 * Panel visuals (gradients, borders) belong to the caller's children or
 * panelStyle.
 */
export function AppModal({
  children,
  dismissOnBackdrop = true,
  onClose,
  panelStyle,
  showHandle = true,
  variant = "center",
  visible,
}: AppModalProps) {
  const isSheet = variant === "sheet";

  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      presentationStyle="overFullScreen"
      statusBarTranslucent
      transparent
      visible={visible}
    >
      <View style={[styles.root, isSheet && styles.rootSheet]}>
        <Pressable
          accessibilityLabel="Close"
          disabled={!dismissOnBackdrop}
          onPress={onClose}
          style={styles.scrim}
        />
        {isSheet ? (
          <View style={[styles.sheet, panelStyle]}>
            {showHandle ? <View style={styles.handle} /> : null}
            {children}
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.centerScroll}
            showsVerticalScrollIndicator={false}
            style={styles.centerScrollView}
          >
            <View style={[styles.centerPanel, panelStyle]}>{children}</View>
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  centerPanel: {
    backgroundColor: colors.surfaceCard,
    borderColor: colors.border,
    borderRadius: radius.sheet,
    borderWidth: 1,
    padding: spacing.lg,
    width: "100%",
  },
  centerScroll: {
    flexGrow: 1,
    justifyContent: "center",
    padding: spacing.lg,
  },
  centerScrollView: {
    alignSelf: "center",
    maxWidth: 480,
    width: "100%",
  },
  handle: {
    alignSelf: "center",
    backgroundColor: colors.borderSoft,
    borderRadius: radius.round,
    height: 5,
    marginBottom: spacing.md,
    width: 44,
  },
  root: {
    flex: 1,
    justifyContent: "center",
  },
  rootSheet: {
    justifyContent: "flex-end",
  },
  scrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.scrim,
  },
  sheet: {
    alignSelf: "center",
    backgroundColor: colors.surfaceCard,
    borderColor: colors.border,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    borderWidth: 1,
    maxWidth: 760,
    padding: spacing.lg,
    width: "100%",
  },
});
