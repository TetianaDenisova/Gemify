import Svg, { Circle, Path, Rect } from "react-native-svg";

import { colors } from "@/theme/colors";

export type IconProps = {
  color?: string;
  size?: number;
  strokeWidth?: number;
};

export function BackIcon({
  color = colors.primary,
  size = 24,
  strokeWidth = 2,
}: IconProps) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 24 24" width={size}>
      <Path
        d="M19 12H5M11 18l-6-6 6-6"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={strokeWidth}
      />
    </Svg>
  );
}

export function ArrowRightIcon({
  color = colors.primary,
  size = 22,
  strokeWidth = 2,
}: IconProps) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 24 24" width={size}>
      <Path
        d="M5 12h14M13 6l6 6-6 6"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={strokeWidth}
      />
    </Svg>
  );
}

const CHEVRON_ROTATION = {
  down: "0deg",
  left: "90deg",
  right: "-90deg",
  up: "180deg",
} as const;

export type ChevronDirection = keyof typeof CHEVRON_ROTATION;

export function ChevronIcon({
  color = colors.primary,
  direction = "down",
  size = 20,
  strokeWidth = 2,
}: IconProps & { direction?: ChevronDirection }) {
  return (
    <Svg
      fill="none"
      height={size}
      style={{ transform: [{ rotate: CHEVRON_ROTATION[direction] }] }}
      viewBox="0 0 24 24"
      width={size}
    >
      <Path
        d="m6 9 6 6 6-6"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={strokeWidth}
      />
    </Svg>
  );
}

export function CheckIcon({
  color = colors.textOnPrimary,
  size = 16,
  strokeWidth = 2.4,
}: IconProps) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 24 24" width={size}>
      <Path
        d="m5 12.5 4.5 4.5L19 7.5"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={strokeWidth}
      />
    </Svg>
  );
}

export function CloseIcon({
  color = colors.primary,
  size = 20,
  strokeWidth = 2,
}: IconProps) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 24 24" width={size}>
      <Path
        d="M6 6l12 12M18 6 6 18"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={strokeWidth}
      />
    </Svg>
  );
}

export function PlusIcon({
  color = colors.primary,
  size = 20,
  strokeWidth = 2,
}: IconProps) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 24 24" width={size}>
      <Path
        d="M12 5v14M5 12h14"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={strokeWidth}
      />
    </Svg>
  );
}

/** Open book — marks a dream in breadcrumbs and journey UI. */
export function DreamIcon({
  color = colors.accentViolet,
  size = 22,
  strokeWidth = 1.8,
}: IconProps) {
  return (
    <Svg height={size} viewBox="0 0 24 24" width={size}>
      <Path
        d="M4 6c3.2 0 5.3 1 8 3.4C14.7 7 16.8 6 20 6v12c-3.2 0-5.3 1-8 3.4C9.3 19 7.2 18 4 18V6Z"
        fill="none"
        stroke={color}
        strokeLinejoin="round"
        strokeWidth={strokeWidth}
      />
      <Path d="M12 9.4v12" stroke={color} strokeLinecap="round" strokeWidth={strokeWidth} />
    </Svg>
  );
}

/** Crown — marks a milestone in breadcrumbs and journey UI. */
export function MilestoneIcon({
  color = colors.primary,
  size = 22,
  strokeWidth = 1.8,
}: IconProps) {
  return (
    <Svg height={size} viewBox="0 0 24 24" width={size}>
      <Path
        d="M4.5 8.5 8 12l4-5.5L16 12l3.5-3.5V17a1.5 1.5 0 0 1-1.5 1.5H6A1.5 1.5 0 0 1 4.5 17V8.5Z"
        fill="none"
        stroke={color}
        strokeLinejoin="round"
        strokeWidth={strokeWidth}
      />
    </Svg>
  );
}

/** Filled four-point star used across progress cards and ornaments. */
export function SparkIcon({ color = colors.primary, size = 26 }: IconProps) {
  return (
    <Svg height={size} viewBox="0 0 32 32" width={size}>
      <Path
        d="M16 2.5c2.4 7.4 6.1 11.1 13.5 13.5C22.1 18.4 18.4 22.1 16 29.5 13.6 22.1 9.9 18.4 2.5 16 9.9 13.6 13.6 9.9 16 2.5Z"
        fill={color}
      />
    </Svg>
  );
}

export type PencilVariant = "default" | "detailed";

/**
 * Pencil / edit. `variant="detailed"` is the action-sheet look: a slimmer
 * body with a separate tip crossbar.
 */
export function PencilIcon({
  color = colors.primary,
  size = 20,
  strokeWidth = 1.8,
  variant = "default",
}: IconProps & { variant?: PencilVariant }) {
  if (variant === "detailed") {
    return (
      <Svg fill="none" height={size} viewBox="0 0 24 24" width={size}>
        <Path
          d="m4 20 .8-3.8L15.6 5.4a2 2 0 0 1 2.8 0l.2.2a2 2 0 0 1 0 2.8L7.8 19.2 4 20Z"
          stroke={color}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokeWidth}
        />
        <Path
          d="m13.8 7.2 3 3"
          stroke={color}
          strokeLinecap="round"
          strokeWidth={strokeWidth}
        />
      </Svg>
    );
  }

  return (
    <Svg fill="none" height={size} viewBox="0 0 24 24" width={size}>
      <Path
        d="m4.75 19.25 4.25-1 9.29-9.29a2.12 2.12 0 0 0-3-3L6 15.25l-1.25 4Z"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={strokeWidth}
      />
    </Svg>
  );
}

export type DotsOrientation = "horizontal" | "vertical";

/** ⋮ / ⋯ — opens overflow / "more" menus (vertical by default). */
export function DotsIcon({
  color = colors.primary,
  orientation = "vertical",
  size = 20,
}: IconProps & { orientation?: DotsOrientation }) {
  const dotRadius = 1.6;
  return (
    <Svg fill="none" height={size} viewBox="0 0 24 24" width={size}>
      {[5.5, 12, 18.5].map((offset) => (
        <Circle
          cx={orientation === "horizontal" ? offset : 12}
          cy={orientation === "horizontal" ? 12 : offset}
          fill={color}
          key={offset}
          r={dotRadius}
        />
      ))}
    </Svg>
  );
}

export function BulbIcon({
  color = colors.primary,
  size = 24,
  strokeWidth = 1.7,
}: IconProps) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 24 24" width={size}>
      <Path
        d="M9 18h6M10 22h4M8.4 15.3A6.2 6.2 0 1 1 15.6 15c-.9.7-1.3 1.4-1.4 2H9.8c-.1-.6-.5-1.1-1.4-1.7Z"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={strokeWidth}
      />
    </Svg>
  );
}

export function CalendarIcon({
  color = colors.primary,
  size = 20,
  strokeWidth = 1.6,
}: IconProps) {
  return (
    <Svg height={size} viewBox="0 0 24 24" width={size}>
      <Rect
        fill="none"
        height={15}
        rx={2.4}
        stroke={color}
        strokeWidth={strokeWidth}
        width={18}
        x={3}
        y={5}
      />
      <Path
        d="M7 3v4M17 3v4M3 10h18"
        fill="none"
        stroke={color}
        strokeLinecap="round"
        strokeWidth={strokeWidth}
      />
    </Svg>
  );
}

export function ClockIcon({
  color = colors.primary,
  size = 20,
  strokeWidth = 1.7,
}: IconProps) {
  return (
    <Svg height={size} viewBox="0 0 24 24" width={size}>
      <Circle
        cx={12}
        cy={12}
        fill="none"
        r={8.5}
        stroke={color}
        strokeWidth={strokeWidth}
      />
      <Path
        d="M12 7.5V12l3 2"
        fill="none"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={strokeWidth}
      />
    </Svg>
  );
}

export function GearIcon({
  color = colors.primary,
  size = 20,
  strokeWidth = 1.6,
}: IconProps) {
  return (
    <Svg height={size} viewBox="0 0 24 24" width={size}>
      <Circle
        cx={12}
        cy={12}
        fill="none"
        r={3.1}
        stroke={color}
        strokeWidth={strokeWidth}
      />
      <Path
        d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1Z"
        fill="none"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={strokeWidth}
      />
    </Svg>
  );
}

/** Framed photo/image placeholder (picture frame with a mountain sketch). */
export function ImageIcon({
  color = colors.primary,
  size = 22,
  strokeWidth = 1.6,
}: IconProps) {
  return (
    <Svg height={size} viewBox="0 0 24 24" width={size}>
      <Rect
        fill="none"
        height={16}
        rx={2.6}
        stroke={color}
        strokeWidth={strokeWidth}
        width={18}
        x={3}
        y={4}
      />
      <Circle
        cx={8.4}
        cy={9}
        fill="none"
        r={1.7}
        stroke={color}
        strokeWidth={strokeWidth}
      />
      <Path
        d="m5.5 17 4.6-4.8 3.2 3.2 2.8-2.6 2.9 4.2"
        fill="none"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={strokeWidth}
      />
    </Svg>
  );
}

/** Filled sparkle with a small companion star — violet accent glyph. */
export function SparkleGlyphIcon({
  color = colors.accentViolet,
  size = 22,
}: IconProps) {
  return (
    <Svg height={size} viewBox="0 0 24 24" width={size}>
      <Path
        d="M12 2c.9 4.6 2.4 6.1 7 7-4.6.9-6.1 2.4-7 7-.9-4.6-2.4-6.1-7-7 4.6-.9 6.1-2.4 7-7Z"
        fill={color}
      />
      <Path
        d="M19 15c.4 2 1 2.6 3 3-2 .4-2.6 1-3 3-.4-2-1-2.6-3-3 2-.4 2.6-1 3-3Z"
        fill={color}
        opacity={0.7}
      />
    </Svg>
  );
}

export function TrashIcon({
  color = colors.danger,
  size = 20,
  strokeWidth = 1.7,
}: IconProps) {
  return (
    <Svg height={size} viewBox="0 0 24 24" width={size}>
      <Path
        d="M4.5 6.5h15M9.5 6.5V5a1.5 1.5 0 0 1 1.5-1.5h2A1.5 1.5 0 0 1 14.5 5v1.5m3.5 0-.9 12A2 2 0 0 1 15.1 20.5H8.9a2 2 0 0 1-2-1.9l-.9-12.1M10 10.5v6M14 10.5v6"
        fill="none"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={strokeWidth}
      />
    </Svg>
  );
}

/** Feature-art tints for the create-habit step medallions (violet family). */
const STEP_ICON_HIGHLIGHT = "#F1B3FF";

export type StepIconName =
  | "calendar"
  | "chat"
  | "clock"
  | "feather"
  | "leaf"
  | "shield"
  | "sprout";

/** Ornate two-tone step glyphs for the create-habit form medallions. */
export function StepIcon({
  name,
  size = 31,
}: {
  name: StepIconName;
  size?: number;
}) {
  if (name === "chat") {
    return (
      <Svg height={size} viewBox="0 0 48 48" width={size}>
        <Path
          d="M9 22c0-8 7-14 16-14s16 6 16 14-7 14-16 14c-2 0-4-.3-5.8-.9L10 40l3-8.1A13 13 0 0 1 9 22Z"
          fill="none"
          stroke={colors.accentViolet}
          strokeLinejoin="round"
          strokeWidth={2.6}
        />
        {[19, 25, 31].map((cx) => (
          <Circle cx={cx} cy={22} fill={STEP_ICON_HIGHLIGHT} key={cx} r={1.9} />
        ))}
      </Svg>
    );
  }

  if (name === "calendar") {
    return (
      <Svg height={size} viewBox="0 0 48 48" width={size}>
        <Rect
          fill="none"
          height={29}
          rx={4}
          stroke={colors.accentViolet}
          strokeWidth={2.5}
          width={32}
          x={8}
          y={11}
        />
        <Path
          d="M16 7v8M32 7v8M8 19h32M18 28h.01M24 28h.01M30 28h.01M18 34h.01M24 34h.01"
          fill="none"
          stroke={STEP_ICON_HIGHLIGHT}
          strokeLinecap="round"
          strokeWidth={2.5}
        />
      </Svg>
    );
  }

  if (name === "clock") {
    return (
      <Svg height={size} viewBox="0 0 48 48" width={size}>
        <Circle
          cx={24}
          cy={24}
          fill="none"
          r={15.5}
          stroke={colors.accentViolet}
          strokeWidth={2.6}
        />
        <Path
          d="M24 14v10.5l7 5"
          fill="none"
          stroke={STEP_ICON_HIGHLIGHT}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2.6}
        />
      </Svg>
    );
  }

  if (name === "shield") {
    return (
      <Svg height={size} viewBox="0 0 48 48" width={size}>
        <Path
          d="M24 5 39 11v11c0 10-6 17-15 21C15 39 9 32 9 22V11l15-6Z"
          fill="none"
          stroke={colors.accentViolet}
          strokeLinejoin="round"
          strokeWidth={2.7}
        />
        <Path
          d="m19 24 3.4 3.4L30 20"
          fill="none"
          stroke={STEP_ICON_HIGHLIGHT}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2.7}
        />
      </Svg>
    );
  }

  if (name === "sprout") {
    return (
      <Svg height={size} viewBox="0 0 48 48" width={size}>
        <Path
          d="M24 39V24M24 25c-9-1-14-7-14-15 9 0 14 6 14 15ZM24 27c10-2 15-9 15-18-10 1-15 8-15 18Z"
          fill="none"
          stroke={colors.accentViolet}
          strokeLinejoin="round"
          strokeWidth={2.7}
        />
        <Path
          d="M17 39h14"
          fill="none"
          stroke={STEP_ICON_HIGHLIGHT}
          strokeLinecap="round"
          strokeWidth={2.7}
        />
      </Svg>
    );
  }

  if (name === "leaf") {
    return (
      <Svg height={size} viewBox="0 0 48 48" width={size}>
        <Path
          d="M37 8C23 9 13 18 12 34c12-1 22-8 25-26Z"
          fill="none"
          stroke={colors.accentViolet}
          strokeLinejoin="round"
          strokeWidth={2.7}
        />
        <Path
          d="M14 34c7-8 13-13 21-18M18 30l-2 10"
          fill="none"
          stroke={STEP_ICON_HIGHLIGHT}
          strokeLinecap="round"
          strokeWidth={2.5}
        />
      </Svg>
    );
  }

  return (
    <Svg height={size} viewBox="0 0 48 48" width={size}>
      <Path
        d="M37 8C23 9 13 18 12 34c12-1 22-8 25-26Z"
        fill={colors.accentViolet}
      />
      <Path
        d="M14 34c7-8 13-13 21-18M18 30l-2 10"
        fill="none"
        stroke="#32143D"
        strokeLinecap="round"
        strokeWidth={2.4}
      />
    </Svg>
  );
}
