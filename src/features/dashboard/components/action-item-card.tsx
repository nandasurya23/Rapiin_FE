import { Copy, MoreVertical } from "lucide-react";
import { cn } from "@/lib/cn";
import { CustomerStatusBadge, OrderStatusBadge } from "@/components/shared/status-badge";
import { WhatsAppButton } from "@/components/shared/whatsapp-button";
import { ROUTES } from "@/lib/routes";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import type { ActionItem } from "@/hooks/use-dashboard-actions";

interface ActionItemCardProps {
  item: ActionItem;
  businessSlug: string;
  onCopyMessage: (message: string) => void;
  onMarkOrderPaid: (id: string, type: "DP" | "FULL") => void;
  onMarkOrderDone: (id: string) => void;
  onMarkCustomerDone: (id: string) => void;
}

export function ActionItemCard({
  item,
  businessSlug,
  onCopyMessage,
  onMarkOrderPaid,
  onMarkOrderDone,
  onMarkCustomerDone,
}: ActionItemCardProps) {
  const router = useRouter();
  
  return (
    <div
      className={cn(
        "flex flex-col gap-3 p-4 sm:p-5 md:flex-row md:items-center md:justify-between transition-colors hover:bg-[var(--color-surface-elevated)]/50"
      )}
    >
      {/* Info */}
      <div className="min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-bold text-sm text-[var(--color-text)] truncate max-w-[200px] sm:max-w-xs" title={item.title}>
            {item.title}
          </p>
          {item.type === "order" ? (
            <OrderStatusBadge status={item.status as React.ComponentProps<typeof OrderStatusBadge>["status"]} />
          ) : (
            <CustomerStatusBadge status={item.status as React.ComponentProps<typeof CustomerStatusBadge>["status"]} />
          )}
        </div>
        <p className="text-xs text-[var(--color-text-secondary)] font-medium">
          {item.reason}
        </p>
        <p className="text-[10px] text-[var(--color-text-muted)]">
          Jatuh tempo: {item.due}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 w-full sm:w-auto sm:justify-end mt-2 sm:mt-0">
        <WhatsAppButton
          phoneNumber={item.phone}
          message={item.message}
          label="Hubungi WA"
          className="h-10 px-4 text-sm font-bold rounded-xl flex-1 sm:flex-none justify-center"
        />

        <DropdownMenu>
          <DropdownMenuTrigger
            className="h-10 w-10 border border-[var(--color-border)] rounded-xl text-[var(--color-text-secondary)] bg-transparent hover:text-[var(--color-text)] hover:border-[var(--color-text-muted)]"
            aria-label="Menu Aksi"
          >
            <MoreVertical className="h-5 w-5" aria-hidden="true" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="right">
            <DropdownMenuItem onClick={() => onCopyMessage(item.message)}>
              <span className="flex items-center gap-2">
                <Copy className="h-4 w-4" aria-hidden="true" /> Salin Pesan WA
              </span>
            </DropdownMenuItem>

            {item.type === "order" && (
              <>
                <DropdownMenuItem
                  onClick={() => {
                    const isWaitingDp = item.status === "WAITING_DP";
                    onMarkOrderPaid(item.id, isWaitingDp ? "DP" : "FULL");
                  }}
                >
                  <span className="font-semibold text-[var(--color-success)]">
                    {item.status === "WAITING_DP" ? "Tandai DP Lunas" : "Tandai Lunas"}
                  </span>
                </DropdownMenuItem>
                {item.status !== "SELESAI" && (
                  <DropdownMenuItem onClick={() => onMarkOrderDone(item.id)}>
                    <span className="font-semibold">Tandai Selesai</span>
                  </DropdownMenuItem>
                )}
              </>
            )}

            {item.type === "customer" && (
              <>
                <DropdownMenuItem
                  onClick={() => {
                    // Navigate to customer detail (link behavior in dropdown is tricky if it requires Next.js router)
                    // We can use native window.location or standard A tag inside, but since it's a generic action:
                    router.push(ROUTES.customers(businessSlug));
                  }}
                >
                  Lihat Detail
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onMarkCustomerDone(item.id)}>
                  <span className="font-semibold text-[var(--color-success)]">
                    Tandai Beres
                  </span>
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
