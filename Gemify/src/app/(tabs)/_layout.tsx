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
        name="explore"
        options={{
          title: "Explore",
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
