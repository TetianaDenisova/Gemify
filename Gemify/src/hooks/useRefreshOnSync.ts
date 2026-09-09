import { useEffect } from "react";

import { subscribeToSyncApplied } from "@/sync/events";

/**
 * Re-runs a data hook's `refresh` when a sync writes changes from another
 * device, so a screen that is already open picks them up instead of waiting
 * for the next focus.
 */
export function useRefreshOnSync(refresh: () => void): void {
  useEffect(() => subscribeToSyncApplied(refresh), [refresh]);
}
