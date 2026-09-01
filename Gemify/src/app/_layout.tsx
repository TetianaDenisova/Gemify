import { Stack, usePathname } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { Platform, StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { initDatabase } from "@/db";
import { colors } from "@/theme/colors";

/**
 * Stack screens drawing their own header via `ScreenHeader asStackHeader` on a
 * transparent native header. `headerTitle: ""` keeps the native header from
 * flashing the route filename underneath.
 */
const TRANSPARENT_HEADER_SCREENS = [
  "journey-map",
  "what-if-plan",
  "create-goal",
  "describe-dream",
  "see-dream",
  "state",
] as const;

const transparentHeaderOptions = {
  headerShown: true,
  headerTitle: "",
  headerTransparent: true,
} as const;

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
    <GestureHandlerRootView style={styles.root}>
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
        {TRANSPARENT_HEADER_SCREENS.map((name) => (
          <Stack.Screen key={name} name={name} options={transparentHeaderOptions} />
        ))}
        <Stack.Screen name="create-habit" options={{ headerShown: false }} />
        <Stack.Screen name="milestone-ideas" options={{ headerShown: false }} />
      </Stack>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: colors.background,
    flex: 1,
  },
});
