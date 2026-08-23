import { Image } from "expo-image";
import { Tabs } from "expo-router";
import { StyleSheet } from "react-native";
import Svg, { Circle, Path, Rect } from "react-native-svg";

import { menuIcons, type MenuTab } from "@/data/menuIcons";
import { colors } from "@/theme/colors";
import { layout, radius, shadows, spacing, typography } from "@/theme/theme";

interface TabIconProps {
  focused: boolean;
  tab: MenuTab | "habits" | "memories";
}

function TabIcon({ focused, tab }: TabIconProps) {
  if (tab === "memories") {
    const tint = focused ? colors.primary : colors.textMuted;

    return (
      <Svg height={28} viewBox="0 0 28 28" width={28} style={styles.tabIcon}>
        <Rect
          fill={focused ? "rgba(245, 184, 75, 0.14)" : colors.transparent}
          height={19}
          rx={4}
          stroke={tint}
          strokeWidth={1.4}
          width={21}
          x={3.5}
          y={4.5}
        />
        <Circle cx={10} cy={10.5} fill="none" r={2.2} stroke={tint} strokeWidth={1.3} />
        <Path
          d="m5.5 20 5-5.5 3.5 3.6 3.6-4.1 4.9 6"
          fill="none"
          stroke={tint}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.4}
        />
      </Svg>
    );
  }

  if (tab === "habits") {
    const tint = focused ? colors.primary : colors.textMuted;

    return (
      <Svg height={28} viewBox="0 0 28 28" width={28} style={styles.tabIcon}>
        <Circle
          cx={14}
          cy={14}
          fill={focused ? "rgba(245, 184, 75, 0.14)" : colors.transparent}
          r={11.5}
          stroke={tint}
          strokeWidth={1.4}
        />
        <Path
          d="M14 5.5 16 11.2 21.8 14 16 16.8 14 22.5 12 16.8 6.2 14 12 11.2 14 5.5Z"
          fill="none"
          stroke={tint}
          strokeLinejoin="round"
          strokeWidth={1.4}
        />
        <Path
          d="M9.5 17.2c1.7-1 3.3-1.5 4.8-1.5M18.5 10.8c-1.5.1-2.8.5-3.9 1.3"
          fill="none"
          stroke={tint}
          strokeLinecap="round"
          strokeWidth={1.2}
        />
      </Svg>
    );
  }

  const iconSource = focused
    ? menuIcons[tab].active
    : menuIcons[tab].inactive;

  return (
    <Image
      source={iconSource}
      style={styles.tabIcon}
      contentFit="contain"
    />
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        sceneStyle: { backgroundColor: colors.background },
        headerStyle: { backgroundColor: colors.backgroundSoft },
        headerTintColor: colors.primary,
        headerTitleStyle: { color: colors.textPrimary },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: styles.tabBar,
        tabBarItemStyle: styles.tabBarItem,
        tabBarLabelStyle: styles.tabBarLabel,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          headerShown: false,
          tabBarLabel: "Home",
          title: "Home",
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} tab="home" />
          ),
        }}
      />
      <Tabs.Screen
        name="my-day"
        options={{
          headerShown: false,
          tabBarLabel: "Today",
          title: "My Day",
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} tab="today" />
          ),
        }}
      />
      <Tabs.Screen
        name="milestone-quests"
        options={{
          headerShown: false,
          href: null,
          title: "Milestone Quests",
        }}
      />
      <Tabs.Screen
        name="sprint"
        options={{
          headerShown: false,
          tabBarLabel: "Weekly Plan",
          title: "Weekly Plan",
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} tab="sprint" />
          ),
        }}
      />
      <Tabs.Screen
        name="habits"
        options={{
          headerShown: false,
          tabBarLabel: "Habits",
          title: "Habits",
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} tab="habits" />
          ),
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          headerShown: false,
          tabBarLabel: "Progress",
          title: "Progress",
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} tab="progress" />
          ),
        }}
      />
      <Tabs.Screen
        name="memories"
        options={{
          headerShown: false,
          tabBarLabel: "Memories",
          title: "Memories",
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} tab="memories" />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: "absolute",
    bottom: spacing.sm,
    left: spacing.lg,
    right: spacing.lg,
    height: layout.tabBarHeight,
    borderTopWidth: 1,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    overflow: "hidden",
    ...shadows.softDark,
  },

  tabBarItem: {
    paddingVertical: 7,
  },

  tabBarLabel: {
    ...typography.micro,
    marginTop: 0,
  },

  tabIcon: {
    width: 28,
    height: 28,
    marginBottom: 4,
  },
});
