"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Search,
  CheckCircle2,
  Calendar,
  Clock,
  User,
  Phone,
  Tag,
  DollarSign,
  AlertCircle,
  HelpCircle,
  Undo,
  Terminal,
  X,
  Send
} from "lucide-react";
import { Button, LinkButton } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { TimeSelect } from "@/components/ui/time-select";
import { FormattedNumberInput } from "@/components/ui/formatted-number-input";
import { useToast } from "@/components/ui/toast-provider";
import { useAppData } from "@/components/providers/app-data-provider";
import { parseAssistantCommand, type ParsedCommandResult } from "@/lib/assistant-parser";
import { ORDER_STATUS_BY_MODE, PAYMENT_STATUS_LABELS } from "@/lib/constants/orders";
import { ROUTES } from "@/lib/routes";
import { cn } from "@/lib/cn";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import {
  checkDailyCommandLimit,
  incrementDailyCommandUsage,
  getHelperConsoleLimits,
  getHelperSettings,
  saveHelperSettings,
  getDailyCommandUsage,
  type HelperConsoleSettings
} from "@/lib/assistant-limits";

const SUGGESTED_COMMANDS = [
  {
    label: "Buat Booking Baru",
    cmd: "booking studio rudi besok jam 15.00 total 150rb dp 50rb",
    desc: "Membuat booking order lengkap dengan DP",
    actionType: "CREATE_ORDER",
  },
  {
    label: "Tandai Order Lunas",
    cmd: "lunas order rudi",
    desc: "Mencari order Rudi yang belum lunas lalu melunasi",
    actionType: "UPDATE_ORDER_PAYMENT",
  },
  {
    label: "Batalkan Order",
    cmd: "batal booking budi",
    desc: "Membatalkan booking yang terdaftar atas nama Budi",
    actionType: "UPDATE_ORDER_STATUS",
  },
  {
    label: "Terbitkan Invoice",
    cmd: "buat invoice siska",
    desc: "Mencari order Siska lalu membuat nota tagihan",
    actionType: "CREATE_INVOICE",
  },
  {
    label: "Tambah Pelanggan",
    cmd: "tambah customer yeni wa 081299887766",
    desc: "Mendaftarkan profil pelanggan baru ke database",
    actionType: "CREATE_CUSTOMER",
  },
];

export default function AssistantPage() {
  const router = useRouter();
  const toast = useToast();
  const {
    business,
    customers,
    orders,
    createOrder,
    updateOrder,
    createCustomer,
    createInvoiceFromOrder,
    canAccessWriteMode,
    subscriptionForCurrentBusiness
  } = useAppData();

  const planCode = subscriptionForCurrentBusiness?.planCode || "FREE_TRIAL";
  const limits = getHelperConsoleLimits(planCode);

  const filteredCommands = useMemo(() => {
    return SUGGESTED_COMMANDS.filter((item) => limits.allowedActions.includes(item.actionType));
  }, [limits.allowedActions]);

  const [command, setCommand] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [draftData, setDraftData] = useState<any>({});
  const [historyLogs, setHistoryLogs] = useState<Array<{ id: string; text: string; timestamp: string; whatsappUrl?: string }>>([]);
  const [error, setError] = useState("");
  const [isExecuting, setIsExecuting] = useState(false);
  const [settings, setSettings] = useState<HelperConsoleSettings>(() => getHelperSettings(planCode));
  const [dailyUsage, setDailyUsage] = useState(() => getDailyCommandUsage());

  const matchingCustomers = useMemo(() => {
    if (!draftData.customerName || draftData.customerName.length < 2) return [];
    const q = draftData.customerName.toLowerCase();
    return customers.filter(
      (c) => c.name.toLowerCase().includes(q) || c.whatsappNumber.includes(q)
    );
  }, [draftData.customerName, customers]);

  const hasExactMatch = useMemo(() => {
    if (!draftData.customerName) return false;
    const nameLower = draftData.customerName.trim().toLowerCase();
    const phoneTrim = (draftData.whatsappNumber || "").trim();
    return customers.some(
      (c) => c.name.toLowerCase() === nameLower && c.whatsappNumber === phoneTrim
    );
  }, [draftData.customerName, draftData.whatsappNumber, customers]);

  const inputRef = useRef<HTMLInputElement>(null);

  // Sync settings if plan changes
  useEffect(() => {
    setSettings(getHelperSettings(planCode));
  }, [planCode]);

  useEffect(() => {
    if (planCode === "FREE_TRIAL") {
      router.replace(ROUTES.dashboard);
    }
  }, [planCode, router]);

  // Sync daily usage initially
  useEffect(() => {
    setDailyUsage(getDailyCommandUsage());
  }, []);

  // Load history logs if enabled
  useEffect(() => {
    if (typeof window !== "undefined" && settings.saveHistory) {
      const raw = localStorage.getItem("rapiin_helper_history");
      if (raw) {
        try {
          setHistoryLogs(JSON.parse(raw).slice(0, limits.maxHistoryLogs));
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, [settings.saveHistory, limits.maxHistoryLogs]);

  // Save history logs if enabled
  useEffect(() => {
    if (typeof window !== "undefined" && settings.saveHistory && historyLogs.length > 0) {
      localStorage.setItem("rapiin_helper_history", JSON.stringify(historyLogs));
    }
  }, [historyLogs, settings.saveHistory]);

  // Focus command bar on load
  useEffect(() => {
    if (settings.autoFocus) {
      inputRef.current?.focus();
    }
  }, [settings.autoFocus]);

  // Command parser hook
  const parsed: ParsedCommandResult = useMemo(() => {
    return parseAssistantCommand(command, customers, orders, business.mode);
  }, [command, customers, orders, business.mode]);

  // Sync draft data on change
  useEffect(() => {
    if (parsed.type !== "UNKNOWN") {
      setDraftData(parsed.data);
      setError("");
    } else {
      setDraftData({});
    }
  }, [parsed.type, parsed.data]);

  // Search matches
  const searchResults = useMemo(() => {
    if (parsed.type !== "SEARCH" || !parsed.data.query) {
      return { customers: [], orders: [] };
    }
    const q = parsed.data.query.toLowerCase();
    const matchedCustomers = customers.filter(
      (c) => c.name.toLowerCase().includes(q) || c.whatsappNumber.includes(q)
    );
    const matchedOrders = orders.filter(
      (o) => o.customerName.toLowerCase().includes(q) || o.title.toLowerCase().includes(q)
    );
    return { customers: matchedCustomers, orders: matchedOrders };
  }, [parsed, customers, orders]);

  const isActionAllowed = limits.allowedActions.includes(parsed.type);

  async function handleExecute() {
    if (!canAccessWriteMode) {
      setError("Aplikasi dalam mode baca saja (Trial kedaluwarsa atau limit penuh).");
      return;
    }

    if (parsed.type === "UNKNOWN" || parsed.type === "SEARCH") {
      return;
    }

    if (command.includes("&&")) {
      if (planCode !== "PREMIUM" || !settings.macrosEnabled) {
        setError("⚠️ Perintah gabungan (&&) adalah fitur Makro Premium. Silakan upgrade plan Premium Anda.");
        return;
      }
    }

    if (!isActionAllowed) {
      setError(`⚠️ Aksi "${parsed.suggestedActionLabel}" tidak tersedia untuk paket ${limits.planLabel}. Silakan upgrade plan Anda.`);
      return;
    }

    const limitCheck = checkDailyCommandLimit(planCode);
    if (!limitCheck.allowed) {
      setError(`⚠️ Batas kuota harian terlampaui. Anda telah menggunakan ${limitCheck.count}/${limitCheck.max} perintah hari ini.`);
      return;
    }

    setIsExecuting(true);
    setError("");

    try {
      const nowStr = new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
      const logId = Math.random().toString(36).substring(2, 9);
      let executedLogText = "";
      let whatsappUrl: string | undefined = undefined;

      if (parsed.type === "CREATE_ORDER") {
        if (!draftData.customerName || !draftData.title) {
          throw new Error("Lengkapi nama customer dan judul pesanan.");
        }
        const newOrd = createOrder({
          customerName: draftData.customerName,
          whatsappNumber: draftData.whatsappNumber || "",
          title: draftData.title,
          mode: draftData.mode,
          status: draftData.status,
          paymentStatus: draftData.paymentStatus,
          scheduledDate: draftData.scheduledDate,
          scheduledTime: draftData.scheduledTime,
          totalAmount: draftData.totalAmount ? Number(draftData.totalAmount) : undefined,
          dpAmount: draftData.dpAmount ? Number(draftData.dpAmount) : undefined,
          notes: draftData.notes,
        });

        let invoiceText = "";
        if (settings.autoCreateInvoice && planCode === "PREMIUM") {
          const inv = createInvoiceFromOrder(newOrd.id);
          if (inv) {
            invoiceText = ` & Nota Tagihan ${inv.invoiceCode} diterbitkan secara otomatis.`;
          }
        }

        const formattedDate = newOrd.scheduledDate ? new Date(newOrd.scheduledDate).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) : "-";
        const waMsg = `Halo ${newOrd.customerName},\n\nTerima kasih telah memesan di ${business.name}. Rincian pesanan Anda:\n\n` +
          `• Layanan: ${newOrd.title}\n` +
          `• Jadwal: ${formattedDate} pukul ${newOrd.scheduledTime || "-"}\n` +
          `• Total: Rp ${(newOrd.totalAmount || 0).toLocaleString("id-ID")}\n` +
          (newOrd.dpAmount ? `• DP: Rp ${newOrd.dpAmount.toLocaleString("id-ID")}\n` : "") +
          `• Status: ${newOrd.paymentStatus === "PAID" ? "Lunas" : newOrd.paymentStatus === "DP_PAID" ? "Sudah DP" : "Belum Bayar"}\n\n` +
          `Mohon ditunggu kehadiran Anda. Terima kasih!`;
        whatsappUrl = newOrd.whatsappNumber ? buildWhatsAppUrl(newOrd.whatsappNumber, waMsg) : undefined;

        executedLogText = `Berhasil membuat order "${newOrd.title}" untuk customer ${newOrd.customerName}${invoiceText}`;
        toast.success("Order berhasil dibuat!", `Nama: ${newOrd.customerName}${invoiceText ? ' + Nota Tagihan' : ''}`);
      }

      else if (parsed.type === "UPDATE_ORDER_PAYMENT") {
        const order = orders.find((o) => o.id === draftData.orderId);
        if (!order) throw new Error("Order tidak ditemukan.");

        const updated = updateOrder(order.id, {
          ...order,
          paymentStatus: draftData.paymentStatus,
          dpAmount: draftData.dpAmount !== undefined ? Number(draftData.dpAmount) : order.dpAmount,
          totalAmount: draftData.totalAmount !== undefined ? Number(draftData.totalAmount) : order.totalAmount,
        });

        const statusLabel = updated?.paymentStatus === "PAID" ? "Lunas" : "Sudah DP";
        executedLogText = `Berhasil memperbarui pembayaran order "${order.title}" menjadi ${statusLabel}`;
        toast.success("Status pembayaran diperbarui!", `${order.customerName} - ${statusLabel}`);
      }

      else if (parsed.type === "UPDATE_ORDER_STATUS") {
        const order = orders.find((o) => o.id === draftData.orderId);
        if (!order) throw new Error("Order tidak ditemukan.");

        updateOrder(order.id, {
          ...order,
          status: draftData.status,
        });

        executedLogText = `Berhasil merubah status order "${order.title}" menjadi ${draftData.status}`;
        toast.success("Status operasional diperbarui!", `${order.customerName} -> ${draftData.status}`);
      }

      else if (parsed.type === "CREATE_INVOICE") {
        const inv = createInvoiceFromOrder(draftData.orderId);
        if (!inv) throw new Error("Gagal membuat invoice.");

        executedLogText = `Berhasil menerbitkan nota tagihan ${inv.invoiceCode} untuk ${draftData.customerName}`;
        toast.success("Nota Tagihan diterbitkan!", inv.invoiceCode);
      }

      else if (parsed.type === "CREATE_CUSTOMER") {
        if (!draftData.name) throw new Error("Nama customer tidak boleh kosong.");
        const cust = createCustomer({
          name: draftData.name,
          whatsappNumber: draftData.whatsappNumber || "",
          status: draftData.status,
        });

        executedLogText = `Berhasil mendaftarkan customer baru "${cust.name}"`;
        toast.success("Customer baru didaftarkan!", cust.name);
      }

      if (executedLogText) {
        const newLog = {
          id: logId,
          text: executedLogText,
          timestamp: nowStr,
          whatsappUrl,
        };
        setHistoryLogs((prev) => {
          const nextLogs = [newLog, ...prev];
          return nextLogs.slice(0, limits.maxHistoryLogs);
        });

        incrementDailyCommandUsage();
        setDailyUsage(getDailyCommandUsage());
      }

      setCommand("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan sistem saat mengeksekusi.");
    } finally {
      setIsExecuting(false);
    }
  }

  // Keyboard shortcut inside full page: Ctrl+Enter or Cmd+Enter to execute
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handleExecute();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parsed, draftData]);

  const confidenceColor = 
    parsed.confidence === "HIGH" ? "text-emerald-400 bg-emerald-950/40 border-emerald-900/50" : 
    parsed.confidence === "MEDIUM" ? "text-amber-400 bg-amber-950/40 border-amber-900/50" : 
    "text-rose-400 bg-rose-950/40 border-rose-900/50";

  return (
    <main className="page-enter space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      {/* Hero Header */}
      <section>
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0c1d3b] via-[#122a57] to-[#09152b] border border-white/[0.08] shadow-[var(--shadow-lg)] px-6 py-6 sm:px-8 sm:py-8 text-white">
          <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[var(--color-accent)] opacity-15 blur-3xl" />
          <div className="absolute -left-10 -bottom-10 h-32 w-32 rounded-full bg-[var(--color-primary)] opacity-30 blur-3xl" />
          
          <div className="relative flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div className="space-y-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.08] px-3.5 py-1 text-xs font-bold tracking-wider text-[var(--color-gold-300)] border border-white/[0.1] backdrop-blur-md uppercase">
                <Sparkles className="h-3.5 w-3.5 text-[var(--color-accent)]" />
                Konsol Pembantu Perintah
              </span>
              <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl text-white">
                Rapiin Input Helper Console
              </h1>
              <p className="max-w-xl text-sm text-white/70 leading-relaxed">
                Operasionalkan bisnis Anda secara cepat menggunakan pencocokan kata kunci kalimat offline (bukan AI). Tambah order, ubah status pembayaran, terbitkan nota, atau tambah customer dalam hitungan detik secara lokal.
              </p>
            </div>

            <div className="flex flex-wrap gap-2.5 xl:shrink-0">
              <LinkButton href={ROUTES.dashboard} className="shadow-sm">
                Ke Dashboard
              </LinkButton>
            </div>
          </div>
        </div>
      </section>

      {/* Main Layout Grid */}
      <section className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
        {/* Left Side: Command Panel & Forms */}
        <div className="space-y-6">
          {/* Panduan Owner & Admin */}
          <Card className="border-[var(--color-border)] bg-[var(--color-surface-elevated)]/50 shadow-none">
            <CardBody className="p-5 space-y-3.5">
              <div className="flex items-center gap-2 border-b border-[var(--color-border)] pb-2.5">
                <HelpCircle className="h-4.5 w-4.5 text-[var(--color-primary)] animate-pulse" />
                <h3 className="text-sm font-extrabold text-[var(--color-text)] uppercase tracking-wider">Panduan Cepat Admin & Owner</h3>
              </div>
              <div className="grid gap-3 text-xs text-[var(--color-text-secondary)] sm:grid-cols-2 md:grid-cols-3">
                <div className="space-y-1 bg-[var(--color-surface)] p-3 rounded-2xl border border-[var(--color-border)]">
                  <span className="text-[10px] font-black uppercase text-[var(--color-primary)]">1. Tulis Perintah</span>
                  <p className="leading-relaxed">Ketik detail transaksi di kolom input teks di bawah (misal: order, pembayaran, atau tambah customer).</p>
                </div>
                <div className="space-y-1 bg-[var(--color-surface)] p-3 rounded-2xl border border-[var(--color-border)]">
                  <span className="text-[10px] font-black uppercase text-[var(--color-primary)]">2. Tinjau & Edit</span>
                  <p className="leading-relaxed">Sistem mendeteksi data secara lokal. Tinjau formulir draf yang muncul dan sesuaikan nilainya bila perlu.</p>
                </div>
                <div className="space-y-1 bg-[var(--color-surface)] p-3 rounded-2xl border border-[var(--color-border)]">
                  <span className="text-[10px] font-black uppercase text-[var(--color-primary)]">3. Simpan Instan</span>
                  <p className="leading-relaxed">Klik tombol tindakan atau tekan tombol <kbd className="bg-[var(--color-border)] px-1.5 py-0.5 rounded text-[10px]">Ctrl+Enter</kbd> untuk menyimpan data secara langsung.</p>
                </div>
              </div>
              <p className="text-[10px] text-[var(--color-text-muted)] italic leading-relaxed pt-1.5 flex items-center gap-1.5 border-t border-[var(--color-border)]/40">
                💡 Panggil Konsol Pembantu dari halaman mana saja di Rapiin dengan menekan shortcut <kbd className="bg-[var(--color-border)] px-1.5 py-0.5 rounded font-mono text-[9px]">⌘K</kbd> / <kbd className="bg-[var(--color-border)] px-1.5 py-0.5 rounded font-mono text-[9px]">Ctrl+K</kbd>.
              </p>
            </CardBody>
          </Card>

          <Card className="border-[var(--color-border)] shadow-none">
            <CardBody className="p-6 space-y-5">
              {/* Custom Command Input */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)] flex items-center gap-1.5">
                  <Terminal className="h-4 w-4 text-[var(--color-primary)]" />
                  Baris Perintah Teks
                </label>
                <div className="relative flex items-center rounded-2xl border border-[var(--color-border-strong)] bg-[var(--color-surface-elevated)] px-4 py-3 shadow-inner">
                  <Search className="h-5 w-5 text-[var(--color-text-muted)] mr-3 shrink-0" />
                  <input
                    ref={inputRef}
                    type="text"
                    className="w-full bg-transparent text-sm text-[var(--color-text)] placeholder-[var(--color-text-muted)]/70 outline-none"
                    placeholder="Tulis instruksi... (misal: 'booking studio andi besok jam 2 sore total 150rb dp 50rb')"
                    value={command}
                    onChange={(e) => setCommand(e.target.value)}
                  />
                  {command && (
                    <button
                      onClick={() => setCommand("")}
                      className="p-1 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              {error && (
                <div className="rounded-2xl bg-rose-50 border border-rose-200 p-4 text-xs text-rose-800 flex items-start gap-3">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* LIVE PREVIEW IF COMMAND WRITTEN */}
              {command && parsed.type !== "UNKNOWN" && parsed.type !== "SEARCH" && (
                <div className="space-y-6 pt-2 border-t border-[var(--color-border)]/50">
                  
                  {/* Analysis card */}
                  <div className="rounded-2xl border border-white/[0.08] bg-gradient-to-br from-[#0f2142] to-[#122e5a] text-white p-5 space-y-3.5 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.08] px-3 py-0.5 text-[9px] font-bold tracking-wider text-amber-300 uppercase">
                        Hasil Deteksi NLP
                      </span>
                      <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider", confidenceColor)}>
                        AKURASI: {parsed.confidence}
                      </span>
                    </div>

                    <p className="text-sm text-white/90 leading-relaxed font-medium" dangerouslySetInnerHTML={{ __html: parsed.explanation }} />
                  </div>

                  {/* Form Tweaks */}
                  <div className="space-y-4 rounded-2xl border border-[var(--color-border)] p-5 bg-[var(--color-surface)]">
                    <div className="flex justify-between items-center border-b border-[var(--color-border)] pb-2.5">
                      <span className="text-xs font-extrabold uppercase tracking-wider text-[var(--color-text-secondary)]">Detail Struktur Data</span>
                      <span className="text-[10px] text-[var(--color-text-muted)]">Anda dapat memodifikasi field di bawah</span>
                    </div>

                    {parsed.type === "CREATE_ORDER" && draftData && (
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] flex items-center gap-1"><User className="h-3 w-3" /> Nama Customer</label>
                          <Input
                            value={draftData.customerName || ""}
                            onChange={(e) => setDraftData({ ...draftData, customerName: e.target.value })}
                            className="text-xs h-9 rounded-xl border-[var(--color-border-strong)]"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] flex items-center gap-1"><Phone className="h-3 w-3" /> No WhatsApp</label>
                          <Input
                            value={draftData.whatsappNumber || ""}
                            onChange={(e) => setDraftData({ ...draftData, whatsappNumber: e.target.value })}
                            className="text-xs h-9 rounded-xl border-[var(--color-border-strong)]"
                          />
                        </div>

                        {/* Customer Linker */}
                        <div className="sm:col-span-2 space-y-2">
                          {hasExactMatch ? (
                            <p className="text-[10px] text-emerald-600 font-bold">✓ Terhubung ke Customer terdaftar di database</p>
                          ) : (
                            <p className="text-[10px] text-amber-600 font-medium">✦ Customer baru (akan didaftarkan otomatis)</p>
                          )}

                          {matchingCustomers.length > 0 && !hasExactMatch && (
                            <div className="space-y-1.5 p-3 rounded-2xl bg-[var(--color-surface-elevated)] border border-[var(--color-border)]">
                              <p className="text-[10px] font-extrabold text-[var(--color-text-secondary)] uppercase tracking-wider">Hubungkan dengan Customer Terdaftar:</p>
                              <div className="flex flex-wrap gap-1.5">
                                {matchingCustomers.slice(0, 4).map((c) => (
                                  <button
                                    key={c.id}
                                    type="button"
                                    onClick={() => {
                                      setDraftData({
                                        ...draftData,
                                        customerName: c.name,
                                        whatsappNumber: c.whatsappNumber
                                      });
                                    }}
                                    className="px-2.5 py-1 text-[10px] font-semibold rounded-xl border bg-[var(--color-surface)] border-[var(--color-border)] hover:border-[var(--color-border-strong)] text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition"
                                  >
                                    {c.name} ({c.whatsappNumber})
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="space-y-1 sm:col-span-2">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] flex items-center gap-1"><Tag className="h-3 w-3" /> Layanan / Detail Order</label>
                          <Input
                            value={draftData.title || ""}
                            onChange={(e) => setDraftData({ ...draftData, title: e.target.value })}
                            className="text-xs h-9 rounded-xl border-[var(--color-border-strong)]"
                          />
                        </div>

                        {draftData.mode === "BOOKING_SERVICE" && (
                          <>
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] flex items-center gap-1"><Calendar className="h-3 w-3" /> Tanggal Booking</label>
                              <DatePicker
                                value={draftData.scheduledDate || ""}
                                onValueChange={(val) => setDraftData({ ...draftData, scheduledDate: val })}
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] flex items-center gap-1"><Clock className="h-3 w-3" /> Waktu Mulai</label>
                              <TimeSelect
                                value={draftData.scheduledTime || ""}
                                onValueChange={(val) => setDraftData({ ...draftData, scheduledTime: val })}
                              />
                            </div>
                          </>
                        )}

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] flex items-center gap-1"><DollarSign className="h-3 w-3" /> Total Biaya (Rp)</label>
                          <FormattedNumberInput
                            value={String(draftData.totalAmount || "")}
                            onValueChange={(val) => setDraftData({ ...draftData, totalAmount: val })}
                            className="text-xs h-9 rounded-xl border-[var(--color-border-strong)]"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] flex items-center gap-1"><DollarSign className="h-3 w-3" /> DP Dibayar (Rp)</label>
                          <FormattedNumberInput
                            value={String(draftData.dpAmount || "")}
                            onValueChange={(val) => setDraftData({ ...draftData, dpAmount: val })}
                            className="text-xs h-9 rounded-xl border-[var(--color-border-strong)]"
                          />
                        </div>
                      </div>
                    )}

                    {parsed.type === "UPDATE_ORDER_PAYMENT" && draftData && (
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Status Pembayaran</label>
                          <Select
                            value={draftData.paymentStatus || "UNPAID"}
                            onValueChange={(val) => setDraftData({ ...draftData, paymentStatus: val })}
                            className="text-xs h-9 rounded-xl border-[var(--color-border-strong)]"
                            options={Object.entries(PAYMENT_STATUS_LABELS).map(([k, v]) => ({ value: k, label: v }))}
                          />
                        </div>

                        {draftData.paymentStatus === "DP_PAID" ? (
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">DP amount (Rp)</label>
                            <FormattedNumberInput
                              value={String(draftData.dpAmount || "")}
                              onValueChange={(val) => setDraftData({ ...draftData, dpAmount: val })}
                              className="text-xs h-9 rounded-xl border-[var(--color-border-strong)]"
                            />
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Total Amount (Rp)</label>
                            <FormattedNumberInput
                              value={String(draftData.totalAmount || "")}
                              onValueChange={(val) => setDraftData({ ...draftData, totalAmount: val })}
                              className="text-xs h-9 rounded-xl border-[var(--color-border-strong)]"
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {parsed.type === "UPDATE_ORDER_STATUS" && draftData && (
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Status Operasional</label>
                          <Select
                            value={draftData.status || ""}
                            onValueChange={(val) => setDraftData({ ...draftData, status: val })}
                            className="text-xs h-9 rounded-xl border-[var(--color-border-strong)]"
                            options={ORDER_STATUS_BY_MODE[business.mode].map((o) => ({ value: o.value, label: o.label }))}
                          />
                        </div>
                      </div>
                    )}

                    {parsed.type === "CREATE_CUSTOMER" && draftData && (
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Nama Pelanggan</label>
                          <Input
                            value={draftData.name || ""}
                            onChange={(e) => setDraftData({ ...draftData, name: e.target.value })}
                            className="text-xs h-9 rounded-xl border-[var(--color-border-strong)]"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Nomor WhatsApp</label>
                          <Input
                            value={draftData.whatsappNumber || ""}
                            onChange={(e) => setDraftData({ ...draftData, whatsappNumber: e.target.value })}
                            className="text-xs h-9 rounded-xl border-[var(--color-border-strong)]"
                          />
                        </div>
                      </div>
                    )}

                    {parsed.type === "CREATE_INVOICE" && draftData && (
                      <div className="rounded-xl border border-[var(--color-border)] p-4 text-xs space-y-2 bg-[var(--color-surface-elevated)]">
                        <p className="text-[var(--color-text-secondary)]">Nota tagihan digital siap dicetak atau dibagikan ke WhatsApp.</p>
                        <div className="flex justify-between py-1 border-b border-[var(--color-border)]/50">
                          <span className="text-[var(--color-text-muted)]">Customer:</span>
                          <span className="font-bold text-[var(--color-text)]">{draftData.customerName}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-[var(--color-border)]/50">
                          <span className="text-[var(--color-text-muted)]">Order:</span>
                          <span className="text-[var(--color-text)]">{draftData.title}</span>
                        </div>
                        <div className="flex justify-between py-1 font-bold">
                          <span className="text-[var(--color-text-muted)]">Total Invoice:</span>
                          <span className="text-[var(--color-primary)]">Rp {(draftData.totalAmount || 0).toLocaleString("id-ID")}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Plan validation alert */}
                  {!isActionAllowed && (
                    <div className="rounded-2xl bg-amber-500/10 border border-amber-500/20 p-4 text-xs text-amber-300 space-y-2.5">
                      <div className="flex gap-2">
                        <AlertCircle className="h-4.5 w-4.5 shrink-0 text-amber-400" />
                        <div>
                          <p className="font-extrabold">Aksi Terkunci — Paket {limits.planLabel}</p>
                          <p className="mt-0.5 text-white/70 text-[11px] leading-relaxed">
                            Aksi untuk perintah <strong>{parsed.suggestedActionLabel}</strong> tidak diaktifkan pada paket gratis Anda. Silakan hubungi admin atau buka menu plan untuk melakukan upgrade.
                          </p>
                        </div>
                      </div>
                      <div className="pt-0.5">
                        <LinkButton href={ROUTES.plan} size="sm" variant="accent" className="border-none font-extrabold px-4">
                          Upgrade Paket &rarr;
                        </LinkButton>
                      </div>
                    </div>
                  )}

                  {/* Action execution */}
                  <div className="flex justify-end gap-3">
                    <Button
                      type="button"
                      variant="secondary"
                      className="rounded-xl font-bold py-2 px-4 text-xs"
                      onClick={() => setCommand("")}
                    >
                      Reset
                    </Button>
                    <Button
                      type="button"
                      isLoading={isExecuting}
                      onClick={handleExecute}
                      disabled={!isActionAllowed}
                      className="bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-900 font-extrabold rounded-xl py-2 px-5 text-xs shadow-sm flex items-center gap-1.5 border-none disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      {parsed.suggestedActionLabel} (Ctrl+Enter)
                    </Button>
                  </div>
                </div>
              )}

              {/* SEARCH RESULTS DISPLAY */}
              {command && parsed.type === "SEARCH" && (
                <div className="space-y-4 pt-2 border-t border-[var(--color-border)]/50">
                  <div className="pb-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">
                      Hasil Pencarian Pencocokan (&quot;{parsed.data.query}&quot;)
                    </span>
                  </div>

                  {searchResults.customers.length === 0 && searchResults.orders.length === 0 ? (
                    <div className="py-12 text-center text-xs text-[var(--color-text-muted)] space-y-2">
                      <AlertCircle className="h-8 w-8 mx-auto text-slate-300" />
                      <p>Tidak ditemukan data pelanggan atau order yang cocok.</p>
                    </div>
                  ) : (
                    <div className="grid gap-6">
                      {searchResults.customers.length > 0 && (
                        <div className="space-y-2">
                          <h5 className="text-[11px] font-extrabold uppercase tracking-wider text-[var(--color-primary)]">Customer ({searchResults.customers.length})</h5>
                          <div className="grid gap-2">
                            {searchResults.customers.map((c) => (
                              <div
                                key={c.id}
                                className="p-4 rounded-2xl bg-[var(--color-surface-elevated)] border border-[var(--color-border)] flex items-center justify-between text-xs transition hover:border-[var(--color-border-strong)]"
                              >
                                <div>
                                  <p className="font-bold text-[var(--color-text)]">{c.name}</p>
                                  <p className="text-[10px] text-[var(--color-text-secondary)] mt-0.5">WA: {c.whatsappNumber}</p>
                                </div>
                                <LinkButton href={ROUTES.customers} size="sm" variant="secondary">
                                  Buka Modul &rarr;
                                </LinkButton>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {searchResults.orders.length > 0 && (
                        <div className="space-y-2">
                          <h5 className="text-[11px] font-extrabold uppercase tracking-wider text-[var(--color-primary)]">Orders / Booking ({searchResults.orders.length})</h5>
                          <div className="grid gap-2">
                            {searchResults.orders.map((o) => (
                              <div
                                key={o.id}
                                className="p-4 rounded-2xl bg-[var(--color-surface-elevated)] border border-[var(--color-border)] flex items-center justify-between text-xs transition hover:border-[var(--color-border-strong)]"
                              >
                                <div>
                                  <p className="font-bold text-[var(--color-text)]">{o.title}</p>
                                  <p className="text-[10px] text-[var(--color-text-secondary)] mt-0.5">Customer: {o.customerName} · Nilai: Rp {(o.totalAmount || 0).toLocaleString("id-ID")}</p>
                                </div>
                                <LinkButton href={`${ROUTES.orders}?id=${o.id}`} size="sm" variant="secondary">
                                  Lihat Order &rarr;
                                </LinkButton>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Right Side: Examples & Execution History */}
        <div className="space-y-6">
          {/* Plan Limits & Settings Card */}
          <Card className="border-[var(--color-border)] shadow-none bg-gradient-to-br from-[var(--color-surface)] to-[var(--color-surface-elevated)]">
            <CardBody className="p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-2.5">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-[var(--color-primary)]" />
                  <h3 className="text-sm font-extrabold text-[var(--color-text)] uppercase tracking-wider">Kontrol & Batasan</h3>
                </div>
                <span className={cn(
                  "text-[9px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider border",
                  planCode === "PREMIUM" ? "text-amber-500 bg-amber-500/10 border-amber-500/20" :
                  planCode === "PRO" ? "text-blue-500 bg-blue-500/10 border-blue-500/20" :
                  "text-slate-500 bg-slate-500/10 border-slate-500/20"
                )}>
                  {limits.planLabel}
                </span>
              </div>

              {/* Usage progress */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-[var(--color-text-secondary)]">Kupon Harian Perintah</span>
                  <span className="font-bold text-[var(--color-text)]">
                    {planCode === "PREMIUM" ? "Unlimited" : `${dailyUsage.count} / ${limits.maxDailyCommands}`}
                  </span>
                </div>
                {planCode !== "PREMIUM" && (
                  <div className="w-full bg-[var(--color-border)] h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-[var(--color-primary)] h-full transition-all duration-300"
                      style={{ width: `${Math.min(100, (dailyUsage.count / limits.maxDailyCommands) * 100)}%` }}
                    />
                  </div>
                )}
              </div>

              {/* Toggle Switches */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="space-y-0.5">
                    <p className="font-bold text-[var(--color-text)]">Autofocus Input</p>
                    <p className="text-[10px] text-[var(--color-text-muted)]">Fokus otomatis saat konsol aktif</p>
                  </div>
                  <Switch 
                    checked={settings.autoFocus}
                    onCheckedChange={(checked) => {
                      const next = { ...settings, autoFocus: checked };
                      setSettings(next);
                      saveHelperSettings(next);
                    }}
                  />
                </div>

                <div className="flex items-center justify-between text-xs">
                  <div className="space-y-0.5">
                    <p className="font-bold text-[var(--color-text)]">Simpan Riwayat Sesi</p>
                    <p className="text-[10px] text-[var(--color-text-muted)]">Simpan log ke memori lokal</p>
                  </div>
                  <Switch 
                    checked={settings.saveHistory}
                    onCheckedChange={(checked) => {
                      const next = { ...settings, saveHistory: checked };
                      setSettings(next);
                      saveHelperSettings(next);
                      if (!checked) {
                        localStorage.removeItem("rapiin_helper_history");
                      }
                    }}
                  />
                </div>

                {/* Premium features: locked for others */}
                <div className="flex items-center justify-between text-xs border-t border-[var(--color-border)]/50 pt-2.5">
                  <div className="space-y-0.5">
                    <p className="font-bold text-[var(--color-text)] flex items-center gap-1">
                      Auto-Cetak Nota
                      {planCode !== "PREMIUM" && <span className="text-[9px] font-extrabold uppercase text-amber-500 bg-amber-500/10 border border-amber-500/20 px-1.5 rounded-md">PREMIUM</span>}
                    </p>
                    <p className="text-[10px] text-[var(--color-text-muted)]">Terbitkan nota otomatis setelah input order</p>
                  </div>
                  <Switch 
                    disabled={planCode !== "PREMIUM"}
                    checked={settings.autoCreateInvoice}
                    onCheckedChange={(checked) => {
                      const next = { ...settings, autoCreateInvoice: checked };
                      setSettings(next);
                      saveHelperSettings(next);
                    }}
                  />
                </div>

                <div className="flex items-center justify-between text-xs">
                  <div className="space-y-0.5">
                    <p className="font-bold text-[var(--color-text)] flex items-center gap-1">
                      Eksekusi Makro (&&)
                      {planCode !== "PREMIUM" && <span className="text-[9px] font-extrabold uppercase text-amber-500 bg-amber-500/10 border border-amber-500/20 px-1.5 rounded-md">PREMIUM</span>}
                    </p>
                    <p className="text-[10px] text-[var(--color-text-muted)]">Gabung multi-perintah dalam satu input</p>
                  </div>
                  <Switch 
                    disabled={planCode !== "PREMIUM"}
                    checked={settings.macrosEnabled}
                    onCheckedChange={(checked) => {
                      const next = { ...settings, macrosEnabled: checked };
                      setSettings(next);
                      saveHelperSettings(next);
                    }}
                  />
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Examples Card */}
          <Card className="border-[var(--color-border)] shadow-none">
            <CardBody className="p-5 space-y-4">
              <div className="flex items-center gap-2 border-b border-[var(--color-border)] pb-2.5">
                <HelpCircle className="h-4.5 w-4.5 text-[var(--color-primary)]" />
                <h3 className="text-sm font-extrabold text-[var(--color-text)] uppercase tracking-wider">Cheat Sheet Contoh</h3>
              </div>

              <div className="space-y-3">
                {filteredCommands.map((item) => (
                  <div
                    key={item.cmd}
                    className="p-3.5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] space-y-1.5"
                  >
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-primary)]">{item.label}</span>
                    <button
                      onClick={() => setCommand(item.cmd)}
                      className="block text-left w-full text-xs font-mono text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] bg-white/70 hover:bg-white border border-[var(--color-border)] px-2 py-1.5 rounded-xl transition"
                    >
                      {item.cmd}
                    </button>
                    <span className="text-[10px] text-[var(--color-text-muted)] block">{item.desc}</span>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>

          {/* Sessional logs */}
          {historyLogs.length > 0 && (
            <Card className="border-[var(--color-border)] shadow-none">
              <CardBody className="p-5 space-y-3">
                <div className="flex items-center gap-2 border-b border-[var(--color-border)] pb-2.5">
                  <Undo className="h-4 w-4 text-[var(--color-primary)]" />
                  <h3 className="text-sm font-extrabold text-[var(--color-text)] uppercase tracking-wider">Riwayat Sesi Ini</h3>
                </div>

                <div className="space-y-2.5 max-h-48 overflow-y-auto no-scrollbar">
                  {historyLogs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-start justify-between gap-3 text-xs text-[var(--color-text-secondary)] border-b border-[var(--color-border)]/40 pb-2"
                    >
                      <div className="flex items-start gap-2 min-w-0">
                        <span className="text-emerald-600 font-bold shrink-0">✓</span>
                        <span className="truncate">{log.text}</span>
                        {log.whatsappUrl && (
                          <a
                            href={log.whatsappUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[9px] transition shrink-0 ml-1.5"
                          >
                            <Send className="h-2 w-2" />
                            Kirim WA
                          </a>
                        )}
                      </div>
                      <span className="text-[9px] font-mono text-[var(--color-text-muted)] shrink-0">{log.timestamp}</span>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          )}
        </div>
      </section>
    </main>
  );
}
