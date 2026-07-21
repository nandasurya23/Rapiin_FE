import type { Business } from "@/types/business";
import type { ID } from "@/types/common";
import type { MessageCategory } from "@/types/message";
import type {
  BackupRecord,
  BusinessSubscription,
  PlanDefinition,
  SuperAdminActionLog,
  UpgradeRequest,
  UserRole,
} from "@/types/subscription";

import type { AppPermission } from "@/types/permission";

export type AuthUser = {
  id: ID;
  name: string;
  email: string;
  phoneNumber: string;
  role: UserRole;
  businessId?: ID;
  trialUsed: boolean;
  isActive: boolean;
  onboardingCompleted?: boolean;
  createdAt: string;
  updatedAt: string;
  status?: "ACTIVE" | "PENDING" | "SUSPENDED";
  joinedAt?: string;
  lastActiveAt?: string;
  permissions?: AppPermission[];
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
  subscriptions: BusinessSubscription[];
  upgradeRequests: UpgradeRequest[];
  backupRecords: BackupRecord[];
  superAdminLogs: SuperAdminActionLog[];
  auth: AuthState;
  system: {
    superAdminUserIds: ID[];
    planCatalog: PlanDefinition[];
  };

  businessDirectory?: Array<{
    business: Business;
    owner: AuthUser | null;
    subscription: BusinessSubscription | null;
    customerCount: number;
    backupCount: number;
    latestBackup: BackupRecord | null;
  }>;
};
