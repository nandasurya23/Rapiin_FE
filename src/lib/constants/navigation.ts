import { LayoutDashboard, MessageSquareText, NotebookPen, PhoneCall, Settings2, ChartColumn, UsersRound, Link2, ShieldCheck, WalletCards, Sparkles } from "lucide-react";
import type { ComponentType } from "react";
import { ROUTES } from "@/lib/routes";

export type NavItem = {
  label: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
};

export const APP_NAV_ITEMS: NavItem[] = [
  { label: "Hari Ini", href: ROUTES.dashboard, icon: LayoutDashboard },
  { label: "Konsol Pembantu", href: ROUTES.assistant, icon: Sparkles },
  { label: "Customer", href: ROUTES.customers, icon: UsersRound },
  { label: "Order / Booking", href: ROUTES.orders, icon: NotebookPen },
  { label: "Pesan Cepat", href: ROUTES.messages, icon: MessageSquareText },
  { label: "Nota", href: ROUTES.invoices, icon: PhoneCall },
  { label: "Laporan", href: ROUTES.reports, icon: ChartColumn },
  { label: "Link Bisnis", href: ROUTES.businessLink, icon: Link2 },
  { label: "Plan", href: ROUTES.plan, icon: WalletCards },
  { label: "Pengaturan", href: ROUTES.settings, icon: Settings2 },
];

export const MOBILE_NAV_ITEMS: NavItem[] = [
  { label: "Hari Ini", href: ROUTES.dashboard, icon: LayoutDashboard },
  { label: "Konsol Pembantu", href: ROUTES.assistant, icon: Sparkles },
  { label: "Order", href: ROUTES.orders, icon: NotebookPen },
  { label: "Customer", href: ROUTES.customers, icon: UsersRound },
  { label: "Pesan", href: ROUTES.messages, icon: MessageSquareText },
  { label: "Link", href: ROUTES.businessLink, icon: Link2 },
  { label: "Atur", href: ROUTES.settings, icon: Settings2 },
];

export const SUPER_ADMIN_NAV_ITEMS: NavItem[] = [
  { label: "Bisnis", href: ROUTES.superAdminBusinesses, icon: ShieldCheck },
  { label: "Upgrade", href: ROUTES.superAdminUpgradeRequests, icon: WalletCards },
];
