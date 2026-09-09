import { Image } from "expo-image";
import { Tabs } from "expo-router";
import { StyleSheet } from "react-native";
import Svg, { Circle, Path, Rect } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { menuIcons, type MenuTab } from "@/data/menuIcons";
import { useLayoutSize } from "@/hooks/useLayoutSize";
import { colors } from "@/theme/colors";
import { layout, tabBarHeightFor, typography } from "@/theme/theme";

interface TabIconProps {
  focused: boolean;
  /** No label under the icon on phones, so it centers itself in the bar. */
  phone: boolean;
  tab: MenuTab | "habits" | "memories";
}

function TabIcon({ focused, phone, tab }: TabIconProps) {
  const iconStyle = phone ? styles.tabIconPhone : styles.tabIcon;

  if (tab === "memories") {
    const tint = focused ? colors.primary : colors.textMuted;

    return (
      <Svg height={28} viewBox="0 0 28 28" width={28} style={iconStyle}>
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
      <Svg height={28} viewBox="0 0 28 28" width={28} style={iconStyle}>
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
      style={iconStyle}
      contentFit="contain"
    />
  );
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  // Six tabs share 402 pt on a phone (~67 pt each), so the labels go and the
  // bar drops to 56 pt. Tablets keep the 72 pt bar with its labels.
  const { phone } = useLayoutSize();

  return (
    <Tabs
      screenOptions={{
        sceneStyle: { backgroundColor: colors.background },
        headerStyle: { backgroundColor: colors.backgroundSoft },
        headerTintColor: colors.primary,
        headerTitleStyle: { color: colors.textPrimary },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarShowLabel: !phone,
        tabBarStyle: [
          styles.tabBar,
          {
            height: tabBarHeightFor(phone) + insets.bottom,
            paddingBottom: insets.bottom,
          },
        ],
        tabBarItemStyle: [
          styles.tabBarItem,
          phone && styles.tabBarItemPhone,
        ],
        tabBarLabelStyle: styles.tabBarLabel,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          headerShown: false,
          tabBarAccessibilityLabel: "Home",
          tabBarLabel: "Home",
          title: "Home",
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} phone={phone} tab="home" />
          ),
        }}
      />
      <Tabs.Screen
        name="my-day"
        options={{
          headerShown: false,
          tabBarAccessibilityLabel: "Today",
          tabBarLabel: "Today",
          title: "My Day",
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} phone={phone} tab="today" />
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
        name="habits"
        options={{
          headerShown: false,
          tabBarAccessibilityLabel: "Habits",
          tabBarLabel: "Habits",
          title: "Habits",
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} phone={phone} tab="habits" />
          ),
        }}
      />
      <Tabs.Screen
        name="sprint"
        options={{
          headerShown: false,
          tabBarAccessibilityLabel: "Weekly Plan",
          tabBarLabel: "Weekly Plan",
          title: "Weekly Plan",
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} phone={phone} tab="sprint" />
          ),
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          headerShown: false,
          tabBarAccessibilityLabel: "Progress",
          tabBarLabel: "Progress",
          title: "Progress",
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} phone={phone} tab="progress" />
          ),
        }}
      />
      <Tabs.Screen
        name="memories"
        options={{
          headerShown: false,
          tabBarAccessibilityLabel: "Memories",
          tabBarLabel: "Memories",
          title: "Memories",
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} phone={phone} tab="memories" />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  // Flat edge-to-edge bar: the tab bar reads as part of the screen edge, so
  // pinned footer cards (e.g. the weekly ascent capsule) stay the only
  // rounded surface at the bottom.
  tabBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 0,
    backgroundColor: colors.surface,
    elevation: 0,
  },

  tabBarItem: {
    paddingVertical: 7,
  },

  /** No label to sit under, so the icon centers in a 44 pt touch target. */
  tabBarItemPhone: {
    justifyContent: "center",
    minHeight: layout.minTouchTarget,
    paddingVertical: 6,
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

  tabIconPhone: {
    width: 28,
    height: 28,
    marginBottom: 0,
  },
});
