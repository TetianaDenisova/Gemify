import type { ReactNode } from "react";
import {
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { DayActionCard, DayActionRow } from "@/components/DayActionCard";
import type { HabitGlyph, HabitVisuals } from "@/data/habitVisuals";
import {
  AppText,
  BookIcon,
  DotsIcon,
  DropIcon,
  FlameIcon,
  MeditateIcon,
  ShoeIcon,
} from "@/shared/components";
import { colors } from "@/theme/colors";
import { iconSizes, pressed, spacing } from "@/theme/theme";

const STREAK_ICON_SIZE = 14;

export type HabitCardProps = {
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
  visuals: HabitVisuals;
};

export function formatStreakDays(days: number): string {
  return `${days} ${days === 1 ? "day" : "days"}`;
}

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

/**
 * The phone habit card, identical on every screen and to a My Day quest card:
 * the habit's glyph, its title over its cue, a 🔥 streak tag where a quest
 * would show its +%, an optional ⋮ menu and the round check.
 */
export function HabitCard({
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
  visuals,
}: HabitCardProps) {
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

  return (
    <DayActionCard style={style}>
      <DayActionRow
        checkLabel={
          done ? `Mark ${title} not done today` : `Mark ${title} done today`
        }
        done={done}
        expanded={expanded}
        icon={(size) => (
          <HabitGlyphIcon color={visuals.accent} glyph={visuals.glyph} size={size} />
        )}
        last
        menu={menuNode}
        onPress={onPress}
        onToggle={onToggleDone}
        pressLabel={`Details for the habit ${title}`}
        subtitle={subtitle || undefined}
        title={title}
        trailing={
          <View style={styles.streakTag}>
            <FlameIcon color={colors.primary} size={STREAK_ICON_SIZE} />
            <AppText color={colors.primary} variant="labelStrong">
              {formatStreakDays(streakDays)}
            </AppText>
          </View>
        }
      />
      {children}
    </DayActionCard>
  );
}

const styles = StyleSheet.create({
  menuButton: {
    alignItems: "center",
    height: 44,
    justifyContent: "center",
    width: 28,
  },
  /** Borderless 🔥 streak, where a quest shows its +%. */
  streakTag: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.xs,
  },
});
