import { StyleSheet } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";

import { getJourneyMilestoneLayout } from "@/components/JourneyMilestone";
import type { JourneyMilestoneData } from "@/data/journeyMilestones";

export type JourneyMilestonePathProps = {
  imageHeight: number;
  imageWidth: number;
  milestones: readonly JourneyMilestoneData[];
};

type Point = {
  x: number;
  y: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function coordinate(value: number) {
  return Number(value.toFixed(2));
}

function buildSmoothPath(points: readonly Point[]) {
  if (points.length === 0) {
    return { path: "", segments: [] as string[] };
  }

  if (points.length === 1) {
    const path = `M ${coordinate(points[0].x)} ${coordinate(points[0].y)}`;

    return { path, segments: [path] };
  }

  const tension = 0.64;
  let path = `M ${coordinate(points[0].x)} ${coordinate(points[0].y)}`;
  const segments: string[] = [];

  for (let index = 0; index < points.length - 1; index += 1) {
    const previous = points[index - 1] ?? points[index];
    const current = points[index];
    const next = points[index + 1];
    const following = points[index + 2] ?? next;
    const controlScale = tension / 6;
    const firstControl = {
      x: current.x + (next.x - previous.x) * controlScale,
      y: current.y + (next.y - previous.y) * controlScale,
    };
    const secondControl = {
      x: next.x - (following.x - current.x) * controlScale,
      y: next.y - (following.y - current.y) * controlScale,
    };
    const curve =
      `C ${coordinate(firstControl.x)} ${coordinate(firstControl.y)}` +
      ` ${coordinate(secondControl.x)} ${coordinate(secondControl.y)}` +
      ` ${coordinate(next.x)} ${coordinate(next.y)}`;
    const segment =
      `M ${coordinate(current.x)} ${coordinate(current.y)} ${curve}`;

    segments.push(segment);
    path += ` ${curve}`;
  }

  return { path, segments };
}

function getDustPoints(points: readonly Point[]) {
  return points.slice(0, -1).flatMap((point, index) => {
    const next = points[index + 1];
    const directionX = next.x - point.x;
    const directionY = next.y - point.y;
    const length = Math.max(Math.hypot(directionX, directionY), 1);
    const normalX = -directionY / length;
    const normalY = directionX / length;

    return [
      {
        x: point.x + directionX * 0.34 + normalX * 3,
        y: point.y + directionY * 0.34 + normalY * 3,
        radius: 1.15,
      },
      {
        x: point.x + directionX * 0.67 - normalX * 2,
        y: point.y + directionY * 0.67 - normalY * 2,
        radius: 0.75,
      },
    ];
  });
}

export function JourneyMilestonePath({
  imageHeight,
  imageWidth,
  milestones,
}: JourneyMilestonePathProps) {
  const points = [...milestones]
    .sort((first, second) => first.id - second.id)
    .map((milestone) => {
      const layout = getJourneyMilestoneLayout(
        imageHeight,
        imageWidth,
        milestone,
      );

      return {
        x: layout.ringCenterX,
        y: layout.ringCenterY,
      };
    });
  const { path, segments } = buildSmoothPath(points);
  const dustPoints = getDustPoints(points);
  const outerWidth = clamp(imageWidth * 0.024, 7, 10);
  const middleWidth = clamp(imageWidth * 0.009, 2.8, 4.2);

  if (!path) {
    return null;
  }

  return (
    <Svg
      height={imageHeight}
      pointerEvents="none"
      style={styles.pathLayer}
      viewBox={`0 0 ${imageWidth} ${imageHeight}`}
      width={imageWidth}
    >
      {segments.map((segment, index) => (
        <Path
          d={segment}
          fill="none"
          key={`outer-${index}`}
          stroke="rgba(255, 196, 92, 0.05)"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={outerWidth * (1 - index * 0.045)}
        />
      ))}
      {segments.map((segment, index) => (
        <Path
          d={segment}
          fill="none"
          key={`middle-${index}`}
          stroke="rgba(255, 209, 102, 0.11)"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={middleWidth * (1 - index * 0.04)}
        />
      ))}
      {segments.map((segment, index) => (
        <Path
          d={segment}
          fill="none"
          key={`core-${index}`}
          stroke="rgba(255, 230, 160, 0.52)"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1 - index * 0.04}
        />
      ))}
      <Path
        d={path}
        fill="none"
        opacity={0.18}
        stroke="#fff1c7"
        strokeDasharray="0.8 24"
        strokeLinecap="round"
        strokeWidth={1.25}
      />
      {dustPoints.map((dust, index) => (
        <Circle
          cx={dust.x}
          cy={dust.y}
          fill="rgba(255, 224, 151, 0.2)"
          key={`${index}-${dust.x}-${dust.y}`}
          r={dust.radius}
        />
      ))}
    </Svg>
  );
}

export default JourneyMilestonePath;

const styles = StyleSheet.create({
  pathLayer: {
    ...StyleSheet.absoluteFill,
  },
});
