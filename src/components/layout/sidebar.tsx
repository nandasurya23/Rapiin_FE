"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { APP_NAV_ITEMS, MOBILE_NAV_ITEMS, SUPER_ADMIN_NAV_ITEMS } from "@/lib/constants/navigation";
import { cn } from "@/lib/cn";
import { Badge } from "@/components/ui/badge";
import { useAppData } from "@/components/providers/app-data-provider";
import { PLAN_LABELS } from "@/lib/constants/subscription";

type SidebarProps = {
  collapsed: boolean;
};

export function Sidebar({ collapsed }: SidebarProps) {
  const pathname = usePathname();
  const { business, currentUserRole, isSuperAdmin, subscriptionForCurrentBusiness } = useAppData();
  const navItems = isSuperAdmin ? SUPER_ADMIN_NAV_ITEMS : APP_NAV_ITEMS;

  return (
    <aside
      className={cn(
        "hidden self-start border-r border-border/80 bg-surface/86 transition-[width] duration-300 ease-out lg:sticky lg:top-0 lg:flex lg:flex-none lg:flex-col lg:overflow-hidden",
        collapsed ? "lg:w-20" : "lg:w-60"
      )}
    >
      <div className={cn("border-b border-border/80 py-5 transition-all duration-300", collapsed ? "px-3" : "px-6")}>
        <div className={cn("flex items-center gap-3", collapsed ? "justify-center" : "")}>
          <div className="flex h-10 w-10 items-center justify-center rounded-md border border-brand-100 bg-brand-50 text-sm font-semibold text-brand-800">
            R
          </div>
          <div className={cn("min-w-0 transition-all duration-300", collapsed ? "w-0 opacity-0" : "w-auto opacity-100")}>
            <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-text-muted">Rapiin</p>
            <h2 className="mt-1 truncate text-lg font-semibold text-text-primary">{isSuperAdmin ? "Super Admin" : business.name}</h2>
          </div>
        </div>
        <div className={cn("mt-4 flex flex-wrap gap-2 transition-all duration-300", collapsed ? "justify-center opacity-0" : "opacity-100")}>
          <Badge tone="info">{isSuperAdmin ? "Role: Super Admin" : `Plan: ${PLAN_LABELS[subscriptionForCurrentBusiness?.planCode ?? "FREE_TRIAL"]}`}</Badge>
          <Badge tone="neutral">{isSuperAdmin ? currentUserRole : `${MOBILE_NAV_ITEMS.length} menu`}</Badge>
        </div>
      </div>
      <nav className={cn("py-3 transition-all duration-300", collapsed ? "px-2" : "px-3")}>
        <div className="space-y-2">
          {navItems.map((item) => {
            const active = pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-label={item.label}
                title={item.label}
                className={cn(
                  "flex items-center gap-3 rounded-md border px-4 py-2.5 text-sm font-medium transition-all duration-200",
                  collapsed ? "justify-center px-0" : "",
                  active
                    ? "border-brand-100 bg-brand-50 text-brand-800 shadow-sm"
                    : "border-transparent text-text-secondary hover:border-border hover:bg-muted hover:text-text-primary"
                )}
              >
                <Icon className="h-4 w-4" />
                <span className={cn("transition-all duration-300", collapsed ? "w-0 overflow-hidden opacity-0" : "opacity-100")}>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
      <div className={cn("border-t border-border/80 py-3 transition-all duration-300", collapsed ? "px-3" : "px-6")}>
        <p className={cn("text-xs text-text-muted transition-all duration-300", collapsed ? "text-center" : "")}>Status kerja</p>
        <p className={cn("mt-1 text-sm font-medium text-text-primary transition-all duration-300", collapsed ? "text-center opacity-0" : "opacity-100")}>
          {isSuperAdmin ? "Pantau trial, upgrade, dan approval" : "Siap menerima customer baru"}
        </p>
        <p className={cn("mt-1 text-xs text-text-secondary transition-all duration-300", collapsed ? "hidden" : "block")}>
          {isSuperAdmin ? "Panel review manual untuk MVP monetisasi." : "WhatsApp-first, action-first, ringan untuk UMKM."}
        </p>
      </div>
    </aside>
  );
}
