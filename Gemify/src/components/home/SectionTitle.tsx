import { StyleSheet, Text } from "react-native";

import { colors } from "@/theme/colors";

interface SectionTitleProps {
  title: string;
}

export function SectionTitle({ title }: SectionTitleProps) {
  return <Text style={styles.title}>{title}</Text>;
}

const styles = StyleSheet.create({
  title: {
    color: colors.gold,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0,
    marginBottom: 14,
    marginTop: 14,
  },
});
