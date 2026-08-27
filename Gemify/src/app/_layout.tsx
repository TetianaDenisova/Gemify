import { Stack, usePathname } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { initDatabase } from "@/db";
import { colors } from "@/theme/colors";

export default function RootLayout() {
  const pathname = usePathname();

  useEffect(() => {
    initDatabase().catch((cause) => {
      console.error("Failed to initialize the database", cause);
    });
  }, []);

  useEffect(() => {
    // On web, navigation hides the previous scene with aria-hidden while the
    // tapped button keeps focus, which the browser flags. Drop focus on route
    // change so hidden scenes never contain the focused element.
    if (Platform.OS !== "web") return;
    const active = document.activeElement;
    if (active instanceof HTMLElement) active.blur();
  }, [pathname]);

  return (
    <GestureHandlerRootView style={{ backgroundColor: colors.background, flex: 1 }}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          contentStyle: { backgroundColor: colors.background },
          headerStyle: { backgroundColor: colors.backgroundSoft },
          headerTintColor: colors.primary,
          headerTitleStyle: { color: colors.textPrimary },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="details"
          options={{ headerTransparent: true, title: "Gem details" }}
        />
        <Stack.Screen
          name="journey-map"
          options={{ headerShown: true, headerTransparent: true }}
        />
        <Stack.Screen
          name="what-if-plan"
          options={{ headerShown: true, headerTransparent: true }}
        />
        <Stack.Screen
          name="create-goal"
          options={{ headerShown: true, headerTransparent: true }}
        />
        <Stack.Screen
          name="describe-dream"
          options={{ headerShown: true, headerTransparent: true }}
        />
        <Stack.Screen
          name="see-dream"
          options={{ headerShown: true, headerTransparent: true }}
        />
        <Stack.Screen
          name="state"
          options={{ headerShown: true, headerTransparent: true }}
        />
        <Stack.Screen
          name="create-habit"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="milestone-ideas"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="items-demo"
          options={{ headerShown: true, headerTransparent: true }}
        />
      </Stack>
    </GestureHandlerRootView>
  );
}
