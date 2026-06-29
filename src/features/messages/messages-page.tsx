"use client";

import { useEffect, useMemo, useState } from "react";
import { Copy, Link2, RotateCcw, Send, Sparkles } from "lucide-react";
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
  const generatedUrl = buildWhatsAppUrl(selectedCustomer.whatsappNumber, renderedPreview);
  const canOpenWhatsApp = isValidWhatsappNumber(selectedCustomer.whatsappNumber);

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
      customerId: selectedCustomer.id,
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
                Pilih kategori template, sesuaikan detail pesan, lalu hubungi pelanggan langsung via WhatsApp secara instan.
              </p>
            </div>

            {/* Right: Actions */}
            <div className="flex flex-wrap gap-2.5 xl:shrink-0">
              <LinkButton href={ROUTES.dashboard} className="shadow-sm">
                Lihat Dashboard
              </LinkButton>
              <LinkButton href={ROUTES.orders} variant="secondary" className="bg-white/10 text-white border-white/[0.15] hover:bg-white/20">
                Lihat Order
              </LinkButton>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: WHATSAPP CONFIG OVERVIEW */}
      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr] animate-fade-up-delay-1">
        <Card className="border-[var(--color-border)] shadow-none">
          <CardBody className="p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <h3 className="font-bold text-[var(--color-text)]">Konfigurasi Pengiriman</h3>
              <p className="text-xs text-[var(--color-text-secondary)]">Nomor WhatsApp tujuan aktif yang dipilih untuk menerima pesan.</p>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <div className="flex flex-col justify-center rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-4 py-2.5">
                <p className="text-[9px] font-extrabold uppercase tracking-wider text-[var(--color-text-muted)]">Nomor Tujuan</p>
                <p className="mt-0.5 text-xs font-bold text-[var(--color-text)] whitespace-nowrap">{selectedCustomer?.whatsappNumber || "-"}</p>
              </div>
              <div className="flex flex-col justify-center rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-4 py-2.5">
                <p className="text-[9px] font-extrabold uppercase tracking-wider text-[var(--color-text-muted)]">Status</p>
                <p className={`mt-0.5 text-xs font-bold whitespace-nowrap ${canOpenWhatsApp ? "text-emerald-600" : "text-rose-600"}`}>
                  {canOpenWhatsApp ? "WhatsApp Siap" : "Nomor Tidak Valid"}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col justify-center rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-5 py-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Pelanggan Aktif</p>
            <p className="mt-1 text-lg font-black text-[var(--color-text)]">{customers.length}</p>
          </div>
          <div className="flex flex-col justify-center rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-5 py-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Total Order</p>
            <p className="mt-1 text-lg font-black text-[var(--color-text)]">{orders.length}</p>
          </div>
        </div>
      </section>

      {/* SECTION 3: TEMPLATES & EDIT PANELS */}
      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr] animate-fade-up-delay-2">
        {/* Template Catalog */}
        <Card className="border-[var(--color-border)] shadow-none">
          <CardBody className="space-y-5 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-[var(--color-text)]">Kategori Template</h2>
                <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">Pilih jenis pesan di bawah untuk memuat draf.</p>
              </div>
              <Sparkles className="h-5 w-5 text-[var(--color-primary)] animate-pulse" />
            </div>

            <FilterChipGroup
              options={categoryOrder.map((cat) => ({ value: cat, label: MESSAGE_CATEGORY_LABELS[cat] }))}
              value={activeCategory}
              onChange={(v) => {
                setActiveCategory(v as typeof activeCategory);
                updateMessageComposer({ activeCategory: v as typeof activeCategory });
              }}
              size="sm"
            />

            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1 no-scrollbar">
              {templatesInCategory.map((template) => {
                const active = selectedTemplate.id === template.id;

                return (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => {
                      setSelectedTemplateId(template.id);
                      updateMessageComposer({ selectedTemplateId: template.id });
                    }}
                    className={`w-full rounded-2xl border text-left transition-all duration-[var(--transition-fast)] p-4 ${
                      active
                        ? "border-[var(--color-primary)] bg-[var(--color-primary-surface)]/50 shadow-[var(--shadow-sm)] ring-1 ring-[var(--color-primary)]/20"
                        : "border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-elevated)] hover:border-[var(--color-border-strong)]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <p className="font-bold text-sm text-[var(--color-text)]">{template.title}</p>
                        <p className="text-xs text-[var(--color-text-secondary)] line-clamp-2 leading-relaxed">
                          {renderTemplate(template.content, sampleValues)}
                        </p>
                      </div>
                      <span className="rounded-lg bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)] border border-[var(--color-border)] px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-wider shrink-0">
                        {template.variables.length} Data
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="rounded-2xl border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface-elevated)] p-4 text-xs text-[var(--color-text-secondary)] leading-relaxed">
              <span className="font-bold text-[var(--color-text)] block mb-1">💡 Variabel Otomatis Tersedia:</span>
              {MESSAGE_VARIABLES.map((v) => `{{${v}}}`).join(", ")}
            </div>
          </CardBody>
        </Card>

        {/* Edit & Preview Panel */}
        <Card className="border-[var(--color-border)] shadow-none">
          <CardBody className="space-y-5 p-5">
            <div>
              <h2 className="text-lg font-bold text-[var(--color-text)]">Sesuaikan & Tinjau Pesan</h2>
              <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">Edit konten draf template secara langsung sebelum dikirim.</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
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
                  const nextTitle = event.target.value;
                  setDraftTitle(nextTitle);
                  if (selectedTemplate) {
                    saveMessageDraft(selectedTemplate.id, { title: nextTitle, content: draftContent });
                  }
                }}
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">Isi Pesan</span>
              <Textarea
                value={draftContent}
                rows={5}
                onChange={(event) => {
                  const nextContent = event.target.value;
                  setDraftContent(nextContent);
                  if (selectedTemplate) {
                    saveMessageDraft(selectedTemplate.id, { title: draftTitle, content: nextContent });
                  }
                }}
              />
              <span className="mt-2 block text-[10px] text-[var(--color-text-muted)] leading-relaxed">
                Rapiin mengisi nominal dan tanggal secara dinamis. Anda bebas menyunting teks untuk merapikan kalimat.
              </span>
            </label>

            {/* WhatsApp Chat Bubble Live Preview */}
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-4 relative overflow-hidden">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold text-[var(--color-text)] uppercase tracking-wider">Preview Tampilan Chat</p>
                  <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">Simulasi draf chat di aplikasi WhatsApp pelanggan</p>
                </div>
                <Badge tone="info">{variablesDetected.length} data otomatis</Badge>
              </div>

              {/* The Chat Bubble Area */}
              <div className="mt-4 p-4 rounded-3xl bg-[radial-gradient(circle_at_top,_rgba(247,248,245,0.95),_transparent_75%)] bg-[#efeae2] min-h-[140px] flex flex-col justify-end relative shadow-inner border border-stone-200/40">
                {/* Chat Bubble wrapper */}
                <div className="relative max-w-[85%] rounded-2xl bg-[#d9fdd3] text-stone-800 px-4 py-3 text-xs leading-relaxed self-end shadow-[0_1px_0.5px_rgba(0,0,0,0.13)] border-t border-emerald-100 flex flex-col justify-between">
                  <div className="whitespace-pre-wrap">{renderedPreview || "Preview akan tampil di sini."}</div>
                  <span className="text-[9px] text-stone-400 self-end mt-1.5 font-medium select-none">15:00 ✓✓</span>
                  <div className="absolute top-0 -right-2 h-4 w-4 bg-[#d9fdd3] rounded-bl-3xl border-t border-emerald-100/50" />
                </div>
              </div>
              
              <p className="mt-3 text-[10px] text-[var(--color-text-secondary)] font-medium leading-relaxed">
                <span className="font-bold text-[var(--color-text)]">Data terisi otomatis:</span> {humanReadableVariables.length ? humanReadableVariables.join(", ") : "tidak ada"}
              </p>
            </div>

            {/* WhatsApp Link Box */}
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">Link Tautan WhatsApp</p>
              <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-4 py-3 text-[11px] font-mono text-[var(--color-text-muted)] break-all select-all">
                {generatedUrl}
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap gap-2 pt-2">
              <Button type="button" variant="secondary" className="rounded-xl border-[var(--color-border)] hover:bg-[var(--color-surface-elevated)] text-xs font-bold h-10 px-4" isLoading={loadingAction === "copy-message"} onClick={handleCopyMessage}>
                <Copy className="h-4 w-4" />
                Salin Pesan
              </Button>
              <Button type="button" variant="secondary" className="rounded-xl border-[var(--color-border)] hover:bg-[var(--color-surface-elevated)] text-xs font-bold h-10 px-4" isLoading={loadingAction === "copy-link"} onClick={handleCopyLink}>
                <Link2 className="h-4 w-4" />
                Salin Link
              </Button>
              <WhatsAppButton
                phoneNumber={selectedCustomer.whatsappNumber}
                message={renderedPreview}
                label="Buka WhatsApp"
              />
              <Button type="button" variant="secondary" className="rounded-xl border-[var(--color-border)] hover:bg-[var(--color-surface-elevated)] text-xs font-bold h-10 px-4" onClick={handleResetDraft}>
                <RotateCcw className="h-4 w-4" />
                Reset
              </Button>
            </div>
          </CardBody>
        </Card>
      </section>

      {/* SECTION 4: FOLLOW-UP QUICK ACTIONS */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-[var(--color-text)]">Aksi Cepat Follow-Up</h2>
          <p className="text-xs text-[var(--color-text-secondary)] mt-1">Draf instan siap kirim untuk kasus mendesak yang terdeteksi.</p>
        </div>

        <div className="grid gap-4 lg:grid-cols-3 animate-fade-up-delay-3">
          {followUpActions.map((action, index) => {
            const template = getEntityById(messageTemplates, action.templateId) ?? selectedTemplate;
            const customer = getEntityById(customers, action.customerId) ?? selectedCustomer;
            const order = getEntityById(orders, action.orderId) ?? selectedOrder;
            const message = renderTemplate(template.content, {
              customer_name: customer.name,
              business_name: business.name,
              order_title: order?.title ?? "-",
              scheduled_date: order?.scheduledDate ? formatDate(order.scheduledDate) : "-",
              scheduled_time: order?.scheduledTime ?? "-",
              total_amount: order ? formatCurrency(order.totalAmount) : "-",
              dp_amount: order ? formatCurrency(order.dpAmount) : "-",
            });

            // Color tones based on follow-up context
            let borderHighlight = "border-[var(--color-border)] hover:border-[var(--color-border-strong)]";
            let actionLabelColor = "text-[var(--color-primary)]";
            if (index === 0) {
              borderHighlight = "hover:border-blue-300 shadow-[var(--shadow-sm)]";
              actionLabelColor = "text-blue-600";
            } else if (index === 1) {
              borderHighlight = "hover:border-amber-300 shadow-[var(--shadow-sm)]";
              actionLabelColor = "text-amber-600";
            } else if (index === 2) {
              borderHighlight = "hover:border-emerald-300 shadow-[var(--shadow-sm)]";
              actionLabelColor = "text-emerald-600";
            }

            return (
              <Card key={action.title} className={cn("transition-all duration-300 hover:-translate-y-0.5", borderHighlight)}>
                <CardBody className="space-y-4 p-5 flex flex-col justify-between h-full">
                  <div className="space-y-3">
                    <div>
                      <p className={cn("text-[10px] font-bold uppercase tracking-wider", actionLabelColor)}>{action.title}</p>
                      <p className="mt-1 text-xs text-[var(--color-text-secondary)] leading-relaxed">{action.description}</p>
                    </div>
                    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-3">
                      <p className="text-xs font-bold text-[var(--color-text)]">{customer.name}</p>
                      <p className="mt-0.5 text-[10px] text-[var(--color-text-secondary)] font-medium">Template: {template.title}</p>
                    </div>
                    <div className="rounded-2xl border border-[var(--color-border)]/60 bg-[var(--color-surface)] p-3.5 text-xs leading-relaxed text-[var(--color-text)] whitespace-pre-wrap max-h-[140px] overflow-y-auto no-scrollbar font-medium">
                      {message}
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 pt-2">
                    <WhatsAppButton phoneNumber={customer.whatsappNumber} message={message} label="Follow-Up WA" />
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
    </main>
  );
}
