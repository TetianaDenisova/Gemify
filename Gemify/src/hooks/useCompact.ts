import { useLayoutSize } from "./useLayoutSize";

/** True below the shared compact-layout breakpoint (layout.compactBreakpoint). */
export function useCompact(): boolean {
  return useLayoutSize().compact;
}
