import { StyleSheet, Text, View } from "react-native";

import { colors } from "@/theme/colors";
import { spacing, typography } from "@/theme/theme";

export default function TodayScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Today</Text>
      <Text style={styles.body}>
        A focused daily view for the gems, tasks, and check-ins that matter
        right now.
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
