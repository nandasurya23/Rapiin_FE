import { toDateKey } from "@/lib/domain";
import { parseWhatsAppChatText } from "@/lib/validation";
import type { Customer } from "@/types/customer";
import type { Order, OrderStatus, PaymentStatus } from "@/types/order";
import type { BusinessMode } from "@/types/business";

export type AssistantActionType =
  | "CREATE_ORDER"
  | "UPDATE_ORDER_PAYMENT"
  | "UPDATE_ORDER_STATUS"
  | "CREATE_INVOICE"
  | "CREATE_CUSTOMER"
  | "SEARCH"
  | "UNKNOWN";

export type ParsedCommandResult = {
  type: AssistantActionType;
  confidence: "HIGH" | "MEDIUM" | "LOW";
  explanation: string;
  suggestedActionLabel: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
};

// Money parser supporting rb/ribu/jt/juta
function parseMoney(text: string): number | undefined {
  if (!text) return undefined;
  const cleaned = text.toLowerCase().trim();

  // match million e.g. 1.5jt or 1.5 juta
  const millionMatch = cleaned.match(/([\d.,]+)\s*(?:jt|juta)/);
  if (millionMatch) {
    const num = parseFloat(millionMatch[1].replace(/,/g, '.').replace(/[^\d.]/g, ''));
    return isNaN(num) ? undefined : num * 1000000;
  }

  // match thousand e.g. 150rb or 150 ribu
  const thousandMatch = cleaned.match(/([\d.,]+)\s*(?:rb|ribu)/);
  if (thousandMatch) {
    const num = parseFloat(thousandMatch[1].replace(/,/g, '.').replace(/[^\d.]/g, ''));
    return isNaN(num) ? undefined : num * 1000;
  }

  // standard numbers
  const digitsOnly = cleaned.replace(/[^\d]/g, "");
  if (!digitsOnly) return undefined;
  const parsed = parseInt(digitsOnly, 10);
  return isNaN(parsed) ? undefined : parsed;
}

// Relative date parser supporting hari ini, besok, lusa, senin, selasa, dst.
function parseRelativeDate(text: string): { dateStr: string; label: string } | undefined {
  const cleaned = text.toLowerCase().trim();
  const today = new Date();

  if (cleaned.includes("hari ini") || cleaned.includes("today")) {
    return { dateStr: toDateKey(today), label: "Hari ini" };
  }
  if (cleaned.includes("besok") || cleaned.includes("tomorrow")) {
    const besok = new Date();
    besok.setDate(today.getDate() + 1);
    return { dateStr: toDateKey(besok), label: "Besok" };
  }
  if (cleaned.includes("lusa")) {
    const lusa = new Date();
    lusa.setDate(today.getDate() + 2);
    return { dateStr: toDateKey(lusa), label: "Lusa" };
  }
  if (cleaned.includes("kemarin") || cleaned.includes("yesterday")) {
    const kemarin = new Date();
    kemarin.setDate(today.getDate() - 1);
    return { dateStr: toDateKey(kemarin), label: "Kemarin" };
  }

  // Day of week
  const daysOfWeek = ["minggu", "senin", "selasa", "rabu", "kamis", "jumat", "sabtu"];
  for (let i = 0; i < daysOfWeek.length; i++) {
    if (cleaned.includes(daysOfWeek[i])) {
      const targetDay = i;
      const currentDay = today.getDay();
      let diff = targetDay - currentDay;
      if (diff <= 0) diff += 7; // Next week's day

      const targetDate = new Date();
      targetDate.setDate(today.getDate() + diff);
      return { dateStr: toDateKey(targetDate), label: `Hari ${daysOfWeek[i]} depan` };
    }
  }

  // Specific dates like "30 juni", "15 juli"
  const months = [
    ["jan", "januari"], ["feb", "februari"], ["mar", "maret"], ["apr", "april"],
    ["mei", "mei"], ["jun", "juni"], ["jul", "juli"], ["ags", "agustus"],
    ["sep", "september"], ["okt", "oktober"], ["nov", "november"], ["des", "desember"]
  ];

  for (let i = 0; i < months.length; i++) {
    const monthNames = months[i];
    for (const name of monthNames) {
      const match = cleaned.match(new RegExp(`(\\d{1,2})\\s+${name}`));
      if (match) {
        const day = parseInt(match[1], 10);
        const targetDate = new Date();
        targetDate.setMonth(i);
        targetDate.setDate(day);
        
        if (targetDate.getTime() < today.getTime() - 24*60*60*1000) {
          targetDate.setFullYear(today.getFullYear() + 1);
        } else {
          targetDate.setFullYear(today.getFullYear());
        }
        return { dateStr: toDateKey(targetDate), label: `${day} ${monthNames[1].charAt(0).toUpperCase() + monthNames[1].slice(1)}` };
      }
    }
  }

  // DD-MM-YYYY or DD/MM/YYYY
  const standardDateMatch = cleaned.match(/(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})/);
  if (standardDateMatch) {
    const day = parseInt(standardDateMatch[1], 10);
    const month = parseInt(standardDateMatch[2], 10) - 1;
    let year = parseInt(standardDateMatch[3], 10);
    if (year < 100) year += 2000;

    const targetDate = new Date(year, month, day);
    if (!isNaN(targetDate.getTime())) {
      return { dateStr: toDateKey(targetDate), label: targetDate.toLocaleDateString("id-ID") };
    }
  }

  return undefined;
}

// Time parser matching 14:00, 14.00, jam 2 siang
function parseTime(text: string): string | undefined {
  const cleaned = text.toLowerCase().trim();

  // match HH:MM or HH.MM
  const timeMatch = cleaned.match(/(?:jam\s+)?(\d{1,2})[:.](\d{2})/);
  if (timeMatch) {
    const hours = timeMatch[1].padStart(2, "0");
    const minutes = timeMatch[2];
    return `${hours}:${minutes}`;
  }

  // match simple "jam X" e.g. "jam 10", "jam 2 siang", "jam 8 malam"
  const jamMatch = cleaned.match(/jam\s+(\d{1,2})(?:\s+(siang|sore|malam|pagi))?/);
  if (jamMatch) {
    let hours = parseInt(jamMatch[1], 10);
    const period = jamMatch[2];

    if (period === "siang" && hours < 12) {
      if (hours !== 12) hours += 12;
    } else if (period === "sore" && hours < 12) {
      hours += 12;
    } else if (period === "malam" && hours < 12) {
      hours += 12;
    } else if (period === "pagi" && hours === 12) {
      hours = 0;
    }

    return `${String(hours).padStart(2, "0")}:00`;
  }

  return undefined;
}

export function parseAssistantCommand(
  text: string,
  customers: Customer[],
  orders: Order[],
  defaultBusinessMode: BusinessMode
): ParsedCommandResult {
  const trimmed = text.trim();
  if (!trimmed) {
    return {
      type: "UNKNOWN",
      confidence: "LOW",
      explanation: "Ketik perintah untuk memulai (misal: 'booking studio andi besok jam 2 siang').",
      suggestedActionLabel: "Tulis Perintah",
      data: {},
    };
  }

  // 1. Detect WhatsApp Chat Copy Paste (multi-line structured text)
  if (trimmed.includes("\n") && (
    /nama/i.test(trimmed) ||
    /wa|hp|telepon/i.test(trimmed) ||
    /alamat/i.test(trimmed) ||
    /pesanan|order|booking/i.test(trimmed)
  )) {
    const parsedWA = parseWhatsAppChatText(trimmed);
    if (parsedWA.name || parsedWA.phone) {
      const existing = customers.find(
        (c) => c.name.toLowerCase() === parsedWA.name.toLowerCase() ||
               c.whatsappNumber.replace(/[^\d]/g, "") === parsedWA.phone.replace(/[^\d]/g, "")
      );

      return {
        type: "CREATE_ORDER",
        confidence: "HIGH",
        explanation: `Mendeteksi salinan format Chat WhatsApp. Menyiapkan draf order baru untuk customer "${parsedWA.name}".`,
        suggestedActionLabel: "Buat Order via Chat WA",
        data: {
          customerName: parsedWA.name || "Customer Baru",
          whatsappNumber: parsedWA.phone || "",
          title: parsedWA.orderTitle || "Order Baru",
          mode: defaultBusinessMode,
          status: defaultBusinessMode === "BOOKING_SERVICE" ? "WAITING_DP" : "ORDER_BARU",
          paymentStatus: "UNPAID",
          notes: parsedWA.address ? `Alamat: ${parsedWA.address}` : "",
          existingCustomerId: existing?.id ?? null,
        },
      };
    }
  }

  const lowercaseText = trimmed.toLowerCase();

  // Helper function to find a customer reference in text
  function findCustomerMatch(inputText: string): Customer | undefined {
    const sorted = [...customers].sort((a, b) => b.name.length - a.name.length);
    for (const c of sorted) {
      if (inputText.includes(c.name.toLowerCase())) {
        return c;
      }
    }
    const words = inputText.split(/\s+/);
    for (const word of words) {
      if (word.length > 2) {
        const found = customers.find((c) => c.name.toLowerCase().includes(word));
        if (found) return found;
      }
    }
    return undefined;
  }

  // Helper function to find an active/recent order for a customer or matching query
  function findOrderMatch(inputText: string, customerId?: string): Order | undefined {
    let candidates = orders;
    if (customerId) {
      candidates = orders.filter((o) => o.customerId === customerId);
    }
    
    const sortedCandidates = [...candidates].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

    for (const o of sortedCandidates) {
      if (inputText.includes(o.title.toLowerCase())) {
        return o;
      }
    }

    for (const o of sortedCandidates) {
      if (inputText.includes(o.customerName.toLowerCase())) {
        return o;
      }
    }

    return sortedCandidates[0];
  }

  // 2. Command: UPDATE_ORDER_PAYMENT (lunas / bayar / dp)
  const isPaymentUpdate = /lunas|paid|dp|bayar|pelunasan/i.test(lowercaseText);
  if (isPaymentUpdate) {
    const isDp = /dp/i.test(lowercaseText);
    const amount = parseMoney(lowercaseText);
    const matchedCustomer = findCustomerMatch(lowercaseText);
    const matchedOrder = findOrderMatch(lowercaseText, matchedCustomer?.id);

    if (matchedOrder) {
      const nextPaymentStatus = isDp ? "DP_PAID" : "PAID";
      let explanation = `Menandai order "${matchedOrder.title}" (${matchedOrder.customerName}) sebagai **${isDp ? "Sudah DP" : "Lunas"}**.`;
      if (amount) {
        explanation = `Menandai order "${matchedOrder.title}" (${matchedOrder.customerName}) dengan pembayaran ${isDp ? "DP" : "Pelunasan"} sebesar **Rp ${amount.toLocaleString("id-ID")}**.`;
      }

      return {
        type: "UPDATE_ORDER_PAYMENT",
        confidence: "HIGH",
        explanation,
        suggestedActionLabel: `Ubah Pembayaran ke ${isDp ? "DP" : "LUNAS"}`,
        data: {
          orderId: matchedOrder.id,
          customerName: matchedOrder.customerName,
          title: matchedOrder.title,
          paymentStatus: nextPaymentStatus,
          dpAmount: isDp ? (amount ?? matchedOrder.dpAmount ?? 0) : undefined,
          totalAmount: !isDp ? (amount ?? matchedOrder.totalAmount ?? 0) : undefined,
        },
      };
    }
  }

  // 3. Command: UPDATE_ORDER_STATUS (selesai / batal / cancel / confirm)
  const isStatusUpdate = /selesai|sukses|batal|cancel|konfirmasi|confirm|deal/i.test(lowercaseText);
  if (isStatusUpdate) {
    const matchedCustomer = findCustomerMatch(lowercaseText);
    const matchedOrder = findOrderMatch(lowercaseText, matchedCustomer?.id);

    if (matchedOrder) {
      let targetStatus: OrderStatus = matchedOrder.status;
      let label = "";

      if (/batal|cancel/i.test(lowercaseText)) {
        targetStatus = "BATAL";
        label = "Batal";
      } else if (/selesai|sukses/i.test(lowercaseText)) {
        targetStatus = "SELESAI";
        label = "Selesai";
      } else if (/konfirmasi|confirm|deal/i.test(lowercaseText)) {
        targetStatus = matchedOrder.mode === "BOOKING_SERVICE" ? "CONFIRMED" : "DEAL";
        label = "Konfirmasi";
      }

      if (label) {
        return {
          type: "UPDATE_ORDER_STATUS",
          confidence: "HIGH",
          explanation: `Mengubah status operasional order "${matchedOrder.title}" (${matchedOrder.customerName}) menjadi **${label}**.`,
          suggestedActionLabel: `Ubah Status ke ${label.toUpperCase()}`,
          data: {
            orderId: matchedOrder.id,
            customerName: matchedOrder.customerName,
            title: matchedOrder.title,
            status: targetStatus,
          },
        };
      }
    }
  }

  // 4. Command: CREATE_INVOICE (buat invoice / nota)
  const isInvoiceCreate = /invoice|nota|tanda\s+terima|tanda\s+bayar/i.test(lowercaseText);
  if (isInvoiceCreate) {
    const matchedCustomer = findCustomerMatch(lowercaseText);
    const matchedOrder = findOrderMatch(lowercaseText, matchedCustomer?.id);

    if (matchedOrder) {
      return {
        type: "CREATE_INVOICE",
        confidence: "HIGH",
        explanation: `Membuat invoice / nota tagihan digital untuk order "${matchedOrder.title}" atas nama **${matchedOrder.customerName}**.`,
        suggestedActionLabel: "Terbitkan Invoice",
        data: {
          orderId: matchedOrder.id,
          customerName: matchedOrder.customerName,
          title: matchedOrder.title,
          totalAmount: matchedOrder.totalAmount ?? 0,
        },
      };
    }
  }

  // 5. Command: CREATE_CUSTOMER (tambah customer / kontak)
  const isCustomerCreate = /tambah\s+(?:customer|pelanggan|kontak|orang|wa)|add\s+(?:customer|client|contact)/i.test(lowercaseText);
  if (isCustomerCreate) {
    const nameMatch = lowercaseText.match(/(?:customer|pelanggan|kontak|orang|wa|client|contact|add|tambah)\s+([a-z\s]+?)(?:\s+(?:wa|no|phone|hp|nomor|\d+))?$/i);
    const rawPhonePattern = /(?:08|62|\+62)[\d\s-]{8,14}/;
    const phoneMatch = lowercaseText.match(rawPhonePattern);
    
    let extractedName = "";
    if (nameMatch) {
      extractedName = nameMatch[1].trim();
      extractedName = extractedName.replace(/\s+(?:wa|no|phone|hp|nomor)$/i, "");
      extractedName = extractedName.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
    }

    let phone = "";
    if (phoneMatch) {
      phone = phoneMatch[0].replace(/[^\d]/g, "");
      if (phone.startsWith("0")) phone = "62" + phone.slice(1);
    }

    if (extractedName) {
      return {
        type: "CREATE_CUSTOMER",
        confidence: "HIGH",
        explanation: `Mendaftarkan customer baru bernama **${extractedName}** ${phone ? `dengan nomor WhatsApp ${phone}` : ""}.`,
        suggestedActionLabel: "Tambah Customer Baru",
        data: {
          name: extractedName,
          whatsappNumber: phone || "",
          status: "NEW",
        },
      };
    }
  }

  // 6. Command: SEARCH (cari / tampilkan)
  const isSearch = /cari|temukan|search|find|tampilkan|show/i.test(lowercaseText);
  if (isSearch) {
    const searchTerms = lowercaseText.replace(/cari|temukan|search|find|tampilkan|show/g, "").trim();
    if (searchTerms) {
      return {
        type: "SEARCH",
        confidence: "HIGH",
        explanation: `Mencari data customer dan order yang mengandung kata kunci **"${searchTerms}"**.`,
        suggestedActionLabel: "Cari Data",
        data: {
          query: searchTerms,
        },
      };
    }
  }

  // 7. Command: CREATE_ORDER (tambah order - booking / sewa / beli / pesan)
  const isOrderCreation = /booking|sewa|beli|pesan|order/i.test(lowercaseText) || 
                          parseRelativeDate(lowercaseText) !== undefined || 
                          parseMoney(lowercaseText) !== undefined;

  if (isOrderCreation) {
    const matchedCustomer = findCustomerMatch(lowercaseText);
    let customerName = matchedCustomer ? matchedCustomer.name : "";
    const phone = matchedCustomer ? matchedCustomer.whatsappNumber : "";

    if (!customerName) {
      const words = trimmed.split(/\s+/);
      const skipKeywords = ["booking", "sewa", "beli", "pesan", "order", "tambah", "buat", "hari", "ini", "besok", "lusa", "jam", "total", "dp", "ribu", "juta", "rb", "jt"];
      for (const word of words) {
        const cleanWord = word.toLowerCase().replace(/[^a-z]/g, "");
        if (cleanWord.length > 2 && !skipKeywords.includes(cleanWord)) {
          customerName = word.charAt(0).toUpperCase() + word.slice(1);
          break;
        }
      }
      if (!customerName) customerName = "Pelanggan Baru";
    }

    const parsedDate = parseRelativeDate(lowercaseText);
    const scheduledDate = parsedDate ? parsedDate.dateStr : toDateKey(new Date());
    const dateLabel = parsedDate ? parsedDate.label : "Hari ini";

    const scheduledTime = parseTime(lowercaseText) || "10:00";

    let totalAmount: number | undefined;
    let dpAmount: number | undefined;

    const totalMatch = lowercaseText.match(/(?:total|harga|bayar)\s*([\d.,\s]+(?:rb|ribu|jt|juta)?)/i);
    if (totalMatch) {
      totalAmount = parseMoney(totalMatch[1]);
    }
    const dpMatch = lowercaseText.match(/(?:dp|uang\s+muka|hold)\s*([\d.,\s]+(?:rb|ribu|jt|juta)?)/i);
    if (dpMatch) {
      dpAmount = parseMoney(dpMatch[1]);
    }

    if (totalAmount === undefined) {
      const allMoney = lowercaseText.match(/(\d+(?:\s*(?:rb|ribu|jt|juta))?)/gi);
      if (allMoney && allMoney.length > 0) {
        totalAmount = parseMoney(allMoney[0]);
        if (allMoney.length > 1 && dpAmount === undefined) {
          dpAmount = parseMoney(allMoney[1]);
        }
      }
    }

    let title = "Order Baru";
    const titleMatch = lowercaseText.match(/(?:booking|sewa|pesan|beli|order)\s+([a-z\s]+?)(?:\s+(?:hari|besok|lusa|jam|total|dp|untuk|oleh|atas|nama|\d))/i);
    if (titleMatch && titleMatch[1].trim().length > 2) {
      title = titleMatch[1].trim();
      title = title.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
    } else {
      if (lowercaseText.includes("studio")) title = "Booking Studio";
      else if (lowercaseText.includes("motor")) title = "Sewa Motor";
      else if (lowercaseText.includes("mobil")) title = "Sewa Mobil";
      else if (lowercaseText.includes("kamera")) title = "Sewa Kamera";
      else if (lowercaseText.includes("laundry")) title = "Jasa Laundry";
      else if (lowercaseText.includes("makeup") || lowercaseText.includes("mua")) title = "Jasa Make Up / MUA";
    }

    return {
      type: "CREATE_ORDER",
      confidence: "MEDIUM",
      explanation: `Membuat draft order **"${title}"** untuk **${customerName}** tanggal **${dateLabel}** jam **${scheduledTime}**${totalAmount ? ` dengan nilai total Rp ${totalAmount.toLocaleString("id-ID")}` : ""}${dpAmount ? ` (DP Rp ${dpAmount.toLocaleString("id-ID")})` : ""}.`,
      suggestedActionLabel: "Buat Order Baru",
      data: {
        customerName,
        whatsappNumber: phone || "",
        title,
        mode: defaultBusinessMode,
        status: defaultBusinessMode === "BOOKING_SERVICE" ? "WAITING_DP" : "ORDER_BARU",
        paymentStatus: dpAmount ? "DP_PAID" : totalAmount ? "UNPAID" : "UNPAID",
        scheduledDate,
        scheduledTime,
        totalAmount,
        dpAmount,
        existingCustomerId: matchedCustomer?.id ?? null,
      },
    };
  }

  return {
    type: "SEARCH",
    confidence: "LOW",
    explanation: `Mencari data untuk kata kunci **"${trimmed}"**.`,
    suggestedActionLabel: "Cari Data",
    data: {
      query: trimmed,
    },
  };
}
