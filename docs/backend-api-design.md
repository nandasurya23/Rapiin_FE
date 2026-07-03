# Backend API Design

Berdasarkan struktur *Data Access Layer* (DAL) pada frontend (`CustomerService`, `OrderService`, `InvoiceService`, `BusinessService`, `AuthService`), berikut adalah struktur *endpoint* REST API utama yang harus diimplementasikan pada backend:

## 1. Authentication
- `POST /api/auth/login`
  - **Req**: `email`, `password`
  - **Res**: `token`, `user` data.
- `POST /api/auth/register`
  - **Req**: `email`, `password`, `name`, `phoneNumber`
  - **Res**: `token`, `user` data (termasuk `onboardingCompleted: false`).

## 2. Business (Role: OWNER)
- `GET /api/business`
  - Mendapatkan profil bisnis pengguna berdasarkan token login.
- `POST /api/business/onboarding`
  - Submit setup awal bisnis, mengubah `onboardingCompleted` ke `true`.
- `PUT /api/business/settings`
  - Update `description`, `niche`, `services`, `paymentInstructions`, dsb.

## 3. Orders (Role: OWNER)
- `GET /api/orders`
  - Fetch semua pesanan untuk `businessId` terkait. Mendukung query string `status`, `dateRange`.
- `POST /api/orders`
  - Buat pesanan baru.
- `PUT /api/orders/:id/status`
  - Update status pesanan (e.g. `INQUIRY` -> `CONFIRMED`).

## 4. Customers (Role: OWNER)
- `GET /api/customers`
  - Fetch daftar pelanggan.
- `PUT /api/customers/:id`
  - Update note / detail pelanggan manual.

## 5. Invoices (Role: OWNER)
- `GET /api/invoices`
  - List invoice.
- `POST /api/invoices`
  - Create invoice berdasarkan `orderId`.

## 6. Super Admin (Role: SUPER_ADMIN)
- `GET /api/admin/businesses`
  - List semua entitas bisnis di sistem.
- `GET /api/admin/upgrades`
  - List permintaan upgrade (Subscription).
- `POST /api/admin/upgrades/:id/approve`
  - Menyetujui request upgrade.

## 7. Public Endpoints (Unauthenticated)
- `GET /api/public/b/:slug`
  - Mengambil data profil dan layanan bisnis untuk halaman publik.
- `POST /api/public/b/:slug/submit`
  - Submit form order pelanggan dari publik (membuat `PublicSubmission` atau `Order` baru).
- `GET /api/public/invoice/:invoiceCode`
  - Mengambil detail invoice publik. Harus mengecek `integritySeal` secara internal.

## 8. Pagination & Filtering Standards
Untuk memastikan performa optimal pada tabel data yang panjang (Orders, Customers, Invoices, Admin Businesses), semua endpoint `GET` yang mereturn bentuk *list* (array) wajib mengimplementasikan **Pagination**:

- **Metadata Response**:
  Setiap *response* paginasi harus memiliki struktur standar seperti ini:
  ```json
  {
    "data": [...],
    "meta": {
      "total": 150,
      "page": 1,
      "limit": 20,
      "totalPages": 8
    }
  }
  ```
- **Query Parameters**:
  - `?page=1` (Default: 1)
  - `?limit=20` (Default: 20, Maximum: 100)
  - `?search=...` (Untuk mencari berdasarkan nama, kode, atau email)
  - `?sortBy=createdAt&sortOrder=desc`
- **Prisma Implementation (Pagination)**:
  - Menggunakan metode *Offset Pagination* (`skip` & `take`) untuk halaman tabel di Admin & Dashboard (seperti halaman Customers dan Invoices).
  - Gunakan `Promise.all([ prisma.model.count({ where: filters }), prisma.model.findMany({ where: filters, skip, take }) ])` agar proses query jumlah total data dan pengambilan data berjalan paralel (mempercepat eksekusi DB).

- **Prisma Implementation (Search & Filtering)**:
  - **Search**: Untuk pencarian teks bebas (seperti mencari nama pelanggan, kode invoice), gunakan klausa `OR` dipadukan dengan `contains` dan `mode: 'insensitive'` pada Prisma. Contoh:
    ```javascript
    const searchFilter = query.search ? {
      OR: [
        { name: { contains: query.search, mode: 'insensitive' } },
        { invoiceCode: { contains: query.search, mode: 'insensitive' } }
      ]
    } : {};
    ```
  - **Filtering**: Untuk *exact match* (seperti filter berdasarkan status order atau rentang tanggal), gunakan pencocokan langsung atau operator tanggal (`gte`, `lte`). Contoh:
    ```javascript
    const statusFilter = query.status ? { status: query.status } : {};
    const finalWhere = { ...searchFilter, ...statusFilter, businessId: user.businessId };
    ```
  - Data pemfilteran *harus* diproses seutuhnya di sisi backend/database, bukan dengan mengambil semua data lalu memfilternya di server Node.js.
