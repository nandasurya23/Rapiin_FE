import type { Business, BusinessMode, OperationalModel, NicheTemplate, PublicCatalogItem } from "@/types/business";

export type PublicOrderField = {
  name: string;
  label: string;
  placeholder: string;
  type?: "text" | "tel" | "date" | "time" | "number";
  required?: boolean;
};

const catalogByNiche: Record<NicheTemplate, PublicCatalogItem[]> = {
  STUDIO_MUSIK: [
    { id: "sm_1", name: "Booking Studio Latihan (1 Jam)", description: "Latihan band standard dengan sound system berkualitas.", priceLabel: "Rp 80.000", durationMinutes: 60 },
    { id: "sm_2", name: "Booking Studio Rekaman (Shift 6 Jam)", description: "Sesi rekaman lagu lengkap dengan operator studio berpengalaman.", priceLabel: "Rp 500.000", durationMinutes: 360 },
    { id: "sm_3", name: "Sewa Alat Musik Tambahan", description: "Tambahan gitar/bass/keyboard custom pilihan selama sesi latihan.", priceLabel: "Rp 30.000", durationMinutes: 60 },
  ],
  BARBERSHOP: [
    { id: "bb_1", name: "Haircut + Wash", description: "Potong rambut premium, cuci rambut, pijat kepala rileks, dan styling Pomade.", priceLabel: "Rp 45.000", durationMinutes: 30 },
    { id: "bb_2", name: "Haircut + Shaving", description: "Potong rambut premium + cukur kumis & jenggot dengan handuk hangat.", priceLabel: "Rp 60.000", durationMinutes: 45 },
    { id: "bb_3", name: "Hair Spa & Massage", description: "Perawatan rambut ketombe/rontok + pijat pundak dan kepala.", priceLabel: "Rp 50.000", durationMinutes: 45 },
  ],
  TATTOO: [
    { id: "tt_1", name: "Tattoo Sesi Kecil (3x3 cm)", description: "Desain minimalis garis halus (fineline) atau tulisan sederhana.", priceLabel: "Mulai Rp 200.000", durationMinutes: 60 },
    { id: "tt_2", name: "Tattoo Sesi Sedang (Custom)", description: "Desain custom berwarna atau hitam-abu ukuran sedang.", priceLabel: "Mulai Rp 500.000", durationMinutes: 120 },
    { id: "tt_3", name: "Konsultasi Desain & Penempatan", description: "Ngobrol santai dengan artis tato untuk konsep dan estimasi harga.", priceLabel: "Gratis", durationMinutes: 30 },
  ],
  RENTAL: [
    { id: "rt_1", name: "Sewa Paket 1 (Per Jam)", description: "Paket sewa per jam untuk unit/barang (misal: Sewa PS, Studio, Lapangan).", priceLabel: "Rp 10.000", durationMinutes: 60 },
    { id: "rt_2", name: "Sewa Paket 2 (Setengah Hari)", description: "Paket sewa durasi menengah untuk unit/barang tertentu.", priceLabel: "Rp 50.000", durationMinutes: 720 },
    { id: "rt_3", name: "Sewa Paket 3 (Harian)", description: "Paket sewa harian (misal: Alat berat, kendaraan, peralatan kemah).", priceLabel: "Rp 100.000", durationMinutes: 1440 },
  ],
  TOUR: [
    { id: "tr_1", name: "Paket Open Trip Kepulauan (1 Hari)", description: "Trip keliling pulau termasuk perahu penyeberangan, makan siang, & dokumentasi.", priceLabel: "Rp 250.000", durationMinutes: 720 },
    { id: "tr_2", name: "Private Tour City Sightseeing", description: "Tour privat keliling tempat bersejarah menggunakan mobil ber-AC.", priceLabel: "Rp 600.000", durationMinutes: 480 },
    { id: "tr_3", name: "Tiket Wahana & Pemandu Wisata", description: "Tiket masuk wahana favorit lokal dengan penjelasan pemandu lokal.", priceLabel: "Rp 100.000", durationMinutes: 120 },
  ],
  LAUNDRY: [
    { id: "ld_1", name: "Cuci Setrika Express (1 Hari)", description: "Cuci bersih, wangi, rapi disetrika dalam waktu 24 jam.", priceLabel: "Rp 10.000 /kg", durationMinutes: 1440 },
    { id: "ld_2", name: "Cuci Setrika Reguler (3 Hari)", description: "Cuci reguler hemat untuk pakaian harian.", priceLabel: "Rp 7.000 /kg", durationMinutes: 4320 },
    { id: "ld_3", name: "Laundry Selimut & Bedcover", description: "Cuci khusus selimut tebal/bedcover dengan deterjen anti-bakteri.", priceLabel: "Rp 35.000 /pcs", durationMinutes: 1440 },
  ],
  MAKANAN: [
    { id: "fn_1", name: "Nasi Box Catering Acara", description: "Nasi kotak lengkap lauk utama, sayur, sambal, kerupuk, & buah.", priceLabel: "Mulai Rp 25.000", durationMinutes: 120 },
    { id: "fn_2", name: "Katering Harian Keluarga (3 Orang)", description: "Menu katering harian dikirim setiap siang (3 variasi lauk pauk).", priceLabel: "Rp 60.000", durationMinutes: 180 },
    { id: "fn_3", name: "Tumpeng Mini Premium", description: "Nasi tumpeng porsi personal untuk syukuran atau rapat.", priceLabel: "Rp 35.000", durationMinutes: 120 },
  ],
  HANDMADE: [
    { id: "hm_1", name: "Buket Bunga Segar Custom", description: "Rangkaian bunga segar untuk wisuda, ulang tahun, atau anniversary.", priceLabel: "Mulai Rp 120.000", durationMinutes: 120 },
    { id: "hm_2", name: "Kerajinan Rajut Tas / Dompet", description: "Tas rajutan tangan premium dengan pilihan warna benang custom.", priceLabel: "Rp 180.000", durationMinutes: 240 },
    { id: "hm_3", name: "Custom Souvenir Kayu Lukis", description: "Gantungan kunci atau plakat kayu dengan lukisan wajah/nama custom.", priceLabel: "Mulai Rp 50.000", durationMinutes: 180 },
  ],
  CUSTOM: [
    { id: "ct_1", name: "Paket Layanan Standard", description: "Layanan standard disesuaikan dengan kebutuhan Anda.", priceLabel: "Rp 100.000", durationMinutes: 60 },
    { id: "ct_2", name: "Paket Layanan Premium", description: "Layanan lengkap dengan prioritas utama dan konsultasi gratis.", priceLabel: "Rp 250.000", durationMinutes: 120 },
    { id: "ct_3", name: "Konsultasi & Estimasi", description: "Konsultasi awal untuk membahas kebutuhan dan penyesuaian tarif.", priceLabel: "Gratis", durationMinutes: 30 },
  ],
  LAINNYA: [
    { id: "ln_1", name: "Paket Layanan Standard", description: "Layanan standard disesuaikan dengan kebutuhan Anda.", priceLabel: "Rp 100.000", durationMinutes: 60 },
    { id: "ln_2", name: "Paket Layanan Premium", description: "Layanan lengkap dengan prioritas utama dan konsultasi gratis.", priceLabel: "Rp 250.000", durationMinutes: 120 },
    { id: "ln_3", name: "Konsultasi & Estimasi", description: "Konsultasi awal untuk membahas kebutuhan dan penyesuaian tarif.", priceLabel: "Gratis", durationMinutes: 30 },
  ],
};

const catalogByMode: Record<BusinessMode, PublicCatalogItem[]> = {
  BOOKING_SERVICE: catalogByNiche.STUDIO_MUSIK,
  PRODUCT_ORDER: catalogByNiche.MAKANAN,
  CUSTOM_REQUEST: catalogByNiche.CUSTOM,
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
  if (typeof input === "object") {
    if (input.services && input.services.length > 0) {
      return input.services;
    }
    if (input.niche && catalogByNiche[input.niche]) {
      return catalogByNiche[input.niche];
    }
  }
  return catalogByMode[getModeFromBusinessOrMode(input)];
}

export function inferCatalogDurationMinutes(item?: Pick<PublicCatalogItem, "name" | "durationMinutes"> | null) {
  if (!item) {
    return null;
  }

  if (typeof item.durationMinutes === "number" && item.durationMinutes > 0) {
    return item.durationMinutes;
  }

  const matchedHours = item.name.match(/(\d+)\s*jam/i);
  if (matchedHours) {
    return Number(matchedHours[1]) * 60;
  }

  return null;
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
