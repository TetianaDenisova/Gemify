import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import type { ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";

import { NavigationHeader } from "@/components/NavigationHeader";
import { colors } from "@/theme/colors";
import { radius, spacing } from "@/theme/theme";

const HERO_IMAGE = require("../../assets/what-if/fortress-hero.png");

type IconProps = {
  color: string;
  size?: number;
};

type IconComponent = (props: IconProps) => ReactNode;

type PlanPair = {
  risk: {
    body: string;
    icon: IconComponent;
    title: string;
  };
  safeguard: {
    body: string;
    icon: IconComponent;
    title: string;
  };
};

const PLAN_PAIRS: readonly PlanPair[] = [
  {
    risk: {
      body: "Internal doubt, goals feel out of reach",
      icon: FlameIcon,
      title: "Lose motivation",
    },
    safeguard: {
      body: "Weekly check-ins, public commitment, progress tracking",
      icon: ShieldIcon,
      title: "Accountability system",
    },
  },
  {
    risk: {
      body: "Social media, random tasks, shiny new ideas",
      icon: DistractionIcon,
      title: "Get distracted",
    },
    safeguard: {
      body: "Remove distractions, time blocks, Do Not Disturb, single-tasking",
      icon: BellIcon,
      title: "Focus environment",
    },
  },
  {
    risk: {
      body: "Unexpected expenses, poor cash flow",
      icon: WalletIcon,
      title: "Run out of money",
    },
    safeguard: {
      body: "Emergency fund, weekly budget, track expenses",
      icon: PiggyIcon,
      title: "Financial buffer",
    },
  },
  {
    risk: {
      body: "Burnout, poor habits, low energy",
      icon: HeartIcon,
      title: "Health issues",
    },
    safeguard: {
      body: "Sleep, nutrition, exercise, mindfulness practice",
      icon: LeafIcon,
      title: "Wellness routine",
    },
  },
  {
    risk: {
      body: "Lack of support, feeling disconnected",
      icon: GroupIcon,
      title: "Isolation",
    },
    safeguard: {
      body: "Stay in touch, join communities, ask for help",
      icon: GroupIcon,
      title: "Strong relationships",
    },
  },
] as const;

export default function WhatIfPlanScreen() {
  return (
    <>
      <NavigationHeader
        rightAction={{
          accessibilityLabel: "Add risk",
          icon: <PlusIcon color={colors.primary} size={24} />,
          label: "Add Risk",
          onPress: () => undefined,
        }}
      />

      <View style={styles.screen}>
        <ScrollView
          bounces={false}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.rule} />

          <View style={styles.columnHeaders}>
            <View style={styles.columnHeader}>
              <Text style={[styles.columnTitle, styles.riskTitle]}>
                WHAT CAN GO WRONG?
              </Text>
              <Text style={styles.columnCaption}>List of potential risks</Text>
            </View>
            <Text style={styles.linkHeader}>LINK</Text>
            <View style={[styles.columnHeader, styles.columnHeaderRight]}>
              <Text style={[styles.columnTitle, styles.safeguardTitle]}>
                HOW DO I PROTECT MYSELF?
              </Text>
              <Text style={styles.columnCaption}>Define safeguards for each risk</Text>
            </View>
          </View>

          <View style={styles.pairList}>
            <View pointerEvents="none" style={styles.timeline} />
            {PLAN_PAIRS.map((pair) => (
              <RiskPair key={pair.risk.title} pair={pair} />
            ))}
          </View>

          <View style={styles.quotePanel}>
            <Image contentFit="cover" source={HERO_IMAGE} style={styles.quoteImage} />
            <LinearGradient
              colors={[
                "rgba(5,8,17,0.82)",
                "rgba(21,13,6,0.72)",
                "rgba(5,8,17,0.9)",
              ]}
              start={{ x: 0, y: 0.2 }}
              end={{ x: 1, y: 0.7 }}
              style={StyleSheet.absoluteFill}
            />
            <CompassIcon color={colors.primary} size={64} />
            <Text style={styles.quote}>
              "You can't predict everything.{"\n"}But you can prepare for anything."
            </Text>
          </View>
        </ScrollView>
      </View>
    </>
  );
}

function RiskPair({ pair }: { pair: PlanPair }) {
  return (
    <View style={styles.pairRow}>
      <PlanCard
        accent="risk"
        body={pair.risk.body}
        icon={pair.risk.icon}
        title={pair.risk.title}
      />
      <View style={styles.linkCell}>
        <View style={styles.linkLine} />
        <View style={styles.linkNode}>
          <CompassIcon color="#FFE1A1" size={24} />
        </View>
      </View>
      <PlanCard
        accent="safeguard"
        body={pair.safeguard.body}
        icon={pair.safeguard.icon}
        title={pair.safeguard.title}
      />
    </View>
  );
}

function PlanCard({
  accent,
  body,
  icon: Icon,
  title,
}: {
  accent: "risk" | "safeguard";
  body: string;
  icon: IconComponent;
  title: string;
}) {
  const isRisk = accent === "risk";
  const accentColor = isRisk ? "#E24B2D" : "#76A940";

  return (
    <Pressable
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.planCard,
        isRisk ? styles.riskCard : styles.safeguardCard,
        pressed && styles.cardPressed,
      ]}
    >
      <View style={[styles.iconRing, { borderColor: accentColor }]}>
        <Icon color={accentColor} size={32} />
      </View>
      <View style={styles.cardCopy}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardBody}>{body}</Text>
      </View>
      <KebabIcon color={colors.primary} size={22} />
    </Pressable>
  );
}

function SvgShell({
  children,
  size = 24,
  viewBox = "0 0 24 24",
}: {
  children: ReactNode;
  size?: number;
  viewBox?: string;
}) {
  return (
    <Svg fill="none" height={size} viewBox={viewBox} width={size}>
      {children}
    </Svg>
  );
}

function PlusIcon({ color, size = 24 }: IconProps) {
  return (
    <SvgShell size={size}>
      <Path d="M12 5v14M5 12h14" stroke={color} strokeLinecap="round" strokeWidth={2} />
    </SvgShell>
  );
}

function ShieldIcon({ color, size = 24 }: IconProps) {
  return (
    <SvgShell size={size}>
      <Path
        d="M12 3.2 18.2 5.5v5.2c0 4.1-2.5 7.6-6.2 9.2-3.7-1.6-6.2-5.1-6.2-9.2V5.5L12 3.2Z"
        stroke={color}
        strokeLinejoin="round"
        strokeWidth={1.8}
      />
      <Path
        d="M12 7.4v8.4M9.2 10.5h5.6"
        stroke={color}
        strokeLinecap="round"
        strokeWidth={1.8}
      />
    </SvgShell>
  );
}

function FlameIcon({ color, size = 24 }: IconProps) {
  return (
    <SvgShell size={size}>
      <Path
        d="M12.2 21c3.4-1.3 5.5-3.8 5.5-7 0-3-1.6-5.1-4.8-8.8.4 3.1-.6 4.5-2 5.8-.7-1-1.1-2.1-.9-3.9-2.6 2.3-3.8 4.7-3.8 7.1 0 3.1 2.3 5.5 6 6.8Z"
        stroke={color}
        strokeLinejoin="round"
        strokeWidth={1.8}
      />
      <Path
        d="M12 17.8c1.4-.7 2.1-1.7 2.1-3 0-1.1-.5-2-1.6-3.2-.1 1.2-.6 2-1.4 2.7-.5.5-.8 1.1-.8 1.8 0 .8.5 1.4 1.7 1.7Z"
        fill={color}
      />
    </SvgShell>
  );
}

function DistractionIcon({ color, size = 24 }: IconProps) {
  return (
    <SvgShell size={size}>
      <Circle cx={12} cy={7.3} r={2.8} stroke={color} strokeWidth={1.8} />
      <Path
        d="M6.2 20c.4-3.3 2.5-5 5.8-5s5.4 1.7 5.8 5M4.3 8l-1.5-1.5M19.7 8l1.5-1.5M5.5 13.5 3.4 14.7M18.5 13.5l2.1 1.2"
        stroke={color}
        strokeLinecap="round"
        strokeWidth={1.8}
      />
    </SvgShell>
  );
}

function WalletIcon({ color, size = 24 }: IconProps) {
  return (
    <SvgShell size={size}>
      <Path
        d="M4.2 7.5h14.5c1 0 1.8.8 1.8 1.8v8.2c0 1-.8 1.8-1.8 1.8H5.3c-1 0-1.8-.8-1.8-1.8V6.7c0-.9.7-1.6 1.6-1.6h11"
        stroke={color}
        strokeLinejoin="round"
        strokeWidth={1.8}
      />
      <Path
        d="M15.4 12.2h5.1v4h-5.1a2 2 0 0 1 0-4Z"
        stroke={color}
        strokeLinejoin="round"
        strokeWidth={1.8}
      />
      <Circle cx={15.6} cy={14.2} fill={color} r={0.8} />
    </SvgShell>
  );
}

function HeartIcon({ color, size = 24 }: IconProps) {
  return (
    <SvgShell size={size}>
      <Path
        d="M12 20.2S4.9 16.1 4.9 10.1c0-2.2 1.7-4 3.9-4 1.3 0 2.5.7 3.2 1.8.7-1.1 1.9-1.8 3.2-1.8 2.2 0 3.9 1.8 3.9 4 0 6-7.1 10.1-7.1 10.1Z"
        fill={color}
      />
    </SvgShell>
  );
}

function GroupIcon({ color, size = 24 }: IconProps) {
  return (
    <SvgShell size={size}>
      <Circle cx={9} cy={9} r={2.7} stroke={color} strokeWidth={1.8} />
      <Circle cx={16.2} cy={10.1} r={2.2} stroke={color} strokeWidth={1.6} />
      <Path
        d="M4.3 19c.4-3 2-4.5 4.7-4.5s4.3 1.5 4.7 4.5M13.7 15.1c2.6.2 4.3 1.5 4.8 3.9"
        stroke={color}
        strokeLinecap="round"
        strokeWidth={1.8}
      />
    </SvgShell>
  );
}

function BellIcon({ color, size = 24 }: IconProps) {
  return (
    <SvgShell size={size}>
      <Path
        d="M6.5 16.8h11c-.9-1-.9-2.6-.9-4.8 0-2.8-1.6-4.9-4.6-4.9S7.4 9.2 7.4 12c0 2.2 0 3.8-.9 4.8Z"
        stroke={color}
        strokeLinejoin="round"
        strokeWidth={1.8}
      />
      <Path
        d="M10.3 19.2h3.4M12 5.5V4"
        stroke={color}
        strokeLinecap="round"
        strokeWidth={1.8}
      />
    </SvgShell>
  );
}

function PiggyIcon({ color, size = 24 }: IconProps) {
  return (
    <SvgShell size={size}>
      <Path
        d="M6.4 15.7c-1.7-.4-2.9-1.3-2.9-2.5 0-.9.7-1.7 1.8-2.2.9-2 3.1-3.2 5.8-3.2 2.2 0 4.1.8 5.2 2.1h2.4v4.4l-1.8.7c-.4 1-1.2 1.8-2.3 2.4v2H12v-1.2c-.4 0-.8.1-1.2.1-.5 0-.9 0-1.4-.1v1.2H6.8l-.4-3.7Z"
        stroke={color}
        strokeLinejoin="round"
        strokeWidth={1.8}
      />
      <Circle cx={15.9} cy={12} fill={color} r={0.7} />
      <Path d="M9.1 7.6c.6-1.2 1.8-2 3.2-2" stroke={color} strokeLinecap="round" strokeWidth={1.8} />
    </SvgShell>
  );
}

function LeafIcon({ color, size = 24 }: IconProps) {
  return (
    <SvgShell size={size}>
      <Path
        d="M20.2 4.2C11 5.2 6.1 9.5 5.4 17.8c5.8.5 11.6-3.1 14.8-13.6Z"
        stroke={color}
        strokeLinejoin="round"
        strokeWidth={1.8}
      />
      <Path d="M5 20c2.8-4.4 6.5-7.1 11.1-8.3" stroke={color} strokeLinecap="round" strokeWidth={1.8} />
    </SvgShell>
  );
}

function CrosshairIcon({ color, size = 24 }: IconProps) {
  return (
    <SvgShell size={size}>
      <Circle cx={12} cy={12} r={6.5} stroke={color} strokeWidth={1.6} />
      <Circle cx={12} cy={12} r={2.3} stroke={color} strokeWidth={1.6} />
      <Path d="M12 2.8v4M12 17.2v4M2.8 12h4M17.2 12h4" stroke={color} strokeLinecap="round" strokeWidth={1.6} />
    </SvgShell>
  );
}

function CompassIcon({ color, size = 24 }: IconProps) {
  return (
    <SvgShell size={size}>
      <Circle cx={12} cy={12} r={7.6} stroke={color} strokeWidth={1.4} />
      <Path
        d="M12 3.5v17M3.5 12h17M12 7.5l2.1 4.4 4.4 2.1-4.4 2.1L12 20.5l-2.1-4.4L5.5 14l4.4-2.1L12 7.5Z"
        stroke={color}
        strokeLinejoin="round"
        strokeWidth={1.4}
      />
    </SvgShell>
  );
}

function KebabIcon({ color, size = 24 }: IconProps) {
  return (
    <SvgShell size={size}>
      <Circle cx={12} cy={6} fill={color} r={1.4} />
      <Circle cx={12} cy={12} fill={color} r={1.4} />
      <Circle cx={12} cy={18} fill={color} r={1.4} />
    </SvgShell>
  );
}

const styles = StyleSheet.create({
  cardBody: {
    color: "rgba(230, 211, 183, 0.72)",
    fontSize: 11,
    lineHeight: 15,
    marginTop: 5,
  },
  cardCopy: {
    flex: 1,
    minWidth: 0,
  },
  cardPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.985 }],
  },
  cardTitle: {
    color: colors.textPrimary,
    fontFamily: "serif",
    fontSize: 14,
    lineHeight: 18,
  },
  columnCaption: {
    color: "rgba(218, 202, 177, 0.72)",
    fontFamily: "serif",
    fontSize: 11,
    lineHeight: 15,
  },
  columnHeader: {
    flex: 1,
  },
  columnHeaderRight: {
    alignItems: "flex-end",
  },
  columnHeaders: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.sm,
    marginHorizontal: spacing.md,
    marginTop: spacing.lg,
  },
  columnTitle: {
    fontFamily: "serif",
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 16,
  },
  content: {
    paddingBottom: 26,
  },
  crest: {
    alignItems: "center",
    borderColor: "rgba(245, 184, 75, 0.42)",
    borderRadius: radius.sm,
    borderWidth: 1,
    height: 54,
    justifyContent: "center",
    transform: [{ rotate: "45deg" }],
    width: 54,
  },
  crestIcon: {
    transform: [{ rotate: "-45deg" }],
  },
  hero: {
    height: 395,
    overflow: "hidden",
  },
  heroCopy: {
    alignItems: "center",
    bottom: 43,
    flexDirection: "row",
    gap: 24,
    left: 22,
    position: "absolute",
  },
  heroFade: {
    ...StyleSheet.absoluteFill,
  },
  heroImage: {
    height: "100%",
    width: "100%",
  },
  heroSideShade: {
    ...StyleSheet.absoluteFill,
  },
  heroSubtitle: {
    color: "rgba(231, 213, 188, 0.78)",
    fontFamily: "serif",
    fontSize: 17,
    lineHeight: 23,
    marginTop: 12,
  },
  heroTextBlock: {
    maxWidth: 230,
  },
  heroTitle: {
    color: colors.primary,
    fontFamily: "serif",
    fontSize: 35,
    fontWeight: "700",
    letterSpacing: 0,
    lineHeight: 38,
    textTransform: "uppercase",
  },
  iconRing: {
    alignItems: "center",
    borderRadius: radius.round,
    borderWidth: 1,
    height: 50,
    justifyContent: "center",
    width: 50,
  },
  intro: {
    color: "rgba(226, 207, 178, 0.76)",
    fontFamily: "serif",
    fontSize: 16,
    lineHeight: 23,
    marginHorizontal: spacing.lg,
    marginTop: 25,
    textAlign: "center",
  },
  linkCell: {
    alignItems: "center",
    alignSelf: "stretch",
    justifyContent: "center",
    width: 44,
  },
  linkHeader: {
    color: colors.primary,
    fontFamily: "serif",
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 16,
    textAlign: "center",
    width: 44,
  },
  linkLine: {
    backgroundColor: colors.primary,
    height: 2,
    left: -5,
    position: "absolute",
    right: -5,
    shadowColor: colors.primary,
    shadowOpacity: 1,
    shadowRadius: 8,
  },
  linkNode: {
    alignItems: "center",
    backgroundColor: "rgba(95, 51, 13, 0.78)",
    borderColor: colors.primary,
    borderRadius: radius.round,
    borderWidth: 1,
    height: 31,
    justifyContent: "center",
    shadowColor: colors.primary,
    shadowOpacity: 0.9,
    shadowRadius: 10,
    width: 31,
  },
  modeActive: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: 10,
    justifyContent: "center",
  },
  modeActiveText: {
    color: colors.textPrimary,
    fontFamily: "serif",
    fontSize: 16,
    lineHeight: 20,
  },
  modeBar: {
    alignItems: "center",
    backgroundColor: "rgba(7, 8, 10, 0.82)",
    borderColor: "rgba(245, 184, 75, 0.42)",
    borderRadius: radius.sm,
    borderWidth: 1,
    flexDirection: "row",
    height: 68,
    marginHorizontal: spacing.md,
    marginTop: -2,
  },
  modeDivider: {
    backgroundColor: "rgba(245, 184, 75, 0.16)",
    height: 42,
    width: 1,
  },
  modeInactive: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: 10,
    justifyContent: "center",
  },
  modeInactiveText: {
    color: "rgba(184, 133, 68, 0.55)",
    fontFamily: "serif",
    fontSize: 16,
    lineHeight: 20,
  },
  pairList: {
    gap: spacing.sm,
    marginHorizontal: spacing.md,
    marginTop: 18,
  },
  pairRow: {
    alignItems: "stretch",
    flexDirection: "row",
    gap: 8,
    minHeight: 112,
  },
  planCard: {
    alignItems: "center",
    borderRadius: radius.sm,
    borderWidth: 1,
    flex: 1,
    flexDirection: "row",
    gap: 10,
    minWidth: 0,
    paddingLeft: 9,
    paddingRight: 22,
    position: "relative",
  },
  quote: {
    color: colors.primary,
    flex: 1,
    fontFamily: "serif",
    fontSize: 18,
    lineHeight: 25,
    textShadowColor: "rgba(245, 184, 75, 0.35)",
    textShadowRadius: 8,
  },
  quoteImage: {
    ...StyleSheet.absoluteFill,
    opacity: 0.38,
  },
  quotePanel: {
    alignItems: "center",
    borderColor: "rgba(245, 184, 75, 0.32)",
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.lg,
    marginHorizontal: spacing.md,
    marginTop: spacing.xl,
    minHeight: 124,
    overflow: "hidden",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  riskCard: {
    backgroundColor: "rgba(37, 10, 7, 0.72)",
    borderColor: "rgba(226, 75, 45, 0.58)",
  },
  riskTitle: {
    color: "#E24B2D",
  },
  rule: {
    backgroundColor: "rgba(246, 232, 200, 0.09)",
    height: 1,
    marginHorizontal: spacing.md,
    marginTop: spacing.lg,
  },
  safeguardCard: {
    backgroundColor: "rgba(6, 33, 16, 0.72)",
    borderColor: "rgba(118, 169, 64, 0.58)",
  },
  safeguardTitle: {
    color: "#76A940",
    textAlign: "right",
  },
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  timeline: {
    backgroundColor: "rgba(245, 184, 75, 0.22)",
    bottom: 57,
    left: "50%",
    marginLeft: -0.5,
    position: "absolute",
    top: 57,
    width: 1,
  },
});
