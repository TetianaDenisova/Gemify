import { Image } from "expo-image";
import { Tabs } from "expo-router";
import { StyleSheet } from "react-native";

import { menuIcons, type MenuTab } from "@/data/menuIcons";
import { colors } from "@/theme/colors";
import { radius, shadows, spacing, typography } from "@/theme/theme";

interface TabIconProps {
  focused: boolean;
  tab: MenuTab;
}

function TabIcon({ focused, tab }: TabIconProps) {
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
        name="milestone-quests"
        options={{
          headerShown: false,
          tabBarLabel: "Today",
          title: "Milestone Quests",
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} tab="today" />
          ),
        }}
      />
      <Tabs.Screen
        name="sprint"
        options={{
          tabBarLabel: "Sprint",
          title: "Sprint",
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} tab="sprint" />
          ),
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          tabBarLabel: "Progress",
          title: "Progress",
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} tab="progress" />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: "absolute",
    height: 72,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    borderTopWidth: 1,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceGlass,
    overflow: "hidden",
    ...shadows.softDark,
  },

  tabBarItem: {
    paddingVertical: 7,
  },

  tabBarLabel: {
    ...typography.caption,
    fontSize: 11,
    lineHeight: 14,
    marginTop: 0,
  },

  tabIcon: {
    width: 28,
    height: 28,
    marginBottom: 4,
  },
});
