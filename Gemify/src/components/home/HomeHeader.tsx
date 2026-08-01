import { StyleSheet, View } from "react-native";

import { AppText } from "@/shared/components";
import { colors } from "@/theme/colors";
import { spacing } from "@/theme/theme";

interface HomeHeaderProps {
  greeting: string;
  subtitle: string;
}

export function HomeHeader({ greeting, subtitle }: HomeHeaderProps) {
  const hasSpark = greeting.endsWith("✦");
  const greetingText = hasSpark ? greeting.slice(0, -1).trimEnd() : greeting;

  return (
    <View style={styles.container}>
      <AppText variant="screenTitle">
        {greetingText}
        {hasSpark ? (
          <AppText color={colors.primary} variant="screenTitle">
            {" "}
            ✦
          </AppText>
        ) : null}
      </AppText>
      <AppText color={colors.primary} style={styles.subtitle} variant="subtitle">
        {subtitle}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
    paddingTop: spacing.sm,
  },
  subtitle: {
    marginTop: spacing.sm,
  },
});
