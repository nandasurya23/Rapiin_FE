"use client";

import { useEffect, useMemo, useState } from "react";
import { Copy, Link2, RotateCcw, Send, Sparkles, Users, PencilLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FilterChipGroup } from "@/components/ui/filter-chip";
import { Card, CardBody } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast-provider";
import { MESSAGE_CATEGORY_LABELS, MESSAGE_VARIABLES } from "@/lib/constants/messages";
import { buildWhatsAppUrl, isValidWhatsappNumber } from "@/lib/whatsapp";
import { formatCurrency, formatDate } from "@/lib/format";
import { renderTemplate, extractTemplateVariables } from "@/lib/messages";
import { WhatsAppButton } from "@/components/shared/whatsapp-button";
import { ROUTES } from "@/lib/routes";
import { LinkButton } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import { getEntityById } from "@/lib/domain";
import { useAppData } from "@/components/providers/app-data-provider";
import { cn } from "@/lib/cn";
import type { MessageCategory } from "@/types/message";
import { Sheet } from "@/components/ui/sheet";

const categoryOrder = ["INQUIRY", "BOOKING_ORDER", "PEMBAYARAN", "FOLLOW_UP", "REVIEW", "ALAMAT", "SELESAI"] as const;

async function copyToClipboard(text: string) {
  await navigator.clipboard.writeText(text);
}

export function MessagesPage() {
  const toast = useToast();
  const { business, customers, orders, messageTemplates, ui, updateMessageComposer, saveMessageDraft } = useAppData();
  const [activeCategory, setActiveCategory] = useState<(typeof categoryOrder)[number]>("FOLLOW_UP");
  const [selectedTemplateId, setSelectedTemplateId] = useState(messageTemplates[1]?.id ?? messageTemplates[0]?.id ?? "");
  const [selectedCustomerId, setSelectedCustomerId] = useState(customers[0]?.id ?? "");
  const [selectedOrderId, setSelectedOrderId] = useState(orders[0]?.id ?? "");
  const [draftTitle, setDraftTitle] = useState("");
  const [draftContent, setDraftContent] = useState("");
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [isComposerOpen, setIsComposerOpen] = useState(false);

  const templatesInCategory = useMemo(
    () => messageTemplates.filter((template) => template.category === activeCategory),
    [activeCategory, messageTemplates]
  );

  useEffect(() => {
    const composer = ui.messageComposer;
    if (composer.activeCategory) {
      setActiveCategory(composer.activeCategory);
    }
    if (composer.selectedTemplateId) {
      setSelectedTemplateId(composer.selectedTemplateId);
    }
    if (composer.selectedCustomerId) {
      setSelectedCustomerId(composer.selectedCustomerId);
    }
    if (composer.selectedOrderId) {
      setSelectedOrderId(composer.selectedOrderId);
    }
  }, [ui.messageComposer]);

  useEffect(() => {
    if (!templatesInCategory.length) {
      return;
    }

    const selectedExists = templatesInCategory.some((template) => template.id === selectedTemplateId);
    if (!selectedExists) {
      setSelectedTemplateId(templatesInCategory[0].id);
    }
  }, [activeCategory, selectedTemplateId, templatesInCategory]);

  const selectedTemplate =
    templatesInCategory.find((template) => template.id === selectedTemplateId) ?? templatesInCategory[0] ?? messageTemplates[0];

  const selectedCustomer = getEntityById(customers, selectedCustomerId) ?? customers[0];

  const selectedOrder = useMemo(() => {
    if (!selectedCustomer) return undefined;
    const activeCustomerOrders = orders.filter((o) => o.customerId === selectedCustomer.id);
    return activeCustomerOrders.find((o) => o.id === selectedOrderId) ?? activeCustomerOrders[0] ?? undefined;
  }, [selectedCustomer, selectedOrderId, orders]);

  useEffect(() => {
    if (selectedCustomer) {
      const activeCustomerOrders = orders.filter((o) => o.customerId === selectedCustomer.id);
      if (activeCustomerOrders.length > 0) {
        const exists = activeCustomerOrders.some((o) => o.id === selectedOrderId);
        if (!exists) {
          setSelectedOrderId(activeCustomerOrders[0].id);
        }
      } else {
        setSelectedOrderId("");
      }
    }
  }, [selectedCustomer, orders, selectedOrderId]);

  const sampleValues = useMemo(
    () => ({
      customer_name: selectedCustomer?.name ?? "-",
      business_name: business.name,
      order_title: selectedOrder?.title ?? "-",
      scheduled_date: selectedOrder?.scheduledDate ? formatDate(selectedOrder.scheduledDate) : "-",
      scheduled_time: selectedOrder?.scheduledTime ?? "-",
      total_amount: selectedOrder ? formatCurrency(selectedOrder.totalAmount) : "-",
      dp_amount: selectedOrder ? formatCurrency(selectedOrder.dpAmount) : "-",
    }),
    [business.name, selectedCustomer?.name, selectedOrder]
  );

  useEffect(() => {
    if (!selectedTemplate) {
      return;
    }

    const savedDraft = ui.messageComposer.drafts[selectedTemplate.id];
    setDraftTitle(savedDraft?.title ?? selectedTemplate.title);
    setDraftContent(savedDraft?.content ?? renderTemplate(selectedTemplate.content, sampleValues));
  }, [sampleValues, selectedTemplate, ui.messageComposer.drafts]);

  const renderedPreview = draftContent;
  const variablesDetected = extractTemplateVariables(selectedTemplate?.content ?? "");
  const humanReadableVariables = variablesDetected.map((variable) => {
    switch (variable) {
      case "customer_name":
        return "nama customer";
      case "business_name":
        return "nama bisnis";
      case "order_title":
        return "nama order";
      case "scheduled_date":
        return "tanggal";
      case "scheduled_time":
        return "jam";
      case "total_amount":
        return "total";
      case "dp_amount":
        return "DP";
      default:
        return variable;
    }
  });
  const generatedUrl = selectedCustomer ? buildWhatsAppUrl(selectedCustomer.whatsappNumber, renderedPreview) : "";
  const canOpenWhatsApp = selectedCustomer ? isValidWhatsappNumber(selectedCustomer.whatsappNumber) : false;

  const followUpActions = [
    {
      title: "Follow-Up customer menunggu",
      description: "Kirim pesan ke customer yang statusnya perlu diurus hari ini.",
      customerId: customers.find((customer) => customer.status === "NEED_FOLLOW_UP")?.id ?? selectedCustomer?.id ?? "",
      templateId: messageTemplates.find((template) => template.category === "FOLLOW_UP")?.id ?? selectedTemplate?.id ?? "",
      orderId: orders.find((order) => order.customerId === customers.find((customer) => customer.status === "NEED_FOLLOW_UP")?.id)?.id ?? selectedOrder?.id ?? "",
    },
    {
      title: "Pengingat DP",
      description: "Cocok untuk order yang belum dibayar penuh.",
      customerId: selectedCustomer?.id ?? "",
      templateId: messageTemplates.find((template) => template.title === "Pengingat DP")?.id ?? selectedTemplate?.id ?? "",
      orderId: selectedOrder?.id ?? "",
    },
    {
      title: "Minta Review",
      description: "Dikirim setelah order selesai.",
      customerId: customers.find((customer) => customer.status === "DONE")?.id ?? selectedCustomer?.id ?? "",
      templateId: messageTemplates.find((template) => template.category === "REVIEW")?.id ?? selectedTemplate?.id ?? "",
      orderId: orders.find((order) => order.status === "SELESAI")?.id ?? selectedOrder?.id ?? "",
    },
  ];

  async function handleCopyMessage() {
    setLoadingAction("copy-message");
    try {
      await copyToClipboard(renderedPreview);
      toast.success("Pesan disalin");
    } finally {
      setLoadingAction(null);
    }
  }

  async function handleCopyLink() {
    setLoadingAction("copy-link");
    try {
      await copyToClipboard(generatedUrl);
      toast.success("Link WhatsApp disalin");
    } finally {
      setLoadingAction(null);
    }
  }

  async function handleResetDraft() {
    if (!selectedTemplate) {
      return;
    }
    setDraftTitle(selectedTemplate.title);
    setDraftContent(renderTemplate(selectedTemplate.content, sampleValues));
    saveMessageDraft(selectedTemplate.id, {
      title: selectedTemplate.title,
      content: renderTemplate(selectedTemplate.content, sampleValues),
    });
    toast.info("Template dikembalikan", "Isi pesan kembali ke versi default.");
  }

  return (
    <main className="page-enter space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      {/* SECTION 1: HERO HEADER */}
      <section className="animate-fade-up">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0c1d3b] via-[#122a57] to-[#09152b] border border-white/[0.08] shadow-[var(--shadow-lg)] px-6 py-6 sm:px-8 sm:py-8 text-white">
          {/* Background decorative glows */}
          <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[var(--color-accent)] opacity-15 blur-3xl animate-pulse" />
          <div className="absolute -left-10 -bottom-10 h-32 w-32 rounded-full bg-[var(--color-primary)] opacity-30 blur-3xl" />
          
          <div className="relative flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            {/* Left */}
            <div className="space-y-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.08] px-3.5 py-1 text-xs font-bold tracking-wider text-[var(--color-gold-300)] border border-white/[0.1] backdrop-blur-md uppercase">
                <MessageCircle className="h-3.5 w-3.5 animate-pulse text-[var(--color-accent)]" />
                Pesan Cepat
              </span>
              <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl text-white">
                Template WhatsApp Siap Pakai
              </h1>
              <p className="max-w-xl text-sm text-white/70 leading-relaxed">
                Kirim pesan cepat ke pelanggan untuk menagih DP, follow-up, atau minta review. Atau susun pesan manual dari katalog template.
              </p>
            </div>

            {/* Right: Actions */}
            <div className="flex flex-wrap gap-2.5 xl:shrink-0">
              <Button onClick={() => setIsComposerOpen(true)} className="shadow-sm">
                <PencilLine className="h-4 w-4 mr-2" />
                Buat Pesan Manual
              </Button>
            </div>
          </div>
        </div>
      </section>

      {customers.length === 0 ? (
        <Card className="border-[var(--color-border)] shadow-none animate-fade-up">
          <CardBody className="p-8 text-center flex flex-col items-center justify-center space-y-4">
            <div className="h-16 w-16 rounded-full bg-blue-50 flex items-center justify-center text-[var(--color-primary)]">
              <Users className="h-8 w-8" />
            </div>
            <div className="space-y-1.5 max-w-md">
              <h3 className="font-bold text-lg text-[var(--color-text)]">Belum Ada Pelanggan</h3>
              <p className="text-sm text-[var(--color-text-secondary)]">
                Daftar template WhatsApp otomatis akan aktif secara instan setelah Anda menambahkan pelanggan pertama atau menerima pemesanan dari pelanggan!
              </p>
            </div>
            <LinkButton href={ROUTES.customers} size="sm">
              Tambah Pelanggan Baru
            </LinkButton>
          </CardBody>
        </Card>
      ) : (
        <>
          {/* SECTION 2: FOLLOW-UP QUICK ACTIONS (MOVED UP & PRIORITIZED) */}
          <section className="space-y-4 animate-fade-up-delay-1">
            <div>
              <h2 className="text-xl font-bold text-[var(--color-text)]">Aksi Cepat Follow-Up</h2>
              <p className="text-xs text-[var(--color-text-secondary)] mt-1">Draf instan siap kirim untuk kasus mendesak yang terdeteksi secara otomatis.</p>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              {followUpActions.map((action, index) => {
                const template = getEntityById(messageTemplates, action.templateId) ?? selectedTemplate;
                const customer = getEntityById(customers, action.customerId) ?? selectedCustomer;
                const order = getEntityById(orders, action.orderId) ?? selectedOrder;

                if (!template || !customer) return null;

                const values = {
                  customer_name: customer.name,
                  business_name: business.name,
                  order_title: order?.title ?? "order",
                  scheduled_date: order?.scheduledDate ? formatDate(order.scheduledDate) : "",
                  scheduled_time: order?.scheduledTime ?? "",
                  total_amount: order ? formatCurrency(order.totalAmount) : "",
                  dp_amount: order ? formatCurrency(order.dpAmount) : "",
                };

                const message = renderTemplate(template.content, values);

                return (
                  <Card key={`${action.title}-${index}`} className="border-[var(--color-border)] shadow-none flex flex-col justify-between">
                    <CardBody className="p-4 flex flex-col justify-between h-full gap-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-primary)]">
                            {action.title}
                          </span>
                          <span className="text-[9px] text-[var(--color-text-muted)] font-bold">
                            {customer.name}
                          </span>
                        </div>
                        <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed line-clamp-3">
                          {message}
                        </p>
                      </div>

                      <div className="flex gap-2 border-t border-[var(--color-border)]/40 pt-3">
                        <WhatsAppButton phoneNumber={customer.whatsappNumber} message={message} label="Kirim WA" className="h-9 px-3 text-xs w-full justify-center" />
                        <Button
                          type="button"
                          variant="secondary"
                          isLoading={loadingAction === `action-${action.title}`}
                          className="h-9 px-3 rounded-xl border-[var(--color-border)] hover:bg-[var(--color-surface-elevated)] text-xs font-bold"
                          onClick={async () => {
                            setLoadingAction(`action-${action.title}`);
                            try {
                              await copyToClipboard(message);
                              toast.success(`Pesan ${action.title} disalin`);
                            } finally {
                              setLoadingAction(null);
                            }
                          }}
                        >
                          <Send className="h-4 w-4" />
                          Salin
                        </Button>
                      </div>
                    </CardBody>
                  </Card>
                );
              })}
            </div>
          </section>

          {/* SECTION 3: WHATSAPP CONFIG OVERVIEW */}
          <section className="animate-fade-up-delay-2">
            <Card className="border-[var(--color-border)] shadow-none">
              <CardBody className="p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="font-bold text-[var(--color-text)]">Konfigurasi & Ringkasan</h3>
                  <p className="text-xs text-[var(--color-text-secondary)]">Sistem WhatsApp otomatis aktif untuk semua pelanggan dengan nomor valid.</p>
                </div>
                
                <div className="flex flex-wrap gap-3">
                  <div className="flex flex-col justify-center rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-4 py-2.5">
                    <p className="text-[9px] font-extrabold uppercase tracking-wider text-[var(--color-text-muted)]">Pelanggan Aktif</p>
                    <p className="mt-0.5 text-xs font-bold text-[var(--color-text)] whitespace-nowrap">{customers.length} Orang</p>
                  </div>
                  <div className="flex flex-col justify-center rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-4 py-2.5">
                    <p className="text-[9px] font-extrabold uppercase tracking-wider text-[var(--color-text-muted)]">Total Order</p>
                    <p className="mt-0.5 text-xs font-bold text-[var(--color-text)] whitespace-nowrap">{orders.length} Transaksi</p>
                  </div>
                </div>
              </CardBody>
            </Card>
          </section>

          {/* COMPOSER SHEET */}
          <Sheet
            isOpen={isComposerOpen}
            onClose={() => setIsComposerOpen(false)}
            title="Komposer Pesan Manual"
            description="Pilih template dan sesuaikan isi pesan sebelum dikirim."
            className="w-full sm:max-w-xl md:max-w-2xl"
          >
            <div className="space-y-6 pt-4 pb-12 overflow-y-auto">
              {/* Template Selection */}
              <div className="space-y-4">
                <h3 className="font-bold text-sm text-[var(--color-text)]">1. Pilih Kategori & Template</h3>
                <FilterChipGroup
                  value={activeCategory}
                  onChange={(key: string) => {
                    setActiveCategory(key as MessageCategory);
                    updateMessageComposer({ activeCategory: key as MessageCategory });
                  }}
                  options={categoryOrder.map((cat) => ({
                    value: cat,
                    label: MESSAGE_CATEGORY_LABELS[cat],
                  }))}
                  size="sm"
                />

                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                  {templatesInCategory.map((template) => {
                    const isSelected = template.id === selectedTemplateId;
                    return (
                      <button
                        key={template.id}
                        type="button"
                        onClick={() => {
                          setSelectedTemplateId(template.id);
                          updateMessageComposer({ selectedTemplateId: template.id });
                        }}
                        className={cn(
                          "w-full text-left p-3.5 rounded-2xl border transition-all duration-[var(--transition-base)]",
                          isSelected
                            ? "bg-[var(--color-primary-surface)] border-[var(--color-info-border)] shadow-sm"
                            : "bg-[var(--color-surface)] border-[var(--color-border)] hover:bg-[var(--color-surface-elevated)] hover:border-[var(--color-border-strong)]"
                        )}
                      >
                        <p className={cn("text-xs font-bold transition", isSelected ? "text-[var(--color-primary)]" : "text-[var(--color-text)]")}>
                          {template.title}
                        </p>
                        <p className="text-[10px] text-[var(--color-text-secondary)] mt-1 line-clamp-2 leading-relaxed">
                          {template.content}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Customization */}
              <div className="space-y-4">
                <h3 className="font-bold text-sm text-[var(--color-text)]">2. Sesuaikan Pesan</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">Penerima (Customer)</span>
                    <Select
                      value={selectedCustomer.id}
                      onValueChange={(value) => {
                        setSelectedCustomerId(value);
                        updateMessageComposer({ selectedCustomerId: value });
                      }}
                      options={customers.map((customer) => ({ value: customer.id, label: customer.name }))}
                    />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">Kaitkan Order</span>
                    <Select
                      value={selectedOrder?.id ?? ""}
                      onValueChange={(value) => {
                        setSelectedOrderId(value);
                        updateMessageComposer({ selectedOrderId: value });
                      }}
                      options={
                        orders.filter((o) => o.customerId === selectedCustomer.id).length > 0
                          ? orders
                              .filter((o) => o.customerId === selectedCustomer.id)
                              .map((order) => ({ value: order.id, label: order.title }))
                          : [{ value: "", label: "Tidak ada order" }]
                      }
                    />
                  </label>
                </div>

                <label className="block">
                  <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">Judul Draf</span>
                  <Input
                    value={draftTitle}
                    onChange={(event) => {
                      setDraftTitle(event.target.value);
                      saveMessageDraft(selectedTemplateId, { title: event.target.value, content: draftContent });
                    }}
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">Isi Pesan</span>
                  <Textarea
                    rows={6}
                    className="font-mono text-xs"
                    value={draftContent}
                    onChange={(event) => {
                      setDraftContent(event.target.value);
                      saveMessageDraft(selectedTemplateId, { title: draftTitle, content: event.target.value });
                    }}
                  />
                </label>

                {variablesDetected.length > 0 ? (
                  <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-4 space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--color-text)]">
                      <Sparkles className="h-3.5 w-3.5 text-[var(--color-accent)] animate-pulse" />
                      Variabel Terdeteksi
                    </div>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {humanReadableVariables.map((variable) => (
                        <Badge key={variable} tone="info" className="text-[9px] font-bold">
                          {variable}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ) : null}

                {/* CTAs */}
                <div className="flex flex-col sm:flex-row flex-wrap gap-2 pt-2">
                  <WhatsAppButton
                    phoneNumber={selectedCustomer.whatsappNumber}
                    message={renderedPreview}
                    label="Buka WhatsApp"
                    className="flex-1"
                  />
                  <div className="flex gap-2 flex-1">
                    <Button type="button" variant="secondary" className="flex-1 rounded-xl border-[var(--color-border)] hover:bg-[var(--color-surface-elevated)] text-xs font-bold h-10 px-4" isLoading={loadingAction === "copy-message"} onClick={handleCopyMessage}>
                      <Copy className="h-4 w-4" />
                      Salin Pesan
                    </Button>
                    <Button type="button" variant="secondary" className="rounded-xl border-[var(--color-border)] hover:bg-[var(--color-surface-elevated)] text-xs font-bold h-10 px-4" onClick={handleResetDraft} title="Reset">
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </Sheet>
        </>
      )}
    </main>
  );
}
