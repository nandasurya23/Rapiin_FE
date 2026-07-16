import { Badge } from "@/components/ui/badge";
import type { StaffRole } from "@/types/team";

interface RoleBadgeProps {
  role: StaffRole;
}

export function RoleBadge({ role }: RoleBadgeProps) {
  switch (role) {
    case "MANAGER":
      return (
        <Badge tone="warning" className="font-bold">
          Manager
        </Badge>
      );
    case "STAFF":
      return (
        <Badge tone="success" className="font-bold">
          Staff
        </Badge>
      );
    default:
      return <Badge tone="neutral">{role}</Badge>;
  }
}
