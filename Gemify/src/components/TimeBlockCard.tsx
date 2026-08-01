import {
  StyleSheet,
  View,
  useWindowDimensions,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import Svg, { Circle, Path, Rect } from "react-native-svg";

import { BlockIconArt } from "@/components/TimeBlockTabs";
import type { ActionIcon, DayAction, TimeBlock } from "@/data/timeBlocks";
import { AppText, Card, Checkbox, SparkIcon } from "@/shared/components";
import { colors } from "@/theme/colors";
import { fontSizes, fonts, layout, lineHeights } from "@/theme/theme";

const ACTION_ICON_COLOR: Record<ActionIcon, string> = {
  meditate: colors.accentViolet,
  nourish: colors.primary,
  move: colors.accentViolet,
  water: colors.accentViolet,
  intention: colors.accentViolet,
  focus: colors.accentViolet,
};

function ActionIconArt({ icon, size = 36 }: { icon: ActionIcon; size?: number }) {
  const color = ACTION_ICON_COLOR[icon];
  const stroke = {
    fill: "none" as const,
    stroke: color,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  if (icon === "meditate") {
    // Lotus flower — a center petal flanked by two inner and two outer petals.
    return (
      <Svg height={size} viewBox="0 0 32 32" width={size}>
        <Path d="M16 23c-2.6-4-2.6-8.5 0-13 2.6 4.5 2.6 9 0 13Z" strokeWidth={1.7} {...stroke} />
        <Path d="M16 23c-1-4.6-4-8-8.2-9.6-.6 4.4 2 8.4 8.2 9.6Z" strokeWidth={1.7} {...stroke} />
        <Path d="M16 23c1-4.6 4-8 8.2-9.6.6 4.4-2 8.4-8.2 9.6Z" strokeWidth={1.7} {...stroke} />
        <Path d="M16 23C11.5 21 7.8 20.4 4 21.6 6 25 10.4 26 16 23Z" strokeWidth={1.7} {...stroke} />
        <Path d="M16 23c4.5-2 8.2-2.6 12-1.4-2 3.4-6.4 4.4-12 1.4Z" strokeWidth={1.7} {...stroke} />
      </Svg>
    );
  }
  if (icon === "nourish") {
    // Gold sun with a solid center and eight rays.
    return (
      <Svg height={size} viewBox="0 0 32 32" width={size}>
        <Circle cx={16} cy={16} fill={color} r={4} />
        <Circle cx={16} cy={16} r={4} strokeWidth={1.8} {...stroke} />
        <Path
          d="M16 4v3.4M16 24.6V28M4 16h3.4M24.6 16H28M7.5 7.5l2.4 2.4M22.1 22.1l2.4 2.4M7.5 24.5l2.4-2.4M22.1 9.9l2.4-2.4"
          strokeWidth={1.8}
          {...stroke}
        />
      </Svg>
    );
  }
  if (icon === "move") {
    // Dumbbell — two weights with end caps joined by a short bar.
    return (
      <Svg height={size} viewBox="0 0 32 32" width={size}>
        <Path
          d="M5 13v6M8.5 10.5v11M23.5 10.5v11M27 13v6M8.5 16h15"
          strokeWidth={2.3}
          {...stroke}
        />
      </Svg>
    );
  }
  if (icon === "water") {
    return (
      <Svg height={size} viewBox="0 0 32 32" width={size}>
        <Path
          d="M16 4.5c4.3 6 6.8 9 6.8 12.9A6.8 6.8 0 0 1 16 24.6a6.8 6.8 0 0 1-6.8-7.2C9.2 13.5 11.7 10.5 16 4.5Z"
          strokeWidth={2}
          {...stroke}
        />
      </Svg>
    );
  }
  if (icon === "focus") {
    return (
      <Svg height={size} viewBox="0 0 32 32" width={size}>
        <Circle cx={16} cy={16} r={9.2} strokeWidth={1.9} {...stroke} />
        <Circle cx={16} cy={16} r={3.4} strokeWidth={1.9} {...stroke} />
        <Path d="M16 3v3.5M16 25.5V29M3 16h3.5M25.5 16H29" strokeWidth={1.6} {...stroke} />
      </Svg>
    );
  }
  // intention — calendar
  return (
    <Svg height={size} viewBox="0 0 32 32" width={size}>
      <Rect height={20} rx={3.2} strokeWidth={1.9} width={22} x={5} y={7} {...stroke} />
      <Path d="M10.5 4v5M21.5 4v5M5 13.5h22" strokeWidth={1.8} {...stroke} />
    </Svg>
  );
}

function ActionRow({
  action,
  compact,
  last,
  onToggle,
}: {
  action: DayAction;
  compact: boolean;
  last: boolean;
  onToggle: () => void;
}) {
  return (
    <View style={[styles.actionRow, compact && styles.actionRowCompact, last && styles.actionRowLast]}>
      <View style={[styles.actionIcon, compact && styles.actionIconCompact]}>
        <ActionIconArt icon={action.icon} size={compact ? 28 : 36} />
      </View>
      <View style={styles.actionCopy}>
        <AppText
          color={colors.textPrimary}
          style={compact && styles.actionTitleCompact}
          variant="button"
        >
          {action.title}
        </AppText>
        <AppText
          style={[styles.actionSubtitle, compact && styles.actionSubtitleCompact]}
          variant="subtitle"
        >
          {action.subtitle}
        </AppText>
      </View>
      <Checkbox
        accessibilityLabel={
          action.done
            ? `Mark ${action.title} incomplete`
            : `Mark ${action.title} complete`
        }
        checked={action.done}
        onPress={onToggle}
        shape="circle"
        size={compact ? 32 : 38}
      />
    </View>
  );
}

type TimeBlockCardProps = {
  block: TimeBlock;
  onToggleAction: (index: number) => void;
  showHeader?: boolean;
  /** Hide the identity/routine copy and show only the action rows. */
  showIntro?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function TimeBlockCard({
  block,
  onToggleAction,
  showHeader = true,
  showIntro = true,
  style,
}: TimeBlockCardProps) {
  const { width } = useWindowDimensions();
  const compact = width < layout.compactBreakpoint;
  const done = block.actions.filter((action) => action.done).length;

  return (
    <View style={style}>
      {showHeader ? (
        <View style={styles.sectionHeader}>
          <View style={[styles.sectionBadge, compact && styles.sectionBadgeCompact]}>
            <BlockIconArt color={colors.accentViolet} icon={block.icon} size={compact ? 17 : 20} />
          </View>
          <AppText
            color={colors.accentViolet}
            style={[styles.sectionLabel, compact && styles.sectionLabelCompact]}
          >
            {block.label.toUpperCase()}
          </AppText>
          <View style={styles.sectionDivider} />
          <AppText
            color={colors.primary}
            style={[styles.sectionTime, compact && styles.sectionTimeCompact]}
          >
            {block.time}
          </AppText>
          <AppText
            color={colors.textPrimary}
            style={[styles.sectionCount, compact && styles.sectionCountCompact]}
          >
            {done} / {block.actions.length}
          </AppText>
        </View>
      ) : null}

      <Card
        style={[
          styles.card,
          compact && styles.cardCompact,
          !showHeader && styles.cardNoHeader,
        ]}
        variant="default"
      >
        {showIntro ? (
          <>
            <View style={styles.identityRow}>
              <SparkIcon color={colors.accentViolet} size={compact ? 15 : 18} />
              <AppText
                color={colors.accentViolet}
                style={[styles.identityText, compact && styles.identityTextCompact]}
              >
                {block.identity}
              </AppText>
            </View>
            <AppText
              style={[styles.routineTitle, compact && styles.routineTitleCompact]}
              variant="cardTitle"
            >
              {block.routineTitle}
            </AppText>
            <AppText
              color={colors.primary}
              style={[styles.routineSubtitle, compact && styles.routineSubtitleCompact]}
            >
              {block.routineSubtitle}
            </AppText>
          </>
        ) : null}

        <View style={[styles.actionList, compact && styles.actionListCompact, !showIntro && styles.actionListBare]}>
          {block.actions.map((action, index) => (
            <ActionRow
              action={action}
              compact={compact}
              key={action.title}
              last={index === block.actions.length - 1}
              onToggle={() => onToggleAction(index)}
            />
          ))}
        </View>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
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
  actionList: {
    marginTop: 20,
  },
  actionListBare: {
    marginTop: 0,
  },
  actionListCompact: {
    marginTop: 14,
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
  card: {
    borderColor: colors.accentVioletGlow,
    marginTop: 18,
  },
  cardCompact: {
    marginTop: 14,
  },
  cardNoHeader: {
    marginTop: 0,
  },
  identityRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 9,
  },
  identityText: {
    fontSize: fontSizes.sm,
    fontWeight: "700",
    letterSpacing: 2.4,
    lineHeight: lineHeights.sm,
  },
  identityTextCompact: {
    fontSize: fontSizes.xs,
    letterSpacing: 1.8,
    lineHeight: lineHeights.xs,
  },
  routineSubtitle: {
    fontSize: fontSizes.md,
    lineHeight: 22,
    marginTop: 6,
  },
  routineSubtitleCompact: {
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    marginTop: 4,
  },
  routineTitle: {
    marginTop: 14,
  },
  routineTitleCompact: {
    fontSize: fontSizes.xxl,
    lineHeight: lineHeights.xxl,
    marginTop: 10,
  },
  sectionBadge: {
    alignItems: "center",
    backgroundColor: "rgba(24, 14, 42, 0.7)",
    borderColor: colors.accentVioletGlow,
    borderRadius: 22,
    borderWidth: 1,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  sectionBadgeCompact: {
    borderRadius: 18,
    height: 36,
    width: 36,
  },
  sectionCount: {
    fontFamily: fonts.serif,
    fontSize: fontSizes.xl,
    lineHeight: lineHeights.lg,
    marginLeft: "auto",
  },
  sectionCountCompact: {
    fontSize: fontSizes.lg,
    lineHeight: lineHeights.md,
  },
  sectionDivider: {
    backgroundColor: colors.borderSoft,
    height: 20,
    width: 1,
  },
  sectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
  },
  sectionLabel: {
    fontSize: fontSizes.lg,
    fontWeight: "700",
    letterSpacing: 2,
    lineHeight: lineHeights.lg,
  },
  sectionLabelCompact: {
    fontSize: fontSizes.sm,
    letterSpacing: 1.6,
    lineHeight: lineHeights.sm,
  },
  sectionTime: {
    fontSize: fontSizes.lg,
    fontWeight: "600",
    lineHeight: lineHeights.lg,
  },
  sectionTimeCompact: {
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
  },
});
