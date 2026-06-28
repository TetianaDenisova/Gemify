import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="details" options={{ title: "Gem details" }} />
        <Stack.Screen name="journey-map" options={{ headerShown: false }} />
      </Stack>
    </GestureHandlerRootView>
  );
}
