# Backend Security

Dokumen ini menjelaskan strategi keamanan backend untuk Rapiin.

## 1. Authentication & Authorization
- **JWT (JSON Web Tokens)**: Digunakan untuk session management (menggantikan session state lokal pada frontend saat ini). Payload harus berisi `userId`, `role`, dan `businessId`.
- **Role-Based Access Control (RBAC)**: Middleware harus memeriksa token. Endpoint `/api/admin/*` memblokir akses jika role != `SUPER_ADMIN`.
- **Data Isolation (Multi-Tenancy)**: Setiap request dari `OWNER` harus diinjeksi `businessId` dari token JWT ke dalam klausa `WHERE` pada query database.
  - *Benar*: `SELECT * FROM orders WHERE id = ? AND business_id = ?`
  - *Salah*: `SELECT * FROM orders WHERE id = ?`

## 2. Global & Public API Protection
Seluruh endpoint API, terutama halaman publik (profil bisnis, form pemesanan) dan otentikasi (login, register), sangat rentan terhadap serangan *spam* atau *brute-force*. Kita menerapkan **Strict Native Rate Limiting** tanpa bergantung pada layanan pihak ketiga:

- **Native In-Memory Rate Limiting (IP Based)**
  - Menggunakan *in-memory cache* (seperti modul `lru-cache` atau implementasi `Map` pada Singleton Pattern di server Next.js) sebagai penyimpan data limit. **Tidak memerlukan** Redis, Upstash, Cloudflare Turnstile, atau Google reCAPTCHA.
- **Aturan Rate Limit di Setiap Halaman/Endpoint**:
  - **Public Form Submission** (`/api/public/b/:slug/submit`): Sangat ketat! Maksimal **3 request / menit** per IP. Melanggar batas akan mengakibatkan *cooldown/ban* permanen pada IP tersebut selama **15 menit**.
  - **Auth Routes** (`/api/auth/login`, `/api/auth/register`): Maksimal **5 request / 5 menit** per IP untuk mencegah *brute-force*.
  - **General API Routes** (`/api/orders`, `/api/customers`, dll): Maksimal **60 request / menit** per IP (user yang sudah login).
- **Client/Device Token (Native Bot Protection)**
  - Men-generate UUID rahasia di dalam *HTTP-Only Cookie* saat user membuka aplikasi pertama kali untuk memastikan request dilakukan dari *browser state* yang valid, bukan dari *bot script*.
- **CORS Configuration**: Restriksi Header Origin agar API publik *hanya* dapat diakses dari domain web utama Rapiin.
## 3. Data Protection & Privacy
- **Password Hashing**: Menggunakan Bcrypt dengan *salt rounds* minimal 10.
- **Invoice Integrity Seal**: String *seal* pada invoice digunakan untuk memastikan public URL invoice valid dan tidak mudah ditebak. Hash menggunakan SHA-256 (contoh: `hash(invoiceId + secret + amount)`).
- **Sensitive Data**: Nomor WA dan nama pelanggan harus ditangani sesuai regulasi privasi (simpan aman, jangan log ke console server).

## 4. Input Validation & Form Integrity
Karena form pendaftaran, profil bisnis, dan order publik sangat rentan terhadap manipulasi tipe data atau XSS (*Cross-Site Scripting*), backend menerapkan **Strict Input Validation**:
- **Zod Schema Validation**: Semua *request body*, parameter URL, dan *query string* wajib divalidasi menggunakan skema Zod sebelum memproses *business logic*. Tipe data, batasan minimum/maksimum panjang karakter (contoh: nomor WA harus 10-15 digit), dan format email diverifikasi secara mutlak.
- **Payload Stripping (Strip Unknown)**: Backend (Zod) dikonfigurasi untuk membuang (*strip*) parameter tambahan apa pun yang tidak ada di dalam skema yang diharapkan. Ini mencegah serangan *mass assignment* (contoh: user publik tidak bisa menyisipkan `role: "SUPER_ADMIN"` pada saat submit profil).
- **Sanitization**: Meskipun Zod memastikan tipe data *string* benar, data teks bebas (seperti `notes` atau deskripsi bisnis) harus disanitasi dari elemen HTML/scripting berbahaya ketika dikembalikan atau disimpan, memastikan tidak adanya celah eksekusi *script* saat *render* ulang di frontend.

## 5. Database-Level Security & Anti-Hacking Measures (Krusial)
Untuk menjamin bahwa data Owner 100% aman dan tidak ada celah bagi peretas untuk mengotak-atik atau mencuri *database*, perlindungan di level terdasar (Database) diperketat:
1. **Anti-SQL Injection**: Penggunaan **Prisma ORM** memastikan semua kueri ke database menggunakan *Parameterized Queries*. Hal ini secara fundamental memblokir segala jenis serangan *SQL Injection*. Pengembang **DILARANG KERAS** menggunakan raw query yang tidak aman seperti `prisma.$queryRawUnsafe()`.
2. **Supabase RLS (Row Level Security)**: Meskipun akses DB melalui Next.js (Server-Side), kita wajib **mengaktifkan RLS** di dashboard Supabase dan secara *default* **menolak semua akses (Deny All)** untuk `anon` key. Ini memastikan jika seandainya *Public API Key* Supabase bocor, peretas tetap tidak bisa menarik data dari tabel manapun secara langsung.
3. **Environment Isolation**: Kunci utama pengakses database (`DATABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `JWT_SECRET`) hanya boleh tersimpan di *Environment Variables* di server *deployment* (seperti Vercel). Variabel ini tidak boleh disematkan (*hardcoded*) di kode atau terekspos ke *client-side* (jangan pernah gunakan prefix `NEXT_PUBLIC_` untuk *secret key*).
4. **Data Isolation (Tenant Leaks Prevention)**: Pencegahan *Tenant Leak* (Data Owner A tidak boleh bocor ke Owner B). Pada setiap lapisan API untuk peran `OWNER`, kueri Prisma HANYA akan tereksekusi jika klausa `WHERE businessId = [ID_DARI_TOKEN_JWT]` terpenuhi. Jika ID tidak cocok, kueri akan gagal secara diam-diam (*silent fail*) atau mengembalikan 404, memblokir celah enumerasi ID/IDOR (Insecure Direct Object Reference).
