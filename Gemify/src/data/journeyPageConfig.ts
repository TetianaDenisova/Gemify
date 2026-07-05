import type { JourneyPageVerticalBounds } from "@/utils/milestonePagination";

export type JourneyPageConfig = JourneyPageVerticalBounds;

/**
 * Reusable milestone landmarks. Coordinates are relative to the full map.
 */
export const journeyPageConfigs: readonly JourneyPageConfig[] = [
  {
    castleY: 0.36,
    bottomY: 0.94,
  },
  {
    castleY: 0.48,
    bottomY: 0.94,
  },
  {
    castleY: 0.57,
    bottomY: 0.94,
  },
];
