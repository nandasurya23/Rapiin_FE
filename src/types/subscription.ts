import type { ID, Timestamped } from "@/types/common";

export type UserRole = "OWNER" | "SUPER_ADMIN";

export type PlanCode = "FREE_TRIAL" | "PRO" | "PREMIUM";

export type SubscriptionStatus =
  | "TRIAL_ACTIVE"
  | "TRIAL_EXPIRED"
  | "PENDING_UPGRADE_APPROVAL"
  | "ACTIVE"
  | "SUSPENDED";

export type BackupType = "MANUAL";

export type UpgradeRequestStatus = "PENDING" | "APPROVED" | "REJECTED" | "EXPIRED";

export type PlanDefinition = {
  code: PlanCode;
  label: string;
  trialDays?: number;
  customerLimit: number;
  features: string[];
  requiresManualApproval: boolean;
  readLimitedAfterExpiry: boolean;
};

export type BusinessSubscription = Timestamped & {
  id: ID;
  businessId: ID;
  planCode: PlanCode;
  status: SubscriptionStatus;
  startedAt: string;
  expiresAt: string;
  customerLimit: number;
  hasCompletedRequiredBackup: boolean;
  lastBackupAt?: string;
  readOnlyReason?: string;
};

export type BackupRecord = Timestamped & {
  id: ID;
  businessId: ID;
  type: BackupType;
  snapshotVersion: number;
  summary: string;
  payload: string;
};

export type UpgradeRequest = Timestamped & {
  id: ID;
  businessId: ID;
  requestedByUserId: ID;
  fromPlan: PlanCode;
  toPlan: PlanCode;
  status: UpgradeRequestStatus;
  requestedAt: string;
  reviewedAt?: string;
  reviewedByUserId?: ID;
  paymentNote?: string;
  adminNote?: string;
};

export type SuperAdminActionLog = Timestamped & {
  id: ID;
  actorUserId: ID;
  targetBusinessId: ID;
  actionType:
    | "APPROVE_UPGRADE"
    | "REJECT_UPGRADE"
    | "EXTEND_TRIAL"
    | "SUSPEND_BUSINESS"
    | "REACTIVATE_BUSINESS"
    | "CREATE_BACKUP";
  metadata?: Record<string, string>;
};
