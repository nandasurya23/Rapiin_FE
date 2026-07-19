import type { Business, BusinessMode, OperationalModel, PublicCatalogItem } from "@/types/business";

export type PublicOrderField = {
  name: string;
  label: string;
  placeholder: string;
  type?: "text" | "tel" | "date" | "time" | "number";
  required?: boolean;
};

const appointmentFields: PublicOrderField[] = [
  { name: "name", label: "Nama", placeholder: "Nama kamu", required: true },
  { name: "whatsappNumber", label: "Nomor WhatsApp", placeholder: "08123456789", type: "tel", required: true },
  { name: "service", label: "Layanan", placeholder: "Pilih layanan" },
  { name: "scheduledDate", label: "Tanggal", placeholder: "Pilih tanggal", type: "date", required: true },
  { name: "scheduledTime", label: "Jam", placeholder: "Pilih jam", type: "time", required: true },
  { name: "bookingDurationMinutes", label: "Durasi (menit)", placeholder: "60", type: "number", required: true },
  { name: "notes", label: "Catatan", placeholder: "Contoh: bawa gitar sendiri" },
];

const orderRequestFieldsByMode: Record<Exclude<BusinessMode, "BOOKING_SERVICE">, PublicOrderField[]> = {
  PRODUCT_ORDER: [
    { name: "name", label: "Nama", placeholder: "Nama kamu", required: true },
    { name: "whatsappNumber", label: "Nomor WhatsApp", placeholder: "08123456789", type: "tel", required: true },
    { name: "product", label: "Produk", placeholder: "Pilih produk" },
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

export function isTimeRequired(input: Business | BusinessMode): boolean {
  if (typeof input === "string") return true;
  if (input.operationalModel === "ORDER_REQUEST") return false;
  const noTimeNiches = ["LAUNDRY", "KATERING"];
  if (noTimeNiches.includes(input.niche)) return false;
  return true;
}

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
  }
  return [];
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
    const timeRequired = isTimeRequired(input);
    return appointmentFields.map(f => {
      if (f.name === "scheduledTime" || f.name === "bookingDurationMinutes") {
        return { ...f, required: timeRequired };
      }
      return f;
    });
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
