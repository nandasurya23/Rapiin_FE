"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { Topbar } from "@/components/layout/topbar";
import { SubscriptionBanner } from "@/components/shared/subscription-banner";
import { AssistantModal } from "@/components/shared/assistant-modal";
import { ROUTES } from "@/lib/routes";
import { useAppData } from "@/components/providers/app-data-provider";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { hydrated, currentUser, currentUserRole, subscriptionForCurrentBusiness } = useAppData();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem("rapiin-sidebar-collapsed");
    if (stored) {
      setSidebarCollapsed(stored === "true");
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("rapiin-sidebar-collapsed", String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  // Global keydown listener for Cmd+K / Ctrl+K
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (currentUserRole === "SUPER_ADMIN") return;
      if (subscriptionForCurrentBusiness?.planCode === "FREE_TRIAL") return;

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsAssistantOpen((prev) => !prev);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentUserRole, subscriptionForCurrentBusiness?.planCode]);

  useEffect(() => {
    if (!hydrated) return;

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
    <div className="min-h-screen overflow-x-hidden bg-[var(--color-background)] lg:flex">
      {/* Sidebar column — navy bg stretches full content height; sidebar is sticky inside */}
      <div className="hidden lg:flex lg:flex-none lg:self-stretch bg-[var(--color-navy-900)]">
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed((v) => !v)}
        />
      </div>
      <div className="min-w-0 flex-1 pb-[var(--mobile-nav-height)] lg:pb-0">
        <Topbar sidebarCollapsed={sidebarCollapsed} onOpenAssistant={() => setIsAssistantOpen(true)} />
        <SubscriptionBanner />
        {children}
      </div>
      <MobileBottomNav />
      
      {/* Global Smart Console Modal */}
      {currentUserRole !== "SUPER_ADMIN" && (
        <AssistantModal
          isOpen={isAssistantOpen}
          onClose={() => setIsAssistantOpen(false)}
        />
      )}
    </div>
  );
}
