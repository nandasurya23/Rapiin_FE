import { apiFetch } from "@/lib/api-client";
import type { Business } from "@/types/business";
import type { BusinessSubscription, UpgradeRequest } from "@/types/subscription";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  phoneNumber?: string | null;
  role: string;
  isActive: boolean;
}

export interface AdminBusinessDetail extends Business {
  users?: AdminUser[];
  subscriptions?: BusinessSubscription[];
  upgradeRequests?: UpgradeRequest[];
  teamMembers?: Array<{
    id: string;
    userId: string;
    staffRole: "MANAGER" | "STAFF";
    status: "PENDING" | "ACTIVE" | "SUSPENDED";
    joinedAt: string | null;
    createdAt: string;
    user: {
      id: string;
      email: string;
      name: string;
      phoneNumber: string | null;
      isActive: boolean;
      lastLoginAt: string | null;
    };
  }>;
  _count?: {
    customers: number;
    orders: number;
    invoices: number;
  };
}

export interface AdminBusinessRow {
  business: Business & {
    users?: AdminUser[];
    subscriptions?: BusinessSubscription[];
    _count?: {
      customers: number;
    };
  };
  owner: AdminUser | null;
  subscription: BusinessSubscription | null;
  customerCount: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta?: {
    total: number;
  };
}

export interface AdminUpgradeRequestRow extends UpgradeRequest {
  business?: {
    id: string;
    name: string;
    users?: AdminUser[];
  };
}

export interface AdminResetRequestRow {
  id: string;
  userId: string;
  tokenHash: string;
  plainToken: string | null;
  expiresAt: string;
  createdAt: string;
  user: {
    id: string;
    email: string;
    name: string;
    phoneNumber: string | null;
    role: string;
    isActive: boolean;
  };
}

export class ApiAdminService {
  static async fetchResetRequests(page: number, limit: number): Promise<PaginatedResponse<AdminResetRequestRow>> {
    return apiFetch<PaginatedResponse<AdminResetRequestRow>>(
      `/api/admin/reset-requests?page=${page}&limit=${limit}`,
      { rawResponse: true }
    );
  }

  static async deleteResetRequest(requestId: string): Promise<unknown> {
    return apiFetch<unknown>(`/api/admin/reset-requests/${requestId}`, {
      method: "DELETE",
    });
  }

  static async fetchBusinesses(
    page: number,
    limit: number,
    search: string,
    planFilter: string,
    statusFilter: string
  ): Promise<PaginatedResponse<AdminBusinessDetail>> {
    return apiFetch<PaginatedResponse<AdminBusinessDetail>>(
      `/api/admin/businesses?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}&planCode=${planFilter}&status=${statusFilter}`,
      { rawResponse: true }
    );
  }

  static async fetchUpgradeRequests(page: number, limit: number): Promise<PaginatedResponse<AdminUpgradeRequestRow>> {
    return apiFetch<PaginatedResponse<AdminUpgradeRequestRow>>(
      `/api/admin/upgrades?page=${page}&limit=${limit}`,
      { rawResponse: true }
    );
  }

  static async fetchBusinessDetail(businessId: string): Promise<AdminBusinessDetail> {
    return apiFetch<AdminBusinessDetail>(`/api/admin/businesses/${businessId}`);
  }

  static async approveUpgrade(requestId: string, adminNote?: string): Promise<unknown> {
    return apiFetch<unknown>(`/api/admin/upgrades/${requestId}/approve`, {
      method: "POST",
      body: JSON.stringify({ adminNote }),
    });
  }

  static async rejectUpgrade(requestId: string, adminNote?: string): Promise<unknown> {
    return apiFetch<unknown>(`/api/admin/upgrades/${requestId}/reject`, {
      method: "POST",
      body: JSON.stringify({ adminNote }),
    });
  }

  static async extendTrial(businessId: string, extraDays: number): Promise<unknown> {
    return apiFetch<unknown>(`/api/admin/businesses/${businessId}/extend-trial`, {
      method: "POST",
      body: JSON.stringify({ extraDays }),
    });
  }

  static async suspendBusiness(businessId: string, reason?: string): Promise<unknown> {
    return apiFetch<unknown>(`/api/admin/businesses/${businessId}/suspend`, {
      method: "PUT",
      body: JSON.stringify({ reason }),
    });
  }

  static async reactivateBusiness(businessId: string): Promise<unknown> {
    return apiFetch<unknown>(`/api/admin/businesses/${businessId}/reactivate`, {
      method: "PUT",
    });
  }

  static async downloadBusinessBackup(businessId: string): Promise<unknown> {
    return apiFetch<unknown>(`/api/admin/businesses/${businessId}/backup`);
  }

  static async deleteBusiness(businessId: string): Promise<unknown> {
    return apiFetch<unknown>(`/api/admin/businesses/${businessId}`, {
      method: "DELETE",
    });
  }
}
