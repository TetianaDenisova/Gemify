import { Stack } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { colors } from "@/theme/colors";
import { spacing, typography } from "@/theme/theme";

export default function DetailsScreen() {
  return (
    <View style={styles.container}>
      <Stack.Title>Gem details</Stack.Title>
      <Text style={styles.title}>Stack screen</Text>
      <Text style={styles.body}>
        This page sits outside the tab group, so it opens above the tabs and
        gets the native stack back button automatically.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
    ...typography.body,
    maxWidth: 340,
    textAlign: "center",
  },
  container: {
    alignItems: "center",
    backgroundColor: colors.background,
    flex: 1,
    justifyContent: "center",
    padding: spacing.lg,
  },
  title: {
    ...typography.title,
    letterSpacing: 0,
    marginBottom: spacing.sm,
    textAlign: "center",
  },
});
