import { StyleSheet, Text, View } from "react-native";

import { colors } from "@/theme/colors";
import { spacing, typography } from "@/theme/theme";

interface HomeHeaderProps {
  greeting: string;
  subtitle: string;
}

export function HomeHeader({ greeting, subtitle }: HomeHeaderProps) {
  const hasSpark = greeting.endsWith("✦");
  const greetingText = hasSpark ? greeting.slice(0, -1).trimEnd() : greeting;

  return (
    <View style={styles.container}>
      <Text style={styles.greeting}>
        {greetingText}
        {hasSpark ? <Text style={styles.spark}> ✦</Text> : null}
      </Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
    paddingTop: spacing.sm,
  },
  greeting: {
    ...typography.screenTitle,
    fontSize: 34,
    lineHeight: 42,
  },
  spark: {
    color: colors.primary,
  },
  subtitle: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: "400",
    lineHeight: 21,
    marginTop: spacing.sm,
  },
});
