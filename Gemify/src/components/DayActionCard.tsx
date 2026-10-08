import type { ReactNode } from "react";
import {
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { useLayoutSize } from "@/hooks/useLayoutSize";
import { AppText, Card, Checkbox } from "@/shared/components";
import { colors } from "@/theme/colors";
import { fontSizes, lineHeights, pressed, spacing } from "@/theme/theme";

export type DayActionRowProps = {
  checkLabel: string;
  done: boolean;
  expanded?: boolean;
  last?: boolean;
  trailing: ReactNode;
  menu?: ReactNode;
  onPress?: () => void;
  onToggle: () => void;
  pressLabel?: string;
  subtitle?: ReactNode;
  title: string;
  titleAccessory?: ReactNode;
};

/** Shared focus layout for quests and habits outside the habits board. */
export function DayActionRow({
  checkLabel,
  done,
  expanded,
  last = false,
  trailing,
  menu,
  onPress,
  onToggle,
  pressLabel,
  subtitle,
  title,
  titleAccessory,
}: DayActionRowProps) {
  const { phone } = useLayoutSize();

  return (
    <View style={[styles.row, phone && styles.rowPhone, last && styles.rowLast]}>
      <Pressable
        accessibilityLabel={pressLabel ?? `Options for ${title}`}
        accessibilityRole={onPress ? "button" : undefined}
        accessibilityState={expanded === undefined ? undefined : { expanded }}
        disabled={!onPress}
        onPress={onPress}
        style={({ pressed: isPressed }) => [
          styles.body,
          isPressed && pressed,
        ]}
      >
        <View style={styles.copy}>
          <View style={styles.titleRow}>
            <AppText
              color={colors.textPrimary}
              numberOfLines={1}
              style={[styles.title, phone && styles.titlePhone, done && styles.titleDone]}
              variant="pill"
            >
              {title}
            </AppText>
            {titleAccessory}
          </View>
          {typeof subtitle === "string" ? subtitle ? (
            <AppText
              color={colors.textMuted}
              numberOfLines={1}
              style={[styles.subtitle, phone && styles.subtitlePhone]}
              variant="subtitle"
            >
              {subtitle}
            </AppText>
          ) : null : (
            subtitle
          )}
        </View>
      </Pressable>
      <View style={[styles.trailing, phone && styles.trailingPhone]}>
        {trailing}
      </View>
      {menu}
      <Checkbox
        accessibilityLabel={checkLabel}
        appearance="outline"
        borderColor="#807F7B"
        checkColor="#E6E4DE"
        checked={done}
        onPress={onToggle}
        shape="circle"
        size={32}
      />
    </View>
  );
}

/** A shared list with consistent spacing between individual action cards. */
export function DayActionList({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const { compact } = useLayoutSize();

  return (
    <View style={[styles.list, compact && styles.listCompact, style]}>
      {children}
    </View>
  );
}

/** The bordered surface for one task or habit. */
export function DayActionCard({
  children,
  done = false,
  style,
}: {
  children: ReactNode;
  done?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const { phone } = useLayoutSize();

  return (
    <Card
      padded={false}
      style={[styles.card, phone && styles.cardPhone, done && styles.cardDone, style]}
    >
      {children}
    </Card>
  );
}

const styles = StyleSheet.create({
  body: {
    alignItems: "stretch",
    flex: 1,
    justifyContent: "center",
    minWidth: 0,
  },
  card: {
    backgroundColor: "rgba(5, 13, 20, 0.94)",
    borderColor: colors.borderSoft,
    paddingHorizontal: 18,
    paddingVertical: 2,
  },
  cardPhone: {
    paddingHorizontal: 14,
  },
  cardDone: {
    opacity: 0.45,
  },
  copy: {
    minWidth: 0,
  },
  list: {
    gap: spacing.md,
  },
  listCompact: {
    gap: spacing.sm,
  },
  trailing: {
    alignItems: "flex-end",
    flexShrink: 0,
    justifyContent: "center",
    width: 82,
  },
  trailingPhone: {
    width: 70,
  },
  row: {
    alignItems: "center",
    borderBottomColor: colors.borderSoft,
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: 16,
    minHeight: 78,
    paddingVertical: 14,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  rowPhone: {
    gap: 12,
    minHeight: 72,
    paddingVertical: 12,
  },
  subtitle: {
    marginTop: 3,
  },
  subtitlePhone: {
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
  },
  title: {
    flexShrink: 1,
    fontSize: fontSizes.xl,
    lineHeight: lineHeights.xl,
  },
  titlePhone: {
    fontSize: fontSizes.lg,
    lineHeight: lineHeights.lg,
  },
  titleDone: {
    textDecorationLine: "line-through",
  },
  titleRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
});
