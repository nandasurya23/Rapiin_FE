# Backend Entity Mapping (Database Schema)

Pemetaan entitas database dari TypeScript interface pada frontend. Kami merekomendasikan penggunaan PostgreSQL / Relational Database.

## 1. Table `users` (AuthUser)
- `id` (UUID, PK)
- `email` (String, Unique)
- `password` (String, Hashed)
- `name` (String)
- `role` (Enum: `OWNER`, `SUPER_ADMIN`)
- `business_id` (UUID, Nullable, FK to `businesses`)
- `is_active`, `trial_used`, `onboarding_completed` (Boolean)

## 2. Table `businesses` (Business)
- `id` (UUID, PK)
- `slug` (String, Unique, Indexed)
- `name`, `owner_name`, `whatsapp_number` (String)
- `mode` (Enum: BOOKING, PRODUCT, CUSTOM)
- `operational_model` (Enum)
- `description`, `address`, `logo_url` (String)
- `services` (JSONB - untuk catalog item)
- `resources` (JSONB atau Relation ke tabel `business_resources`)

## 3. Table `customers` (Customer)
- `id` (UUID, PK)
- `business_id` (UUID, FK to `businesses`)
- `whatsapp_number` (String, Indexed)
- `name`, `status` (Enum)

## 4. Table `orders` (Order)
- `id` (UUID, PK)
- `business_id` (UUID, FK to `businesses`)
- `customer_id` (UUID, FK to `customers`)
- `status` (Enum: INQUIRY, CONFIRMED, DEAL, dll)
- `payment_status` (Enum: UNPAID, DP_PAID, PAID)
- `total_amount`, `dp_amount` (Decimal/Integer)

## 5. Table `invoices` (Invoice)
- `id` (UUID, PK)
- `order_id` (UUID, FK to `orders`)
- `invoice_code` (String, Unique, Indexed)
- `integrity_seal` (String)

## 6. Tabel Relasi Lainnya
- `subscriptions` (FK ke `businesses`)
- `upgrade_requests` (FK ke `businesses`)
- `super_admin_logs`
- `public_submissions` (FK ke `businesses`)
