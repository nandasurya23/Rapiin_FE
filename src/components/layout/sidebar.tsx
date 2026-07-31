"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, ChevronLeft, ChevronRight, Lock } from "lucide-react";
import { getAppNavItems, SUPER_ADMIN_NAV_ITEMS } from "@/lib/constants/navigation";
import { cn } from "@/lib/cn";
import { useAppData } from "@/components/providers/app-data-provider";
import { useAuth } from "@/hooks/use-auth";
import { PLAN_LABELS } from "@/lib/constants/subscription";
import { useToast } from "@/components/ui/toast-provider";
import { ROUTES } from "@/lib/routes";
import { usePermission } from "@/hooks/use-permission";
import { useState } from "react";
import { UpgradeModal } from "@/components/shared/upgrade-modal";

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
 const { canAccessRoute } = usePermission();
 const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const navItems = isSuperAdmin 
   ? SUPER_ADMIN_NAV_ITEMS.map(i => ({ ...i, isLocked: false }))
   : getAppNavItems(business.slug).filter(item => canAccessRoute(item.href, business.slug)).map(item => {
     let isLocked = false;
     if (item.href === ROUTES.assistant(business.slug)) {
       isLocked = subscriptionForCurrentBusiness?.planCode !== "PREMIUM";
     } else if (item.href === ROUTES.invoiceChecker(business.slug)) {
       isLocked = subscriptionForCurrentBusiness?.planCode === "FREE_TRIAL";
     }
     return { ...item, isLocked };
   });

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
    "flex flex-col flex-none lg:sticky lg:top-0",
    "h-screen overflow-hidden",
    "transition-[width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
    collapsed ? "w-[72px]" : "w-[240px]",
    "bg-[var(--color-navy-900)]",
    "border-r border-white/[0.06]",
    "shadow-[var(--shadow-sidebar)]"
   )}
  >
   {/* ── HEADER / LOGO ─────────────────────────────── */}
   <div
    className={cn(
     "flex items-center relative",
     "transition-all duration-300",
     collapsed ? "h-16 justify-center px-0" : "h-16 px-5 gap-3"
    )}
   >
    {/* Brand mark */}
    {business.logoUrl && !isSuperAdmin ? (
     <Image
      src={business.logoUrl}
      alt={business.name}
      width={32}
      height={32}
      className="h-8 w-8 shrink-0 rounded-lg object-contain bg-white p-0.5 border border-white/10 shadow-sm"
      unoptimized
     />
    ) : (
     <div
      className={cn(
       "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg shadow-sm",
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
      collapsed ? "w-0 opacity-0" : "w-auto opacity-100 flex-1"
     )}
    >
     <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">
      Rapiin
     </p>
     <p className="truncate text-sm font-semibold text-white leading-snug">
      {isSuperAdmin ? "Super Admin" : business.name}
     </p>
    </div>
   </div>

   {/* ── NAV ITEMS ─────────────────────────────────── */}
   <nav
    className={cn(
     "sidebar-scroll flex-1 overflow-y-auto py-2",
     "transition-all duration-300",
     collapsed ? "px-2" : "px-3"
    )}
   >
    <div className="space-y-5">
     {Object.entries(
      navItems.reduce((acc, item) => {
       const groupName = item.group || "Lainnya";
       if (!acc[groupName]) acc[groupName] = [];
       acc[groupName].push(item);
       return acc;
      }, {} as Record<string, typeof navItems>)
     ).map(([group, items], index) => (
      <div key={group} className="space-y-1">
       {!collapsed && (
        <h3 className={cn(
          "px-3 text-[10px] font-bold uppercase tracking-wider text-[var(--color-gold-300)] opacity-50 mb-1.5",
          index > 0 && "mt-4"
        )}>
         {group}
        </h3>
       )}
       {items.map((item) => {
        const active = item.href === ROUTES.dashboard(business?.slug || "")
         ? pathname === item.href
         : pathname.startsWith(item.href);
        const Icon = item.icon;

        return (
         <Link
           key={item.href}
           href={item.isLocked ? ROUTES.plan(business.slug) : item.href}
           onClick={(e) => {
             if (item.isLocked) {
               e.preventDefault();
               setUpgradeModalOpen(true);
             }
           }}
           aria-label={item.label}
           title={collapsed ? item.label : undefined}
           className={cn(
            "group flex items-center gap-3",
            "text-sm font-medium",
            "transition-all duration-200",
            "outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-gold-300)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--color-navy-900)]",

            collapsed ? "justify-center px-0 py-2.5 h-10 w-10 mx-auto rounded-xl" : "px-3 py-2.5 rounded-xl",

            active
             ? [
               "bg-[var(--color-navy-800)] shadow-sm",
               "text-white",
              ]
             : [
               "text-white/60",
               "hover:bg-white/[0.04] hover:text-white",
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
              collapsed ? "w-0 opacity-0 overflow-hidden" : "opacity-100 flex-1"
             )}
            >
             {item.label}
            </span>
            {item.isLocked && !collapsed && (
             <span className="text-[9px] font-bold tracking-wider text-[var(--color-navy-900)] bg-[var(--color-gold-400)] px-1.5 py-0.5 rounded-sm shrink-0">
               PRO
             </span>
            )}
           </Link>
         );
        })}
      </div>
     ))}
    </div>
   </nav>

   {/* ── FOOTER: User Info + Logout ─────────────────── */}
   <div
    className={cn(
     "pb-4 pt-2 transition-all duration-300",
     collapsed ? "px-2" : "px-3"
    )}
   >
    <div
     className={cn(
      "flex items-center gap-3 rounded-2xl bg-white/[0.02] border border-white/[0.05]",
      "transition-all duration-300",
      collapsed ? "flex-col p-2" : "p-3"
     )}
    >
     {/* Avatar */}
     <div
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full
       bg-[var(--color-navy-700)] text-xs font-bold text-white shadow-sm select-none border border-white/10"
     >
      {initials}
     </div>

     {/* Name + role + plan */}
     <div
      className={cn(
       "min-w-0 overflow-hidden transition-all duration-300",
       collapsed ? "w-0 h-0 opacity-0 hidden" : "flex-1 opacity-100 block"
      )}
     >
      <p className="truncate text-sm font-semibold text-white/90">
       {currentUser?.name ?? business.ownerName}
      </p>
      <div className="flex items-center gap-1.5 mt-0.5">
       <span className="truncate text-[11px] text-white/50 font-medium">
        {isSuperAdmin ? "Super Admin" : currentUserRole ?? "Owner"}
       </span>
       {!isSuperAdmin && (
        <>
         <span className="h-1 w-1 rounded-full bg-white/20" />
         <span className="truncate text-[10px] text-[var(--color-gold-400)] font-bold tracking-wide">
          {planLabel}
         </span>
        </>
       )}
      </div>
     </div>
    </div>

    {/* Footer Actions */}
    <div className={cn(
      "flex items-center gap-2 mt-2",
      collapsed ? "flex-col" : "flex-row"
    )}>
     <button
      type="button"
      onClick={() => void handleLogout()}
      title="Logout"
      className={cn(
       "flex items-center justify-center rounded-xl",
       "h-9 transition-all duration-200",
       "text-white/40 hover:bg-rose-500/10 hover:text-rose-400",
       "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-danger)]",
       collapsed ? "w-full" : "flex-1"
      )}
     >
      <LogOut className="h-[18px] w-[18px] shrink-0" />
      {!collapsed && (
       <span className="ml-2 text-xs font-semibold truncate">Logout</span>
      )}
     </button>

     <button
      type="button"
      aria-expanded={!collapsed}
      onClick={onToggle}
      title={collapsed ? "Buka sidebar" : "Tutup sidebar"}
      className={cn(
       "flex shrink-0 items-center justify-center rounded-xl",
       "h-9 w-9 text-white/40 transition-all duration-200",
       "hover:bg-white/[0.06] hover:text-white/80",
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
   </div>

   <UpgradeModal
    isOpen={upgradeModalOpen}
    onClose={() => setUpgradeModalOpen(false)}
    title="Fitur Eksklusif PRO"
    description="Menu ini hanya tersedia untuk paket berbayar. Upgrade sekarang untuk membuka seluruh fitur Rapiin."
   />
  </aside>
 );
}
