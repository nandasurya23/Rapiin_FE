import { PLAN_DEFINITIONS, TRIAL_WARNING_DAYS } from "@/lib/constants/subscription";
import type { BusinessSubscription, PlanCode, SubscriptionStatus, BusinessUsage } from "@/types/subscription";
import type { Order } from "@/types/order";

export function getPlanDefinition(planCode: PlanCode) {
  return PLAN_DEFINITIONS.find((plan) => plan.code === planCode) ?? PLAN_DEFINITIONS[0];
}

export function getSubscriptionForBusiness(subscriptions: BusinessSubscription[] | undefined | null, businessId: string) {
  if (!Array.isArray(subscriptions)) {
    return null;
  }
  return subscriptions.find((subscription) => subscription.businessId === businessId) ?? subscriptions[0] ?? null;
}

export function getSubscriptionStatus(
  subscription: BusinessSubscription | null,
  businessUsage?: BusinessUsage
): SubscriptionStatus | null {
  if (businessUsage) return businessUsage.subscription.status;
  if (!subscription) return null;
  if (subscription.status === "ACTIVE" || subscription.status === "SUSPENDED" || subscription.status === "PENDING_UPGRADE_APPROVAL") {
    return subscription.status;
  }
  if (new Date(subscription.expiresAt).getTime() < Date.now()) {
    return "TRIAL_EXPIRED";
  }
  return "TRIAL_ACTIVE";
}

export function getDaysUntilExpiry(
  subscription: BusinessSubscription | null,
  businessUsage?: BusinessUsage
) {
  const expiresAt = businessUsage?.subscription.expiresAt || subscription?.expiresAt;
  if (!expiresAt) return null;

  const diff = new Date(expiresAt).getTime() - Date.now();
  return Math.ceil(diff / (24 * 60 * 60 * 1000));
}

export function isTrialWarningActive(
  subscription: BusinessSubscription | null,
  businessUsage?: BusinessUsage
) {
  const days = getDaysUntilExpiry(subscription, businessUsage);
  if (days === null) {
    return false;
  }

  return days >= 0 && days <= TRIAL_WARNING_DAYS;
}

export function canAccessWriteMode(
  subscription: BusinessSubscription | null,
  businessUsage?: BusinessUsage
) {
  if (businessUsage) return !businessUsage.permissions.isReadOnly;

  const status = getSubscriptionStatus(subscription, businessUsage);
  if (!status) return false;

  return status === "TRIAL_ACTIVE" || status === "ACTIVE";
}

export function canCreateCustomer(state: { businessUsage?: BusinessUsage; business: { id: string }; subscriptions: BusinessSubscription[]; customers: unknown[] }) {
  if (state.businessUsage) return state.businessUsage.limits.customers.canAdd;
  
  const sub = getSubscriptionForBusiness(state.subscriptions, state.business.id);
  const limit = sub?.customerLimit ?? 25;
  return (state.customers?.length || 0) < limit;
}

export function canCreateOrder(state: { businessUsage?: BusinessUsage; business: { id: string }; subscriptions: BusinessSubscription[]; orders: Order[] }) {
  if (state.businessUsage) return state.businessUsage.permissions.canCreateOrder;
  
  const status = getSubscriptionStatus(getSubscriptionForBusiness(state.subscriptions, state.business.id));
  return status === "ACTIVE" || status === "TRIAL_ACTIVE";
}

export function getOrderUsage(state: { businessUsage?: BusinessUsage; business: { id: string }; subscriptions: BusinessSubscription[]; orders: Order[] }) {
  if (state.businessUsage) {
    return { used: state.orders?.length || 0, limit: 99999, remaining: 99999, expiresAt: state.businessUsage.subscription.expiresAt };
  }
  return { used: 0, limit: 99999, remaining: 99999, expiresAt: "" };
}

export function canCreateInvoice(state: { businessUsage?: BusinessUsage; business: { id: string }; subscriptions: BusinessSubscription[] }) {
  if (state.businessUsage) return !state.businessUsage.permissions.isReadOnly;
  
  return canAccessWriteMode(getSubscriptionForBusiness(state.subscriptions, state.business.id));
}

export function getCustomerUsage(state: { businessUsage?: BusinessUsage; business: { id: string }; subscriptions: BusinessSubscription[]; customers: unknown[] }) {
  if (state.businessUsage) {
    const limits = state.businessUsage.limits.customers;
    return {
      used: limits.used,
      limit: limits.limit,
      remaining: Math.max(limits.limit - limits.used, 0),
    };
  }
  
  const sub = getSubscriptionForBusiness(state.subscriptions, state.business.id);
  const limit = sub?.customerLimit ?? 25;
  const used = state.customers?.length || 0;
  return { used, limit, remaining: Math.max(limit - used, 0) };
}

export function getReadOnlyReason(
  subscription: BusinessSubscription | null,
  businessUsage?: BusinessUsage
) {
  if (businessUsage && businessUsage.permissions.isReadOnly) {
    return businessUsage.permissions.readOnlyReason;
  }
  const status = getSubscriptionStatus(subscription, businessUsage);

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
