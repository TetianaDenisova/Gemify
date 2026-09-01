import { useWindowDimensions } from "react-native";

import { layout } from "@/theme/theme";

/** True below the shared compact-layout breakpoint (layout.compactBreakpoint). */
export function useCompact(): boolean {
  const { width } = useWindowDimensions();
  return width < layout.compactBreakpoint;
}
