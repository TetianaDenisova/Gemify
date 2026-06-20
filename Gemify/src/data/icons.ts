import type { ImageSourcePropType } from "react-native";

import type { FocusIconKey, GoalIconKey } from "@/data/homeData";

const sparkIcon = require("./icons/goal_icon_spark.png");
const lotusIcon = require("./icons/goal_icon_lotus.png");
const mountainsIcon = require("./icons/goal_icon_mountains.png");

export const goalIcons: Record<GoalIconKey, ImageSourcePropType> = {
  spark: sparkIcon,
  lotus: lotusIcon,
  mountains: mountainsIcon,
};

export const focusIcons: Record<FocusIconKey, ImageSourcePropType> = {
  lotus: lotusIcon,
  sunrise: sparkIcon,
  heart: lotusIcon,
};
