export const ROUTES = {
  login: "/auth/login",
  register: "/auth/register",
  forgotPassword: "/auth/forgot-password",   // Step 1: request reset link
  resetPassword: "/auth/reset-password",     // Step 2: enter token + new password
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
