import { Stack, useRouter } from "expo-router";
import { type ReactNode, useCallback } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";

import { colors } from "@/theme/colors";
import { radius, shadows, spacing } from "@/theme/theme";

export type NavigationHeaderAction = {
  accessibilityLabel: string;
  disabled?: boolean;
  icon: ReactNode;
  onPress: () => void;
};

type NavigationHeaderProps = {
  onBack?: () => void;
  rightAction?: NavigationHeaderAction;
};

type HeaderButtonProps = NavigationHeaderAction;

function BackIcon() {
  return (
    <Svg fill="none" height={24} viewBox="0 0 24 24" width={24}>
      <Path
        d="M19 12H5M11 18l-6-6 6-6"
        stroke={colors.primary}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
      />
    </Svg>
  );
}

function HeaderButton({
  accessibilityLabel,
  disabled = false,
  icon,
  onPress,
}: HeaderButtonProps) {
  return (
    <View style={[styles.buttonGlow, disabled && styles.buttonDisabled]}>
      <Pressable
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="button"
        disabled={disabled}
        hitSlop={8}
        onPress={onPress}
        style={({ pressed }) => [
          styles.button,
          pressed && styles.buttonPressed,
        ]}
      >
        <View pointerEvents="none" style={styles.buttonInnerEdge} />
        {icon}
      </Pressable>
    </View>
  );
}

export function NavigationHeader({
  onBack,
  rightAction,
}: NavigationHeaderProps) {
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

  return (
    <Stack.Header asChild>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.row}>
          <HeaderButton
            accessibilityLabel="Go back"
            icon={<BackIcon />}
            onPress={handleBack}
          />

          {rightAction ? (
            <HeaderButton {...rightAction} />
          ) : (
            <View style={styles.buttonPlaceholder} />
          )}
        </View>
      </View>
    </Stack.Header>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    backgroundColor: colors.surfaceGlass,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    height: 48,
    justifyContent: "center",
    overflow: "hidden",
    width: 48,
  },
  buttonDisabled: {
    opacity: 0.38,
  },
  buttonGlow: {
    backgroundColor: colors.surfaceGlass,
    borderRadius: radius.md,
    height: 48,
    width: 48,
    ...shadows.goldGlow,
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  buttonInnerEdge: {
    ...StyleSheet.absoluteFill,
    borderBottomColor: colors.secondaryDark,
    borderColor: colors.borderSoft,
    borderRadius: radius.md,
    borderWidth: 1,
    margin: 2,
  },
  buttonPlaceholder: {
    height: 48,
    width: 48,
  },
  buttonPressed: {
    backgroundColor: colors.secondary,
    borderColor: colors.primary,
    transform: [{ scale: 0.97 }],
  },
  header: {
    backgroundColor: colors.transparent,
    width: "100%",
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    height: 68,
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
  },
});
