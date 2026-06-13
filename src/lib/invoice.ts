import type { Invoice } from "@/types/invoice";

export const INVOICE_LEGAL_COPY =
  "Dokumen digital ini dibuat melalui Rapiin. Format tampilan, struktur verifikasi, dan identitas nota merupakan bagian tetap dari sistem Rapiin.";

export const INVOICE_AUTH_COPY =
  "Nota dinyatakan valid jika kode verifikasi dan segel integritas sesuai. Perubahan data inti setelah nota dibuat akan terdeteksi oleh sistem.";

function hashString(value: string) {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0).toString(16).toUpperCase().padStart(8, "0");
}

function baseInvoicePayload(invoice: Pick<Invoice, "businessId" | "orderId" | "invoiceCode" | "customerName" | "totalAmount" | "paymentStatus" | "createdAt">) {
  return [
    invoice.businessId,
    invoice.orderId,
    invoice.invoiceCode,
    invoice.customerName.trim(),
    String(invoice.totalAmount),
    invoice.paymentStatus,
    invoice.createdAt,
  ].join("|");
}

export function buildInvoiceVerificationCode(
  invoice: Pick<Invoice, "invoiceCode" | "createdAt" | "customerName" | "totalAmount">
) {
  const raw = `${invoice.invoiceCode}|${invoice.createdAt}|${invoice.customerName}|${invoice.totalAmount}`;
  const digest = hashString(raw);
  return `RPN-${digest.slice(0, 4)}-${digest.slice(4, 8)}`;
}

export function buildInvoiceIntegritySeal(
  invoice: Pick<Invoice, "businessId" | "orderId" | "invoiceCode" | "customerName" | "totalAmount" | "paymentStatus" | "createdAt"> & {
    verificationCode: string;
  }
) {
  const digest = hashString(`${baseInvoicePayload(invoice)}|${invoice.verificationCode}|RAPIIN`);
  return `SEAL-${digest.slice(0, 4)}-${digest.slice(4, 8)}`;
}

export function normalizeInvoiceVerification(invoice: Invoice): Invoice {
  const verificationCode = invoice.verificationCode || buildInvoiceVerificationCode(invoice);
  const integritySeal =
    invoice.integritySeal ||
    buildInvoiceIntegritySeal({
      ...invoice,
      verificationCode,
    });

  return {
    ...invoice,
    verificationCode,
    integritySeal,
  };
}

export function isInvoiceIntegrityValid(invoice: Invoice) {
  const verificationCode = buildInvoiceVerificationCode(invoice);
  const integritySeal = buildInvoiceIntegritySeal({
    ...invoice,
    verificationCode,
  });

  return invoice.verificationCode === verificationCode && invoice.integritySeal === integritySeal;
}
