import type { MessageTemplate } from "@/types/message";

export const mockMessageTemplates: MessageTemplate[] = [
  {
    id: "msg_000",
    businessId: "biz_001",
    category: "INQUIRY",
    title: "Balas Inquiry",
    content:
      "Halo {{customer_name}}, terima kasih sudah hubungi {{business_name}}. Untuk {{order_title}}, saya bantu jelaskan detailnya ya.",
    variables: ["customer_name", "business_name", "order_title"],
    createdAt: "2026-06-01T08:00:00.000Z",
    updatedAt: "2026-06-01T08:00:00.000Z",
  },
  {
    id: "msg_001",
    businessId: "biz_001",
    category: "FOLLOW_UP",
    title: "Follow-Up Booking",
    content:
      "Halo {{customer_name}}, saya follow-up lagi ya untuk {{order_title}}. Kalau masih mau lanjut, saya siap bantu proses bookingnya.",
    variables: ["customer_name", "order_title"],
    createdAt: "2026-06-01T08:00:00.000Z",
    updatedAt: "2026-06-01T08:00:00.000Z",
  },
  {
    id: "msg_002",
    businessId: "biz_001",
    category: "PEMBAYARAN",
    title: "Pengingat DP",
    content:
      "Halo {{customer_name}}, untuk {{order_title}} masih ada DP {{dp_amount}} ya. Kalau sudah siap transfer, kabari saya, nanti langsung saya proses.",
    variables: ["customer_name", "order_title", "dp_amount"],
    createdAt: "2026-06-01T08:00:00.000Z",
    updatedAt: "2026-06-01T08:00:00.000Z",
  },
  {
    id: "msg_003",
    businessId: "biz_001",
    category: "REVIEW",
    title: "Minta Review",
    content:
      "Terima kasih ya {{customer_name}}, {{order_title}} sudah selesai. Kalau berkenan, boleh bantu kasih review singkat tentang pengalaman kemarin?",
    variables: ["customer_name", "order_title"],
    createdAt: "2026-06-01T08:00:00.000Z",
    updatedAt: "2026-06-01T08:00:00.000Z",
  },
  {
    id: "msg_004",
    businessId: "biz_001",
    category: "BOOKING_ORDER",
    title: "Konfirmasi Booking",
    content:
      "Halo {{customer_name}}, booking untuk {{order_title}} sudah kami catat ya. Jadwalnya {{scheduled_date}} jam {{scheduled_time}}.",
    variables: ["customer_name", "order_title", "scheduled_date", "scheduled_time"],
    createdAt: "2026-06-01T08:00:00.000Z",
    updatedAt: "2026-06-01T08:00:00.000Z",
  },
  {
    id: "msg_005",
    businessId: "biz_001",
    category: "REVIEW",
    title: "Pembayaran Lunas",
    content:
      "Halo {{customer_name}}, pembayaran untuk {{order_title}} sudah kami terima. Terima kasih, bookingnya aman ya.",
    variables: ["customer_name", "order_title"],
    createdAt: "2026-06-01T08:00:00.000Z",
    updatedAt: "2026-06-01T08:00:00.000Z",
  },
  {
    id: "msg_006",
    businessId: "biz_001",
    category: "ALAMAT",
    title: "Info Alamat",
    content:
      "Halo {{customer_name}}, lokasi {{business_name}} siap saya kirim ya. Kalau perlu, saya sekalian kirim titik maps-nya.",
    variables: ["customer_name", "business_name"],
    createdAt: "2026-06-01T08:00:00.000Z",
    updatedAt: "2026-06-01T08:00:00.000Z",
  },
  {
    id: "msg_007",
    businessId: "biz_001",
    category: "SELESAI",
    title: "Follow-Up Selesai",
    content:
      "Halo {{customer_name}}, order {{order_title}} sudah selesai ya. Terima kasih sudah percaya ke {{business_name}}.",
    variables: ["customer_name", "order_title", "business_name"],
    createdAt: "2026-06-01T08:00:00.000Z",
    updatedAt: "2026-06-01T08:00:00.000Z",
  },
];
