import type { ReactNode } from "react";
import {
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { DayActionCard } from "@/components/DayActionCard";
import { formatStreakDays, HabitActionRow } from "@/components/HabitActionRow";
import type { HabitGlyph, HabitVisuals } from "@/data/habitVisuals";
import {
  AppText,
  BookIcon,
  Checkbox,
  DotsIcon,
  DropIcon,
  FlameIcon,
  MeditateIcon,
  ShoeIcon,
} from "@/shared/components";
import { useLayoutSize } from "@/hooks/useLayoutSize";
import { colors } from "@/theme/colors";
import {
  fontSizes,
  iconSizes,
  lineHeights,
  pressed,
  radius,
  spacing,
  withOpacity,
} from "@/theme/theme";

const BOARD_CARD_BORDER = [
  "rgba(183, 140, 255, 0.58)",
  "rgba(245, 184, 75, 0.22)",
  "rgba(183, 140, 255, 0.46)",
] as const;

export type HabitCardProps = {
  /** Spacious visual used by the dedicated habits board. */
  board?: boolean;
  /** Extra content under the main row (e.g. the expanded week and details). */
  children?: ReactNode;
  /** Today's completion. */
  done: boolean;
  expanded?: boolean;
  /** Replaces the built-in ⋮ button (screens that already own a menu node). */
  menu?: ReactNode;
  /** Shows a ⋮ button when set and `menu` is not given. */
  onOpenMenu?: () => void;
  /** Makes the row body pressable (e.g. to expand it). */
  onPress?: () => void;
  onToggleDone: () => void;
  streakDays: number;
  style?: StyleProp<ViewStyle>;
  /** The habit's cue ("After waking up"); hidden when empty. */
  subtitle?: string | null;
  title: string;
  /** Compact metadata displayed beside the title, such as OVERDUE. */
  titleAccessory?: ReactNode;
  visuals: HabitVisuals;
};

export { formatStreakDays } from "@/components/HabitActionRow";

function HabitGlyphIcon({
  color,
  glyph,
  size,
}: {
  color: string;
  glyph: HabitGlyph;
  size: number;
}) {
  switch (glyph) {
    case "book":
      return <BookIcon color={color} size={size} />;
    case "meditate":
      return <MeditateIcon color={color} size={size} />;
    case "move":
      return <ShoeIcon color={color} size={size} />;
    case "water":
      return <DropIcon color={color} size={size} />;
  }
}

/** Shared focus habit card, with a separate visual for the habits board. */
export function HabitCard({
  board = false,
  children,
  done,
  expanded,
  menu,
  onOpenMenu,
  onPress,
  onToggleDone,
  streakDays,
  style,
  subtitle,
  title,
  titleAccessory,
  visuals,
}: HabitCardProps) {
  const { compact, phone } = useLayoutSize();
  const menuNode =
    menu ??
    (onOpenMenu ? (
      <Pressable
        accessibilityLabel={`Options for the habit ${title}`}
        accessibilityRole="button"
        hitSlop={8}
        onPress={onOpenMenu}
        style={({ pressed: isPressed }) => [
          styles.menuButton,
          isPressed && pressed,
        ]}
      >
        <DotsIcon color={colors.textSecondary} size={iconSizes.md} />
      </Pressable>
    ) : null);

  if (board) {
    return (
      <LinearGradient
        colors={BOARD_CARD_BORDER}
        end={{ x: 1, y: 1 }}
        start={{ x: 0, y: 0 }}
        style={[styles.boardShell, compact && styles.boardShellCompact, style]}
      >
        <View
          style={[
            styles.boardCard,
            compact && styles.boardCardCompact,
            done && styles.boardCardDone,
          ]}
        >
          <View style={[styles.boardRow, compact && styles.boardRowCompact]}>
            <Pressable
              accessibilityLabel={`Details for the habit ${title}`}
              accessibilityRole="button"
              accessibilityState={
                expanded === undefined ? undefined : { expanded }
              }
              disabled={!onPress}
              onPress={onPress}
              style={({ pressed: isPressed }) => [
                styles.boardBody,
                isPressed && pressed,
              ]}
            >
              <View
                style={[
                  styles.boardIcon,
                  compact && styles.boardIconCompact,
                  { backgroundColor: withOpacity(visuals.accent, 0.14) },
                ]}
              >
                <HabitGlyphIcon
                  color={visuals.accent}
                  glyph={visuals.glyph}
                  size={compact ? 30 : 42}
                />
              </View>

              <View style={styles.boardCopy}>
                <View style={styles.boardTitleRow}>
                  <AppText
                    color={colors.textPrimary}
                    numberOfLines={2}
                    style={[
                      styles.boardTitle,
                      compact && styles.boardTitleCompact,
                    ]}
                    variant="pill"
                  >
                    {title}
                  </AppText>
                  {titleAccessory}
                </View>
                {subtitle ? (
                  <AppText
                    color={colors.textMuted}
                    numberOfLines={1}
                    style={styles.boardSubtitle}
                    variant="subtitle"
                  >
                    {subtitle}
                  </AppText>
                ) : null}
                <View style={styles.boardStreak}>
                  <FlameIcon color={colors.primary} size={18} />
                  <AppText color={colors.primary} variant="labelStrong">
                    {formatStreakDays(streakDays)}
                  </AppText>
                </View>
              </View>
            </Pressable>

            <Checkbox
              accessibilityLabel={
                done ? `Mark ${title} not done today` : `Mark ${title} done today`
              }
              appearance="glow"
              checked={done}
              onPress={onToggleDone}
              shape="circle"
              size={phone ? 34 : compact ? 38 : 42}
            />
            {menuNode}
          </View>
          {children}
        </View>
      </LinearGradient>
    );
  }

  return (
    <DayActionCard done={done} style={style}>
      <HabitActionRow
        done={done}
        expanded={expanded}
        last
        menu={menuNode}
        onPress={onPress}
        onToggle={onToggleDone}
        pressLabel={`Details for the habit ${title}`}
        streakDays={streakDays}
        subtitle={subtitle || undefined}
        title={title}
        titleAccessory={titleAccessory}
      />
      {children}
    </DayActionCard>
  );
}

const styles = StyleSheet.create({
  boardCard: {
    backgroundColor: "rgba(3, 8, 20, 0.94)",
    borderColor: "rgba(183, 140, 255, 0.2)",
    borderRadius: radius.card - 2,
    borderWidth: 1,
    overflow: "hidden",
    paddingHorizontal: 18,
  },
  boardCardCompact: {
    paddingHorizontal: 14,
  },
  boardCardDone: {
    backgroundColor: "rgba(4, 12, 22, 0.96)",
  },
  boardBody: {
    alignItems: "flex-start",
    flex: 1,
    flexDirection: "row",
    gap: spacing.lg,
    minWidth: 0,
  },
  boardCopy: {
    flex: 1,
    minWidth: 0,
    paddingTop: 1,
  },
  boardIcon: {
    alignItems: "center",
    borderRadius: radius.md,
    height: 68,
    justifyContent: "center",
    width: 68,
  },
  boardIconCompact: {
    borderRadius: radius.sm,
    height: 54,
    width: 54,
  },
  boardRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
    minHeight: 120,
    paddingVertical: 18,
  },
  boardRowCompact: {
    gap: 12,
    minHeight: 96,
    paddingVertical: 14,
  },
  boardShell: {
    borderRadius: radius.card,
    padding: 1.4,
  },
  boardShellCompact: {
    borderRadius: radius.card - 2,
  },
  boardStreak: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.xs,
    marginTop: 12,
  },
  boardSubtitle: {
    marginTop: 4,
  },
  boardTitle: {
    flexShrink: 1,
    fontSize: fontSizes.xl,
    lineHeight: lineHeights.xl,
  },
  boardTitleCompact: {
    fontSize: fontSizes.lg,
    lineHeight: lineHeights.lg,
  },
  boardTitleRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  menuButton: {
    alignItems: "center",
    height: 44,
    justifyContent: "center",
    width: 28,
  },
});
