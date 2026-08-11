export const FIRST_MILESTONE_PAGE_LIMIT = 5;
export const FOLLOWING_MILESTONE_PAGE_LIMIT = 4;

/**
 * Splits milestone references into the pages that can display them.
 * The source milestone objects are never copied or duplicated.
 */
export function paginateMilestones<T>(
  milestones: readonly T[],
): readonly (readonly T[])[] {
  if (milestones.length === 0) {
    return [];
  }

  const pages: T[][] = [
    milestones.slice(0, FIRST_MILESTONE_PAGE_LIMIT),
  ];

  for (
    let offset = FIRST_MILESTONE_PAGE_LIMIT;
    offset < milestones.length;
    offset += FOLLOWING_MILESTONE_PAGE_LIMIT
  ) {
    pages.push(
      milestones.slice(offset, offset + FOLLOWING_MILESTONE_PAGE_LIMIT),
    );
  }

  return pages;
}

export type JourneyPageVerticalBounds = {
  /** Relative Y position of the first (bottom-most) milestone. */
  bottomY: number;
  /** Relative Y where the path reaches the castle — the last milestone anchor. */
  castleY: number;
};

/**
 * Returns a relative Y coordinate for a milestone ring. The first ring anchors
 * at bottomY, the last ring at castleY, with equal gaps in between.
 */
export function getMilestoneRingY(
  index: number,
  ringsOnPage: number,
  { bottomY, castleY }: JourneyPageVerticalBounds,
) {
  if (ringsOnPage <= 0 || index < 0 || index >= ringsOnPage) {
    throw new RangeError("Milestone ring index must be inside a non-empty page");
  }

  if (ringsOnPage === 1) {
    return bottomY;
  }

  const step = (bottomY - castleY) / (ringsOnPage - 1);

  return bottomY - step * index;
}
