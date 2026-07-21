
import { PLAN_DEFINITIONS, TRIAL_WARNING_DAYS } from "@/lib/constants/subscription";
import type { BusinessSubscription, PlanCode, SubscriptionStatus } from "@/types/subscription";
import type { Order } from "@/types/order";

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

export function canCreateCustomer(state: { business: { id: string }; subscriptions: BusinessSubscription[]; customers: unknown[] }) {
  const subscription = getSubscriptionForBusiness(state.subscriptions, state.business.id);
  if (!canAccessWriteMode(subscription)) {
    return false;
  }
  return state.customers.length < (subscription?.customerLimit ?? 0);
}

export function canCreateOrder(state: { business: { id: string }; subscriptions: BusinessSubscription[]; orders: Order[] }) {
  const subscription = getSubscriptionForBusiness(state.subscriptions, state.business.id);
  return canAccessWriteMode(subscription);
}

export function getOrderUsage(state: { business: { id: string }; subscriptions: BusinessSubscription[]; orders: Order[] }) {
  const subscription = getSubscriptionForBusiness(state.subscriptions, state.business.id);
  if (!subscription) {
    return { used: 0, limit: 0, remaining: 0, expiresAt: "" };
  }

  const startedTime = new Date(subscription.startedAt).getTime();
  const expiresTime = new Date(subscription.expiresAt).getTime();

  const cycleOrders = (state.orders || []).filter((order) => {
    if (order.status === "BATAL" || order.paymentStatus === "CANCELLED") {
      return false;
    }
    const orderCreatedTime = new Date(order.createdAt).getTime();
    return orderCreatedTime >= startedTime && orderCreatedTime <= expiresTime;
  });

  const limit = subscription.customerLimit;
  const used = cycleOrders.length;

  return {
    used,
    limit,
    remaining: Math.max(limit - used, 0),
    expiresAt: subscription.expiresAt,
  };
}

export function canCreateInvoice(state: { business: { id: string }; subscriptions: BusinessSubscription[] }) {
  const subscription = getSubscriptionForBusiness(state.subscriptions, state.business.id);
  return canAccessWriteMode(subscription);
}

export function getCustomerUsage(state: { business: { id: string }; subscriptions: BusinessSubscription[]; customers: unknown[] }) {
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
