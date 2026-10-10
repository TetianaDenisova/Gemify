import { useState } from "react";

import { TimeBlockSettingsModal } from "@/components/TimeBlockSettingsModal";
import {
  ActionMenuSheet,
  CalendarIcon,
  GearIcon,
  IconButton,
  type IconButtonSize,
} from "@/shared/components";

export type PlanMode = "day" | "week";

type PlanSettingsButtonProps = {
  mode: PlanMode;
  onSelectMode: (mode: PlanMode) => void;
  onTimeBlocksChanged: () => void;
  size?: IconButtonSize;
};

export function PlanSettingsButton({
  mode,
  onSelectMode,
  onTimeBlocksChanged,
  size,
}: PlanSettingsButtonProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [blockSettingsOpen, setBlockSettingsOpen] = useState(false);
  const nextMode = mode === "day" ? "week" : "day";

  return (
    <>
      <IconButton
        accessibilityLabel="Open plan settings"
        icon={<GearIcon size={22} />}
        onPress={() => setMenuOpen(true)}
        size={size}
      />
      <ActionMenuSheet
        eyebrow="Plan settings"
        onClose={() => setMenuOpen(false)}
        options={[
          {
            id: "switch-view",
            icon: CalendarIcon,
            label: `Switch to ${nextMode === "week" ? "Week" : "Day"} view`,
            onPress: () => {
              setMenuOpen(false);
              onSelectMode(nextMode);
            },
          },
          {
            id: "time-blocks",
            icon: GearIcon,
            label: "Configure time blocks",
            onPress: () => {
              setMenuOpen(false);
              setBlockSettingsOpen(true);
            },
          },
        ]}
        visible={menuOpen}
      />
      {blockSettingsOpen ? (
        <TimeBlockSettingsModal
          onChanged={onTimeBlocksChanged}
          onClose={() => setBlockSettingsOpen(false)}
          visible
        />
      ) : null}
    </>
  );
}
