# Backend Module Breakdown

Backend dipisahkan berdasarkan _Domain-Driven Design_ (DDD) ke dalam beberapa modul utama.

## 1. Auth Module
Menangani otentikasi.
- **Service**: UserService, AuthService, TokenService
- **Route Handler**: `app/api/auth/[...nextauth]/route.ts` atau custom API routes.
- **Deps**: Crypto / Bcrypt, JWT / NextAuth.

## 2. Business Module
Pusat dari aplikasi. Setiap fitur berkorelasi dengan `Business`.
- **Service**: BusinessService, BusinessResourceService.
- **Route Handler**: `app/api/business/...`
- **Focus**: Setting Business, Services catalog, Operational Hours.

## 3. Order Module
Menangani transaksi pesanan.
- **Service**: OrderService.
- **Route Handler**: `app/api/orders/...`
- **Focus**: State Machine Order (INQUIRY -> CONFIRMED -> DEAL -> DONE).

## 4. Customer Module
Menangani manajemen pelanggan dan CRM sederhana.
- **Service**: CustomerService.
- **Route Handler**: `app/api/customers/...`
- **Focus**: Manajemen data pelanggan independen dari Order, History pelanggan.

## 5. Invoice Module
Manajemen pembayaran dan cetak tagihan.
- **Service**: InvoiceService, IntegrityHashService.
- **Route Handler**: `app/api/invoices/...`

## 6. Subscription & Admin Module
Mengurus langganan dan diakses oleh `SUPER_ADMIN`.
- **Service**: SubscriptionService, AdminService.
- **Route Handler**: `app/api/admin/...`

## 7. Public API Module
Modul ini *stateless* dan tidak memiliki autentikasi.
- **Service**: PublicBusinessQueryService, PublicOrderSubmissionService.
- **Route Handler**: `app/api/public/...`
