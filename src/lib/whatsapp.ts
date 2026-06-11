export function normalizeWhatsappNumber(input: string) {
  const cleaned = input.replace(/[^\d]/g, "");

  if (!cleaned) {
    return "";
  }

  if (cleaned.startsWith("62")) {
    return cleaned;
  }

  if (cleaned.startsWith("0")) {
    return `62${cleaned.slice(1)}`;
  }

  return cleaned;
}

export function isValidWhatsappNumber(input: string) {
  const normalized = normalizeWhatsappNumber(input);
  return normalized.length >= 10;
}

export function buildWhatsAppUrl(phoneNumber: string, message: string) {
  const normalized = normalizeWhatsappNumber(phoneNumber);
  const encodedMessage = encodeURIComponent(message);

  return `https://wa.me/${normalized}?text=${encodedMessage}`;
}

export function buildWhatsAppMessage(message: string) {
  return encodeURIComponent(message);
}

export function buildWhatsAppShareUrl(message: string) {
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/?text=${encodedMessage}`;
}
