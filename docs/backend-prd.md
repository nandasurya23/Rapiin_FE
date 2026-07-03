# Backend Product Requirements Document (PRD)

## 1. Tujuan
Memfasilitasi fungsionalitas aplikasi frontend `Rapiin` dengan backend *production-ready* yang persis mencerminkan semua arsitektur state lokal saat ini. 

## 2. Scope
- Manajemen autentikasi berbasis role (`OWNER` dan `SUPER_ADMIN`).
- Onboarding flow (Business Profile setup).
- Manajemen operasional utama (Orders, Customers, Invoices).
- Sistem pengaturan dan berlangganan.
- Dashboard dan public endpoints.

### Out of Scope
- Fitur chat real-time (saat ini Message menggunakan template WA, bukan in-app chat).
- Integrasi Payment Gateway otomatis (sementara manual berdasarkan status DP).

## 3. Data Dictionary
Merujuk pada `src/types`, entitas inti:
- **AuthUser**: Info akun pengguna dan perannya.
- **Business**: Profil bisnis, model operasional, jam kerja, layanan (services).
- **Order**: Data pesanan, memegang status (INQUIRY, CONFIRMED, DEAL, dll).
- **Customer**: CRM untuk bisnis, terkait dengan semua pesanan pengguna dari WA number tertentu.
- **Invoice**: Bukti tagihan, terkait dengan suatu `Order`.

## 4. Role & Permissions
- `SUPER_ADMIN`: Hanya dapat login di panel admin, melihat global data `Businesses` dan menyetujui `UpgradeRequests`. Tidak dapat mengakses Dashboard Order suatu Business.
- `OWNER`: Login aplikasi reguler, hanya dapat melihat dan memodifikasi data yang berelasi dengan `businessId` miliknya.

## 5. Security & Performance Requirement
- **Security**: Endpoint API diproteksi dengan Auth Middleware. Rate Limiting diterapkan di endpoint Public Submission untuk mencegah spam form order publik.
- **Performance**: Endpoint `GET /api/public/b/:slug` harus cepat (< 200ms) karena menghadap langsung ke calon konsumen. Pertimbangkan Index pada kolom `slug` di tabel `Business`.
