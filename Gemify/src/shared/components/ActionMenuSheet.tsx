import type { ComponentType, ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useLayoutSize } from "@/hooks/useLayoutSize";
import { colors } from "@/theme/colors";
import { pressed, radius, spacing } from "@/theme/theme";
import { AppModal } from "./AppModal";
import { AppText } from "./AppText";
import { ChevronIcon, type IconProps } from "./icons";

export type ActionMenuKind = "default" | "completion" | "destructive";

export type ActionMenuOption = {
  id: string;
  label: string;
  icon: ComponentType<IconProps>;
  kind?: ActionMenuKind;
  disabled?: boolean;
  onPress: () => void;
};

export type ActionMenuSheetProps = {
  children?: ReactNode;
  eyebrow?: string;
  onClose: () => void;
  options?: readonly (ActionMenuOption | null | false | undefined)[];
  title?: string;
  visible: boolean;
};

const DELETE_COLOR = "#E56D64";

function ActionMenuRow({
  disabled = false,
  icon,
  kind = "default",
  label,
  onPress,
}: {
  disabled?: boolean;
  icon: ReactNode;
  kind?: ActionMenuKind;
  label: string;
  onPress: () => void;
}) {
  const { compact } = useLayoutSize();
  const destructive = kind === "destructive";
  const completion = kind === "completion";

  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed: isPressed }) => [
        styles.row,
        compact && styles.rowCompact,
        completion && styles.completionRow,
        destructive && styles.destructiveRow,
        disabled && styles.disabled,
        isPressed && pressed,
      ]}
    >
      {completion ? (
        <LinearGradient
          colors={["rgba(181, 129, 43, 0.2)", "rgba(181, 129, 43, 0.06)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      ) : null}
      <View style={[styles.icon, completion && styles.completionIcon]}>{icon}</View>
      <AppText
        color={destructive ? DELETE_COLOR : colors.textPrimary}
        style={[styles.label, compact && styles.labelCompact]}
        variant="button"
      >
        {label}
      </AppText>
      <ChevronIcon
        color={destructive ? DELETE_COLOR : colors.primaryDark}
        direction="right"
        size={18}
      />
    </Pressable>
  );
}

/** The shared options menu; callers own actions and when the sheet closes. */
export function ActionMenuSheet({
  children,
  eyebrow = "Options",
  onClose,
  options = [],
  title,
  visible,
}: ActionMenuSheetProps) {
  const { compact, height } = useLayoutSize();
  const insets = useSafeAreaInsets();
  const items = options.filter((option): option is ActionMenuOption => Boolean(option));
  const normal = items.filter((item) => !item.kind || item.kind === "default");
  const completion = items.filter((item) => item.kind === "completion");
  const destructive = items.filter((item) => item.kind === "destructive");

  function renderOption(option: ActionMenuOption) {
    const Icon = option.icon;
    return (
      <ActionMenuRow
        disabled={option.disabled}
        icon={<Icon color={option.kind === "destructive" ? DELETE_COLOR : colors.primary} size={option.kind === "completion" ? 22 : 26} />}
        key={option.id}
        kind={option.kind}
        label={option.label}
        onPress={option.onPress}
      />
    );
  }

  return (
    <AppModal
      onClose={onClose}
      panelStyle={[styles.panel, { maxHeight: height - insets.top - spacing.md }]}
      showHandle={false}
      variant="sheet"
      visible={visible}
    >
      <LinearGradient
        colors={["#0C111C", "#070E19", "#0B101A"]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <View style={styles.handle} />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          compact && styles.contentCompact,
          { paddingBottom: Math.max(insets.bottom, spacing.lg) },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        style={styles.scroll}
      >
        <AppText color={colors.primary} style={styles.eyebrow} variant="eyebrow">{eyebrow.toUpperCase()}</AppText>
        {title ? <AppText style={[styles.title, compact && styles.titleCompact]} variant="titleSm">{title}</AppText> : null}
        <View style={styles.actions}>{normal.map(renderOption)}{children}</View>
        {completion.length > 0 ? <View style={styles.completionGroup}>{completion.map(renderOption)}</View> : null}
        {destructive.length > 0 ? <View style={styles.destructiveGroup}>{destructive.map(renderOption)}</View> : null}
      </ScrollView>
    </AppModal>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: "#080F1A",
    borderColor: "rgba(193, 155, 93, 0.4)",
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    overflow: "hidden",
    padding: 0,
  },
  handle: {
    alignSelf: "center",
    backgroundColor: "rgba(193, 155, 93, 0.4)",
    borderRadius: radius.round,
    height: 4,
    marginBottom: 8,
    marginTop: 14,
    width: 54,
  },
  scroll: { flexShrink: 1 },
  content: { paddingHorizontal: 34, paddingTop: 16 },
  contentCompact: { paddingHorizontal: 24, paddingTop: 14 },
  eyebrow: { fontSize: 11, lineHeight: 16, letterSpacing: 0 },
  title: { fontSize: 32, lineHeight: 40, fontWeight: "400", letterSpacing: 0, marginTop: 6 },
  titleCompact: { fontSize: 26, lineHeight: 33 },
  actions: { marginTop: 20 },
  row: {
    alignItems: "center",
    borderTopColor: "rgba(184, 166, 133, 0.16)",
    borderTopWidth: 1,
    flexDirection: "row",
    gap: 20,
    minHeight: 68,
    paddingHorizontal: 6,
    paddingVertical: 12,
  },
  rowCompact: { gap: 16, minHeight: 56 },
  icon: { alignItems: "center", justifyContent: "center", height: 34, width: 34 },
  label: { flex: 1, minWidth: 0, fontSize: 24, lineHeight: 30, fontWeight: "400", letterSpacing: 0 },
  labelCompact: { fontSize: 20, lineHeight: 26 },
  completionGroup: { gap: spacing.sm, marginTop: 6 },
  completionRow: {
    borderColor: "rgba(193, 155, 93, 0.55)",
    borderRadius: radius.md,
    borderWidth: 1,
    overflow: "hidden",
    paddingHorizontal: 14,
  },
  completionIcon: { borderColor: colors.primary, borderRadius: radius.round, borderWidth: 1.8 },
  destructiveGroup: { gap: spacing.sm, marginTop: 26 },
  destructiveRow: {
    backgroundColor: "rgba(113, 35, 35, 0.06)",
    borderColor: "rgba(173, 64, 55, 0.22)",
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: 14,
  },
  disabled: { opacity: 0.45 },
});
