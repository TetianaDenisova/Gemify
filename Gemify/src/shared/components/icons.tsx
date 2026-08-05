import Svg, { Path } from "react-native-svg";

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

export function PencilIcon({
  color = colors.primary,
  size = 20,
  strokeWidth = 1.8,
}: IconProps) {
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
