export type JourneyMilestoneRingVariant = "simple" | "detailed";

/** Content and product state shown in labels and the milestone modal. */
export type JourneyMilestoneContent = {
  active: boolean;
  artifact?: string;
  completed?: boolean;
  description: string;
  id: number;
  locked?: boolean;
  mentor?: string;
  /** Attached step image URI shown in the milestone sheet. */
  photoUri?: string | null;
  reward?: string;
  state: string;
  subtitle: string;
  title: string;
};

/** Visual configuration used only to place and draw a milestone on the map. */
export type JourneyMilestoneBoardConfig = {
  glowIntensity: number;
  milestoneId: number;
  opacity: number;
  rotation: number;
  size: number;
  tilt: number;
  variant: JourneyMilestoneRingVariant;
  /** Relative horizontal position inside the rendered map image. */
  x: number;
  /** Relative vertical position inside the rendered map image. */
  y: number;
};

export type JourneyMilestoneData = JourneyMilestoneContent &
  Omit<JourneyMilestoneBoardConfig, "milestoneId">;
