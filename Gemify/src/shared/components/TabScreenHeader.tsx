import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import { useLayoutSize } from "@/hooks/useLayoutSize";
import { colors } from "@/theme/colors";
import { fontSizes, lineHeights, spacing, textGlow } from "@/theme/theme";

import { AppText } from "./AppText";
import { IconButton, iconButtonSide } from "./IconButton";
import type { ScreenHeaderAction } from "./ScreenHeader";

export type TabScreenHeaderProps = {
  leftAction?: ScreenHeaderAction;
  rightAction?: ScreenHeaderAction;
  rightSlot?: ReactNode;
  title: string;
};

export function TabScreenHeader({
  leftAction,
  rightAction,
  rightSlot,
  title,
}: TabScreenHeaderProps) {
  const { compact, phone } = useLayoutSize();
  const buttonSize = compact ? "sm" : "md";
  const side = iconButtonSide(buttonSize, phone);
  const slotStyle = { height: side, width: side };

  return (
    <View style={[styles.header, compact && styles.headerCompact]}>
      <View style={slotStyle}>
        {leftAction ? <IconButton {...leftAction} size={buttonSize} /> : null}
      </View>
      <View style={[styles.titleBlock, compact && styles.titleBlockCompact]}>
        <AppText
          adjustsFontSizeToFit
          align="center"
          color={colors.primary}
          numberOfLines={2}
          style={[styles.title, compact && styles.titleCompact]}
          variant="screenTitle"
        >
          {title}
        </AppText>
      </View>
      <View style={slotStyle}>
        {rightSlot ?? (rightAction ? <IconButton {...rightAction} size={buttonSize} /> : null)}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 92,
  },
  headerCompact: {
    minHeight: 72,
  },
  title: {
    ...textGlow(colors.primaryGlow, 12),
  },
  titleBlock: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 18,
  },
  titleBlockCompact: {
    paddingHorizontal: spacing.sm,
  },
  titleCompact: {
    fontSize: fontSizes.cardTitle,
    lineHeight: lineHeights.cardTitle,
  },
});
