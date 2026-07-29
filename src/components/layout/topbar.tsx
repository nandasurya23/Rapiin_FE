"use client";

import { usePathname, useRouter } from "next/navigation";
import { Bell, PanelLeftClose, PanelLeftOpen, LogOut, Settings } from "lucide-react";
import { QuickAddMenu } from "@/components/shared/quick-add-menu";
import { useAppData } from "@/components/providers/app-data-provider";
import { cn } from "@/lib/cn";
import { getAppNavItems, SUPER_ADMIN_NAV_ITEMS } from "@/lib/constants/navigation";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { useToast } from "@/components/ui/toast-provider";
import { ROUTES } from "@/lib/routes";

type TopbarProps = {
 sidebarCollapsed: boolean;
 onOpenAssistant: () => void;
 onToggleSidebar?: () => void;
};

export function Topbar({ sidebarCollapsed, onOpenAssistant, onToggleSidebar }: TopbarProps) {
 const pathname = usePathname();
 const router = useRouter();
 const toast = useToast();
 const { business, currentUser, isSuperAdmin, canAccessWriteMode, subscriptionForCurrentBusiness, logout } = useAppData();

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

 async function handleLogout() {
  await logout();
  toast.info("Logout berhasil", "Kamu keluar dari sesi admin.");
  await new Promise((resolve) => setTimeout(resolve, 180));
  router.push("/auth/login");
 }

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
     aria-expanded={!sidebarCollapsed}
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
       "flex items-center justify-center relative",
       "h-8 w-8 rounded-[var(--radius-md)]",
       "text-[var(--color-text-muted)]",
       "hover:bg-[var(--state-hover-bg)] hover:text-[var(--color-primary)]",
       "transition-colors duration-[var(--transition-fast)]",
       "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
      )}
     >
      <Bell className="h-4 w-4" />
      {/* Unread indicator dot */}
      <span className="absolute top-1.5 right-2 h-1.5 w-1.5 rounded-full bg-red-500 ring-2 ring-[var(--color-surface)]" aria-hidden="true" />
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

     {/* User avatar with DropdownMenu */}
     <DropdownMenu>
      <DropdownMenuTrigger asChild>
       <button
        title={name}
        aria-label="Profil & Pengaturan"
        className={cn(
         "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
         "bg-[var(--color-primary-surface)]",
         "border border-[var(--color-border-strong)]",
         "text-[11px] font-bold text-[var(--color-primary)] select-none",
         "transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-primary)]"
        )}
       >
        {initials}
       </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="right" className="w-56">
       <div className="px-2 py-1.5 mb-1 border-b border-[var(--color-border)]">
        <p className="text-sm font-semibold text-[var(--color-text)] truncate">{name}</p>
        <p className="text-xs text-[var(--color-text-secondary)] truncate">{currentUser?.email || "Admin"}</p>
       </div>
       {!isSuperAdmin && (
        <DropdownMenuItem onClick={() => router.push(ROUTES.settings(business.slug))}>
         <Settings className="h-4 w-4 mr-2 text-[var(--color-text-muted)]" />
         Pengaturan Profil
        </DropdownMenuItem>
       )}
       <DropdownMenuItem onClick={() => void handleLogout()} className="text-red-600 focus:text-red-700 focus:bg-red-50 dark:focus:bg-red-950/30">
        <LogOut className="h-4 w-4 mr-2" />
        Keluar
       </DropdownMenuItem>
      </DropdownMenuContent>
     </DropdownMenu>

    </div>
   </div>
  </header>
 );
}
