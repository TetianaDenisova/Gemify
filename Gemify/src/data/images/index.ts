import type { ImageSourcePropType } from "react-native";

import type { GoalImageKey } from "@/data/homeTypes";

// Dark night-scene art with gold accents on the right — the left edge stays
// near-black so the GoalCard shade keeps titles readable.
export const goalImages: Record<GoalImageKey, ImageSourcePropType> = {
  dream_bg_1: require("../../../assets/images/main-dream-bg/dream-bg-1.png"),
  dream_bg_2: require("../../../assets/images/main-dream-bg/dream-bg-2.png"),
  dream_bg_4: require("../../../assets/images/main-dream-bg/dream-bg-4.png"),
  dream_bg_5: require("../../../assets/images/main-dream-bg/dream-bg-5.png"),
  dream_bg_7: require("../../../assets/images/main-dream-bg/dream-bg-7.png"),
  dream_bg_8: require("../../../assets/images/main-dream-bg/dream-bg-8.png"),
  dream_bg_9: require("../../../assets/images/main-dream-bg/dream-bg-9.png"),
  dream_bg_10: require("../../../assets/images/main-dream-bg/dream-bg-10.png"),
};
