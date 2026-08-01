import type { ReactNode } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

import { colors } from "@/theme/colors";
import { radius, spacing } from "@/theme/theme";

import { AppText } from "./AppText";
import { BulbIcon } from "./icons";

export type HintRowProps = {
  icon?: ReactNode;
  style?: StyleProp<ViewStyle>;
  text: string;
};

/** Helper hint: small glass icon circle + secondary text. */
export function HintRow({ icon, style, text }: HintRowProps) {
  return (
    <View style={[styles.row, style]}>
      <View style={styles.iconCircle}>{icon ?? <BulbIcon />}</View>
      <AppText style={styles.text} variant="helper">
        {text}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  iconCircle: {
    alignItems: "center",
    backgroundColor: colors.surfaceGlass,
    borderColor: colors.borderSoft,
    borderRadius: radius.round,
    borderWidth: 1,
    height: 52,
    justifyContent: "center",
    width: 52,
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
  },
  text: {
    flex: 1,
  },
});
