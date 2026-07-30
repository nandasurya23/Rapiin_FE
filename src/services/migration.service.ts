import { apiFetch } from "@/lib/api-client";
import { BusinessMode, OperationalModel, PaymentTiming } from "@/types/business";

export type MigrationRequestStatus = 
  | "DRAFT"
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "READY_TO_EXECUTE"
  | "EXECUTING"
  | "COMPLETED"
  | "REJECTED"
  | "CANCELLED"
  | "FAILED";

export type MigrationRiskScore = "LOW" | "MEDIUM" | "HIGH";

export interface CreateMigrationPayload {
  mode: BusinessMode;
  operationalModel: OperationalModel;
  paymentTiming: PaymentTiming;
  usesResources: boolean;
  autoCreateOrderFromSubmission: boolean;
  reason: string;
  ownerConsent: boolean;
}

export interface BusinessMigrationRequestDTO {
  id: string;
  businessId: string;
  requestedByUserId: string;
  status: MigrationRequestStatus;
  currentConfig: Record<string, unknown>;
  requestedConfig: Record<string, unknown>;
  reason: string;
  ownerConsent: boolean;
  riskScore: MigrationRiskScore;
  riskAnalysis?: Record<string, unknown>;
  adminNotes?: string;
  executionReport?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  executedAt?: string;
}

export class MigrationService {
  async createRequest(payload: CreateMigrationPayload): Promise<BusinessMigrationRequestDTO> {
    return apiFetch<BusinessMigrationRequestDTO>("/api/business/migration", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async listOwnerRequests(): Promise<BusinessMigrationRequestDTO[]> {
    return apiFetch<BusinessMigrationRequestDTO[]>("/api/business/migration");
  }

  async cancelRequest(id: string): Promise<BusinessMigrationRequestDTO> {
    return apiFetch<BusinessMigrationRequestDTO>(`/api/business/migration/${id}/cancel`, {
      method: "POST",
    });
  }
}

export const migrationService = new MigrationService();
