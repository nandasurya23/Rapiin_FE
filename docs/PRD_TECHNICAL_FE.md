# Rapiin — PRD Technical Frontend

## 1. Document Metadata

**Product name:** Rapiin  
**Document type:** PRD Technical for Frontend  
**Version:** v1.0 MVP  
**Primary owner:** Frontend / Full-Stack Developer  
**Design source:** `design.md`  
**Product direction:** Buku admin online untuk UMKM yang jualan lewat WhatsApp.

---

## 2. Product Summary

Rapiin adalah tools operasional ringan untuk UMKM yang ingin merapikan customer, order/booking, follow-up WhatsApp, nota, dan laporan sederhana dalam satu dashboard.

Rapiin tidak diposisikan sebagai aplikasi kasir lengkap, accounting app, CRM enterprise, marketplace, atau AI tool. Rapiin adalah jembatan antara WhatsApp/Instagram/offline order dengan catatan bisnis yang lebih rapi.

### Core promise

> Dari chat jadi order. Dari order jadi nota. Dari nota jadi laporan.

### Main frontend goal

Membuat UI/UX yang:

- mudah dipahami dalam 5 detik;
- mobile-first;
- action-oriented;
- WhatsApp-first;
- tidak terasa seperti SaaS enterprise;
- murah terasa premium;
- cepat dipakai owner UMKM non-teknis.

---

## 3. MVP Scope

### MVP focus

Frontend MVP harus fokus pada alur:

```text
Customer masuk
↓
Dicatat sebagai customer/order/booking
↓
Di-follow-up via WhatsApp
↓
Status berubah
↓
Nota dibuat
↓
Order selesai
↓
Customer diminta review
↓
Owner melihat laporan sederhana
```

### MVP modules

1. Authentication
2. Onboarding bisnis
3. Dashboard Hari Ini
4. Customer manager
5. Order / Booking manager
6. Pesan Cepat WhatsApp
7. Nota / Invoice sederhana
8. Link Bisnis publik
9. Public order/booking form
10. Laporan sederhana
11. Settings bisnis

### Explicit non-goals for MVP

Do not build these in MVP:

- WhatsApp API resmi
- chatbot otomatis
- payment gateway
- QRIS
- accounting lengkap
- inventory kompleks
- payroll
- marketplace
- mobile app native
- Instagram DM integration
- multi-branch enterprise flow
- tax calculation
- AI-branded features

---

## 4. Target Users

### Primary user: Owner UMKM

Characteristics:

- sering menerima customer lewat WhatsApp, Instagram, link bio, atau offline;
- masih mencatat order di chat, notes, buku, atau spreadsheet;
- tidak mau belajar software rumit;
- butuh tahu hari ini harus follow-up siapa;
- butuh nota sederhana dan laporan ringan;
- mayoritas akses dari HP.

### Secondary user: Staff/Admin UMKM

Characteristics:

- membantu owner mencatat customer/order;
- melakukan follow-up manual via WhatsApp;
- update status order/booking;
- butuh UI yang jelas dan minim risiko salah klik.

---

## 5. Key User Problems

| Pain | Frontend response |
|---|---|
| Chat customer tenggelam di WhatsApp | Customer list + quick add + public form |
| Lupa follow-up | Dashboard Hari Ini + Follow-Up list |
| Booking/order kecampur | Order/Booking status lifecycle |
| Balasan WA berulang | Pesan Cepat + click-to-chat |
| Nota masih manual | Nota generator + public invoice page |
| Tidak punya link order rapi | Link Bisnis + public form |
| Rekap akhir bulan capek | Laporan sederhana + export CSV |
| Tools lain terlalu rumit | Bahasa UI sederhana + progressive disclosure |
| Owner sering buka dari HP | Mobile bottom nav + card list |

---

## 6. Product Principles for Frontend

1. **Action-first**  
   Setiap halaman harus memberi aksi jelas, bukan hanya menampilkan data.

2. **WhatsApp-first**  
   WhatsApp tetap jadi channel utama. Frontend harus menyediakan tombol `Chat WA`, `Follow-Up WA`, `Kirim Nota`, dan `Minta Review` secara jelas.

3. **Input 10–20 detik**  
   Tambah customer/order harus sangat cepat. Optional fields disembunyikan atau dibuat collapsible.

4. **Bahasa manusia**  
   Hindari istilah CRM, lead, pipeline, tenant, automation, analytics, revenue.

5. **Mobile-first**  
   Semua halaman utama harus nyaman dipakai dari layar HP.

6. **Low cognitive load**  
   Jangan tampilkan terlalu banyak charts, nested cards, dan konfigurasi teknis.

7. **Semi-automation first**  
   Sistem membantu menyusun pesan/link, tapi user tetap mengirim manual via WhatsApp.

---

## 7. Information Architecture

### App routes

```text
/auth/login
/auth/register
/onboarding

/app/dashboard
/app/customers
/app/customers/[customerId]
/app/orders
/app/orders/[orderId]
/app/messages
/app/messages/[templateId]
/app/invoices
/app/invoices/[invoiceId]
/app/reports
/app/business-link
/app/settings

/b/[businessSlug]
/b/[businessSlug]/order
/invoice/[invoiceCode]
```

### Desktop navigation

Sidebar:

1. Hari Ini
2. Customer
3. Order / Booking
4. Pesan Cepat
5. Nota
6. Laporan
7. Link Bisnis
8. Pengaturan

### Mobile navigation

Bottom nav:

1. Hari Ini
2. Order
3. Customer
4. Pesan
5. Lainnya

### Global actions

`+ Tambah` menu:

- Tambah Customer
- Tambah Order / Booking
- Buat Nota

---

## 8. Page Requirements

## 8.1 Auth Pages

### Login

**Route:** `/auth/login`

#### Requirements

- Email/phone field
- Password field
- Submit button
- Link to register
- Friendly product promise
- Error state for invalid credentials
- Loading state on submit

#### Copy direction

Title:

> Masuk ke Rapiin

Subtitle:

> Kelola customer, order, dan follow-up bisnismu dari satu tempat.

CTA:

> Masuk

---

### Register

**Route:** `/auth/register`

#### Requirements

- Name field
- Email/phone field
- Password field
- Submit button
- Link to login
- Loading and error state

Title:

> Mulai rapiin bisnismu

CTA:

> Buat Akun

---

## 8.2 Onboarding

**Route:** `/onboarding`

### Goal

User bisa membuat bisnis dan masuk dashboard dalam kurang dari 5 menit.

### Steps

#### Step 1 — Business info

Fields:

- Nama bisnis
- Nomor WhatsApp bisnis

CTA:

> Lanjut

#### Step 2 — Business mode

Options:

- Booking Jasa
- Order Produk
- Request Custom

Each option must have short helper text.

#### Step 3 — Niche template

Options:

- Studio Musik
- Barbershop
- Tattoo Studio
- Rental Motor
- Tour Travel
- Laundry
- Catering
- Produk Handmade
- Jasa Custom
- Lainnya

#### Step 4 — Success

Actions:

- Tambah Order Pertama
- Bagikan Link Bisnis
- Lihat Dashboard

### Technical frontend behavior

- Preserve state across steps.
- Validate each step before moving forward.
- Allow back navigation.
- Show progress indicator.
- On completion, call create business endpoint.
- Redirect to `/app/dashboard`.

---

## 8.3 Dashboard Hari Ini

**Route:** `/app/dashboard`

### Goal

Menjawab pertanyaan utama user:

> Hari ini harus ngapain?

### Required sections

1. Greeting + date
2. Summary cards
3. Perlu Diurus action list
4. Jadwal Hari Ini
5. Recent orders/bookings
6. Quick add button

### Summary cards

- Order/Booking Baru
- Perlu Follow-Up
- Belum Bayar / Belum DP
- Jadwal Hari Ini
- Selesai Hari Ini
- Omzet Selesai

### Action list item data

- Customer name
- Reason
- Related order/booking
- Status badge
- Due time/date
- Primary action

### Primary actions

- Follow-Up WA
- Chat WA
- Ubah Status
- Buat Nota
- Minta Review

### Empty state

Title:

> Hari ini masih aman

Subtitle:

> Belum ada order, booking, atau follow-up yang perlu diurus.

CTA:

> Tambah Order

### Acceptance criteria

- User can understand pending work without opening other pages.
- Every actionable item has at least one clear CTA.
- Mobile view uses stacked cards, not dense tables.

---

## 8.4 Customer Page

**Route:** `/app/customers`

### Goal

Membantu user melihat dan mengelola customer agar tidak hilang di chat.

### Required UI

- Page title
- Search input
- Filter chips
- Add customer button
- Customer list
- Empty state

### Filters

- Semua
- Baru
- Perlu Follow-Up
- Deal
- Selesai
- Batal

### Customer item fields

- Name
- WhatsApp number
- Status
- Source
- Last interaction date
- Last order/booking summary
- Chat WA action

### Add customer fields

Required:

- Name
- WhatsApp number

Optional:

- Source
- Status
- Notes

### Customer detail

Route or side panel:

- Customer info
- Notes
- Order/booking history
- Follow-up history
- Quick actions

### Quick actions

- Chat WA
- Tambah Order
- Buat Catatan
- Tandai Follow-Up

---

## 8.5 Order / Booking Page

**Route:** `/app/orders`

### Goal

Mencatat dan memantau setiap order, booking, atau request dalam status sederhana.

### Required UI

- Search input
- Status filters
- Date filters
- Add order button
- List view
- Optional board view later

### Order item fields

- Order title
- Customer name
- Date/time
- Total amount
- Payment status
- Main status
- Primary action

### Add quick order fields

Required:

- Customer name
- WhatsApp number
- Need/order title
- Status

Optional:

- Date
- Time
- Total
- DP
- Notes

### Mode-specific behavior

#### Booking Jasa statuses

- Inquiry
- Menunggu DP
- Confirmed
- Selesai
- Batal

#### Order Produk statuses

- Order Baru
- Diproses
- Dikirim / Diambil
- Selesai
- Batal

#### Request Custom statuses

- Request Masuk
- Dibahas
- Penawaran Dikirim
- Deal
- Selesai
- Batal

### Order detail actions

- Chat WA
- Ubah Status
- Buat Nota
- Reminder DP
- Minta Review

---

## 8.6 Pesan Cepat Page

**Route:** `/app/messages`

### Goal

Memudahkan owner mengirim pesan WhatsApp berulang tanpa mengetik ulang.

### Required UI

- Category tabs
- Template cards
- Edit template
- Preview message
- Variables helper

### Categories

- Inquiry
- Booking / Order
- Pembayaran
- Follow-Up
- Review
- Alamat
- Selesai

### Available variables

```text
{{customer_name}}
{{business_name}}
{{order_title}}
{{scheduled_date}}
{{scheduled_time}}
{{total_amount}}
{{dp_amount}}
```

### Template editor fields

- Template name
- Category
- Message content
- Preview

### Acceptance criteria

- User can edit template text safely.
- Variables are shown as simple chips/buttons.
- Preview updates instantly.
- Technical terms like automation are not used.

---

## 8.7 Nota Page

**Route:** `/app/invoices`

### Goal

Membuat nota sederhana dari order/booking agar bisnis terlihat profesional.

### Required UI

- Invoice list
- Status filter
- Create from order button
- Invoice detail
- Public invoice preview

### Invoice list fields

- Invoice number
- Customer name
- Total amount
- Payment status
- Created date
- Actions: View, Download, Kirim WA

### Invoice detail fields

- Business logo/name
- Invoice number
- Date
- Customer info
- Item table
- Subtotal
- Discount optional
- Total
- Payment status
- Notes

### Public invoice

**Route:** `/invoice/[invoiceCode]`

Required:

- Invoice summary
- Total
- Payment status
- Business contact
- Download button

---

## 8.8 Link Bisnis Page

**Route:** `/app/business-link`

### Goal

Membuat halaman publik sederhana agar customer bisa isi order/booking sendiri.

### Required UI

- Public link preview
- Copy/share link button
- Business info settings
- Services/products list
- Form settings
- Public page preview

### Public business page

**Route:** `/b/[businessSlug]`

Required sections:

- Business header
- Short description
- Services/products
- Order/booking form CTA
- WhatsApp button
- Location/map link
- Opening hours

### Public form

**Route:** `/b/[businessSlug]/order`

Form fields depend on business mode.

#### Booking Jasa form

- Name
- WhatsApp number
- Service
- Date
- Time
- Notes

#### Order Produk form

- Name
- WhatsApp number
- Product
- Quantity
- Address/notes
- Pickup/delivery method

#### Request Custom form

- Name
- WhatsApp number
- Request detail
- Deadline
- Estimated budget
- Notes

### Success message

> Data kamu sudah masuk. Admin akan menghubungi kamu lewat WhatsApp.

---

## 8.9 Laporan Page

**Route:** `/app/reports`

### Goal

Memberikan rekap sederhana tanpa membuat user merasa memakai accounting app.

### Metrics

- Total order/booking
- Order selesai
- Order batal
- Customer baru
- Omzet selesai
- Belum bayar
- Produk/layanan paling sering dipilih

### Filters

- Hari ini
- Minggu ini
- Bulan ini
- Custom date

### Actions

- Export CSV

### Acceptance criteria

- No excessive charts.
- Summary cards must be readable on mobile.
- Use term `Omzet`, not `Revenue`.

---

## 8.10 Settings Page

**Route:** `/app/settings`

### Sections

- Profil Bisnis
- WhatsApp
- Jam Buka
- Link Google Maps
- Logo
- Template Bisnis
- Team/Staff optional
- Billing later

### Acceptance criteria

- Changes have clear save state.
- Destructive actions require confirmation.
- Settings page remains simple and boring.

---

## 9. Critical User Flows

## 9.1 Onboarding Flow

```text
User daftar
↓
Isi nama bisnis + nomor WhatsApp
↓
Pilih mode bisnis
↓
Pilih template niche
↓
Sistem generate status, template pesan, dan form default
↓
Masuk Dashboard Hari Ini
```

### Frontend requirements

- Multi-step UI
- Local state persistence during flow
- Form validation
- Loading state on submit
- Safe redirect after success

---

## 9.2 Customer from Public Form

```text
Customer buka link bisnis
↓
Customer pilih layanan/produk
↓
Customer isi form
↓
Data masuk dashboard
↓
Customer tercatat otomatis
↓
Order/booking dibuat otomatis
↓
Admin klik Balas WA
↓
WhatsApp terbuka dengan pesan rapi
```

### Frontend requirements

- Public form must be mobile-friendly.
- Submit action must show loading and success state.
- Input validation must be clear.
- Admin should see new item in Dashboard.

---

## 9.3 Manual Input from WhatsApp

```text
Customer chat langsung ke WA owner
↓
Owner buka Rapiin
↓
Klik Tambah Cepat
↓
Input nama, WA, kebutuhan, status
↓
Simpan
↓
Customer/order masuk Dashboard
```

### Frontend requirements

- Quick add modal must open fast.
- Required fields must be minimal.
- Optional fields should not block submission.

---

## 9.4 Follow-Up Flow

```text
Customer status Inquiry lebih dari 24 jam
↓
Sistem masukkan ke Perlu Follow-Up
↓
Owner lihat di Dashboard Hari Ini
↓
Klik Follow-Up WA
↓
WhatsApp terbuka dengan template
↓
Owner kirim pesan
↓
Owner tandai sudah follow-up
```

### Frontend requirements

- Action item must explain why follow-up is needed.
- WhatsApp template must render variables.
- Mark as followed-up action must update UI optimistically.

---

## 9.5 Booking Flow

```text
Inquiry masuk
↓
Admin balas WA
↓
Customer setuju
↓
Status: Menunggu DP
↓
Customer bayar DP
↓
Status: Confirmed
↓
Jadwal muncul di Hari Ini
↓
Layanan selesai
↓
Status: Selesai
↓
Buat Nota
↓
Minta Review
```

### Frontend requirements

- Status update must be obvious.
- Payment status must be separate from order status.
- Booking date/time must appear on dashboard.

---

## 10. Functional Requirements

## 10.1 Authentication

- User can register.
- User can login.
- User can logout.
- Protected app routes redirect unauthenticated users to login.
- Auth errors are shown clearly.

## 10.2 Business Setup

- User can create one business during onboarding.
- Business has slug for public page.
- Business mode controls default statuses and fields.
- Niche template controls default message templates.

## 10.3 Customer Management

- User can create, read, update, and archive customers.
- Customer list supports search and status filter.
- Customer can be linked to multiple orders/bookings.
- Customer can be contacted through WhatsApp link.

## 10.4 Order / Booking Management

- User can create, read, update, and archive orders.
- Order can be linked to existing or newly created customer.
- Order supports status and payment status.
- Order supports total amount and DP amount.
- Order supports optional schedule date/time.
- Order detail supports WhatsApp actions and invoice creation.

## 10.5 Message Templates

- System provides default templates.
- User can edit templates.
- User can preview variable replacement.
- Generated WhatsApp URL must be encoded safely.

## 10.6 Invoice

- User can create invoice from order.
- User can view invoice list.
- User can open public invoice page.
- User can download invoice as PDF or use browser print fallback.
- User can send invoice link through WhatsApp.

## 10.7 Public Business Link

- Public page can be accessed without login.
- Customer can submit order/booking form.
- Submission creates customer and order/booking.
- Public page uses business branding.

## 10.8 Reports

- User can view simple metrics by date range.
- User can export CSV.
- Metrics must not claim accounting accuracy.

---

## 11. Non-Functional Requirements

### Performance

- Initial app shell should feel fast on mobile.
- Avoid unnecessary heavy charts/libraries.
- Lists should be paginated or virtualized later if large.
- Public pages must load quickly.

### Accessibility

- Inputs must have labels.
- Buttons must have text labels.
- Status badges must include readable text.
- Touch targets minimum 44px.
- Error messages must explain how to fix the issue.

### Responsiveness

- Mobile-first layout.
- Tables become card lists on mobile.
- Sidebar becomes bottom nav or drawer on mobile.
- Public forms are single-column.

### Reliability

- Show loading states on every mutation.
- Show optimistic UI only where rollback is easy.
- Use toast/inline feedback for success/error.
- Preserve user input during temporary errors.

### Security from FE side

- Never trust FE validation as final validation.
- Do not expose sensitive tokens in client code.
- Encode WhatsApp message URLs safely.
- Sanitize user-generated text before rendering rich output.
- Do not render arbitrary HTML from user input.
- Protected pages must check auth state.

---

## 12. Data Contracts for Frontend

These are frontend-facing shapes. Backend may use different internal structure.

### User

```ts
export type User = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  createdAt: string;
};
```

### Business

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

### Customer

```ts
export type CustomerStatus = 'NEW' | 'NEED_FOLLOW_UP' | 'DEAL' | 'DONE' | 'CANCELLED';

export type Customer = {
  id: string;
  businessId: string;
  name: string;
  whatsappNumber: string;
  source?: 'WHATSAPP' | 'INSTAGRAM' | 'OFFLINE' | 'REFERRAL' | 'PUBLIC_LINK' | 'OTHER';
  status: CustomerStatus;
  notes?: string;
  lastInteractionAt?: string;
  createdAt: string;
};
```

### Order

```ts
export type PaymentStatus = 'UNPAID' | 'DP_PAID' | 'PAID' | 'REFUNDED' | 'CANCELLED';

export type Order = {
  id: string;
  businessId: string;
  customerId: string;
  type: BusinessMode;
  title: string;
  status: string;
  paymentStatus: PaymentStatus;
  totalAmount?: number;
  dpAmount?: number;
  scheduledDate?: string;
  scheduledTime?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};
```

### MessageTemplate

```ts
export type MessageTemplate = {
  id: string;
  businessId: string;
  name: string;
  category: 'INQUIRY' | 'BOOKING_ORDER' | 'PAYMENT' | 'FOLLOW_UP' | 'REVIEW' | 'ADDRESS' | 'DONE';
  content: string;
  isDefault: boolean;
  createdAt: string;
};
```

### Invoice

```ts
export type Invoice = {
  id: string;
  businessId: string;
  orderId: string;
  invoiceNumber: string;
  publicCode: string;
  totalAmount: number;
  paymentStatus: PaymentStatus;
  createdAt: string;
};
```

### DashboardSummary

```ts
export type DashboardSummary = {
  newOrders: number;
  needFollowUp: number;
  unpaid: number;
  todaySchedule: number;
  completedToday: number;
  completedRevenueToday: number;
};
```

---

## 13. State and Validation Requirements

### Forms

Use schema validation for:

- onboarding business info;
- customer form;
- order form;
- public form;
- message template editor;
- invoice form/settings.

### UI states

Every data view must handle:

- loading state;
- empty state;
- error state;
- success state;
- unauthorized state where applicable.

### Optimistic updates

Recommended for:

- status update;
- mark follow-up done;
- template edit save confirmation after API returns.

Avoid optimistic updates for:

- invoice generation;
- public form submission;
- auth;
- destructive actions.

---

## 14. WhatsApp Click-to-Chat Requirement

### Behavior

When user clicks a WhatsApp action:

1. Select message template.
2. Replace variables with available data.
3. URL-encode final message.
4. Open WhatsApp link.

### URL format

```text
https://wa.me/{phoneNumber}?text={encodedMessage}
```

### Frontend helper requirements

- Normalize phone number to international format.
- Remove spaces, dashes, and plus sign where required.
- Validate missing phone number.
- Fallback to copy message if phone is invalid.

---

## 15. Acceptance Criteria by MVP Release

## MVP v1.0 is acceptable if:

- User can register/login.
- User can complete onboarding.
- User can create business.
- User can add customer.
- User can add order/booking.
- Dashboard shows summary and action list.
- User can update order status.
- User can open WhatsApp with prefilled message.
- User can create invoice from order.
- Public business page can receive order/booking form submission.
- User can view simple report.
- Mobile layout is usable for all primary flows.

## MVP v1.0 should not ship if:

- User cannot understand dashboard without training.
- Add order flow takes too many fields.
- WhatsApp action is hidden or confusing.
- Public form is hard to use on mobile.
- Status/payment status are mixed into one confusing field.
- Empty states do not guide user to action.

---

## 16. Recommended Build Order

```text
1. Auth pages
2. Onboarding
3. App shell/navigation
4. Customer CRUD
5. Order/Booking CRUD
6. Dashboard Hari Ini
7. WhatsApp template + click-to-chat
8. Public business page + form
9. Invoice/Nota
10. Reports
11. Settings polish
12. Niche template polish
```

---

## 17. UI Copy Rules

### Use

- Customer
- Calon customer
- Status
- Pesan Cepat
- Omzet
- Bisnis
- Alur kerja
- Tugas Hari Ini
- Nota

### Avoid

- CRM
- Pipeline
- Lead scoring
- Automation
- Revenue
- Tenant
- Workflow engine
- AI-powered
- Analytics dashboard

### Examples

Bad:

> Pipeline status updated.

Good:

> Status order berhasil diubah.

Bad:

> Create automation.

Good:

> Buat pesan cepat.

Bad:

> No leads found.

Good:

> Belum ada customer masuk.

---

## 18. Risks and Mitigations

| Risk | Mitigation |
|---|---|
| Product feels like generic CRM | Use action-first dashboard and Indonesian UMKM copy |
| User overwhelmed by forms | Progressive disclosure and quick add modal |
| Too expensive to operate | Avoid WhatsApp API/payment gateway in MVP |
| Low adoption because setup is hard | Niche templates and assisted setup flow |
| Data grows too large for simple list | Add pagination/filtering early |
| WhatsApp formatting broken | Centralize WhatsApp link helper and test phone formats |
| User thinks report is accounting | Use simple terms and avoid profit/tax claims |

---

## 19. Definition of Done for Frontend

A frontend feature is done when:

- UI matches design direction from `design.md`.
- Mobile layout is tested.
- Loading, error, empty, and success states exist.
- Form validation exists.
- Main action is clear.
- No technical jargon in user-facing text.
- Data mutation gives clear feedback.
- Components are reusable and typed.
- Page has basic accessibility labels.
- No sensitive data is exposed in client-only code.

