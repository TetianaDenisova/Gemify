import { StyleSheet, Text, View } from "react-native";

import { colors } from "@/theme/colors";
import { spacing, typography } from "@/theme/theme";

export default function SprintScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sprint</Text>
      <Text style={styles.body}>
        Plan the next push, keep priorities visible, and turn bigger goals into
        a workable sprint.
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
