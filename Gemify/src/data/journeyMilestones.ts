import { journeyMilestoneBoardLayout } from "@/data/journeyMilestoneBoardLayout";

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

// Edit titles, descriptions, states and completion status here.
export const journeyMilestoneContent: readonly JourneyMilestoneContent[] = [
  {
    id: 1,
    title: "Awakening",
    subtitle: "Starting within",
    state: "Calm",
    description: "The first step of the journey.",
    active: false,
  },
  {
    id: 2,
    title: "Transforming",
    subtitle: "Inner shift",
    state: "Confidence",
    description: "A moment of inner transformation.",
    active: false,
  },
  {
    id: 3,
    title: "Building",
    subtitle: "New foundations",
    artifact: "Report on my table",
    state: "Focused",
    mentor: "Fitness coach",
    reward: "Spa day",
    description: "Building new foundations.",
    active: true,
  },
  {
    id: 4,
    title: "Expanding",
    subtitle: "New environment",
    state: "Expansion",
    description: "Entering a wider environment.",
    active: true,
  },
  {
    id: 5,
    title: "Becoming",
    subtitle: "Your next level",
    state: "Power",
    description: "Moving toward your next level.",
    active: true,
  },
  {
    id: 6,
    title: "Vision",
    subtitle: "Closer to point B",
    state: "Clarity",
    description: "You are approaching the destination.",
    active: true,
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
