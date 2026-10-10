import { Redirect } from "expo-router";

export default function WeeklyPlanRedirect() {
  return <Redirect href={{ pathname: "/my-day", params: { mode: "week" } }} />;
}
