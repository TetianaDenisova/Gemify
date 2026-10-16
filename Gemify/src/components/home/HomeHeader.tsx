import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import { AppText } from "@/shared/components";
import { useLayoutSize } from "@/hooks/useLayoutSize";
import { colors } from "@/theme/colors";
import { spacing } from "@/theme/theme";

interface HomeHeaderProps {
  /** Optional control rendered in the top-right corner (e.g. ⋮ menu). */
  action?: ReactNode;
  greeting: string;
  subtitle?: string;
}

export function HomeHeader({ action, greeting, subtitle }: HomeHeaderProps) {
  const { phone } = useLayoutSize();
  const hasSpark = greeting.endsWith("✦");
  const greetingText = hasSpark ? greeting.slice(0, -1).trimEnd() : greeting;

  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <AppText style={[styles.title, phone && styles.titlePhone]} variant="screenTitle">
          {greetingText}
          {hasSpark ? (
            <AppText color={colors.primary} style={[styles.spark, phone && styles.sparkPhone]} variant="screenTitle">
              {" "}
              ✦
            </AppText>
          ) : null}
        </AppText>
        {action ? <View style={styles.action}>{action}</View> : null}
      </View>
      {subtitle ? (
        <AppText color={colors.primary} style={styles.subtitle} variant="subtitle">
          {subtitle}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  action: {
    marginLeft: spacing.sm,
  },
  container: {
    marginBottom: 20,
    paddingTop: 18,
  },
  subtitle: {
    marginTop: spacing.sm,
  },
  title: {
    color: "#F6DEB8",
    flex: 1,
    fontSize: 42,
    fontWeight: "400",
    lineHeight: 54,
    minWidth: 0,
  },
  titlePhone: { fontSize: 32, lineHeight: 43 },
  spark: { fontSize: 36, lineHeight: 54 },
  sparkPhone: { fontSize: 29, lineHeight: 43 },
  titleRow: {
    alignItems: "flex-start",
    flexDirection: "row",
  },
});
