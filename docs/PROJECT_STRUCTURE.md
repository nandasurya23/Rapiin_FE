# Project Structure

This document details the folder organization and file distribution within the Rapiin Frontend repository. Rapiin adheres to a **modular feature-based layout** alongside a Next.js App Router structure.

---

## High-Level Project Tree

```
Rapiin_FE/
├── docs/                 # Developer onboarding & architectural documentation
├── public/               # Static assets (images, logos, fonts, etc.)
├── src/                  # Application source code
│   ├── app/              # Next.js App Router (pages, layouts, API routing config)
│   ├── components/       # Shared presentation & provider layer components
│   │   ├── layout/       # App layout structures (headers, navigation, sidebars)
│   │   ├── providers/    # Global React contexts (Auth, data caching, settings)
│   │   ├── shared/       # Cross-feature visual blocks (modals, calendars, etc.)
│   │   └── ui/           # Atom-level UI primitives (buttons, inputs, cards)
│   ├── features/         # Feature-sliced modules (independent business domains)
│   ├── hooks/            # Global custom React hooks
│   ├── lib/              # Shared libraries, configurations, and core utilities
│   ├── services/         # Service layers (fetch calls, serializers, mappers)
│   └── types/            # Global TypeScript interface/type definitions
├── tailwind.config.ts    # Tailwind styling system configurations
├── tsconfig.json         # TypeScript compiler configurations
├── package.json          # Node dependencies and scripts
└── next.config.mjs       # Next.js bundler and framework configurations
```

---

## Detailed Directory Breakdown

### 1. `src/app` (Next.js Routing)
Defines the file-system routing structure. Files inside this folder are primarily Page, Layout, Loading, or Error files mapping to browser endpoints.
* **`src/app/auth/`**: Authentication entry routes including login, signup, forgot-password, and password reset.
* **`src/app/b/[businessSlug]/`**: Public-facing client-side storefront and online booking layouts.
* **`src/app/dashboard/`**: Secure, authenticated pages for business owners (calendar, bookings, templates, invoices, analytics, and admin configuration panels).
* **`src/app/invoice/`**: Publicly accessible verification routes for generating and verifying PDF/visual invoices.
* **`src/app/onboarding/`**: Onboarding wizard sequence for newly registered businesses.

### 2. `src/features` (Domain Modules)
Houses self-contained business domains. Each subfolder corresponds to a specific functional capability, preventing spaghetti code across routes.
* **`auth/`**: Login/registration components and credential management.
* **`business-link/`**: Quick booking link builder and public profile preview.
* **`customers/`**: CRM client database grids, edit drawers, and status tracking.
* **`dashboard/`**: Overview dashboard, analytics dashboards, and interactive calendar grids.
* **`invoices/`**: Invoice template builders, visual seals, and payment validation.
* **`messages/`**: WhatsApp template composer, category variables, and messaging drafts.
* **`onboarding/`**: Steps for business setup inputs.
* **`orders/`**: Booking list view, detail drawers, status transitions, and scheduling calculations.
* **`plan/`**: Subscription options, plan details, and pricing grids.
* **`public-business/`**: Public booking forms, calendar time-slot selectors, and confirmation overlays.
* **`settings/`**: Business profile configuration, opening hours, resource definitions, and payment settings.
* **`super-admin/`**: Business directory audits, upgrade request approval logs, and platform controls.

### 3. `src/components` (Reusable Components)
UI parts that are not bound to a specific domain or page.
* **`layout/`**: Core site structural frameworks like the `sidebar-nav.tsx`, `dashboard-shell.tsx`, etc.
* **`providers/`**: Context wraps like the [AppDataProvider](file:///Users/nandasurya/Documents/Rapiin/Rapiin_FE/src/components/providers/app-data-provider.tsx) which hosts state hydration.
* **`ui/`**: Base UI elements built from custom designs (buttons, badges, inputs, tabs, checkboxes, tables, etc.).

### 4. `src/services` (Network Layer)
Handles external request orchestration. Each file maps to specific backend routes:
* **`auth.service.ts`**: Login, registration, profile fetching, password recovery.
* **`business.service.ts`**: Business config retrieval and metadata editing.
* **`customer.service.ts`**: CRM customer CRUD operations.
* **`order.service.ts`**: Order creation, status adjustments, slot holds.
* **`invoice.service.ts`**: Invoicing logs and visual generation calls.
* **`admin.service.ts`**: Admin queries for multi-tenant overviews.
* **`mapper.ts`**: Protocol translation mapping raw network DTOs into clean TypeScript interfaces.

### 5. `src/lib` (Core Infrastructure)
Contains utility scripts, helper formulas, and environment client settings:
* **`api-client.ts`**: Customized fetch request wrapper with interceptors for auth failure (triggers unauthorized event) and response parsing.
* **`storage-service.ts`**: Methods managing localStorage caching and backup archives.
* **`subscription.ts`**: Usage checks and rules governing trial limits (customer and invoice limits based on business plan tier).
* **`booking.ts`**: Date, scheduling, and conflict resolution arithmetic.
