import { useEffect, useState } from "react";
import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/**
 * The bottom safe-area inset, in points, on every platform.
 *
 * `useSafeAreaInsets()` reports 0 on web even in an installed iOS web app that
 * does sit over a home indicator, which left the tab bar and every scroll
 * clearance short by that inset. The browser still answers truthfully through
 * CSS `env(safe-area-inset-bottom)`, so on web the value is measured from a
 * throwaway element rather than taken from JS. Nothing here assumes a device:
 * the number comes from whatever the browser reports, and is re-read whenever
 * the viewport changes.
 */
export function useBottomInset(): number {
  const insets = useSafeAreaInsets();
  const [measured, setMeasured] = useState(0);

  useEffect(() => {
    if (Platform.OS !== "web") return;

    const update = () => setMeasured(measureBottomInset());

    // Static export runs this module in Node, so the first measurement has to
    // wait for the browser; orientation and window changes move the inset.
    update();
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);

    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
    };
  }, []);

  // Whichever source knows about the inset wins, so a browser that does fill
  // insets in is not overridden by a zero measurement.
  return Platform.OS === "web" ? Math.max(insets.bottom, measured) : insets.bottom;
}

function measureBottomInset(): number {
  const probe = document.createElement("div");

  probe.style.cssText = [
    "position:fixed",
    "bottom:0",
    "left:0",
    "width:0",
    "height:env(safe-area-inset-bottom, 0px)",
    "visibility:hidden",
    "pointer-events:none",
  ].join(";");

  document.body.appendChild(probe);
  const { height } = probe.getBoundingClientRect();
  probe.remove();

  return height;
}
