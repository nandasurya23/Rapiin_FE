"use client";

import { PLAN_DEFINITIONS, PRO_CUSTOMER_LIMIT, TRIAL_CUSTOMER_LIMIT, TRIAL_DURATION_DAYS } from "@/lib/constants/subscription";
import { buildInvoiceIntegritySeal, buildInvoiceVerificationCode, normalizeInvoiceVerification } from "@/lib/invoice";
import { createBusinessResources, doesOperationalModelUseResources, getDefaultBusinessConfigForMode, getDefaultOperationalModel } from "@/lib/constants/business";
import type { AppStorageState, AuthUser, PublicSubmission } from "@/types/app-state";
import type { Business, BusinessMode, OperationalModel } from "@/types/business";
import type { Customer, CustomerStatus } from "@/types/customer";
import type { Invoice } from "@/types/invoice";
import type { MessageTemplate } from "@/types/message";
import type { Order, OrderStatus, PaymentStatus } from "@/types/order";
import type {
  BackupRecord,
  BackupType,
  BusinessSubscription,
  PlanCode,
  SuperAdminActionLog,
  SubscriptionStatus,
  UpgradeRequest,
  UpgradeRequestStatus,
  UserRole,
} from "@/types/subscription";

const STORAGE_KEY = "rapiin-app-storage";

function now() {
  return new Date().toISOString();
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function buildId(prefix: string) {
  const randomPart =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);

  return `${prefix}_${randomPart}`;
}

function addDays(dateValue: string, days: number) {
  const nextDate = new Date(dateValue);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate.toISOString();
}


// eslint-disable-next-line @typescript-eslint/no-unused-vars
function normalizeBusinessConfig(business: Business): Business {
  const modeConfig = getDefaultBusinessConfigForMode(business.mode);
  const operationalModel = business.operationalModel ?? getDefaultOperationalModel(business.mode);
  const usesResources = typeof business.usesResources === "boolean" ? business.usesResources : doesOperationalModelUseResources(operationalModel);
  const resourceLabel = usesResources ? business.resourceLabel?.trim() || modeConfig.resourceLabel || "Slot" : undefined;
  const resourceCount =
    usesResources ? Math.max(1, business.resourceCount ?? business.resources?.length ?? modeConfig.resourceCount ?? 1) : undefined;
  const resources =
    usesResources
      ? (business.resources?.length ? business.resources : createBusinessResources(resourceLabel ?? "Slot", resourceCount ?? 1)).map((resource, index) => ({
          id: resource.id || `res_${index + 1}`,
          name: resource.name?.trim() || `${resourceLabel} ${index + 1}`,
          isActive: resource.isActive ?? true,
        }))
      : [];

  return {
    ...business,
    operationalModel,
    usesResources,
    resourceLabel,
    resourceCount: usesResources ? resourceCount : undefined,
    resources,
    defaultBookingDurationMinutes:
      business.defaultBookingDurationMinutes ?? modeConfig.defaultBookingDurationMinutes,
  };
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function normalizeInvoices(invoices: Invoice[]) {
  return invoices.map((invoice) => normalizeInvoiceVerification(invoice));
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function normalizeAuthUsers(users: AppStorageState["auth"]["users"] | unknown, businessId: string) {
  if (!Array.isArray(users)) {
    return [];
  }

  const normalizedUsers: AuthUser[] = users.map((user) => {
    const legacyUser = user as Partial<AuthUser> & { identifier?: string };
    const identifier = legacyUser.identifier?.trim() ?? "";
    const email = legacyUser.email?.trim().toLowerCase() ?? (identifier.includes("@") ? identifier.toLowerCase() : "");
    const phoneNumber = legacyUser.phoneNumber?.trim() ?? (!identifier.includes("@") ? identifier : "");

    return {
      id: legacyUser.id || buildId("usr"),
      name: legacyUser.name?.trim() || "Owner",
      email,
      phoneNumber,
      role: legacyUser.role ?? "OWNER",
      businessId: legacyUser.role === "SUPER_ADMIN" ? undefined : legacyUser.businessId ?? businessId,
      trialUsed: typeof legacyUser.trialUsed === "boolean" ? legacyUser.trialUsed : true,
      isActive: typeof legacyUser.isActive === "boolean" ? legacyUser.isActive : true,
      createdAt: legacyUser.createdAt ?? now(),
      updatedAt: legacyUser.updatedAt ?? legacyUser.createdAt ?? now(),
    } satisfies AuthUser;
  });

  return normalizedUsers;
}

function resolveSubscriptionStatus(status: SubscriptionStatus, planCode: PlanCode, expiresAt: string) {
  if (status === "ACTIVE" || status === "SUSPENDED" || status === "PENDING_UPGRADE_APPROVAL") {
    return status;
  }

  if (planCode === "FREE_TRIAL" && new Date(expiresAt).getTime() < Date.now()) {
    return "TRIAL_EXPIRED";
  }

  return "TRIAL_ACTIVE";
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function normalizeSubscriptions(subscriptions: BusinessSubscription[] | unknown, business: Business) {
  if (!Array.isArray(subscriptions) || subscriptions.length === 0) {
    return [createBusinessSubscriptionRecord({ businessId: business.id, planCode: "FREE_TRIAL", startedAt: now() })];
  }

  return subscriptions.map((subscription) => {
    const item = subscription as Partial<BusinessSubscription>;
    const startedAt = item.startedAt ?? business.createdAt;
    const planCode = item.planCode ?? "FREE_TRIAL";
    const expiresAt =
      item.expiresAt ??
      (planCode === "FREE_TRIAL" ? addDays(startedAt, TRIAL_DURATION_DAYS) : addDays(startedAt, 30));

    return {
      id: item.id || buildId("sub"),
      businessId: item.businessId || business.id,
      planCode,
      status: resolveSubscriptionStatus(item.status ?? "TRIAL_ACTIVE", planCode, expiresAt),
      startedAt,
      expiresAt,
      customerLimit: item.customerLimit ?? (planCode === "FREE_TRIAL" ? TRIAL_CUSTOMER_LIMIT : planCode === "PRO" ? PRO_CUSTOMER_LIMIT : 10000),
      hasCompletedRequiredBackup: item.hasCompletedRequiredBackup ?? false,
      lastBackupAt: item.lastBackupAt,
      readOnlyReason: item.readOnlyReason,
      createdAt: item.createdAt ?? startedAt,
      updatedAt: item.updatedAt ?? item.createdAt ?? startedAt,
    } satisfies BusinessSubscription;
  });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function normalizeBackupRecords(backupRecords: BackupRecord[] | unknown) {
  if (!Array.isArray(backupRecords)) {
    return [];
  }

  return backupRecords.map((record) => ({
    ...record,
    payload: typeof record.payload === "string" ? record.payload : JSON.stringify(record.payload ?? {}),
  }));
}

const emptyBusiness: Business = {
  id: "biz_default",
  ownerName: "",
  name: "",
  slug: "",
  whatsappNumber: "",
  mode: "BOOKING_SERVICE",
  operationalModel: "RESOURCE_BOOKING",
  usesResources: true,
  resourceLabel: "Staf",
  resourceCount: 0,
  resources: [],
  defaultBookingDurationMinutes: 60,
  niche: "LAINNYA",
  description: "",
  address: "",
  openingHours: "09:00 - 17:00",
  logoUrl: undefined,
  createdAt: now(),
  updatedAt: now(),
};

export function createInitialAppStorageState(): AppStorageState {
  const business = clone(emptyBusiness);
  return {
    version: 1,
    business,
    subscriptions: [createBusinessSubscriptionRecord({ businessId: business.id, planCode: "FREE_TRIAL", startedAt: now() })],
    upgradeRequests: [],
    backupRecords: [],
    superAdminLogs: [],
    auth: {
      currentUserId: null,
      onboardingCompleted: false,
      users: [],
    },
    system: {
      superAdminUserIds: [],
      planCatalog: clone(PLAN_DEFINITIONS),
    },
  };
}

export function readAppStorageState() {
  return createInitialAppStorageState();
}

export function writeAppStorageState(_state: AppStorageState) { // eslint-disable-line @typescript-eslint/no-unused-vars
  // Disallowed: No localStorage usage for sensitive application state to avoid local manipulation
}

export function clearAppStorageState() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(STORAGE_KEY);
}

function getOrderStatusForMode(mode: BusinessMode): OrderStatus {
  if (mode === "BOOKING_SERVICE") {
    return "WAITING_DP";
  }

  if (mode === "PRODUCT_ORDER") {
    return "ORDER_BARU";
  }

  return "REQUEST_MASUK";
}

export function createAuthUser(input: {
  name: string;
  email: string;
  phoneNumber: string;
  role?: UserRole;
  businessId?: string;
  trialUsed?: boolean;
  isActive?: boolean;
}): AuthUser {
  const timestamp = now();

  return {
    id: buildId("usr"),
    name: input.name,
    email: input.email.trim().toLowerCase(),
    phoneNumber: input.phoneNumber.trim(),
    role: input.role ?? "OWNER",
    businessId: input.businessId,
    trialUsed: input.trialUsed ?? true,
    isActive: input.isActive ?? true,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function createCustomerRecord(input: {
  businessId: string;
  name: string;
  whatsappNumber: string;
  status: CustomerStatus;
  source?: string;
  notes?: string;
  lastInteractionAt?: string;
  lastOrderSummary?: string;
}): Customer {
  const timestamp = now();

  return {
    id: buildId("cus"),
    businessId: input.businessId,
    name: input.name,
    whatsappNumber: input.whatsappNumber,
    status: input.status,
    source: input.source,
    notes: input.notes,
    lastInteractionAt: input.lastInteractionAt,
    lastOrderSummary: input.lastOrderSummary,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function createOrderRecord(input: {
  businessId: string;
  customerId: string;
  customerName: string;
  whatsappNumber: string;
  title: string;
  mode: BusinessMode;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  scheduledDate?: string;
  scheduledTime?: string;
  bookingDurationMinutes?: number;
  bookingHoldExpiresAt?: string;
  resourceId?: string;
  resourceNameSnapshot?: string;
  totalAmount?: number;
  dpAmount?: number;
  notes?: string;
  customerStatusSnapshot?: CustomerStatus;
}): Order {
  const timestamp = now();

  return {
    id: buildId("ord"),
    businessId: input.businessId,
    customerId: input.customerId,
    customerName: input.customerName,
    whatsappNumber: input.whatsappNumber,
    title: input.title,
    mode: input.mode,
    status: input.status,
    paymentStatus: input.paymentStatus,
    scheduledDate: input.scheduledDate,
    scheduledTime: input.scheduledTime,
    bookingDurationMinutes: input.bookingDurationMinutes,
    bookingHoldExpiresAt: input.bookingHoldExpiresAt,
    resourceId: input.resourceId,
    resourceNameSnapshot: input.resourceNameSnapshot,
    totalAmount: input.totalAmount,
    dpAmount: input.dpAmount,
    notes: input.notes,
    customerStatusSnapshot: input.customerStatusSnapshot,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function createInvoiceRecord(input: {
  businessId: string;
  orderId: string;
  customerName: string;
  totalAmount: number;
  paymentStatus: PaymentStatus;
  notes?: string;
  invoiceCode: string;
}): Invoice {
  const timestamp = now();
  const verificationCode = buildInvoiceVerificationCode({
    invoiceCode: input.invoiceCode,
    createdAt: timestamp,
    customerName: input.customerName,
    totalAmount: input.totalAmount,
  });
  const integritySeal = buildInvoiceIntegritySeal({
    businessId: input.businessId,
    orderId: input.orderId,
    invoiceCode: input.invoiceCode,
    customerName: input.customerName,
    totalAmount: input.totalAmount,
    paymentStatus: input.paymentStatus,
    createdAt: timestamp,
    verificationCode,
  });

  return {
    id: buildId("inv"),
    businessId: input.businessId,
    orderId: input.orderId,
    invoiceCode: input.invoiceCode,
    verificationCode,
    integritySeal,
    customerName: input.customerName,
    totalAmount: input.totalAmount,
    paymentStatus: input.paymentStatus,
    notes: input.notes,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function createBusinessSubscriptionRecord(input: {
  businessId: string;
  planCode: PlanCode;
  startedAt?: string;
  status?: SubscriptionStatus;
  hasCompletedRequiredBackup?: boolean;
  lastBackupAt?: string;
  readOnlyReason?: string;
}): BusinessSubscription {
  const startedAt = input.startedAt ?? now();
  const customerLimit =
    input.planCode === "FREE_TRIAL" ? TRIAL_CUSTOMER_LIMIT : input.planCode === "PRO" ? PRO_CUSTOMER_LIMIT : 10000;
  const expiresAt =
    input.planCode === "FREE_TRIAL" ? addDays(startedAt, TRIAL_DURATION_DAYS) : addDays(startedAt, 30);

  return {
    id: buildId("sub"),
    businessId: input.businessId,
    planCode: input.planCode,
    status: input.status ?? (input.planCode === "FREE_TRIAL" ? "TRIAL_ACTIVE" : "ACTIVE"),
    startedAt,
    expiresAt,
    customerLimit,
    hasCompletedRequiredBackup: input.hasCompletedRequiredBackup ?? false,
    lastBackupAt: input.lastBackupAt,
    readOnlyReason: input.readOnlyReason,
    createdAt: startedAt,
    updatedAt: startedAt,
  };
}

export function createBackupRecord(input: {
  businessId: string;
  snapshotVersion: number;
  summary: string;
  payload: string;
  type?: BackupType;
}): BackupRecord {
  const timestamp = now();

  return {
    id: buildId("bak"),
    businessId: input.businessId,
    type: input.type ?? "MANUAL",
    snapshotVersion: input.snapshotVersion,
    summary: input.summary,
    payload: input.payload,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function createUpgradeRequestRecord(input: {
  businessId: string;
  requestedByUserId: string;
  fromPlan: PlanCode;
  toPlan: PlanCode;
  paymentNote?: string;
  status?: UpgradeRequestStatus;
}): UpgradeRequest {
  const timestamp = now();

  return {
    id: buildId("upr"),
    businessId: input.businessId,
    requestedByUserId: input.requestedByUserId,
    fromPlan: input.fromPlan,
    toPlan: input.toPlan,
    status: input.status ?? "PENDING",
    requestedAt: timestamp,
    paymentNote: input.paymentNote,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function createSuperAdminActionLog(input: {
  actorUserId: string;
  targetBusinessId: string;
  actionType: SuperAdminActionLog["actionType"];
  metadata?: Record<string, string>;
}): SuperAdminActionLog {
  const timestamp = now();

  return {
    id: buildId("log"),
    actorUserId: input.actorUserId,
    targetBusinessId: input.targetBusinessId,
    actionType: input.actionType,
    metadata: input.metadata,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function createPublicSubmissionRecord(input: {
  businessId: string;
  customerId: string;
  orderId: string;
  mode: BusinessMode;
  operationalModel: OperationalModel;
  payload: Record<string, string>;
}): PublicSubmission {
  const timestamp = now();

  return {
    id: buildId("pub"),
    businessId: input.businessId,
    customerId: input.customerId,
    orderId: input.orderId,
    mode: input.mode,
    operationalModel: input.operationalModel,
    payload: input.payload,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function createMessageTemplateRecord(template: MessageTemplate, changes: Partial<Pick<MessageTemplate, "title" | "content">>) {
  return {
    ...template,
    ...changes,
    updatedAt: now(),
  };
}

export function getDefaultOrderStatusForMode(mode: BusinessMode) {
  return getOrderStatusForMode(mode);
}
