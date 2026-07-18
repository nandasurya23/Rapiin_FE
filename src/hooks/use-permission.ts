import { useAppData } from "@/components/providers/app-data-provider";
import type { UserRole } from "@/types/subscription";
import type { AppPermission } from "@/types/permission";

const ROLE_PERMISSIONS: Record<UserRole, AppPermission[]> = {
  SUPER_ADMIN: [
    "orders:create",
    "orders:view",
    "orders:update",
    "orders:delete",
    "reports:view",
    "settings:write",
    "team:manage",
    "billing:write",
  ],
  OWNER: [
    "orders:create",
    "orders:view",
    "orders:update",
    "orders:cancel",
    "orders:delete",
    "customers:view",
    "customers:manage",
    "reports:view",
    "settings:write",
    "invoices:view",
    "invoices:create",
    "team:view",
    "team:manage",
    "billing:write",
  ],
  MANAGER: [
    "orders:create",
    "orders:view",
    "orders:update",
    "orders:cancel",
    "customers:view",
    "customers:manage",
    "reports:view",
    "invoices:view",
    "invoices:create",
    "team:view",
  ],
  STAFF: [
    "orders:create",
    "orders:view",
    "orders:update",
    "customers:view",
  ],
};

export function usePermission() {
  const { currentUserRole, subscriptionForCurrentBusiness } = useAppData();

  function hasPermission(permission: AppPermission): boolean {
    if (!currentUserRole) return false;
    
    // Team management is PRO & PREMIUM feature, disabled on FREE_TRIAL
    if (permission.startsWith("team:") && subscriptionForCurrentBusiness?.planCode === "FREE_TRIAL") {
      return false;
    }

    const permissions = ROLE_PERMISSIONS[currentUserRole];
    return permissions ? permissions.includes(permission) : false;
  }

  function hasAnyPermission(permissions: AppPermission[]): boolean {
    return permissions.some((p) => hasPermission(p));
  }

  function canAccessRoute(routePath: string, slug: string): boolean {
    if (!currentUserRole) return false;
    if (currentUserRole === "SUPER_ADMIN") return true;

    const cleanPath = routePath.replace(`/dashboard/${slug}`, "");
    
    if (cleanPath.startsWith("/reports")) {
      return hasPermission("reports:view");
    }
    if (cleanPath.startsWith("/settings")) {
      return hasPermission("settings:write");
    }
    if (cleanPath.startsWith("/plan")) {
      return hasPermission("billing:write");
    }
    return true;
  }

  return {
    hasPermission,
    hasAnyPermission,
    canAccessRoute,
    role: currentUserRole,
  };
}
