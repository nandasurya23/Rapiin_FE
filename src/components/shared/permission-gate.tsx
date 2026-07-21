import type { ReactNode } from "react";
import { usePermission } from "@/hooks/use-permission";
import type { AppPermission } from "@/types/permission";

interface PermissionGateProps {
 children: ReactNode;
 permission: AppPermission;
 fallback?: ReactNode;
}

export function PermissionGate({ children, permission, fallback = null }: PermissionGateProps) {
 const { hasPermission } = usePermission();

 if (hasPermission(permission)) {
  return <>{children}</>;
 }

 return <>{fallback}</>;
}
