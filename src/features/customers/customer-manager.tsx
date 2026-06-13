"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, PencilLine, RotateCcw } from "lucide-react";
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
import { ROUTES } from "@/lib/routes";
import type { Customer, CustomerStatus } from "@/types/customer";
import { useAppData } from "@/components/providers/app-data-provider";
import { isValidPhoneNumber, normalizePhoneNumber } from "@/lib/validation";
import { Pagination } from "@/components/ui/pagination";

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
  const { customers, createCustomer, updateCustomer, canCreateCustomer, currentBusinessUsage, readOnlyReason } = useAppData();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterValue>("ALL");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

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
        updateCustomer(editingId, {
          name: form.name.trim(),
          whatsappNumber: normalizePhoneNumber(form.whatsappNumber),
          status: form.status,
          source: form.source.trim() || undefined,
          notes: form.notes.trim() || undefined,
        });
        toast.success("Customer diperbarui");
        resetForm();
        return;
      }

      try {
        createCustomer({
          name: form.name.trim(),
          whatsappNumber: normalizePhoneNumber(form.whatsappNumber),
          status: form.status,
          source: form.source.trim() || undefined,
          notes: form.notes.trim() || undefined,
        });
        toast.success("Customer berhasil ditambahkan");
        resetForm();
      } catch (submitError) {
        setError(submitError instanceof Error ? submitError.message : "Customer belum bisa ditambahkan.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="page-enter space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <section>
        <Card>
          <CardBody className="space-y-5 p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-text-primary">Customer</h1>
                <p className="mt-1 text-sm text-text-secondary">
                  Simpan customer supaya tidak hilang di chat WhatsApp.
                </p>
              </div>
              <Badge tone="info">{filteredCustomers.length} customer</Badge>
            </div>

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(280px,0.9fr)]">
              <div className="space-y-4">
                <label className="relative block">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                  <Input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Cari nama, nomor, atau sumber"
                    className="pl-9"
                  />
                </label>

                <div className="flex flex-wrap gap-2">
                  {CUSTOMER_FILTER_OPTIONS.map((option) => {
                    const active = filter === option.value;

                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setFilter(option.value)}
                        className={`rounded-md border px-3 py-1.5 text-sm font-medium transition ${
                          active ? "border-brand-500 bg-brand-50 text-brand-800" : "border-border bg-surface text-text-secondary hover:bg-muted"
                        }`}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                <div className="rounded-xl border border-border/80 bg-muted/25 px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-text-muted">Total</p>
                  <p className="mt-2 text-2xl font-semibold text-text-primary">{customers.length}</p>
                  <p className="mt-1 text-sm text-text-secondary">Semua customer yang sudah tercatat.</p>
                </div>
                <div className="rounded-xl border border-border/80 bg-muted/25 px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-text-muted">Perlu Follow-Up</p>
                  <p className="mt-2 text-2xl font-semibold text-text-primary">
                    {customers.filter((customer) => customer.status === "NEED_FOLLOW_UP").length}
                  </p>
                  <p className="mt-1 text-sm text-text-secondary">Customer yang perlu segera dihubungi.</p>
                </div>
                <div className="rounded-xl border border-border/80 bg-muted/25 px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-text-muted">Selesai</p>
                  <p className="mt-2 text-2xl font-semibold text-text-primary">
                    {customers.filter((customer) => customer.status === "DONE").length}
                  </p>
                  <p className="mt-1 text-sm text-text-secondary">Customer dengan order yang sudah beres.</p>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      </section>

      <section>
        <Card>
          <CardBody className="space-y-4 p-5 sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-text-primary">{editingId ? "Edit Customer" : "Tambah Customer"}</h2>
                <p className="text-sm text-text-secondary">Input singkat, cukup nama dan nomor WhatsApp.</p>
                {!editingId && !canCreateCustomer ? (
                  <p className="mt-2 text-xs text-amber-700">{readOnlyReason ?? `Limit customer penuh (${currentBusinessUsage.used}/${currentBusinessUsage.limit}).`}</p>
                ) : null}
              </div>
              {editingId ? (
                <button type="button" onClick={resetForm} className="inline-flex items-center gap-2 text-sm font-medium text-text-secondary">
                  <RotateCcw className="h-4 w-4" />
                  Batal edit
                </button>
              ) : null}
            </div>

            <div className="grid gap-3">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-text-primary">Nama customer</span>
                <Input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-text-primary">Nomor WhatsApp</span>
                <Input
                  value={form.whatsappNumber}
                  onChange={(event) => setForm((current) => ({ ...current, whatsappNumber: event.target.value }))}
                  placeholder="08123456789"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-text-primary">Status customer</span>
                <Select
                  value={form.status}
                  onValueChange={(value) => setForm((current) => ({ ...current, status: value as CustomerStatus }))}
                  options={Object.entries(CUSTOMER_STATUS_LABELS).map(([value, label]) => ({ value, label }))}
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-text-primary">Sumber</span>
                <Input
                  value={form.source}
                  onChange={(event) => setForm((current) => ({ ...current, source: event.target.value }))}
                  placeholder="WhatsApp, Instagram, Link Bisnis"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-text-primary">Catatan</span>
                <Textarea
                  value={form.notes}
                  onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
                  placeholder="Catatan singkat customer"
                />
              </label>
              {error ? <p className="text-sm text-status-danger">{error}</p> : null}
              <Button type="button" isLoading={isSubmitting} onClick={() => void handleSubmit()} disabled={!editingId && !canCreateCustomer}>
                {editingId ? "Simpan Perubahan" : "Simpan Customer"}
              </Button>
            </div>
          </CardBody>
        </Card>
      </section>

      <section className="space-y-3">
        {paginatedCustomers.length ? (
          paginatedCustomers.map((customer) => (
            <Card key={customer.id}>
              <CardBody className="space-y-4 p-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold text-text-primary">{customer.name}</h3>
                      <CustomerStatusBadge status={customer.status} />
                    </div>
                    <p className="mt-1 text-sm text-text-secondary">{formatPhoneNumber(customer.whatsappNumber)}</p>
                    <div className="mt-3 grid gap-2 text-sm text-text-secondary sm:grid-cols-2">
                      <p>Sumber: {customer.source ?? "-"}</p>
                      <p>Interaksi terakhir: {formatDateTime(customer.lastInteractionAt)}</p>
                      <p>Order terakhir: {customer.lastOrderSummary ?? "-"}</p>
                      <p>Catatan: {customer.notes ?? "-"}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <WhatsAppButton
                      phoneNumber={customer.whatsappNumber}
                      message={`Halo ${customer.name}, saya follow-up dari Rapiin ya.`}
                      label="Chat WA"
                    />
                    <LinkButton href={ROUTES.orders} variant="secondary">
                      Tambah Order
                    </LinkButton>
                    <Button type="button" variant="secondary" onClick={() => startEdit(customer)}>
                      <PencilLine className="h-4 w-4" />
                      Edit
                    </Button>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))
        ) : (
          <Card>
            <CardBody className="p-6 text-sm text-text-secondary">
              Belum ada customer sesuai filter. Coba ubah pencarian atau tambah customer baru.
            </CardBody>
          </Card>
        )}

        <Pagination
          currentPage={currentPage}
          pageSize={CUSTOMER_PAGE_SIZE}
          totalItems={filteredCustomers.length}
          onPageChange={setCurrentPage}
        />
      </section>
    </main>
  );
}
