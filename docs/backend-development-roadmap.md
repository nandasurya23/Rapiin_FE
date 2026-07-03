# Backend Development Roadmap

Dokumen ini adalah rencana langkah-langkah implementasi (Roadmap) dalam mengembangkan sistem backend untuk Rapiin, dengan pendekatan iteratif.

## Fase 0: Local Environment & Docker (Pra-Development)
- Konfigurasi **Docker & Colima** untuk menjalankan *server* secara *containerized* dengan hemat RAM di perangkat Mac.
- Pembuatan file konfigurasi awal: `Dockerfile` & `.dockerignore` (khusus Next.js stand-alone).
- Menyiapkan dan menguji koneksi publik sementara menggunakan **Cloudflare Tunnel (`cloudflared`)** agar proyek bisa segera diakses internet saat di-run lokal.

## Fase 1: Setup & Foundation (Minggu 1)
- Pembuatan *project* di **Supabase** (mendapatkan API keys dan URL Database PostgreSQL).
- Integrasi backend langsung di repositori Next.js (*Monorepo*).
- Setup dan inisialisasi **Prisma ORM** (`prisma init`) terhubung ke database Supabase.
- Membuat rancangan skema database awal (`schema.prisma`) dan menjalankan Migrations.
- Setup utility untuk Next.js Route Handlers (Error handling, Logging sederhana).
- Implementasi fungsionalitas Authentication (Login & Register) menggunakan NextAuth.js atau custom JWT.

## Fase 2: Business & Core Entities (Minggu 2)
- Pembuatan fungsi *Helper/Wrapper* untuk Response **Pagination**, **Search**, dan **Filtering** standar (mencakup pembentukan query objek `where` pada Prisma).
- CRUD Endpoint untuk Business Profile & Settings.
- Implementasi flow Onboarding (Update `onboarding_completed`).
- CRUD Endpoint dasar untuk entitas Customer (beserta paginasi dan filternya).
- Endpoint Public: `/api/public/b/:slug` untuk halaman pemesanan dari sisi pelanggan.

## Fase 3: Order Management & Invoicing (Minggu 3)
- Pembuatan endpoint Submit Order dari sisi pelanggan publik (Public Submissions).
- CRUD Order dari sisi Owner (Create order manual, ganti status Order).
- Integrasi perubahan status Order terhadap status Customer (sinkronisasi logika `DEAL`, `DONE`).
- Fitur Invoice (pembuatan bukti tagihan) beserta logic `integritySeal` untuk akses invoice publik.

## Fase 4: Super Admin & Security Refinement (Minggu 4)
- Pengembangan RBAC (Role-Based Access Control).
- Endpoint untuk Super Admin (Melihat daftar bisnis, Suspend/Activate, Dashboard metrics admin).
- Fitur Upgrade Request Subscription (Approve/Reject dari Admin).
- Penetration test ringan (memastikan data bisnis A tidak bisa diakses akun bisnis B).
- Penerapan Rate-limiting & CORS.

## Fase 5: Deployment & Integration (Minggu 5)
- Penyiapan environment staging/production.
- Integrasi Frontend: Pembuatan implementasi kelas service baru (contoh: `ApiCustomerService`, `ApiOrderService`) yang mengimplementasikan *interface* DAL yang sama dengan versi lokal (`LocalCustomerService` dkk).
- Mengganti instance *service* di dalam *custom hooks* (misal: `useCustomers`) dari lokal menuju API tanpa perlu mengubah kode komponen UI.
- Testing end-to-end (E2E) dan Bug Fixing.
