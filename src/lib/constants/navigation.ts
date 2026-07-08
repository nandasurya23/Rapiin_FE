import { LayoutDashboard, MessageSquareText, NotebookPen, PhoneCall, Receipt, Settings2, ChartColumn, UsersRound, Link2, ShieldCheck, WalletCards, Sparkles } from "lucide-react";
import type { ComponentType } from "react";
import { ROUTES } from "@/lib/routes";

export type NavItem = {
  label: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
};

export function getAppNavItems(slug: string): NavItem[] {
  return [
    { label: "Hari Ini", href: ROUTES.dashboard(slug), icon: LayoutDashboard },
    { label: "Asisten Pintar", href: ROUTES.assistant(slug), icon: Sparkles },
    { label: "Customer", href: ROUTES.customers(slug), icon: UsersRound },
    { label: "Order / Booking", href: ROUTES.orders(slug), icon: NotebookPen },
    { label: "Pesan Cepat", href: ROUTES.messages(slug), icon: MessageSquareText },
    { label: "Nota", href: ROUTES.invoices(slug), icon: Receipt },
    { label: "Laporan", href: ROUTES.reports(slug), icon: ChartColumn },
    { label: "Link Bisnis", href: ROUTES.businessLink(slug), icon: Link2 },
    { label: "Plan", href: ROUTES.plan(slug), icon: WalletCards },
    { label: "Pengaturan", href: ROUTES.settings(slug), icon: Settings2 },
  ];
}

export function getMobileNavItems(slug: string): NavItem[] {
  return [
    { label: "Hari Ini", href: ROUTES.dashboard(slug), icon: LayoutDashboard },
    { label: "Asisten Pintar", href: ROUTES.assistant(slug), icon: Sparkles },
    { label: "Order", href: ROUTES.orders(slug), icon: NotebookPen },
    { label: "Customer", href: ROUTES.customers(slug), icon: UsersRound },
    { label: "Pesan", href: ROUTES.messages(slug), icon: MessageSquareText },
    { label: "Link", href: ROUTES.businessLink(slug), icon: Link2 },
    { label: "Atur", href: ROUTES.settings(slug), icon: Settings2 },
  ];
}

export const SUPER_ADMIN_NAV_ITEMS: NavItem[] = [
  { label: "Bisnis", href: ROUTES.superAdminBusinesses, icon: ShieldCheck },
  { label: "Upgrade", href: ROUTES.superAdminUpgradeRequests, icon: WalletCards },
];
