"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, ChevronLeft, ChevronRight } from "lucide-react";
import { getAppNavItems, SUPER_ADMIN_NAV_ITEMS } from "@/lib/constants/navigation";
import { cn } from "@/lib/cn";
import { Badge } from "@/components/ui/badge";
import { useAppData } from "@/components/providers/app-data-provider";
import { useAuth } from "@/hooks/use-auth";
import { PLAN_LABELS } from "@/lib/constants/subscription";
import { useToast } from "@/components/ui/toast-provider";
import { ROUTES } from "@/lib/routes";

type SidebarProps = {
  collapsed: boolean;
  onToggle: () => void;
};

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const toast = useToast();
  const {
    business,
    currentUser,
    currentUserRole,
    isSuperAdmin,
    subscriptionForCurrentBusiness,
  } = useAppData();
  const { logout } = useAuth();
  const navItems = isSuperAdmin 
    ? SUPER_ADMIN_NAV_ITEMS 
    : getAppNavItems(business.slug).filter(item => 
        item.href !== ROUTES.assistant(business.slug) || subscriptionForCurrentBusiness?.planCode !== "FREE_TRIAL"
      );

  const planLabel = PLAN_LABELS[subscriptionForCurrentBusiness?.planCode ?? "FREE_TRIAL"];

  // User initials
  const name = currentUser?.name ?? business.ownerName ?? "U";
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  async function handleLogout() {
    await logout();
    toast.info("Logout berhasil", "Kamu keluar dari sesi admin.");
    await new Promise((resolve) => setTimeout(resolve, 180));
    router.push("/auth/login");
  }

  return (
    <aside
      className={cn(
        // Layout — hidden/flex-none are now on the parent wrapper in app-shell
        "flex flex-col flex-none lg:sticky lg:top-0",
        "h-screen overflow-hidden",
        "transition-[width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
        collapsed ? "w-[72px]" : "w-[240px]",
        // Brand navy background
        "bg-[var(--color-navy-900)]",
        // Right border separator
        "border-r border-white/[0.06]",
        // Sidebar shadow
        "shadow-[var(--shadow-sidebar)]"
      )}
    >
      {/* ── HEADER / LOGO ─────────────────────────────── */}
      <div
        className={cn(
          "flex items-center border-b border-white/[0.06]",
          "transition-all duration-300",
          collapsed ? "h-14 justify-center px-0" : "h-14 px-5 gap-3"
        )}
      >
        {/* Brand mark */}
        {business.logoUrl && !isSuperAdmin ? (
          <Image
            src={business.logoUrl}
            alt={business.name}
            width={32}
            height={32}
            className="h-8 w-8 shrink-0 rounded-[var(--radius-md)] object-contain bg-white p-0.5 border border-white/10"
            unoptimized
          />
        ) : (
          <div
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-md)]",
              "bg-[var(--color-gold-500)] text-[var(--color-navy-900)]",
              "text-sm font-bold tracking-tight select-none"
            )}
          >
            R
          </div>
        )}

        {/* Wordmark */}
        <div
          className={cn(
            "min-w-0 overflow-hidden transition-all duration-300",
            collapsed ? "w-0 opacity-0" : "w-auto opacity-100"
          )}
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/40">
            Rapiin
          </p>
          <p className="truncate text-[15px] font-semibold text-white leading-snug">
            {isSuperAdmin ? "Super Admin" : business.name}
          </p>
        </div>
      </div>

      {/* ── PLAN BADGE (only when expanded) ─────────────── */}
      {!collapsed && !isSuperAdmin && (
        <div className="px-4 pt-3 pb-1">
          <Badge tone="neutral" size="sm" className="bg-white/10 text-white/60 border-white/10">
            {planLabel}
          </Badge>
        </div>
      )}

      {/* ── NAV ITEMS ─────────────────────────────────── */}
      <nav
        className={cn(
          "sidebar-scroll flex-1 overflow-y-auto py-3",
          "transition-all duration-300",
          collapsed ? "px-2" : "px-3"
        )}
      >
        <div className="space-y-0.5">
          {navItems.map((item) => {
            const active = item.href === ROUTES.dashboard(business?.slug || "")
              ? pathname === item.href
              : pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-label={item.label}
                title={collapsed ? item.label : undefined}
                className={cn(
                  // Base
                  "group flex items-center gap-3 rounded-[var(--radius-md)]",
                  "text-sm font-medium",
                  "transition-all duration-[var(--transition-fast)]",
                  "outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-gold-300)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--color-navy-900)]",

                  // Layout
                  collapsed ? "justify-center px-0 py-2.5 h-10 w-10 mx-auto" : "px-3 py-2.5",

                  // Active vs Inactive
                  active
                    ? [
                        "bg-[var(--color-navy-800)]",
                        "text-white",
                        // Gold left border accent
                        !collapsed && "border-l-2 border-[var(--color-gold-500)] pl-[10px]",
                      ]
                    : [
                        "text-white/60 border-l-2 border-transparent",
                        "hover:bg-white/[0.06] hover:text-white",
                        collapsed && "border-l-0",
                      ]
                )}
              >
                <Icon
                  className={cn(
                    "h-[18px] w-[18px] shrink-0 transition-colors",
                    active ? "text-[var(--color-gold-300)]" : "text-white/50 group-hover:text-white/80"
                  )}
                />
                <span
                  className={cn(
                    "truncate transition-all duration-300",
                    collapsed ? "w-0 opacity-0 overflow-hidden" : "opacity-100"
                  )}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* ── FOOTER: User Info + Logout ─────────────────── */}
      <div
        className={cn(
          "border-t border-white/[0.06] transition-all duration-300",
          collapsed ? "px-2 py-3" : "px-3 py-3"
        )}
      >
        {/* User info row */}
        <div
          className={cn(
            "flex items-center gap-3 rounded-[var(--radius-md)] px-2 py-2",
            "transition-all duration-300"
          )}
        >
          {/* Avatar */}
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full
              bg-[var(--color-navy-700)] text-[11px] font-bold text-white/90 select-none"
          >
            {initials}
          </div>

          {/* Name + role */}
          <div
            className={cn(
              "min-w-0 overflow-hidden transition-all duration-300",
              collapsed ? "w-0 opacity-0" : "flex-1 opacity-100"
            )}
          >
            <p className="truncate text-sm font-medium text-white/85">
              {currentUser?.name ?? business.ownerName}
            </p>
            <p className="truncate text-[11px] text-white/40">
              {isSuperAdmin ? "Super Admin" : currentUserRole ?? "Owner"}
            </p>
          </div>

          {/* Logout icon button */}
          {!collapsed && (
            <button
              type="button"
              onClick={() => void handleLogout()}
              title="Logout"
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)]",
                "text-white/40 transition-all duration-[var(--transition-fast)]",
                "hover:bg-white/[0.08] hover:text-white/80",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-gold-300)]"
              )}
            >
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Collapse toggle */}
        <button
          type="button"
          onClick={onToggle}
          title={collapsed ? "Buka sidebar" : "Tutup sidebar"}
          className={cn(
            "mt-2 flex w-full items-center justify-center rounded-[var(--radius-md)]",
            "h-8 text-white/30 transition-all duration-[var(--transition-fast)]",
            "hover:bg-white/[0.06] hover:text-white/60",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-gold-300)]"
          )}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>
    </aside>
  );
}
