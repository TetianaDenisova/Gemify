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
  /** Relative Y position of the bottom of the visible journey area. */
  bottomY: number;
  /** Relative Y position of the castle/target. */
  castleY: number;
};

/** Returns a relative Y coordinate evenly spaced inside the page bounds. */
export function getMilestoneRingY(
  index: number,
  ringsOnPage: number,
  { bottomY, castleY }: JourneyPageVerticalBounds,
) {
  if (ringsOnPage <= 0 || index < 0 || index >= ringsOnPage) {
    throw new RangeError("Milestone ring index must be inside a non-empty page");
  }

  const step = (bottomY - castleY) / (ringsOnPage + 1);

  return bottomY - step * (index + 1);
}
