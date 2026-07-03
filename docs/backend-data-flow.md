# Backend Data Flow

Dokumen ini mendeskripsikan jalur hidup data dari request HTTP hingga tersimpan ke database.

## 1. Flow Otentikasi
`Client -> Next.js API Route (/api/auth) -> Auth Service -> Prisma Client -> PostgreSQL`

## 2. Order Creation Flow (dari Dashboard Owner)
1. **Request**: `POST /api/orders`
2. **Validation**: Route Handler memvalidasi struktur data menggunakan Zod.
3. **Auth Check**: Memastikan sesi JWT/NextAuth valid dan role `OWNER`.
4. **Service**:
   - `OrderService.create()` mencari pelanggan via `prisma.customer.findFirst()`.
   - Menghitung durasi / total bayar.
   - Insert baris ke database menggunakan `prisma.order.create()`.
5. **Response**: `NextResponse.json()` (201 Created).

## 3. Public Order Flow (dari Halaman Publik)
1. **Request**: `POST /api/public/b/:slug/submit`
2. **Rate Limit**: Edge Middleware atau fungsi di dalam Route Handler mengecek batas limit IP.
3. **Route Handler**: Validasi form request.
4. **Service**:
   - Cek `business.slug` via Prisma.
   - Simpan form di tabel menggunakan `prisma.publicSubmission.create()`.
   - Trigger event untuk membuat Draft Order (jika di-setting otomatis oleh `Business`).
5. **Response**: Berhasil (200 OK) atau Gagal (400 Bad Request).
