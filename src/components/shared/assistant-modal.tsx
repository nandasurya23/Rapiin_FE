"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
  X,
  Search,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Undo,
  Settings,
  Send
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { TimeSelect } from "@/components/ui/time-select";
import { FormattedNumberInput } from "@/components/ui/formatted-number-input";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/toast-provider";
import { useAppData } from "@/components/providers/app-data-provider";
import { parseAssistantCommand, type ParsedCommandResult } from "@/lib/assistant-parser";
import { ORDER_STATUS_BY_MODE, PAYMENT_STATUS_LABELS } from "@/lib/constants/orders";
import {
  checkDailyCommandLimit,
  incrementDailyCommandUsage,
  getHelperConsoleLimits,
  getHelperSettings,
  saveHelperSettings,
  getDailyCommandUsage,
  type HelperConsoleSettings
} from "@/lib/assistant-limits";
import { ROUTES } from "@/lib/routes";
import { cn } from "@/lib/cn";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

type AssistantModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

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

export function AssistantModal({ isOpen, onClose }: AssistantModalProps) {
  const toast = useToast();
  const router = useRouter();
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
  const [showSettings, setShowSettings] = useState(false);
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
  const modalRef = useRef<HTMLDivElement>(null);

  // Sync settings when planCode changes
  useEffect(() => {
    setSettings(getHelperSettings(planCode));
  }, [planCode]);

  // Sync daily usage initially
  useEffect(() => {
    setDailyUsage(getDailyCommandUsage());
  }, []);

  // Load history logs if enabled
  useEffect(() => {
    if (isOpen && typeof window !== "undefined" && settings.saveHistory) {
      const raw = localStorage.getItem("rapiin_helper_history");
      if (raw) {
        try {
          setHistoryLogs(JSON.parse(raw).slice(0, limits.maxHistoryLogs));
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, [isOpen, settings.saveHistory, limits.maxHistoryLogs]);

  // Save history logs if enabled
  useEffect(() => {
    if (typeof window !== "undefined" && settings.saveHistory && historyLogs.length > 0) {
      localStorage.setItem("rapiin_helper_history", JSON.stringify(historyLogs));
    }
  }, [historyLogs, settings.saveHistory]);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      if (settings.autoFocus) {
        setTimeout(() => inputRef.current?.focus(), 150);
      }
      setError("");
    }
  }, [isOpen, settings.autoFocus]);

  // Command parsing
  const parsed: ParsedCommandResult = useMemo(() => {
    return parseAssistantCommand(command, customers, orders, business.mode);
  }, [command, customers, orders, business.mode]);

  // Sync parsed data to draftState for manual tweaking
  useEffect(() => {
    if (parsed.type !== "UNKNOWN") {
      setDraftData(parsed.data);
      setError("");
    } else {
      setDraftData({});
    }
  }, [parsed.type, parsed.data]);

  // Search matches for SEARCH command
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

  // Handle direct execution
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

  // Keyboard shortcut listener inside modal
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!isOpen) return;
      if (e.key === "Escape") {
        handleClose();
      }
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handleExecute();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, parsed, draftData]);

  function handleClose() {
    setCommand("");
    setError("");
    onClose();
  }

  if (!isOpen) return null;

  const confidenceColor = 
    parsed.confidence === "HIGH" ? "text-emerald-400 bg-emerald-950/40 border-emerald-900/50" : 
    parsed.confidence === "MEDIUM" ? "text-amber-400 bg-amber-950/40 border-amber-900/50" : 
    "text-rose-400 bg-rose-950/40 border-rose-900/50";

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-start justify-center p-4 pt-16 sm:pt-24 bg-slate-950/80 backdrop-blur-md transition-all"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div
        ref={modalRef}
        className={cn(
          "w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col rounded-3xl",
          "bg-gradient-to-br from-[#0c1d3b] via-[#122a57] to-[#09152b] text-white",
          "border border-white/[0.08] shadow-[var(--shadow-modal)]"
        )}
      >
        {/* Input Bar */}
        <div className="relative flex items-center border-b border-white/[0.06] px-5 py-4 shrink-0 bg-black/10">
          <Search className="h-5 w-5 text-white/50 mr-3" />
          <input
            ref={inputRef}
            type="text"
            className="w-full bg-transparent text-base text-white placeholder-white/35 outline-none"
            placeholder="Ketik instruksi operasional di sini..."
            value={command}
            onChange={(e) => setCommand(e.target.value)}
          />
          {command ? (
            <button
              onClick={() => setCommand("")}
              className="p-1 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition mr-1"
            >
              <X className="h-4 w-4" />
            </button>
          ) : (
            <div className="flex items-center gap-1.5 mr-1 select-none">
              <kbd className="hidden sm:inline-flex items-center rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-[9px] font-mono text-white/50">ESC</kbd>
            </div>
          )}
          <button
            onClick={() => setShowSettings(!showSettings)}
            title="Pengaturan Konsol"
            className={cn(
              "p-1.5 rounded-xl border transition",
              showSettings 
                ? "bg-amber-400 border-amber-400 text-slate-900 font-bold" 
                : "bg-white/5 border-white/10 text-white/60 hover:text-white hover:bg-white/10"
            )}
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>

        {/* Content Workspace */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="rounded-2xl bg-rose-950/50 border border-rose-800/30 p-4 text-xs text-rose-300 flex items-start gap-3">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {showSettings ? (
            <div className="space-y-5 py-2">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                <div>
                  <h4 className="text-sm font-bold text-white">Pengaturan Asisten Pintar</h4>
                  <p className="text-[11px] text-white/40">Sesuaikan perilaku input cepat Anda</p>
                </div>
                <Button 
                  type="button" 
                  variant="secondary"
                  onClick={() => setShowSettings(false)}
                  className="rounded-xl border-white/10 text-white bg-white/5 hover:bg-white/10 text-xs font-bold py-1.5 px-3"
                >
                  Kembali &rarr;
                </Button>
              </div>

              {/* Toggles */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="space-y-0.5">
                    <p className="font-semibold text-white">Autofocus Input</p>
                    <p className="text-[10px] text-white/40">Fokus otomatis saat konsol dibuka</p>
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
                    <p className="font-semibold text-white">Simpan Riwayat Sesi</p>
                    <p className="text-[10px] text-white/40">Pertahankan riwayat perintah sukses</p>
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

                {/* Premium features */}
                <div className="flex items-center justify-between text-xs border-t border-white/[0.06] pt-4">
                  <div className="space-y-0.5">
                    <p className="font-bold text-white flex items-center gap-1.5">
                      Auto-Cetak Nota
                      {planCode !== "PREMIUM" && <span className="text-[9px] font-extrabold uppercase text-amber-500 bg-amber-500/10 border border-amber-500/20 px-1.5 rounded-md">PREMIUM</span>}
                    </p>
                    <p className="text-[10px] text-white/40 font-medium">Terbitkan nota tagihan otomatis setelah input order</p>
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
                    <p className="font-bold text-white flex items-center gap-1.5">
                      Eksekusi Makro (&&)
                      {planCode !== "PREMIUM" && <span className="text-[9px] font-extrabold uppercase text-amber-500 bg-amber-500/10 border border-amber-500/20 px-1.5 rounded-md">PREMIUM</span>}
                    </p>
                    <p className="text-[10px] text-white/40 font-medium">Gabung beberapa kalimat perintah memakai simbol &apos;&amp;&amp;&apos;</p>
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

              {/* Plan limits info */}
              <div className="rounded-2xl border border-white/[0.06] bg-black/10 p-4 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-white/50">Plan Aktif Anda:</span>
                  <span className="font-extrabold uppercase tracking-wider text-amber-400">{limits.planLabel}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/50">Kuota Perintah Harian:</span>
                  <span className="font-bold">{planCode === "PREMIUM" ? "Unlimited" : `${dailyUsage.count} / ${limits.maxDailyCommands}`}</span>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Case 1: Empty Command Bar (Display Helper suggestions) */}
              {!command && (
                <div className="space-y-5">
                  {/* Cara Penggunaan Singkat */}
                  <div className="rounded-2xl border border-white/[0.04] bg-white/[0.02] p-4 space-y-2.5 text-xs text-white/70">
                    <h4 className="font-extrabold text-amber-300 flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
                      💡 PANDUAN CEPAT ADMIN & OWNER
                    </h4>
                    <div className="grid gap-3 sm:grid-cols-3 text-[10px] leading-relaxed text-white/50">
                      <p><strong className="text-white">1. Ketik kalimat</strong> instruksi operasional di kolom pencarian atas.</p>
                      <p><strong className="text-white">2. Cek deteksi</strong> draf formulir data lokal yang muncul di layar.</p>
                      <p><strong className="text-white">3. Klik Simpan</strong> (atau tekan Ctrl+Enter) untuk merekam data ke database.</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-white/40 flex items-center gap-1.5">
                      <HelpCircle className="h-3.5 w-3.5" />
                      Contoh Perintah yang Bisa Anda Ketik
                    </h4>
                    <p className="text-[11px] text-white/50 mt-1">
                      Asisten Pintar mencocokkan kata kunci secara lokal (100% offline & bukan AI chatbot) untuk mempercepat entri data Anda.
                    </p>
                  </div>

                  <div className="grid gap-2">
                    {filteredCommands.map((item) => (
                      <button
                        key={item.cmd}
                        onClick={() => setCommand(item.cmd)}
                        className="group text-left p-3.5 rounded-2xl border border-white/[0.04] bg-white/[0.02] hover:border-amber-400/20 hover:bg-white/[0.05] transition-all flex items-center justify-between gap-4"
                      >
                        <div className="space-y-1 min-w-0">
                          <span className="text-xs font-bold text-amber-300 block">{item.label}</span>
                          <code className="text-xs font-mono text-white/70 block truncate group-hover:text-white transition">
                            &quot;{item.cmd}&quot;
                          </code>
                          <span className="text-[10px] text-white/40 block">{item.desc}</span>
                        </div>
                        <span className="text-xs font-bold text-white/30 group-hover:text-amber-400 group-hover:translate-x-0.5 transition shrink-0">
                          Gunakan &rarr;
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Case 2: Custom Forms depending on command result preview */}
              {command && parsed.type !== "SEARCH" && parsed.type !== "UNKNOWN" && (
                <div className="space-y-5">
                  <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-white/40 flex items-center gap-2">
                      <span className={cn(
                        "h-2 w-2 rounded-full",
                        parsed.confidence === "HIGH" ? "bg-emerald-500" :
                        parsed.confidence === "MEDIUM" ? "bg-amber-500" : "bg-rose-500"
                      )} />
                      Review Perintah Deteksi
                    </span>
                    <span className={cn(
                      "text-[9px] font-extrabold uppercase border px-2 py-0.5 rounded-full select-none",
                      confidenceColor
                    )}>
                      Aksi: {parsed.suggestedActionLabel} ({parsed.confidence})
                    </span>
                  </div>

                  <div className="space-y-4 max-h-[42vh] overflow-y-auto pr-1 no-scrollbar">
                    {/* Expose explanation */}
                    <p className="text-xs text-white/80 leading-relaxed bg-white/[0.02] border border-white/[0.04] p-3.5 rounded-2xl">
                      💡 {parsed.explanation}
                    </p>

                    {/* UPDATE_ORDER_PAYMENT Form */}
                    {parsed.type === "UPDATE_ORDER_PAYMENT" && draftData && (
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-white/40">Status Pembayaran</label>
                          <Select
                            value={draftData.paymentStatus || "UNPAID"}
                            onValueChange={(val) => setDraftData({ ...draftData, paymentStatus: val })}
                            className="bg-white/5 border-white/10 text-white rounded-xl h-9 text-xs"
                            options={Object.entries(PAYMENT_STATUS_LABELS).map(([k, v]) => ({ value: k, label: v }))}
                          />
                        </div>

                        {draftData.paymentStatus === "DP_PAID" ? (
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-white/40">Jumlah DP (Rp)</label>
                            <FormattedNumberInput
                              value={String(draftData.dpAmount || "")}
                              onValueChange={(val) => setDraftData({ ...draftData, dpAmount: val })}
                              className="bg-white/5 border-white/10 text-white rounded-xl h-9 text-xs"
                            />
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-white/40">Total Pembayaran (Rp)</label>
                            <FormattedNumberInput
                              value={String(draftData.totalAmount || "")}
                              onValueChange={(val) => setDraftData({ ...draftData, totalAmount: val })}
                              className="bg-white/5 border-white/10 text-white rounded-xl h-9 text-xs"
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {/* UPDATE_ORDER_STATUS Form */}
                    {parsed.type === "UPDATE_ORDER_STATUS" && draftData && (
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-white/40">Status Baru</label>
                          <Select
                            value={draftData.status || ""}
                            onValueChange={(val) => setDraftData({ ...draftData, status: val })}
                            className="bg-white/5 border-white/10 text-white rounded-xl h-9 text-xs"
                            options={ORDER_STATUS_BY_MODE[business.mode].map((o) => ({ value: o.value, label: o.label }))}
                          />
                        </div>
                      </div>
                    )}

                    {/* CREATE_CUSTOMER Form */}
                    {parsed.type === "CREATE_CUSTOMER" && draftData && (
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-white/40">Nama Lengkap</label>
                          <Input
                            value={draftData.name || ""}
                            onChange={(e) => setDraftData({ ...draftData, name: e.target.value })}
                            className="bg-white/5 border-white/10 text-white rounded-xl h-9 text-xs focus:bg-white/[0.08]"
                            placeholder="Nama customer"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-white/40">No WhatsApp</label>
                          <Input
                            value={draftData.whatsappNumber || ""}
                            onChange={(e) => setDraftData({ ...draftData, whatsappNumber: e.target.value })}
                            className="bg-white/5 border-white/10 text-white rounded-xl h-9 text-xs focus:bg-white/[0.08]"
                            placeholder="Contoh: 0812..."
                          />
                        </div>
                      </div>
                    )}

                    {/* CREATE_ORDER Form */}
                    {parsed.type === "CREATE_ORDER" && draftData && (
                      <div className="grid gap-4 text-xs">
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-white/40">Nama Pelanggan</label>
                            <Input
                              value={draftData.customerName || ""}
                              onChange={(e) => setDraftData({ ...draftData, customerName: e.target.value })}
                              className="bg-white/5 border-white/10 text-white rounded-xl h-9 text-xs"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-white/40">No WhatsApp</label>
                            <Input
                              value={draftData.whatsappNumber || ""}
                              onChange={(e) => setDraftData({ ...draftData, whatsappNumber: e.target.value })}
                              className="bg-white/5 border-white/10 text-white rounded-xl h-9 text-xs"
                              placeholder="08..."
                            />
                          </div>

                          {/* Customer Linker */}
                          <div className="sm:col-span-2 space-y-2">
                            {hasExactMatch ? (
                              <p className="text-[10px] text-emerald-400 font-bold">✓ Terhubung ke Customer terdaftar di database</p>
                            ) : (
                              <p className="text-[10px] text-amber-400/80 font-medium">✦ Customer baru (akan didaftarkan otomatis)</p>
                            )}

                            {matchingCustomers.length > 0 && !hasExactMatch && (
                              <div className="space-y-1.5 p-3 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                                <p className="text-[10px] font-extrabold text-white/50 uppercase tracking-wider">Hubungkan dengan Customer Terdaftar:</p>
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
                                      className="px-2.5 py-1 text-[10px] font-semibold rounded-xl border bg-white/5 border-white/10 hover:border-white/20 text-white/70 hover:text-white transition"
                                    >
                                      {c.name} ({c.whatsappNumber})
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-white/40">Judul Order / Layanan</label>
                            <Input
                              value={draftData.title || ""}
                              onChange={(e) => setDraftData({ ...draftData, title: e.target.value })}
                              className="bg-white/5 border-white/10 text-white rounded-xl h-9 text-xs"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-white/40">Tipe Operasional</label>
                            <Select
                              value={draftData.mode || "SERVICE"}
                              onValueChange={(val) => setDraftData({ ...draftData, mode: val })}
                              className="bg-white/5 border-white/10 text-white rounded-xl h-9 text-xs"
                              options={[
                                { value: "SERVICE", label: "Booking Slot / Jasa" },
                                { value: "PRODUCT", label: "Penjualan Barang / Produk" }
                              ]}
                            />
                          </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-white/40">Tanggal Pelaksanaan</label>
                            <DatePicker
                              value={draftData.scheduledDate || ""}
                              onValueChange={(val) => setDraftData({ ...draftData, scheduledDate: val })}
                              className="bg-white/5 border-white/10 text-white rounded-xl h-9 text-xs"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-white/40">Jam Pelaksanaan</label>
                            <TimeSelect
                              value={draftData.scheduledTime || ""}
                              onValueChange={(val) => setDraftData({ ...draftData, scheduledTime: val })}
                            />
                          </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-white/40">Status Pembayaran</label>
                            <Select
                              value={draftData.paymentStatus || "UNPAID"}
                              onValueChange={(val) => setDraftData({ ...draftData, paymentStatus: val })}
                              className="bg-white/5 border-white/10 text-white rounded-xl h-9 text-xs"
                              options={Object.entries(PAYMENT_STATUS_LABELS).map(([k, v]) => ({ value: k, label: v }))}
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-white/40">Total Pembayaran (Rp)</label>
                            <FormattedNumberInput
                              value={String(draftData.totalAmount || "")}
                              onValueChange={(val) => setDraftData({ ...draftData, totalAmount: val })}
                              className="bg-white/5 border-white/10 text-white rounded-xl h-9 text-xs"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-white/40">DP masuk (Rp)</label>
                            <FormattedNumberInput
                              value={String(draftData.dpAmount || "")}
                              onValueChange={(val) => setDraftData({ ...draftData, dpAmount: val })}
                              disabled={draftData.paymentStatus !== "DP_PAID"}
                              className="bg-white/5 border-white/10 text-white rounded-xl h-9 text-xs disabled:opacity-30"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-white/40">Catatan Tambahan</label>
                          <textarea
                            value={draftData.notes || ""}
                            onChange={(e) => setDraftData({ ...draftData, notes: e.target.value })}
                            rows={2}
                            placeholder="Catatan pengerjaan..."
                            className="w-full bg-white/5 border border-white/10 text-white rounded-2xl p-3 text-xs focus:bg-white/[0.08] focus:border-white/20 outline-none transition"
                          />
                        </div>
                      </div>
                    )}

                    {/* CREATE_INVOICE Form */}
                    {parsed.type === "CREATE_INVOICE" && draftData && (
                      <div className="rounded-2xl border border-white/[0.06] bg-black/10 p-4 text-xs space-y-1.5">
                        <div className="flex justify-between py-1 border-b border-white/[0.04]">
                          <span className="text-white/40">Customer Penerima:</span>
                          <span className="font-bold">{draftData.customerName}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-white/[0.04]">
                          <span className="text-white/40">Pekerjaan / Item:</span>
                          <span>{draftData.title}</span>
                        </div>
                        <div className="flex justify-between py-1">
                          <span className="text-white/40">Nilai Invoice:</span>
                          <span className="text-amber-300 font-extrabold">Rp {(draftData.totalAmount || 0).toLocaleString("id-ID")}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Plan validation alert */}
                  {!isActionAllowed && (
                    <div className="rounded-2xl bg-amber-500/10 border border-amber-500/20 p-4 text-xs text-amber-300 space-y-2">
                      <p className="font-bold flex items-center gap-1.5">
                        <AlertCircle className="h-4 w-4" />
                        Aksi Terkunci — Paket {limits.planLabel}
                      </p>
                      <p className="text-[11px] text-white/70">
                        Aksi untuk perintah <strong>{parsed.suggestedActionLabel}</strong> tidak diaktifkan pada paket gratis Anda. Silakan hubungi admin atau buka menu plan untuk melakukan upgrade.
                      </p>
                    </div>
                  )}

                  {/* Confirm / Execute Area */}
                  <div className="flex justify-end gap-3 pt-2">
                    <Button
                      type="button"
                      variant="secondary"
                      className="bg-white/5 border-white/10 text-white hover:bg-white/10 rounded-xl font-bold py-2.5 px-4 text-xs"
                      onClick={handleClose}
                    >
                      Batal
                    </Button>
                    <Button
                      type="button"
                      isLoading={isExecuting}
                      onClick={handleExecute}
                      disabled={!isActionAllowed}
                      className="bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-900 font-extrabold rounded-xl py-2.5 px-5 text-xs shadow-md shadow-amber-500/10 flex items-center gap-1.5 border-none disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      {parsed.suggestedActionLabel}
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Case 3: SEARCH Command list */}
          {command && parsed.type === "SEARCH" && (
            <div className="space-y-4">
              <div className="border-b border-white/[0.06] pb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-white/40">
                  Hasil Pencarian Lokasi (&quot;{parsed.data.query}&quot;)
                </span>
              </div>

              {searchResults.customers.length === 0 && searchResults.orders.length === 0 ? (
                <div className="py-8 text-center text-xs text-white/40 space-y-2">
                  <AlertCircle className="h-8 w-8 mx-auto text-white/20" />
                  <p>Tidak ditemukan data customer atau order yang cocok.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Customers matching */}
                  {searchResults.customers.length > 0 && (
                    <div className="space-y-2">
                      <h5 className="text-[10px] font-bold uppercase tracking-wider text-amber-300/80">Customer ({searchResults.customers.length})</h5>
                      <div className="grid gap-1.5">
                        {searchResults.customers.map((c) => (
                          <button
                            key={c.id}
                            onClick={() => {
                              handleClose();
                              router.push(ROUTES.customers);
                            }}
                            className="text-left px-4 py-3 rounded-2xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.05] transition flex items-center justify-between text-xs"
                          >
                            <div>
                              <p className="font-bold">{c.name}</p>
                              <p className="text-[10px] text-white/40 mt-0.5">WA: {c.whatsappNumber}</p>
                            </div>
                            <span className="text-[10px] font-semibold text-amber-400">Buka Modul Customer &rarr;</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Orders matching */}
                  {searchResults.orders.length > 0 && (
                    <div className="space-y-2">
                      <h5 className="text-[10px] font-bold uppercase tracking-wider text-amber-300/80">Orders / Booking ({searchResults.orders.length})</h5>
                      <div className="grid gap-1.5">
                        {searchResults.orders.map((o) => (
                          <button
                            key={o.id}
                            onClick={() => {
                              handleClose();
                              router.push(`${ROUTES.orders}?id=${o.id}`);
                            }}
                            className="text-left px-4 py-3 rounded-2xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.05] transition flex items-center justify-between text-xs"
                          >
                            <div>
                              <p className="font-bold">{o.title}</p>
                              <p className="text-[10px] text-white/40 mt-0.5">Customer: {o.customerName} · Nilai: Rp {(o.totalAmount || 0).toLocaleString("id-ID")}</p>
                            </div>
                            <span className="text-[10px] font-semibold text-amber-400">Lihat Detail Order &rarr;</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action History / logs (footer) */}
        {historyLogs.length > 0 && (
          <div className="border-t border-white/[0.06] bg-black/20 p-4 shrink-0">
            <h5 className="text-[10px] font-bold uppercase tracking-wider text-white/30 flex items-center gap-1.5 mb-2">
              <Undo className="h-3 w-3" /> Riwayat Aksi Sesi Ini
            </h5>
             <div className="space-y-1.5 max-h-20 overflow-y-auto no-scrollbar">
               {historyLogs.map((log) => (
                 <div key={log.id} className="flex justify-between items-center gap-3 text-[11px] text-white/60">
                   <div className="flex items-center gap-1.5 min-w-0">
                     <span className="truncate">{log.text}</span>
                     {log.whatsappUrl && (
                       <a
                         href={log.whatsappUrl}
                         target="_blank"
                         rel="noopener noreferrer"
                         className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[9px] transition shrink-0"
                       >
                         <Send className="h-2 w-2" />
                         Kirim WA
                       </a>
                     )}
                   </div>
                   <span className="text-[9px] font-mono text-white/30 shrink-0">{log.timestamp}</span>
                 </div>
               ))}
             </div>
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
