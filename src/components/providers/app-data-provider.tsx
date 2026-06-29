"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
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
import { canCreateCustomer as canCreateCustomerByState, canCreateInvoice, canCreateOrder as canCreateOrderByState, canAccessWriteMode as canWriteMode, getCustomerUsage, getReadOnlyReason, getSubscriptionForBusiness, getSubscriptionStatus } from "@/lib/subscription";
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
  | "niche"
  | "description"
  | "openingHours"
  | "address"
  | "paymentInstructions"
  | "logoUrl"
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
  identifier: string;
  password: string;
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
  updateBusiness: (payload: Partial<Business>) => void;
  saveBusinessSettings: (payload: BusinessSettingsInput) => void;
  completeOnboarding: (payload: OnboardingPayload) => void;
  registerOwner: (payload: RegisterOwnerInput) => { ok: true; user: AuthUser } | { ok: false; message: string };
  login: (payload: LoginInput) => { ok: true; user: AuthUser } | { ok: false; message: string };
  resetPassword: (payload: ResetPasswordInput) => { ok: true } | { ok: false; message: string };
  logout: () => void;
  createCustomer: (payload: CustomerInput) => Customer;
  updateCustomer: (id: string, payload: CustomerInput) => Customer | null;
  deleteCustomer: (id: string) => void;
  createOrder: (payload: OrderInput) => Order;
  updateOrder: (id: string, payload: OrderInput) => Order | null;
  deleteOrder: (id: string) => void;
  createInvoiceFromOrder: (orderId: string, notes?: string) => Invoice | null;
  updateMessageTemplate: (id: string, payload: { title: string; content: string }) => void;
  updateMessageComposer: (payload: Partial<MessageComposerDraft>) => void;
  saveMessageDraft: (templateId: string, payload: { title: string; content: string }) => void;
  submitPublicOrder: (input: PublicOrderInput) => { customer: Customer; order: Order };
  createBackup: () => BackupRecord;
  requestUpgrade: (toPlan: PlanCode, paymentNote?: string) => UpgradeRequest;
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

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppStorageState>(createInitialAppStorageState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const nextState = readAppStorageState();
    setState(nextState);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    writeAppStorageState(state);
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
  const canCreateCustomer = canCreateCustomerByState({ business: state.business, customers: state.customers, subscriptions: state.subscriptions });
  const canCreateOrder = canCreateOrderByState({ business: state.business, subscriptions: state.subscriptions });
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

  function updateBusiness(payload: Partial<Business>) {
    setAppState((current) => ({
      ...current,
      business: normalizeBusinessPayload(current.business, payload),
    }));
  }

  function saveBusinessSettings(payload: BusinessSettingsInput) {
    setAppState((current) => ({
      ...current,
      business: normalizeBusinessPayload(current.business, payload),
    }));
  }

  function completeOnboarding(payload: OnboardingPayload) {
    setAppState((current) => ({
      ...current,
      business: {
        ...normalizeBusinessPayload(current.business, payload),
        ownerName: current.auth.users.find((user) => user.id === current.auth.currentUserId)?.name ?? current.business.ownerName,
        slug: normalizeBusinessNameToSlug(payload.name) || current.business.slug,
      },
      auth: {
        ...current.auth,
        onboardingCompleted: true,
      },
    }));
  }

  function registerOwner(payload: RegisterOwnerInput) {
    const normalizedEmail = normalizeIdentifier(payload.email);
    const normalizedPhoneNumber = payload.phoneNumber.trim();
    const existingEmail = state.auth.users.find((user) => user.email.toLowerCase() === normalizedEmail);
    if (existingEmail) {
      return { ok: false as const, message: "Email ini sudah terdaftar." };
    }

    const existingPhone = state.auth.users.find((user) => user.phoneNumber === normalizedPhoneNumber);
    if (existingPhone) {
      return { ok: false as const, message: "Nomor WhatsApp ini sudah dipakai untuk akun bisnis lain." };
    }

    const nextUser = createAuthUser({
      name: payload.name.trim(),
      email: normalizedEmail,
      phoneNumber: normalizedPhoneNumber,
      password: payload.password,
      role: "OWNER",
      businessId: state.business.id,
      trialUsed: true,
      isActive: true,
    });

    setAppState((current) => ({
      ...current,
      business: {
        ...current.business,
        ownerName: nextUser.name,
        updatedAt: new Date().toISOString(),
      },
      subscriptions: current.subscriptions.map((subscription) =>
        subscription.businessId === current.business.id
          ? createBusinessSubscriptionRecord({
              businessId: current.business.id,
              planCode: "FREE_TRIAL",
              startedAt: new Date().toISOString(),
            })
          : subscription
      ),
      auth: {
        ...current.auth,
        currentUserId: nextUser.id,
        onboardingCompleted: false,
        users: [nextUser, ...current.auth.users],
      },
    }));

    return { ok: true as const, user: nextUser };
  }

  function login(payload: LoginInput) {
    const normalizedIdentifier = normalizeIdentifier(payload.identifier);
    const user = state.auth.users.find(
      (item) =>
        (item.email.toLowerCase() === normalizedIdentifier || item.phoneNumber === payload.identifier.trim()) &&
        item.password === payload.password
    );

    if (!user) {
      return { ok: false as const, message: "Akun tidak ditemukan atau password salah." };
    }

    if (!user.isActive) {
      return { ok: false as const, message: "Akun ini sedang tidak aktif." };
    }

    setAppState((current) => ({
      ...current,
      business: {
        ...current.business,
        ownerName: user.role === "OWNER" ? user.name : current.business.ownerName,
      },
      auth: {
        ...current.auth,
        currentUserId: user.id,
      },
    }));

    return { ok: true as const, user };
  }

  function logout() {
    setAppState((current) => ({
      ...current,
      auth: {
        ...current.auth,
        currentUserId: null,
      },
    }));
  }

  function resetPassword(payload: ResetPasswordInput) {
    const normalizedIdentifier = normalizeIdentifier(payload.identifier);
    const existing = state.auth.users.find(
      (user) => user.email.toLowerCase() === normalizedIdentifier || user.phoneNumber === payload.identifier.trim()
    );

    if (!existing) {
      return { ok: false as const, message: "Akun dengan email / nomor HP ini tidak ditemukan." };
    }

    setAppState((current) => ({
      ...current,
      auth: {
        ...current.auth,
        users: current.auth.users.map((user) =>
          user.id === existing.id
            ? {
                ...user,
                password: payload.password,
                updatedAt: new Date().toISOString(),
              }
            : user
        ),
      },
    }));

    return { ok: true as const };
  }

  function createCustomer(payload: CustomerInput) {
    assertCanCreateCustomer();

    const nextCustomer = createCustomerRecord({
      businessId: state.business.id,
      ...payload,
      name: payload.name.trim(),
      whatsappNumber: payload.whatsappNumber.trim(),
      source: payload.source?.trim() || undefined,
      notes: payload.notes?.trim() || undefined,
    });

    setAppState((current) => ({
      ...current,
      customers: [nextCustomer, ...current.customers],
    }));

    return nextCustomer;
  }

  function updateCustomer(id: string, payload: CustomerInput) {
    let updatedCustomer: Customer | null = null;

    setAppState((current) => ({
      ...current,
      customers: current.customers.map((customer) => {
        if (customer.id !== id) {
          return customer;
        }

        updatedCustomer = {
          ...customer,
          name: payload.name.trim(),
          whatsappNumber: payload.whatsappNumber.trim(),
          status: payload.status,
          source: payload.source?.trim() || undefined,
          notes: payload.notes?.trim() || undefined,
          lastInteractionAt: payload.lastInteractionAt,
          lastOrderSummary: payload.lastOrderSummary,
          updatedAt: new Date().toISOString(),
        };

        return updatedCustomer;
      }),
    }));

    return updatedCustomer;
  }

  function deleteCustomer(id: string) {
    setAppState((current) => ({
      ...current,
      customers: current.customers.filter((customer) => customer.id !== id),
    }));
  }

  function upsertCustomerFromOrder(current: AppStorageState, payload: Pick<OrderInput, "customerName" | "whatsappNumber" | "status" | "title">) {
    const existingCustomer =
      current.customers.find((customer) => customer.whatsappNumber === payload.whatsappNumber.trim()) ??
      current.customers.find((customer) => customer.name.toLowerCase() === payload.customerName.trim().toLowerCase());

    const nextCustomerStatus = getCustomerStatusFromOrderStatus(payload.status);
    const lastInteractionAt = new Date().toISOString();

    if (existingCustomer) {
      const updatedCustomer: Customer = {
        ...existingCustomer,
        name: payload.customerName.trim(),
        whatsappNumber: payload.whatsappNumber.trim(),
        status: nextCustomerStatus,
        lastInteractionAt,
        lastOrderSummary: payload.title.trim(),
        updatedAt: lastInteractionAt,
      };

      return {
        customer: updatedCustomer,
        customers: current.customers.map((item) => (item.id === existingCustomer.id ? updatedCustomer : item)),
      };
    }

    const nextCustomer = createCustomerRecord({
      businessId: current.business.id,
      name: payload.customerName.trim(),
      whatsappNumber: payload.whatsappNumber.trim(),
      status: nextCustomerStatus,
      lastInteractionAt,
      lastOrderSummary: payload.title.trim(),
      source: "Order manual",
    });

    return {
      customer: nextCustomer,
      customers: [nextCustomer, ...current.customers],
    };
  }

  function createOrder(payload: OrderInput) {
    assertCanCreateOrder();
    const nextHoldExpiresAt = payload.bookingHoldExpiresAt;
    let createdOrder: Order | null = null;

    setAppState((current) => {
      const customerSync = upsertCustomerFromOrder(current, {
        customerName: payload.customerName,
        whatsappNumber: payload.whatsappNumber,
        status: payload.status,
        title: payload.title,
      });

      createdOrder = createOrderRecord({
        businessId: current.business.id,
        customerId: customerSync.customer.id,
        customerName: payload.customerName.trim(),
        whatsappNumber: payload.whatsappNumber.trim(),
        title: payload.title.trim(),
        mode: payload.mode,
        status: payload.status,
        paymentStatus: payload.paymentStatus,
        scheduledDate: payload.scheduledDate || undefined,
        scheduledTime: payload.scheduledTime || undefined,
        bookingDurationMinutes: payload.mode === "BOOKING_SERVICE" ? payload.bookingDurationMinutes : undefined,
        bookingHoldExpiresAt: nextHoldExpiresAt,
        resourceId: payload.resourceId,
        resourceNameSnapshot: payload.resourceNameSnapshot,
        totalAmount: payload.totalAmount,
        dpAmount: payload.dpAmount,
        notes: payload.notes?.trim() || undefined,
        customerStatusSnapshot: customerSync.customer.status,
      });

      return {
        ...current,
        customers: customerSync.customers,
        orders: createdOrder ? [createdOrder, ...current.orders] : current.orders,
      };
    });

    if (!createdOrder) {
      throw new Error("Failed to create order");
    }

    return createdOrder;
  }

  function updateOrder(id: string, payload: OrderInput) {
    let updatedOrder: Order | null = null;

    setAppState((current) => {
      const customerSync = upsertCustomerFromOrder(current, {
        customerName: payload.customerName,
        whatsappNumber: payload.whatsappNumber,
        status: payload.status,
        title: payload.title,
      });

      return {
        ...current,
        customers: customerSync.customers,
        orders: current.orders.map((order) => {
          if (order.id !== id) {
            return order;
          }

          updatedOrder = {
            ...order,
            customerId: customerSync.customer.id,
            customerName: payload.customerName.trim(),
            whatsappNumber: payload.whatsappNumber.trim(),
            title: payload.title.trim(),
            mode: payload.mode,
            status: payload.status,
            paymentStatus: payload.paymentStatus,
            scheduledDate: payload.scheduledDate || undefined,
            scheduledTime: payload.scheduledTime || undefined,
            bookingDurationMinutes: payload.mode === "BOOKING_SERVICE" ? payload.bookingDurationMinutes : undefined,
            bookingHoldExpiresAt: payload.bookingHoldExpiresAt,
            resourceId: payload.resourceId,
            resourceNameSnapshot: payload.resourceNameSnapshot,
            totalAmount: payload.totalAmount,
            dpAmount: payload.dpAmount,
            notes: payload.notes?.trim() || undefined,
            customerStatusSnapshot: customerSync.customer.status,
            updatedAt: new Date().toISOString(),
          };

          return updatedOrder;
        }),
      };
    });

    return updatedOrder;
  }

  function deleteOrder(id: string) {
    setAppState((current) => ({
      ...current,
      orders: current.orders.filter((order) => order.id !== id),
      invoices: current.invoices.filter((invoice) => invoice.orderId !== id),
    }));
  }

  function createInvoiceFromOrder(orderId: string, notes?: string) {
    assertCanCreateInvoice();
    const order = state.orders.find((item) => item.id === orderId);
    if (!order) {
      return null;
    }

    const existingInvoice = state.invoices.find((invoice) => invoice.orderId === order.id);
    if (existingInvoice) {
      return existingInvoice;
    }

    const nextInvoice = createInvoiceRecord({
      businessId: state.business.id,
      orderId: order.id,
      invoiceCode: createInvoiceCode(order.id, state.invoices.length + 1),
      customerName: order.customerName,
      totalAmount: order.totalAmount ?? 0,
      paymentStatus: order.paymentStatus,
      notes: notes?.trim() || "Nota dibuat dari order.",
    });

    setAppState((current) => ({
      ...current,
      invoices: [nextInvoice, ...current.invoices],
    }));

    return nextInvoice;
  }

  function updateMessageTemplate(id: string, payload: { title: string; content: string }) {
    setAppState((current) => ({
      ...current,
      messageTemplates: current.messageTemplates.map((template) =>
        template.id === id ? createMessageTemplateRecord(template, payload) : template
      ),
    }));
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

  function submitPublicOrder(input: PublicOrderInput) {
    assertCanCreateOrder();
    const customerName = input.payload.name?.trim() || "Customer baru";
    const whatsappNumber = input.payload.whatsappNumber?.trim() || "";
    const mode = state.business.mode;
    const operationalModel = state.business.operationalModel;
    const title = getPublicOrderTitle(mode, input.payload);

    const customer = createCustomerRecord({
      businessId: state.business.id,
      name: customerName,
      whatsappNumber,
      status: "NEW",
      source: "Link Bisnis",
      notes: input.payload.notes?.trim() || undefined,
      lastInteractionAt: new Date().toISOString(),
      lastOrderSummary: title,
    });

    const order = createOrderRecord({
      businessId: state.business.id,
      customerId: customer.id,
      customerName,
      whatsappNumber,
      title,
      mode,
      status: getDefaultOrderStatusForMode(mode),
      paymentStatus: "UNPAID",
      scheduledDate: input.payload.scheduledDate || input.payload.deadline || undefined,
      scheduledTime: input.payload.scheduledTime || undefined,
      bookingDurationMinutes: input.payload.bookingDurationMinutes ? Number(input.payload.bookingDurationMinutes) : undefined,
      resourceId: undefined,
      resourceNameSnapshot: undefined,
      totalAmount: input.payload.budget ? Number(input.payload.budget.replace(/[^\d]/g, "")) : undefined,
      notes: input.payload.notes?.trim() || undefined,
      customerStatusSnapshot: "NEW",
    });

    const publicSubmission = createPublicSubmissionRecord({
      businessId: state.business.id,
      customerId: customer.id,
      orderId: order.id,
      mode,
      operationalModel,
      payload: input.payload,
    });

    setAppState((current) => ({
      ...current,
      customers: [customer, ...current.customers],
      orders: [order, ...current.orders],
      publicSubmissions: [publicSubmission, ...current.publicSubmissions],
    }));

    return { customer, order };
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

  function requestUpgrade(toPlan: PlanCode, paymentNote?: string) {
    const currentUserId = state.auth.currentUserId;
    if (!currentUserId) {
      throw new Error("Kamu harus login dulu.");
    }

    const currentSubscription = getSubscriptionForBusiness(state.subscriptions, state.business.id);
    const existingPending = state.upgradeRequests.find((request) => request.businessId === state.business.id && request.status === "PENDING");
    if (existingPending) {
      return existingPending;
    }

    const nextRequest = createUpgradeRequestRecord({
      businessId: state.business.id,
      requestedByUserId: currentUserId,
      fromPlan: currentSubscription?.planCode ?? "FREE_TRIAL",
      toPlan,
      paymentNote,
    });

    setAppState((current) => ({
      ...current,
      upgradeRequests: [nextRequest, ...current.upgradeRequests],
      subscriptions: current.subscriptions.map((subscription) =>
        subscription.businessId === current.business.id
          ? withUpdatedTimestamp({
              ...subscription,
              status: "PENDING_UPGRADE_APPROVAL",
            })
          : subscription
      ),
    }));

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
    resetPassword,
    logout,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    createOrder,
    updateOrder,
    deleteOrder,
    createInvoiceFromOrder,
    updateMessageTemplate,
    updateMessageComposer,
    saveMessageDraft,
    submitPublicOrder,
    createBackup,
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
