import { StyleSheet, Text, View } from "react-native";

import { colors } from "@/theme/colors";
import { spacing, typography } from "@/theme/theme";

interface HomeHeaderProps {
  greeting: string;
  subtitle: string;
}

export function HomeHeader({ greeting, subtitle }: HomeHeaderProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.greeting}>{greeting}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.sm,
    paddingTop: 2,
  },
  greeting: {
    ...typography.title,
    fontSize: 16,
    fontWeight: "800",
    lineHeight: 24,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
});
