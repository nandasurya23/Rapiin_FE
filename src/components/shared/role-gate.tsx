import type { ReactNode } from "react";
import { useAppData } from "@/components/providers/app-data-provider";
import type { UserRole } from "@/types/subscription";

interface RoleGateProps {
 children: ReactNode;
 allowedRoles: UserRole[];
 fallback?: ReactNode;
}

export function RoleGate({ children, allowedRoles, fallback = null }: RoleGateProps) {
 const { currentUserRole, isSuperAdmin } = useAppData();

 if (isSuperAdmin) {
  return <>{children}</>;
 }

 if (currentUserRole && allowedRoles.includes(currentUserRole)) {
  return <>{children}</>;
 }

 return <>{fallback}</>;
}
