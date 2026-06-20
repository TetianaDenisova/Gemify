import type { ImageSourcePropType } from "react-native";

export const menuIcons = {
  home: {
    active: require("../../assets/menu-icons/tab_home_active.png"),
    inactive: require("../../assets/menu-icons/tab_home_muted.png"),
  },
  today: {
    active: require("../../assets/menu-icons/tab_today_active.png"),
    inactive: require("../../assets/menu-icons/tab_today_muted.png"),
  },
  sprint: {
    active: require("../../assets/menu-icons/tab_sprint_active.png"),
    inactive: require("../../assets/menu-icons/tab_sprint_muted.png"),
  },
  progress: {
    active: require("../../assets/menu-icons/tab_progress_active.png"),
    inactive: require("../../assets/menu-icons/tab_progress_muted.png"),
  },
} satisfies Record<
  string,
  {
    active: ImageSourcePropType;
    inactive: ImageSourcePropType;
  }
>;

export type MenuTab = keyof typeof menuIcons;
