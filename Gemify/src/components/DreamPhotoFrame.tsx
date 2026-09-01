import { Image, type ImageLoadEventData } from "expo-image";
import {
  useMemo,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import {
  PanResponder,
  StyleSheet,
  View,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from "react-native";

/**
 * Framing of the dream vision image inside its cropped frame. Focus is an
 * object-position-style fraction of the hidden overflow (0 keeps the left/top
 * edge in view, 1 the right/bottom edge); scale multiplies the frame-covering
 * fit, so 1 is a plain `cover`.
 */
export type DreamPhotoTransform = {
  focusX: number;
  focusY: number;
  scale: number;
};

export const DEFAULT_PHOTO_TRANSFORM: DreamPhotoTransform = {
  focusX: 0.5,
  focusY: 0.5,
  scale: 1,
};

const PHOTO_SCALE_MIN = 1;
const PHOTO_SCALE_MAX = 4;

/** Keeps a zoom step inside the sensible cover…4× range. */
export function clampPhotoScale(scale: number): number {
  return Math.min(PHOTO_SCALE_MAX, Math.max(PHOTO_SCALE_MIN, scale));
}

type Size = { height: number; width: number };

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Placement of the image inside the frame for the given transform. */
function frameGeometry(
  frame: Size,
  natural: Size,
  transform: DreamPhotoTransform,
) {
  const cover = Math.max(
    frame.width / Math.max(natural.width, 1),
    frame.height / Math.max(natural.height, 1),
  );
  const width = natural.width * cover * transform.scale;
  const height = natural.height * cover * transform.scale;
  return {
    height,
    left: -transform.focusX * (width - frame.width),
    top: -transform.focusY * (height - frame.height),
    width,
  };
}

type DreamPhotoProps = {
  style?: StyleProp<ViewStyle>;
  transform?: DreamPhotoTransform;
  uri: string;
};

/**
 * Read-only dream photo honoring the saved framing. Falls back to a plain
 * cover fit until the frame and image sizes are known (visually identical
 * for the default transform).
 */
export function DreamPhoto({
  style,
  transform = DEFAULT_PHOTO_TRANSFORM,
  uri,
}: DreamPhotoProps) {
  const [frame, setFrame] = useState<Size | null>(null);
  const [natural, setNatural] = useState<Size | null>(null);

  const geometry =
    frame && natural ? frameGeometry(frame, natural, transform) : null;

  return (
    <View onLayout={makeLayoutHandler(setFrame)} style={[styles.clip, style]}>
      <Image
        contentFit={geometry ? "fill" : "cover"}
        onLoad={makeLoadHandler(setNatural)}
        source={{ uri }}
        style={
          geometry
            ? { position: "absolute", ...geometry }
            : StyleSheet.absoluteFill
        }
      />
    </View>
  );
}

type DreamPhotoAdjusterProps = DreamPhotoProps & {
  /** Fired with the committed framing after every drag (and never during). */
  onChange: (transform: DreamPhotoTransform) => void;
  transform: DreamPhotoTransform;
};

/**
 * Editable dream photo: drag anywhere on the image to choose which part
 * stays in the cropped frame. Zoom is the caller's concern — change
 * `transform.scale` (see `clampPhotoScale`) and the framing follows.
 */
export function DreamPhotoAdjuster({
  onChange,
  style,
  transform,
  uri,
}: DreamPhotoAdjusterProps) {
  const [frame, setFrame] = useState<Size | null>(null);
  const [natural, setNatural] = useState<Size | null>(null);
  const [drag, setDrag] = useState<{ dx: number; dy: number } | null>(null);

  // Every dependency here is stable while a drag is in flight (the transform
  // only changes on release or an outside zoom), so the responder — and its
  // in-progress gesture state — survives the per-move re-renders.
  const responder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_event, gesture) =>
          Math.abs(gesture.dx) + Math.abs(gesture.dy) > 4,
        onPanResponderMove: (_event, gesture) =>
          setDrag({ dx: gesture.dx, dy: gesture.dy }),
        onPanResponderRelease: (_event, gesture) => {
          setDrag(null);
          if (!frame || !natural) return;
          const geometry = frameGeometry(frame, natural, transform);
          const overflowX = geometry.width - frame.width;
          const overflowY = geometry.height - frame.height;
          onChange({
            ...transform,
            focusX:
              overflowX > 0
                ? clamp(-(geometry.left + gesture.dx) / overflowX, 0, 1)
                : transform.focusX,
            focusY:
              overflowY > 0
                ? clamp(-(geometry.top + gesture.dy) / overflowY, 0, 1)
                : transform.focusY,
          });
        },
        onPanResponderTerminate: () => setDrag(null),
      }),
    [frame, natural, onChange, transform],
  );

  const geometry =
    frame && natural ? frameGeometry(frame, natural, transform) : null;
  const shown =
    geometry && frame
      ? {
          height: geometry.height,
          left: clamp(
            geometry.left + (drag?.dx ?? 0),
            Math.min(frame.width - geometry.width, 0),
            0,
          ),
          top: clamp(
            geometry.top + (drag?.dy ?? 0),
            Math.min(frame.height - geometry.height, 0),
            0,
          ),
          width: geometry.width,
        }
      : null;

  return (
    <View
      onLayout={makeLayoutHandler(setFrame)}
      style={[styles.clip, style]}
      {...responder.panHandlers}
    >
      {/* Touches must land on the responder view (this also keeps the
          browser from starting a native image drag on web). */}
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <Image
          contentFit={shown ? "fill" : "cover"}
          onLoad={makeLoadHandler(setNatural)}
          source={{ uri }}
          style={
            shown
              ? { position: "absolute", ...shown }
              : StyleSheet.absoluteFill
          }
        />
      </View>
    </View>
  );
}

type SetSize = Dispatch<SetStateAction<Size | null>>;

function keepIfEqual(setSize: SetSize, size: Size) {
  setSize((current) =>
    current && current.height === size.height && current.width === size.width
      ? current
      : size,
  );
}

function makeLayoutHandler(setSize: SetSize) {
  return (event: LayoutChangeEvent) => {
    const { height, width } = event.nativeEvent.layout;
    keepIfEqual(setSize, { height, width });
  };
}

function makeLoadHandler(setSize: SetSize) {
  return (event: ImageLoadEventData) => {
    const { height, width } = event.source;
    keepIfEqual(setSize, { height, width });
  };
}

const styles = StyleSheet.create({
  clip: {
    overflow: "hidden",
  },
});
