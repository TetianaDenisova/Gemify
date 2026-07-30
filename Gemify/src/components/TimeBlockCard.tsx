import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import Svg, { Circle, Path, Rect } from "react-native-svg";

import { BlockIconArt } from "@/components/TimeBlockTabs";
import type { ActionIcon, DayAction, TimeBlock } from "@/data/timeBlocks";
import { colors } from "@/theme/colors";
import { fontSizes, lineHeights, shadows, typography } from "@/theme/theme";

const PURPLE = "#C79BFF";
const PURPLE_STRONG = "#B46AFF";

function SparkIcon({ color = PURPLE, size = 18 }: { color?: string; size?: number }) {
  return (
    <Svg height={size} viewBox="0 0 24 24" width={size}>
      <Path
        d="M12 2.5 13.9 9 20.5 12 13.9 15 12 21.5 10.1 15 3.5 12 10.1 9 12 2.5Z"
        fill={color}
      />
    </Svg>
  );
}

function CheckMark() {
  return (
    <Svg height={16} viewBox="0 0 24 24" width={16}>
      <Path
        d="m5 12.5 4.3 4.2 9.4-9.6"
        fill="none"
        stroke={PURPLE_STRONG}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2.6}
      />
    </Svg>
  );
}

const ACTION_ICON_COLOR: Record<ActionIcon, string> = {
  meditate: "#C77DFF",
  nourish: colors.primary,
  move: "#C77DFF",
  water: "#C77DFF",
  intention: "#C77DFF",
  focus: "#C77DFF",
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
  last,
  onToggle,
}: {
  action: DayAction;
  last: boolean;
  onToggle: () => void;
}) {
  return (
    <View style={[styles.actionRow, last && styles.actionRowLast]}>
      <View style={styles.actionIcon}>
        <ActionIconArt icon={action.icon} />
      </View>
      <View style={styles.actionCopy}>
        <Text style={styles.actionTitle}>{action.title}</Text>
        <Text style={styles.actionSubtitle}>{action.subtitle}</Text>
      </View>
      <Pressable
        accessibilityLabel={action.done ? `Mark ${action.title} incomplete` : `Mark ${action.title} complete`}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: action.done }}
        hitSlop={10}
        onPress={onToggle}
        style={({ pressed }) => [
          styles.checkbox,
          action.done && styles.checkboxDone,
          pressed && styles.pressed,
        ]}
      >
        {action.done ? <CheckMark /> : null}
      </Pressable>
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
  const done = block.actions.filter((action) => action.done).length;

  return (
    <View style={style}>
      {showHeader ? (
        <View style={styles.sectionHeader}>
          <View style={styles.sectionBadge}>
            <BlockIconArt color={PURPLE} icon={block.icon} size={20} />
          </View>
          <Text style={styles.sectionLabel}>{block.label.toUpperCase()}</Text>
          <View style={styles.sectionDivider} />
          <Text style={styles.sectionTime}>{block.time}</Text>
          <Text style={styles.sectionCount}>
            {done} / {block.actions.length}
          </Text>
        </View>
      ) : null}

      <View style={[styles.card, !showHeader && styles.cardNoHeader]}>
        {showIntro ? (
          <>
            <View style={styles.identityRow}>
              <SparkIcon />
              <Text style={styles.identityText}>{block.identity}</Text>
            </View>
            <Text style={styles.routineTitle}>{block.routineTitle}</Text>
            <Text style={styles.routineSubtitle}>{block.routineSubtitle}</Text>
          </>
        ) : null}

        <View style={[styles.actionList, !showIntro && styles.actionListBare]}>
          {block.actions.map((action, index) => (
            <ActionRow
              action={action}
              key={action.title}
              last={index === block.actions.length - 1}
              onToggle={() => onToggleAction(index)}
            />
          ))}
        </View>
      </View>
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
  actionList: {
    marginTop: 20,
  },
  actionListBare: {
    marginTop: 0,
  },
  actionRow: {
    alignItems: "center",
    borderBottomColor: "rgba(246, 232, 200, 0.09)",
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: 18,
    minHeight: 74,
    paddingVertical: 14,
  },
  actionRowLast: {
    borderBottomWidth: 0,
  },
  actionSubtitle: {
    ...typography.subtitle,
    color: colors.textSecondary,
    marginTop: 3,
  },
  actionTitle: {
    ...typography.button,
    color: colors.textPrimary,
  },
  card: {
    backgroundColor: "rgba(6, 11, 26, 0.9)",
    borderColor: "rgba(199, 155, 255, 0.22)",
    borderRadius: 22,
    borderWidth: 1,
    marginTop: 18,
    padding: 24,
    ...shadows.softDark,
  },
  cardNoHeader: {
    marginTop: 0,
  },
  checkbox: {
    alignItems: "center",
    borderColor: "#5C6273",
    borderRadius: 19,
    borderWidth: 1.6,
    height: 38,
    justifyContent: "center",
    width: 38,
  },
  checkboxDone: {
    borderColor: PURPLE_STRONG,
    shadowColor: PURPLE_STRONG,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 8,
  },
  identityRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 9,
  },
  identityText: {
    color: PURPLE,
    fontSize: fontSizes.sm,
    fontWeight: "700",
    letterSpacing: 2.4,
    lineHeight: lineHeights.sm,
  },
  pressed: {
    opacity: 0.72,
    transform: [{ scale: 0.98 }],
  },
  routineSubtitle: {
    color: colors.primary,
    fontSize: fontSizes.md,
    lineHeight: 22,
    marginTop: 6,
  },
  routineTitle: {
    ...typography.cardTitle,
    marginTop: 14,
  },
  sectionBadge: {
    alignItems: "center",
    backgroundColor: "rgba(24, 14, 42, 0.7)",
    borderColor: "rgba(199, 155, 255, 0.4)",
    borderRadius: 22,
    borderWidth: 1,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  sectionCount: {
    color: colors.textPrimary,
    fontFamily: "serif",
    fontSize: fontSizes.xl,
    lineHeight: lineHeights.lg,
    marginLeft: "auto",
  },
  sectionDivider: {
    backgroundColor: "rgba(246, 232, 200, 0.2)",
    height: 20,
    width: 1,
  },
  sectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
  },
  sectionLabel: {
    color: PURPLE,
    fontSize: fontSizes.lg,
    fontWeight: "700",
    letterSpacing: 2,
    lineHeight: lineHeights.lg,
  },
  sectionTime: {
    color: colors.primary,
    fontSize: fontSizes.lg,
    fontWeight: "600",
    lineHeight: lineHeights.lg,
  },
});
