import type { BillingCallbacks, BillingStatus } from "./billing";
import { PREMIUM_PRODUCT_ID } from "./config";

// Load lazily so a test build can run without opening the App Store connection.
let api: typeof import("expo-iap") | null = null;
let connected = false;
let updates: { remove: () => void } | null = null;
let errors: { remove: () => void } | null = null;

async function billing() {
  if (!api) api = await import("expo-iap");
  return api;
}

export async function connectBilling(callbacks: BillingCallbacks): Promise<void> {
  if (connected) return;
  const iap = await billing();
  updates?.remove();
  errors?.remove();
  updates = iap.purchaseUpdatedListener((purchase) => {
    if (purchase.productId !== PREMIUM_PRODUCT_ID) return;
    void (async () => {
      // StoreKit's current entitlements contain only verified transactions.
      const status = await readBillingStatus();
      if (!status.active) throw new Error("Your purchase is awaiting Apple confirmation. Try Restore purchases shortly.");
      await iap.finishTransaction({ purchase, isConsumable: false });
      callbacks.onPurchase();
    })().catch((error: unknown) => callbacks.onError(error, false));
  });
  errors = iap.purchaseErrorListener((error) => {
    callbacks.onError(error, error.code === iap.ErrorCode.UserCancelled);
  });
  try {
    connected = await iap.initConnection();
    if (!connected) throw new Error("Could not connect to the App Store.");
  } catch (error) {
    updates.remove();
    errors.remove();
    updates = null;
    errors = null;
    throw error;
  }
}

export async function readBillingStatus(): Promise<BillingStatus> {
  const subscriptions = await (await billing()).getActiveSubscriptions([PREMIUM_PRODUCT_ID]);
  const active = subscriptions.find((subscription) =>
    subscription.productId === PREMIUM_PRODUCT_ID && subscription.isActive &&
    (subscription.expirationDateIOS == null || subscription.expirationDateIOS > Date.now()),
  );
  return {
    active: Boolean(active),
    expiresAt: active?.expirationDateIOS ?? null,
    willRenew: active?.renewalInfoIOS?.willAutoRenew ?? null,
  };
}

export async function readBillingPrice(): Promise<string | null> {
  const products = await (await billing()).fetchProducts({ skus: [PREMIUM_PRODUCT_ID], type: "subs" });
  return products?.find((product) => product.id === PREMIUM_PRODUCT_ID)?.displayPrice ?? null;
}

export async function purchasePremium(): Promise<void> {
  await (await billing()).requestPurchase({
    type: "subs",
    request: { apple: { sku: PREMIUM_PRODUCT_ID } },
  });
}

export async function restorePremium(): Promise<void> {
  await (await billing()).restorePurchases();
}

export async function managePremium(): Promise<void> {
  await (await billing()).deepLinkToSubscriptions();
}

export function isPurchaseCancelled(error: unknown): boolean {
  return api !== null && typeof error === "object" && error !== null &&
    "code" in error && error.code === api.ErrorCode.UserCancelled;
}
