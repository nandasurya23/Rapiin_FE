import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { getMobileNavItems, getMobileMoreItems, SUPER_ADMIN_NAV_ITEMS } from "@/lib/constants/navigation";
import { useAppData } from "@/components/providers/app-data-provider";
import { Menu, LogOut } from "lucide-react";
import { Sheet } from "@/components/ui/sheet";
import { useToast } from "@/components/ui/toast-provider";
import { usePermission } from "@/hooks/use-permission";

import { ROUTES } from "@/lib/routes";

export function MobileBottomNav() {
 const pathname = usePathname();
 const { isSuperAdmin, subscriptionForCurrentBusiness, business, logout } = useAppData();
 const [isMoreOpen, setIsMoreOpen] = useState(false);
 const toast = useToast();

 async function handleLogout() {
  setIsMoreOpen(false);
  await logout();
  toast.info("Logout berhasil", "Kamu keluar dari sesi admin.");
 }

 const { canAccessRoute } = usePermission();
 const navItems = isSuperAdmin 
  ? SUPER_ADMIN_NAV_ITEMS 
  : getMobileNavItems(business.slug);

 const moreItems = isSuperAdmin 
  ? [] 
  : getMobileMoreItems(business.slug).filter(item => {
    const matchesPlan = item.href !== ROUTES.assistant(business.slug) || subscriptionForCurrentBusiness?.planCode === "PREMIUM";
    const hasAccess = canAccessRoute(item.href, business.slug);
    return matchesPlan && hasAccess;
   });

 // Close drawer if pathname changes
 useEffect(() => {
  setIsMoreOpen(false);
 }, [pathname]);

 const isMoreActive = !isSuperAdmin && moreItems.some(item => pathname.startsWith(item.href));

 return (
  <>
   <nav
    className={cn(
     "fixed inset-x-0 bottom-0 z-30 lg:hidden",
     "border-t border-[var(--color-border)]",
     "bg-[var(--color-surface)]/97 backdrop-blur-md",
     "shadow-[0_-4px_16px_rgba(14,37,84,0.07)]"
    )}
    style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
   >
    <div
     className={cn(
      "grid px-1 py-1",
      isSuperAdmin ? "grid-cols-4" : "grid-cols-5"
     )}
    >
     {navItems.map((item) => {
      const active = item.href === ROUTES.dashboard(business?.slug || "")
       ? pathname === item.href
       : pathname.startsWith(item.href);
      const Icon = item.icon;

      return (
       <Link
        key={item.href}
        href={item.href}
        className={cn(
         "relative flex flex-col items-center justify-center gap-0.5",
         "min-h-[52px] rounded-[var(--radius-md)] px-1 py-2",
         "text-[11px] font-medium",
         "transition-all duration-[var(--transition-fast)]",
         "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]",
         active
          ? "text-[var(--color-primary)]"
          : "text-[var(--color-text-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--state-hover-bg)]"
        )}
       >
        {/* Active top indicator bar */}
        {active && (
         <span
          className="absolute top-0 left-1/2 h-0.5 w-5 -translate-x-1/2 rounded-b-full bg-[var(--color-primary)]"
          aria-hidden
         />
        )}

        {/* Icon */}
        <Icon
         className={cn(
          "transition-all duration-[var(--transition-fast)]",
          active
           ? "h-[20px] w-[20px] text-[var(--color-primary)]"
           : "h-[18px] w-[18px]"
         )}
        />

        {/* Label */}
        <span className="leading-none">{item.label}</span>
       </Link>
      );
     })}

     {/* More menu item for business dashboard */}
     {!isSuperAdmin && (
      <button
       type="button"
       onClick={() => setIsMoreOpen(true)}
       className={cn(
        "relative flex flex-col items-center justify-center gap-0.5",
        "min-h-[52px] rounded-[var(--radius-md)] px-1 py-2",
        "text-[11px] font-medium",
        "transition-all duration-[var(--transition-fast)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]",
        isMoreActive
         ? "text-[var(--color-primary)]"
         : "text-[var(--color-text-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--state-hover-bg)]"
       )}
      >
       {isMoreActive && (
        <span
         className="absolute top-0 left-1/2 h-0.5 w-5 -translate-x-1/2 rounded-b-full bg-[var(--color-primary)]"
         aria-hidden
        />
       )}
       <Menu
        className={cn(
         "transition-all duration-[var(--transition-fast)]",
         isMoreActive
          ? "h-[20px] w-[20px] text-[var(--color-primary)]"
          : "h-[18px] w-[18px]"
        )}
       />
       <span className="leading-none">Lainnya</span>
      </button>
     )}

     {/* Logout button for Super Admin */}
     {isSuperAdmin && (
      <button
       type="button"
       onClick={() => void handleLogout()}
       className={cn(
        "relative flex flex-col items-center justify-center gap-0.5",
        "min-h-[52px] rounded-[var(--radius-md)] px-1 py-2",
        "text-[11px] font-medium text-[var(--color-danger)]",
        "transition-all duration-[var(--transition-fast)]",
        "hover:bg-[var(--color-danger)]/10",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-danger)]"
       )}
      >
       <LogOut className="h-[18px] w-[18px]" />
       <span className="leading-none">Logout</span>
      </button>
     )}
    </div>
   </nav>

   {/* Sheet Drawer for More Menu Items */}
   {!isSuperAdmin && (
    <Sheet
     isOpen={isMoreOpen}
     onClose={() => setIsMoreOpen(false)}
     title="Menu Lainnya"
     description="Akses fitur operasional bisnis Rapiin"
    >
     <div className="grid grid-cols-2 gap-3 py-2">
      {moreItems.map((item) => {
       const active = pathname.startsWith(item.href);
       const Icon = item.icon;
       return (
        <Link
         key={item.href}
         href={item.href}
         onClick={() => setIsMoreOpen(false)}
         className={cn(
          "flex flex-col items-center justify-center gap-2.5 p-5 rounded-2xl border text-center transition-all duration-200",
          "hover:scale-[1.01] active:scale-[0.99]",
          active
           ? "bg-[var(--color-primary-surface)] border-[var(--color-primary)] text-[var(--color-primary)] font-bold shadow-xs"
           : "bg-[var(--color-surface-elevated)] border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--state-hover-bg)]"
         )}
        >
         <Icon className={cn("h-6 w-6", active ? "text-[var(--color-primary)]" : "text-[var(--color-text-muted)]")} />
         <span className="text-xs leading-none font-semibold">{item.label}</span>
        </Link>
       );
      })}

      {/* Logout button */}
      <button
       type="button"
       onClick={() => void handleLogout()}
       className={cn(
        "col-span-2 flex items-center justify-center gap-2.5 p-4.5 mt-2 rounded-2xl border text-center transition-all duration-200 font-bold active:scale-[0.99]",
        "bg-red-500/10 border-red-500/20 text-red-500 hover:bg-red-500/15"
       )}
      >
       <LogOut className="h-5 w-5" />
       <span className="text-xs">Keluar (Logout)</span>
      </button>
     </div>
    </Sheet>
   )}
  </>
 );
}
