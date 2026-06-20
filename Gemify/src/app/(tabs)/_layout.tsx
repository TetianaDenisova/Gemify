import { Image } from "react-native";
import { Tabs } from "expo-router";

const homeIcon = require("../../../assets/images/tabIcons/home.png");
const exploreIcon = require("../../../assets/images/tabIcons/explore.png");

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: "#ffffff" },
        headerTintColor: "#15171a",
        tabBarActiveTintColor: "#208AEF",
        tabBarInactiveTintColor: "#7b8491",
        tabBarStyle: {
          borderTopColor: "#e5e9f0",
          backgroundColor: "#ffffff",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          headerShown: false,
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Image
              source={homeIcon}
              style={{ height: size, tintColor: color, width: size }}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="today"
        options={{
          title: "Today",
          tabBarIcon: ({ color, size }) => (
            <Image
              source={exploreIcon}
              style={{ height: size, tintColor: color, width: size }}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="sprint"
        options={{
          title: "Sprint",
          tabBarIcon: ({ color, size }) => (
            <Image
              source={exploreIcon}
              style={{ height: size, tintColor: color, width: size }}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: "Progress",
          tabBarIcon: ({ color, size }) => (
            <Image
              source={exploreIcon}
              style={{ height: size, tintColor: color, width: size }}
            />
          ),
        }}
      />
    </Tabs>
  );
}
