// Compatibility exports for existing imports. The visual now comes entirely
// from assets/magic-ring.svg through MilestoneRing.
export {
  MilestoneRing as default,
  MilestoneRing,
  MilestoneRing as JourneyRing,
  getMilestoneRingDimensions,
  getMilestoneRingDimensions as getJourneyRingDimensions,
} from "./MilestoneRing";

export type {
  MilestoneRingDimensions,
  MilestoneRingDimensions as JourneyRingDimensions,
  MilestoneRingProps,
  MilestoneRingProps as JourneyRingProps,
  MilestoneRingVariant,
  MilestoneRingVariant as JourneyRingVariant,
} from "./MilestoneRing";
