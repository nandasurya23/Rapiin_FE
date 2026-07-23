import { LayoutDashboard, MessageSquareText, NotebookPen, Receipt, Settings2, ChartColumn, UsersRound, Link2, ShieldCheck, WalletCards, Sparkles, Key, FileText, SearchCheck } from "lucide-react";
import type { ComponentType } from "react";
import { ROUTES } from "@/lib/routes";

export type NavItem = {
  label: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
  group?: string;
};

export function getAppNavItems(slug: string): NavItem[] {
  return [
    // Menu Utama (Penting)
    { label: "Hari Ini", href: ROUTES.dashboard(slug), icon: LayoutDashboard, group: "Utama" },
    { label: "Booking & Order", href: ROUTES.orders(slug), icon: NotebookPen, group: "Utama" },
    { label: "Customer (CRM)", href: ROUTES.customers(slug), icon: UsersRound, group: "Utama" },
    
    // Operasional
    { label: "Pesan Cepat", href: ROUTES.messages(slug), icon: MessageSquareText, group: "Operasional" },
    { label: "Laporan & Shift", href: ROUTES.reports(slug), icon: ChartColumn, group: "Operasional" },
    { label: "Riwayat Nota", href: ROUTES.invoices(slug), icon: Receipt, group: "Operasional" },
    
    // Fitur Tambahan & Pengaturan
    { label: "Asisten Pintar", href: ROUTES.assistant(slug), icon: Sparkles, group: "Fitur & Pengaturan" },
    { label: "Cek Asli Nota", href: ROUTES.invoiceChecker(slug), icon: SearchCheck, group: "Fitur & Pengaturan" },
    { label: "Link Bisnis", href: ROUTES.businessLink(slug), icon: Link2, group: "Fitur & Pengaturan" },
    { label: "Plan & Billing", href: ROUTES.plan(slug), icon: WalletCards, group: "Fitur & Pengaturan" },
    { label: "Pengaturan", href: ROUTES.settings(slug), icon: Settings2, group: "Fitur & Pengaturan" },
  ];
}

export function getMobileNavItems(slug: string): NavItem[] {
  return [
    { label: "Hari Ini", href: ROUTES.dashboard(slug), icon: LayoutDashboard },
    { label: "Booking", href: ROUTES.orders(slug), icon: NotebookPen },
    { label: "Pesan", href: ROUTES.messages(slug), icon: MessageSquareText },
    { label: "Customer", href: ROUTES.customers(slug), icon: UsersRound },
  ];
}

export function getMobileMoreItems(slug: string): NavItem[] {
  return [
    { label: "Asisten Pintar", href: ROUTES.assistant(slug), icon: Sparkles },
    { label: "Link Bisnis", href: ROUTES.businessLink(slug), icon: Link2 },
    { label: "Nota", href: ROUTES.invoices(slug), icon: Receipt },
    { label: "Laporan", href: ROUTES.reports(slug), icon: ChartColumn },
    { label: "Plan", href: ROUTES.plan(slug), icon: WalletCards },
    { label: "Pengaturan", href: ROUTES.settings(slug), icon: Settings2 },
    { label: "Cek Asli Nota", href: ROUTES.invoiceChecker(slug), icon: SearchCheck }, // PRO feature
  ];
}

export const SUPER_ADMIN_NAV_ITEMS: NavItem[] = [
  { label: "Bisnis", href: ROUTES.superAdminBusinesses, icon: ShieldCheck },
  { label: "Upgrade", href: ROUTES.superAdminUpgradeRequests, icon: WalletCards },
  { label: "Reset Password", href: ROUTES.superAdminResetRequests, icon: Key },
  { label: "Activity Log", href: ROUTES.superAdminAuditLogs, icon: FileText },
  { label: "Cek Asli Nota", href: ROUTES.superAdminInvoiceChecker, icon: SearchCheck },
];
