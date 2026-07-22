"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Settings } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { useToast } from "@/components/ui/toast-provider";
import { useAppData } from "@/components/providers/app-data-provider";
import { useOrders } from "@/hooks/use-orders";
import { usePermission } from "@/hooks/use-permission";
import { TeamList } from "@/features/team/components/team-list";
import { InviteMemberSheet } from "@/features/team/components/invite-member-sheet";
import { EditMemberSheet } from "@/features/team/components/edit-member-sheet";
import { cn } from "@/lib/cn";
import { useBusiness } from "@/hooks/use-business";
import {
  createBusinessResources,
  OPERATIONAL_MODEL_OPTIONS,
} from "@/lib/constants/business";
import { isValidPhoneNumber, normalizePhoneNumber } from "@/lib/validation";
import { getPublicCatalog } from "@/lib/public-business";
import { RoleGate } from "@/components/shared/role-gate";
import type { BusinessResource } from "@/types/business";
import type { TeamMember } from "@/types/team";
import { teamService } from "@/services/team.service";

import { GeneralSettingsTab, type FormErrors, type SettingsFormState } from "./components/general-settings-tab";
import { OperationalSettingsTab } from "./components/operational-settings-tab";
import { ResourceSettingsTab } from "./components/resource-settings-tab";
import { CatalogSettingsTab } from "./components/catalog-settings-tab";

function mapTimezoneValue(tz: string | null | undefined): string {
  if (!tz) return "Asia/Jakarta";
  if (tz === "WIB") return "Asia/Jakarta";
  if (tz === "WITA") return "Asia/Makassar";
  if (tz === "WIT") return "Asia/Jayapura";
  return tz;
}

function createFormStateFromBusiness(
  business: ReturnType<typeof useAppData>["business"],
  currentUser: ReturnType<typeof useAppData>["currentUser"]
): SettingsFormState {
  return {
    name: business.name,
    whatsappNumber: business.whatsappNumber || currentUser?.phoneNumber || "",
    mode: business.mode,
    niche: business.niche,
    operationalModel: business.operationalModel,
    resourceLabel: business.resourceLabel ?? "Staf",
    resourceCount: String(business.resourceCount ?? business.resources?.length ?? 1),
    bookingCapacity: String(business.bookingCapacity ?? 2),
    defaultBookingDurationMinutes: String(business.defaultBookingDurationMinutes ?? 60),
    openingHours: business.openingHours ?? "",
    timezone: mapTimezoneValue(business.timezone),
    address: business.address ?? "",
    description: business.description,
    paymentInstructions: business.paymentInstructions ?? "",
    resources: business.resources ?? [],
    services: business.services ?? getPublicCatalog(business),
    logoUrl: business.logoUrl ?? "",
  };
}

function buildResources(resourceLabel: string, resourceCount: string, currentResources: BusinessResource[]) {
  const safeLabel = resourceLabel.trim() || "Slot";
  const safeCount = Math.max(1, Number(resourceCount) || 1);
  const fallbackResources = createBusinessResources(safeLabel, safeCount);

  return Array.from({ length: Math.max(currentResources.length, safeCount) }, (_, index) => {
    const existing = currentResources[index];
    const fallback = fallbackResources[index] ?? {
      id: `res_${index + 1}`,
      name: `${safeLabel} ${index + 1}`,
      isActive: false,
    };

    return {
      id: existing?.id ?? fallback.id,
      name: existing?.name ?? fallback.name,
      isActive: index < safeCount ? existing?.isActive ?? true : false,
    };
  });
}

export function SettingsPage() {
  const toast = useToast();
  const { currentUser } = useAppData();
  const { orders } = useOrders();
  const { business, saveBusinessSettings } = useBusiness();
  const [form, setForm] = useState<SettingsFormState>(createFormStateFromBusiness(business, currentUser));
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSaving, setIsSaving] = useState(false);

  const [activeTab, setActiveTab] = useState<"operational" | "team">("operational");
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const { hasPermission } = usePermission();

  const { data: teamMembers = [], refetch: refetchTeam } = useQuery({
    queryKey: ["team", "members"],
    queryFn: () => teamService.getMembers(),
    enabled: activeTab === "team",
    staleTime: 30_000,
  });

  const canWriteSettings = hasPermission("settings:write");

  useEffect(() => {
    if (!canWriteSettings) {
      setActiveTab("team");
    }
  }, [canWriteSettings]);

  useEffect(() => {
    setForm(createFormStateFromBusiness(business, currentUser));
  }, [business, currentUser]);

  const usesResources = form.operationalModel === "RESOURCE_BOOKING";
  const modeOptions = useMemo(
    () =>
      form.mode === "BOOKING_SERVICE"
        ? OPERATIONAL_MODEL_OPTIONS.filter((option) => option.value !== "ORDER_REQUEST")
        : OPERATIONAL_MODEL_OPTIONS.filter((option) => option.value === "ORDER_REQUEST"),
    [form.mode]
  );
  const referencedResourceIds = useMemo(
    () => new Set(orders.map((order) => order.resourceId).filter((id): id is string => Boolean(id))),
    [orders]
  );

  function updateForm<K extends keyof SettingsFormState>(field: K, value: SettingsFormState[K]) {
    setErrors({});
    setForm((current) => ({ ...current, [field]: value }));
  }

  function validateForm() {
    const nextErrors: FormErrors = {};

    if (!form.name.trim()) {
      nextErrors.name = "Nama bisnis wajib diisi.";
    }

    if (!form.whatsappNumber.trim()) {
      nextErrors.whatsappNumber = "Nomor WhatsApp wajib diisi.";
    } else if (!isValidPhoneNumber(form.whatsappNumber)) {
      nextErrors.whatsappNumber = "Nomor WhatsApp harus 9-15 digit angka.";
    }

    if (form.mode === "BOOKING_SERVICE" && form.operationalModel === "APPOINTMENT") {
      const parsedCapacity = Number(form.bookingCapacity);
      if (!Number.isFinite(parsedCapacity) || parsedCapacity < 1) {
        nextErrors.bookingCapacity = "Kapasitas booking minimal 1.";
      }
    }

    if (usesResources) {
      if (!form.resourceLabel.trim()) {
        nextErrors.resourceLabel = "Nama unit wajib diisi.";
      }

      const parsedCount = Number(form.resourceCount);
      if (!Number.isFinite(parsedCount) || parsedCount < 1) {
        nextErrors.resourceCount = "Jumlah unit minimal 1.";
      }

      if (form.resources.some((resource) => !resource.name.trim())) {
        nextErrors.resources = "Nama unit tidak boleh kosong.";
      }

      if (!form.resources.some((resource) => resource.isActive)) {
        nextErrors.resources = "Minimal ada 1 unit aktif.";
      }
    }

    if (form.services.length === 0) {
      nextErrors.services = "Minimal harus ada 1 layanan/produk.";
    } else if (form.services.some((service) => !service.name.trim())) {
      nextErrors.services = "Nama layanan/produk tidak boleh kosong.";
    }

    setErrors(nextErrors);
    return nextErrors;
  }

  async function handleSave() {
    if (isSaving) return;
    const nextErrors = validateForm();
    const errorKeys = Object.keys(nextErrors);

    if (errorKeys.length > 0) {
      const errorMessages = Object.values(nextErrors).join(" • ");
      toast.error("Gagal menyimpan", errorMessages);
      return;
    }

    setIsSaving(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 220));

      const servicesForBE = form.services.map((s) => {
        let priceNum = 0;
        if (s.priceLabel) {
          const clean = s.priceLabel.replace(/[^0-9]/g, "");
          priceNum = Number(clean) || 0;
        }
        return {
          id: s.id,
          name: s.name,
          description: s.description || "",
          price: priceNum,
          duration: s.durationMinutes !== undefined ? Number(s.durationMinutes) : 60,
        };
      });

      await saveBusinessSettings({
        name: form.name.trim(),
        whatsappNumber: normalizePhoneNumber(form.whatsappNumber),
        mode: form.mode,
        niche: form.niche,
        operationalModel: form.operationalModel,
        usesResources,
        resourceLabel: usesResources ? form.resourceLabel.trim() : undefined,
        resourceCount: usesResources ? Math.max(1, Number(form.resourceCount) || 1) : undefined,
        resources: usesResources ? form.resources : [],
        services: servicesForBE,
        bookingCapacity:
          form.mode === "BOOKING_SERVICE" && form.operationalModel === "APPOINTMENT"
            ? Math.max(1, Number(form.bookingCapacity) || 2)
            : undefined,
        defaultBookingDurationMinutes: form.defaultBookingDurationMinutes
          ? Math.max(1, Number(form.defaultBookingDurationMinutes) || 60)
          : undefined,
        openingHours: form.openingHours.trim() || undefined,
        timezone: form.timezone,
        address: form.address.trim() || undefined,
        description: form.description.trim(),
        paymentInstructions: form.paymentInstructions.trim() || undefined,
        logoUrl: form.logoUrl.trim() || undefined,
      });
      toast.success("Pengaturan bisnis disimpan", "Flow form dan booking sudah ikut menyesuaikan.");
    } catch (err) {
      toast.error(
        "Gagal menyimpan pengaturan",
        err instanceof Error ? err.message : "Terjadi kesalahan. Silakan coba lagi."
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="page-enter space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <RoleGate
        allowedRoles={["OWNER", "MANAGER"]}
        fallback={
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <AlertTriangle className="h-12 w-12 text-[var(--color-warning-text)] mb-4" />
            <h2 className="text-xl font-bold text-[var(--color-text)]">Akses Ditolak</h2>
            <p className="mt-2 text-[var(--color-text-secondary)]">
              Anda tidak memiliki izin untuk melihat halaman pengaturan bisnis ini.
            </p>
          </div>
        }
      >
        <PageHeader
          variant="hero"
          title="Atur Cara Kerja Bisnis Anda"
          description="Halaman ini menjadi sumber data utama (source of truth) untuk form publik, order admin, kalender, dan ketersediaan slot bisnis."
          badge={
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.08] px-3.5 py-1 text-xs font-bold tracking-wider text-[var(--color-gold-300)] border border-white/[0.1] backdrop-blur-md uppercase">
              <Settings className="h-3.5 w-3.5 animate-spin-slow text-[var(--color-accent)]" />
              Pengaturan Operasional
            </span>
          }
          action={
            <div className="flex flex-wrap gap-2.5 xl:shrink-0">
              <Badge tone="info" className="bg-white/10 text-white border-white/20 px-3 py-1 text-xs font-bold">
                Mode: {form.mode === "BOOKING_SERVICE" ? "Booking Jasa" : "Request Order"}
              </Badge>
              <Badge
                tone={usesResources ? "warning" : "success"}
                className="bg-white/10 text-white border-white/20 px-3 py-1 text-xs font-bold"
              >
                {usesResources ? `${form.resourceLabel || "Unit"} Aktif` : "Tanpa Unit Khusus"}
              </Badge>
            </div>
          }
        />

        {/* Tabs Navigation */}
        {canWriteSettings && (
          <div className="flex border-b border-[var(--color-border)] gap-2 animate-fade-up">
            <button
              type="button"
              onClick={() => setActiveTab("operational")}
              className={cn(
                "px-5 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all duration-200 focus:outline-none",
                activeTab === "operational"
                  ? "border-[var(--color-primary)] text-[var(--color-primary)] font-extrabold"
                  : "border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
              )}
            >
              Operasional Bisnis
            </button>
            {hasPermission("team:view") && (
              <button
                type="button"
                onClick={() => setActiveTab("team")}
                className={cn(
                  "px-5 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all duration-200 focus:outline-none",
                  activeTab === "team"
                    ? "border-[var(--color-primary)] text-[var(--color-primary)] font-extrabold"
                    : "border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
                )}
              >
                Manajemen Tim
              </button>
            )}
          </div>
        )}

        {activeTab === "operational" && (
          <>
            <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr] animate-fade-up-delay-1">
              <GeneralSettingsTab
                form={form}
                errors={errors}
                updateForm={updateForm}
                setForm={setForm}
                buildResources={buildResources}
              />
              <OperationalSettingsTab
                form={form}
                errors={errors}
                modeOptions={modeOptions}
                usesResources={usesResources}
                updateForm={updateForm}
                setForm={setForm}
                buildResources={buildResources}
              />
            </section>

            {usesResources && (
              <ResourceSettingsTab
                form={form}
                errors={errors}
                referencedResourceIds={referencedResourceIds}
                setForm={setForm}
                buildResources={buildResources}
              />
            )}

            <CatalogSettingsTab form={form} errors={errors} setForm={setForm} />

            <section className="animate-fade-up">
              <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
                <div className="space-y-4 p-5">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <h2 className="text-base font-bold text-[var(--color-text)]">Konfirmasi Penyimpanan</h2>
                      <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                        Perubahan pengaturan ini langsung memengaruhi form pemesanan pelanggan, dashboard, dan ketersediaan slot kalender secara realtime.
                      </p>
                    </div>
                    {business.operationalModel === "RESOURCE_BOOKING" && form.operationalModel === "APPOINTMENT" ? (
                      <Badge tone="warning" className="font-extrabold text-[9px] uppercase tracking-wider">
                        Perpindahan Model Operasional
                      </Badge>
                    ) : null}
                  </div>

                  {business.operationalModel === "RESOURCE_BOOKING" && form.operationalModel === "APPOINTMENT" ? (
                    <div className="rounded-2xl border border-[var(--color-warning-border)] bg-[var(--color-warning-surface)] p-4 text-xs text-[var(--color-warning-text)] leading-relaxed flex items-start gap-3">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                      <p>
                        Unit/slot yang sudah ada sebelumnya tidak akan dihapus. Riwayat pemesanan lama tetap tersimpan dengan baik, namun pemesanan baru yang masuk setelah ini hanya akan dialokasikan ke jadwal global tanpa penugasan unit tertentu.
                      </p>
                    </div>
                  ) : null}

                  <div className="pt-2">
                    <Button
                      type="button"
                      isLoading={isSaving}
                      onClick={() => void handleSave()}
                      className="font-bold text-sm px-6 py-2.5 rounded-xl"
                    >
                      Simpan Semua Pengaturan
                    </Button>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}

        {activeTab === "team" && hasPermission("team:view") && (
          <div className="animate-fade-up space-y-6">
            <TeamList
              members={teamMembers}
              onEdit={(member) => {
                setEditingMember(member);
                setIsEditOpen(true);
              }}
              onOpenInvite={() => setIsInviteOpen(true)}
              showActions={hasPermission("team:manage")}
            />
          </div>
        )}

        <InviteMemberSheet
          isOpen={isInviteOpen}
          onClose={() => setIsInviteOpen(false)}
          onInvited={() => {
            refetchTeam();
            toast.success("Undangan dibuat", "Link undangan berhasil dibuat. Kirimkan ke karyawan via WhatsApp.");
          }}
          businessName={business.name}
        />

        <EditMemberSheet
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          member={editingMember}
          onUpdate={async (memberId, updates) => {
            try {
              await teamService.updateMember(memberId, updates);
              refetchTeam();
              toast.success("Perubahan disimpan", "Data anggota tim berhasil diperbarui.");
            } catch (e) {
              const error = e as Error;
              toast.error("Gagal menyimpan", error.message || "Terjadi kesalahan.");
              throw error;
            }
          }}
          onDelete={async (memberId) => {
            try {
              await teamService.deleteMember(memberId);
              refetchTeam();
              toast.success("Karyawan dihapus", "Anggota tim berhasil dikeluarkan.");
            } catch (e) {
              const error = e as Error;
              toast.error("Gagal menghapus", error.message || "Terjadi kesalahan.");
              throw error;
            }
          }}
        />
      </RoleGate>
    </main>
  );
}
