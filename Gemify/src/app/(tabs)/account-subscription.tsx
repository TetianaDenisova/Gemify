import { useRouter } from "expo-router";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import { ActivityIndicator, Linking, Platform, Pressable, StyleSheet, Switch, View } from "react-native";

import { useCloudSync } from "@/hooks/useCloudSync";
import { useSubscription } from "@/hooks/useSubscription";
import { exportBackup, pickAndImportBackup } from "@/db";
import { notifySyncApplied } from "@/sync/events";
import { deleteAccount } from "@/sync/account";
import { signOut } from "@/sync";
import {
  AppButton, AppModal, AppText, ArrowRightIcon, CheckIcon, CloseIcon,
  DreamIcon, PlusIcon, TabScreenHeader, ScreenScaffold, SyncIcon, TrashIcon,
} from "@/shared/components";
import { PREMIUM_MONTHLY_PRICE, PRIVACY_URL, TERMS_URL } from "@/subscription/config";
import { colors } from "@/theme/colors";
import { fonts, radius, shadowStyle, spacing } from "@/theme/theme";

const BACKGROUND = require("../../../subscription-bg.png");
const PLANS = [
  { value: "premium", label: "Premium" },
  { value: "standard", label: "Standard" },
] as const;
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
  const account = useCloudSync();
  const subscription = useSubscription();
  const [selectedPlan, setSelectedPlan] = useState<"premium" | "standard">("premium");
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
  const showingPremium = selectedPlan === "premium";
  const isCurrentPlan = showingPremium === subscription.premium;
  const features = showingPremium
    ? PREMIUM_FEATURES.map((label) => ({ label, available: true }))
    : BASIC_FEATURES;
  const premiumPrice = `${subscription.price ?? PREMIUM_MONTHLY_PRICE}/month`;
  const renewal = subscription.expiresAt
    ? `${subscription.willRenew === false ? "Available until" : subscription.willRenew ? "Renews" : "Next billing date"} ${new Date(subscription.expiresAt).toLocaleDateString()}`
    : null;

  return (
    <>
      <ScreenScaffold topInset tabClearance contentStyle={styles.content}>
        <TabScreenHeader title="Account" />
        <AppText variant="eyebrow" color={colors.primaryBright} style={styles.sectionLabel}>Subscription</AppText>
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

        <View accessibilityRole="tablist" style={styles.planSwitcher}>
          {PLANS.map((plan) => {
            const selected = selectedPlan === plan.value;
            return (
              <Pressable key={plan.value} accessibilityRole="tab" accessibilityLabel={plan.label}
                accessibilityState={{ selected }} onPress={() => setSelectedPlan(plan.value)}
                style={({ pressed }) => [styles.planTab, selected && styles.selectedPlanTab, pressed && styles.tabPressed]}>
                {selected && <LinearGradient colors={["rgba(245, 184, 75, 0.24)", "rgba(245, 184, 75, 0.07)", "rgba(245, 184, 75, 0.2)"]}
                  style={[StyleSheet.absoluteFill, styles.planTabFill]} />}
                <AppText style={styles.planTabLabel} color={selected ? colors.primaryBright : colors.textSecondary}>{plan.label}</AppText>
              </Pressable>
            );
          })}
        </View>

        <View style={[styles.plan, showingPremium && styles.premiumPlan]}>
          <Image source={BACKGROUND} contentFit="cover" contentPosition={showingPremium ? "top" : "center"}
            style={StyleSheet.absoluteFill} accessible={false} />
          <LinearGradient colors={["rgba(3, 7, 12, 0.64)", "rgba(3, 7, 12, 0.12)"]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
          <LinearGradient colors={["rgba(3, 7, 12, 0.08)", "rgba(3, 7, 12, 0.76)"]} style={StyleSheet.absoluteFill} />
          <View style={[styles.planHeading, showingPremium && styles.premiumHeading]}>
            <AppText style={[styles.planName, styles.planTitle]} numberOfLines={showingPremium ? 1 : undefined}
              adjustsFontSizeToFit={showingPremium} minimumFontScale={0.7}>
              {showingPremium ? "Premium" : "Basic"}
            </AppText>
            {showingPremium && (
              <View style={styles.priceBadge}>
                <AppText style={styles.priceBadgeLabel} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>{premiumPrice}</AppText>
              </View>
            )}
            {!showingPremium && (!subscription.ready || isCurrentPlan) && (
              <View style={styles.status}>
                <AppText style={styles.statusLabel} color={colors.primaryBright}>
                  {!subscription.ready ? "Checking..." : "Current plan"}
                </AppText>
              </View>
            )}
          </View>
          <AppText style={styles.planPrice}>{showingPremium ? "Monthly subscription" : "Free"}</AppText>
          <View style={[styles.features, showingPremium && styles.premiumFeatures]}>
            {features.map((feature) => (
              <View key={feature.label} style={styles.feature}>
                {feature.available ? <CheckIcon color={colors.primaryBright} size={21} /> : <CloseIcon color="#96958E" size={21} />}
                <AppText style={styles.featureLabel} color={feature.available ? "#EEECE5" : "#AAA69C"}>{feature.label}</AppText>
              </View>
            ))}
          </View>
        </View>

        {(subscription.premium || showingPremium) && <View style={styles.planActions}>
          {showingPremium && (
            <Pressable accessibilityRole="button"
              accessibilityLabel={subscription.premium ? "Current plan" : "Upgrade to Premium"}
              accessibilityState={{ disabled: subscription.premium || busy || !subscription.ready, busy: !subscription.premium && subscription.busy }}
              disabled={subscription.premium || busy || !subscription.ready} onPress={() => void subscription.upgrade()}
              style={({ pressed }) => [styles.upgrade, !subscription.premium && (pressed || busy || !subscription.ready) && styles.dimmed]}>
              <LinearGradient colors={["#FFE89D", "#F9CD65", "#DFA849", "#B47C2A"]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.upgradeFill}>
                {!subscription.premium && subscription.busy && <ActivityIndicator color={colors.textOnPrimary} />}
                <AppText style={styles.upgradeLabel}>
                  {subscription.premium ? "Current plan" : "Upgrade to Premium"}
                </AppText>
              </LinearGradient>
            </Pressable>
          )}
          {subscription.premium && renewal && <AppText variant="caption" color={colors.textSecondary}>{renewal}</AppText>}
          {subscription.premium && (
            <AppButton label="Manage subscription" variant="secondary" icon={<ArrowRightIcon size={20} />}
              disabled={busy} onPress={handleManage} style={styles.manageButton} />
          )}
        </View>}

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
  content: { maxWidth: 660 },
  sectionLabel: { marginBottom: 12, marginTop: 16 },
  account: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 14, padding: 18, backgroundColor: "rgba(3, 8, 15, 0.91)", borderColor: colors.border, borderWidth: 1, borderRadius: radius.card },
  avatar: { width: 48, height: 48, borderRadius: 24, borderWidth: 1, borderColor: "#554468", backgroundColor: "#110E1C", alignItems: "center", justifyContent: "center" },
  accountIdentity: { flexGrow: 1, flexShrink: 1, flexBasis: 120, minWidth: 0 },
  accountName: { fontFamily: fonts.serif, fontSize: 23, lineHeight: 28 },
  email: { marginTop: 4 },
  authButton: { minHeight: 44, paddingHorizontal: 18, borderWidth: 1, borderColor: colors.primary, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  authLabel: { fontFamily: fonts.serif, fontSize: 17, lineHeight: 22 },
  testRow: { flexDirection: "row", alignItems: "center", gap: 16, paddingVertical: 16, paddingHorizontal: 4, marginBottom: 16, borderBottomWidth: 1, borderBottomColor: colors.borderSoft },
  flex: { flex: 1, minWidth: 0 },
  planSwitcher: { flexDirection: "row", borderWidth: 1, borderColor: "#A77C35", borderRadius: radius.round, backgroundColor: "rgba(3, 7, 12, 0.9)", marginBottom: 14 },
  planTab: { flex: 1, minWidth: 0, minHeight: 44, paddingHorizontal: 12, paddingVertical: 10, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "transparent", borderRadius: radius.round },
  selectedPlanTab: { borderColor: colors.primary, ...shadowStyle({ color: colors.primary, opacity: 0.3, radius: 10 }) },
  planTabFill: { borderRadius: radius.round },
  planTabLabel: { fontSize: 13, lineHeight: 20, fontWeight: "600", textTransform: "uppercase", textAlign: "center" },
  tabPressed: { opacity: 0.8 },
  plan: { minHeight: 296, padding: 24, borderWidth: 1, borderColor: "#A77C35", borderRadius: 16, overflow: "hidden", backgroundColor: "#060B13" },
  premiumPlan: { minHeight: 300, borderColor: colors.primary, paddingTop: 12 },
  priceBadge: { maxWidth: "50%", flexShrink: 1, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: colors.primary, borderRadius: radius.round, backgroundColor: "rgba(81, 55, 17, 0.75)", ...shadowStyle({ color: colors.primary, opacity: 0.3, radius: 8 }) },
  priceBadgeLabel: { fontFamily: fonts.serif, fontSize: 17, lineHeight: 22, color: colors.primaryBright },
  planHeading: { flexDirection: "row", flexWrap: "wrap", alignItems: "flex-start", gap: 10 },
  premiumHeading: { flexWrap: "nowrap", alignItems: "center" },
  planTitle: { flexGrow: 1, flexShrink: 1, flexBasis: 130, minWidth: 0 },
  planName: { fontFamily: fonts.serif, fontSize: 36, lineHeight: 43, color: "#F5EEDB" },
  planPrice: { fontFamily: fonts.serif, fontSize: 20, lineHeight: 26, color: colors.textPrimary },
  status: { paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: colors.primary, borderRadius: 10, marginTop: 3, maxWidth: "100%", backgroundColor: "rgba(81, 55, 17, 0.65)" },
  statusLabel: { fontFamily: fonts.serif, fontSize: 16, lineHeight: 21 },
  features: { gap: 9, marginTop: 22 },
  premiumFeatures: { gap: 12, marginTop: 24 },
  feature: { flexDirection: "row", alignItems: "center", gap: 14 },
  featureLabel: { fontSize: 16, lineHeight: 22, flex: 1 },
  planActions: { gap: 12, marginTop: 18 },
  manageButton: { borderColor: colors.primary, borderRadius: 12, backgroundColor: "rgba(2, 5, 8, 0.8)" },
  upgrade: { width: "100%", padding: 3, borderWidth: 1, borderColor: colors.primary, borderRadius: radius.round, backgroundColor: "#6D4B1C", ...shadowStyle({ color: colors.primary, opacity: 0.45, radius: 14 }) },
  upgradeFill: { minHeight: 56, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingHorizontal: 16, paddingVertical: 10, borderWidth: 1, borderColor: "#FFF0B0", borderRadius: radius.round },
  upgradeLabel: { flexShrink: 1, fontFamily: fonts.serif, fontSize: 23, lineHeight: 30, color: colors.textOnPrimary, textAlign: "center" },
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
