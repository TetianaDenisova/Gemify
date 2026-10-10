import { AppState, Platform } from "react-native";

import * as billing from "./billing";
import { PREMIUM_TEST_MODE } from "./config";

export type SubscriptionState = {
  ready: boolean;
  premium: boolean;
  source: "basic" | "apple" | "test";
  busy: boolean;
  price: string | null;
  expiresAt: number | null;
  willRenew: boolean | null;
  error: string | null;
};

let state: SubscriptionState = {
  ready: PREMIUM_TEST_MODE || Platform.OS !== "ios",
  premium: PREMIUM_TEST_MODE,
  source: PREMIUM_TEST_MODE ? "test" : "basic",
  busy: false,
  price: null,
  expiresAt: null,
  willRenew: null,
  error: null,
};
const listeners = new Set<() => void>();
let initialization: Promise<void> | null = null;
let expiryTimer: ReturnType<typeof setTimeout> | null = null;

function update(patch: Partial<SubscriptionState>) {
  state = { ...state, ...patch };
  listeners.forEach((listener) => listener());
}

export const getSubscriptionState = () => state;
export function subscribeToSubscription(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

function describe(error: unknown) {
  return error instanceof Error ? error.message : "Could not load your Apple subscription. Please try again.";
}

async function refreshStatus() {
  const status = await billing.readBillingStatus();
  if (expiryTimer) clearTimeout(expiryTimer);
  update({
    ready: true, premium: status.active, source: status.active ? "apple" : "basic",
    expiresAt: status.expiresAt, willRenew: status.willRenew,
  });
  if (status.active && status.expiresAt) {
    const delay = Math.min(Math.max(status.expiresAt - Date.now(), 1), 2_147_483_647);
    expiryTimer = setTimeout(() => { void refreshSubscription(); }, delay);
  }
}

export function initializeSubscription(): Promise<void> {
  if (PREMIUM_TEST_MODE || Platform.OS !== "ios") return Promise.resolve();
  if (!initialization) {
    initialization = (async () => {
      await billing.connectBilling({
        onPurchase: () => {
          update({ busy: false, error: null });
          void refreshSubscription();
        },
        onError: (error, cancelled) => update({ busy: false, error: cancelled ? null : describe(error) }),
      });
      await refreshStatus();
      // A missing product must not hide an already-owned entitlement.
      try { update({ price: await billing.readBillingPrice() }); }
      catch (error) { update({ error: describe(error) }); }
    })().catch((error: unknown) => {
      initialization = null;
      update({ ready: true, error: describe(error) });
    });
  }
  return initialization;
}

export async function refreshSubscription(): Promise<void> {
  if (PREMIUM_TEST_MODE || Platform.OS !== "ios") return;
  await initializeSubscription();
  if (!initialization) return;
  try {
    await refreshStatus();
    update({ price: await billing.readBillingPrice(), error: null });
  } catch (error) {
    if (state.expiresAt != null && state.expiresAt <= Date.now()) {
      update({ premium: false, source: "basic" });
    }
    update({ error: describe(error) });
  }
}

export function observeSubscription() {
  void initializeSubscription();
  const listener = AppState.addEventListener("change", (next) => {
    if (next === "active") void refreshSubscription();
  });
  return () => listener.remove();
}

export function setTestPremium(premium: boolean) {
  if (!PREMIUM_TEST_MODE) throw new Error("Premium testing is disabled in this build.");
  update({ premium, source: premium ? "test" : "basic", error: null });
}

export async function upgradeSubscription() {
  if (state.busy) return;
  if (PREMIUM_TEST_MODE) { setTestPremium(true); return; }
  update({ busy: true, error: null });
  try {
    await initializeSubscription();
    if (!state.price) throw new Error("The Premium subscription is unavailable. Please try again later.");
    await billing.purchasePremium();
    update({ busy: false });
    // Entitlements still change only through verified status, including deferred purchases.
  } catch (error) {
    update({ busy: false, error: billing.isPurchaseCancelled(error) ? null : describe(error) });
  }
}

export async function restoreSubscription(): Promise<boolean> {
  if (state.busy) return state.premium;
  if (PREMIUM_TEST_MODE) return state.premium;
  update({ busy: true, error: null });
  try {
    await initializeSubscription();
    await billing.restorePremium();
    await refreshStatus();
    return state.premium;
  } catch (error) {
    update({ error: describe(error) });
    throw error;
  } finally { update({ busy: false }); }
}

export async function manageSubscription() {
  if (PREMIUM_TEST_MODE) return;
  await billing.managePremium();
  await refreshSubscription();
}
