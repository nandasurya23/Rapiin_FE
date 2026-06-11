import type { Business, BusinessMode, OperationalModel } from "@/types/business";

export type PublicCatalogItem = {
  id: string;
  name: string;
  description: string;
  priceLabel?: string;
};

export type PublicOrderField = {
  name: string;
  label: string;
  placeholder: string;
  type?: "text" | "tel" | "date" | "time" | "number";
  required?: boolean;
};

const catalogByMode: Record<BusinessMode, PublicCatalogItem[]> = {
  BOOKING_SERVICE: [
    { id: "svc_1", name: "Booking Studio 2 Jam", description: "Cocok untuk latihan band atau rekaman singkat.", priceLabel: "Rp 240.000" },
    { id: "svc_2", name: "Booking Studio 4 Jam", description: "Untuk sesi yang lebih lama dan fleksibel.", priceLabel: "Rp 420.000" },
    { id: "svc_3", name: "Paket Malam", description: "Jam sibuk dengan prioritas room.", priceLabel: "Rp 550.000" },
  ],
  PRODUCT_ORDER: [
    { id: "prd_1", name: "Paket Hemat", description: "Pilihan paling sering dipesan.", priceLabel: "Rp 75.000" },
    { id: "prd_2", name: "Paket Lengkap", description: "Isi lebih banyak, cocok buat keluarga.", priceLabel: "Rp 125.000" },
    { id: "prd_3", name: "Paket Premium", description: "Pilihan spesial untuk kebutuhan khusus.", priceLabel: "Rp 180.000" },
  ],
  CUSTOM_REQUEST: [
    { id: "cus_1", name: "Paket Custom Ringan", description: "Untuk permintaan kecil dengan waktu cepat.", priceLabel: "Mulai Rp 150.000" },
    { id: "cus_2", name: "Paket Custom Lengkap", description: "Untuk proyek yang butuh detail lebih lengkap.", priceLabel: "Mulai Rp 300.000" },
    { id: "cus_3", name: "Konsultasi Awal", description: "Cocok kalau masih butuh arahan dulu.", priceLabel: "Gratis / by chat" },
  ],
};

const appointmentFields: PublicOrderField[] = [
    { name: "name", label: "Nama", placeholder: "Nama kamu", required: true },
    { name: "whatsappNumber", label: "Nomor WhatsApp", placeholder: "08123456789", type: "tel", required: true },
    { name: "service", label: "Layanan", placeholder: "Pilih layanan", required: true },
    { name: "scheduledDate", label: "Tanggal", placeholder: "Pilih tanggal", type: "date", required: true },
    { name: "scheduledTime", label: "Jam", placeholder: "Pilih jam", type: "time", required: true },
    { name: "bookingDurationMinutes", label: "Durasi (menit)", placeholder: "60", type: "number", required: true },
    { name: "notes", label: "Catatan", placeholder: "Contoh: bawa gitar sendiri" },
  ];

const orderRequestFieldsByMode: Record<Exclude<BusinessMode, "BOOKING_SERVICE">, PublicOrderField[]> = {
  PRODUCT_ORDER: [
    { name: "name", label: "Nama", placeholder: "Nama kamu", required: true },
    { name: "whatsappNumber", label: "Nomor WhatsApp", placeholder: "08123456789", type: "tel", required: true },
    { name: "product", label: "Produk", placeholder: "Pilih produk", required: true },
    { name: "quantity", label: "Jumlah", placeholder: "1", type: "number", required: true },
    { name: "deliveryMethod", label: "Ambil / antar", placeholder: "Ambil di tempat atau antar" },
    { name: "notes", label: "Catatan", placeholder: "Contoh: tanpa pedas" },
  ],
  CUSTOM_REQUEST: [
    { name: "name", label: "Nama", placeholder: "Nama kamu", required: true },
    { name: "whatsappNumber", label: "Nomor WhatsApp", placeholder: "08123456789", type: "tel", required: true },
    { name: "requestDetail", label: "Detail request", placeholder: "Ceritakan kebutuhanmu", required: true },
    { name: "deadline", label: "Deadline", placeholder: "Kapan dibutuhkan?", type: "date" },
    { name: "budget", label: "Budget perkiraan", placeholder: "Contoh: 300000", type: "number" },
    { name: "notes", label: "Catatan", placeholder: "Catatan tambahan" },
  ],
};

function getModeFromBusinessOrMode(input: Business | BusinessMode) {
  return typeof input === "string" ? input : input.mode;
}

function getOperationalModel(input: Business | BusinessMode) {
  if (typeof input === "string") {
    return input === "BOOKING_SERVICE" ? ("APPOINTMENT" as OperationalModel) : ("ORDER_REQUEST" as OperationalModel);
  }

  return input.operationalModel;
}

export function getPublicCatalog(input: Business | BusinessMode) {
  return catalogByMode[getModeFromBusinessOrMode(input)];
}

export function getPublicOrderFields(input: Business | BusinessMode) {
  const mode = getModeFromBusinessOrMode(input);
  const operationalModel = getOperationalModel(input);

  if (mode === "BOOKING_SERVICE") {
    return appointmentFields;
  }

  if (operationalModel === "ORDER_REQUEST") {
    return orderRequestFieldsByMode[mode as Exclude<BusinessMode, "BOOKING_SERVICE">];
  }

  return orderRequestFieldsByMode[mode as Exclude<BusinessMode, "BOOKING_SERVICE">];
}

export const getPublicFormFields = getPublicOrderFields;

export function getPublicFormTitle(input: Business | BusinessMode) {
  const mode = getModeFromBusinessOrMode(input);
  if (mode === "BOOKING_SERVICE") return "Form Booking";
  if (mode === "PRODUCT_ORDER") return "Form Order";
  return "Form Request";
}

export function getPublicFormSubmitLabel(input: Business | BusinessMode) {
  const mode = getModeFromBusinessOrMode(input);
  if (mode === "BOOKING_SERVICE") return "Kirim Booking";
  if (mode === "PRODUCT_ORDER") return "Kirim Order";
  return "Kirim Request";
}

export function getPublicPageTitle(input: Business | BusinessMode) {
  const mode = getModeFromBusinessOrMode(input);
  if (mode === "BOOKING_SERVICE") return "Booking sekarang";
  if (mode === "PRODUCT_ORDER") return "Pesan sekarang";
  return "Ajukan request";
}

export function getPublicPageSubtitle(input: Business | BusinessMode) {
  const mode = getModeFromBusinessOrMode(input);
  const operationalModel = getOperationalModel(input);
  if (mode === "BOOKING_SERVICE" && operationalModel === "RESOURCE_BOOKING") {
    return "Pilih layanan, tanggal, dan durasi. Admin akan menyesuaikan unit/slot yang masih tersedia.";
  }
  if (mode === "BOOKING_SERVICE") return "Pilih layanan, durasi, dan jadwal. Slot diprioritaskan untuk booking yang sudah DP.";
  if (mode === "PRODUCT_ORDER") return "Pilih produk, isi jumlah, lalu kirim pesananmu.";
  return "Ceritakan kebutuhanmu, lalu admin akan bantu lanjutkan.";
}

export function isBusinessSlugMatch(business: Business, slug: string) {
  return business.slug === slug;
}
