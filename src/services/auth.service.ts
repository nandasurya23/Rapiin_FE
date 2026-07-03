import type { Mapper } from "./mapper";
import type { AuthUser } from "@/types/app-state";
import type { UserRole } from "@/types/subscription";

export interface AuthUserDTO {
  id: string;
  name: string;
  email: string;
  phoneNumber: string;
  role: UserRole;
  businessId?: string;
  trialUsed: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export class AuthUserMapper implements Mapper<AuthUserDTO, AuthUser> {
  toDomain(raw: AuthUserDTO): AuthUser {
    return { 
      ...raw,
      password: "redacted" // Password handled securely by backend usually, but local state had it.
    };
  }

  toDTO(domain: AuthUser): AuthUserDTO {
    return { ...domain };
  }
}

export interface AuthService {
  getCurrentUser(): Promise<AuthUser | null>;
  login(identifier: string, password: string): Promise<{ ok: true; user: AuthUser } | { ok: false; message: string }>;
  logout(): Promise<void>;
  register(payload: Omit<AuthUserDTO, "id" | "createdAt" | "updatedAt" | "role" | "isActive" | "trialUsed" | "businessId"> & { password: string }): Promise<{ ok: true; user: AuthUser } | { ok: false; message: string }>;
  resetPassword(identifier: string, password: string): Promise<{ ok: true } | { ok: false; message: string }>;
}
