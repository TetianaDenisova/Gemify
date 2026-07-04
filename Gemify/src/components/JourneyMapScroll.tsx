import { LinearGradient } from "expo-linear-gradient";
import { Asset } from "expo-asset";
import { useEffect, useRef, useState, type ReactNode } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import {
  Image,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";

export type JourneyMapScrollProps = {
  children?: ReactNode;
  /** Enables/disables dragging without removing the map. */
  enabled?: boolean;
  showAtmosphere?: boolean;
  style?: StyleProp<ViewStyle>;
};

const JOURNEY_MAP_SOURCE = require("../../assets/journey-top/level2.png");
const JOURNEY_MAP_ASSET = Asset.fromModule(JOURNEY_MAP_SOURCE);

export function JourneyMapScroll({
  children,
  enabled = true,
  showAtmosphere = true,
  style,
}: JourneyMapScrollProps) {
  const { width: screenWidth } = useWindowDimensions();
  const scrollViewRef = useRef<ScrollView>(null);
  const [viewportHeight, setViewportHeight] = useState(0);
  const assetWidth = JOURNEY_MAP_ASSET.width ?? 853;
  const assetHeight = JOURNEY_MAP_ASSET.height ?? 1844;
  const imageHeight =
    screenWidth * (assetHeight / assetWidth);

  useEffect(() => {
    if (viewportHeight === 0) {
      return;
    }

    scrollViewRef.current?.scrollTo({
      animated: false,
      y: Math.max((imageHeight - viewportHeight) / 2, 0),
    });
  }, [imageHeight, viewportHeight]);

  return (
    <View style={[styles.container, style]}>
      <ScrollView
        bounces={false}
        contentContainerStyle={[
          styles.scrollContent,
          { minHeight: viewportHeight },
        ]}
        onLayout={(event) => setViewportHeight(event.nativeEvent.layout.height)}
        overScrollMode="never"
        ref={scrollViewRef}
        scrollEnabled={enabled}
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}
      >
        <View style={{ width: screenWidth, height: imageHeight }}>
          <Image
            resizeMode="contain"
            source={JOURNEY_MAP_SOURCE}
            style={StyleSheet.absoluteFill}
          />

          <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
            {children}
          </View>
        </View>
      </ScrollView>

      {showAtmosphere ? (
        <LinearGradient
          colors={[
            "rgba(2, 4, 12, 0.3)",
            "rgba(2, 4, 12, 0.01)",
            "rgba(2, 4, 12, 0.08)",
            "rgba(2, 4, 12, 0.38)",
          ]}
          locations={[0, 0.28, 0.72, 1]}
          pointerEvents="none"
          style={StyleSheet.absoluteFill}
        />
      ) : null}
    </View>
  );
}

export default JourneyMapScroll;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#02040c",
    overflow: "hidden",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    alignItems: "center",
    justifyContent: "center",
  },
});
