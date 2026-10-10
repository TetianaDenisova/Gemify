import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import { ActivityIndicator, Image, Linking, Platform, Pressable, StyleSheet, Switch, View } from "react-native";

import { useCloudSync } from "@/hooks/useCloudSync";
import { useLayoutSize } from "@/hooks/useLayoutSize";
import { useSubscription } from "@/hooks/useSubscription";
import { exportBackup, pickAndImportBackup } from "@/db";
import { notifySyncApplied } from "@/sync/events";
import { deleteAccount } from "@/sync/account";
import { signOut } from "@/sync";
import {
  AppButton, AppModal, AppText, ArrowRightIcon, CheckIcon, CloseIcon,
  DreamIcon, PlusIcon, ScreenHeader, ScreenScaffold, SyncIcon, TrashIcon,
} from "@/shared/components";
import { PRIVACY_URL, TERMS_URL } from "@/subscription/config";
import { colors } from "@/theme/colors";
import { fonts, radius, spacing } from "@/theme/theme";

const BACKGROUND = require("../../../subscription-bg.png");
const UPGRADE_ART = require("../../../assets/btn-upgrade-to-premium.png");
const PREMIUM_FEATURES = ["Unlimited Dreams", "Unlimited Habits", "Sync across devices", "Import & export data"];
const BASIC_FEATURES = [
  { label: "1 active Dream", available: true },
  { label: "1 active Habit", available: true },
  { label: "Local data only", available: true },
  { label: "No cloud sync", available: false },
  { label: "No import or export data", available: false },
];

export default function AccountSubscriptionScreen() {
  const router = useRouter();
  const { phone } = useLayoutSize();
  const account = useCloudSync();
  const subscription = useSubscription();
  const [accountBusy, setAccountBusy] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [notice, setNotice] = useState<{ title: string; message: string } | null>(null);
  const busy = accountBusy || subscription.busy;

  async function runAction(action: () => Promise<void>) {
    if (busy) return;
    setAccountBusy(true);
    try { await action(); }
    catch (error) {
      setDeleteOpen(false);
      setImportOpen(false);
      setNotice({ title: "Please try again", message: error instanceof Error ? error.message : "Something went wrong." });
    } finally { setAccountBusy(false); }
  }

  function handleManage() {
    if (subscription.source === "test") {
      setNotice({ title: "Test Premium", message: "No Apple subscription or payment is attached to this access." });
      return;
    }
    void runAction(subscription.manage);
  }

  const name = account.email?.split("@")[0] || "Your account";
  const features = subscription.premium
    ? PREMIUM_FEATURES.map((label) => ({ label, available: true }))
    : BASIC_FEATURES;
  const renewal = subscription.expiresAt
    ? `${subscription.willRenew === false ? "Available until" : subscription.willRenew ? "Renews" : "Next billing date"} ${new Date(subscription.expiresAt).toLocaleDateString()}`
    : null;

  return (
    <>
      <View style={styles.screen}>
        <Image source={BACKGROUND} resizeMode="cover" style={styles.background} />
        <LinearGradient
          colors={["rgba(2, 5, 12, 0.25)", "rgba(2, 5, 12, 0.7)", "#030810", "#030810"]}
          locations={[0, 0.25, 0.55, 1]}
          style={StyleSheet.absoluteFill}
        />
      <ScreenScaffold style={styles.transparent} topInset tabClearance contentStyle={styles.content}>
        <ScreenHeader leftAction={null} style={styles.header} centerSlot={
          <AppText align="center" style={[styles.headerTitle, phone && styles.headerTitlePhone]}>
            Account & Subscription
          </AppText>
        } />
        <AppText variant="eyebrow" color={colors.primaryBright} style={styles.sectionLabel}>Account</AppText>
        <View style={styles.account}>
          <View style={styles.avatar}><DreamIcon size={32} color={colors.accentViolet} /></View>
          <View style={styles.accountIdentity}>
            <AppText style={styles.accountName}>{account.ready ? name : "Loading account..."}</AppText>
            <AppText color={colors.textSecondary} variant="bodySmall" style={styles.email}>
              {account.email ?? "Not signed in"}
            </AppText>
          </View>
          <Pressable accessibilityRole="button" disabled={busy || !account.ready}
            onPress={() => account.signedIn ? void runAction(signOut) : router.push("/cloud-sync")}
            style={({ pressed }) => [styles.authButton, (pressed || busy) && styles.dimmed]}>
            <AppText style={styles.authLabel}>{accountBusy ? "Please wait" : account.signedIn ? "Log out" : "Sign in"}</AppText>
          </Pressable>
        </View>

        {subscription.testMode && (
          <View style={styles.testRow}>
            <View style={styles.flex}>
              <AppText color={colors.accentGreen} variant="bodySmall">Test Premium</AppText>
              <AppText color={colors.textSecondary} variant="caption">No payment required</AppText>
            </View>
            <Switch accessibilityLabel="Test Premium" disabled={busy}
              value={subscription.premium} onValueChange={subscription.setTestPremium}
              trackColor={{ false: colors.secondary, true: colors.accentGreen }} thumbColor={colors.textPrimary} />
          </View>
        )}

        <AppText variant="eyebrow" color={colors.primaryBright} style={styles.sectionLabel}>Subscription</AppText>
        <View style={[styles.plan, subscription.premium && styles.premiumPlan]}>
          <Image source={BACKGROUND} resizeMode="cover" style={[StyleSheet.absoluteFill, styles.planArt]} />
          <LinearGradient colors={["rgba(3, 7, 12, 0.68)", "rgba(3, 7, 12, 0.96)"]} style={StyleSheet.absoluteFill} />
          <View style={styles.planHeading}>
            <View style={styles.flex}>
              <AppText style={styles.planName}>{subscription.premium ? "Premium" : "Basic"}</AppText>
              <AppText style={styles.planPrice}>
                {subscription.source === "test" ? "Free testing access" : subscription.premium && subscription.price ? `${subscription.price} / month` : subscription.premium ? "Apple subscription" : "Free"}
              </AppText>
            </View>
            <View style={[styles.status, subscription.premium && styles.activeStatus]}>
              {subscription.premium && <CheckIcon size={16} color={colors.accentGreen} />}
              <AppText style={styles.statusLabel} color={subscription.premium ? "#CBEA9A" : colors.textSecondary}>
                {!subscription.ready ? "Checking..." : subscription.source === "test" ? "Test access" : subscription.premium ? "Active" : "Current plan"}
              </AppText>
            </View>
          </View>
          <View style={styles.features}>
            {features.map((feature) => (
              <View key={feature.label} style={styles.feature}>
                {feature.available ? <CheckIcon color={colors.primaryBright} size={23} /> : <CloseIcon color={colors.textMuted} size={23} />}
                <AppText style={styles.featureLabel} color={feature.available ? "#EEECE5" : "#A8A4AC"}>{feature.label}</AppText>
              </View>
            ))}
          </View>
          {renewal && <AppText variant="caption" color={colors.textSecondary} style={styles.renewal}>{renewal}</AppText>}
          {subscription.premium ? (
            <AppButton label="Manage subscription" variant="secondary" icon={<ArrowRightIcon size={20} />}
              disabled={busy} onPress={handleManage} style={styles.manageButton} />
          ) : (
            <>
              {!subscription.testMode && subscription.price && <AppText align="center" variant="bodySmall" color={colors.primaryBright}>{subscription.price} / month</AppText>}
              <Pressable accessibilityRole="button" accessibilityLabel="Upgrade to Premium"
                accessibilityState={{ disabled: busy || !subscription.ready, busy: subscription.busy }}
                disabled={busy || !subscription.ready} onPress={() => void subscription.upgrade()}
                style={({ pressed }) => [styles.upgrade, (pressed || busy) && styles.dimmed]}>
                <Image source={UPGRADE_ART} resizeMode="contain" style={styles.upgradeArt} accessible={false} />
                {subscription.busy && <ActivityIndicator style={StyleSheet.absoluteFill} color={colors.primaryBright} />}
              </Pressable>
            </>
          )}
        </View>

        {subscription.error && (
          <View style={styles.errorRow}>
            <AppText accessibilityRole="alert" color={colors.danger} variant="bodySmall">{subscription.error}</AppText>
            <AppButton label="Try again" variant="ghost" disabled={busy} onPress={() => void subscription.refresh()} />
          </View>
        )}
        {!subscription.testMode && Platform.OS === "ios" && (
          <View style={styles.billingFooter}>
            <AppButton label="Restore purchases" icon={<SyncIcon size={18} />} variant="ghost" disabled={busy || !subscription.ready}
              onPress={() => void runAction(async () => {
                const restored = await subscription.restore();
                setNotice({ title: restored ? "Premium restored" : "No active subscription", message: restored ? "Your Apple subscription is available on this iPhone." : "No active Gemify Premium subscription was found for this Apple account." });
              })} />
            {!subscription.premium && <AppText align="center" variant="caption" color={colors.textSecondary}>
              Monthly subscription. Automatically renews unless canceled in your Apple account settings.
            </AppText>}
            <View style={styles.legalLinks}>
              {TERMS_URL && <Pressable accessibilityRole="link" onPress={() => void runAction(async () => { await Linking.openURL(TERMS_URL); })}><AppText variant="caption" color={colors.primary}>Terms of Use</AppText></Pressable>}
              {PRIVACY_URL && <Pressable accessibilityRole="link" onPress={() => void runAction(async () => { await Linking.openURL(PRIVACY_URL); })}><AppText variant="caption" color={colors.primary}>Privacy Policy</AppText></Pressable>}
            </View>
          </View>
        )}

        {subscription.premium && (
          <View style={styles.dataSection}>
            <AppText variant="eyebrow" color={colors.primaryBright} style={styles.sectionLabel}>Data</AppText>
            <View style={styles.dataActions}>
              <AppButton label="Cloud sync" icon={<SyncIcon size={20} />} variant="secondary" disabled={busy}
                onPress={() => router.push("/cloud-sync")} />
              <AppButton label="Export data" icon={<ArrowRightIcon size={20} />} variant="secondary" disabled={busy}
                onPress={() => void runAction(exportBackup)} />
              <AppButton label="Import data" icon={<PlusIcon size={20} />} variant="secondary" disabled={busy}
                onPress={() => setImportOpen(true)} />
            </View>
          </View>
        )}

        {account.signedIn && (
          <>
            <View style={styles.divider} />
            <Pressable accessibilityRole="button" accessibilityLabel="Delete account" disabled={busy}
              onPress={() => setDeleteOpen(true)} style={({ pressed }) => [styles.deleteRow, (pressed || busy) && styles.dimmed]}>
              <TrashIcon color="#FA5C54" size={28} />
              <View style={styles.flex}>
                <AppText style={styles.deleteTitle}>Delete account</AppText>
                <AppText variant="caption" color="#BFC0C7">Permanently delete your account and data</AppText>
              </View>
              <ArrowRightIcon color="#FA5C54" size={22} />
            </Pressable>
          </>
        )}
      </ScreenScaffold>
      </View>

      <AppModal visible={importOpen && subscription.premium} onClose={() => { if (!accountBusy) setImportOpen(false); }}>
        <AppText variant="cardTitle">Import dreams?</AppText>
        <AppText style={styles.modalBody} variant="bodySmall">
          New dreams will be added. If a dream already exists, that dream and its milestones,
          habits, progress and memories will be replaced by the imported version. Other dreams
          and app settings stay unchanged.
        </AppText>
        <View style={styles.modalActions}>
          <AppButton label="Import backup" disabled={accountBusy} onPress={() => {
            setImportOpen(false);
            void runAction(async () => {
              const summary = await pickAndImportBackup();
              if (!summary) return;
              notifySyncApplied();
              setNotice({ title: "Import complete", message:
                `Imported ${summary.dreams} dreams, ${summary.habits} habits, ${summary.quests} quests and ${summary.moments} memories.`,
              });
            });
          }} />
          <AppButton label="Cancel" variant="ghost" disabled={accountBusy} onPress={() => setImportOpen(false)} />
        </View>
      </AppModal>
      <AppModal visible={account.signedIn && deleteOpen} onClose={() => { if (!accountBusy) setDeleteOpen(false); }}>
        <AppText variant="cardTitle">Delete your account?</AppText>
        <AppText variant="bodySmall" style={styles.modalBody}>
          Your account, cloud data, photos and data on this device will be permanently deleted. This cannot be undone.
        </AppText>
        <AppText variant="bodySmall" color={colors.primaryBright} style={styles.modalBody}>
          Deleting your account does not cancel an Apple subscription. Cancel it in your Apple account settings first.
        </AppText>
        <View style={styles.modalActions}>
          <AppButton label="Manage Apple subscription" variant="secondary" disabled={accountBusy}
            onPress={() => void runAction(async () => { await Linking.openURL("https://apps.apple.com/account/subscriptions"); })} />
          <AppButton label={accountBusy ? "Deleting..." : "Delete account and data"} variant="secondary" disabled={accountBusy}
            style={styles.destructiveButton} textStyle={{ color: "#FA5C54" }} onPress={() => void runAction(async () => {
              await deleteAccount();
              setDeleteOpen(false);
              router.replace("/");
            })} />
          <AppButton label="Keep account" variant="ghost" disabled={accountBusy} onPress={() => setDeleteOpen(false)} />
        </View>
      </AppModal>
      <AppModal visible={notice !== null} onClose={() => setNotice(null)}>
        <AppText variant="cardTitle">{notice?.title}</AppText>
        <AppText variant="bodySmall" style={styles.modalBody}>{notice?.message}</AppText>
        <AppButton label="OK" variant="secondary" style={styles.modalBody} onPress={() => setNotice(null)} />
      </AppModal>
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#030810" },
  background: { ...StyleSheet.absoluteFill, width: "100%", height: "100%" },
  transparent: { backgroundColor: "transparent" },
  content: { maxWidth: 660 },
  header: { paddingHorizontal: 0 },
  headerTitle: { fontFamily: fonts.serif, fontSize: 30, lineHeight: 38, color: "#FFF2D9", flexShrink: 1 },
  headerTitlePhone: { fontSize: 22, lineHeight: 28 },
  sectionLabel: { marginBottom: 12, marginTop: 16 },
  account: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 14, padding: 18, backgroundColor: "rgba(3, 8, 15, 0.91)", borderColor: colors.border, borderWidth: 1, borderRadius: radius.card },
  avatar: { width: 48, height: 48, borderRadius: 24, borderWidth: 1, borderColor: "#554468", backgroundColor: "#110E1C", alignItems: "center", justifyContent: "center" },
  accountIdentity: { flexGrow: 1, flexShrink: 1, flexBasis: 120, minWidth: 0 },
  accountName: { fontFamily: fonts.serif, fontSize: 23, lineHeight: 28 },
  email: { marginTop: 4 },
  authButton: { minHeight: 44, paddingHorizontal: 18, borderWidth: 1, borderColor: colors.primary, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  authLabel: { fontFamily: fonts.serif, fontSize: 17, lineHeight: 22 },
  testRow: { flexDirection: "row", alignItems: "center", gap: 16, paddingVertical: 16, paddingHorizontal: 4, borderBottomWidth: 1, borderBottomColor: colors.borderSoft },
  flex: { flex: 1, minWidth: 0 },
  plan: { padding: 22, borderWidth: 1, borderColor: "#69616C", borderRadius: radius.card, overflow: "hidden", backgroundColor: "#060B13" },
  premiumPlan: { borderColor: colors.primaryBright },
  planArt: { width: "100%", height: "100%" },
  planHeading: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  planName: { fontFamily: fonts.serif, fontSize: 36, lineHeight: 43, color: "#F5EEDB" },
  planPrice: { fontFamily: fonts.serif, fontSize: 19, lineHeight: 26, marginTop: 3 },
  status: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 8, borderWidth: 1, borderColor: "#94909B", borderRadius: 12, marginTop: 4, flexShrink: 1 },
  activeStatus: { backgroundColor: "rgba(52, 65, 32, 0.75)", borderColor: "#B5D66C" },
  statusLabel: { fontFamily: fonts.serif, fontSize: 14, lineHeight: 19, flexShrink: 1 },
  features: { gap: 14, marginTop: 28, marginBottom: 24 },
  feature: { flexDirection: "row", alignItems: "center", gap: 16 },
  featureLabel: { fontSize: 17, lineHeight: 23, flex: 1 },
  renewal: { marginBottom: 16 },
  manageButton: { borderColor: colors.primary, borderRadius: 12, backgroundColor: "rgba(2, 5, 8, 0.8)" },
  upgrade: { width: "100%", aspectRatio: 3, minHeight: 70 },
  upgradeArt: { width: "100%", height: "100%" },
  dimmed: { opacity: 0.5 },
  errorRow: { marginTop: 16 },
  dataSection: { marginTop: 16 },
  dataActions: { gap: 12 },
  billingFooter: { gap: 8, paddingTop: 12 },
  legalLinks: { flexDirection: "row", justifyContent: "center", flexWrap: "wrap", gap: 24, paddingVertical: 8 },
  divider: { height: 1, backgroundColor: colors.borderSoft, marginTop: 26, marginBottom: 20 },
  deleteRow: { flexDirection: "row", alignItems: "center", gap: 16, padding: 20, borderWidth: 1, borderColor: "#B03332", borderRadius: radius.card, backgroundColor: "rgba(29, 5, 9, 0.86)" },
  deleteTitle: { color: "#FA5C54", fontFamily: fonts.serif, fontSize: 21, lineHeight: 27, marginBottom: 3 },
  modalBody: { marginTop: spacing.md },
  modalActions: { gap: 12, marginTop: 24 },
  destructiveButton: { borderColor: "#FA5C54" },
});
