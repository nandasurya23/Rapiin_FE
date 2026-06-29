export function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function normalizePhoneNumber(value: string) {
  return value.replace(/[^\d]/g, "");
}

export function isValidPhoneNumber(value: string) {
  const normalized = normalizePhoneNumber(value);
  return normalized.length >= 9 && normalized.length <= 15;
}

export function isValidEmailOrPhone(value: string) {
  return isValidEmail(value) || isValidPhoneNumber(value);
}

export type ParsedChatData = {
  name: string;
  phone: string;
  address: string;
  orderTitle: string;
};

export function parseWhatsAppChatText(text: string): ParsedChatData {
  const result: ParsedChatData = {
    name: "",
    phone: "",
    address: "",
    orderTitle: "",
  };

  if (!text || !text.trim()) {
    return result;
  }

  const lines = text.split("\n").map((line) => line.trim());

  const nameRegex = /(?:nama|nama\s+lengkap|nama\s+pelanggan|customer|pemesan)\s*[:=-]\s*(.+)/i;
  const phoneRegex = /(?:no\s*hp|hp|wa|whatsapp|no\s*telp|telepon|kontak)\s*[:=-]\s*([+\d\s-]+)/i;
  const addressRegex = /(?:alamat|alamat\s+kirim|lokasi|tujuan|address)\s*[:=-]\s*(.+)/i;
  const orderRegex = /(?:pesanan|order|booking|jasa|kebutuhan|produk|item)\s*[:=-]\s*(.+)/i;

  let currentField: keyof ParsedChatData | null = null;

  for (const line of lines) {
    if (!line) continue;

    const nameMatch = line.match(nameRegex);
    if (nameMatch) {
      result.name = nameMatch[1].trim();
      currentField = null;
      continue;
    }

    const phoneMatch = line.match(phoneRegex);
    if (phoneMatch) {
      result.phone = phoneMatch[1].replace(/[^\d]/g, "");
      currentField = null;
      continue;
    }

    const addressMatch = line.match(addressRegex);
    if (addressMatch) {
      result.address = addressMatch[1].trim();
      currentField = "address";
      continue;
    }

    const orderMatch = line.match(orderRegex);
    if (orderMatch) {
      result.orderTitle = orderMatch[1].trim();
      currentField = "orderTitle";
      continue;
    }

    const rawPhonePattern = /(?:08|62|\+62)[\d\s-]{8,14}/;
    const phoneNoLabelMatch = line.match(rawPhonePattern);
    if (phoneNoLabelMatch && !result.phone) {
      result.phone = phoneNoLabelMatch[0].replace(/[^\d]/g, "");
      if (result.phone.startsWith("8")) {
        result.phone = "62" + result.phone;
      }
      currentField = null;
      continue;
    }

    if (currentField === "address") {
      result.address += "\n" + line;
    } else if (currentField === "orderTitle") {
      result.orderTitle += ", " + line;
    } else {
      if (!result.name && line.length < 50 && !line.includes(":") && !line.includes("=")) {
        result.name = line;
      }
    }
  }

  result.name = result.name.trim();
  result.phone = result.phone.trim();
  result.address = result.address.trim();
  result.orderTitle = result.orderTitle.trim();

  // If phone number starts with 0, convert to international
  if (result.phone.startsWith("0")) {
    result.phone = "62" + result.phone.slice(1);
  }

  return result;
}
