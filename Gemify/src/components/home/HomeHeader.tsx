import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import { AppText } from "@/shared/components";
import { colors } from "@/theme/colors";
import { spacing } from "@/theme/theme";

interface HomeHeaderProps {
  /** Optional control rendered in the top-right corner (e.g. ⋮ menu). */
  action?: ReactNode;
  greeting: string;
  subtitle: string;
}

export function HomeHeader({ action, greeting, subtitle }: HomeHeaderProps) {
  const hasSpark = greeting.endsWith("✦");
  const greetingText = hasSpark ? greeting.slice(0, -1).trimEnd() : greeting;

  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <AppText style={styles.title} variant="screenTitle">
          {greetingText}
          {hasSpark ? (
            <AppText color={colors.primary} variant="screenTitle">
              {" "}
              ✦
            </AppText>
          ) : null}
        </AppText>
        {action ? <View style={styles.action}>{action}</View> : null}
      </View>
      <AppText color={colors.primary} style={styles.subtitle} variant="subtitle">
        {subtitle}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  action: {
    marginLeft: spacing.sm,
  },
  container: {
    marginBottom: spacing.md,
    paddingTop: spacing.sm,
  },
  subtitle: {
    marginTop: spacing.sm,
  },
  title: {
    flex: 1,
    minWidth: 0,
  },
  titleRow: {
    alignItems: "flex-start",
    flexDirection: "row",
  },
});
