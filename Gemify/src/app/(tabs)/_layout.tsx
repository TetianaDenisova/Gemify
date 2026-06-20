import { Image } from "expo-image";
import { Tabs } from "expo-router";
import { StyleSheet } from "react-native";

import { menuIcons, type MenuTab } from "@/data/menuIcons";
import { colors } from "@/theme/colors";

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
        headerStyle: { backgroundColor: "#ffffff" },
        headerTintColor: "#15171a",
        tabBarActiveTintColor: colors.gold,
        tabBarInactiveTintColor: "#B39582",
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
        name="today"
        options={{
          tabBarLabel: "Today",
          title: "Today",
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
    marginHorizontal: 28,
    marginBottom: 10,
    borderTopWidth: 0,
    borderWidth: 0,
    borderRadius: 22,
    backgroundColor: "rgba(5, 7, 17, 0.92)",
    overflow: "hidden",
  },

  tabBarItem: {
    paddingVertical: 7,
  },

  tabBarLabel: {
    fontSize: 12,
    fontWeight: "400",
    lineHeight: 15,
    marginTop: 0,
  },

  tabIcon: {
    width: 28,
    height: 28,
    marginBottom: 4,
  },
});
