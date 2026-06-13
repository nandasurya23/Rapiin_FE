import { PLAN_DEFINITIONS, TRIAL_WARNING_DAYS } from "@/lib/constants/subscription";
import type { AppStorageState } from "@/types/app-state";
import type { BusinessSubscription, PlanCode, SubscriptionStatus } from "@/types/subscription";

export function getPlanDefinition(planCode: PlanCode) {
  return PLAN_DEFINITIONS.find((plan) => plan.code === planCode) ?? PLAN_DEFINITIONS[0];
}

export function getSubscriptionForBusiness(subscriptions: BusinessSubscription[], businessId: string) {
  return subscriptions.find((subscription) => subscription.businessId === businessId) ?? subscriptions[0] ?? null;
}

export function getSubscriptionStatus(subscription: BusinessSubscription | null): SubscriptionStatus | null {
  if (!subscription) {
    return null;
  }

  if (subscription.status === "ACTIVE" || subscription.status === "SUSPENDED" || subscription.status === "PENDING_UPGRADE_APPROVAL") {
    return subscription.status;
  }

  if (new Date(subscription.expiresAt).getTime() < Date.now()) {
    return "TRIAL_EXPIRED";
  }

  return "TRIAL_ACTIVE";
}

export function getDaysUntilExpiry(subscription: BusinessSubscription | null) {
  if (!subscription) {
    return null;
  }

  const diff = new Date(subscription.expiresAt).getTime() - Date.now();
  return Math.ceil(diff / (24 * 60 * 60 * 1000));
}

export function isTrialWarningActive(subscription: BusinessSubscription | null) {
  const days = getDaysUntilExpiry(subscription);
  if (days === null) {
    return false;
  }

  return days >= 0 && days <= TRIAL_WARNING_DAYS;
}

export function canAccessWriteMode(subscription: BusinessSubscription | null) {
  const status = getSubscriptionStatus(subscription);

  if (!status) {
    return false;
  }

  return status === "TRIAL_ACTIVE" || status === "ACTIVE";
}

export function canCreateCustomer(state: Pick<AppStorageState, "business" | "customers" | "subscriptions">) {
  const subscription = getSubscriptionForBusiness(state.subscriptions, state.business.id);
  if (!canAccessWriteMode(subscription)) {
    return false;
  }

  return state.customers.length < (subscription?.customerLimit ?? 0);
}

export function canCreateOrder(state: Pick<AppStorageState, "business" | "subscriptions">) {
  const subscription = getSubscriptionForBusiness(state.subscriptions, state.business.id);
  return canAccessWriteMode(subscription);
}

export function canCreateInvoice(state: Pick<AppStorageState, "business" | "subscriptions">) {
  const subscription = getSubscriptionForBusiness(state.subscriptions, state.business.id);
  return canAccessWriteMode(subscription);
}

export function getCustomerUsage(state: Pick<AppStorageState, "business" | "customers" | "subscriptions">) {
  const subscription = getSubscriptionForBusiness(state.subscriptions, state.business.id);
  return {
    used: state.customers.length,
    limit: subscription?.customerLimit ?? 0,
    remaining: Math.max((subscription?.customerLimit ?? 0) - state.customers.length, 0),
  };
}

export function getReadOnlyReason(subscription: BusinessSubscription | null) {
  const status = getSubscriptionStatus(subscription);

  if (status === "TRIAL_EXPIRED") {
    return "Masa coba selesai. Upgrade untuk lanjut tambah customer dan order baru.";
  }

  if (status === "SUSPENDED") {
    return subscription?.readOnlyReason || "Akun sedang disuspend sementara oleh super admin.";
  }

  if (status === "PENDING_UPGRADE_APPROVAL" && new Date(subscription?.expiresAt ?? "").getTime() < Date.now()) {
    return "Permintaan upgrade sedang ditinjau. Sementara app tetap mode baca saja.";
  }

  return null;
}
