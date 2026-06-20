import { StyleSheet, Text, View } from "react-native";

import { colors } from "@/theme/colors";

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
    marginBottom: 28,
    paddingTop: 10,
  },
  greeting: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0,
    lineHeight: 10,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 8,
  },
});
