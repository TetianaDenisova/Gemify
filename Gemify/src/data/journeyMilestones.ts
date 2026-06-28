export type JourneyMilestoneLabelSide = "left" | "right" | "center";
export type JourneyMilestoneRingVariant = "simple" | "detailed";

export type JourneyMilestoneData = {
  active?: boolean;
  completed?: boolean;
  description: string;
  glowIntensity: number;
  id: number;
  labelSide: JourneyMilestoneLabelSide;
  locked?: boolean;
  opacity: number;
  rotation: number;
  size: number;
  state: string;
  subtitle: string;
  tilt: number;
  title: string;
  variant: JourneyMilestoneRingVariant;
  /** Relative horizontal position inside the rendered map image. */
  x: number;
  /** Relative vertical position inside the rendered map image. */
  y: number;
};

// Tune x/y here. Values are relative to the fitted image, not the device screen.
export const journeyMilestones: readonly JourneyMilestoneData[] = [
  {
    id: 1,
    title: "Awakening",
    subtitle: "Starting within",
    state: "Calm",
    description: "The first step of the journey.",
    x: 0.52,
    y: 0.78,
    size: 150,
    tilt: 0.38,
    rotation: -7,
    labelSide: "right",
    opacity: 1,
    glowIntensity: 0.98,
    active: true,
    variant: "detailed",
  },
  {
    id: 2,
    title: "Transforming",
    subtitle: "Inner shift",
    state: "Confidence",
    description: "A moment of inner transformation.",
    x: 0.34,
    y: 0.66,
    size: 120,
    tilt: 0.32,
    rotation: 8,
    labelSide: "left",
    opacity: 0.94,
    glowIntensity: 0.88,
    variant: "detailed",
  },
  {
    id: 3,
    title: "Building",
    subtitle: "New foundations",
    state: "Focus",
    description: "Building new foundations.",
    x: 0.58,
    y: 0.56,
    size: 105,
    tilt: 0.28,
    rotation: -5,
    labelSide: "right",
    opacity: 0.9,
    glowIntensity: 0.8,
    variant: "detailed",
  },
  {
    id: 4,
    title: "Expanding",
    subtitle: "New environment",
    state: "Expansion",
    description: "Entering a wider environment.",
    x: 0.38,
    y: 0.45,
    size: 95,
    tilt: 0.24,
    rotation: 7,
    labelSide: "left",
    opacity: 0.84,
    glowIntensity: 0.72,
    variant: "simple",
  },
  {
    id: 5,
    title: "Becoming",
    subtitle: "Your next level",
    state: "Power",
    description: "Moving toward your next level.",
    x: 0.62,
    y: 0.36,
    size: 78,
    tilt: 0.2,
    rotation: -4,
    labelSide: "right",
    opacity: 0.78,
    glowIntensity: 0.64,
    variant: "simple",
  },
  {
    id: 6,
    title: "Vision",
    subtitle: "Closer to point B",
    state: "Clarity",
    description: "You are approaching the destination.",
    x: 0.5,
    y: 0.27,
    size: 60,
    tilt: 0.17,
    rotation: 4,
    labelSide: "center",
    opacity: 0.72,
    glowIntensity: 0.56,
    variant: "simple",
  },
];
