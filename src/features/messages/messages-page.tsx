/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useEffect, useMemo, useState } from "react";
import { Copy, RotateCcw, Send, Users, PencilLine, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FilterChipGroup } from "@/components/ui/filter-chip";
import { Card, CardBody } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast-provider";
import { MESSAGE_CATEGORY_LABELS } from "@/lib/constants/messages";
import { buildWhatsAppUrl, isValidWhatsappNumber } from "@/lib/whatsapp";
import { formatCurrency, formatDate } from "@/lib/format";
import { renderTemplate, extractTemplateVariables } from "@/lib/messages";
import { WhatsAppButton } from "@/components/shared/whatsapp-button";
import { PageHeader } from "@/components/shared/page-header";
import { ROUTES } from "@/lib/routes";
import { LinkButton } from "@/components/ui/button";
import { useAppData } from "@/components/providers/app-data-provider";
import { getEntityById } from "@/lib/domain";
import { cn } from "@/lib/cn";
import type { MessageCategory } from "@/types/message";
import { Sheet } from "@/components/ui/sheet";

const categoryOrder = ["INQUIRY", "BOOKING_ORDER", "PEMBAYARAN", "FOLLOW_UP", "REVIEW", "ALAMAT", "SELESAI"] as const;

async function copyToClipboard(text: string) {
  await navigator.clipboard.writeText(text);
}

export function MessagesPage() {
  const toast = useToast();
  const {
    business,
    customers,
    orders,
    messageTemplates,
    ui,
    updateMessageComposer,
    saveMessageDraft,
    createMessageTemplate,
    updateMessageTemplate,
    deleteMessageTemplate,
  } = useAppData();

  const [activeCategory, setActiveCategory] = useState<(typeof categoryOrder)[number]>("FOLLOW_UP");
  const [selectedTemplateId, setSelectedTemplateId] = useState(messageTemplates[1]?.id ?? messageTemplates[0]?.id ?? "");
  const [selectedCustomerId, setSelectedCustomerId] = useState(customers[0]?.id ?? "");
  const [selectedOrderId, setSelectedOrderId] = useState(orders[0]?.id ?? "");
  const [draftTitle, setDraftTitle] = useState("");
  const [draftContent, setDraftContent] = useState("");
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [isComposerOpen, setIsComposerOpen] = useState(false);

  // Tabs for Composer: SEND (Kirim Pesan) vs EDIT_TEMPLATE (Edit Template Asli)
  const [composerTab, setComposerTab] = useState<"SEND" | "EDIT_TEMPLATE">("SEND");

  // Raw Template Edit States
  const [templateRawTitle, setTemplateRawTitle] = useState("");
  const [templateRawContent, setTemplateRawContent] = useState("");

  // Create Template States
  const [isCreatingTemplate, setIsCreatingTemplate] = useState(false);
  const [newTemplateTitle, setNewTemplateTitle] = useState("");
  const [newTemplateCategory, setNewTemplateCategory] = useState<MessageCategory>("FOLLOW_UP");
  const [newTemplateContent, setNewTemplateContent] = useState("");

  const AVAILABLE_VARIABLE_BUTTONS = [
    { placeholder: "{{customer_name}}", label: "👤 Nama Pelanggan" },
    { placeholder: "{{business_name}}", label: "🏢 Nama Bisnis" },
    { placeholder: "{{order_title}}", label: "🛍️ Layanan" },
    { placeholder: "{{scheduled_date}}", label: "📅 Tanggal" },
    { placeholder: "{{scheduled_time}}", label: "⏰ Jam" },
    { placeholder: "{{total_amount}}", label: "💰 Total" },
    { placeholder: "{{dp_amount}}", label: "💳 DP" },
  ];

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

    // Also load raw template values
    setTemplateRawTitle(selectedTemplate.title);
    setTemplateRawContent(selectedTemplate.content);
  }, [sampleValues, selectedTemplate, ui.messageComposer.drafts]);

  const renderedPreview = draftContent;
  const variablesDetected = extractTemplateVariables(selectedTemplate?.content ?? "");
  const generatedUrl = selectedCustomer ? buildWhatsAppUrl(selectedCustomer.whatsappNumber, renderedPreview) : "";

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

  async function handleSaveTemplatePermanent() {
    if (!selectedTemplate) return;
    setLoadingAction("save-template");
    try {
      await updateMessageTemplate(selectedTemplate.id, {
        title: templateRawTitle,
        content: templateRawContent,
      });
      toast.success("Template berhasil disimpan secara permanen ke Database!");
    } catch (err) {
      toast.error("Gagal menyimpan template", err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setLoadingAction(null);
    }
  }

  async function handleCreateTemplate() {
    if (!newTemplateTitle.trim() || !newTemplateContent.trim()) {
      toast.error("Judul dan isi template wajib diisi.");
      return;
    }
    setLoadingAction("create-template");
    try {
      await createMessageTemplate({
        category: newTemplateCategory,
        title: newTemplateTitle,
        content: newTemplateContent,
      });
      toast.success("Template kustom baru berhasil dibuat!");
      setIsCreatingTemplate(false);
      setNewTemplateTitle("");
      setNewTemplateContent("");
    } catch (err) {
      toast.error("Gagal membuat template", err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setLoadingAction(null);
    }
  }

  async function handleDeleteTemplate() {
    if (!selectedTemplate) return;
    if (!confirm(`Apakah Anda yakin ingin menghapus template "${selectedTemplate.title}" secara permanen?`)) return;
    setLoadingAction("delete-template");
    try {
      await deleteMessageTemplate(selectedTemplate.id);
      toast.success("Template berhasil dihapus!");
      setSelectedTemplateId(messageTemplates[0]?.id ?? "");
    } catch (err) {
      toast.error("Gagal menghapus template", err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setLoadingAction(null);
    }
  }

  function insertVariable(variable: string, targetId: string) {
    const textarea = document.getElementById(targetId) as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = textarea.value;
      const nextContent = text.substring(0, start) + variable + text.substring(end);

      if (targetId === "message-content-textarea") {
        setDraftContent(nextContent);
        saveMessageDraft(selectedTemplateId, { title: draftTitle, content: nextContent });
      } else if (targetId === "template-raw-content-textarea") {
        setTemplateRawContent(nextContent);
      } else if (targetId === "template-new-content-textarea") {
        setNewTemplateContent(nextContent);
      }

      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + variable.length, start + variable.length);
      }, 50);
    }
  }

  return (
    <main className="page-enter space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      {/* SECTION 1: HERO HEADER */}
      <PageHeader
        variant="hero"
        title="Template WhatsApp Siap Pakai"
        description="Kirim pesan cepat ke pelanggan untuk menagih DP, follow-up, atau minta review. Atau susun pesan manual dari katalog template."
        badge={
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.08] px-3.5 py-1 text-xs font-bold tracking-wider text-[var(--color-gold-300)] border border-white/[0.1] backdrop-blur-md uppercase">
            <MessageCircle className="h-3.5 w-3.5 animate-pulse text-[var(--color-accent)]" />
            Pesan Cepat
          </span>
        }
        action={
          <div className="flex flex-wrap gap-2.5 xl:shrink-0">
            <Button onClick={() => { setIsComposerOpen(true); setComposerTab("SEND"); }} variant="accent" className="shadow-sm">
              <PencilLine className="h-4 w-4 mr-2" />
              Buat Pesan Manual
            </Button>
          </div>
        }
      />

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
            <LinkButton href={ROUTES.customers(business.slug)} size="sm">
              Tambah Pelanggan Baru
            </LinkButton>
          </CardBody>
        </Card>
      ) : (
        <>
          {/* SECTION 2: FOLLOW-UP QUICK ACTIONS */}
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
            title="Komposer & Manajer Pesan"
            description="Kirim pesan cepat ke pelanggan atau edit template database Anda."
            className="w-full sm:max-w-xl md:max-w-2xl"
          >
            <div className="space-y-6 pt-4 pb-12 overflow-y-auto">
              
              {/* Tab Switcher */}
              <div className="flex border-b border-[var(--color-border)] mb-4">
                <button
                  type="button"
                  onClick={() => { setComposerTab("SEND"); setIsCreatingTemplate(false); }}
                  className={cn(
                    "flex-1 py-2 text-center text-xs font-bold border-b-2 transition-all",
                    composerTab === "SEND"
                      ? "border-[var(--color-primary)] text-[var(--color-primary)] font-black"
                      : "border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
                  )}
                >
                  🚀 Kirim Pesan Cepat
                </button>
                <button
                  type="button"
                  onClick={() => { setComposerTab("EDIT_TEMPLATE"); setIsCreatingTemplate(false); }}
                  className={cn(
                    "flex-1 py-2 text-center text-xs font-bold border-b-2 transition-all",
                    composerTab === "EDIT_TEMPLATE"
                      ? "border-[var(--color-primary)] text-[var(--color-primary)] font-black"
                      : "border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
                  )}
                >
                  ⚙️ Edit Template Asli
                </button>
              </div>

              {/* Template Selection */}
              {!isCreatingTemplate && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center gap-2">
                    <h3 className="font-bold text-sm text-[var(--color-text)]">1. Pilih Kategori & Template</h3>
                    {composerTab === "EDIT_TEMPLATE" && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setIsCreatingTemplate(true)}
                        className="rounded-lg h-7 text-[10px] font-bold border-[var(--color-border)] hover:bg-[var(--color-surface-elevated)]"
                      >
                        [+] Template Baru
                      </Button>
                    )}
                  </div>
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

                  <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
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
                          <p className="text-[10px] text-[var(--color-text-secondary)] mt-1 line-clamp-2 leading-relaxed font-semibold">
                            {template.content}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Form 1: Kirim Pesan Cepat (SEND tab) */}
              {composerTab === "SEND" && selectedTemplate && (
                <div className="space-y-4 animate-fade-in">
                  <h3 className="font-bold text-sm text-[var(--color-text)]">2. Sesuaikan Pesan</h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block">
                      <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">Penerima (Customer)</span>
                      <Select
                        value={selectedCustomer?.id ?? ""}
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
                          selectedCustomer && orders.filter((o) => o.customerId === selectedCustomer.id).length > 0
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
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">Isi Pesan</span>
                      <span className="text-[10px] text-[var(--color-text-muted)] italic font-semibold">Draft siap kirim</span>
                    </div>
                    <Textarea
                      id="message-content-textarea"
                      rows={6}
                      className="font-mono text-xs"
                      value={draftContent}
                      onChange={(event) => {
                        setDraftContent(event.target.value);
                        saveMessageDraft(selectedTemplateId, { title: draftTitle, content: event.target.value });
                      }}
                    />
                  </label>

                  {/* CTAs */}
                  <div className="flex flex-col sm:flex-row flex-wrap gap-2 pt-2">
                    <WhatsAppButton
                      phoneNumber={selectedCustomer?.whatsappNumber ?? ""}
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
              )}

              {/* Form 2: Edit Template Asli (EDIT_TEMPLATE tab, not creating) */}
              {composerTab === "EDIT_TEMPLATE" && !isCreatingTemplate && selectedTemplate && (
                <div className="space-y-4 animate-fade-in">
                  <h3 className="font-bold text-sm text-[var(--color-text)]">2. Edit Isi Template</h3>
                  
                  <label className="block">
                    <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">Judul Template</span>
                    <Input
                      value={templateRawTitle}
                      onChange={(event) => setTemplateRawTitle(event.target.value)}
                    />
                  </label>

                  <div>
                    <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">Isi Template</span>
                    
                    {/* Klik Variabel Instan untuk menyisipkan */}
                    <div className="flex flex-wrap gap-1.5 mb-2.5 bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-xl p-3 shadow-xs">
                      <span className="w-full block text-[9px] uppercase font-extrabold tracking-wider text-[var(--color-text-muted)] mb-1">Klik untuk menyisipkan variabel:</span>
                      {AVAILABLE_VARIABLE_BUTTONS.map((btn) => (
                        <button
                          key={btn.placeholder}
                          type="button"
                          onClick={() => insertVariable(btn.placeholder, "template-raw-content-textarea")}
                          className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1 text-[10px] font-semibold text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-elevated)] hover:text-[var(--color-text)] transition-colors active:scale-95"
                        >
                          {btn.label}
                        </button>
                      ))}
                    </div>

                    <Textarea
                      id="template-raw-content-textarea"
                      rows={6}
                      className="font-mono text-xs"
                      value={templateRawContent}
                      onChange={(event) => setTemplateRawContent(event.target.value)}
                      placeholder="Masukkan konten template dengan variabel..."
                    />
                  </div>

                  {/* Actions for Edit */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      type="button"
                      isLoading={loadingAction === "save-template"}
                      onClick={handleSaveTemplatePermanent}
                      className="flex-1 font-bold text-sm h-11 rounded-xl"
                    >
                      Simpan Ke Database
                    </Button>
                    <Button
                      type="button"
                      variant="danger"
                      isLoading={loadingAction === "delete-template"}
                      onClick={handleDeleteTemplate}
                      className="font-bold text-sm h-11 rounded-xl px-4"
                    >
                      Hapus
                    </Button>
                  </div>
                </div>
              )}

              {/* Form 3: Tambah Template Baru (EDIT_TEMPLATE tab, is creating) */}
              {composerTab === "EDIT_TEMPLATE" && isCreatingTemplate && (
                <div className="space-y-4 animate-fade-in">
                  <h3 className="font-bold text-sm text-[var(--color-text)]">Buat Template Baru</h3>
                  
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block">
                      <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">Kategori</span>
                      <Select
                        value={newTemplateCategory}
                        onValueChange={(value) => setNewTemplateCategory(value as MessageCategory)}
                        options={categoryOrder.map((cat) => ({ value: cat, label: MESSAGE_CATEGORY_LABELS[cat] }))}
                      />
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">Judul Template</span>
                      <Input
                        value={newTemplateTitle}
                        onChange={(event) => setNewTemplateTitle(event.target.value)}
                        placeholder="Contoh: Pengingat Order Baru"
                      />
                    </label>
                  </div>

                  <div>
                    <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">Isi Template</span>
                    
                    {/* Klik Variabel Instan untuk menyisipkan */}
                    <div className="flex flex-wrap gap-1.5 mb-2.5 bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-xl p-3 shadow-xs">
                      <span className="w-full block text-[9px] uppercase font-extrabold tracking-wider text-[var(--color-text-muted)] mb-1">Klik untuk menyisipkan variabel:</span>
                      {AVAILABLE_VARIABLE_BUTTONS.map((btn) => (
                        <button
                          key={btn.placeholder}
                          type="button"
                          onClick={() => insertVariable(btn.placeholder, "template-new-content-textarea")}
                          className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1 text-[10px] font-semibold text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-elevated)] hover:text-[var(--color-text)] transition-colors active:scale-95"
                        >
                          {btn.label}
                        </button>
                      ))}
                    </div>

                    <Textarea
                      id="template-new-content-textarea"
                      rows={6}
                      className="font-mono text-xs"
                      value={newTemplateContent}
                      onChange={(event) => setNewTemplateContent(event.target.value)}
                      placeholder="Masukkan konten template dengan variabel..."
                    />
                  </div>

                  {/* Actions for Creation */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      type="button"
                      isLoading={loadingAction === "create-template"}
                      onClick={handleCreateTemplate}
                      className="flex-1 font-bold text-sm h-11 rounded-xl"
                    >
                      Simpan Template Baru
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setIsCreatingTemplate(false)}
                      className="rounded-xl border-[var(--color-border)] hover:bg-[var(--color-surface-elevated)] text-xs font-bold h-11 px-4"
                    >
                      Batal
                    </Button>
                  </div>
                </div>
              )}

            </div>
          </Sheet>
        </>
      )}
    </main>
  );
}
