import { LinearGradient } from "expo-linear-gradient";
import { Asset } from "expo-asset";
import { Image } from "expo-image";
import { useEffect, useRef, useState, type ReactNode } from "react";
import type {
  ImageSourcePropType,
  ImageURISource,
  LayoutChangeEvent,
  StyleProp,
  ViewStyle,
} from "react-native";
import {
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

import { colors } from "@/theme/colors";

export type JourneyMapLayout = {
  imageHeight: number;
  imageWidth: number;
};

export type JourneyMapScrollProps = {
  children?: ReactNode | ((layout: JourneyMapLayout) => ReactNode);
  /** Enables/disables dragging without removing the map. */
  enabled?: boolean;
  showAtmosphere?: boolean;
  source: ImageSourcePropType;
  style?: StyleProp<ViewStyle>;
};

type ViewportSize = {
  height: number;
  width: number;
};

export function JourneyMapScroll({
  children,
  enabled = true,
  showAtmosphere = true,
  source,
  style,
}: JourneyMapScrollProps) {
  const scrollViewRef = useRef<ScrollView>(null);
  const [viewport, setViewport] = useState<ViewportSize>({
    height: 0,
    width: 0,
  });
  const asset = typeof source === "number" ? Asset.fromModule(source) : null;
  const sourceCandidates = Array.isArray(source) ? source : [source];
  const sourceWithDimensions = sourceCandidates.find(
    (candidate): candidate is ImageURISource =>
      typeof candidate !== "number" &&
      typeof candidate?.width === "number" &&
      typeof candidate?.height === "number",
  );
  const assetWidth = asset?.width ?? sourceWithDimensions?.width ?? viewport.width;
  const assetHeight =
    asset?.height ?? sourceWithDimensions?.height ?? viewport.height;
  const coverScale =
    viewport.width > 0 && viewport.height > 0
      ? Math.max(
          viewport.width / Math.max(assetWidth, 1),
          viewport.height / Math.max(assetHeight, 1),
        )
      : 0;
  const imageWidth = assetWidth * coverScale;
  const imageHeight = assetHeight * coverScale;
  const imageLeft = (viewport.width - imageWidth) / 2;
  const layout: JourneyMapLayout = { imageHeight, imageWidth };
  const overlay = typeof children === "function" ? children(layout) : children;

  useEffect(() => {
    if (viewport.height === 0 || imageHeight === 0) {
      return;
    }

    scrollViewRef.current?.scrollTo({
      animated: false,
      y: Math.max((imageHeight - viewport.height) / 2, 0),
    });
  }, [imageHeight, viewport.height, viewport.width]);

  const handleLayout = (event: LayoutChangeEvent) => {
    const { height, width } = event.nativeEvent.layout;

    setViewport((current) =>
      current.height === height && current.width === width
        ? current
        : { height, width },
    );
  };

  return (
    <View onLayout={handleLayout} style={[styles.container, style]}>
      <ScrollView
        bounces={false}
        contentContainerStyle={[
          styles.scrollContent,
          { minHeight: viewport.height },
        ]}
        overScrollMode="never"
        ref={scrollViewRef}
        scrollEnabled={enabled}
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}
      >
        <View style={{ width: viewport.width, height: imageHeight }}>
          <Image
            contentFit="contain"
            source={source}
            style={{
              height: imageHeight,
              left: imageLeft,
              position: "absolute",
              top: 0,
              width: imageWidth,
            }}
          />

          <View
            style={{
              height: imageHeight,
              left: imageLeft,
              pointerEvents: "box-none",
              position: "absolute",
              top: 0,
              width: imageWidth,
            }}
          >
            {overlay}
          </View>
        </View>
      </ScrollView>

      {showAtmosphere ? (
        <LinearGradient
          colors={[
            colors.overlayDark,
            colors.transparent,
            colors.overlayLight,
            colors.overlayDark,
          ]}
          locations={[0, 0.28, 0.72, 1]}
          style={[StyleSheet.absoluteFill, { pointerEvents: "none" }]}
        />
      ) : null}
    </View>
  );
}

export default JourneyMapScroll;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    overflow: "hidden",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    justifyContent: "center",
  },
});
