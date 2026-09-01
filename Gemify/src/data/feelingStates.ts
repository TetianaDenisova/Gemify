/**
 * Feeling-state catalog shown on the "How do you want to feel there?" screen.
 * The same labels are seeded into the `feeling_states` table (src/db/seeds.ts
 * keeps its own copy on purpose — shipped migrations must stay immutable).
 */
export const FEELING_STATES = [
  { icon: "♠", label: "Alive" },
  { icon: "⌁", label: "Free" },
  { icon: "♕", label: "Powerful" },
  { icon: "♨", label: "Calm" },
  { icon: "☾", label: "Peaceful" },
  { icon: "∪", label: "Magnetic" },
  { icon: "✣", label: "Creative" },
  { icon: "♡", label: "Loved" },
  { icon: "✦", label: "Clear" },
  { icon: "♢", label: "Confident" },
  { icon: "♙", label: "Connected" },
  { icon: "☀", label: "Joyful" },
  { icon: "⌂", label: "Safe" },
  { icon: "ϟ", label: "Energized" },
  { icon: "✧", label: "Desired" },
] as const;

export type FeelingStateEntry = (typeof FEELING_STATES)[number];
