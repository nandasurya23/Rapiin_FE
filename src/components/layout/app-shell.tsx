"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { Topbar } from "@/components/layout/topbar";
import { SubscriptionBanner } from "@/components/shared/subscription-banner";
import { ROUTES } from "@/lib/routes";
import { useAppData } from "@/components/providers/app-data-provider";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { hydrated, currentUser, currentUserRole } = useAppData();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem("rapiin-sidebar-collapsed");
    if (stored) {
      setSidebarCollapsed(stored === "true");
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("rapiin-sidebar-collapsed", String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    if (!currentUser) {
      router.replace(ROUTES.login);
      return;
    }

    if (currentUserRole === "SUPER_ADMIN" && !pathname.startsWith("/app/super-admin")) {
      router.replace(ROUTES.superAdminBusinesses);
      return;
    }

    if (currentUserRole === "OWNER" && pathname.startsWith("/app/super-admin")) {
      router.replace(ROUTES.dashboard);
    }
  }, [currentUser, currentUserRole, hydrated, pathname, router]);

  return (
    <div className="min-h-screen overflow-x-hidden lg:flex">
      <Sidebar collapsed={sidebarCollapsed} />
      <div className="min-w-0 flex-1 pb-20 lg:pb-0">
        <Topbar sidebarCollapsed={sidebarCollapsed} onToggleSidebar={() => setSidebarCollapsed((current) => !current)} />
        <SubscriptionBanner />
        {children}
      </div>
      <MobileBottomNav />
    </div>
  );
}
