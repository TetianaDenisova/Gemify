import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useCloudSync } from "@/hooks/useCloudSync";
import {
  AppButton,
  AppInput,
  AppText,
  Card,
  ScreenHeader,
  ScreenScaffold,
} from "@/shared/components";
import { confirmSignInCode, requestSignInCode, signOut } from "@/sync";
import { useLayoutSize } from "@/hooks/useLayoutSize";
import { colors } from "@/theme/colors";
import { spacing } from "@/theme/theme";

/**
 * Cloud sync settings: sign in with an emailed code, then push and pull this
 * device's journey. Everything keeps working offline — syncing only decides
 * whether the other device sees it.
 */
export default function CloudSyncScreen() {
  const insets = useSafeAreaInsets();
  const { phone } = useLayoutSize();
  const sync = useCloudSync();

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const runAuthStep = async (step: () => Promise<void>) => {
    setAuthBusy(true);
    setAuthError(null);
    try {
      await step();
    } catch (cause) {
      setAuthError(
        cause instanceof Error ? cause.message : "Something went wrong.",
      );
    } finally {
      setAuthBusy(false);
    }
  };

  const handleSendCode = () =>
    runAuthStep(async () => {
      await requestSignInCode(email);
      setCodeSent(true);
    });

  const handleConfirmCode = () =>
    runAuthStep(async () => {
      await confirmSignInCode(email, code);
      setCode("");
      setCodeSent(false);
      await sync.sync();
    });

  const handleSignOut = () =>
    runAuthStep(async () => {
      await signOut();
      setEmail("");
      setCode("");
      setCodeSent(false);
    });

  return (
    <>
      <ScreenHeader asStackHeader title="Cloud sync" />

      <ScreenScaffold
        contentStyle={[
          styles.content,
          { paddingTop: insets.top + (phone ? 60 : 72) },
        ]}
        keyboardAvoiding
      >
        {!sync.configured ? (
          <Card variant="glass">
            <AppText variant="cardTitle">Sync is not set up</AppText>
            <AppText style={styles.body} variant="helper">
              This build has no Supabase credentials. Add
              EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to a
              .env file and restart the dev server.
            </AppText>
          </Card>
        ) : !sync.ready ? (
          <AppText variant="helper">Checking your account…</AppText>
        ) : sync.signedIn ? (
          <SignedIn
            busy={authBusy}
            onSignOut={handleSignOut}
            sync={sync}
          />
        ) : (
          <View style={styles.form}>
            <Card variant="glass">
              <AppText variant="cardTitle">Sync across your devices</AppText>
              <AppText style={styles.body} variant="helper">
                Sign in with the same email on your phone and your other device
                and both keep the same journey. Nothing leaves this device
                until you do.
              </AppText>
            </Card>

            <AppInput
              autoCapitalize="none"
              autoComplete="email"
              editable={!authBusy}
              inputMode="email"
              label="Email"
              onChangeText={setEmail}
              placeholder="you@example.com"
              value={email}
            />

            {codeSent ? (
              <>
                <AppInput
                  autoComplete="one-time-code"
                  editable={!authBusy}
                  inputMode="numeric"
                  label="Code from your inbox"
                  maxLength={8}
                  onChangeText={setCode}
                  placeholder="123456"
                  value={code}
                />
                <AppButton
                  disabled={authBusy || code.trim().length === 0}
                  label={authBusy ? "Signing in…" : "Sign in"}
                  onPress={handleConfirmCode}
                />
                <AppButton
                  disabled={authBusy}
                  label="Send a new code"
                  onPress={handleSendCode}
                  variant="ghost"
                />
              </>
            ) : (
              <AppButton
                disabled={authBusy || email.trim().length === 0}
                label={authBusy ? "Sending…" : "Email me a code"}
                onPress={handleSendCode}
              />
            )}
          </View>
        )}

        {authError ? (
          <AppText color={colors.danger} style={styles.body} variant="helper">
            {authError}
          </AppText>
        ) : null}
      </ScreenScaffold>
    </>
  );
}

function SignedIn({
  busy,
  onSignOut,
  sync,
}: {
  busy: boolean;
  onSignOut: () => void;
  sync: ReturnType<typeof useCloudSync>;
}) {
  const { lastResult } = sync;

  return (
    <View style={styles.form}>
      <Card variant="glass">
        <AppText variant="label">Signed in as</AppText>
        <AppText style={styles.body} variant="cardTitle">
          {sync.email ?? "this device"}
        </AppText>
        <AppText style={styles.body} variant="helper">
          {sync.lastSyncedAt
            ? `Last synced ${new Date(sync.lastSyncedAt).toLocaleString()}`
            : "Not synced on this device yet."}
        </AppText>
      </Card>

      <AppButton
        disabled={sync.busy || busy}
        label={sync.busy ? "Syncing…" : "Sync now"}
        onPress={() => {
          void sync.sync();
        }}
      />

      {lastResult ? (
        <AppText variant="helper">
          {`Sent ${lastResult.pushed}, received ${lastResult.pulled}` +
            (lastResult.downloaded > 0
              ? `, ${lastResult.downloaded} photos downloaded.`
              : ".")}
        </AppText>
      ) : null}

      {sync.error ? (
        <AppText color={colors.danger} variant="helper">
          {sync.error}
        </AppText>
      ) : null}

      <AppButton
        disabled={busy || sync.busy}
        label="Sign out"
        onPress={onSignOut}
        variant="ghost"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
    marginTop: spacing.sm,
  },
  content: {
    gap: spacing.lg,
    paddingBottom: spacing.xl,
  },
  form: {
    gap: spacing.md,
  },
});
