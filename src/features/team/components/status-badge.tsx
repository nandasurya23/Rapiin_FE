import { Badge } from "@/components/ui/badge";

interface StatusBadgeProps {
 status?: "ACTIVE" | "PENDING" | "SUSPENDED";
}

export function StatusBadge({ status = "ACTIVE" }: StatusBadgeProps) {
 switch (status) {
  case "ACTIVE":
   return (
    <Badge tone="success" dot>
     Aktif
    </Badge>
   );
  case "PENDING":
   return (
    <Badge tone="warning" dot>
     Menunggu
    </Badge>
   );
  case "SUSPENDED":
   return (
    <Badge tone="danger" dot>
     Dinonaktifkan
    </Badge>
   );
  default:
   return <Badge tone="neutral">{status}</Badge>;
 }
}
