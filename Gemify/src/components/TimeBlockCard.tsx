import {
  StyleSheet,
  View,
  useWindowDimensions,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import Svg, { Circle, Path, Rect } from "react-native-svg";

import { BlockIconArt } from "@/components/TimeBlockTabs";
import type { ActionIcon, DayAction, TimeBlock } from "@/dto/timeBlocks";
import {
  AppText,
  Card,
  Checkbox,
  ChevronIcon,
  DreamIcon,
  MilestoneIcon,
  SparkIcon,
} from "@/shared/components";
import { colors } from "@/theme/colors";
import { fontSizes, layout, lineHeights, spacing } from "@/theme/theme";

const ACTION_ICON_COLOR: Record<ActionIcon, string> = {
  meditate: colors.accentViolet,
  nourish: colors.primary,
  move: colors.accentViolet,
  water: colors.accentViolet,
  intention: colors.accentViolet,
  focus: colors.accentViolet,
  star: colors.primary,
  moon: colors.accentViolet,
  crystal: colors.accentViolet,
  wand: colors.primary,
  key: colors.primary,
  feather: colors.accentViolet,
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
  if (icon === "star") {
    // Four-point spark with a small companion star.
    return (
      <Svg height={size} viewBox="0 0 32 32" width={size}>
        <Path
          d="M14 4.5c1.6 5 4 7.4 9 9-5 1.6-7.4 4-9 9-1.6-5-4-7.4-9-9 5-1.6 7.4-4 9-9Z"
          fill={color}
        />
        <Path
          d="M24.5 20c.7 2.4 1.9 3.6 4.3 4.3-2.4.7-3.6 1.9-4.3 4.3-.7-2.4-1.9-3.6-4.3-4.3 2.4-.7 3.6-1.9 4.3-4.3Z"
          fill={color}
          opacity={0.65}
        />
      </Svg>
    );
  }
  if (icon === "moon") {
    // Crescent moon with a tiny star.
    return (
      <Svg height={size} viewBox="0 0 32 32" width={size}>
        <Path
          d="M18.5 4A11.6 11.6 0 1 0 27.8 21.5 12.6 12.6 0 0 1 18.5 4Z"
          strokeWidth={2}
          {...stroke}
        />
        <Path
          d="M23.5 6.5c.4 1.5 1.1 2.2 2.6 2.6-1.5.4-2.2 1.1-2.6 2.6-.4-1.5-1.1-2.2-2.6-2.6 1.5-.4 2.2-1.1 2.6-2.6Z"
          fill={color}
        />
      </Svg>
    );
  }
  if (icon === "crystal") {
    // Faceted gem.
    return (
      <Svg height={size} viewBox="0 0 32 32" width={size}>
        <Path d="M10 6h12l5.5 7L16 27 4.5 13 10 6Z" strokeWidth={1.9} {...stroke} />
        <Path
          d="M4.5 13h23M10 6l6 7 6-7M16 13v14"
          strokeWidth={1.5}
          {...stroke}
          opacity={0.75}
        />
      </Svg>
    );
  }
  if (icon === "wand") {
    // Magic wand trailing sparkles.
    return (
      <Svg height={size} viewBox="0 0 32 32" width={size}>
        <Path d="M6.5 25.5 19 13" strokeWidth={2.6} {...stroke} />
        <Path
          d="M23.5 4.5c.8 2.7 2.3 4.2 5 5-2.7.8-4.2 2.3-5 5-.8-2.7-2.3-4.2-5-5 2.7-.8 4.2-2.3 5-5Z"
          fill={color}
        />
        <Circle cx={26} cy={18} fill={color} opacity={0.7} r={1.5} />
        <Circle cx={16} cy={7} fill={color} opacity={0.7} r={1.3} />
      </Svg>
    );
  }
  if (icon === "key") {
    // Old key — the artifact that unlocks the next step.
    return (
      <Svg height={size} viewBox="0 0 32 32" width={size}>
        <Circle cx={10.5} cy={10.5} r={5} strokeWidth={2} {...stroke} />
        <Path
          d="M14.2 14.2 26.5 26.5M22.5 22.5l3.6-3.6M18.5 26l3-3"
          strokeWidth={2}
          {...stroke}
        />
      </Svg>
    );
  }
  if (icon === "feather") {
    // Quill feather.
    return (
      <Svg height={size} viewBox="0 0 32 32" width={size}>
        <Path
          d="M26.5 5C17 6.5 10.5 13 8.5 25.5c11-1.5 16.5-8 18-20.5Z"
          strokeWidth={1.9}
          {...stroke}
        />
        <Path d="M6 28c5.5-8 11-13.5 19-20" strokeWidth={1.5} {...stroke} opacity={0.75} />
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
          variant="pill"
        >
          {action.title}
        </AppText>
        {action.dreamTitle && action.milestoneTitle ? (
          <View style={[styles.actionBreadcrumb, compact && styles.actionBreadcrumbCompact]}>
            <View style={styles.breadcrumbPart}>
              <DreamIcon size={compact ? 14 : 16} />
              <AppText
                color={colors.textSecondary}
                numberOfLines={1}
                style={[styles.breadcrumbLabel, compact && styles.actionSubtitleCompact]}
                variant="subtitle"
              >
                {action.dreamTitle}
              </AppText>
            </View>
            <ChevronIcon color={colors.textMuted} direction="right" size={compact ? 11 : 13} />
            <View style={styles.breadcrumbPart}>
              <MilestoneIcon size={compact ? 14 : 16} />
              <AppText
                color={colors.textSecondary}
                numberOfLines={1}
                style={[styles.breadcrumbLabel, compact && styles.actionSubtitleCompact]}
                variant="subtitle"
              >
                {action.milestoneTitle}
              </AppText>
            </View>
          </View>
        ) : (
          <AppText
            style={[styles.actionSubtitle, compact && styles.actionSubtitleCompact]}
            variant="subtitle"
          >
            {action.subtitle}
          </AppText>
        )}
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
            variant="sectionTitle"
          >
            {block.label.toUpperCase()}
          </AppText>
          <View style={styles.sectionDivider} />
          <AppText
            color={colors.primary}
            style={compact && styles.sectionTimeCompact}
            variant="controlLabel"
          >
            {block.time}
          </AppText>
          <AppText
            color={colors.textPrimary}
            style={[styles.sectionCount, compact && styles.sectionCountCompact]}
            variant="pill"
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
                style={compact && styles.identityTextCompact}
                variant="eyebrow"
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
              variant="body"
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
  identityTextCompact: {
    fontSize: fontSizes.xs,
    letterSpacing: 1.8,
    lineHeight: lineHeights.xs,
  },
  routineSubtitle: {
    marginTop: spacing.xs,
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
    flexShrink: 1,
  },
  sectionLabelCompact: {
    fontSize: fontSizes.sm,
    letterSpacing: 1.6,
    lineHeight: lineHeights.sm,
  },
  sectionTimeCompact: {
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
  },
});
