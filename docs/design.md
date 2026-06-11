# Rapiin — design.md

## 1. Product Direction

**Product name:** Rapiin  
**Product type:** Buku admin online untuk UMKM yang jualan lewat WhatsApp.  
**Core positioning:** Rapiin membantu UMKM merapikan customer, order/booking, follow-up WhatsApp, nota, dan laporan sederhana dari satu dashboard yang mudah dipakai.

Rapiin bukan aplikasi kasir lengkap, bukan accounting rumit, bukan CRM enterprise, bukan chatbot AI, dan bukan marketplace. Rapiin adalah tools operasional ringan yang berada di antara WhatsApp dan pembukuan.

### Main promise

> Dari chat jadi order. Dari order jadi nota. Dari nota jadi laporan.

### Product personality

- Mudah dipahami dalam 5 detik.
- Terasa ringan, ramah, dan dekat dengan UMKM Indonesia.
- Tidak terlihat seperti software korporat yang dingin.
- Tidak terlalu playful, tetap profesional.
- Clean, rapi, modern, dan mobile-first.
- Fokus pada aksi harian, bukan grafik kompleks.

### Target users

UMKM kecil sampai menengah yang sehari-hari mengelola customer dari WhatsApp, Instagram, offline, atau link bio.

Contoh niche awal:

- Studio musik / rental studio
- Barbershop / salon
- Tattoo studio
- Rental motor
- Tour travel
- Laundry
- Catering / makanan rumahan
- Jasa custom / vendor kecil
- Beauty clinic kecil
- Hampers / produk handmade

---

## 2. Design Philosophy

Rapiin harus terasa seperti **buku admin digital yang pintar**, bukan aplikasi bisnis yang menakutkan.

### Design principles

1. **Action-first**  
   Setiap halaman harus menjawab: “user harus ngapain sekarang?”  
   Jangan mulai dari data kosong atau grafik berat.

2. **WhatsApp-first**  
   Rapiin tidak mengganti WhatsApp. Rapiin membantu merapikan kerja dari WhatsApp.

3. **Input cepat**  
   Tambah customer/order harus bisa selesai dalam 10–20 detik.

4. **Bahasa manusia**  
   Jangan gunakan istilah teknis seperti CRM, pipeline, automation, revenue, tenant, analytics. Gunakan istilah yang dekat dengan UMKM.

5. **Satu layar, satu tujuan**  
   Jangan membuat user memilih terlalu banyak hal sekaligus.

6. **Murah terasa premium**  
   Walaupun target harga murah, UI tidak boleh terlihat murahan.

7. **Tidak template pasaran**  
   Hindari tampilan SaaS generik dengan card berlebihan, gradient berlebihan, border radius terlalu besar, shadow tebal, dan dashboard chart penuh.

---

## 3. Visual Style Direction

### Keywords

- Clean
- Soft professional
- Calm productivity
- WhatsApp-friendly
- Admin ringan
- Mobile-first
- Local business friendly
- Minimal but useful
- Warm neutral
- Clear hierarchy

### Overall look

Rapiin menggunakan gaya **clean operational dashboard** dengan sentuhan hangat. UI harus terasa rapi, ringan, dan cepat. Jangan terlalu techy. Jangan terlalu korporat. Jangan terlalu lucu.

Bayangkan kombinasi:

- Kerapian Linear / Notion
- Kejelasan Trello / Airtable
- Kedekatan WhatsApp Business
- Kesederhanaan buku catatan admin UMKM

Tapi jangan meniru langsung. Ambil prinsipnya saja.

### Visual mood

- Background lembut, bukan putih kosong yang terlalu dingin.
- Banyak ruang napas.
- Komponen padat tapi tidak sesak.
- Status dan action mudah terlihat.
- Mobile layout harus sangat nyaman untuk owner UMKM yang sering buka dari HP.

---

## 4. Color Direction

Gunakan warna yang memberi kesan rapi, aman, dan dekat dengan transaksi harian.

### Primary color

Gunakan warna hijau modern yang mengingatkan pada WhatsApp, tapi jangan terlalu mirip WhatsApp.

Recommended primary:

- Deep Green: `#147A5C`
- Fresh Green: `#20A67A`
- Soft Mint Background: `#EAF8F2`

### Neutral colors

- Main text: `#17211D`
- Secondary text: `#5E6B65`
- Muted text: `#8A9690`
- Border: `#DDE5E1`
- Background: `#F7FAF8`
- Surface: `#FFFFFF`
- Soft surface: `#F1F6F3`

### Supporting status colors

Do not overuse bright colors. Keep status color soft.

- New / Info: `#2563EB`
- Waiting / Pending: `#D97706`
- Success / Done: `#15803D`
- Danger / Cancelled: `#DC2626`
- Neutral / Draft: `#64748B`

### Color rules

- Primary green is for main CTA only.
- Status colors should appear as small badges, not large blocks.
- Avoid too many gradients.
- Avoid neon colors.
- Avoid dark dashboard by default.
- Use soft green backgrounds for selected states.

---

## 5. Typography

### Font direction

Use a clean sans-serif font with good readability on mobile.

Recommended:

- Inter
- Plus Jakarta Sans
- Geist Sans
- Manrope

### Type style

- Headings: medium-bold, clear, not too large.
- Body text: readable, friendly.
- Labels: concise.
- Numbers: clear and aligned.

### Typography rules

- Avoid all caps except tiny labels.
- Use short Bahasa Indonesia labels.
- Avoid long descriptions inside cards.
- Prioritize scannability.

Example hierarchy:

- Page title: 24–28px, 600–700 weight
- Section title: 18–20px, 600 weight
- Card title: 15–16px, 600 weight
- Body: 14–15px, 400–500 weight
- Small label: 12–13px, 500 weight

---

## 6. Layout System

### Desktop layout

Use a simple dashboard layout:

- Left sidebar fixed
- Top bar with business switcher/search/quick add
- Main content area
- Right insight/action panel optional on wide screens

Desktop max width should not feel too stretched. Keep content readable.

### Mobile layout

Mobile-first is very important.

Use bottom navigation:

1. Hari Ini
2. Order
3. Customer
4. Pesan
5. Lainnya

Mobile top bar:

- Business name
- Quick add button
- Notification/follow-up indicator

### Spacing

Use generous spacing, but keep admin workflows efficient.

- Page padding desktop: 24–32px
- Page padding mobile: 16px
- Card padding: 16–20px
- Section gap: 24px
- Input gap: 12–16px

### Border radius

Use moderate border radius. Do not over-round.

- Cards: 14–16px
- Buttons: 10–12px
- Inputs: 10–12px
- Badges: pill is okay for status only

### Shadows

Use minimal shadows.

- Prefer border + subtle background.
- Avoid heavy drop shadows.
- Use shadow only for floating panels, modals, or dropdowns.

---

## 7. Navigation Structure

### Main dashboard menu

1. Hari Ini
2. Customer
3. Order / Booking
4. Pesan Cepat
5. Nota
6. Laporan
7. Link Bisnis
8. Pengaturan

### Mobile bottom nav

1. Hari Ini
2. Order
3. Customer
4. Pesan
5. Lainnya

### Naming rules

Use Indonesian user-facing terms:

- CRM → Customer
- Lead → Calon Customer
- Pipeline → Status
- Revenue → Omzet
- Automation → Pesan Cepat
- Analytics → Laporan
- Invoice → Nota
- Tenant → Bisnis
- Task → Tugas Hari Ini

---

## 8. Main Pages

## 8.1 Auth Pages

### Login page

Goal: fast login, no noise.

Layout:

- Left side: short product promise and illustration/preview card
- Right side: login form
- Mobile: single column

Content:

Title:

> Masuk ke Rapiin

Subtitle:

> Kelola customer, order, dan follow-up bisnismu dari satu tempat.

Fields:

- Email / Nomor HP
- Password

CTA:

> Masuk

Secondary:

> Belum punya akun? Daftar gratis

### Register page

Title:

> Mulai rapiin bisnismu

Subtitle:

> Buat akun gratis dan coba catat order pertamamu hari ini.

Fields:

- Nama
- Email / Nomor HP
- Password

CTA:

> Buat Akun

---

## 8.2 Onboarding Flow

Goal: user aktif dalam kurang dari 5 menit.

### Step 1 — Nama bisnis

Title:

> Bisnis kamu namanya apa?

Fields:

- Nama bisnis
- Nomor WhatsApp bisnis

CTA:

> Lanjut

### Step 2 — Pilih cara jualan

Title:

> Biasanya kamu menerima apa?

Options:

1. Booking Jasa  
   Untuk jadwal, layanan, DP, dan appointment.

2. Order Produk  
   Untuk pesanan barang, makanan, atau produk fisik.

3. Request Custom  
   Untuk permintaan jasa khusus, quotation, dan project kecil.

CTA:

> Pilih & Lanjut

### Step 3 — Pilih template bisnis

Title:

> Pilih template yang paling dekat dengan bisnismu

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

Helper copy:

> Template ini bisa diubah nanti. Rapiin hanya bantu menyiapkan status, form, dan pesan awal.

CTA:

> Masuk Dashboard

### Step 4 — Success state

Title:

> Dashboard kamu sudah siap

Subtitle:

> Sekarang kamu bisa mulai tambah customer, catat order, atau bagikan link bisnis.

CTA options:

- Tambah Order Pertama
- Bagikan Link Bisnis
- Lihat Dashboard

---

## 8.3 Dashboard — Hari Ini

This is the most important page.

### Main goal

Show what the business owner needs to handle today.

### Layout

Top section:

- Greeting
- Business name
- Date
- Quick add button

Example:

> Selamat sore, Nanda  
> Ini yang perlu diurus hari ini.

Main cards:

1. Order / Booking Baru
2. Perlu Follow-Up
3. Belum Bayar / Belum DP
4. Jadwal Hari Ini
5. Selesai Hari Ini
6. Omzet Selesai

### Primary component: Action List

Section title:

> Perlu Diurus

Each item should show:

- Customer name
- Reason
- Status badge
- Time/date
- Main action button

Example item:

- Raka Wijaya
- Belum bayar DP untuk booking Studio 2 jam
- Badge: Menunggu DP
- Button: Follow-Up WA

### Empty state

Title:

> Hari ini masih aman

Subtitle:

> Belum ada order, booking, atau follow-up yang perlu diurus.

CTA:

> Tambah Order

### Design rule

Dashboard should not feel like analytics software. It should feel like a simple daily work checklist.

---

## 8.4 Customer Page

### Goal

Help UMKM remember every customer and their history.

### Layout

- Header: Customer
- Search bar
- Filter chips
- Add customer button
- Customer list/table

### Filters

- Semua
- Baru
- Perlu Follow-Up
- Deal
- Selesai
- Batal

### Customer card/list item

Show:

- Name
- WhatsApp number
- Last interaction
- Status
- Source
- Last order/booking
- Action: Chat WA

### Customer detail page/panel

Sections:

1. Customer info
2. Notes
3. Order/booking history
4. Follow-up history
5. Quick actions

Quick actions:

- Chat WA
- Tambah Order
- Buat Catatan
- Tandai Follow-Up

### Empty state

Title:

> Belum ada customer

Subtitle:

> Tambah customer pertama atau bagikan link bisnis agar customer masuk otomatis.

CTA:

> Tambah Customer

---

## 8.5 Order / Booking Page

### Goal

Track every order, booking, or request in a simple status flow.

### Layout

- Header: Order / Booking
- Search
- Filter by status
- Filter by date
- Add button
- Status board or list view

### View options

For MVP, list view is safer. Board view can be optional later.

### List item should show

- Order title
- Customer name
- Date/time
- Total amount
- Payment status
- Main status
- Main action

### Status badges

Booking Jasa:

- Inquiry
- Menunggu DP
- Confirmed
- Selesai
- Batal

Order Produk:

- Order Baru
- Diproses
- Dikirim / Diambil
- Selesai
- Batal

Request Custom:

- Request Masuk
- Dibahas
- Penawaran Dikirim
- Deal
- Selesai
- Batal

### Order detail page/panel

Sections:

1. Customer info
2. Order details
3. Payment status
4. Notes
5. Timeline
6. Quick actions

Quick actions:

- Chat WA
- Ubah Status
- Buat Nota
- Reminder DP
- Minta Review

### Add Order modal/page

Must be very fast.

Required fields:

- Customer name
- WhatsApp number
- Need/order title
- Status

Optional fields:

- Date
- Time
- Total
- DP
- Notes

Design rule:

Use progressive disclosure. Do not show too many fields at once.

---

## 8.6 Pesan Cepat Page

### Goal

Help owner send repeated WhatsApp messages quickly.

### Layout

- Header: Pesan Cepat
- Category tabs
- Template cards
- Edit template button

### Categories

- Inquiry
- Booking / Order
- Pembayaran
- Follow-Up
- Review
- Alamat
- Selesai

### Template card

Show:

- Template title
- Preview text
- Variables used
- Edit button

### Template editor

Fields:

- Template name
- Category
- Message content
- Available variables

Available variables:

- `{{customer_name}}`
- `{{business_name}}`
- `{{order_title}}`
- `{{scheduled_date}}`
- `{{scheduled_time}}`
- `{{total_amount}}`
- `{{dp_amount}}`

### Design rule

Make templates feel like reusable chat notes, not technical automation.

---

## 8.7 Nota Page

### Goal

Create simple professional notes/invoices from orders.

### Layout

- Header: Nota
- List of invoices
- Status filter
- Create from order button

### Invoice list item

Show:

- Invoice number
- Customer name
- Total amount
- Payment status
- Created date
- Actions: View, Download, Kirim WA

### Invoice detail

Design should look printable and clean.

Include:

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

### Public invoice page

Customer-facing page should be simple:

- Invoice summary
- Total
- Status
- Business contact
- Download button

---

## 8.8 Link Bisnis Page

### Goal

Let UMKM create a simple public page for order/booking.

### Layout

- Preview public page
- Business info settings
- Services/products list
- Form settings
- Share link button

### Public page sections

1. Business header
2. Short description
3. Services/products
4. Order/booking form
5. WhatsApp button
6. Location/map link
7. Opening hours

### Public page style

Public page must be mobile-first because most customers open from Instagram/WhatsApp.

It should feel like a simple link-in-bio page, but more transactional.

### Public form rules

- Minimal fields
- Large touch-friendly inputs
- Clear submit CTA
- Confirmation after submit

CTA examples:

- Kirim Booking
- Kirim Order
- Kirim Request

Success message:

> Data kamu sudah masuk. Admin akan menghubungi kamu lewat WhatsApp.

---

## 8.9 Laporan Page

### Goal

Give simple business recap without overwhelming the owner.

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

### Design rules

- Do not overuse charts.
- Use simple summary cards and clean table.
- One simple bar chart is okay, but not required for MVP.
- Export CSV button should be visible.

---

## 8.10 Settings Page

### Sections

1. Profil Bisnis
2. WhatsApp
3. Jam Buka
4. Link Google Maps
5. Logo
6. Template Bisnis
7. Team/Staff optional
8. Billing optional later

### Design rule

Settings should be boring, clear, and safe. No flashy design.

---

## 9. Key Components

## 9.1 Quick Add Button

A persistent CTA for adding new work.

Desktop:

- Top-right button: `+ Tambah`

Mobile:

- Floating action button or top-right button.

Menu options:

- Tambah Customer
- Tambah Order / Booking
- Buat Nota

## 9.2 Status Badge

Small pill badge.

Rules:

- Use soft background.
- Text must be readable.
- Do not use intense full-color blocks.

## 9.3 WhatsApp Action Button

Main action for many flows.

Label examples:

- Chat WA
- Follow-Up WA
- Kirim Nota
- Minta Review

Visual:

- Use green outline or green filled depending on priority.
- Include WhatsApp icon if available.

## 9.4 Action List Item

Used on Dashboard Hari Ini.

Must show:

- Who
- Why
- Status
- What to do next

## 9.5 Empty State

Empty state should guide user to action.

Example:

Title:

> Belum ada order

Subtitle:

> Catat order pertama atau bagikan link bisnis agar customer bisa isi form sendiri.

CTA:

> Tambah Order

## 9.6 Public Form

Input must be large and easy.

Rules:

- One column only
- No tiny labels
- Clear required fields
- Submit button sticky on mobile if form is long

---

## 10. MVP User Flows

## 10.1 Onboarding Flow

```text
User daftar
↓
Isi nama bisnis + nomor WhatsApp
↓
Pilih mode bisnis:
- Booking Jasa
- Order Produk
- Request Custom
↓
Pilih template niche
↓
Sistem generate status, template pesan, dan form default
↓
Masuk Dashboard Hari Ini
```

## 10.2 Customer from Public Form

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

## 10.3 Manual Input from WhatsApp

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

## 10.4 Follow-Up Flow

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

## 10.5 Booking Flow

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

## 10.6 Order Product Flow

```text
Order masuk
↓
Status: Order Baru
↓
Admin proses
↓
Status: Diproses
↓
Buat Nota
↓
Customer bayar
↓
Status pembayaran: Lunas
↓
Status order: Dikirim / Diambil
↓
Status: Selesai
↓
Minta Review
```

## 10.7 Nota Flow

```text
Admin buka order
↓
Klik Buat Nota
↓
Data order otomatis masuk nota
↓
Admin review/edit
↓
Generate PDF / public invoice link
↓
Kirim via WhatsApp
```

---

## 11. Niche Template Direction

The product must feel flexible without being complicated.

### Template: Studio Musik

Default fields:

- Nama band/customer
- Nomor WA
- Ruangan
- Tanggal
- Jam mulai
- Durasi
- Total harga
- DP
- Catatan alat

Default statuses:

- Tanya Jadwal
- Menunggu DP
- Confirmed
- Selesai
- Batal

Default message templates:

- Kirim harga sewa studio
- Konfirmasi booking
- Reminder DP
- Reminder H-1
- Aturan studio
- Minta review

### Template: Tattoo Studio

Default fields:

- Nama customer
- Nomor WA
- Style tattoo
- Ukuran
- Area tubuh
- Referensi gambar
- Estimasi budget
- Tanggal konsultasi
- DP

Default statuses:

- Inquiry
- Konsultasi
- Menunggu DP
- Jadwal Confirmed
- Selesai
- Batal

### Template: Barbershop

Default fields:

- Nama customer
- Nomor WA
- Layanan
- Barber pilihan
- Tanggal
- Jam
- Catatan

Default statuses:

- Booking Baru
- Confirmed
- Selesai
- No Show
- Batal

### Template: Rental Motor

Default fields:

- Nama customer
- Nomor WA
- Jenis motor
- Tanggal mulai
- Tanggal selesai
- Lokasi pickup
- DP
- Status pembayaran

Default statuses:

- Inquiry
- Menunggu DP
- Confirmed
- Aktif
- Selesai
- Batal

---

## 12. Copywriting Tone

### Tone

- Ramah
- Singkat
- Tidak terlalu formal
- Tidak terlalu bercanda
- Langsung ke aksi
- Pakai bahasa Indonesia yang mudah

### Avoid

- CRM
- Pipeline
- Automation
- Revenue
- Tenant
- Workflow engine
- Conversion optimization
- AI-powered

### Use instead

- Customer
- Calon customer
- Status
- Pesan cepat
- Omzet
- Bisnis
- Alur kerja
- Saran follow-up

### Example microcopy

Instead of:

> No leads found.

Use:

> Belum ada customer masuk.

Instead of:

> Create automation.

Use:

> Buat pesan cepat.

Instead of:

> Pipeline status updated.

Use:

> Status order berhasil diubah.

Instead of:

> Revenue this month.

Use:

> Omzet selesai bulan ini.

---

## 13. Interaction Rules

### Buttons

Primary CTA:

- Use for main action only.
- Examples: Tambah Order, Simpan, Kirim Booking, Buat Nota.

Secondary CTA:

- For supporting action.
- Examples: Batal, Lihat Detail, Edit.

WhatsApp CTA:

- Should be highly visible.
- Use label that explains the action: `Follow-Up WA`, not just `WA`.

### Forms

- Keep fields short.
- Use smart defaults.
- Use optional sections collapsed by default.
- Validate clearly.
- Avoid long multi-step forms except onboarding.

### Modals

Use modals for quick actions:

- Tambah customer
- Tambah order cepat
- Ubah status
- Pilih template pesan

Use full page for complex detail:

- Order detail
- Customer detail
- Settings

### Confirmation

Use confirmation for destructive actions only:

- Delete order
- Delete customer
- Cancel booking

---

## 14. Responsive Behavior

### Desktop

- Sidebar visible
- Tables can be used
- Right panel can show detail preview
- Multi-column dashboard allowed

### Tablet

- Sidebar collapsible
- Cards become two columns
- Tables should become list cards if narrow

### Mobile

- Bottom nav
- List cards instead of tables
- Sticky main CTA where needed
- Large touch targets
- Minimal columns
- Avoid dense charts

---

## 15. Accessibility Rules

- Text contrast must be readable.
- Buttons must have clear labels.
- Do not rely only on color for status.
- Use icons with labels.
- Inputs need labels, not only placeholders.
- Touch targets minimum 44px height.
- Error messages should explain how to fix the issue.

---

## 16. Design Do and Don't

### Do

- Make it feel simple and trustworthy.
- Prioritize mobile experience.
- Use action-oriented dashboard.
- Make WhatsApp actions one click away.
- Use calm colors and clear status badges.
- Make empty states useful.
- Use niche templates to make onboarding feel magical.

### Don't

- Do not make it look like a generic SaaS admin template.
- Do not overload dashboard with charts.
- Do not use too many nested cards.
- Do not use excessive border radius.
- Do not use heavy shadows.
- Do not use technical business jargon.
- Do not position it as AI.
- Do not make onboarding long.

---

## 17. Suggested Landing Page Direction

Although the MVP should focus on app UI first, a simple marketing landing page can help later.

### Landing page sections

1. Hero
2. Pain section
3. How it works
4. Features
5. Niche examples
6. Pricing preview
7. CTA

### Hero copy

Title:

> Rapiin order, booking, dan customer dari WhatsApp.

Subtitle:

> Tools admin online untuk UMKM yang ingin customer lebih rapi, follow-up tidak kelewat, dan nota bisa dibuat cepat.

CTA:

> Coba Gratis

Secondary CTA:

> Lihat Contoh Dashboard

### Pain section

Use relatable pain:

- Chat customer tenggelam
- Lupa follow-up
- Booking kecampur
- Nota masih manual
- Rekap akhir bulan capek

### How it works

1. Bagikan link bisnis
2. Customer isi form
3. Order masuk dashboard
4. Balas via WhatsApp
5. Buat nota dan laporan

---

## 18. MVP Screens to Generate in Stitch

Generate these screens first:

1. Login
2. Register
3. Onboarding Step 1 — Business Info
4. Onboarding Step 2 — Business Mode
5. Onboarding Step 3 — Niche Template
6. Dashboard Hari Ini
7. Customer List
8. Customer Detail
9. Order/Booking List
10. Order/Booking Detail
11. Add Quick Order Modal
12. Pesan Cepat List
13. Template Editor
14. Nota List
15. Invoice Detail/Public Invoice
16. Link Bisnis Settings
17. Public Business Page
18. Public Booking/Order Form
19. Laporan
20. Settings

---

## 19. Stitch Prompt Direction

When generating UI in Stitch, use this direction:

Create a clean, modern, mobile-first Indonesian UMKM admin tool called Rapiin. It is a WhatsApp-first admin dashboard for managing customers, orders/bookings, follow-ups, quick WhatsApp message templates, simple invoices, public business links, and lightweight reports. The design should feel like a friendly digital admin book, not a complex SaaS CRM. Use warm neutral backgrounds, soft green primary color, moderate border radius, minimal shadows, clear action hierarchy, and concise Indonesian copy. Avoid generic SaaS dashboard style, excessive charts, heavy gradients, huge rounded cards, and technical jargon. The key dashboard screen is “Hari Ini”, focused on daily actions: new orders, follow-ups, unpaid DP, today’s schedule, completed orders, and simple omzet. Make the UI simple enough for non-technical UMKM owners to understand in 5 seconds.

---

## 20. Final Product Feel

Rapiin should make users feel:

- “Oh, ini gampang.”
- “Customer gua nggak bakal hilang lagi.”
- “Gua bisa follow-up lebih rapi.”
- “Bisnis kecil gua kelihatan lebih profesional.”
- “Ini murah tapi kepake tiap hari.”

The final UI must look practical, trustworthy, and friendly. It should not look like a complex startup dashboard built for enterprise teams.

