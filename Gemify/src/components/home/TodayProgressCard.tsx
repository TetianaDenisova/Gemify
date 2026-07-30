import {
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import Svg, { Circle, Path } from "react-native-svg";

import { colors } from "@/theme/colors";
import { radius, shadows, spacing, typography } from "@/theme/theme";

const RING_SIZE = 64;
const RING_STROKE = 3;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

function SparkIcon({ size = 26 }: { size?: number }) {
  return (
    <Svg height={size} viewBox="0 0 32 32" width={size}>
      <Path
        d="M16 2.5c2.4 7.4 6.1 11.1 13.5 13.5C22.1 18.4 18.4 22.1 16 29.5 13.6 22.1 9.9 18.4 2.5 16 9.9 13.6 13.6 9.9 16 2.5Z"
        fill={colors.primary}
      />
    </Svg>
  );
}

function ProgressRing({ percent }: { percent: number }) {
  const dashOffset = RING_CIRCUMFERENCE * (1 - percent / 100);

  return (
    <View style={styles.ring}>
      <Svg height={RING_SIZE} viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`} width={RING_SIZE}>
        <Circle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          fill="none"
          r={RING_RADIUS}
          stroke={colors.borderSoft}
          strokeWidth={RING_STROKE}
        />
        <Circle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          fill="none"
          r={RING_RADIUS}
          stroke={colors.primary}
          strokeDasharray={`${RING_CIRCUMFERENCE} ${RING_CIRCUMFERENCE}`}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          strokeWidth={RING_STROKE}
          transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
        />
      </Svg>
      <Text style={styles.ringText}>{percent}%</Text>
    </View>
  );
}

interface TodayProgressCardProps {
  completedActions: number;
  totalActions: number;
  style?: StyleProp<ViewStyle>;
}

export function TodayProgressCard({
  completedActions,
  totalActions,
  style,
}: TodayProgressCardProps) {
  const percent =
    totalActions > 0 ? Math.round((completedActions / totalActions) * 100) : 0;
  const fillWidth = `${Math.max(0, Math.min(100, percent))}%` as `${number}%`;

  return (
    <View style={[styles.card, style]}>
      <View style={styles.iconFrame}>
        <SparkIcon />
      </View>
      <View style={styles.body}>
        <Text style={styles.title}>Today’s progress</Text>
        <Text style={styles.meta}>
          {completedActions} / {totalActions} actions completed
        </Text>
        <View style={styles.track}>
          <View style={[styles.fill, { width: fillWidth }]} />
        </View>
      </View>
      <ProgressRing percent={percent} />
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
    minWidth: 0,
  },
  card: {
    alignItems: "center",
    backgroundColor: "rgba(6, 11, 26, 0.9)",
    borderColor: "rgba(245, 184, 75, 0.25)",
    borderRadius: 22,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.lg,
    ...shadows.softDark,
  },
  fill: {
    backgroundColor: colors.primary,
    borderRadius: radius.round,
    height: "100%",
  },
  iconFrame: {
    alignItems: "center",
    backgroundColor: "rgba(10, 14, 28, 0.8)",
    borderColor: "rgba(245, 184, 75, 0.3)",
    borderRadius: 28,
    borderWidth: 1,
    height: 56,
    justifyContent: "center",
    width: 56,
  },
  meta: {
    color: colors.primary,
    fontSize: 14,
    lineHeight: 19,
    marginTop: spacing.xs,
  },
  ring: {
    alignItems: "center",
    height: RING_SIZE,
    justifyContent: "center",
    width: RING_SIZE,
  },
  ringText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: "300",
    position: "absolute",
  },
  title: {
    ...typography.cardTitle,
    fontSize: 24,
    lineHeight: 30,
  },
  track: {
    backgroundColor: colors.borderSoft,
    borderRadius: radius.round,
    height: 4,
    marginTop: spacing.sm + spacing.xs,
    overflow: "hidden",
    width: "100%",
  },
});
