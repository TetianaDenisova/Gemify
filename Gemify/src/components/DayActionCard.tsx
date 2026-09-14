import type { ReactNode } from "react";
import {
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { useLayoutSize } from "@/hooks/useLayoutSize";
import {
  AppText,
  Card,
  Checkbox,
  ChevronIcon,
  DreamIcon,
  MilestoneIcon,
} from "@/shared/components";
import { colors } from "@/theme/colors";
import { fontSizes, lineHeights, pressed, spacing } from "@/theme/theme";

export type DayActionRowProps = {
  checkLabel: string;
  done: boolean;
  /** Set when pressing the body expands/collapses something. */
  expanded?: boolean;
  /** Draws the row icon at the size the layout calls for. */
  icon: (size: number) => ReactNode;
  last?: boolean;
  /** Node between the trailing slot and the checkbox (e.g. a ⋮ button). */
  menu?: ReactNode;
  onPress?: () => void;
  onToggle: () => void;
  pressLabel?: string;
  /** Line under the title: plain text, or a node such as a breadcrumb. */
  subtitle?: ReactNode;
  title: string;
  /** Node right before the checkbox (a quest's +%, a habit's streak tag). */
  trailing?: ReactNode;
};

/**
 * The day-plan action row — the My Day quest look shared by every quest and
 * habit: bare icon, serif title over a subtitle line, round check.
 */
export function DayActionRow({
  checkLabel,
  done,
  expanded,
  icon,
  last = false,
  menu,
  onPress,
  onToggle,
  pressLabel,
  subtitle,
  title,
  trailing,
}: DayActionRowProps) {
  const { compact, phone } = useLayoutSize();

  return (
    <View
      style={[
        styles.actionRow,
        compact && styles.actionRowCompact,
        last && styles.actionRowLast,
      ]}
    >
      <Pressable
        accessibilityLabel={pressLabel ?? `Options for ${title}`}
        accessibilityRole="button"
        accessibilityState={expanded === undefined ? undefined : { expanded }}
        disabled={!onPress}
        onPress={onPress}
        style={({ pressed: isPressed }) => [
          styles.actionBody,
          compact && styles.actionBodyCompact,
          phone && styles.actionBodyPhone,
          isPressed && pressed,
        ]}
      >
        <View
          style={[
            styles.actionIcon,
            compact && styles.actionIconCompact,
            phone && styles.actionIconPhone,
          ]}
        >
          {icon(phone ? 24 : compact ? 28 : 36)}
        </View>
        <View style={styles.actionCopy}>
          <AppText
            color={colors.textPrimary}
            style={compact && styles.actionTitleCompact}
            variant="pill"
          >
            {title}
          </AppText>
          {typeof subtitle === "string" ? (
            <AppText
              style={[
                styles.actionSubtitle,
                compact && styles.actionSubtitleCompact,
              ]}
              variant="subtitle"
            >
              {subtitle}
            </AppText>
          ) : (
            subtitle
          )}
        </View>
      </Pressable>
      {trailing}
      {menu}
      <Checkbox
        accessibilityLabel={checkLabel}
        checked={done}
        onPress={onToggle}
        shape="circle"
        size={phone ? 30 : compact ? 32 : 38}
      />
    </View>
  );
}

/** Dream (› milestone) crumb under a quest title; a phone keeps the dream. */
export function DayActionBreadcrumb({
  dreamTitle,
  milestoneTitle,
}: {
  dreamTitle?: string | null;
  milestoneTitle?: string | null;
}) {
  const { compact, phone } = useLayoutSize();

  return (
    <View
      style={[styles.actionBreadcrumb, compact && styles.actionBreadcrumbCompact]}
    >
      <View style={styles.breadcrumbPart}>
        <DreamIcon size={compact ? 14 : 16} />
        <AppText
          color={colors.textSecondary}
          numberOfLines={1}
          style={[styles.breadcrumbLabel, compact && styles.actionSubtitleCompact]}
          variant="subtitle"
        >
          {dreamTitle}
        </AppText>
      </View>
      {phone || !milestoneTitle ? null : (
        <>
          <ChevronIcon
            color={colors.textMuted}
            direction="right"
            size={compact ? 11 : 13}
          />
          <View style={styles.breadcrumbPart}>
            <MilestoneIcon size={compact ? 14 : 16} />
            <AppText
              color={colors.textSecondary}
              numberOfLines={1}
              style={[
                styles.breadcrumbLabel,
                compact && styles.actionSubtitleCompact,
              ]}
              variant="subtitle"
            >
              {milestoneTitle}
            </AppText>
          </View>
        </>
      )}
    </View>
  );
}

/** The card one separated day action sits in (My Day, Home, habit lists). */
export function DayActionCard({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const { compact } = useLayoutSize();

  return (
    <Card
      style={[styles.separatedCard, compact && styles.separatedCardCompact, style]}
      variant="default"
    >
      {children}
    </Card>
  );
}

const styles = StyleSheet.create({
  actionBody: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: 18,
    minWidth: 0,
  },
  actionBodyCompact: {
    gap: 14,
  },
  actionBodyPhone: {
    gap: 10,
  },
  actionBreadcrumb: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.xs,
    marginTop: 3,
  },
  actionBreadcrumbCompact: {
    marginTop: 2,
  },
  actionCopy: {
    flex: 1,
    minWidth: 0,
  },
  actionIcon: {
    alignItems: "center",
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  actionIconCompact: {
    height: 32,
    width: 32,
  },
  actionIconPhone: {
    height: 28,
    width: 28,
  },
  actionRow: {
    alignItems: "center",
    borderBottomColor: colors.divider,
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: 18,
    minHeight: 74,
    paddingVertical: 14,
  },
  actionRowCompact: {
    gap: 14,
    minHeight: 60,
    paddingVertical: 10,
  },
  actionRowLast: {
    borderBottomWidth: 0,
  },
  actionSubtitle: {
    marginTop: 3,
  },
  actionSubtitleCompact: {
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    marginTop: 2,
  },
  actionTitleCompact: {
    fontSize: fontSizes.lg,
    lineHeight: lineHeights.lg,
  },
  breadcrumbLabel: {
    flexShrink: 1,
  },
  breadcrumbPart: {
    alignItems: "center",
    flexDirection: "row",
    flexShrink: 1,
    gap: spacing.xs,
    minWidth: 0,
  },
  separatedCard: {
    borderColor: colors.accentVioletGlow,
    paddingVertical: spacing.xs,
  },
  separatedCardCompact: {
    paddingVertical: 2,
  },
});
