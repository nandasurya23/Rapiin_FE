import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { getMobileNavItems, getMobileMoreItems, SUPER_ADMIN_NAV_ITEMS } from "@/lib/constants/navigation";
import { useAppData } from "@/components/providers/app-data-provider";
import { Menu, LogOut, Lock } from "lucide-react";
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
  : getMobileMoreItems(business.slug).filter(item => canAccessRoute(item.href, business.slug)).map(item => {
    let isLocked = false;
    if (item.href === ROUTES.assistant(business.slug)) {
      isLocked = subscriptionForCurrentBusiness?.planCode !== "PREMIUM";
    } else if (item.href === ROUTES.invoiceChecker(business.slug)) {
      isLocked = subscriptionForCurrentBusiness?.planCode === "FREE_TRIAL";
    }
    return { ...item, isLocked };
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
      "grid px-2 py-1.5",
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
         "relative flex flex-col items-center justify-center gap-1",
         "min-h-[52px] rounded-xl px-1 py-1.5 mx-0.5",
         "text-[10px] font-semibold",
         "transition-all duration-200",
         "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]",
         active
          ? "text-[var(--color-primary)]"
          : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
        )}
       >
        {/* Active Pill Background inside icon wrapper */}
        <div className={cn(
          "flex items-center justify-center h-7 w-12 rounded-full transition-all duration-300",
          active ? "bg-[var(--color-primary)]/10" : "bg-transparent hover:bg-[var(--state-hover-bg)]"
        )}>
         <Icon
          className={cn(
           "transition-all duration-200",
           active
            ? "h-[18px] w-[18px] text-[var(--color-primary)]"
            : "h-[18px] w-[18px]"
          )}
         />
        </div>
        <span className="leading-none mt-0.5">{item.label}</span>
       </Link>
      );
     })}

     {/* More menu item for business dashboard */}
     {!isSuperAdmin && (
      <button
       type="button"
       onClick={() => setIsMoreOpen(true)}
       className={cn(
        "relative flex flex-col items-center justify-center gap-1",
        "min-h-[52px] rounded-xl px-1 py-1.5 mx-0.5",
        "text-[10px] font-semibold",
        "transition-all duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]",
        isMoreActive
         ? "text-[var(--color-primary)]"
         : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
       )}
      >
       <div className={cn(
         "flex items-center justify-center h-7 w-12 rounded-full transition-all duration-300",
         isMoreActive ? "bg-[var(--color-primary)]/10" : "bg-transparent hover:bg-[var(--state-hover-bg)]"
       )}>
        <Menu
         className={cn(
          "transition-all duration-200",
          isMoreActive
           ? "h-[18px] w-[18px] text-[var(--color-primary)]"
           : "h-[18px] w-[18px]"
         )}
        />
       </div>
       <span className="leading-none mt-0.5">Lainnya</span>
      </button>
     )}

     {/* Logout button for Super Admin */}
     {isSuperAdmin && (
      <button
       type="button"
       onClick={() => void handleLogout()}
       className={cn(
        "relative flex flex-col items-center justify-center gap-1",
        "min-h-[52px] rounded-xl px-1 py-1.5 mx-0.5",
        "text-[10px] font-semibold text-rose-500",
        "transition-all duration-200 hover:text-rose-600",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
       )}
      >
       <div className="flex items-center justify-center h-7 w-12 rounded-full bg-transparent hover:bg-rose-500/10 transition-all duration-300">
        <LogOut className="h-[18px] w-[18px]" />
       </div>
       <span className="leading-none mt-0.5">Logout</span>
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
         href={item.isLocked ? ROUTES.plan(business.slug) : item.href}
         onClick={(e) => {
           if (item.isLocked) {
             e.preventDefault();
             toast.info("Fitur Terkunci", "Silakan upgrade paket Anda untuk menggunakan fitur ini.");
           }
           setIsMoreOpen(false);
         }}
         className={cn(
          "relative flex flex-col items-center justify-center gap-2.5 p-5 rounded-2xl border text-center transition-all duration-200",
          "hover:scale-[1.02] active:scale-[0.98]",
          active
           ? "bg-[var(--color-primary-surface)] border-[var(--color-primary)] text-[var(--color-primary)] font-bold shadow-sm"
           : "bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-elevated)]"
         )}
        >
         {item.isLocked && (
           <Lock className="absolute top-3 right-3 h-3.5 w-3.5 text-[var(--color-text-muted)]" />
         )}
         <Icon className={cn("h-6 w-6", active ? "text-[var(--color-primary)]" : "text-[var(--color-text-muted)]")} />
         <span className="text-xs leading-none font-semibold">{item.label}</span>
        </Link>
       );
      })}

      {/* Logout button in drawer */}
      <button
       type="button"
       onClick={() => void handleLogout()}
       className={cn(
        "col-span-2 flex items-center justify-center gap-2.5 p-4 mt-3 rounded-xl transition-all duration-200 font-semibold active:scale-[0.99]",
        "text-[var(--color-text-secondary)] hover:text-rose-600 hover:bg-rose-500/10"
       )}
      >
       <LogOut className="h-[18px] w-[18px]" />
       <span className="text-sm">Keluar (Logout)</span>
      </button>
     </div>
    </Sheet>
   )}
  </>
 );
}
