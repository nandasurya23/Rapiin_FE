import type { Mapper } from "./mapper";
import type { AuthUser } from "@/types/app-state";
import type { UserRole } from "@/types/subscription";
import { apiFetch } from "@/lib/api-client";

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
  resetPassword(token: string, newPassword: string): Promise<{ ok: true } | { ok: false; message: string }>;
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
   * Request password reset email.
   * Sends a reset token to the registered email address.
   *
   * Production (RESEND_API_KEY set): sends real email with clickable link.
   * Development (no API key): returns devRawToken so FE can show a direct link button.
   */
  async requestForgotPassword(email: string): Promise<{ ok: true; message: string; devResetUrl?: string } | { ok: false; message: string }> {
    try {
      const response = await apiFetch<{ message: string; devRawToken?: string }>("/api/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      // Build the dev reset URL from the raw token so FE can render a direct button
      const devResetUrl = response.devRawToken
        ? `/auth/reset-password?token=${encodeURIComponent(response.devRawToken)}`
        : undefined;

      if (devResetUrl && process.env.NODE_ENV === "development") {
        console.info("[DEV] Reset URL (klik atau copy ke browser):", devResetUrl);
      }
      return { ok: true, message: response.message, devResetUrl };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal mengirim permintaan reset password.";
      return { ok: false, message: msg };
    }
  }

  /**
   * Reset password using the token received via email (or dev console).
   */
  async resetPassword(token: string, newPassword: string): Promise<{ ok: true } | { ok: false; message: string }> {
    try {
      await apiFetch("/api/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, newPassword }),
      });
      return { ok: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal mereset password.";
      return { ok: false, message: msg };
    }
  }
}
