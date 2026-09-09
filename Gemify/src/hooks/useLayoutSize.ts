import { useWindowDimensions } from "react-native";

import { layout } from "@/theme/theme";

export type LayoutSize = {
  /** True below layout.compactBreakpoint — still true on every phone. */
  compact: boolean;
  height: number;
  /** True below layout.phoneBreakpoint (iPhone 17 family: 402–440 pt). */
  phone: boolean;
  /**
   * True when vertical space is tight. A phone always counts as short: its
   * 874 pt height clears layout.shortScreenBreakpoint, but a 402 pt-wide
   * screen still needs the dense spacing.
   */
  short: boolean;
  width: number;
};

/**
 * The one place screens ask about their size tier. `phone` is a sub-tier
 * inside `compact`, so a site that only branches on `compact` keeps behaving
 * exactly as it does on tablets and small tablets (480–560 pt).
 */
export function useLayoutSize(): LayoutSize {
  const { height, width } = useWindowDimensions();
  const phone = width < layout.phoneBreakpoint;

  return {
    compact: width < layout.compactBreakpoint,
    height,
    phone,
    short: phone || height < layout.shortScreenBreakpoint,
    width,
  };
}
