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
  const { hydrated, currentUser, currentUserRole, auth, subscriptionForCurrentBusiness, business } = useAppData();
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

    const adminUrl = (process.env.NEXT_PUBLIC_ADMIN_URL || "").replace(/\/$/, "");
    const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "").replace(/\/$/, "");
    const currentOrigin = typeof window !== "undefined" ? window.location.origin : "";
    const isMultiDomain = adminUrl && appUrl && adminUrl !== appUrl;
    const isAdminDomain = isMultiDomain && currentOrigin === adminUrl;

    if (!currentUser) {
      if (isAdminDomain || pathname.startsWith("/dashboard/super-admin")) {
        if (isMultiDomain && !isAdminDomain) {
          window.location.href = `${adminUrl}${ROUTES.superAdminLogin}`;
        } else {
          router.replace(ROUTES.superAdminLogin);
        }
      } else {
        if (isMultiDomain && isAdminDomain) {
          window.location.href = `${appUrl}${ROUTES.login}`;
        } else {
          router.replace(ROUTES.login);
        }
      }
      return;
    }

    if (currentUserRole === "SUPER_ADMIN") {
      if (isMultiDomain && !isAdminDomain) {
        window.location.href = `${adminUrl}${ROUTES.superAdminBusinesses}`;
        return;
      }
      if (!pathname.startsWith("/dashboard/super-admin")) {
        router.replace(ROUTES.superAdminBusinesses);
        return;
      }
    }

    if (currentUserRole === "OWNER") {
      if (isMultiDomain && isAdminDomain) {
        window.location.href = `${appUrl}${ROUTES.dashboard(business.slug)}`;
        return;
      }
      if (pathname.startsWith("/dashboard/super-admin")) {
        router.replace(ROUTES.dashboard(business.slug));
        return;
      }
      if (!auth.onboardingCompleted) {
        router.replace(ROUTES.onboarding);
        return;
      }
      const expectedPrefix = `/dashboard/${business.slug}`;
      if (!pathname.startsWith(expectedPrefix)) {
        const subPath = pathname.replace(/^\/dashboard\/?/, "");
        const targetSubPath = subPath && !subPath.startsWith("super-admin") && subPath !== business.slug ? `/${subPath}` : "";
        router.replace(`/dashboard/${business.slug}${targetSubPath}`);
      }
    }
  }, [currentUser, currentUserRole, hydrated, pathname, router, auth.onboardingCompleted, business.slug]);

  if (!hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--color-primary)] border-t-transparent" />
          <p className="text-sm text-[var(--color-text-muted)] font-medium">Memuat halaman...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return null;
  }

  if (currentUserRole === "SUPER_ADMIN" && !pathname.startsWith("/dashboard/super-admin")) {
    return null;
  }

  if (currentUserRole === "OWNER" && pathname.startsWith("/dashboard/super-admin")) {
    return null;
  }

  if (currentUserRole === "OWNER" && !auth.onboardingCompleted) {
    return null;
  }

  if (currentUserRole === "OWNER" && auth.onboardingCompleted) {
    const expectedPrefix = `/dashboard/${business.slug}`;
    if (!pathname.startsWith(expectedPrefix)) {
      return null;
    }
  }

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
