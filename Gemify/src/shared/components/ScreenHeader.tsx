import { Stack, useRouter } from "expo-router";
import { useCallback, type ReactNode } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors } from "@/theme/colors";
import { controls, spacing } from "@/theme/theme";

import { AppText } from "./AppText";
import { BackIcon } from "./icons";
import { IconButton, type IconButtonSize } from "./IconButton";

export type ScreenHeaderAction = {
  accessibilityLabel: string;
  disabled?: boolean;
  icon: ReactNode;
  label?: string;
  onPress: () => void;
};

export type ScreenHeaderProps = {
  /**
   * Render inside expo-router's transparent stack header slot instead of
   * inline. Use on stack screens; tab screens render the header inline at the
   * top of their scroll content.
   */
  asStackHeader?: boolean;
  buttonSize?: IconButtonSize;
  /** Custom centered content rendered instead of the title/subtitle block. */
  centerSlot?: ReactNode;
  /**
   * Left button. Defaults to a back button (onBack, else router.back, else
   * replace "/"). Pass null to render a spacer instead.
   */
  leftAction?: ScreenHeaderAction | null;
  onBack?: () => void;
  rightAction?: ScreenHeaderAction | null;
  /** Custom right-side content (e.g. a button group) rendered instead of rightAction. */
  rightSlot?: ReactNode;
  style?: StyleProp<ViewStyle>;
  subtitle?: string;
  title?: string;
};

function ActionSlot({
  action,
  size,
}: {
  action: ScreenHeaderAction | null;
  size: IconButtonSize;
}) {
  const side = controls.iconButton[size];

  if (!action) {
    return <View style={{ height: side, width: side }} />;
  }

  return <IconButton {...action} size={size} />;
}

/**
 * The app-wide screen header: left button · optional centered title/subtitle ·
 * right button. Replaces NavigationHeader and every hand-rolled screen header.
 */
export function ScreenHeader({
  asStackHeader = false,
  buttonSize = "sm",
  centerSlot,
  leftAction,
  onBack,
  rightAction = null,
  rightSlot,
  style,
  subtitle,
  title,
}: ScreenHeaderProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleBack = useCallback(() => {
    if (onBack) {
      onBack();
      return;
    }

    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace("/");
  }, [onBack, router]);

  const left =
    leftAction !== undefined
      ? leftAction
      : {
          accessibilityLabel: "Go back",
          icon: <BackIcon />,
          onPress: handleBack,
        };

  const hasTitle = Boolean(title);

  const row = (
    <View style={[styles.row, style]}>
      <ActionSlot action={left} size={buttonSize} />

      {centerSlot ? (
        <View style={styles.centerSlot}>{centerSlot}</View>
      ) : hasTitle ? (
        <View style={styles.titleBlock}>
          <AppText align="center" numberOfLines={1} variant="screenTitle">
            {title}
          </AppText>
          {subtitle ? (
            <AppText align="center" color={colors.primary} variant="subtitle">
              {subtitle}
            </AppText>
          ) : null}
        </View>
      ) : (
        <View style={styles.flexSpacer} />
      )}

      {rightSlot ?? <ActionSlot action={rightAction} size={buttonSize} />}
    </View>
  );

  if (!asStackHeader) {
    return row;
  }

  return (
    <Stack.Header asChild>
      <View style={[styles.stackHeader, { paddingTop: insets.top }]}>
        {row}
      </View>
    </Stack.Header>
  );
}

const styles = StyleSheet.create({
  centerSlot: {
    alignItems: "center",
    flex: 1,
  },
  flexSpacer: {
    flex: 1,
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "space-between",
    minHeight: 68,
    paddingHorizontal: spacing.lg,
  },
  stackHeader: {
    backgroundColor: colors.transparent,
    width: "100%",
  },
  titleBlock: {
    flex: 1,
    minWidth: 0,
  },
});
