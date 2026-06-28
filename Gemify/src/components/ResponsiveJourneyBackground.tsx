import { useMemo, type ReactNode } from "react";
import type { ImageSourcePropType } from "react-native";
import { Image, StyleSheet, View, useWindowDimensions } from "react-native";
import { Asset } from "expo-asset";
import { LinearGradient } from "expo-linear-gradient";

export type JourneyBackgroundMode = "contain" | "cover";

export type ResponsiveJourneyImageLayout = {
  imageOffsetX: number;
  imageOffsetY: number;
  renderedImageHeight: number;
  renderedImageWidth: number;
  scale: number;
};

export type ResponsiveJourneyBackgroundProps = {
  children?:
    | ReactNode
    | ((layout: ResponsiveJourneyImageLayout) => ReactNode);
  mode: JourneyBackgroundMode;
  source: ImageSourcePropType;
};

type CalculateJourneyImageLayoutArgs = {
  imageHeight: number;
  imageWidth: number;
  mode: JourneyBackgroundMode;
  screenHeight: number;
  screenWidth: number;
};

/**
 * Converts an image's natural size into the exact centered rectangle rendered
 * on screen. Milestones can use this rectangle to map relative coordinates.
 */
export function calculateJourneyImageLayout({
  imageHeight,
  imageWidth,
  mode,
  screenHeight,
  screenWidth,
}: CalculateJourneyImageLayoutArgs): ResponsiveJourneyImageLayout {
  const safeImageWidth = Math.max(imageWidth, 1);
  const safeImageHeight = Math.max(imageHeight, 1);
  const widthScale = screenWidth / safeImageWidth;
  const heightScale = screenHeight / safeImageHeight;
  const scale =
    mode === "contain"
      ? Math.min(widthScale, heightScale)
      : Math.max(widthScale, heightScale);

  const renderedImageWidth = safeImageWidth * scale;
  const renderedImageHeight = safeImageHeight * scale;

  return {
    renderedImageWidth,
    renderedImageHeight,
    imageOffsetX: (screenWidth - renderedImageWidth) / 2,
    imageOffsetY: (screenHeight - renderedImageHeight) / 2,
    scale,
  };
}

export function useResponsiveJourneyImageLayout(
  source: ImageSourcePropType,
  mode: JourneyBackgroundMode,
) {
  const { height: screenHeight, width: screenWidth } = useWindowDimensions();

  const { imageHeight, imageWidth } = useMemo(() => {
    if (typeof source === "number") {
      const asset = Asset.fromModule(source);

      return {
        imageWidth: asset.width ?? screenWidth,
        imageHeight: asset.height ?? screenHeight,
      };
    }

    const sourceCandidates = Array.isArray(source) ? source : [source];
    const sourceWithDimensions = sourceCandidates.find(
      (candidate) => candidate?.width && candidate?.height,
    );

    return {
      imageWidth: sourceWithDimensions?.width ?? screenWidth,
      imageHeight: sourceWithDimensions?.height ?? screenHeight,
    };
  }, [screenHeight, screenWidth, source]);

  return useMemo(
    () =>
      calculateJourneyImageLayout({
        imageHeight,
        imageWidth,
        mode,
        screenHeight,
        screenWidth,
      }),
    [imageHeight, imageWidth, mode, screenHeight, screenWidth],
  );
}

export function ResponsiveJourneyBackground({
  children,
  mode,
  source,
}: ResponsiveJourneyBackgroundProps) {
  const layout = useResponsiveJourneyImageLayout(source, mode);
  const overlay = typeof children === "function" ? children(layout) : children;

  const imageRect = {
    left: layout.imageOffsetX,
    top: layout.imageOffsetY,
    width: layout.renderedImageWidth,
    height: layout.renderedImageHeight,
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#02040c", "#0a0b1d", "#03050e"]}
        locations={[0, 0.48, 1]}
        pointerEvents="none"
        style={StyleSheet.absoluteFill}
      />

      <Image resizeMode={mode} source={source} style={[styles.image, imageRect]} />

      <View pointerEvents="box-none" style={[styles.imageOverlay, imageRect]}>
        {overlay}
      </View>
    </View>
  );
}

export default ResponsiveJourneyBackground;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: "hidden",
    backgroundColor: "#02040c",
  },
  image: {
    position: "absolute",
  },
  imageOverlay: {
    position: "absolute",
  },
});
