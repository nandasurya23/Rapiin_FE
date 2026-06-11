# Rapiin — Frontend Architecture

## 1. Document Metadata

**Product name:** Rapiin  
**Document type:** Frontend Architecture  
**Version:** v1.0 MVP  
**Design reference:** `design.md`  
**Technical PRD reference:** `PRD_TECHNICAL_FE.md`  
**Frontend direction:** Mobile-first, WhatsApp-first, action-first UMKM admin tool.

---

## 2. Architecture Goals

Frontend architecture Rapiin harus mendukung produk yang:

- mudah dipakai oleh owner UMKM non-teknis;
- cepat dibuka di mobile;
- reusable untuk banyak niche bisnis;
- aman dari sisi rendering dan client state;
- mudah dikembangkan oleh tim kecil/freelance;
- tidak over-engineered;
- siap berkembang dari MVP ke SaaS ringan.

### Engineering principles

1. **Simple first**  
   Jangan membangun arsitektur enterprise untuk MVP. Gunakan struktur yang rapi, typed, dan mudah dipahami.

2. **Feature-based organization**  
   Kode dipisah berdasarkan domain produk: customers, orders, invoices, messages, reports, business.

3. **Server-first where possible**  
   Data awal dan halaman utama sebaiknya server-rendered atau server-fetched bila menggunakan Next.js App Router.

4. **Client only for interactions**  
   Gunakan client components untuk forms, modals, filters, status update, preview template, dan WhatsApp actions.

5. **Reusable UI system**  
   Komponen dasar harus konsisten: buttons, inputs, cards, badges, modals, empty states, action list.

6. **Design token driven**  
   Warna, spacing, radius, typography, dan status styles harus dikontrol lewat token/class yang konsisten.

7. **No technical jargon in UI**  
   Arsitektur copy/components harus memudahkan penggunaan istilah Indonesia yang ramah UMKM.

---

## 3. Recommended Tech Stack

### Core

- **Next.js App Router**
- **TypeScript**
- **Tailwind CSS**
- **React Hook Form**
- **Zod**
- **TanStack Query** for client-side async state where needed
- **date-fns** for date formatting
- **lucide-react** for icons

### Optional for MVP

- **Zustand** for lightweight UI/global state
- **React Table / TanStack Table** only if table complexity grows
- **html2canvas / react-to-print / server-generated PDF** for invoice export depending backend approach

### Avoid early

- heavy chart libraries
- large UI frameworks with strong default style
- complex global state like Redux unless product grows
- drag-drop board in MVP
- WhatsApp API client integration
- payment SDKs

---

## 4. Application Layers

```text
app routes
↓
feature pages
↓
feature components
↓
shared components
↓
services/actions
↓
API client / server actions
↓
types + schemas + utils
```

### Layer responsibilities

#### `app/`

- Route definitions
- Layouts
- Metadata
- Route groups
- Server data fetching where needed

#### `features/`

- Domain-specific components
- Feature hooks
- Feature schemas
- Feature services
- Feature-specific UI composition

#### `components/`

- Shared UI components
- Layout components
- Navigation components
- Form primitives
- Feedback components

#### `lib/`

- API client
- Auth helpers
- Formatting helpers
- WhatsApp URL helper
- Constants
- Utility functions

#### `types/`

- Shared TypeScript types

#### `schemas/`

- Shared Zod schemas where cross-feature

---

## 5. Suggested Folder Structure

```text
src/
  app/
    (auth)/
      login/
        page.tsx
      register/
        page.tsx
    onboarding/
      page.tsx
    (app)/
      layout.tsx
      dashboard/
        page.tsx
      customers/
        page.tsx
        [customerId]/
          page.tsx
      orders/
        page.tsx
        [orderId]/
          page.tsx
      messages/
        page.tsx
        [templateId]/
          page.tsx
      invoices/
        page.tsx
        [invoiceId]/
          page.tsx
      reports/
        page.tsx
      business-link/
        page.tsx
      settings/
        page.tsx
    b/
      [businessSlug]/
        page.tsx
        order/
          page.tsx
    invoice/
      [invoiceCode]/
        page.tsx

  components/
    ui/
      button.tsx
      input.tsx
      textarea.tsx
      select.tsx
      badge.tsx
      card.tsx
      modal.tsx
      sheet.tsx
      tabs.tsx
      toast.tsx
      empty-state.tsx
      skeleton.tsx
    layout/
      app-shell.tsx
      sidebar.tsx
      mobile-bottom-nav.tsx
      topbar.tsx
      page-header.tsx
    shared/
      status-badge.tsx
      whatsapp-button.tsx
      quick-add-menu.tsx
      action-list-item.tsx
      money-text.tsx
      date-text.tsx
      confirmation-dialog.tsx

  features/
    auth/
      components/
      schemas.ts
      services.ts
      types.ts
    onboarding/
      components/
      schemas.ts
      services.ts
      constants.ts
    dashboard/
      components/
      services.ts
      types.ts
    customers/
      components/
      schemas.ts
      services.ts
      types.ts
      hooks.ts
    orders/
      components/
      schemas.ts
      services.ts
      types.ts
      constants.ts
      hooks.ts
    messages/
      components/
      schemas.ts
      services.ts
      types.ts
      template-utils.ts
    invoices/
      components/
      schemas.ts
      services.ts
      types.ts
    business-link/
      components/
      schemas.ts
      services.ts
      types.ts
    reports/
      components/
      services.ts
      types.ts
    settings/
      components/
      schemas.ts
      services.ts

  lib/
    api/
      client.ts
      endpoints.ts
      errors.ts
    auth.ts
    env.ts
    format.ts
    whatsapp.ts
    status.ts
    routes.ts
    utils.ts

  styles/
    globals.css
    tokens.css

  types/
    common.ts
    business.ts
    customer.ts
    order.ts
    invoice.ts
    message.ts
```

---

## 6. Route Groups

### Auth routes

```text
src/app/(auth)/login/page.tsx
src/app/(auth)/register/page.tsx
```

No app shell. Minimal layout.

### Protected app routes

```text
src/app/(app)/layout.tsx
```

Contains:

- auth guard
- sidebar desktop
- bottom nav mobile
- topbar
- main content wrapper

### Public routes

```text
src/app/b/[businessSlug]/page.tsx
src/app/b/[businessSlug]/order/page.tsx
src/app/invoice/[invoiceCode]/page.tsx
```

No auth required. Must be optimized for mobile.

---

## 7. Rendering Strategy

### Server components recommended for

- App shell initial data
- Dashboard page initial summary
- Customer list initial render
- Order list initial render
- Invoice detail public page
- Public business page
- Reports initial summary

### Client components required for

- Forms
- Modals
- Quick add
- Filter chips
- Search interactions
- Status update controls
- Message template preview
- WhatsApp action buttons
- Toast notifications
- Mobile navigation state

### Guideline

Default to server components for static/data-heavy page shells. Move interactivity into small client components.

---

## 8. State Management Strategy

### Local component state

Use for:

- modal open/close
- active tab
- current filter
- temporary form state
- preview state

### React Hook Form state

Use for:

- onboarding forms
- customer form
- order form
- public order form
- message template editor
- invoice form
- settings form

### URL state

Use for:

- list filters
- search query
- status filter
- date range filter
- pagination

Example:

```text
/app/orders?status=MENUNGGU_DP&date=today&q=raka
```

### TanStack Query

Use for client-side mutations and refetching:

- update order status
- mark follow-up done
- create quick order
- edit template
- create invoice
- submit public form if page is client-rendered

### Zustand optional

Use only for:

- global quick-add modal
- selected business context if backend supports multiple businesses
- temporary app UI state

Avoid storing server data in Zustand.

---

## 9. Data Fetching Pattern

### Preferred pattern

```text
Server page fetches initial data
↓
Pass data to feature component
↓
Client component handles interaction/mutation
↓
Mutation invalidates/refetches relevant query or refreshes route
```

### API client

Centralize in:

```text
src/lib/api/client.ts
```

API client must handle:

- base URL
- credentials/session if needed
- JSON parse
- error normalization
- timeout if implemented

### Example API wrapper

```ts
export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    throw await normalizeApiError(response);
  }

  return response.json() as Promise<T>;
}
```

---

## 10. Type System

Create shared types aligned with PRD contracts.

### Business type

```ts
export type BusinessMode = 'BOOKING_SERVICE' | 'PRODUCT_ORDER' | 'CUSTOM_REQUEST';

export type Business = {
  id: string;
  ownerId: string;
  name: string;
  slug: string;
  whatsappNumber: string;
  mode: BusinessMode;
  niche: string;
  logoUrl?: string;
  address?: string;
  googleMapsUrl?: string;
  openingHours?: string;
  createdAt: string;
};
```

### Payment status

```ts
export type PaymentStatus = 'UNPAID' | 'DP_PAID' | 'PAID' | 'REFUNDED' | 'CANCELLED';
```

### Customer status

```ts
export type CustomerStatus = 'NEW' | 'NEED_FOLLOW_UP' | 'DEAL' | 'DONE' | 'CANCELLED';
```

### UI status mapping

Keep backend status values separate from UI labels.

```ts
export const paymentStatusLabel: Record<PaymentStatus, string> = {
  UNPAID: 'Belum Bayar',
  DP_PAID: 'Sudah DP',
  PAID: 'Lunas',
  REFUNDED: 'Refund',
  CANCELLED: 'Batal',
};
```

---

## 11. Validation Architecture

Use Zod schemas per feature.

### Customer schema

```ts
export const customerSchema = z.object({
  name: z.string().min(1, 'Nama customer wajib diisi'),
  whatsappNumber: z.string().min(8, 'Nomor WhatsApp belum valid'),
  source: z.string().optional(),
  status: z.string().optional(),
  notes: z.string().optional(),
});
```

### Order schema

```ts
export const orderSchema = z.object({
  customerName: z.string().min(1, 'Nama customer wajib diisi'),
  whatsappNumber: z.string().min(8, 'Nomor WhatsApp belum valid'),
  title: z.string().min(1, 'Kebutuhan/order wajib diisi'),
  status: z.string().min(1, 'Status wajib dipilih'),
  scheduledDate: z.string().optional(),
  scheduledTime: z.string().optional(),
  totalAmount: z.coerce.number().optional(),
  dpAmount: z.coerce.number().optional(),
  notes: z.string().optional(),
});
```

### Validation principles

- FE validation is for UX only.
- Backend must validate again.
- Error copy must explain fix in Indonesian.
- Required fields must be minimal.

---

## 12. Design System Architecture

### Tokens

Define tokens in Tailwind config or CSS variables.

```css
:root {
  --color-primary: #147A5C;
  --color-primary-soft: #EAF8F2;
  --color-text-main: #17211D;
  --color-text-secondary: #5E6B65;
  --color-text-muted: #8A9690;
  --color-border: #DDE5E1;
  --color-background: #F7FAF8;
  --color-surface: #FFFFFF;
  --color-surface-soft: #F1F6F3;
}
```

### Component style rules

- Cards: 14–16px radius, border, minimal shadow.
- Buttons: 10–12px radius, clear labels.
- Badges: soft background, readable label.
- Inputs: labels required, 44px minimum height.
- Tables: desktop only, transform to cards on mobile.

### Status badge component

```tsx
<StatusBadge status="Menunggu DP" tone="warning" />
```

Tones:

- info
- warning
- success
- danger
- neutral

### WhatsApp button component

```tsx
<WhatsAppButton
  phoneNumber={customer.whatsappNumber}
  message={renderedMessage}
  label="Follow-Up WA"
/>
```

Requirements:

- validate phone number;
- encode message;
- open in new tab/window;
- fallback copy message if invalid.

---

## 13. Layout Architecture

### Desktop app shell

```text
Sidebar fixed
Topbar sticky
Main content scroll area
Optional right panel on wide screens
```

### Mobile app shell

```text
Topbar
Main content
Bottom nav
Floating quick add optional
```

### App shell components

```text
AppShell
Sidebar
MobileBottomNav
Topbar
PageHeader
QuickAddMenu
```

### Page layout convention

Each page should follow:

```tsx
<PageHeader title="Customer" description="Kelola customer yang masuk ke bisnismu." action={<AddCustomerButton />} />
<MainContent>
  <FeatureToolbar />
  <FeatureList />
</MainContent>
```

---

## 14. Feature Architecture

## 14.1 Dashboard Feature

Folder:

```text
features/dashboard/
```

Components:

- `DashboardSummaryCards`
- `TodayActionList`
- `TodayScheduleList`
- `RecentOrdersList`
- `DashboardEmptyState`

Services:

- `getDashboardSummary()`
- `getTodayActions()`
- `getTodaySchedule()`

Types:

- `DashboardSummary`
- `TodayAction`

### TodayAction type

```ts
export type TodayAction = {
  id: string;
  type: 'FOLLOW_UP' | 'UNPAID' | 'SCHEDULE' | 'REVIEW' | 'NEW_ORDER';
  customerName: string;
  customerPhone?: string;
  reason: string;
  statusLabel: string;
  dueAt?: string;
  orderId?: string;
};
```

---

## 14.2 Customers Feature

Folder:

```text
features/customers/
```

Components:

- `CustomerList`
- `CustomerCard`
- `CustomerFilters`
- `CustomerDetailPanel`
- `AddCustomerModal`
- `CustomerHistoryList`

Hooks:

- `useCustomerFilters()`
- `useCreateCustomer()`
- `useUpdateCustomer()`

Services:

- `getCustomers()`
- `getCustomerById()`
- `createCustomer()`
- `updateCustomer()`
- `archiveCustomer()`

---

## 14.3 Orders Feature

Folder:

```text
features/orders/
```

Components:

- `OrderList`
- `OrderCard`
- `OrderFilters`
- `OrderDetailPanel`
- `AddQuickOrderModal`
- `OrderStatusSelect`
- `PaymentStatusSelect`
- `OrderTimeline`

Constants:

- `bookingServiceStatuses`
- `productOrderStatuses`
- `customRequestStatuses`

Services:

- `getOrders()`
- `getOrderById()`
- `createOrder()`
- `updateOrder()`
- `updateOrderStatus()`
- `archiveOrder()`

---

## 14.4 Messages Feature

Folder:

```text
features/messages/
```

Components:

- `MessageTemplateList`
- `MessageTemplateCard`
- `MessageTemplateEditor`
- `MessagePreview`
- `VariableChips`

Utils:

- `renderTemplate()`
- `extractTemplateVariables()`
- `buildWhatsAppMessage()`

Services:

- `getMessageTemplates()`
- `updateMessageTemplate()`
- `resetMessageTemplate()`

### Template render example

```ts
export function renderTemplate(template: string, values: Record<string, string | number | undefined>) {
  return template.replace(/{{(.*?)}}/g, (_, key) => {
    const value = values[key.trim()];
    return value === undefined || value === null ? '' : String(value);
  });
}
```

---

## 14.5 Invoices Feature

Folder:

```text
features/invoices/
```

Components:

- `InvoiceList`
- `InvoiceCard`
- `InvoiceDetail`
- `InvoicePreview`
- `CreateInvoiceFromOrderButton`
- `PublicInvoiceView`

Services:

- `getInvoices()`
- `getInvoiceById()`
- `createInvoiceFromOrder()`
- `getPublicInvoice()`

---

## 14.6 Business Link Feature

Folder:

```text
features/business-link/
```

Components:

- `BusinessLinkPreview`
- `PublicBusinessPage`
- `PublicOrderForm`
- `ServicesProductsList`
- `ShareLinkButton`
- `BusinessLinkSettingsForm`

Services:

- `getPublicBusiness()`
- `submitPublicOrder()`
- `updateBusinessLinkSettings()`

---

## 14.7 Reports Feature

Folder:

```text
features/reports/
```

Components:

- `ReportSummaryCards`
- `ReportDateFilter`
- `TopItemsList`
- `ExportCsvButton`

Services:

- `getReportSummary()`
- `exportReportCsv()`

---

## 15. WhatsApp Helper Architecture

File:

```text
src/lib/whatsapp.ts
```

### Responsibilities

- normalize Indonesian phone number;
- validate number;
- encode message;
- build `wa.me` URL;
- open or copy fallback.

### Example

```ts
export function normalizeWhatsappNumber(input: string): string {
  const cleaned = input.replace(/[^\d]/g, '');

  if (cleaned.startsWith('0')) {
    return `62${cleaned.slice(1)}`;
  }

  if (cleaned.startsWith('62')) {
    return cleaned;
  }

  return cleaned;
}

export function buildWhatsAppUrl(phoneNumber: string, message: string): string {
  const normalized = normalizeWhatsappNumber(phoneNumber);
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${normalized}?text=${encoded}`;
}
```

### UX fallback

If phone number invalid:

- show toast: `Nomor WhatsApp belum valid.`
- provide copy message button.

---

## 16. Status System Architecture

Status should be flexible per business mode and niche.

### Base mode statuses

```ts
export const defaultStatusesByMode = {
  BOOKING_SERVICE: ['Inquiry', 'Menunggu DP', 'Confirmed', 'Selesai', 'Batal'],
  PRODUCT_ORDER: ['Order Baru', 'Diproses', 'Dikirim / Diambil', 'Selesai', 'Batal'],
  CUSTOM_REQUEST: ['Request Masuk', 'Dibahas', 'Penawaran Dikirim', 'Deal', 'Selesai', 'Batal'],
} as const;
```

### Status tone mapping

```ts
export function getStatusTone(status: string) {
  const lower = status.toLowerCase();

  if (lower.includes('selesai') || lower.includes('confirmed') || lower.includes('deal')) return 'success';
  if (lower.includes('dp') || lower.includes('pending') || lower.includes('menunggu')) return 'warning';
  if (lower.includes('batal') || lower.includes('cancel') || lower.includes('no show')) return 'danger';
  if (lower.includes('baru') || lower.includes('inquiry') || lower.includes('request')) return 'info';

  return 'neutral';
}
```

### Rule

Never rely on color only. Always show label text.

---

## 17. Niche Template Architecture

File:

```text
features/onboarding/constants.ts
```

### Niche template shape

```ts
export type NicheTemplate = {
  id: string;
  name: string;
  recommendedMode: BusinessMode;
  defaultFields: string[];
  defaultStatuses: string[];
  defaultMessageTemplates: Array<{
    name: string;
    category: string;
    content: string;
  }>;
};
```

### Example

```ts
export const studioMusikTemplate: NicheTemplate = {
  id: 'studio-musik',
  name: 'Studio Musik',
  recommendedMode: 'BOOKING_SERVICE',
  defaultFields: ['Ruangan', 'Tanggal', 'Jam mulai', 'Durasi', 'DP', 'Catatan alat'],
  defaultStatuses: ['Tanya Jadwal', 'Menunggu DP', 'Confirmed', 'Selesai', 'Batal'],
  defaultMessageTemplates: [
    {
      name: 'Konfirmasi Booking',
      category: 'BOOKING_ORDER',
      content: 'Halo kak {{customer_name}}, booking {{order_title}} pada {{scheduled_date}} pukul {{scheduled_time}} sudah kami catat ya kak.',
    },
  ],
};
```

---

## 18. Form Architecture

### Form stack

- React Hook Form
- Zod resolver
- Shared form components

### Shared form components

```text
FormField
TextInput
TextareaInput
SelectInput
MoneyInput
DateInput
TimeInput
PhoneInput
SubmitButton
FormError
```

### Form rules

- Always show labels.
- Required fields first.
- Optional fields collapsed or visually secondary.
- Error messages in Indonesian.
- Save button must show loading state.
- Preserve input on error.

---

## 19. Public Page Architecture

Public pages must be lightweight and mobile-first.

### Public business page

Route:

```text
/b/[businessSlug]
```

Data needed:

- business profile;
- services/products;
- public form config;
- WhatsApp number;
- location/map;
- opening hours.

### Public order form

Route:

```text
/b/[businessSlug]/order
```

Form behavior:

- no login required;
- validate phone number and required fields;
- submit creates customer/order;
- show success page/message;
- offer WhatsApp CTA after submission.

### Security note

Frontend should assume public form can be abused. Use captcha/rate limit at backend later. Frontend can add honeypot field if needed, but backend is required for real protection.

---

## 20. Error Handling

### API error shape

Normalize errors to:

```ts
export type AppError = {
  message: string;
  code?: string;
  fieldErrors?: Record<string, string[]>;
};
```

### Error UI patterns

- Form field error for validation.
- Toast for mutation failure.
- Inline error state for page-level fetch failure.
- Retry button for fetch failure.
- Confirmation dialog for destructive action.

### Copy examples

```text
Nomor WhatsApp belum valid.
Data belum berhasil disimpan. Coba lagi ya.
Order tidak ditemukan.
Kamu belum punya akses ke halaman ini.
```

---

## 21. Loading and Empty State Architecture

### Loading states

- Page skeleton for data pages.
- Button spinner for submit/mutation.
- Inline loading for list filters if needed.

### Empty states

Each feature must have useful empty state.

Examples:

```text
Belum ada customer
Tambah customer pertama atau bagikan link bisnis agar customer masuk otomatis.
```

```text
Belum ada order
Catat order pertama dari chat WhatsApp atau aktifkan link bisnis.
```

```text
Hari ini masih aman
Belum ada order, booking, atau follow-up yang perlu diurus.
```

---

## 22. Accessibility Architecture

Requirements:

- semantic HTML;
- labels for all inputs;
- buttons are real buttons, not divs;
- icons have text labels or aria-label;
- modals trap focus;
- keyboard accessible forms;
- sufficient color contrast;
- touch target minimum 44px;
- do not rely on color only for status.

---

## 23. Performance Architecture

### MVP performance rules

- Keep bundle small.
- Avoid heavy chart libraries.
- Avoid complex animation libraries.
- Lazy-load modals and heavy editors if needed.
- Use image optimization for logos/public pages.
- Paginate lists after initial MVP threshold.

### Public page performance

- Public business page should be fast and mostly static if possible.
- Cache public business data when safe.
- Avoid loading dashboard-specific code on public pages.

---

## 24. Security Considerations for Frontend

Frontend security rules:

- Never trust client-side validation.
- Never store sensitive API secrets in frontend env.
- Do not render arbitrary HTML from user input.
- Sanitize or escape user-generated content.
- Use secure cookies/session managed by backend/auth layer.
- Guard protected routes.
- Normalize and encode WhatsApp messages.
- Prevent open redirects from query params.
- Be careful with public invoice URLs; use unguessable public codes.

### Public form concerns

Potential abuse:

- spam submissions;
- fake phone numbers;
- script injection in notes;
- extremely long messages.

Frontend mitigations:

- length limits;
- basic validation;
- honeypot field optional;
- clear submit cooldown UI optional.

Backend must enforce real validation and rate limits.

---

## 25. Testing Strategy

### Unit tests

Test utilities:

- `normalizeWhatsappNumber`
- `buildWhatsAppUrl`
- `renderTemplate`
- `getStatusTone`
- currency formatting
- date formatting

### Component tests

Recommended for:

- StatusBadge
- WhatsAppButton
- AddQuickOrderModal
- MessageTemplateEditor
- PublicOrderForm
- InvoicePreview

### E2E test flows

Critical flows:

1. Register/login
2. Complete onboarding
3. Add customer manually
4. Add order manually
5. Update status
6. Click WhatsApp action
7. Submit public order form
8. Create invoice from order
9. View public invoice
10. View dashboard follow-up item

---

## 26. Environment Configuration

Use typed env helper.

```text
NEXT_PUBLIC_APP_URL=
NEXT_PUBLIC_API_URL=
```

Optional later:

```text
NEXT_PUBLIC_SENTRY_DSN=
NEXT_PUBLIC_POSTHOG_KEY=
```

Rules:

- Never expose server secrets with `NEXT_PUBLIC_`.
- Validate required env at startup/build.

---

## 27. Build Phases

## Phase 1 — App Foundation

Deliver:

- app shell;
- auth pages;
- onboarding UI;
- design tokens;
- layout components;
- shared UI primitives.

## Phase 2 — Core Admin

Deliver:

- customer CRUD UI;
- order/booking CRUD UI;
- quick add;
- status badges;
- filters/search.

## Phase 3 — WhatsApp Workflow

Deliver:

- message templates;
- WhatsApp helper;
- WhatsApp action buttons;
- follow-up action list;
- dashboard Hari Ini.

## Phase 4 — Public Link

Deliver:

- public business page;
- public order/booking form;
- public submission success state;
- business link settings.

## Phase 5 — Nota and Reports

Deliver:

- invoice list;
- invoice detail;
- public invoice page;
- simple reports;
- export CSV.

## Phase 6 — Niche Polish

Deliver:

- studio musik template;
- tattoo template;
- barbershop template;
- rental template;
- tour template;
- template-specific copy/status defaults.

---

## 28. Coding Conventions

### Naming

- Components: PascalCase
- Hooks: `useSomething`
- Services: verb-based, e.g. `getCustomers`, `createOrder`
- Types: PascalCase
- Constants: camelCase or UPPER_CASE for global constants

### Component rules

- Keep components small and focused.
- Feature components should not import from unrelated features directly.
- Shared UI components should not contain business logic.
- Business logic belongs in feature utils/services.

### Copy rules

- User-facing copy in Indonesian.
- Avoid technical terms.
- Keep labels short.
- Use action verbs.

---

## 29. Example Page Composition

### Orders page

```tsx
export default async function OrdersPage({ searchParams }: OrdersPageProps) {
  const orders = await getOrders(searchParams);

  return (
    <PageShell>
      <PageHeader
        title="Order / Booking"
        description="Pantau semua order, booking, dan request customer."
        action={<AddQuickOrderButton />}
      />
      <OrderFilters />
      <OrderList orders={orders.data} />
    </PageShell>
  );
}
```

### Client mutation component

```tsx
'use client';

export function UpdateOrderStatusButton({ orderId, nextStatus }: Props) {
  const mutation = useUpdateOrderStatus();

  return (
    <Button
      onClick={() => mutation.mutate({ orderId, status: nextStatus })}
      disabled={mutation.isPending}
    >
      Ubah Status
    </Button>
  );
}
```

---

## 30. Definition of Done

Frontend architecture implementation is considered solid when:

- folders follow feature-based structure;
- app routes are clear;
- mobile navigation works;
- shared components are reusable;
- forms are typed and validated;
- WhatsApp helper is centralized;
- status system is centralized;
- design tokens are consistent;
- no technical jargon leaks into UI;
- loading, error, and empty states exist;
- protected and public routes are separated;
- public pages do not import heavy app dashboard code;
- MVP flows can be completed end-to-end.

---

## 31. Future Architecture Considerations

After MVP has real users, consider:

- role-based multi-admin;
- billing/subscription module;
- usage limits per plan;
- notification center;
- reminder scheduling;
- official WhatsApp API integration;
- payment gateway add-on;
- advanced reports;
- custom fields per niche;
- offline-first mobile PWA behavior;
- audit log for staff actions.

Do not build these before validating MVP usage.

