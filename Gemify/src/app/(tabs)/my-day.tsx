import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";

import { DayPlanView } from "@/components/plan/DayPlanView";
import type { PlanMode } from "@/components/plan/PlanSettingsButton";
import { WeekPlanView } from "@/components/plan/WeekPlanView";
import { todayKey } from "@/utils/dates";

export default function PlanScreen() {
  const router = useRouter();
  const { mode: requestedMode } = useLocalSearchParams<{ mode?: string }>();
  const [date, setDate] = useState(todayKey);
  const mode: PlanMode = requestedMode === "week" ? "week" : "day";
  const viewProps = {
    date,
    onSelectDate: setDate,
    onSelectMode: (nextMode: PlanMode) => router.setParams({ mode: nextMode }),
  };

  return mode === "week" ? (
    <WeekPlanView {...viewProps} />
  ) : (
    <DayPlanView {...viewProps} />
  );
}
