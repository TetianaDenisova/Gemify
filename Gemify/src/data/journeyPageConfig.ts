export type JourneyPageConfig = {
  /** Relative Y position of the first (bottom-most) milestone. */
  bottomY: number;
  /** Relative Y where the path reaches the castle — the last milestone anchor. */
  castleY: number;
};

/**
 * Milestone landmark bounds. Coordinates are relative to the full map.
 * Last milestone lands just below the castle art; first stays low on the map.
 */
export const journeyPageConfig: JourneyPageConfig = {
  castleY: 0.4,
  bottomY: 0.86,
};
