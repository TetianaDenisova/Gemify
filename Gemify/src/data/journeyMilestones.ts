import { journeyMilestoneBoardLayout } from "@/data/journeyMilestoneBoardLayout";

export type JourneyMilestoneLabelSide = "left" | "right" | "center";
export type JourneyMilestoneRingVariant = "simple" | "detailed";

/** Content and product state shown in labels and the milestone modal. */
export type JourneyMilestoneContent = {
  active?: boolean;
  completed?: boolean;
  description: string;
  id: number;
  locked?: boolean;
  state: string;
  subtitle: string;
  title: string;
};

/** Visual configuration used only to place and draw a milestone on the map. */
export type JourneyMilestoneBoardConfig = {
  glowIntensity: number;
  labelSide: JourneyMilestoneLabelSide;
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

// Edit titles, descriptions, states and completion status here.
export const journeyMilestoneContent: readonly JourneyMilestoneContent[] = [
  {
    id: 1,
    title: "Awakening",
    subtitle: "Starting within",
    state: "Calm",
    description: "The first step of the journey.",
    active: true,
  },
  {
    id: 2,
    title: "Transforming",
    subtitle: "Inner shift",
    state: "Confidence",
    description: "A moment of inner transformation.",
  },
  {
    id: 3,
    title: "Building",
    subtitle: "New foundations",
    state: "Focus",
    description: "Building new foundations.",
  },
  {
    id: 4,
    title: "Expanding",
    subtitle: "New environment",
    state: "Expansion",
    description: "Entering a wider environment.",
  },
  {
    id: 5,
    title: "Becoming",
    subtitle: "Your next level",
    state: "Power",
    description: "Moving toward your next level.",
  },
  {
    id: 6,
    title: "Vision",
    subtitle: "Closer to point B",
    state: "Clarity",
    description: "You are approaching the destination.",
  },
];

function getBoardConfig(milestoneId: number) {
  const config = journeyMilestoneBoardLayout.find(
    (item) => item.milestoneId === milestoneId,
  );

  if (!config) {
    throw new Error(`Missing board layout for milestone ${milestoneId}`);
  }

  return config;
}

// Compatibility view consumed by the current screen and components.
export const journeyMilestones: readonly JourneyMilestoneData[] =
  journeyMilestoneContent.map((content) => {
    const { milestoneId: _milestoneId, ...boardConfig } = getBoardConfig(
      content.id,
    );

    return {
      ...content,
      ...boardConfig,
    };
  });
