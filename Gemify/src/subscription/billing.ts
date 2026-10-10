export type BillingStatus = {
  active: boolean;
  expiresAt: number | null;
  willRenew: boolean | null;
};

export type BillingCallbacks = {
  onPurchase: () => void;
  onError: (error: unknown, cancelled: boolean) => void;
};

export async function connectBilling(_callbacks: BillingCallbacks): Promise<void> {}

export async function readBillingStatus(): Promise<BillingStatus> {
  return { active: false, expiresAt: null, willRenew: null };
}

export async function readBillingPrice(): Promise<string | null> {
  return null;
}

export async function purchasePremium(): Promise<void> {
  throw new Error("Subscriptions are available in the Gemify iPhone app.");
}

export async function restorePremium(): Promise<void> {
  throw new Error("Restore purchases in the Gemify iPhone app.");
}

export async function managePremium(): Promise<void> {
  throw new Error("Manage your subscription in the Gemify iPhone app.");
}

export function isPurchaseCancelled(_error: unknown): boolean {
  return false;
}
