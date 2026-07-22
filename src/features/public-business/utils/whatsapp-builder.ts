import { formatLongDate } from "@/lib/format";
import type { Business } from "@/types/business";

export type PublicFormState = Record<string, string>;

export function createPublicWhatsAppMessage(business: Business, form: PublicFormState): string {
  const lines = [
    `Halo ${business.name}, saya mau lanjut ${
      business.mode === "BOOKING_SERVICE"
        ? "booking"
        : business.mode === "PRODUCT_ORDER"
        ? "order"
        : "request"
    }.`,
  ];

  if (form.name) {
    lines.push(`Nama: ${form.name}`);
  }

  if (form.service) {
    lines.push(`Layanan: ${form.service}`);
  }

  if (form.product) {
    lines.push(`Produk: ${form.product}`);
  }

  if (form.quantity) {
    lines.push(`Jumlah: ${form.quantity}`);
  }

  if (form.scheduledDate) {
    lines.push(`Tanggal: ${formatLongDate(form.scheduledDate)}`);
  }

  if (form.scheduledTime) {
    lines.push(`Jam: ${form.scheduledTime}`);
  }

  if (form.resourceId && business.resources) {
    const resource = business.resources.find((r) => r.id === form.resourceId);
    if (resource) {
      lines.push(`${business.resourceLabel || "Unit"}: ${resource.name}`);
    }
  }

  if (form.bookingDurationMinutes) {
    lines.push(`Durasi: ${form.bookingDurationMinutes} menit`);
  }

  if (form.deliveryMethod) {
    lines.push(`Ambil / antar: ${form.deliveryMethod}`);
  }

  if (form.deadline) {
    lines.push(`Deadline: ${formatLongDate(form.deadline)}`);
  }

  if (form.budget) {
    lines.push(`Budget: ${form.budget}`);
  }

  if (form.requestDetail) {
    lines.push(`Detail request: ${form.requestDetail}`);
  }

  if (form.notes) {
    lines.push(`Catatan: ${form.notes}`);
  }

  if (business.paymentInstructions) {
    lines.push(`\nMetode Pembayaran / Transfer:\n${business.paymentInstructions}`);
  }

  return lines.join("\n");
}
