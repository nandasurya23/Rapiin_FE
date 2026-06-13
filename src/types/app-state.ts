import type { Business } from "@/types/business";
import type { ID } from "@/types/common";
import type { Customer } from "@/types/customer";
import type { Invoice } from "@/types/invoice";
import type { MessageCategory, MessageTemplate } from "@/types/message";
import type { Order } from "@/types/order";
import type {
  BackupRecord,
  BusinessSubscription,
  PlanDefinition,
  SuperAdminActionLog,
  UpgradeRequest,
  UserRole,
} from "@/types/subscription";

export type AuthUser = {
  id: ID;
  name: string;
  email: string;
  phoneNumber: string;
  password: string;
  role: UserRole;
  businessId?: ID;
  trialUsed: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AuthState = {
  currentUserId: ID | null;
  onboardingCompleted: boolean;
  users: AuthUser[];
};

export type PublicSubmission = {
  id: ID;
  businessId: ID;
  customerId: ID;
  orderId: ID;
  mode: Business["mode"];
  operationalModel: Business["operationalModel"];
  payload: Record<string, string>;
  createdAt: string;
  updatedAt: string;
};

export type MessageComposerDraft = {
  activeCategory: MessageCategory;
  selectedCustomerId: ID | null;
  selectedOrderId: ID | null;
  selectedTemplateId: ID | null;
  drafts: Record<
    string,
    {
      title: string;
      content: string;
    }
  >;
};

export type AppStorageState = {
  version: 1;
  business: Business;
  customers: Customer[];
  orders: Order[];
  invoices: Invoice[];
  subscriptions: BusinessSubscription[];
  upgradeRequests: UpgradeRequest[];
  backupRecords: BackupRecord[];
  superAdminLogs: SuperAdminActionLog[];
  messageTemplates: MessageTemplate[];
  publicSubmissions: PublicSubmission[];
  auth: AuthState;
  system: {
    superAdminUserIds: ID[];
    planCatalog: PlanDefinition[];
  };
  ui: {
    messageComposer: MessageComposerDraft;
  };
};
