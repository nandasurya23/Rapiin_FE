# Frontend Flow Audit

Dokumen ini merupakan hasil pemetaan *end-to-end* terhadap *codebase* frontend aplikasi `Rapiin`. Semua arsitektur backend akan dirancang berdasarkan flow yang ada di sini.

## 1. Global State & App Data Provider
Frontend menggunakan simulasi backend lokal via `app-data-provider.tsx` yang menyimpan state utama:
- `Auth`: Informasi pengguna yang login (`currentUserId`, `users`), status `onboardingCompleted`.
- `Business`: Informasi profil bisnis utama (nama, slug, konfigurasi mode, layanan).
- `Customers`: Daftar pelanggan bisnis.
- `Orders`: Daftar transaksi/pesanan.
- `Invoices`: Daftar tagihan pesanan.
- `Subscriptions`: Data langganan (plan, status trial/active).
- `SuperAdminData`: Upgrade requests, backup logs, action logs.
- `MessageTemplates`: Template pesan ke pelanggan.
- `PublicSubmissions`: Data form publik yang di-submit pelanggan.

## 2. Authentication & Onboarding
### User Journey
- **Login (`/auth/login`)**: Memasukkan email/password. Jika berhasil, state `currentUserId` diisi.
- **Register (`/auth/register`)**: Membuat akun baru. Flow ini akan meng-create `AuthUser` dan mengarah ke onboarding.
- **Onboarding (`/onboarding`)**: Setelah register, user harus mengisi profil `Business` (nama, mode, dsb). Setelah selesai, `onboardingCompleted` menjadi `true`.

## 3. Core Business Flows (Role: OWNER)
### 3.1. Dashboard (`/app/dashboard`)
- **Tujuan**: Melihat ringkasan aktivitas, pesanan masuk.
- **CRUD**: Read-only agregasi pesanan.

### 3.2. Order Management (`/app/orders`)
- **Tujuan**: Manajemen pesanan, board status.
- **CRUD Order**: Create (via sheet), Update (pindah status).
- **Dependency**: Membutuhkan `Customer` dan opsi status.

### 3.3. Customer Management (`/app/customers`)
- **Tujuan**: CRM sederhana dari data yang berelasi dengan Order.

### 3.4. Invoices (`/app/invoices`)
- **Tujuan**: Membuat tagihan berdasarkan `Order`.

### 3.5. Settings & Plan (`/app/settings`, `/app/plan`)
- **Tujuan**: Edit profil, minta upgrade paket.

## 4. Super Admin Flows (Role: SUPER_ADMIN)
### 4.1. Businesses Page (`/app/super-admin/businesses`)
- **Tujuan**: Mengelola bisnis (Suspend/Activate).

### 4.2. Upgrade Requests (`/app/super-admin/upgrade-requests`)
- **Tujuan**: Menerima/Menolak request upgrade dari Business. Menghasilkan ActionLog.

## 5. Public Pages
### 5.1. Public Business & Order Form (`/b/[businessSlug]`)
- **Tujuan**: Pelanggan (end-user) memesan layanan langsung.
- **Action**: Membuat `PublicSubmission`.

### 5.2. Public Invoice (`/invoice/[invoiceCode]`)
- **Tujuan**: Pelanggan melihat tagihan. Read-only.
