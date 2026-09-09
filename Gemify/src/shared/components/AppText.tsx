import { Text, type TextProps, type TextStyle } from "react-native";

import { useLayoutSize } from "@/hooks/useLayoutSize";
import { maxFontScaleFor, typography, typographyPhone } from "@/theme/theme";

export type AppTextVariant = keyof typeof typography;

export type AppTextProps = TextProps & {
  align?: TextStyle["textAlign"];
  color?: string;
  variant?: AppTextVariant;
};

/**
 * The single text primitive for the app. Every semantic role (variant) maps to
 * one entry in theme typography so the same role renders identically on every
 * screen. Pass `style` only for legitimate one-off exceptions.
 *
 * On the phone tier the display roles come down a step (typographyPhone) and
 * Dynamic Type is capped so a scaled label cannot blow out the fixed control
 * heights. Above phoneBreakpoint both are inert.
 */
export function AppText({
  align,
  children,
  color,
  maxFontSizeMultiplier,
  style,
  variant = "body",
  ...rest
}: AppTextProps) {
  const { phone } = useLayoutSize();

  return (
    <Text
      maxFontSizeMultiplier={
        maxFontSizeMultiplier ?? maxFontScaleFor(variant, phone)
      }
      {...rest}
      style={[
        typography[variant],
        phone && typographyPhone[variant],
        color != null && { color },
        align != null && { textAlign: align },
        style,
      ]}
    >
      {children}
    </Text>
  );
}
