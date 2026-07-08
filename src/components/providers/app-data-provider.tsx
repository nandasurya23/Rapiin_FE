"use client";

import { createContext, useContext, useEffect, useMemo, useState, useCallback, type ReactNode } from "react";
import { ApiAuthService } from "@/services/auth.service";
import { ApiBusinessService } from "@/services/business.service";
import { ApiCustomerService } from "@/services/customer.service";
import { ApiOrderService } from "@/services/order.service";
import { ApiInvoiceService } from "@/services/invoice.service";
import { ApiMessageTemplateService } from "@/services/message-template.service";
import type { MessageTemplate } from "@/types/message";
import { apiFetch } from "@/lib/api-client";
import { BusinessDTO } from "@/services/business.service";
import {
  createAuthUser,
  createBackupRecord,
  createBusinessSubscriptionRecord,
  createCustomerRecord,
  createInitialAppStorageState,
  createInvoiceRecord,
  createMessageTemplateRecord,
  createOrderRecord,
  createPublicSubmissionRecord,
  createSuperAdminActionLog,
  createUpgradeRequestRecord,
  getDefaultOrderStatusForMode,
  readAppStorageState,
  writeAppStorageState,
} from "@/lib/storage-service";
import { createBusinessResources, doesOperationalModelUseResources } from "@/lib/constants/business";
import { PREMIUM_CUSTOMER_LIMIT, PRO_CUSTOMER_LIMIT } from "@/lib/constants/subscription";
import { canCreateCustomer as canCreateCustomerByState, canCreateInvoice, canCreateOrder as canCreateOrderByState, canAccessWriteMode as canWriteMode, getCustomerUsage, getReadOnlyReason, getSubscriptionForBusiness, getSubscriptionStatus, getOrderUsage } from "@/lib/subscription";
import type { AppStorageState, AuthUser, MessageComposerDraft } from "@/types/app-state";
import type { Business, BusinessMode, BusinessResource, NicheTemplate, OperationalModel } from "@/types/business";
import type { Customer, CustomerStatus } from "@/types/customer";
import type { Invoice } from "@/types/invoice";
import type { Order, OrderStatus, PaymentStatus } from "@/types/order";
import type { BackupRecord, BusinessSubscription, PlanCode, UpgradeRequest, UserRole } from "@/types/subscription";

type OnboardingPayload = {
  name: string;
  whatsappNumber: string;
  mode: BusinessMode;
  operationalModel: OperationalModel;
  usesResources: boolean;
  resourceLabel?: string;
  resourceCount?: number;
  resources?: BusinessResource[];
  defaultBookingDurationMinutes?: number;
  niche: NicheTemplate;
  description: string;
};

type BusinessSettingsInput = Pick<
  Business,
  | "name"
  | "whatsappNumber"
  | "mode"
  | "operationalModel"
  | "usesResources"
  | "resourceLabel"
  | "resourceCount"
  | "resources"
  | "defaultBookingDurationMinutes"
  | "bookingCapacity"
  | "niche"
  | "description"
  | "openingHours"
  | "address"
  | "timezone"
  | "paymentInstructions"
  | "logoUrl"
  | "services"
>;

type CustomerInput = {
  name: string;
  whatsappNumber: string;
  status: CustomerStatus;
  source?: string;
  notes?: string;
  lastInteractionAt?: string;
  lastOrderSummary?: string;
};

type OrderInput = {
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
};

type LoginInput = {
  identifier: string;
  password: string;
};

type RegisterOwnerInput = {
  name: string;
  email: string;
  phoneNumber: string;
  password: string;
};

type ResetPasswordInput = {
  token: string;
  newPassword: string;
};

type PublicOrderInput = {
  payload: Record<string, string>;
};

type AppDataContextValue = AppStorageState & {
  hydrated: boolean;
  currentUser: AppStorageState["auth"]["users"][number] | null;
  currentUserRole: UserRole | null;
  isSuperAdmin: boolean;
  subscriptionForCurrentBusiness: BusinessSubscription | null;
  currentBusinessUsage: ReturnType<typeof getCustomerUsage>;
  currentOrderUsage: ReturnType<typeof getOrderUsage>;
  canCreateCustomer: boolean;
  canCreateOrder: boolean;
  canCreateInvoice: boolean;
  canAccessWriteMode: boolean;
  readOnlyReason: string | null;
  businessDirectory: Array<{
    business: Business;
    owner: AppStorageState["auth"]["users"][number] | null;
    subscription: BusinessSubscription | null;
    customerCount: number;
    backupCount: number;
    latestBackup: BackupRecord | null;
  }>;
  updateBusiness: (payload: Partial<Business>) => Promise<void>;
  saveBusinessSettings: (payload: BusinessSettingsInput) => Promise<void>;
  completeOnboarding: (payload: OnboardingPayload) => Promise<void>;
  registerOwner: (payload: RegisterOwnerInput) => Promise<{ ok: true; user: AuthUser } | { ok: false; message: string }>;
  login: (payload: LoginInput) => Promise<{ ok: true; user: AuthUser } | { ok: false; message: string }>;
  requestForgotPassword: (email: string) => Promise<{ ok: true; message: string; devResetUrl?: string } | { ok: false; message: string }>;
  resetPassword: (payload: ResetPasswordInput) => Promise<{ ok: true } | { ok: false; message: string }>;
  logout: () => Promise<void>;
  createCustomer: (payload: CustomerInput) => Promise<Customer>;
  updateCustomer: (id: string, payload: CustomerInput) => Promise<Customer | null>;
  deleteCustomer: (id: string) => Promise<void>;
  createOrder: (payload: OrderInput) => Promise<Order>;
  updateOrder: (id: string, payload: OrderInput) => Promise<Order | null>;
  deleteOrder: (id: string) => Promise<void>;
  createInvoiceFromOrder: (orderId: string, notes?: string) => Promise<Invoice | null>;
  createMessageTemplate: (payload: { category: string; title: string; content: string }) => Promise<MessageTemplate>;
  updateMessageTemplate: (id: string, payload: { title: string; content: string }) => Promise<MessageTemplate | null>;
  deleteMessageTemplate: (id: string) => Promise<void>;
  updateMessageComposer: (payload: Partial<MessageComposerDraft>) => void;
  saveMessageDraft: (templateId: string, payload: { title: string; content: string }) => void;
  submitPublicOrder: (input: PublicOrderInput) => Promise<unknown>;
  createBackup: () => BackupRecord;
  restoreBackup: (backupPayload: string) => boolean;
  requestUpgrade: (toPlan: PlanCode, paymentNote?: string) => Promise<UpgradeRequest>;
  approveUpgrade: (requestId: string, adminNote?: string) => UpgradeRequest | null;
  rejectUpgrade: (requestId: string, adminNote?: string) => UpgradeRequest | null;
  extendTrial: (businessId: string, extraDays: number) => BusinessSubscription | null;
  suspendBusiness: (businessId: string, reason?: string) => BusinessSubscription | null;
  reactivateBusiness: (businessId: string) => BusinessSubscription | null;
};

const AppDataContext = createContext<AppDataContextValue | null>(null);

function createInvoiceCode(orderId: string, sequence: number) {
  return `INV-${orderId.toUpperCase()}-${String(sequence).padStart(3, "0")}`;
}

function normalizeBusinessNameToSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getCustomerStatusFromOrderStatus(status: OrderStatus): CustomerStatus {
  if (status === "SELESAI") {
    return "DONE";
  }

  if (status === "BATAL") {
    return "CANCELLED";
  }

  if (status === "DEAL" || status === "CONFIRMED") {
    return "DEAL";
  }

  return "NEED_FOLLOW_UP";
}

function getPublicOrderTitle(mode: BusinessMode, payload: Record<string, string>) {
  if (mode === "BOOKING_SERVICE") {
    return payload.service?.trim() || "Booking baru";
  }

  if (mode === "PRODUCT_ORDER") {
    return payload.product?.trim() || "Order produk";
  }

  return payload.requestDetail?.trim() || "Request custom";
}

function normalizeBusinessPayload(current: Business, payload: Partial<BusinessSettingsInput>) {
  const mode = payload.mode ?? current.mode;
  const operationalModel = payload.operationalModel ?? current.operationalModel;
  const usesResources =
    typeof payload.usesResources === "boolean" ? payload.usesResources : doesOperationalModelUseResources(operationalModel);
  const resourceLabel = usesResources ? payload.resourceLabel?.trim() || current.resourceLabel?.trim() || "Slot" : undefined;
  const resourceCount = usesResources ? Math.max(1, payload.resourceCount ?? current.resourceCount ?? current.resources?.length ?? 1) : undefined;
  const resources = usesResources
    ? (payload.resources?.length ? payload.resources : current.resources?.length ? current.resources : createBusinessResources(resourceLabel ?? "Slot", resourceCount ?? 1)).map(
        (resource, index) => ({
          id: resource.id || `res_${index + 1}`,
          name: resource.name.trim() || `${resourceLabel} ${index + 1}`,
          isActive: resource.isActive,
        })
      )
    : current.resources?.map((resource) => ({ ...resource, isActive: false })) ?? [];

  return {
    ...current,
    ...payload,
    mode,
    operationalModel,
    usesResources,
    resourceLabel,
    resourceCount,
    resources,
    services: payload.services !== undefined ? payload.services : current.services,
    bookingCapacity: payload.bookingCapacity !== undefined ? payload.bookingCapacity : current.bookingCapacity,
    defaultBookingDurationMinutes:
      payload.defaultBookingDurationMinutes ?? current.defaultBookingDurationMinutes,
    updatedAt: new Date().toISOString(),
  };
}

function normalizeIdentifier(value: string) {
  return value.trim().toLowerCase();
}

function withUpdatedTimestamp<T extends { updatedAt: string }>(value: T): T {
  return { ...value, updatedAt: new Date().toISOString() };
}

const authService = new ApiAuthService();
const businessService = new ApiBusinessService();
const customerService = new ApiCustomerService();
const orderService = new ApiOrderService();
const invoiceService = new ApiInvoiceService();
const messageTemplateService = new ApiMessageTemplateService();

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppStorageState>(createInitialAppStorageState);
  const [hydrated, setHydrated] = useState(false);

  const fetchAllData = useCallback(async (userId: string) => {
    try {
      const business = await businessService.getBusinessById("");
      if (!business) return;

      const [orders, customers, invoices, messageTemplates] = await Promise.all([
        orderService.getOrders(business.id),
        customerService.getCustomers(business.id),
        invoiceService.getInvoices(business.id),
        messageTemplateService.getTemplates(business.id),
      ]);

      setState((prev) => ({
        ...prev,
        business,
        orders,
        customers,
        invoices,
        messageTemplates,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        subscriptions: (business as any).subscriptions || prev.subscriptions,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        upgradeRequests: (business as any).upgradeRequests || prev.upgradeRequests,
      }));
    } catch (err) {
      console.error("Failed to load backend data", err);
    }
  }, []);

  useEffect(() => {
    async function init() {
      // getCurrentUser() calls /api/auth/me — cookie is source of truth, no localStorage
      const user = await authService.getCurrentUser();
      if (user) {
        const onboardingCompleted = user.onboardingCompleted ?? false;

        // Always fetch the business profile so form fields (e.g. whatsappNumber)
        // are pre-populated from DB — needed for both onboarding and dashboard flows.
        let businessData = null;
        try {
          businessData = await businessService.getBusinessById("");
        } catch {
          // Not critical — business may not exist yet for brand-new users
        }

        setState((prev) => ({
          ...prev,
          business: businessData || prev.business,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          subscriptions: businessData ? (businessData as any).subscriptions || prev.subscriptions : prev.subscriptions,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          upgradeRequests: businessData ? (businessData as any).upgradeRequests || prev.upgradeRequests : prev.upgradeRequests,
          auth: {
            ...prev.auth,
            currentUserId: user.id,
            onboardingCompleted,
            users: [user],
          },
        }));
        if (onboardingCompleted) {
          await fetchAllData(user.id);
        }
      }
      setHydrated(true);
    }
    init();
  }, [fetchAllData]);



  useEffect(() => {
    if (!hydrated) {
      return;
    }

    // Persist local state preferences to localStorage
    writeAppStorageState({
      ...state,
      business: state.business,
      auth: state.auth,
      ui: state.ui,
    });
  }, [hydrated, state]);

  function setAppState(updater: (current: AppStorageState) => AppStorageState) {
    setState((current) => updater(current));
  }

  const currentUser = useMemo(() => state.auth.users.find((user) => user.id === state.auth.currentUserId) ?? null, [state.auth.currentUserId, state.auth.users]);
  const subscriptionForCurrentBusiness = useMemo(
    () => getSubscriptionForBusiness(state.subscriptions, state.business.id),
    [state.business.id, state.subscriptions]
  );
  const currentUserRole = currentUser?.role ?? null;
  const isSuperAdmin = currentUserRole === "SUPER_ADMIN";
  const currentBusinessUsage = useMemo(
    () => getCustomerUsage({ business: state.business, customers: state.customers, subscriptions: state.subscriptions }),
    [state.business, state.customers, state.subscriptions]
  );
  const currentOrderUsage = useMemo(
    () => getOrderUsage({ business: state.business, subscriptions: state.subscriptions, orders: state.orders }),
    [state.business, state.subscriptions, state.orders]
  );
  const canCreateCustomer = canCreateCustomerByState({ business: state.business, customers: state.customers, subscriptions: state.subscriptions });
  const canCreateOrder = canCreateOrderByState({ business: state.business, subscriptions: state.subscriptions, orders: state.orders });
  const canCreateInvoiceValue = canCreateInvoice({ business: state.business, subscriptions: state.subscriptions });
  const canAccessWriteMode = canWriteMode(subscriptionForCurrentBusiness);
  const readOnlyReason = getReadOnlyReason(subscriptionForCurrentBusiness);

  const businessDirectory = useMemo(
    () => [
      {
        business: state.business,
        owner: state.auth.users.find((user) => user.role === "OWNER" && user.businessId === state.business.id) ?? null,
        subscription: subscriptionForCurrentBusiness,
        customerCount: state.customers.length,
        backupCount: state.backupRecords.filter((record) => record.businessId === state.business.id).length,
        latestBackup:
          state.backupRecords
            .filter((record) => record.businessId === state.business.id)
            .sort((left, right) => right.createdAt.localeCompare(left.createdAt))[0] ?? null,
      },
    ],
    [state.auth.users, state.backupRecords, state.business, state.customers.length, subscriptionForCurrentBusiness]
  );

  function assertCanCreateCustomer() {
    if (!canAccessWriteMode) {
      throw new Error(readOnlyReason || "Mode baca saja aktif.");
    }

    if (!canCreateCustomer) {
      throw new Error(`Batas customer plan ini sudah penuh (${currentBusinessUsage.used}/${currentBusinessUsage.limit}).`);
    }
  }

  function assertCanCreateOrder() {
    if (!canCreateOrder) {
      throw new Error(readOnlyReason || "Mode baca saja aktif.");
    }
  }

  function assertCanCreateInvoice() {
    if (!canCreateInvoiceValue) {
      throw new Error(readOnlyReason || "Mode baca saja aktif.");
    }
  }

  function assertCanWrite() {
    if (!canAccessWriteMode) {
      throw new Error(readOnlyReason || "Mode baca saja aktif.");
    }
  }

  async function updateBusiness(payload: Partial<Business>) {
    assertCanWrite();
    const updated = await businessService.updateBusiness(state.business.id, payload);
    if (updated) {
      setState((current) => ({
        ...current,
        business: updated,
      }));
    }
  }

  async function saveBusinessSettings(payload: BusinessSettingsInput) {
    assertCanWrite();
    const updated = await businessService.updateBusiness(state.business.id, payload);
    if (updated) {
      setState((current) => ({
        ...current,
        business: updated,
      }));
    }
  }

  async function completeOnboarding(payload: OnboardingPayload) {
    const response = await apiFetch<BusinessDTO>("/api/business/onboarding", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (response) {
      setState((prev) => ({
        ...prev,
        business: response as Business,
        auth: {
          ...prev.auth,
          onboardingCompleted: true,
        },
      }));
      await fetchAllData(state.auth.currentUserId || "");
    }
  }

  async function registerOwner(payload: RegisterOwnerInput) {
    const result = await authService.register(payload);
    if (result.ok) {
      const onboardingCompleted = result.user.onboardingCompleted ?? false;
      let businessData = null;
      try {
        businessData = await businessService.getBusinessById("");
      } catch (err) {
        console.error("Failed to fetch new business after registration", err);
      }
      setState((prev) => ({
        ...prev,
        business: businessData || prev.business,
        auth: {
          ...prev.auth,
          currentUserId: result.user.id,
          onboardingCompleted,
          users: [result.user],
        },
      }));
    }
    return result;
  }

  async function login(payload: LoginInput) {
    const result = await authService.login(payload.identifier, payload.password);
    if (result.ok) {
      const onboardingCompleted = result.user.onboardingCompleted ?? false;
      setState((prev) => ({
        ...prev,
        auth: {
          ...prev.auth,
          currentUserId: result.user.id,
          onboardingCompleted,
          users: [result.user],
        },
      }));
      if (onboardingCompleted) {
        await fetchAllData(result.user.id);
      }
    }
    return result;
  }

  async function logout() {
    await authService.logout();
    // Reset ALL state to initial — prevents data leak between users on same device
    setState(createInitialAppStorageState());
  }

  async function requestForgotPassword(email: string) {
    return authService.requestForgotPassword(email);
  }

  async function resetPassword(payload: ResetPasswordInput) {
    return authService.resetPassword(payload.token, payload.newPassword);
  }

  async function createCustomer(payload: CustomerInput) {
    assertCanCreateCustomer();
    const customer = await customerService.createCustomer({
      ...payload,
      businessId: state.business.id,
    });
    await fetchAllData(state.auth.currentUserId || "");
    return customer;
  }

  async function updateCustomer(id: string, payload: CustomerInput) {
    assertCanWrite();
    const customer = await customerService.updateCustomer(id, payload);
    await fetchAllData(state.auth.currentUserId || "");
    return customer;
  }

  async function deleteCustomer(id: string) {
    assertCanWrite();
    await customerService.deleteCustomer(id);
    await fetchAllData(state.auth.currentUserId || "");
  }

  async function createOrder(payload: OrderInput) {
    assertCanCreateOrder();
    const order = await orderService.createOrder({
      ...payload,
      businessId: state.business.id,
    });
    await fetchAllData(state.auth.currentUserId || "");
    return order;
  }

  async function updateOrder(id: string, payload: OrderInput) {
    assertCanWrite();
    const order = await orderService.updateOrder(id, payload);
    await fetchAllData(state.auth.currentUserId || "");
    return order;
  }

  async function deleteOrder(id: string) {
    assertCanWrite();
    await orderService.deleteOrder(id);
    await fetchAllData(state.auth.currentUserId || "");
  }

  async function createInvoiceFromOrder(orderId: string, notes?: string) {
    assertCanCreateInvoice();
    const invoice = await invoiceService.createInvoiceFromOrder(orderId, notes);
    await fetchAllData(state.auth.currentUserId || "");
    return invoice;
  }

  async function createMessageTemplate(payload: { category: string; title: string; content: string }) {
    assertCanWrite();
    const newTemplate = await messageTemplateService.createTemplate(payload);
    await fetchAllData(state.auth.currentUserId || "");
    return newTemplate;
  }

  async function updateMessageTemplate(id: string, payload: { title: string; content: string }) {
    assertCanWrite();
    const updated = await messageTemplateService.updateTemplate(id, payload);
    await fetchAllData(state.auth.currentUserId || "");
    return updated;
  }

  async function deleteMessageTemplate(id: string) {
    assertCanWrite();
    await messageTemplateService.deleteTemplate(id);
    await fetchAllData(state.auth.currentUserId || "");
  }

  function updateMessageComposer(payload: Partial<MessageComposerDraft>) {
    setAppState((current) => ({
      ...current,
      ui: {
        ...current.ui,
        messageComposer: {
          ...current.ui.messageComposer,
          ...payload,
          drafts: payload.drafts ?? current.ui.messageComposer.drafts,
        },
      },
    }));
  }

  function saveMessageDraft(templateId: string, payload: { title: string; content: string }) {
    setAppState((current) => ({
      ...current,
      ui: {
        ...current.ui,
        messageComposer: {
          ...current.ui.messageComposer,
          drafts: {
            ...current.ui.messageComposer.drafts,
            [templateId]: payload,
          },
        },
      },
    }));
  }

  async function submitPublicOrder(input: PublicOrderInput) {
    const response = await apiFetch<unknown>(`/api/public/b/${state.business.slug}/submit`, {
      method: "POST",
      body: JSON.stringify({
        mode: state.business.mode,
        operationalModel: state.business.operationalModel,
        payload: input.payload,
      }),
    });
    return response;
  }

  function createBackup() {
    const payload = JSON.stringify({
      business: state.business,
      customers: state.customers,
      orders: state.orders,
      invoices: state.invoices,
      messageTemplates: state.messageTemplates,
      publicSubmissions: state.publicSubmissions,
      generatedAt: new Date().toISOString(),
    });
    const nextRecord = createBackupRecord({
      businessId: state.business.id,
      snapshotVersion: state.version,
      summary: `${state.customers.length} customer • ${state.orders.length} order • ${state.invoices.length} nota`,
      payload,
    });

    setAppState((current) => ({
      ...current,
      backupRecords: [nextRecord, ...current.backupRecords],
      subscriptions: current.subscriptions.map((subscription) =>
        subscription.businessId === current.business.id
          ? withUpdatedTimestamp({
              ...subscription,
              hasCompletedRequiredBackup: true,
              lastBackupAt: nextRecord.createdAt,
            })
          : subscription
      ),
      superAdminLogs: current.auth.currentUserId
        ? [createSuperAdminActionLog({ actorUserId: current.auth.currentUserId, targetBusinessId: current.business.id, actionType: "CREATE_BACKUP" }), ...current.superAdminLogs]
        : current.superAdminLogs,
    }));

    return nextRecord;
  }

  function restoreBackup(backupPayload: string): boolean {
    try {
      const parsed = JSON.parse(backupPayload);
      if (!parsed.business || !parsed.business.id) {
        return false;
      }

      setAppState((current) => {
        const nextState = {
          ...current,
          business: { ...current.business, ...parsed.business },
          customers: Array.isArray(parsed.customers) ? parsed.customers : current.customers,
          orders: Array.isArray(parsed.orders) ? parsed.orders : current.orders,
          invoices: Array.isArray(parsed.invoices) ? parsed.invoices : current.invoices,
          messageTemplates: Array.isArray(parsed.messageTemplates) ? parsed.messageTemplates : current.messageTemplates,
          publicSubmissions: Array.isArray(parsed.publicSubmissions) ? parsed.publicSubmissions : current.publicSubmissions,
        };
        writeAppStorageState(nextState);
        return nextState;
      });

      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  }

  async function requestUpgrade(toPlan: PlanCode, paymentNote?: string) {
    const currentUserId = state.auth.currentUserId;
    if (!currentUserId) {
      throw new Error("Kamu harus login dulu.");
    }

    const currentSubscription = getSubscriptionForBusiness(state.subscriptions, state.business.id);
    const existingPending = state.upgradeRequests.find((request) => request.businessId === state.business.id && request.status === "PENDING");
    if (existingPending) {
      return existingPending;
    }

    const nextRequest = await apiFetch<UpgradeRequest>("/api/business/upgrade", {
      method: "POST",
      body: JSON.stringify({
        toPlan,
        paymentNote,
      }),
    });

    await fetchAllData(currentUserId);
    return nextRequest;
  }

  function approveUpgrade(requestId: string, adminNote?: string) {
    const request = state.upgradeRequests.find((item) => item.id === requestId);
    if (!request || !state.auth.currentUserId) {
      return null;
    }

    let updatedRequest: UpgradeRequest | null = null;

    setAppState((current) => ({
      ...current,
      upgradeRequests: current.upgradeRequests.map((item) => {
        if (item.id !== requestId) {
          return item;
        }

        updatedRequest = {
          ...item,
          status: "APPROVED",
          adminNote,
          reviewedAt: new Date().toISOString(),
          reviewedByUserId: current.auth.currentUserId ?? undefined,
          updatedAt: new Date().toISOString(),
        };
        return updatedRequest;
      }),
      subscriptions: current.subscriptions.map((subscription) =>
        subscription.businessId === request.businessId
          ? withUpdatedTimestamp({
              ...subscription,
              planCode: request.toPlan,
              status: "ACTIVE",
              customerLimit: request.toPlan === "PRO" ? PRO_CUSTOMER_LIMIT : PREMIUM_CUSTOMER_LIMIT,
              startedAt: new Date().toISOString(),
              expiresAt: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString(),
              readOnlyReason: undefined,
            })
          : subscription
      ),
      superAdminLogs: [
        createSuperAdminActionLog({
          actorUserId: current.auth.currentUserId ?? "system",
          targetBusinessId: request.businessId,
          actionType: "APPROVE_UPGRADE",
          metadata: { toPlan: request.toPlan, fromPlan: request.fromPlan },
        }),
        ...current.superAdminLogs,
      ],
    }));

    return updatedRequest;
  }

  function rejectUpgrade(requestId: string, adminNote?: string) {
    const request = state.upgradeRequests.find((item) => item.id === requestId);
    if (!request || !state.auth.currentUserId) {
      return null;
    }

    let updatedRequest: UpgradeRequest | null = null;

    setAppState((current) => ({
      ...current,
      upgradeRequests: current.upgradeRequests.map((item) => {
        if (item.id !== requestId) {
          return item;
        }

        updatedRequest = {
          ...item,
          status: "REJECTED",
          adminNote,
          reviewedAt: new Date().toISOString(),
          reviewedByUserId: current.auth.currentUserId ?? undefined,
          updatedAt: new Date().toISOString(),
        };
        return updatedRequest;
      }),
      subscriptions: current.subscriptions.map((subscription) =>
        subscription.businessId === request.businessId
          ? withUpdatedTimestamp({
              ...subscription,
              status: getSubscriptionStatus(subscription) === "TRIAL_EXPIRED" ? "TRIAL_EXPIRED" : subscription.planCode === "FREE_TRIAL" ? "TRIAL_ACTIVE" : "ACTIVE",
            })
          : subscription
      ),
      superAdminLogs: [
        createSuperAdminActionLog({
          actorUserId: current.auth.currentUserId ?? "system",
          targetBusinessId: request.businessId,
          actionType: "REJECT_UPGRADE",
          metadata: { toPlan: request.toPlan, fromPlan: request.fromPlan },
        }),
        ...current.superAdminLogs,
      ],
    }));

    return updatedRequest;
  }

  function extendTrial(businessId: string, extraDays: number) {
    let updatedSubscription: BusinessSubscription | null = null;

    setAppState((current) => ({
      ...current,
      subscriptions: current.subscriptions.map((subscription) => {
        if (subscription.businessId !== businessId) {
          return subscription;
        }

        const nextExpiry = new Date(subscription.expiresAt);
        nextExpiry.setDate(nextExpiry.getDate() + extraDays);
        updatedSubscription = {
          ...subscription,
          status: "TRIAL_ACTIVE",
          expiresAt: nextExpiry.toISOString(),
          readOnlyReason: undefined,
          updatedAt: new Date().toISOString(),
        };
        return updatedSubscription;
      }),
      superAdminLogs:
        current.auth.currentUserId
          ? [
              createSuperAdminActionLog({
                actorUserId: current.auth.currentUserId,
                targetBusinessId: businessId,
                actionType: "EXTEND_TRIAL",
                metadata: { extraDays: String(extraDays) },
              }),
              ...current.superAdminLogs,
            ]
          : current.superAdminLogs,
    }));

    return updatedSubscription;
  }

  function suspendBusiness(businessId: string, reason?: string) {
    let updatedSubscription: BusinessSubscription | null = null;

    setAppState((current) => ({
      ...current,
      subscriptions: current.subscriptions.map((subscription) => {
        if (subscription.businessId !== businessId) {
          return subscription;
        }

        updatedSubscription = {
          ...subscription,
          status: "SUSPENDED",
          readOnlyReason: reason || "Bisnis disuspend oleh super admin.",
          updatedAt: new Date().toISOString(),
        };

        return updatedSubscription;
      }),
      superAdminLogs:
        current.auth.currentUserId
          ? [
              createSuperAdminActionLog({
                actorUserId: current.auth.currentUserId,
                targetBusinessId: businessId,
                actionType: "SUSPEND_BUSINESS",
                metadata: { reason: reason || "" },
              }),
              ...current.superAdminLogs,
            ]
          : current.superAdminLogs,
    }));

    return updatedSubscription;
  }

  function reactivateBusiness(businessId: string) {
    let updatedSubscription: BusinessSubscription | null = null;

    setAppState((current) => ({
      ...current,
      subscriptions: current.subscriptions.map((subscription) => {
        if (subscription.businessId !== businessId) {
          return subscription;
        }

        updatedSubscription = {
          ...subscription,
          status: subscription.planCode === "FREE_TRIAL" ? "TRIAL_ACTIVE" : "ACTIVE",
          readOnlyReason: undefined,
          updatedAt: new Date().toISOString(),
        };
        return updatedSubscription;
      }),
      superAdminLogs:
        current.auth.currentUserId
          ? [
              createSuperAdminActionLog({
                actorUserId: current.auth.currentUserId,
                targetBusinessId: businessId,
                actionType: "REACTIVATE_BUSINESS",
              }),
              ...current.superAdminLogs,
            ]
          : current.superAdminLogs,
    }));

    return updatedSubscription;
  }

  const value: AppDataContextValue = {
    ...state,
    hydrated,
    currentUser,
    currentUserRole,
    isSuperAdmin,
    subscriptionForCurrentBusiness,
    currentBusinessUsage,
    currentOrderUsage,
    canCreateCustomer,
    canCreateOrder,
    canCreateInvoice: canCreateInvoiceValue,
    canAccessWriteMode,
    readOnlyReason,
    businessDirectory,
    updateBusiness,
    saveBusinessSettings,
    completeOnboarding,
    registerOwner,
    login,
    requestForgotPassword,
    resetPassword,
    logout,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    createOrder,
    updateOrder,
    deleteOrder,
    createInvoiceFromOrder,
    createMessageTemplate,
    updateMessageTemplate,
    deleteMessageTemplate,
    updateMessageComposer,
    saveMessageDraft,
    submitPublicOrder,
    createBackup,
    restoreBackup,
    requestUpgrade,
    approveUpgrade,
    rejectUpgrade,
    extendTrial,
    suspendBusiness,
    reactivateBusiness,
  };

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const context = useContext(AppDataContext);

  if (!context) {
    throw new Error("useAppData must be used inside AppDataProvider");
  }

  return context;
}
