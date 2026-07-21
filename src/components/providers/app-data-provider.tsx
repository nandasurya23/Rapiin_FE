"use client";

import { createContext, useContext, useEffect, useMemo, useState, useCallback, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiAuthService } from "@/services/auth.service";
import { ApiBusinessService } from "@/services/business.service";
import { ApiCustomerService } from "@/services/customer.service";
import { ApiOrderService } from "@/services/order.service";
import { ApiInvoiceService } from "@/services/invoice.service";
import { ApiMessageTemplateService } from "@/services/message-template.service";
import { ApiAdminService, type AdminBusinessDetail } from "@/services/admin.service";
import type { MessageTemplate } from "@/types/message";
import { apiFetch } from "@/lib/api-client";
import { BusinessDTO } from "@/services/business.service";
import {
  createBackupRecord,
  createInitialAppStorageState,
  createSuperAdminActionLog,
  writeAppStorageState,
} from "@/lib/storage-service";
import { canCreateCustomer as canCreateCustomerByState, canCreateInvoice, canCreateOrder as canCreateOrderByState, canAccessWriteMode as canWriteMode, getCustomerUsage, getReadOnlyReason, getSubscriptionForBusiness, getOrderUsage } from "@/lib/subscription";
import type { AppStorageState, AuthUser } from "@/types/app-state";
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
  email: string;
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
  completeOnboarding: (payload: OnboardingPayload) => Promise<BusinessDTO | undefined>;
  registerOwner: (payload: RegisterOwnerInput) => Promise<{ ok: true; user: AuthUser } | { ok: false; message: string }>;
  login: (payload: LoginInput) => Promise<{ ok: true; user: AuthUser } | { ok: false; message: string }>;
  requestForgotPassword: (email: string) => Promise<{ ok: true; message: string } | { ok: false; message: string }>;
  resetPassword: (payload: ResetPasswordInput) => Promise<{ ok: true } | { ok: false; message: string }>;
  logout: () => Promise<void>;
  createCustomer: (payload: CustomerInput) => Promise<Customer>;
  updateCustomer: (id: string, payload: CustomerInput) => Promise<Customer | null>;
  deleteCustomer: (id: string) => Promise<void>;
  createOrder: (payload: OrderInput) => Promise<Order>;
  updateOrder: (id: string, payload: Partial<OrderInput>) => Promise<Order | null>;
  deleteOrder: (id: string) => Promise<void>;
  createInvoiceFromOrder: (orderId: string, notes?: string) => Promise<Invoice | null>;
  createMessageTemplate: (payload: { category: string; title: string; content: string }) => Promise<MessageTemplate>;
  updateMessageTemplate: (id: string, payload: { title: string; content: string }) => Promise<MessageTemplate | null>;
  deleteMessageTemplate: (id: string) => Promise<void>;
  submitPublicOrder: (input: PublicOrderInput) => Promise<unknown>;
  createBackup: () => BackupRecord;
  restoreBackup: (backupPayload: string) => boolean;
  requestUpgrade: (toPlan: PlanCode, paymentNote?: string) => Promise<UpgradeRequest>;
  approveUpgrade: (requestId: string, adminNote?: string) => Promise<null>;
  rejectUpgrade: (requestId: string, adminNote?: string) => Promise<null>;
  extendTrial: (businessId: string, extraDays: number) => Promise<null>;
  suspendBusiness: (businessId: string, reason?: string) => Promise<null>;
  reactivateBusiness: (businessId: string) => Promise<null>;
  downloadBusinessBackup: (businessId: string, businessSlug: string) => Promise<void>;
  deleteBusiness: (businessId: string) => Promise<null>;
  inviteTeamMember: (payload: Omit<AuthUser, "id" | "trialUsed" | "isActive" | "createdAt" | "updatedAt">) => Promise<AuthUser>;
  updateTeamMember: (updatedMember: AuthUser) => Promise<AuthUser>;
  deleteTeamMember: (id: string) => Promise<void>;
};

const AppDataContext = createContext<AppDataContextValue | null>(null);



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
  const queryClient = useQueryClient();

  const fetchAllData = useCallback(async () => {
    try {
      const user = await authService.getCurrentUser();
      if (!user) return;

      if (user.role === "SUPER_ADMIN") {
        const [businessesResponse, upgradesResponse] = await Promise.all([
          ApiAdminService.fetchBusinesses(1, 100, "", "", ""),
          ApiAdminService.fetchUpgradeRequests(1, 100)
        ]);

        const mappedBusinesses = (businessesResponse.data || []).map((b: AdminBusinessDetail) => ({
          business: b,
          owner: (b.users?.find((u) => u.role === "OWNER") ?? null) as AuthUser | null,
          subscription: b.subscriptions?.[0] ?? null,
          customerCount: b._count?.customers ?? 0,
          backupCount: 0,
          latestBackup: null,
        }));

        setState((prev) => ({
          ...prev,
          businessDirectory: mappedBusinesses,
          upgradeRequests: upgradesResponse.data || [],
        }));
      } else {
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
          subscriptions: (business as Business & { subscriptions?: BusinessSubscription[] }).subscriptions || prev.subscriptions,
          upgradeRequests: (business as Business & { upgradeRequests?: UpgradeRequest[] }).upgradeRequests || prev.upgradeRequests,
        }));
      }
    } catch (err) {
      console.error("Failed to load backend data", err);
    }
  }, []);

  useEffect(() => {
    async function init() {
      const user = await authService.getCurrentUser();
      if (user) {
        const onboardingCompleted = user.onboardingCompleted ?? false;

        let businessData = null;
        if (user.role !== "SUPER_ADMIN") {
          try {
            businessData = await businessService.getBusinessById("");
          } catch {
          }
        }

        setState((prev) => ({
          ...prev,
          business: businessData || prev.business,
          subscriptions: businessData ? (businessData as Business & { subscriptions?: BusinessSubscription[] }).subscriptions || prev.subscriptions : prev.subscriptions,
          upgradeRequests: businessData ? (businessData as Business & { upgradeRequests?: UpgradeRequest[] }).upgradeRequests || prev.upgradeRequests : prev.upgradeRequests,
          auth: {
            ...prev.auth,
            currentUserId: user.id,
            onboardingCompleted,
            users: [user],
          },
        }));
      }
      setHydrated(true);
    }
    init();
  }, []);



  // Removed state sync to localStorage to ensure backend is the sole source of truth

  function setAppState(updater: (current: AppStorageState) => AppStorageState) {
    setState((current) => updater(current));
  }

  // Live queries from React Query
  const { data: queryBusiness } = useQuery({
    queryKey: ["business", state.auth.currentUserId],
    queryFn: () => businessService.getBusinessById(""),
    enabled: hydrated && !!state.auth.currentUserId && state.auth.users.find(u => u.id === state.auth.currentUserId)?.role !== "SUPER_ADMIN",
    staleTime: 5 * 60 * 1000, // 5 minutes stale time for business settings
  });

  const business = queryBusiness || state.business;

  const { data: queryOrders } = useQuery({
    queryKey: ["orders", business?.id],
    queryFn: () => orderService.getOrders(business?.id || ""),
    enabled: hydrated && !!state.auth.currentUserId && !!business?.id && business.id !== "biz_default",
  });

  const orders = queryOrders || state.orders;

  const { data: queryCustomers } = useQuery({
    queryKey: ["customers", business?.id],
    queryFn: () => customerService.getCustomers(business?.id || ""),
    enabled: hydrated && !!state.auth.currentUserId && !!business?.id && business.id !== "biz_default",
  });

  const customers = queryCustomers || state.customers;

  const { data: queryInvoices } = useQuery({
    queryKey: ["invoices", business?.id],
    queryFn: () => invoiceService.getInvoices(business?.id || ""),
    enabled: hydrated && !!state.auth.currentUserId && !!business?.id && business.id !== "biz_default",
  });

  const invoices = queryInvoices || state.invoices;

  const { data: queryMessageTemplates } = useQuery({
    queryKey: ["messageTemplates", business?.id],
    queryFn: () => messageTemplateService.getTemplates(business?.id || ""),
    enabled: hydrated && !!state.auth.currentUserId && !!business?.id && business.id !== "biz_default",
    staleTime: 5 * 60 * 1000, // 5 minutes stale time for message templates
  });

  const messageTemplates = queryMessageTemplates || state.messageTemplates;

  const currentUser = useMemo(() => state.auth.users.find((user) => user.id === state.auth.currentUserId) ?? null, [state.auth.currentUserId, state.auth.users]);
  const subscriptionForCurrentBusiness = useMemo(
    () => getSubscriptionForBusiness(state.subscriptions, business.id),
    [business.id, state.subscriptions]
  );
  const currentUserRole = currentUser?.role ?? null;
  const isSuperAdmin = currentUserRole === "SUPER_ADMIN";
  const currentBusinessUsage = useMemo(
    () => getCustomerUsage({ business, customers, subscriptions: state.subscriptions }),
    [business, customers, state.subscriptions]
  );
  const currentOrderUsage = useMemo(
    () => getOrderUsage({ business, subscriptions: state.subscriptions, orders }),
    [business, state.subscriptions, orders]
  );
  const canCreateCustomer = canCreateCustomerByState({ business, customers, subscriptions: state.subscriptions });
  const canCreateOrder = canCreateOrderByState({ business, subscriptions: state.subscriptions, orders });
  const canCreateInvoiceValue = canCreateInvoice({ business, subscriptions: state.subscriptions });
  const canAccessWriteMode = canWriteMode(subscriptionForCurrentBusiness);
  const readOnlyReason = getReadOnlyReason(subscriptionForCurrentBusiness);

  const businessDirectory = useMemo(
    () => {
      if (currentUserRole === "SUPER_ADMIN") {
        return state.businessDirectory || [];
      }
      return [
        {
          business,
          owner: state.auth.users.find((user) => user.role === "OWNER" && user.businessId === business.id) ?? null,
          subscription: subscriptionForCurrentBusiness,
          customerCount: customers.length,
          backupCount: state.backupRecords.filter((record) => record.businessId === business.id).length,
          latestBackup:
            state.backupRecords
              .filter((record) => record.businessId === business.id)
              .sort((left, right) => right.createdAt.localeCompare(left.createdAt))[0] ?? null,
        },
      ];
    },
    [currentUserRole, state, subscriptionForCurrentBusiness, business, customers]
  );

  const updateBusiness = useCallback(async (payload: Partial<Business>) => {
    if (!canAccessWriteMode) {
      throw new Error(readOnlyReason || "Mode baca saja aktif.");
    }
    const updated = await businessService.updateBusiness(state.business.id, payload);
    if (updated) {
      setState((current) => ({
        ...current,
        business: updated,
      }));
      queryClient.invalidateQueries({ queryKey: ["business"] });
    }
  }, [canAccessWriteMode, readOnlyReason, state.business.id, queryClient]);

  const saveBusinessSettings = useCallback(async (payload: BusinessSettingsInput) => {
    if (!canAccessWriteMode) {
      throw new Error(readOnlyReason || "Mode baca saja aktif.");
    }
    const updated = await businessService.updateBusiness(state.business.id, payload);
    if (updated) {
      setState((current) => ({
        ...current,
        business: updated,
      }));
      queryClient.invalidateQueries({ queryKey: ["business"] });
    }
  }, [canAccessWriteMode, readOnlyReason, state.business.id, queryClient]);

  const completeOnboarding = useCallback(async (payload: OnboardingPayload) => {
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
      await fetchAllData();
      return response;
    }
  }, [fetchAllData]);

  const registerOwner = useCallback(async (payload: RegisterOwnerInput) => {
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
  }, []);

  const login = useCallback(async (payload: LoginInput) => {
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
        await fetchAllData();
      }
    }
    return result;
  }, [fetchAllData]);

  const logout = useCallback(async () => {
    await authService.logout();
    setState(createInitialAppStorageState());
    queryClient.clear();
  }, [queryClient]);

  useEffect(() => {
    const handleUnauthorized = () => {
      logout();
    };
    if (typeof window !== "undefined") {
      window.addEventListener("rapiin-unauthorized", handleUnauthorized);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("rapiin-unauthorized", handleUnauthorized);
      }
    };
  }, [logout]);

  const inviteTeamMember = useCallback(async () => {
    throw new Error("inviteTeamMember is not implemented. Use teamService instead.");
  }, []);

  const updateTeamMember = useCallback(async () => {
    throw new Error("updateTeamMember is not implemented. Use teamService instead.");
  }, []);

  const deleteTeamMember = useCallback(async () => {
    throw new Error("deleteTeamMember is not implemented. Use teamService instead.");
  }, []);

  const requestForgotPassword = useCallback(async (email: string) => {
    return authService.requestForgotPassword(email);
  }, []);

  const resetPassword = useCallback(async (payload: ResetPasswordInput) => {
    return authService.resetPassword(payload.email, payload.token, payload.newPassword);
  }, []);

  const createCustomer = useCallback(async (payload: CustomerInput) => {
    if (!canAccessWriteMode) {
      throw new Error(readOnlyReason || "Mode baca saja aktif.");
    }
    if (!canCreateCustomer) {
      throw new Error(`Batas customer plan ini sudah penuh (${currentBusinessUsage.used}/${currentBusinessUsage.limit}).`);
    }
    const customer = await customerService.createCustomer({
      ...payload,
      businessId: state.business.id,
    });
    setState((current) => ({
      ...current,
      customers: [...current.customers, customer],
    }));
    queryClient.invalidateQueries({ queryKey: ["customers"] });
    return customer;
  }, [canAccessWriteMode, readOnlyReason, canCreateCustomer, currentBusinessUsage, state.business.id, queryClient]);

  const updateCustomer = useCallback(async (id: string, payload: CustomerInput) => {
    if (!canAccessWriteMode) {
      throw new Error(readOnlyReason || "Mode baca saja aktif.");
    }
    const customer = await customerService.updateCustomer(id, payload);
    if (customer) {
      setState((current) => ({
        ...current,
        customers: current.customers.map((c) => (c.id === id ? customer : c)),
      }));
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    }
    return customer;
  }, [canAccessWriteMode, readOnlyReason, queryClient]);

  const deleteCustomer = useCallback(async (id: string) => {
    if (!canAccessWriteMode) {
      throw new Error(readOnlyReason || "Mode baca saja aktif.");
    }
    await customerService.deleteCustomer(id);
    setState((current) => ({
      ...current,
      customers: current.customers.filter((c) => c.id !== id),
    }));
    queryClient.invalidateQueries({ queryKey: ["customers"] });
  }, [canAccessWriteMode, readOnlyReason, queryClient]);

  const createOrder = useCallback(async (payload: OrderInput) => {
    if (!canCreateOrder) {
      throw new Error(readOnlyReason || "Mode baca saja aktif.");
    }
    const order = await orderService.createOrder({
      ...payload,
      businessId: state.business.id,
    });
    setState((current) => ({
      ...current,
      orders: [...current.orders, order],
    }));
    queryClient.invalidateQueries({ queryKey: ["orders"] });
    return order;
  }, [canCreateOrder, readOnlyReason, state.business.id, queryClient]);

  const updateOrder = useCallback(async (id: string, payload: Partial<OrderInput>) => {
    if (!canAccessWriteMode) {
      throw new Error(readOnlyReason || "Mode baca saja aktif.");
    }
    const order = await orderService.updateOrder(id, payload);
    if (order) {
      setState((current) => ({
        ...current,
        orders: current.orders.map((o) => (o.id === id ? order : o)),
      }));
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    }
    return order;
  }, [canAccessWriteMode, readOnlyReason, queryClient]);

  const deleteOrder = useCallback(async (id: string) => {
    if (!canAccessWriteMode) {
      throw new Error(readOnlyReason || "Mode baca saja aktif.");
    }
    await orderService.deleteOrder(id);
    setState((current) => ({
      ...current,
      orders: current.orders.filter((o) => o.id !== id),
    }));
    queryClient.invalidateQueries({ queryKey: ["orders"] });
  }, [canAccessWriteMode, readOnlyReason, queryClient]);

  const createInvoiceFromOrder = useCallback(async (orderId: string, notes?: string) => {
    if (!canCreateInvoiceValue) {
      throw new Error(readOnlyReason || "Mode baca saja aktif.");
    }
    const invoice = await invoiceService.createInvoiceFromOrder(orderId, notes);
    if (invoice) {
      const [orders, invoices] = await Promise.all([
        orderService.getOrders(state.business.id),
        invoiceService.getInvoices(state.business.id),
      ]);
      setState((current) => ({
        ...current,
        orders,
        invoices,
      }));
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    }
    return invoice;
  }, [canCreateInvoiceValue, readOnlyReason, state.business.id, queryClient]);

  const createMessageTemplate = useCallback(async (payload: { category: string; title: string; content: string }) => {
    if (!canAccessWriteMode) {
      throw new Error(readOnlyReason || "Mode baca saja aktif.");
    }
    const newTemplate = await messageTemplateService.createTemplate(payload);
    setState((current) => ({
      ...current,
      messageTemplates: [...current.messageTemplates, newTemplate],
    }));
    queryClient.invalidateQueries({ queryKey: ["messageTemplates"] });
    return newTemplate;
  }, [canAccessWriteMode, readOnlyReason, queryClient]);

  const updateMessageTemplate = useCallback(async (id: string, payload: { title: string; content: string }) => {
    if (!canAccessWriteMode) {
      throw new Error(readOnlyReason || "Mode baca saja aktif.");
    }
    const updated = await messageTemplateService.updateTemplate(id, payload);
    if (updated) {
      setState((current) => ({
        ...current,
        messageTemplates: current.messageTemplates.map((t) => (t.id === id ? updated : t)),
      }));
      queryClient.invalidateQueries({ queryKey: ["messageTemplates"] });
    }
    return updated;
  }, [canAccessWriteMode, readOnlyReason, queryClient]);

  const deleteMessageTemplate = useCallback(async (id: string) => {
    if (!canAccessWriteMode) {
      throw new Error(readOnlyReason || "Mode baca saja aktif.");
    }
    await messageTemplateService.deleteTemplate(id);
    setState((current) => ({
      ...current,
      messageTemplates: current.messageTemplates.filter((t) => t.id !== id),
    }));
    queryClient.invalidateQueries({ queryKey: ["messageTemplates"] });
  }, [canAccessWriteMode, readOnlyReason, queryClient]);



  const submitPublicOrder = useCallback(async (input: PublicOrderInput) => {
    const response = await apiFetch<unknown>(`/api/public/b/${state.business.slug}/submit`, {
      method: "POST",
      body: JSON.stringify({
        mode: state.business.mode,
        operationalModel: state.business.operationalModel,
        payload: input.payload,
      }),
    });
    return response;
  }, [state.business.slug, state.business.mode, state.business.operationalModel]);

  const createBackup = useCallback(() => {
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
  }, [state.business, state.customers, state.orders, state.invoices, state.messageTemplates, state.publicSubmissions, state.version]);

  const restoreBackup = useCallback((backupPayload: string): boolean => {
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
  }, []);

  const requestUpgrade = useCallback(async (toPlan: PlanCode, paymentNote?: string) => {
    const currentUserId = state.auth.currentUserId;
    if (!currentUserId) {
      throw new Error("Kamu harus login dulu.");
    }

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

    await fetchAllData();
    return nextRequest;
  }, [state.auth.currentUserId, state.business.id, state.upgradeRequests, fetchAllData]);

  const approveUpgrade = useCallback(async (requestId: string, adminNote?: string) => {
    try {
      await ApiAdminService.approveUpgrade(requestId, adminNote);
      if (state.auth.currentUserId) {
        await fetchAllData();
      }
    } catch (err) {
      console.error("Failed to approve upgrade request", err);
      throw err;
    }
    return null;
  }, [state.auth.currentUserId, fetchAllData]);

  const rejectUpgrade = useCallback(async (requestId: string, adminNote?: string) => {
    try {
      await ApiAdminService.rejectUpgrade(requestId, adminNote);
      if (state.auth.currentUserId) {
        await fetchAllData();
      }
    } catch (err) {
      console.error("Failed to reject upgrade request", err);
      throw err;
    }
    return null;
  }, [state.auth.currentUserId, fetchAllData]);

  const extendTrial = useCallback(async (businessId: string, extraDays: number) => {
    try {
      await ApiAdminService.extendTrial(businessId, extraDays);
      if (state.auth.currentUserId) {
        await fetchAllData();
      }
    } catch (err) {
      console.error("Failed to extend trial", err);
      throw err;
    }
    return null;
  }, [state.auth.currentUserId, fetchAllData]);

  const suspendBusiness = useCallback(async (businessId: string, reason?: string) => {
    try {
      await ApiAdminService.suspendBusiness(businessId, reason);
      if (state.auth.currentUserId) {
        await fetchAllData();
      }
    } catch (err) {
      console.error("Failed to suspend business", err);
      throw err;
    }
    return null;
  }, [state.auth.currentUserId, fetchAllData]);

  const reactivateBusiness = useCallback(async (businessId: string) => {
    try {
      await ApiAdminService.reactivateBusiness(businessId);
      if (state.auth.currentUserId) {
        await fetchAllData();
      }
    } catch (err) {
      console.error("Failed to reactivate business", err);
      throw err;
    }
    return null;
  }, [state.auth.currentUserId, fetchAllData]);

  const downloadBusinessBackup = useCallback(async (businessId: string, businessSlug: string) => {
    try {
      const data = await ApiAdminService.downloadBusinessBackup(businessId);
      if (data) {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `rapiin-backup-${businessSlug}-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
      if (state.auth.currentUserId) {
        await fetchAllData();
      }
    } catch (err) {
      console.error("Failed to download business backup", err);
      throw err;
    }
  }, [state.auth.currentUserId, fetchAllData]);

  const deleteBusiness = useCallback(async (businessId: string) => {
    try {
      await ApiAdminService.deleteBusiness(businessId);
      if (state.auth.currentUserId) {
        await fetchAllData();
      }
    } catch (err) {
      console.error("Failed to delete business", err);
      throw err;
    }
    return null;
  }, [state.auth.currentUserId, fetchAllData]);

  const value: AppDataContextValue = useMemo(() => ({
    ...state,
    business,
    customers,
    orders,
    invoices,
    messageTemplates,
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
    submitPublicOrder,
    createBackup,
    restoreBackup,
    requestUpgrade,
    approveUpgrade,
    rejectUpgrade,
    extendTrial,
    suspendBusiness,
    reactivateBusiness,
    downloadBusinessBackup,
    deleteBusiness,
    inviteTeamMember,
    updateTeamMember,
    deleteTeamMember,
  }), [
    state,
    business,
    customers,
    orders,
    invoices,
    messageTemplates,
    hydrated,
    currentUser,
    currentUserRole,
    isSuperAdmin,
    subscriptionForCurrentBusiness,
    currentBusinessUsage,
    currentOrderUsage,
    canCreateCustomer,
    canCreateOrder,
    canCreateInvoiceValue,
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
    submitPublicOrder,
    createBackup,
    restoreBackup,
    requestUpgrade,
    approveUpgrade,
    rejectUpgrade,
    extendTrial,
    suspendBusiness,
    reactivateBusiness,
    downloadBusinessBackup,
    deleteBusiness,
    inviteTeamMember,
    updateTeamMember,
    deleteTeamMember,
  ]);

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const context = useContext(AppDataContext);

  if (!context) {
    throw new Error("useAppData must be used inside AppDataProvider");
  }

  return context;
}
