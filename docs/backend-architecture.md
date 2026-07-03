# Backend Architecture

Berdasarkan struktur state frontend `Rapiin`, kami merancang arsitektur REST API dengan pola Layered Architecture (Controller -> Service -> Repository).

## 1. High-Level Architecture
- **API Server**: Terintegrasi langsung di dalam framework frontend menggunakan **Next.js API Routes** (folder `app/api/...`) atau Server Actions. Pendekatan *monorepo* (satu codebase) ini menyederhanakan proses integrasi dan *deployment*.
- **Database**: **Supabase PostgreSQL** (karena data memiliki relasi kuat seperti `Business` -> `Order` -> `Invoice`, dan Supabase menyediakan *managed database* yang tangguh).
- **ORM**: Menggunakan **Prisma ORM** untuk interaksi dengan database Supabase yang *type-safe* dan selaras dengan TypeScript di frontend.
- **Authentication**: JWT (JSON Web Token) dengan payload role (`OWNER` vs `SUPER_ADMIN`), dapat menggunakan NextAuth.js (Auth.js) atau custom JWT di API Routes.

### 1.1 Small Server / Low-Resource Optimization Strategy
Karena target awal adalah **server berspesifikasi kecil/terbatas**, sistem tidak boleh rakus CPU maupun RAM (memori). Aturan ketat berikut harus diterapkan:
1. **Lean Response (Hindari Over-Fetching)**: API HANYA boleh mengembalikan kolom/field yang dibutuhkan oleh *frontend*. Jangan pernah menggunakan `SELECT *` yang menyedot RAM saat Node.js melakukan serialisasi objek JSON berukuran masif.
2. **Minimal In-Memory Caching**: Dilarang meletakkan data list raksasa (seperti riwayat order bertahun-tahun) di dalam *local cache/RAM* Node.js. *Cache* hanya digunakan secara konservatif (misal untuk data statis profil bisnis/publik yang sangat sering diakses tapi jarang berubah).
3. **Database Connection Pooling**: Karena server berukuran kecil memiliki batasan koneksi DB, Prisma harus dikonfigurasi untuk terhubung ke Supabase melalui jalur **Connection Pooling** (menggunakan PgBouncer bawaan Supabase / port 6543) agar aplikasi tidak tumbang karena *connection timeout*.
4. **Offloading Beban Server**: Mengunggah gambar, memproses/meresize gambar dilarang dilakukan di dalam memori Node.js. Beban ini dialihkan ke **Supabase Storage**. Eksekusi filter dan paginasi dialihkan ke **PostgreSQL**. Node.js hanya bertugas sebagai 'jembatan' ringan yang meneruskan request/response.

## 2. Layer Breakdown
1. **Route Handler Layer**: File `route.ts` di Next.js API Routes yang menangani HTTP request/response dan validasi input.
2. **Service/Business Logic Layer**: Tempat aturan bisnis dijalankan (misal: "Order selesai maka status Customer berubah menjadi DEAL"). Terletak di `src/server/services/`.
3. **Repository/Data Access Layer**: Interaksi ke database difasilitasi sepenuhnya oleh **Prisma Client** (misal: `prisma.order.findMany()`). Dapat dikelompokkan dalam direktori `src/server/repositories/` atau dipanggil langsung di service.

## 3. Struktur Folder Backend
Karena menggunakan pendekatan Next.js Monorepo, kode backend dan frontend berada dalam satu repositori. Berikut adalah detail struktur folder untuk sisi backend:

```text
/ (Project Root)
├── prisma/                 # Konfigurasi Prisma
│   ├── schema.prisma       # Skema database dan model
│   └── migrations/         # File migrasi database
├── src/
│   ├── app/
│   │   └── api/            # Next.js API Routes (Route Handler Layer)
│   │       ├── auth/
│   │       │   └── [...nextauth]/route.ts
│   │       ├── orders/
│   │       │   └── route.ts
│   │       ├── customers/
│   │       │   └── route.ts
│   │       └── ...
│   ├── server/             # Core Backend Logic
│   │   ├── services/       # Service Layer (Business Logic)
│   │   │   ├── order.service.ts
│   │   │   ├── customer.service.ts
│   │   │   └── ...
│   │   ├── lib/            # Utility untuk backend
│   │   │   └── prisma.ts   # Instansiasi Prisma Client singleton
│   │   ├── schemas/        # Zod validation schemas untuk API
│   │   └── middlewares/    # Custom middlewares/helpers untuk Route Handlers
```

## 4. Security & Validation
- **Auth Guard**: Middleware untuk memeriksa keberadaan JWT.
- **Role Guard**: Middleware untuk mencegah `OWNER` mengakses resource `SUPER_ADMIN`.
- **Business Logic Security**: `OWNER` hanya bisa membaca/menulis data milik `businessId` miliknya sendiri. Semua endpoint `/api/business-data/...` harus mem-filter berdasarkan `user.businessId`.

## 5. Module Breakdown
- `AuthModule`: Login, Register.
- `BusinessModule`: Onboarding, Profil Bisnis, Settings, Data Layanan.
- `OrderModule`: CRUD Order, State Machine perpindahan status Order.
- `CustomerModule`: CRUD Customer, Sinkronisasi status berdasar Order.
- `InvoiceModule`: Pembuatan Invoice, validasi Invoice publik.
- `SuperAdminModule`: Manajemen paket berlangganan, upgrade, blokir bisnis.
- `PublicModule`: Endpoint publik (tanpa JWT) untuk menampilkan Business dan submit PublicOrder.

## 6. Storage
- **File Storage**: Penyimpanan gambar (seperti logo bisnis) diunggah dan disimpan ke **Supabase Storage** (layanan S3-compatible yang terintegrasi dengan ekosistem Supabase). Ini mempermudah CDN dan tidak membebani server Next.js.
- **Database Storage**: File fisik gambar TIDAK disimpan ke dalam database. Database (Prisma) hanya menyimpan data berupa tipe `String` yang berisi *public URL* gambar dari Supabase Storage (contoh: `https://[PROJECT_ID].supabase.co/storage/v1/object/public/logos/logo-bisnis.png`). Hal ini sangat krusial untuk menjaga database tetap ringan, cepat, dan mencegah *bloat*.

## 7. Development & Temporary Deployment Server
Sesuai dengan target *small server / resource constraint*, tahapan *testing* dan *deployment* sementara dilakukan menggunakan pendekatan *Containerization* yang ringan:
- **Docker + Colima**: Aplikasi Next.js akan dibungkus (*containerized*) menggunakan `Dockerfile`. Karena lingkungan pengembang menggunakan Mac, eksekusi *daemon* Docker dijalankan menggunakan **Colima** (pengganti Docker Desktop yang jauh lebih ringan dan hemat RAM).
- **Cloudflare Tunnel (Cloudflared)**: Untuk mengekspos *server* lokal (Docker) ke publik sebagai *server* sementara (sebelum rilis produksi yang sebenarnya), kita menggunakan **Cloudflare Tunnel**.
  - Mengamankan koneksi tanpa perlu *port-forwarding* IP publik langsung.
  - Memungkinkan Rapiin dites secara *live* melalui *handphone* atau internet oleh pihak ketiga secara instan dan sangat aman.
