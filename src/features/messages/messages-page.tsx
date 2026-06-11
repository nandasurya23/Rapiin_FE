"use client";

import { useEffect, useMemo, useState } from "react";
import { Copy, Link2, RotateCcw, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  const selectedOrder = getEntityById(orders, selectedOrderId) ?? orders[0];

  const sampleValues = useMemo(
    () => ({
      customer_name: selectedCustomer.name,
      business_name: business.name,
      order_title: selectedOrder.title,
      scheduled_date: selectedOrder.scheduledDate ? formatDate(selectedOrder.scheduledDate) : "-",
      scheduled_time: selectedOrder.scheduledTime ?? "-",
      total_amount: formatCurrency(selectedOrder.totalAmount),
      dp_amount: formatCurrency(selectedOrder.dpAmount),
    }),
    [business.name, selectedCustomer?.name, selectedOrder?.dpAmount, selectedOrder?.scheduledDate, selectedOrder?.scheduledTime, selectedOrder?.title, selectedOrder?.totalAmount]
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
      <section>
        <Card className="border-border/80 shadow-soft">
          <CardBody className="space-y-4 p-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <div className="inline-flex rounded-md bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">
                  Pesan Cepat
                </div>
                <h1 className="mt-3 text-2xl font-semibold tracking-tight text-text-primary">
                  Template WhatsApp yang siap pakai
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-text-secondary">
                  Pilih template yang paling cocok, sesuaikan sedikit kalau perlu, lalu kirim lewat WhatsApp seperti admin biasa.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <LinkButton href={ROUTES.dashboard}>Lihat Dashboard</LinkButton>
                <LinkButton href={ROUTES.orders} variant="secondary">
                  Lihat Order
                </LinkButton>
              </div>
            </div>

            <div className="grid gap-3 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-xl border border-border/70 bg-surface px-4 py-4 text-sm text-text-secondary">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-text-primary">Generator WhatsApp</p>
                    <p className="mt-1">Link otomatis dari nomor customer dan isi pesan yang sedang dipakai.</p>
                  </div>
                  <Link2 className="h-5 w-5 text-brand-700" />
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border border-border/70 bg-muted/30 px-4 py-3">
                    <p className="text-xs text-text-muted">Nomor tujuan</p>
                    <p className="mt-1 text-sm font-medium text-text-primary">{selectedCustomer.whatsappNumber}</p>
                  </div>
                  <div className="rounded-lg border border-border/70 bg-muted/30 px-4 py-3">
                    <p className="text-xs text-text-muted">Status</p>
                    <p className="mt-1 text-sm font-medium text-text-primary">
                      {canOpenWhatsApp ? "Siap dibuka ke WhatsApp" : "Nomor belum valid"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-border/70 bg-surface px-4 py-3">
                  <p className="text-xs text-text-muted">Customer aktif</p>
                  <p className="mt-1 text-lg font-semibold text-text-primary">{customers.length}</p>
                </div>
                <div className="rounded-lg border border-border/70 bg-surface px-4 py-3">
                  <p className="text-xs text-text-muted">Order aktif</p>
                  <p className="mt-1 text-lg font-semibold text-text-primary">{orders.length}</p>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      </section>

      <section className="grid gap-6 2xl:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardBody className="space-y-4 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-text-primary">Kategori Template</h2>
                <p className="text-sm text-text-secondary">Pilih kategori pesan yang paling dekat.</p>
              </div>
              <Sparkles className="h-5 w-5 text-brand-700" />
            </div>
            <div className="flex flex-wrap gap-2">
              {categoryOrder.map((category) => {
                const active = activeCategory === category;
                return (
                  <button
                    key={category}
                    type="button"
                    onClick={() => {
                      setActiveCategory(category);
                      updateMessageComposer({ activeCategory: category });
                    }}
                  className={`rounded-md border px-3 py-1.5 text-sm font-medium transition ${
                      active ? "border-brand-500 bg-brand-50 text-brand-800" : "border-border bg-surface text-text-secondary hover:bg-muted"
                    }`}
                  >
                    {MESSAGE_CATEGORY_LABELS[category]}
                  </button>
                );
              })}
            </div>

            <div className="grid gap-2">
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
                    className={`rounded-xl border border-border/80 bg-surface px-4 py-4 text-left transition ${
                      active ? "border-brand-500 bg-brand-50" : "border-border bg-surface hover:bg-muted"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-text-primary">{template.title}</p>
                        <p className="mt-1 text-sm text-text-secondary line-clamp-3">
                          {renderTemplate(template.content, sampleValues)}
                        </p>
                      </div>
                      <Badge tone="neutral">{template.variables.length} data otomatis</Badge>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="rounded-xl border border-dashed border-border/80 bg-muted/40 p-4 text-sm text-text-secondary">
              Data otomatis yang bisa dipakai: {MESSAGE_VARIABLES.join(", ")}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="space-y-5 p-5">
            <div>
              <h2 className="text-lg font-semibold text-text-primary">Edit & Preview</h2>
              <p className="text-sm text-text-secondary">
                Isi pesan bisa langsung disesuaikan sebelum dibuka ke WhatsApp.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-text-primary">Customer</span>
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
                <span className="mb-2 block text-sm font-medium text-text-primary">Order</span>
                <Select
                  value={selectedOrder.id}
                  onValueChange={(value) => {
                    setSelectedOrderId(value);
                    updateMessageComposer({ selectedOrderId: value });
                  }}
                  options={orders.map((order) => ({ value: order.id, label: `${order.customerName} - ${order.title}` }))}
                />
              </label>
            </div>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-text-primary">Judul template</span>
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
              <span className="mb-2 block text-sm font-medium text-text-primary">Isi pesan</span>
              <Textarea
                value={draftContent}
                onChange={(event) => {
                  const nextContent = event.target.value;
                  setDraftContent(nextContent);
                  if (selectedTemplate) {
                    saveMessageDraft(selectedTemplate.id, { title: draftTitle, content: nextContent });
                  }
                }}
              />
              <span className="mt-2 block text-xs text-text-muted">
                Nama customer, jadwal, dan nominal diisi otomatis. Kamu tinggal rapikan kalimatnya kalau perlu.
              </span>
            </label>

            <div className="rounded-xl border border-border/80 bg-muted/30 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-text-primary">Preview pesan</p>
                  <p className="text-xs text-text-muted">Ditarik dari data customer dan order yang dipilih.</p>
                </div>
                <Badge tone="info">{variablesDetected.length} data otomatis</Badge>
              </div>
              <div className="mt-3 rounded-xl border border-border/70 bg-surface px-4 py-4 text-sm leading-6 text-text-primary whitespace-pre-wrap">
                {renderedPreview || "Preview akan tampil di sini."}
              </div>
              <p className="mt-3 text-xs text-text-muted">
                Isi otomatis aktif: {humanReadableVariables.length ? humanReadableVariables.join(", ") : "tidak ada"}
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-text-primary">Link WhatsApp</p>
              <div className="rounded-xl border border-border/70 bg-surface px-4 py-4 text-sm text-text-secondary break-all">
                {generatedUrl}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="secondary" isLoading={loadingAction === "copy-message"} onClick={handleCopyMessage}>
                <Copy className="h-4 w-4" />
                Salin Pesan
              </Button>
              <Button type="button" variant="secondary" isLoading={loadingAction === "copy-link"} onClick={handleCopyLink}>
                <Link2 className="h-4 w-4" />
                Salin Link
              </Button>
              <WhatsAppButton
                phoneNumber={selectedCustomer.whatsappNumber}
                message={renderedPreview}
                label="Buka WhatsApp"
              />
              <Button type="button" variant="secondary" onClick={handleResetDraft}>
                <RotateCcw className="h-4 w-4" />
                Reset
              </Button>
            </div>

            <div className="rounded-xl border border-dashed border-border/80 p-4">
              <div className="flex items-start gap-3">
                <MessageCircle className="mt-0.5 h-5 w-5 text-brand-700" />
                <div className="min-w-0">
                  <p className="font-medium text-text-primary">Aksi follow-up siap pakai</p>
                  <p className="mt-1 text-sm text-text-secondary">
                    Gunakan template ini untuk follow-up, pengingat DP, dan review tanpa ketik ulang.
                  </p>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {followUpActions.map((action) => {
          const template = getEntityById(messageTemplates, action.templateId) ?? selectedTemplate;
          const customer = getEntityById(customers, action.customerId) ?? selectedCustomer;
          const order = getEntityById(orders, action.orderId) ?? selectedOrder;
          const message = renderTemplate(template.content, {
            customer_name: customer.name,
            business_name: business.name,
            order_title: order.title,
            scheduled_date: order.scheduledDate ? formatDate(order.scheduledDate) : "-",
            scheduled_time: order.scheduledTime ?? "-",
            total_amount: formatCurrency(order.totalAmount),
            dp_amount: formatCurrency(order.dpAmount),
          });

          return (
            <Card key={action.title}>
              <CardBody className="space-y-4 p-5">
                <div>
                  <p className="text-lg font-semibold text-text-primary">{action.title}</p>
                  <p className="mt-1 text-sm text-text-secondary">{action.description}</p>
                </div>
                <div className="rounded-xl border border-border/70 bg-muted/40 p-4 text-sm text-text-secondary">
                  <p className="font-medium text-text-primary">{customer.name}</p>
                  <p className="mt-1">{template.title}</p>
                </div>
                <div className="rounded-xl border border-border/70 bg-surface px-4 py-4 text-sm leading-6 text-text-primary whitespace-pre-wrap">
                  {message}
                </div>
                <div className="flex flex-wrap gap-2">
                  <WhatsAppButton phoneNumber={customer.whatsappNumber} message={message} label="Follow-Up WA" />
                  <Button
                    type="button"
                    variant="secondary"
                    isLoading={loadingAction === `action-${action.title}`}
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
      </section>
    </main>
  );
}
