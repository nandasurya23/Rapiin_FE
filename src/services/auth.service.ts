import type { Mapper } from "./mapper";
import type { AuthUser } from "@/types/app-state";
import type { UserRole } from "@/types/subscription";
import { apiFetch } from "@/lib/api-client";
import type { AppPermission } from "@/types/permission";

export interface AuthUserDTO {
  id: string;
  name: string;
  email: string;
  phoneNumber: string;
  role: UserRole;
  businessId?: string;
  trialUsed: boolean;
  isActive: boolean;
  onboardingCompleted?: boolean;
  createdAt: string;
  updatedAt: string;
  status?: "ACTIVE" | "PENDING" | "SUSPENDED";
  joinedAt?: string;
  lastActiveAt?: string;
  permissions?: AppPermission[];
}

export class AuthUserMapper implements Mapper<AuthUserDTO, AuthUser> {
  toDomain(raw: AuthUserDTO): AuthUser {
    return { ...raw };
  }

  toDTO(domain: AuthUser): AuthUserDTO {
    return { ...domain };
  }
}

export interface AuthService {
  getCurrentUser(): Promise<AuthUser | null>;
  login(identifier: string, password: string): Promise<{ ok: true; user: AuthUser } | { ok: false; message: string }>;
  logout(): Promise<void>;
  register(payload: { name: string; email: string; phoneNumber: string; password: string }): Promise<{ ok: true; user: AuthUser } | { ok: false; message: string }>;
  requestForgotPassword(email: string): Promise<{ ok: true; message: string } | { ok: false; message: string }>;
  resetPassword(email: string, token: string, newPassword: string): Promise<{ ok: true } | { ok: false; message: string }>;
}

export class ApiAuthService implements AuthService {
  private mapper = new AuthUserMapper();

  /**
   * Get current user from the server using the JWT cookie.
   * No localStorage — the HttpOnly cookie is the source of truth.
   */
  async getCurrentUser(): Promise<AuthUser | null> {
    if (typeof window === "undefined") return null;
    try {
      const response = await apiFetch<{ user: AuthUserDTO | null }>("/api/auth/me");
      if (!response || !response.user) return null;
      return this.mapper.toDomain(response.user);
    } catch {
      return null;
    }
  }

  /**
   * Login with email OR phone number.
   * BE accepts both formats via the `email` field.
   */
  async login(identifier: string, password: string): Promise<{ ok: true; user: AuthUser } | { ok: false; message: string }> {
    try {
      const response = await apiFetch<{ user: AuthUserDTO }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: identifier, password }),
      });
      return { ok: true, user: this.mapper.toDomain(response.user) };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal masuk.";
      return { ok: false, message: msg };
    }
  }

  async logout(): Promise<void> {
    try {
      // Clear cookie server-side
      await apiFetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Ignore errors — cookie may already be expired
    }
  }

  async register(payload: { name: string; email: string; phoneNumber: string; password: string }): Promise<{ ok: true; user: AuthUser } | { ok: false; message: string }> {
    try {
      const response = await apiFetch<{ user: AuthUserDTO }>("/api/auth/register", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      return { ok: true, user: this.mapper.toDomain(response.user) };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Pendaftaran gagal.";
      return { ok: false, message: msg };
    }
  }

  /**
   * Request password reset.
   * OTP 6-digit dibuat di server dan disimpan di DB.
   * Admin akan mengirimkan kode ke user via WhatsApp dari Super Admin Dashboard.
   */
  async requestForgotPassword(email: string): Promise<{ ok: true; message: string } | { ok: false; message: string }> {
    try {
      const response = await apiFetch<{ message: string }>("/api/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      return { ok: true, message: response.message };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal mengirim permintaan reset password.";
      return { ok: false, message: msg };
    }
  }

  /**
   * Reset password using the token/OTP and user's email.
   */
  async resetPassword(email: string, token: string, newPassword: string): Promise<{ ok: true } | { ok: false; message: string }> {
    try {
      await apiFetch("/api/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ email, token, newPassword }),
      });
      return { ok: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal mereset password.";
      return { ok: false, message: msg };
    }
  }
}
