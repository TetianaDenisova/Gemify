import { Image } from "expo-image";
import { Tabs } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Circle, Path, Rect } from "react-native-svg";

import { menuIcons, type MenuTab } from "@/data/menuIcons";
import {
  getUnseenRewardCount,
  subscribeToRewardCountChanges,
} from "@/db";
import { useBottomInset } from "@/hooks/useBottomInset";
import { useLayoutSize } from "@/hooks/useLayoutSize";
import { useRefreshOnSync } from "@/hooks/useRefreshOnSync";
import { colors } from "@/theme/colors";
import { UserIcon } from "@/shared/components";
import { fonts, layout, tabBarHeightFor } from "@/theme/theme";

interface TabIconProps {
  focused: boolean;
  phone: boolean;
  tab: MenuTab | "habits" | "memories" | "account";
}

function TabIcon({ focused, phone, tab }: TabIconProps) {
  const iconStyle = phone ? styles.tabIconPhone : styles.tabIcon;

  if (tab === "account") {
    return (
      <View style={iconStyle}>
        <UserIcon
          color={focused ? colors.primary : colors.textMuted}
          size={phone ? 24 : 28}
        />
      </View>
    );
  }

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
  const bottomInset = useBottomInset();
  const { phone } = useLayoutSize();
  const [unseenRewards, setUnseenRewards] = useState(0);

  const refreshRewardBadge = useCallback(() => {
    getUnseenRewardCount()
      .then(setUnseenRewards)
      .catch((cause: unknown) =>
        console.error("Failed to load unseen reward count", cause),
      );
  }, []);

  useEffect(() => {
    refreshRewardBadge();
    return subscribeToRewardCountChanges(refreshRewardBadge);
  }, [refreshRewardBadge]);
  useRefreshOnSync(refreshRewardBadge);

  return (
    <Tabs
      screenOptions={{
        sceneStyle: { backgroundColor: colors.background },
        headerStyle: { backgroundColor: colors.backgroundSoft },
        headerTintColor: colors.primary,
        headerTitleStyle: { color: colors.textPrimary },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarShowLabel: true,
        tabBarLabelPosition: "below-icon",
        tabBarStyle: [
          styles.tabBar,
          {
            height: tabBarHeightFor(phone) + bottomInset,
            paddingBottom: bottomInset,
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
          tabBarAccessibilityLabel: "Plan",
          tabBarLabel: "Plan",
          title: "Plan",
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
          href: null,
          title: "Weekly Plan",
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
          tabBarBadge:
            unseenRewards > 0
              ? unseenRewards > 99
                ? "99+"
                : unseenRewards
              : undefined,
          tabBarBadgeStyle: styles.rewardBadge,
          title: "Memories",
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} phone={phone} tab="memories" />
          ),
        }}
      />
      <Tabs.Screen
        name="account-subscription"
        options={{
          headerShown: false,
          tabBarAccessibilityLabel: "Profile",
          tabBarLabel: "Profile",
          title: "Account & Subscription",
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} phone={phone} tab="account" />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderColor: "rgba(154, 163, 173, 0.08)",
    borderTopWidth: 1,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    backgroundColor: "#071119",
    elevation: 0,
  },

  tabBarItem: {
    paddingVertical: 7,
  },

  tabBarItemPhone: {
    justifyContent: "center",
    minHeight: layout.minTouchTarget,
    paddingVertical: 4,
  },

  tabBarLabel: {
    fontFamily: fonts.serif,
    fontSize: 11,
    lineHeight: 15,
    letterSpacing: 0,
    marginTop: 0,
    minWidth: 50,
  },

  rewardBadge: {
    backgroundColor: colors.primary,
    color: colors.textOnPrimary,
    fontSize: 11,
    fontWeight: "700",
  },

  tabIcon: {
    width: 28,
    height: 28,
    marginBottom: 4,
  },

  tabIconPhone: {
    width: 24,
    height: 24,
    marginBottom: 2,
  },
});
