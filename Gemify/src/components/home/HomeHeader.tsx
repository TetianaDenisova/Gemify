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
    marginBottom: 12,
    paddingTop: 2,
  },
  greeting: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0,
    lineHeight: 31,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 3,
  },
});
