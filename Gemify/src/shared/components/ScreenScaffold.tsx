import { LinearGradient } from "expo-linear-gradient";
import type { ReactNode } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
  type ImageSourcePropType,
  type ScrollViewProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors } from "@/theme/colors";
import { layout, spacing } from "@/theme/theme";

const KEYBOARD_BEHAVIOR = Platform.select<
  "padding" | "height" | undefined
>({
  android: "height",
  default: undefined,
  ios: "padding",
});

export type ScreenScaffoldProps = {
  /** Full-bleed gradient background (e.g. gradients.background). */
  backgroundGradient?: readonly string[];
  /** Full-bleed cover image background with a dark overlay on top. */
  backgroundImage?: ImageSourcePropType;
  children: ReactNode;
  /** Extra styles merged into the scroll content container. */
  contentStyle?: StyleProp<ViewStyle>;
  /**
   * Center content and cap it at layout.contentMaxWidth with the standard
   * horizontal screen padding (compact-aware). Default true.
   */
  constrained?: boolean;
  keyboardAvoiding?: boolean;
  /** Opacity of the dark overlay above backgroundImage. */
  overlayOpacity?: number;
  /** Set false to lay children out directly without a ScrollView. */
  scroll?: boolean;
  /** Extra props for the inner ScrollView (e.g. bounces). */
  scrollProps?: Omit<ScrollViewProps, "contentContainerStyle" | "style">;
  style?: StyleProp<ViewStyle>;
  /** Reserve bottom space for the floating tab bar (tab screens). */
  tabClearance?: boolean;
  /** Add top inset padding (screens without a native/stack header). */
  topInset?: boolean;
};

/**
 * The app-wide screen wrapper: background (color, gradient, or image +
 * overlay), keyboard avoidance, and a vertically scrolling, width-constrained
 * content area with safe-area and tab-bar clearance handled in one place.
 */
export function ScreenScaffold({
  backgroundGradient,
  backgroundImage,
  children,
  constrained = true,
  contentStyle,
  keyboardAvoiding = false,
  overlayOpacity = 0.45,
  scroll = true,
  scrollProps,
  style,
  tabClearance = false,
  topInset = false,
}: ScreenScaffoldProps) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const compact = width < layout.compactBreakpoint;

  const paddingBottom = tabClearance
    ? insets.bottom + layout.tabBarClearance
    : Math.max(insets.bottom, spacing.lg);
  const paddingTop = topInset ? insets.top + spacing.lg : undefined;

  const contentStyles: StyleProp<ViewStyle> = [
    constrained && styles.constrained,
    constrained && {
      paddingHorizontal: compact ? spacing.md : layout.screenPaddingH,
    },
    { paddingBottom },
    paddingTop != null && { paddingTop },
    contentStyle,
  ];

  const body = scroll ? (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      {...scrollProps}
      contentContainerStyle={contentStyles}
      style={styles.flex}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.flex, contentStyles]}>{children}</View>
  );

  return (
    <View style={[styles.screen, style]}>
      {backgroundGradient ? (
        <LinearGradient
          colors={[...backgroundGradient] as [string, string, ...string[]]}
          style={StyleSheet.absoluteFill}
        />
      ) : null}
      {backgroundImage ? (
        <>
          <Image
            resizeMode="cover"
            source={backgroundImage}
            style={styles.backgroundImage}
          />
          <View
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: colors.overlayDark, opacity: overlayOpacity },
            ]}
          />
        </>
      ) : null}
      {keyboardAvoiding ? (
        <KeyboardAvoidingView behavior={KEYBOARD_BEHAVIOR} style={styles.flex}>
          {body}
        </KeyboardAvoidingView>
      ) : (
        body
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    ...StyleSheet.absoluteFill,
    height: "100%",
    width: "100%",
  },
  constrained: {
    alignSelf: "center",
    maxWidth: layout.contentMaxWidth,
    width: "100%",
  },
  flex: {
    flex: 1,
  },
  screen: {
    backgroundColor: colors.background,
    flex: 1,
    overflow: "hidden",
  },
});
