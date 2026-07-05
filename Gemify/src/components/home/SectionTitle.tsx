import type { StyleProp, TextStyle } from "react-native";
import { StyleSheet, Text } from "react-native";

import { colors } from "@/theme/colors";
import { spacing, typography } from "@/theme/theme";

interface SectionTitleProps {
  style?: StyleProp<TextStyle>;
  title: string;
}

export function SectionTitle({ style, title }: SectionTitleProps) {
  return <Text style={[styles.title, style]}>{title}</Text>;
}

const styles = StyleSheet.create({
  title: {
    ...typography.caption,
    color: colors.primary,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
});
