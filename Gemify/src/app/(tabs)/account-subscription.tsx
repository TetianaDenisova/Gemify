import { useRouter } from "expo-router";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Linking, Platform, Pressable, StyleSheet, Switch, View } from "react-native";

import { useCloudSync } from "@/hooks/useCloudSync";
import { useRefreshOnSync } from "@/hooks/useRefreshOnSync";
import { useSubscription } from "@/hooks/useSubscription";
import { useHomePreferences } from "@/hooks/useHomePreferences";
import { exportBackup, getArchivedDreams, pickAndImportBackup, updateDream, type Dream } from "@/db";
import { notifySyncApplied } from "@/sync/events";
import { deleteAccount } from "@/sync/account";
import { signOut } from "@/sync";
import {
  AppButton, AppModal, AppText, ArchiveIcon, ArrowRightIcon, Card, CheckIcon,
  PlusIcon, TabScreenHeader, ScreenScaffold, SyncIcon, TrashIcon, UserIcon,
} from "@/shared/components";
import { PREMIUM_MONTHLY_PRICE, PRIVACY_URL, TERMS_URL } from "@/subscription/config";
import { colors } from "@/theme/colors";
import { fonts, radius, shadowStyle, spacing } from "@/theme/theme";

const BACKGROUND = require("../../../assets/subscription/subscription-bg.png");
const SECTIONS = ["subscription", "settings", "account"] as const;
type Section = (typeof SECTIONS)[number];
const PREMIUM_FEATURES = ["Unlimited Dreams", "Unlimited Habits", "Sync across devices", "Import & export data"];
const FREE_FEATURES = ["1 Active Dream", "1 Active Habit", "Local Device Storage"];

function ArchivedDreamsSection() {
  const [dreams, setDreams] = useState<Dream[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const [restoredTitle, setRestoredTitle] = useState<string | null>(null);
  const [restoringId, setRestoringId] = useState<number | null>(null);
  const restoring = useRef(false);

  const refresh = useCallback(async () => {
    try {
      setDreams(await getArchivedDreams());
      setLoadError(null);
    } catch (cause) {
      setLoadError(cause instanceof Error ? cause.message : "Failed to load archived dreams.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const task = setTimeout(() => { void refresh(); }, 0);
    return () => clearTimeout(task);
  }, [refresh]);
  useRefreshOnSync(refresh);

  async function restoreDream(dream: Dream) {
    if (restoring.current) return;
    restoring.current = true;
    setRestoringId(dream.id);
    setRestoreError(null);
    setRestoredTitle(null);
    try {
      const updated = await updateDream(dream.id, { isArchived: false, isCompleted: false });
      if (!updated) throw new Error("This dream is no longer available.");
      setDreams((current) => current.filter((item) => item.id !== dream.id));
      setRestoredTitle(dream.title);
    } catch (cause) {
      setRestoreError(cause instanceof Error ? cause.message : "Failed to restore the dream.");
    } finally {
      restoring.current = false;
      setRestoringId(null);
    }
  }

  return (
    <View style={styles.archiveSection}>
      <View style={styles.archiveHeading}>
        <View style={styles.archiveTitleRow}>
          <ArchiveIcon size={20} color={colors.primaryBright} />
          <AppText variant="eyebrow" color={colors.primaryBright}>Archived dreams</AppText>
        </View>
      </View>
      {loading ? <ActivityIndicator accessibilityLabel="Loading archived dreams" color={colors.primary} style={styles.archiveLoader} /> : null}
      {loadError ? (
        <View style={styles.archiveMessage}>
          <AppText accessibilityRole="alert" color={colors.danger} variant="bodySmall">{loadError}</AppText>
          <AppButton label="Try again" variant="secondary" onPress={() => void refresh()} />
        </View>
      ) : null}
      {restoreError ? <AppText accessibilityRole="alert" color={colors.danger} variant="bodySmall">{restoreError}</AppText> : null}
      {restoredTitle ? <AppText accessibilityRole="alert" color={colors.accentGreen} variant="bodySmall">{restoredTitle} restored.</AppText> : null}
      {!loading && !loadError && dreams.length === 0 ? (
        <Card style={styles.archiveEmpty}>
          <AppText variant="bodySmall" align="center">No archived dreams</AppText>
          <AppText variant="caption" align="center" color={colors.textSecondary}>
            Dreams you archive will appear here.
          </AppText>
        </Card>
      ) : null}
      <View style={styles.archiveList}>
        {dreams.map((dream) => (
          <Card key={dream.id} variant="strong" style={styles.archiveDream}>
            <AppText variant="cardTitle" numberOfLines={2} style={styles.archiveDreamTitle}>{dream.title}</AppText>
            <AppButton label={restoringId === dream.id ? "Restoring..." : "Restore"}
              accessibilityLabel={`Restore ${dream.title}`} icon={<SyncIcon size={18} />}
              density="compact" variant="secondary" disabled={restoringId !== null}
              onPress={() => void restoreDream(dream)} style={styles.archiveRestore} />
          </Card>
        ))}
      </View>
    </View>
  );
}

export default function AccountSubscriptionScreen() {
  const router = useRouter();
  const account = useCloudSync();
  const subscription = useSubscription();
  const homePreferences = useHomePreferences();
  const [activeSection, setActiveSection] = useState<Section>("subscription");
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

  const premiumAmount = subscription.price ?? PREMIUM_MONTHLY_PRICE;
  const renewal = subscription.expiresAt
    ? `${subscription.willRenew === false ? "Available until" : subscription.willRenew ? "Renews" : "Next billing date"} ${new Date(subscription.expiresAt).toLocaleDateString()}`
    : null;

  return (
    <>
      <ScreenScaffold topInset tabClearance contentStyle={styles.content}>
        <TabScreenHeader title="Account" />

        <View accessibilityRole="tablist" style={styles.sectionTabs}>
          {SECTIONS.map((section) => {
            const selected = activeSection === section;
            const label = section === "subscription" ? "Subscription" : section === "settings" ? "Settings" : "Account";
            return (
              <Pressable key={section} accessibilityRole="tab" accessibilityLabel={label}
                accessibilityState={{ selected }} onPress={() => setActiveSection(section)}
                style={({ pressed }) => [styles.sectionTab, selected && styles.sectionTabSelected, pressed && styles.tabPressed]}>
                <AppText numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.72}
                  style={styles.sectionTabLabel} color={selected ? colors.textOnPrimary : colors.textSecondary}>
                  {label}
                </AppText>
              </Pressable>
            );
          })}
        </View>

        {activeSection === "account" ? (
        <View style={styles.accountCard}>
          <View style={styles.account}>
            <View style={styles.avatar} accessible={false}>
              <UserIcon size={25} color={colors.primaryBright} strokeWidth={1.7} />
            </View>
            <View style={styles.flex}>
              <AppText color={colors.textSecondary} variant="caption">
                {account.signedIn ? "Signed in" : "Gemify account"}
              </AppText>
              <AppText selectable={account.ready && !!account.email} color={colors.textPrimary} style={styles.email}>
                {account.ready ? account.email ?? "Not signed in" : "Loading account..."}
              </AppText>
            </View>
          </View>
          <AppButton label={accountBusy ? "Please wait" : account.signedIn ? "Sign out" : "Sign in"}
            variant="secondary" disabled={busy || !account.ready}
            icon={accountBusy ? <ActivityIndicator color={colors.primaryBright} /> : undefined}
            onPress={() => account.signedIn ? void runAction(signOut) : router.push("/cloud-sync")}
            style={styles.authButton} textStyle={styles.authLabel} />
        </View>
        ) : null}

        {activeSection === "subscription" ? (
        <>
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

        <View style={styles.plans}>
          <View style={styles.freePlan}>
            <View style={styles.planHeading}>
              <AppText style={[styles.freePlanName, styles.planTitle]} numberOfLines={1}
                adjustsFontSizeToFit minimumFontScale={0.8}>Free Plan</AppText>
              {!subscription.ready || !subscription.premium ? (
                <View style={styles.currentBadge}>
                  <AppText style={styles.currentBadgeLabel} numberOfLines={1}>
                    {subscription.ready ? "Current Plan" : "Checking"}
                  </AppText>
                </View>
              ) : null}
            </View>
            <View style={styles.freeFeatures}>
              {FREE_FEATURES.map((feature) => (
                <View key={feature} style={styles.feature}>
                  <CheckIcon color={colors.textSecondary} size={18} />
                  <AppText style={styles.freeFeatureLabel}>{feature}</AppText>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.premiumPlan}>
            <Image source={BACKGROUND} contentFit="cover" contentPosition="top"
              style={StyleSheet.absoluteFill} accessible={false} />
            <LinearGradient colors={["rgba(2, 5, 12, 0.9)", "rgba(2, 5, 12, 0.62)", "rgba(2, 5, 12, 0.9)"]}
              locations={[0, 0.46, 1]} style={StyleSheet.absoluteFill} />
            <LinearGradient colors={["rgba(2, 5, 12, 0.18)", "rgba(2, 5, 12, 0.88)"]}
              start={{ x: 1, y: 0 }} end={{ x: 0, y: 0 }} style={StyleSheet.absoluteFill} />
            <View style={styles.premiumContent}>
              <View style={styles.planHeading}>
                <AppText style={[styles.premiumName, styles.planTitle]} numberOfLines={1}
                  adjustsFontSizeToFit minimumFontScale={0.75}>Premium</AppText>
                <View style={styles.premiumMeta}>
                  <View style={styles.premiumPriceRow}>
                    <AppText style={styles.premiumPriceAmount} numberOfLines={1}
                      adjustsFontSizeToFit minimumFontScale={0.75}>{premiumAmount}</AppText>
                    <AppText style={styles.premiumPriceCadence}>/month</AppText>
                  </View>
                  {subscription.premium ? (
                    <View style={styles.currentBadge}>
                      <AppText style={styles.currentBadgeLabel} numberOfLines={1}>Current Plan</AppText>
                    </View>
                  ) : null}
                </View>
              </View>
              <AppText style={styles.premiumSubtitle}>Your journey, without limits.</AppText>
              {subscription.premium && renewal ? (
                <AppText variant="caption" color="#D8CDB4" style={styles.renewal}>{renewal}</AppText>
              ) : null}
              <View style={styles.premiumFeatures}>
                {PREMIUM_FEATURES.map((feature) => (
                  <View key={feature} style={styles.feature}>
                    <CheckIcon color={colors.primaryBright} size={20} />
                    <AppText style={styles.premiumFeatureLabel}>{feature}</AppText>
                  </View>
                ))}
              </View>
              <View style={styles.planActions}>
                {!subscription.premium ? (
                  <Pressable accessibilityRole="button"
                    accessibilityLabel="Upgrade to Premium"
                    accessibilityState={{ disabled: busy || !subscription.ready, busy: subscription.busy }}
                    disabled={busy || !subscription.ready} onPress={() => void subscription.upgrade()}
                    style={({ pressed }) => [styles.upgrade, (pressed || busy || !subscription.ready) && styles.dimmed]}>
                    <LinearGradient colors={["#FFE89D", "#F9CD65", "#DFA849", "#B47C2A"]}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.upgradeFill}>
                      {subscription.busy && <ActivityIndicator color={colors.textOnPrimary} />}
                      <AppText style={styles.upgradeLabel}>Upgrade to Premium</AppText>
                    </LinearGradient>
                  </Pressable>
                ) : (
                  <AppButton label="Manage subscription" variant="secondary" icon={<ArrowRightIcon size={20} />}
                    disabled={busy} onPress={handleManage} style={styles.manageButton} />
                )}
              </View>
            </View>
          </View>
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
        </>
        ) : null}

        {activeSection === "settings" ? (
        <>
        <AppText variant="eyebrow" color={colors.primaryBright} style={styles.sectionLabel}>Home screen</AppText>
        <View style={styles.preferenceRow}>
          <View style={styles.flex}>
            <AppText color={colors.textPrimary} variant="bodySmall">Show milestone progress</AppText>
            <AppText color={colors.textSecondary} variant="caption" style={styles.preferenceDescription}>
              Display the active milestone and its progress bar on dream cards.
            </AppText>
          </View>
          <Switch
            accessibilityLabel="Show active milestone on Home"
            disabled={homePreferences.loading || homePreferences.saving}
            value={homePreferences.showActiveMilestone}
            onValueChange={(value) => void homePreferences.updateShowActiveMilestone(value)}
            trackColor={{ false: colors.secondary, true: colors.primary }}
            thumbColor={colors.textPrimary}
            ios_backgroundColor={colors.secondary}
          />
        </View>
        {homePreferences.error ? (
          <AppText accessibilityRole="alert" color={colors.danger} variant="caption">
            {homePreferences.error}
          </AppText>
        ) : null}

        <ArchivedDreamsSection />

        <View style={styles.dataSection}>
          <AppText variant="eyebrow" color={colors.primaryBright} style={styles.sectionLabel}>Data &amp; sync</AppText>
          <View style={styles.dataActions}>
            <AppButton label={subscription.premium ? "Sync across devices" : "Sync across devices · Premium"} icon={<SyncIcon size={20} />} variant="secondary" disabled={busy || !subscription.premium}
              onPress={() => router.push("/cloud-sync")} />
            <AppButton label={subscription.premium ? "Export backup" : "Export backup · Premium"} icon={<ArrowRightIcon size={20} />} variant="secondary" disabled={busy || !subscription.premium}
              onPress={() => void runAction(exportBackup)} />
            <AppButton label={subscription.premium ? "Import backup" : "Import backup · Premium"} icon={<PlusIcon size={20} />} variant="secondary" disabled={busy || !subscription.premium}
              onPress={() => setImportOpen(true)} />
          </View>
        </View>
        </>
        ) : null}

        {activeSection === "account" ? (
        <>
        {account.signedIn && (
          <>
            <AppText variant="eyebrow" color={colors.danger} style={styles.dangerLabel}>Danger zone</AppText>
            <Pressable accessibilityRole="button" accessibilityLabel="Delete account" disabled={busy}
              onPress={() => setDeleteOpen(true)} style={({ pressed }) => [styles.deleteRow, (pressed || busy) && styles.dimmed]}>
              <TrashIcon color="#FA5C54" size={28} />
              <View style={styles.flex}>
                <AppText style={styles.deleteTitle}>Delete account</AppText>
                <AppText variant="caption" color="#BFC0C7">Delete your account and all associated data</AppText>
              </View>
              <ArrowRightIcon color="#FA5C54" size={22} />
            </Pressable>
          </>
        )}
        </>
        ) : null}

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
  content: { flexGrow: 1, maxWidth: 660 },
  sectionTabs: { flexDirection: "row", gap: 4, marginBottom: 8, padding: 4, borderWidth: 1, borderColor: colors.borderSoft, borderRadius: radius.round, backgroundColor: colors.surfaceDeep },
  sectionTab: { flex: 1, minWidth: 0, minHeight: 42, alignItems: "center", justifyContent: "center", paddingHorizontal: 8, borderRadius: radius.round },
  sectionTabSelected: { backgroundColor: colors.primary, ...shadowStyle({ color: colors.primary, opacity: 0.28, radius: 8 }) },
  sectionTabLabel: { fontSize: 12, lineHeight: 16, fontWeight: "700", textAlign: "center" },
  tabPressed: { opacity: 0.78 },
  sectionLabel: { marginBottom: 12, marginTop: 16 },
  archiveSection: { gap: spacing.sm, marginTop: spacing.xl },
  archiveHeading: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  archiveTitleRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  archiveLoader: { marginVertical: spacing.md },
  archiveMessage: { gap: spacing.md, marginTop: spacing.sm },
  archiveEmpty: { alignItems: "center", gap: spacing.xs, marginTop: spacing.sm, paddingVertical: spacing.lg },
  archiveList: { gap: spacing.md, marginTop: spacing.sm },
  archiveDream: { minHeight: 88, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.md },
  archiveDreamTitle: { flex: 1, minWidth: 0 },
  archiveRestore: { flexShrink: 0, minHeight: 48, minWidth: 126, borderColor: colors.borderStrong, borderRadius: radius.round, backgroundColor: colors.surfaceDeep },
  preferenceRow: {
    alignItems: "center",
    borderColor: colors.borderSoft,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.md,
  },
  preferenceDescription: { marginTop: spacing.xs },
  accountCard: { gap: spacing.md, padding: spacing.md, borderWidth: 1, borderColor: colors.borderSoft, borderRadius: radius.card, backgroundColor: colors.surfaceDeep },
  account: { flexDirection: "row", alignItems: "center", gap: 14 },
  avatar: { width: 48, height: 48, flexShrink: 0, borderRadius: 24, borderWidth: 1, borderColor: colors.border, backgroundColor: "rgba(245, 184, 75, 0.08)", alignItems: "center", justifyContent: "center" },
  email: { flex: 1, minWidth: 0, fontSize: 16, lineHeight: 24 },
  authButton: { minHeight: 52, borderColor: colors.border, borderRadius: 12, backgroundColor: "rgba(245, 184, 75, 0.04)" },
  authLabel: { fontSize: 16, lineHeight: 22, textAlign: "center" },
  testRow: { flexDirection: "row", alignItems: "center", gap: 16, paddingVertical: 16, paddingHorizontal: 4, marginBottom: 16, borderBottomWidth: 1, borderBottomColor: colors.borderSoft },
  flex: { flex: 1, minWidth: 0 },
  plans: { gap: spacing.lg },
  freePlan: { padding: spacing.lg, borderWidth: 1, borderColor: colors.borderSoft, borderRadius: radius.card, backgroundColor: colors.surfaceDeep },
  premiumPlan: { overflow: "hidden", borderWidth: 1, borderColor: colors.borderStrong, borderRadius: radius.card, backgroundColor: "#03070E", ...shadowStyle({ color: colors.primary, opacity: 0.24, radius: 14 }) },
  premiumContent: { padding: spacing.lg },
  planHeading: { flexDirection: "row", alignItems: "center", gap: 10 },
  planTitle: { flexGrow: 1, flexShrink: 1, flexBasis: 130, minWidth: 0 },
  freePlanName: { fontFamily: fonts.serif, fontSize: 24, lineHeight: 30, color: colors.textPrimary },
  premiumName: { fontFamily: fonts.serif, fontSize: 36, lineHeight: 43, color: "#FFF2D0" },
  currentBadge: { flexShrink: 1, paddingHorizontal: 11, paddingVertical: 5, borderWidth: 1, borderColor: colors.border, borderRadius: radius.round, backgroundColor: "rgba(245, 184, 75, 0.09)" },
  currentBadgeLabel: { color: colors.primaryBright, fontSize: 11, lineHeight: 15, fontWeight: "700", textTransform: "uppercase" },
  premiumSubtitle: { marginTop: 4, color: "#F1E8D5", fontSize: 16, lineHeight: 23 },
  premiumMeta: { flexShrink: 1, alignItems: "flex-end", gap: 6 },
  premiumPriceRow: { flexDirection: "row", alignItems: "baseline", gap: 4 },
  premiumPriceAmount: { fontFamily: fonts.serif, fontSize: 32, lineHeight: 38, color: colors.primaryBright },
  premiumPriceCadence: { color: "#D8CDB4", fontSize: 14, lineHeight: 20 },
  renewal: { marginTop: 4 },
  freeFeatures: { gap: 10, marginTop: spacing.md },
  feature: { flexDirection: "row", alignItems: "center", gap: 14 },
  freeFeatureLabel: { flex: 1, color: "#D8CDB4", fontSize: 15, lineHeight: 22 },
  premiumFeatureLabel: { flex: 1, color: "#F7F0E2", fontSize: 16, lineHeight: 23 },
  premiumFeatures: { gap: 12, marginTop: spacing.lg },
  planActions: { gap: 12, marginTop: spacing.xl },
  manageButton: { borderColor: colors.primary, borderRadius: 12, backgroundColor: "rgba(2, 5, 8, 0.8)" },
  upgrade: { width: "100%", padding: 3, borderWidth: 1, borderColor: colors.primary, borderRadius: radius.round, backgroundColor: "#6D4B1C", ...shadowStyle({ color: colors.primary, opacity: 0.28, radius: 10 }) },
  upgradeFill: { minHeight: 56, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingHorizontal: 16, paddingVertical: 10, borderWidth: 1, borderColor: "#FFF0B0", borderRadius: radius.round },
  upgradeLabel: { flexShrink: 1, fontFamily: fonts.serif, fontSize: 23, lineHeight: 30, color: colors.textOnPrimary, textAlign: "center" },
  dimmed: { opacity: 0.5 },
  errorRow: { marginTop: 16 },
  dataSection: { marginTop: 16 },
  dataActions: { gap: 12 },
  billingFooter: { gap: 8, paddingTop: 12, paddingBottom: spacing.sm },
  legalLinks: { flexDirection: "row", justifyContent: "center", flexWrap: "wrap", gap: 24, paddingVertical: 8 },
  dangerLabel: { marginBottom: 12, marginTop: "auto", paddingTop: 28 },
  deleteRow: { flexDirection: "row", alignItems: "center", gap: 16, padding: 20, borderWidth: 1, borderColor: "#B03332", borderRadius: radius.card, backgroundColor: "rgba(29, 5, 9, 0.86)" },
  deleteTitle: { color: "#FA5C54", fontFamily: fonts.serif, fontSize: 21, lineHeight: 27, marginBottom: 3 },
  modalBody: { marginTop: spacing.md },
  modalActions: { gap: 12, marginTop: 24 },
  destructiveButton: { borderColor: "#FA5C54" },
});
