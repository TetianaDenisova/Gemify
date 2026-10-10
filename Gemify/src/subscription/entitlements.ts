import { getSubscriptionState, initializeSubscription } from "./store";

export class PremiumRequiredError extends Error {
  constructor(message = "Upgrade to Premium to use this feature.") {
    super(message);
    this.name = "PremiumRequiredError";
  }
}

export async function requirePremium(message?: string): Promise<void> {
  await initializeSubscription();
  if (!getSubscriptionState().premium) throw new PremiumRequiredError(message);
}

export async function requireCreationAllowance(kind: "dream" | "habit", activeCount: number) {
  await initializeSubscription();
  if (!getSubscriptionState().premium && activeCount >= 1) {
    throw new PremiumRequiredError(`Basic includes 1 active ${kind}. Upgrade to Premium for unlimited ${kind}s.`);
  }
}
