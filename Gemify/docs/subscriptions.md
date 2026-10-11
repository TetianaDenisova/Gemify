# iPhone subscriptions

Gemify uses Apple in-app purchases through `expo-iap` (StoreKit 2). Stripe is
not used. The monthly subscription product defaults to
`com.gemify.app.premium.monthly`; set `EXPO_PUBLIC_APPLE_PREMIUM_PRODUCT_ID`
to use another product ID. The UI reads the localized price from Apple, falling
back to `PREMIUM_MONTHLY_PRICE` in `src/subscription/config.ts` (`$19/month`)
when a store price is unavailable. This display fallback does not set the Apple
product's billing price.

Account & Subscription is the last bottom-navigation tab, after Memories.
Premium's Data section contains Cloud sync, Export data and Import data.
Delete account is visible only while signed in.

## Free Premium testing

Set `EXPO_PUBLIC_PREMIUM_TEST_MODE=true` before starting, exporting or building
the app. This works in release builds, on iPhone, and in the web preview. It
starts with Premium enabled and shows a Test Premium switch on Account &
Subscription. Switching off previews Basic; switching on restores free
Premium. The choice lasts for the current app session. Test builds never
initialize Apple billing or make a purchase request.

PowerShell local preview:

```powershell
$env:EXPO_PUBLIC_PREMIUM_TEST_MODE = 'true'
npm.cmd run web
```

iPhone internal build:

```powershell
npx.cmd eas-cli build --platform ios --profile premium-test
```

For an existing web deployment, set the same environment variable before
`npm.cmd run deploy`. The flag is embedded when the JavaScript bundle is built,
so changing it requires restarting Metro or rebuilding/re-exporting. Every
user receiving that bundle gets the testing override. The `production` EAS
profile explicitly sets it to `false`.

## Apple setup

1. Create an auto-renewable monthly Premium subscription in App Store Connect
   for the `com.gemify.app` app, with the product ID above. Complete its metadata,
   pricing, agreements and banking setup.
2. Set `EXPO_PUBLIC_PRIVACY_URL` and `EXPO_PUBLIC_TERMS_URL` to your public legal
   pages, and configure Supabase as described in `.env.example` and
   `supabase/schema.sql`.
3. Build the native app after installing `expo-iap`. Real purchases require a
   development/TestFlight/App Store build, not Expo Go or a web browser.
4. Test purchase, cancellation, Ask to Buy, restore, expiry, refund and renewal
   in Apple's sandbox before submitting the app. Manage subscription opens
   Apple's subscription management. Restore refreshes the current entitlement.

The app reads StoreKit's active subscription status on startup, foregrounding,
purchase completion, restore and expiration. Turning off automatic renewal
does not remove access until the current period ends. A local SQLite setting
does not grant a paid subscription. Apple purchases belong to the Apple account;
Gemify email sign-out does not cancel them. An unavailable product or billing
connection produces a retryable error and does not grant Premium.

Basic allows one active dream and one active habit, local data only. Premium
unlocks unlimited creation, cloud sync and backup import/export. Existing
records remain readable after a downgrade; nothing is automatically deleted.
Restoring an archived/completed record also checks the Basic limit. The build
override uses the same feature checks as the Apple entitlement.

These checks run in the app. The existing Supabase RLS still enforces ownership;
it does not verify an Apple entitlement on the server. If cloud access must be
enforced against modified clients, add server-side App Store verification and
App Store Server Notifications before offering it as a paid server service.

## Account deletion

Deploy the supplied authenticated Edge Function:

```powershell
npx.cmd supabase functions deploy delete-account
```

Keep JWT verification enabled. The function also validates the bearer token with
Supabase Auth, derives the user ID from that token, deletes the user's photos
from `gemify-photos`, and deletes the Auth user. The schema's cascade removes
their `sync_rows`. No service-role key is included in the app.

The app pauses/drains local sync before calling the function. Only a successful
server response clears the local session, SQLite data and owned photo directory.
Deletion is available independently of the subscription. The confirmation
explains that Apple billing must be canceled separately.
