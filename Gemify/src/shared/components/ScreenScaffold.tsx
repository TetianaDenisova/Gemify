import { LinearGradient } from "expo-linear-gradient";
import type { ReactNode } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
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
  backgroundGradient?: readonly [string, string, ...string[]];
  /** Full-bleed cover image background with a dark overlay on top. */
  backgroundImage?: ImageSourcePropType;
  children: ReactNode;
  /** Extra styles merged into the scroll content container. */
  contentStyle?: StyleProp<ViewStyle>;
  /**
   * Pinned below the scroll area (above the tab bar when tabClearance is on).
   * Takes over the bottom safe-area/tab clearance padding from the content.
   */
  footer?: ReactNode;
  /**
   * Stretch the footer edge-to-edge: no width cap or side padding, sitting
   * flush on the tab bar (or the screen bottom without tabClearance).
   */
  footerFullBleed?: boolean;
  /**
   * Bottom-sheet-style backdrop: dims everything behind the footer while
   * visible (e.g. an expanded footer card). Tapping it fires onPress.
   */
  footerScrim?: { onPress?: () => void; visible: boolean };
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
  footer,
  footerFullBleed = false,
  footerScrim,
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

  const horizontalPadding = constrained
    ? { paddingHorizontal: compact ? spacing.md : layout.screenPaddingH }
    : null;

  const contentStyles: StyleProp<ViewStyle> = [
    constrained && styles.constrained,
    horizontalPadding,
    // With a pinned footer, the footer owns the bottom clearance.
    { paddingBottom: footer ? spacing.md : paddingBottom },
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
          colors={backgroundGradient}
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
      {footerScrim?.visible ? (
        <Pressable
          accessibilityLabel="Dismiss overlay"
          accessibilityRole="button"
          onPress={footerScrim.onPress}
          style={styles.scrim}
        />
      ) : null}
      {footer ? (
        <View
          style={
            footerFullBleed
              ? {
                  paddingBottom: tabClearance
                    ? insets.bottom + layout.tabBarHeight
                    : insets.bottom,
                }
              : [
                  constrained && styles.constrained,
                  horizontalPadding,
                  { paddingBottom },
                ]
          }
        >
          {footer}
        </View>
      ) : null}
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
  scrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.scrim,
  },
});
