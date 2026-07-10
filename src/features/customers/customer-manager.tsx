"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, PencilLine, RotateCcw, Users, Sparkles, Phone, Calendar, MessageSquare, Plus } from "lucide-react";
import { FilterChipGroup } from "@/components/ui/filter-chip";
import { Card, CardBody } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button, LinkButton } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast-provider";
import { CUSTOMER_FILTER_OPTIONS, CUSTOMER_STATUS_LABELS } from "@/lib/constants/customer";
import { formatDateTime, formatPhoneNumber } from "@/lib/format";
import { WhatsAppButton } from "@/components/shared/whatsapp-button";
import { CustomerStatusBadge } from "@/components/shared/status-badge";
import { PageHeader } from "@/components/shared/page-header";
import { ROUTES } from "@/lib/routes";
import type { Customer, CustomerStatus } from "@/types/customer";
import { useAppData } from "@/components/providers/app-data-provider";
import { useCustomers } from "@/hooks/use-customers";
import { isValidPhoneNumber, normalizePhoneNumber, parseWhatsAppChatText } from "@/lib/validation";
import { Pagination } from "@/components/ui/pagination";
import { Sheet } from "@/components/ui/sheet";
import { cn } from "@/lib/cn";

type FilterValue = "ALL" | CustomerStatus;

const defaultForm = {
  name: "",
  whatsappNumber: "",
  status: "NEW" as CustomerStatus,
  source: "",
  notes: "",
};

const CUSTOMER_PAGE_SIZE = 6;

export function CustomerManager() {
  const toast = useToast();
  const { canCreateCustomer, currentBusinessUsage, readOnlyReason } = useAppData();
  const { customers, createCustomer, updateCustomer } = useCustomers();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterValue>("ALL");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [chatPasteText, setChatPasteText] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);

  const isDuplicatePhone = useMemo(() => {
    const normalized = normalizePhoneNumber(form.whatsappNumber);
    if (!normalized || normalized.length < 9) return null;
    return customers.find(
      (c) => normalizePhoneNumber(c.whatsappNumber) === normalized && c.id !== editingId
    );
  }, [customers, form.whatsappNumber, editingId]);

  function handleChatPasteChange(text: string) {
    setChatPasteText(text);
    const parsed = parseWhatsAppChatText(text);
    setForm((current) => ({
      ...current,
      name: parsed.name || current.name,
      whatsappNumber: parsed.phone || current.whatsappNumber,
      notes: parsed.address ? `Alamat: ${parsed.address}\n${current.notes}`.trim() : current.notes,
    }));
  }

  const filteredCustomers = useMemo(() => {
    return customers.filter((customer) => {
      const matchesQuery =
        !query.trim() ||
        customer.name.toLowerCase().includes(query.toLowerCase()) ||
        customer.whatsappNumber.includes(query) ||
        (customer.source ?? "").toLowerCase().includes(query.toLowerCase());

      const matchesFilter = filter === "ALL" || customer.status === filter;

      return matchesQuery && matchesFilter;
    });
  }, [customers, filter, query]);
  const totalPages = Math.max(1, Math.ceil(filteredCustomers.length / CUSTOMER_PAGE_SIZE));
  const paginatedCustomers = useMemo(() => {
    const startIndex = (currentPage - 1) * CUSTOMER_PAGE_SIZE;
    return filteredCustomers.slice(startIndex, startIndex + CUSTOMER_PAGE_SIZE);
  }, [currentPage, filteredCustomers]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filter, query]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  function resetForm() {
    setEditingId(null);
    setForm(defaultForm);
    setError("");
    setChatPasteText("");
  }

  function handleCreateNew() {
    resetForm();
    setIsFormOpen(true);
  }

  function startEdit(customer: Customer) {
    setEditingId(customer.id);
    setForm({
      name: customer.name,
      whatsappNumber: customer.whatsappNumber,
      status: customer.status,
      source: customer.source ?? "",
      notes: customer.notes ?? "",
    });
    setError("");
    setIsFormOpen(true);
  }

  async function handleSubmit() {
    if (!form.name.trim() || !form.whatsappNumber.trim()) {
      setError("Nama customer dan nomor WhatsApp wajib diisi.");
      return;
    }

    if (!isValidPhoneNumber(form.whatsappNumber)) {
      setError("Nomor WhatsApp harus 9-15 digit angka.");
      return;
    }

    setError("");
    setIsSubmitting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 250));

      if (editingId) {
        await updateCustomer(editingId, {
          name: form.name.trim(),
          whatsappNumber: normalizePhoneNumber(form.whatsappNumber),
          status: form.status,
          source: form.source.trim() || undefined,
          notes: form.notes.trim() || undefined,
        });
        toast.success("Customer diperbarui");
        resetForm();
        setIsFormOpen(false);
        return;
      }

      await createCustomer({
        name: form.name.trim(),
        whatsappNumber: normalizePhoneNumber(form.whatsappNumber),
        status: form.status,
        source: form.source.trim() || undefined,
        notes: form.notes.trim() || undefined,
      });
      toast.success("Customer berhasil ditambahkan!");
      resetForm();
      setIsFormOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan customer.");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Helpers for Avatar
  function getInitials(name: string) {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 0 || !parts[0]) return "?";
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  function getAvatarGradient(name: string) {
    const code = name.charCodeAt(0) % 4;
    if (code === 0) return "from-blue-400 to-indigo-600";
    if (code === 1) return "from-emerald-400 to-teal-600";
    if (code === 2) return "from-amber-400 to-orange-600";
    return "from-pink-400 to-rose-600";
  }

  return (
    <main className="page-enter space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      {/* SECTION 1: HERO HEADER */}
      <PageHeader
        variant="hero"
        title="CRM & Manajemen Pelanggan"
        description="Kelola kontak, rekam riwayat interaksi, dan identifikasi pelanggan loyal (CRM). Semua pelanggan yang tersimpan bisa ditelepon atau dikirimi template WhatsApp dalam 1 klik."
        badge={
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.08] px-3.5 py-1 text-xs font-bold tracking-wider text-[var(--color-gold-300)] border border-white/[0.1] backdrop-blur-md uppercase">
            <Users className="h-3.5 w-3.5 text-[var(--color-accent)] animate-pulse" />
            Database Pelanggan
          </span>
        }
        action={
          <div className="flex flex-wrap items-center gap-3 xl:shrink-0">
            <Badge tone="info" className="bg-white/10 text-white border-white/20 px-4 py-1.5 text-xs font-bold h-10 flex items-center">
              {customers.length} Terdaftar
            </Badge>
            <Button
              type="button"
              variant="secondary"
              onClick={handleCreateNew}
              disabled={!canCreateCustomer}
              className="shadow-sm font-bold"
            >
              <Plus className="mr-2 h-5 w-5" />
              Tambah Pelanggan
            </Button>
          </div>
        }
      />

      {/* SECTION 2: SEARCH & STATS */}
      <section className="animate-fade-up-delay-1">
        <Card className="border-[var(--color-border)] shadow-none">
          <CardBody className="space-y-5 p-5">
            <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
              {/* Search & Filters */}
              <div className="space-y-4">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-muted)]" />
                  <Input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Cari nama pelanggan, nomor WA, atau sumber..."
                    className="pl-9"
                  />
                </div>
                <div>
                  <p className="mb-2 block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">Filter Status Pelanggan</p>
                  <FilterChipGroup
                    options={CUSTOMER_FILTER_OPTIONS}
                    value={filter}
                    onChange={(v) => setFilter(v as FilterValue)}
                    size="sm"
                  />
                </div>
              </div>

              {/* Status Summary Stats */}
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-4 flex flex-col justify-between">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Baru</p>
                  <p className="mt-1 text-2xl font-black text-[var(--color-text)] tracking-tight">
                    {customers.filter((customer) => customer.status === "NEW").length}
                  </p>
                  <p className="text-[9px] text-[var(--color-text-muted)] font-medium">Customer baru</p>
                </div>
                <div className="rounded-2xl border border-[var(--color-warning-border)] bg-[var(--color-warning-surface)] p-4 flex flex-col justify-between">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-warning-text)]">Follow-Up</p>
                  <p className="mt-1 text-2xl font-black text-[var(--color-text)] tracking-tight">
                    {customers.filter((customer) => customer.status === "NEED_FOLLOW_UP").length}
                  </p>
                  <p className="text-[9px] text-[var(--color-warning-text)] font-semibold">Segera hubungi</p>
                </div>
                <div className="rounded-2xl border border-[var(--color-success-border)] bg-[var(--color-success-surface)] p-4 flex flex-col justify-between">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-success-text)]">Selesai</p>
                  <p className="mt-1 text-2xl font-black text-[var(--color-text)] tracking-tight">
                    {customers.filter((customer) => customer.status === "DONE").length}
                  </p>
                  <p className="text-[9px] text-[var(--color-success-text)] font-semibold">Order beres</p>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      </section>

      {/* SECTION 4: CUSTOMERS CRM LIST */}
      <section className="space-y-3 animate-fade-up-delay-3">
        {paginatedCustomers.length ? (
          paginatedCustomers.map((customer) => {
            // Color indicators and left borders for statuses
            let leftBorderStripe = "border-l-4 border-l-[var(--color-primary)]";
            let hoverGlow = "hover:border-[var(--color-primary-border)] hover:shadow-[0_0_12px_rgba(55,88,145,0.08)]";
            if (customer.status === "NEED_FOLLOW_UP") {
              leftBorderStripe = "border-l-4 border-l-[var(--color-warning)]";
              hoverGlow = "hover:border-[var(--color-warning-border)] hover:shadow-[0_0_12px_rgba(218,159,78,0.08)]";
            } else if (customer.status === "DONE") {
              leftBorderStripe = "border-l-4 border-l-[var(--color-success)]";
              hoverGlow = "hover:border-[var(--color-success-border)] hover:shadow-[0_0_12px_rgba(30,122,82,0.08)]";
            }

            return (
              <Card key={customer.id} className={cn("transition-all duration-300 hover:-translate-y-0.5 border-[var(--color-border)] shadow-none", leftBorderStripe, hoverGlow)}>
                <CardBody className="p-5">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    {/* Left: Avatar & Text details */}
                    <div className="flex items-start gap-4 min-w-0 flex-1">
                      {/* Avatar Circle with initials */}
                      <div className={cn(
                        "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-white text-xs font-black shadow-sm select-none border border-white/20",
                        getAvatarGradient(customer.name)
                      )}>
                        {getInitials(customer.name)}
                      </div>

                      {/* Name & Metadata */}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-bold text-[var(--color-text)] tracking-tight truncate">{customer.name}</h3>
                          <CustomerStatusBadge status={customer.status} />
                        </div>
                        
                        <div className="flex items-center gap-1.5 mt-1.5 text-xs text-[var(--color-text-secondary)] font-medium">
                          <Phone className="h-3.5 w-3.5 text-[var(--color-text-muted)]" />
                          <span>{formatPhoneNumber(customer.whatsappNumber)}</span>
                        </div>

                        {/* Metadata Grid */}
                        <div className="mt-4 grid gap-3 text-xs text-[var(--color-text-secondary)] sm:grid-cols-2 lg:grid-cols-4 border-t border-[var(--color-border)]/40 pt-3">
                          <div className="space-y-0.5">
                            <span className="block text-[9px] font-extrabold uppercase tracking-wider text-[var(--color-text-muted)]">Sumber</span>
                            <p className="font-semibold text-[var(--color-text)]">{customer.source ?? "-"}</p>
                          </div>
                          <div className="space-y-0.5">
                            <span className="block text-[9px] font-extrabold uppercase tracking-wider text-[var(--color-text-muted)]">Interaksi Terakhir</span>
                            <p className="font-medium text-[var(--color-text)] flex items-center gap-1.5">
                              <Calendar className="h-3.5 w-3.5 text-[var(--color-text-muted)]" />
                              {formatDateTime(customer.lastInteractionAt)}
                            </p>
                          </div>
                          <div className="space-y-0.5 sm:col-span-2">
                            <span className="block text-[9px] font-extrabold uppercase tracking-wider text-[var(--color-text-muted)]">Order Terakhir</span>
                            <p className="font-semibold text-[var(--color-text)] truncate flex items-center gap-1.5">
                              <MessageSquare className="h-3.5 w-3.5 text-[var(--color-text-muted)]" />
                              {customer.lastOrderSummary ?? "-"}
                            </p>
                          </div>
                        </div>

                        {customer.notes && (
                          <div className="mt-3 bg-[var(--color-surface-elevated)] border border-[var(--color-border)]/60 rounded-xl p-3 text-xs leading-relaxed text-[var(--color-text)]">
                            <span className="font-bold text-[var(--color-text-secondary)] block text-[9px] uppercase tracking-wider mb-0.5">Catatan CRM / Alamat:</span>
                            {customer.notes}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex flex-wrap gap-2 md:self-start md:shrink-0">
                      <WhatsAppButton
                        phoneNumber={customer.whatsappNumber}
                        message={`Halo ${customer.name}, saya follow-up dari Rapiin ya.`}
                        label="Chat WA"
                      />
                      <LinkButton
                        href={`${ROUTES.orders}?name=${encodeURIComponent(customer.name)}&phone=${customer.whatsappNumber}`}
                        variant="secondary"
                        className="font-bold border-[var(--color-border)]"
                      >
                        Tambah Order
                      </LinkButton>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => startEdit(customer)}
                        className="font-bold border-[var(--color-border)] flex items-center gap-1.5"
                      >
                        <PencilLine className="h-4 w-4" />
                        Edit
                      </Button>
                    </div>
                  </div>
                </CardBody>
              </Card>
            );
          })
        ) : (
          <Card className="border-[var(--color-border)] shadow-none">
            <CardBody className="p-6 text-sm text-[var(--color-text-secondary)] text-center">
              Belum ada data pelanggan yang sesuai dengan filter pencarian.
            </CardBody>
          </Card>
        )}

        <div className="pt-2">
          <Pagination
            currentPage={currentPage}
            pageSize={CUSTOMER_PAGE_SIZE}
            totalItems={filteredCustomers.length}
            onPageChange={setCurrentPage}
          />
        </div>
      </section>

      {/* FORM SHEET */}
      <Sheet
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingId ? "Edit Profil Pelanggan" : "Tambah Pelanggan Baru"}
        description="Input data pelanggan atau gunakan pintasan isi otomatis."
        className="w-full sm:max-w-xl md:max-w-2xl"
      >
        <div className="space-y-6 pt-4 pb-12 overflow-y-auto">
          {!editingId && !canCreateCustomer ? (
            <p className="mt-2 text-xs font-bold text-[var(--color-warning-text)] bg-[var(--color-warning-surface)] border border-[var(--color-warning-border)] px-3 py-2 rounded-xl">
              ⚠️ {readOnlyReason ?? `Batas kuota pelanggan penuh (${currentBusinessUsage.used}/${currentBusinessUsage.limit}).`}
            </p>
          ) : null}

          {/* WhatsApp Auto-Parser box (Only when creating) */}
          {!editingId && (
            <div className="rounded-2xl border border-dashed border-indigo-200 bg-indigo-50/10 dark:border-indigo-900/60 dark:bg-indigo-950/20 p-4 space-y-2 relative overflow-hidden">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 dark:bg-indigo-900/60 px-2.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
                  <Sparkles className="h-2.5 w-2.5 animate-pulse" />
                  Pintasan Pengisi Otomatis
                </span>
                <p className="text-[10px] text-[var(--color-text-muted)] font-semibold">Salin & Tempel Chat WhatsApp</p>
              </div>
              <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                Tempel format rekapan pemesanan WhatsApp di bawah. Sistem Rapiin akan membaca Nama, Nomor WA, dan Alamat otomatis.
              </p>
              <Textarea
                value={chatPasteText}
                onChange={(event) => handleChatPasteChange(event.target.value)}
                placeholder="Contoh format tempel:&#10;Nama: Budi Luhur&#10;No HP: 08123456789&#10;Alamat: Jl. Sudirman No 12, Jakarta"
                rows={3}
                className="bg-[var(--color-surface)] border-[var(--color-border)] rounded-xl"
              />
              <div className="absolute -right-6 -bottom-6 h-12 w-12 rounded-full bg-indigo-500/[0.01] pointer-events-none" />
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">Nama Pelanggan</span>
              <Input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
            </label>
            <label className="block">
              <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">Nomor WhatsApp</span>
              <Input
                value={form.whatsappNumber}
                onChange={(event) => {
                  event.target.value = event.target.value.replace(/[^\d]/g, "");
                  setForm((current) => ({ ...current, whatsappNumber: event.target.value }));
                }}
                placeholder="Contoh: 08123456789"
              />
              {isDuplicatePhone && (
                <p className="mt-2 text-xs font-medium text-[var(--color-warning-text)] bg-[var(--color-warning-surface)] border border-[var(--color-warning-border)] rounded-xl px-3 py-2 leading-relaxed">
                  ⚠️ Nomor ini sudah terdaftar atas nama pelanggan <strong>{isDuplicatePhone.name}</strong>.
                </p>
              )}
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">Status Pelanggan</span>
              <Select
                value={form.status}
                onValueChange={(value) => setForm((current) => ({ ...current, status: value as CustomerStatus }))}
                options={Object.entries(CUSTOMER_STATUS_LABELS).map(([value, label]) => ({ value, label }))}
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">Sumber Pendaftaran</span>
              <Input
                value={form.source}
                onChange={(event) => setForm((current) => ({ ...current, source: event.target.value }))}
                placeholder="Contoh: WhatsApp, Instagram, Link Bisnis"
              />
            </label>
          </div>

          <label className="block">
            <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">Catatan Pelanggan / Alamat</span>
            <Textarea
              value={form.notes}
              onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
              placeholder="Masukkan detail catatan singkat atau alamat pengiriman pelanggan..."
              rows={2}
            />
          </label>

          {error ? <p className="text-xs font-bold text-[var(--color-danger)]">{error}</p> : null}
          
          <div className="pt-2 flex flex-col gap-2">
            <Button
              type="button"
              isLoading={isSubmitting}
              onClick={() => void handleSubmit()}
              disabled={!editingId && !canCreateCustomer}
              className="w-full shadow-sm font-bold text-sm h-11 rounded-xl"
            >
              {editingId ? "Simpan Perubahan" : "Simpan Pelanggan"}
            </Button>
            {editingId && (
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  resetForm();
                  setIsFormOpen(false);
                }}
                className="w-full h-11 rounded-xl font-bold text-xs"
              >
                <RotateCcw className="h-4 w-4 mr-1.5" />
                Batal Edit
              </Button>
            )}
          </div>
        </div>
      </Sheet>
    </main>
  );
}
