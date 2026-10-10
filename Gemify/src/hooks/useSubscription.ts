import { useSyncExternalStore } from "react";

import {
  getSubscriptionState, manageSubscription, refreshSubscription,
  restoreSubscription, setTestPremium, subscribeToSubscription, upgradeSubscription,
} from "@/subscription/store";
import { PREMIUM_TEST_MODE } from "@/subscription/config";

export function useSubscription() {
  const state = useSyncExternalStore(subscribeToSubscription, getSubscriptionState, getSubscriptionState);
  return {
    ...state, testMode: PREMIUM_TEST_MODE, setTestPremium,
    upgrade: upgradeSubscription, restore: restoreSubscription,
    manage: manageSubscription, refresh: refreshSubscription,
  };
}
