import { StyleSheet, Text, View } from "react-native";

import { NavigationHeader } from "@/components/NavigationHeader";
import { colors } from "@/theme/colors";
import { spacing, typography } from "@/theme/theme";

export default function DetailsScreen() {
  return (
    <>
      <NavigationHeader />
      <View style={styles.container}>
        <Text style={styles.title}>Stack screen</Text>
        <Text style={styles.body}>
          This page sits outside the tab group, so it opens above the tabs and
          uses the shared navigation header.
        </Text>
      </View>
    </>
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
