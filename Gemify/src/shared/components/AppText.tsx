import { Text, type TextProps, type TextStyle } from "react-native";

import { typography } from "@/theme/theme";

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
 */
export function AppText({
  align,
  children,
  color,
  style,
  variant = "body",
  ...rest
}: AppTextProps) {
  return (
    <Text
      {...rest}
      style={[
        typography[variant],
        color != null && { color },
        align != null && { textAlign: align },
        style,
      ]}
    >
      {children}
    </Text>
  );
}
