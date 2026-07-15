"use client";

import { usePathname } from "next/navigation";
import { Bell, PanelLeftClose, PanelLeftOpen, Sparkles } from "lucide-react";
import { QuickAddMenu } from "@/components/shared/quick-add-menu";
import { useAppData } from "@/components/providers/app-data-provider";
import { cn } from "@/lib/cn";
import { getAppNavItems, SUPER_ADMIN_NAV_ITEMS } from "@/lib/constants/navigation";

type TopbarProps = {
  sidebarCollapsed: boolean;
  onOpenAssistant: () => void;
};

export function Topbar({ sidebarCollapsed, onOpenAssistant }: TopbarProps) {
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
                "hidden sm:inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-bold",
                "bg-gradient-to-r from-[#122a57] to-[#0c1d3b] text-amber-300",
                "border border-amber-400/30",
                "hover:from-[#1a3a73] hover:to-[#122a57] hover:text-amber-200",
                "transition-all duration-200",
                "disabled:opacity-40 disabled:cursor-not-allowed",
                "shadow-[0_0_12px_rgba(218,159,78,0.15)]"
              )}
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-300" />
              <span>Asisten Pintar</span>
              <kbd className="hidden lg:inline-flex items-center rounded border border-amber-400/20 bg-amber-400/10 px-1 text-[9px] font-mono text-amber-400/80">⌘K</kbd>
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
