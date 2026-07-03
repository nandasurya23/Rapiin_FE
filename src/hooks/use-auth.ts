import { useState, useEffect, useCallback } from "react";
import { LocalAuthService } from "@/services/auth.service.local";
import type { AuthUserDTO } from "@/services/auth.service";
import type { AuthUser } from "@/types/app-state";

const authService = new LocalAuthService();

export function useAuth() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchCurrentUser = useCallback(async () => {
    try {
      setIsLoading(true);
      const user = await authService.getCurrentUser();
      setCurrentUser(user);
    } catch (error) {
      console.error("Failed to fetch current user", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrentUser();

    const handleSync = () => {
      fetchCurrentUser();
    };

    window.addEventListener("rapiin-storage-sync", handleSync);
    return () => {
      window.removeEventListener("rapiin-storage-sync", handleSync);
    };
  }, [fetchCurrentUser]);

  const login = useCallback(async (identifier: string, password: string) => {
    return authService.login(identifier, password);
  }, []);

  const logout = useCallback(async () => {
    return authService.logout();
  }, []);

  const registerOwner = useCallback(async (payload: Omit<AuthUserDTO, "id" | "createdAt" | "updatedAt" | "role" | "isActive" | "trialUsed" | "businessId"> & { password: string }) => {
    return authService.register(payload);
  }, []);

  const resetPassword = useCallback(async (identifier: string, password: string) => {
    return authService.resetPassword(identifier, password);
  }, []);

  return {
    currentUser,
    isLoading,
    login,
    logout,
    registerOwner,
    resetPassword,
    refreshUser: fetchCurrentUser,
  };
}
