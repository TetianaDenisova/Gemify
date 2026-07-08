import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { colors } from "@/theme/colors";

export default function RootLayout() {
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
          name="create-goal"
          options={{ headerShown: true, headerTransparent: true }}
        />
      </Stack>
    </GestureHandlerRootView>
  );
}
