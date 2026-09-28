export type JourneyPageConfig = {
  /** Relative Y where the illuminated road meets the castle gate. */
  castleApproachY: number;
  /** Keeps the top milestone clear of the castle art. */
  castleClearance: number;
  /** Single vertical alignment line for milestone anchors. */
  pathX: number;
  /** Minimum rendered gap between milestone anchors before the map grows taller. */
  minSpacing: number;
  /** Relative Y position of the beginning of the visible journey road. */
  pathStartY: number;
};

/**
 * Milestone landmark bounds. Coordinates are relative to the full rendered map,
 * not the scroll viewport.
 */
export const journeyPageConfig: JourneyPageConfig = {
  castleApproachY: 0.29,
  castleClearance: 0.035,
  pathX: 0.52,
  minSpacing: 112,
  pathStartY: 0.965,
};
