import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Platform, Pressable, StyleSheet, View } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";

import {
  AppButton,
  AppText,
  ArrowRightIcon,
  HintRow,
  ImageIcon,
  ScreenHeader,
  ScreenScaffold,
} from "@/shared/components";
import { colors } from "@/theme/colors";
import { pressed, radius, shadowStyle, spacing } from "@/theme/theme";

/** Same night-sky art as the describe-dream step, for a continuous flow. */
const ENTERING_BACKGROUND = require("../../assets/create-goal/entering.png");

function GalleryGlyph({ color = colors.primary, size = 22 }: { color?: string; size?: number }) {
  return (
    <Svg height={size} viewBox="0 0 24 24" width={size}>
      <Path
        d="m4 17 4.4-4.6 3 3 2.6-2.4L18 17"
        fill="none"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.7}
      />
      <Circle cx={8} cy={8.6} fill={color} r={1.6} />
      <Path
        d="M14.5 6.5 15.3 4l.8 2.5 2.5.8-2.5.8-.8 2.5-.8-2.5L12 7.3l2.5-.8Z"
        fill={color}
      />
    </Svg>
  );
}

function CameraGlyph({ color = colors.primary, size = 22 }: { color?: string; size?: number }) {
  return (
    <Svg height={size} viewBox="0 0 24 24" width={size}>
      <Path
        d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2.6l1.4-2h5l1.4 2h2.6A1.5 1.5 0 0 1 20 8.5V17a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17V8.5Z"
        fill="none"
        stroke={color}
        strokeLinejoin="round"
        strokeWidth={1.7}
      />
      <Circle cx={12} cy={12.6} fill="none" r={3.1} stroke={color} strokeWidth={1.7} />
    </Svg>
  );
}

export default function SeeDreamScreen() {
  const router = useRouter();
  const { name, description } = useLocalSearchParams<{
    name?: string;
    description?: string;
  }>();
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [aiHint, setAiHint] = useState(false);

  const pickPhoto = async (source: "camera" | "library") => {
    try {
      if (Platform.OS !== "web") {
        const permission =
          source === "camera"
            ? await ImagePicker.requestCameraPermissionsAsync()
            : await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) return;
      }
      const result =
        source === "camera"
          ? await ImagePicker.launchCameraAsync({
              mediaTypes: ["images"],
              quality: 0.8,
            })
          : await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ["images"],
              quality: 0.8,
            });
      if (!result.canceled && result.assets[0]) {
        setPhotoUri(result.assets[0].uri);
      }
    } catch (cause) {
      console.error("Failed to pick the dream image", cause);
    }
  };

  const goNext = (uri: string | null) => {
    router.navigate({
      pathname: "/state",
      params: {
        name: name ?? "",
        description: description ?? "",
        photoUri: uri ?? "",
      },
    });
  };

  return (
    <>
      <ScreenHeader asStackHeader />
      <ScreenScaffold
        backgroundImage={ENTERING_BACKGROUND}
        contentStyle={styles.content}
        overlayOpacity={0.45}
        topInset
      >
        <AppText align="center" variant="screenTitle">
          See your dream
        </AppText>
        <AppText align="center" style={styles.subtitle} variant="subtitle">
          Add an image of the life you&rsquo;re creating.
        </AppText>

        <Pressable
          accessibilityLabel={photoUri ? "Change the photo" : "Add a photo"}
          accessibilityRole="button"
          onPress={() => pickPhoto("library")}
          style={({ pressed: isPressed }) => [
            styles.photoFrame,
            isPressed && pressed,
          ]}
        >
          {photoUri ? (
            <Image contentFit="cover" source={{ uri: photoUri }} style={styles.photo} />
          ) : (
            <View style={styles.photoPlaceholder}>
              <ImageIcon
                color={colors.textSecondary}
                size={96}
                strokeWidth={1.3}
              />
              <AppText align="center" variant="cardTitle">
                Add a photo
              </AppText>
            </View>
          )}
        </Pressable>

        <View style={styles.sourceRow}>
          <AppButton
            icon={<GalleryGlyph />}
            iconPosition="before"
            label="Choose from gallery"
            onPress={() => pickPhoto("library")}
            style={styles.sourceButton}
            variant="secondary"
          />
          {Platform.OS !== "web" ? (
            <AppButton
              icon={<CameraGlyph />}
              iconPosition="before"
              label="Take a photo"
              onPress={() => pickPhoto("camera")}
              style={styles.sourceButton}
              variant="secondary"
            />
          ) : null}
        </View>

        <AppButton
          label="✦  Create with AI  ✦"
          onPress={() => setAiHint(true)}
          variant="ghost"
        />
        {aiHint ? (
          <AppText align="center" color={colors.textMuted} variant="caption">
            AI images are coming soon.
          </AppText>
        ) : null}

        <HintRow
          style={styles.hint}
          text="Choose an image that makes your future feel real."
        />

        <AppButton
          label="Skip for now"
          onPress={() => goNext(null)}
          variant="ghost"
        />

        <AppButton
          disabled={photoUri === null}
          icon={<ArrowRightIcon color={colors.textOnPrimary} />}
          label="Continue"
          onPress={() => goNext(photoUri)}
          size="lg"
          style={styles.continueButton}
          variant="primary"
        />
      </ScreenScaffold>
    </>
  );
}

const styles = StyleSheet.create({
  content: {
    alignItems: "center",
    paddingTop: 68,
  },
  continueButton: {
    alignSelf: "stretch",
    marginTop: spacing.sm,
  },
  hint: {
    marginVertical: spacing.sm,
  },
  photo: {
    borderRadius: radius.card,
    height: "100%",
    width: "100%",
  },
  /** The vision frame: tall rounded rect with a gold edge and soft glow. */
  photoFrame: {
    alignSelf: "center",
    aspectRatio: 0.78,
    backgroundColor: colors.surfaceDeep,
    borderColor: colors.primary,
    borderRadius: radius.card,
    borderWidth: 1.6,
    marginTop: spacing.xl,
    maxWidth: 420,
    overflow: "hidden",
    ...shadowStyle({ color: colors.primary, elevation: 10, opacity: 0.35, radius: 22 }),
    width: "86%",
  },
  photoPlaceholder: {
    alignItems: "center",
    flex: 1,
    gap: spacing.md,
    justifyContent: "center",
  },
  sourceButton: {
    flex: 1,
    minWidth: 220,
  },
  sourceRow: {
    alignSelf: "stretch",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    marginBottom: spacing.sm,
    marginTop: spacing.xl,
  },
  subtitle: {
    marginTop: spacing.sm,
  },
});
