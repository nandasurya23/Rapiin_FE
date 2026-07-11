# Routing Architecture

This document describes how URL routing is structured in Rapiin, including the dynamic paths, Next.js routing paradigms, and the global routes dictionary.

---

## 1. Routing Paradigms

Rapiin utilizes **Next.js App Router** structure, where directories under `src/app/` define URL segments. Pages use either layout nesting or dynamic slugs:

1. **Root Layout (`src/app/layout.tsx`):** Provides global styles, font configuration, and page headers.
2. **Dashboard Layout (`src/app/dashboard/layout.tsx`):** Wraps all dashboard subroutes in the [AppDataProvider](file:///Users/nandasurya/Documents/Rapiin/Rapiin_FE/src/components/providers/app-data-provider.tsx) and applies authentication guards.
3. **Storefront Layout (`src/app/b/[businessSlug]/`):** Hosts the customer-facing booking portals. It is publicly accessible without user session checks.

---

## 2. Global Routes Config (`src/lib/routes.ts`)

To avoid hardcoded path strings throughout features, routes are managed in a centralized object:

```typescript
export const ROUTES = {
  login: "/auth/login",
  superAdminLogin: "/auth/super-admin/login",
  register: "/auth/register",
  forgotPassword: "/auth/forgot-password",
  resetPassword: "/auth/reset-password",
  onboarding: "/onboarding",
  dashboard: (slug: string) => `/dashboard/${slug}`,
  customers: (slug: string) => `/dashboard/${slug}/customers`,
  orders: (slug: string) => `/dashboard/${slug}/orders`,
  messages: (slug: string) => `/dashboard/${slug}/messages`,
  invoices: (slug: string) => `/dashboard/${slug}/invoices`,
  reports: (slug: string) => `/dashboard/${slug}/reports`,
  businessLink: (slug: string) => `/dashboard/${slug}/business-link`,
  settings: (slug: string) => `/dashboard/${slug}/settings`,
  plan: (slug: string) => `/dashboard/${slug}/plan`,
  assistant: (slug: string) => `/dashboard/${slug}/assistant`,
  superAdminBusinesses: "/dashboard/super-admin/businesses",
  superAdminBusinessDetail: (businessId: string) => `/dashboard/super-admin/businesses/${businessId}`,
  superAdminUpgradeRequests: "/dashboard/super-admin/upgrade-requests",
  publicBusiness: (slug: string) => `/b/${slug}`,
  publicBusinessOrder: (slug: string) => `/b/${slug}/order`,
  invoice: (code: string) => `/invoice/${code}`,
} as const;
```

---

## 3. Dynamic Route Parameters

* **`[businessSlug]`**: Used in storefront and workspace routes to identify a tenant (e.g., `/dashboard/barbershop-a`). Components read this segment using Next.js `useParams()` or page props.
* **`[businessId]`**: Used in super-admin panels to inspect particular business records.
* **`[code]`**: Used in public invoice sharing URLs (e.g., `/invoice/INV-2024-001`).
