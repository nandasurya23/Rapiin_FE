import { readAppStorageState, writeAppStorageState, createAuthUser, createBusinessSubscriptionRecord } from "@/lib/storage-service";
import type { AuthService, AuthUserDTO } from "./auth.service";
import { AuthUserMapper } from "./auth.service";
import type { AuthUser } from "@/types/app-state";

export class LocalAuthService implements AuthService {
  private mapper = new AuthUserMapper();

  private normalizeIdentifier(value: string) {
    return value.toLowerCase().trim();
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    const state = readAppStorageState();
    if (!state.auth.currentUserId) return null;
    const user = state.auth.users.find((u) => u.id === state.auth.currentUserId);
    return user ? this.mapper.toDomain(this.mapper.toDTO(user)) : null;
  }

  async login(identifier: string, password: string): Promise<{ ok: true; user: AuthUser } | { ok: false; message: string }> {
    const state = readAppStorageState();
    const normalizedIdentifier = this.normalizeIdentifier(identifier);
    const user = state.auth.users.find(
      (item) =>
        (item.email.toLowerCase() === normalizedIdentifier || item.phoneNumber === identifier.trim()) &&
        item.password === password
    );

    if (!user) {
      return { ok: false, message: "Akun tidak ditemukan atau password salah." };
    }

    if (!user.isActive) {
      return { ok: false, message: "Akun ini sedang tidak aktif." };
    }

    state.business.ownerName = user.role === "OWNER" ? user.name : state.business.ownerName;
    state.auth.currentUserId = user.id;

    writeAppStorageState(state);

    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("rapiin-storage-sync"));
    }

    return { ok: true, user: this.mapper.toDomain(this.mapper.toDTO(user)) };
  }

  async logout(): Promise<void> {
    const state = readAppStorageState();
    state.auth.currentUserId = null;
    writeAppStorageState(state);

    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("rapiin-storage-sync"));
    }
  }

  async register(payload: Omit<AuthUserDTO, "id" | "createdAt" | "updatedAt" | "role" | "isActive" | "trialUsed" | "businessId"> & { password: string }): Promise<{ ok: true; user: AuthUser } | { ok: false; message: string }> {
    const state = readAppStorageState();
    const normalizedEmail = this.normalizeIdentifier(payload.email);
    const normalizedPhoneNumber = payload.phoneNumber.trim();
    const existingEmail = state.auth.users.find((user) => user.email.toLowerCase() === normalizedEmail);
    if (existingEmail) {
      return { ok: false, message: "Email ini sudah terdaftar." };
    }

    const existingPhone = state.auth.users.find((user) => user.phoneNumber === normalizedPhoneNumber);
    if (existingPhone) {
      return { ok: false, message: "Nomor WhatsApp ini sudah dipakai untuk akun bisnis lain." };
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

    state.business.ownerName = nextUser.name;
    state.business.updatedAt = new Date().toISOString();

    state.subscriptions = state.subscriptions.map((subscription) =>
      subscription.businessId === state.business.id
        ? createBusinessSubscriptionRecord({
            businessId: state.business.id,
            planCode: "FREE_TRIAL",
            startedAt: new Date().toISOString(),
          })
        : subscription
    );

    state.auth.currentUserId = nextUser.id;
    state.auth.onboardingCompleted = false;
    state.auth.users = [nextUser, ...state.auth.users];

    writeAppStorageState(state);

    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("rapiin-storage-sync"));
    }

    return { ok: true, user: this.mapper.toDomain(this.mapper.toDTO(nextUser)) };
  }

  async resetPassword(identifier: string, password: string): Promise<{ ok: true } | { ok: false; message: string }> {
    const state = readAppStorageState();
    const normalizedIdentifier = this.normalizeIdentifier(identifier);
    const existingIndex = state.auth.users.findIndex(
      (user) => user.email.toLowerCase() === normalizedIdentifier || user.phoneNumber === identifier.trim()
    );

    if (existingIndex === -1) {
      return { ok: false, message: "Akun dengan email / nomor HP ini tidak ditemukan." };
    }

    state.auth.users[existingIndex] = {
      ...state.auth.users[existingIndex],
      password,
      updatedAt: new Date().toISOString(),
    };

    writeAppStorageState(state);

    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("rapiin-storage-sync"));
    }

    return { ok: true };
  }
}
