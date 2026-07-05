import { StyleSheet, Text, View } from "react-native";

import { colors } from "@/theme/colors";
import { spacing, typography } from "@/theme/theme";

export default function ProgressScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Progress</Text>
      <Text style={styles.body}>
        Track momentum over time and make the next useful move easier to see.
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
