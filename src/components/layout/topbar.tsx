"use client";

import { usePathname } from "next/navigation";
import { Bell, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { QuickAddMenu } from "@/components/shared/quick-add-menu";
import { useAppData } from "@/components/providers/app-data-provider";
import { cn } from "@/lib/cn";
import { getAppNavItems, SUPER_ADMIN_NAV_ITEMS } from "@/lib/constants/navigation";

type TopbarProps = {
 sidebarCollapsed: boolean;
 onOpenAssistant: () => void;
 onToggleSidebar?: () => void;
};

export function Topbar({ sidebarCollapsed, onOpenAssistant, onToggleSidebar }: TopbarProps) {
 const pathname = usePathname();
 const { business, currentUser, isSuperAdmin, canAccessWriteMode, subscriptionForCurrentBusiness } = useAppData();

 const navItems = isSuperAdmin ? SUPER_ADMIN_NAV_ITEMS : getAppNavItems(business.slug);
 const currentNav = navItems.find((item: { href: string }) => pathname.startsWith(item.href));
 const pageLabel = currentNav?.label ?? "Rapiin";

 const name = currentUser?.name ?? business.ownerName ?? "U";
 const initials = name
  .split(" ")
  .slice(0, 2)
  .map((n) => n[0])
  .join("")
  .toUpperCase();

 return (
  <header
   className={cn(
    "sticky top-0 z-20",
    "h-[var(--topbar-height)]",
    "border-b border-[var(--color-border)]",
    "bg-[var(--color-surface)]/95 backdrop-blur-md",
    "shadow-[var(--shadow-xs)]"
   )}
  >
   <div className="flex h-full items-center gap-4 px-4 sm:px-6 lg:px-8">

    {/* Sidebar toggle — desktop only (now also in sidebar, this is topbar-level shortcut) */}
    <button
     type="button"
     aria-label={sidebarCollapsed ? "Buka sidebar" : "Tutup sidebar"}
     onClick={onToggleSidebar}
     className={cn(
      "hidden lg:flex items-center justify-center",
      "h-8 w-8 rounded-[var(--radius-md)]",
      "text-[var(--color-text-muted)]",
      "hover:bg-[var(--state-hover-bg)] hover:text-[var(--color-primary)]",
      "transition-colors duration-[var(--transition-fast)]",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
     )}
    >
     {sidebarCollapsed ? (
      <PanelLeftOpen className="h-4 w-4" />
     ) : (
      <PanelLeftClose className="h-4 w-4" />
     )}
    </button>

    {/* Page context — breadcrumb / current page name */}
    <div className="min-w-0 flex-1">
     <div className="flex items-center gap-2">
      {/* Mobile: show business name */}
      <span className="block truncate text-sm font-semibold text-[var(--color-text)] lg:hidden">
       {business.name}
      </span>
      {/* Desktop: show current page */}
      <span className="hidden truncate text-sm font-semibold text-[var(--color-text)] lg:block">
       {pageLabel}
      </span>
     </div>
    </div>

    {/* ── RIGHT ACTIONS ───────────────────────── */}
    <div className="flex shrink-0 items-center gap-2">
     {/* Notification bell */}
     <button
      type="button"
      aria-label="Notifikasi"
      className={cn(
       "flex items-center justify-center",
       "h-8 w-8 rounded-[var(--radius-md)]",
       "text-[var(--color-text-muted)]",
       "hover:bg-[var(--state-hover-bg)] hover:text-[var(--color-primary)]",
       "transition-colors duration-[var(--transition-fast)]",
       "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
      )}
     >
      <Bell className="h-4 w-4" />
     </button>

     {/* ⚡ Asisten Pintar Rapiin — standalone prominent CTA (non-superadmin only) */}
     {!isSuperAdmin && subscriptionForCurrentBusiness?.planCode === "PREMIUM" ? (
      <button
       type="button"
       disabled={!canAccessWriteMode}
       onClick={onOpenAssistant}
       title="Asisten Pintar — Input Cepat (⌘K)"
       className={cn(
        "hidden sm:inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-xs font-semibold",
        "bg-[var(--color-primary-surface)] text-[var(--color-primary)]",
        "border border-[var(--color-primary)]/20",
        "hover:bg-[var(--color-primary)] hover:text-[var(--color-text-inverse)]",
        "transition-all duration-200",
        "disabled:opacity-40 disabled:cursor-not-allowed"
       )}
      >
       <span>Asisten Pintar</span>
       <kbd className="hidden lg:inline-flex items-center rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-1 text-[9px] font-mono text-[var(--color-text-secondary)]">⌘K</kbd>
      </button>
     ) : null}

     {/* Quick add */}
     {!isSuperAdmin ? <QuickAddMenu /> : null}

     {/* User avatar — visual only (logout in sidebar) */}
     <div
      title={name}
      className={cn(
       "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
       "bg-[var(--color-primary-surface)]",
       "border border-[var(--color-border-strong)]",
       "text-[11px] font-bold text-[var(--color-primary)] select-none"
      )}
     >
      {initials}
     </div>
    </div>
   </div>
  </header>
 );
}
