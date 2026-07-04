import type { ImageSourcePropType } from "react-native";

import type { JourneyPageVerticalBounds } from "@/utils/milestonePagination";

export type JourneyPageConfig = JourneyPageVerticalBounds & {
  source: ImageSourcePropType;
};

/**
 * Reusable per-image landmarks. Coordinates are relative to the full image.
 * Add another entry when a new journey background is introduced.
 */
export const journeyPageConfigs: readonly JourneyPageConfig[] = [
  {
    source: require("../../assets/journey-levels/level1.png"),
    castleY: 0.36,
    bottomY: 0.94,
  },
  {
    source: require("../../assets/journey-levels/level2.png"),
    castleY: 0.48,
    bottomY: 0.94,
  },
  {
    source: require("../../assets/journey-levels/level3.png"),
    castleY: 0.57,
    bottomY: 0.94,
  },
];

/**
 * Keeps pagination data-driven if milestones temporarily outgrow the available
 * artwork. New pages use the final background until a new config is added.
 */
export function getJourneyPageConfig(pageIndex: number): JourneyPageConfig {
  const lastConfig = journeyPageConfigs[journeyPageConfigs.length - 1];

  return journeyPageConfigs[pageIndex] ?? lastConfig;
}
