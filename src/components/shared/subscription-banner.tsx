"use client";

import { AlertTriangle, CloudUpload, WalletCards, X } from "lucide-react";
import { Button, LinkButton } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast-provider";
import { ROUTES } from "@/lib/routes";
import { PLAN_LABELS } from "@/lib/constants/subscription";
import { getDaysUntilExpiry, isTrialWarningActive } from "@/lib/subscription";
import { useAppData } from "@/components/providers/app-data-provider";
import { cn } from "@/lib/cn";

export function SubscriptionBanner() {
  const toast = useToast();
  const {
    isSuperAdmin,
    subscriptionForCurrentBusiness,
    currentBusinessUsage,
    createBackup,
    readOnlyReason,
    business,
  } = useAppData();

  if (isSuperAdmin || !subscriptionForCurrentBusiness) {
    return null;
  }

  const daysLeft = getDaysUntilExpiry(subscriptionForCurrentBusiness);
  const showWarning = isTrialWarningActive(subscriptionForCurrentBusiness);

  if (
    !readOnlyReason &&
    !showWarning &&
    currentBusinessUsage.used < Math.max(currentBusinessUsage.limit - 20, 0) &&
    subscriptionForCurrentBusiness.hasCompletedRequiredBackup
  ) {
    return null;
  }

  const isReadOnly = Boolean(readOnlyReason);

  return (
    <div
      className={cn(
        "border-b px-4 py-3 sm:px-6 lg:px-8",
        isReadOnly
          ? [
              "bg-[var(--color-danger-surface)]",
              "border-[var(--color-danger-border)]",
            ]
          : [
              "bg-[var(--color-warning-surface)]",
              "border-[var(--color-warning-border)]",
            ]
      )}
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {/* Left: icon + text */}
        <div className="flex items-start gap-3">
          <AlertTriangle
            className={cn(
              "mt-0.5 h-4 w-4 shrink-0",
              isReadOnly ? "text-[var(--color-danger)]" : "text-[var(--color-warning)]"
            )}
          />
          <div className="space-y-0.5">
            <p
              className={cn(
                "text-sm font-medium",
                isReadOnly ? "text-[var(--color-danger-text)]" : "text-[var(--color-warning-text)]"
              )}
            >
              {readOnlyReason
                ? readOnlyReason
                : showWarning
                  ? `Trial ${PLAN_LABELS[subscriptionForCurrentBusiness.planCode]} tersisa ${daysLeft} hari`
                  : `Customer hampir penuh: ${currentBusinessUsage.used}/${currentBusinessUsage.limit}`}
            </p>
            <p
              className={cn(
                "text-xs",
                isReadOnly ? "text-[var(--color-danger-text)]/70" : "text-[var(--color-warning-text)]/70"
              )}
            >
              {!subscriptionForCurrentBusiness.hasCompletedRequiredBackup
                ? "Backup data dulu supaya data bisnis tetap aman sebelum masa trial selesai."
                : "Kalau bisnis sudah rutin dipakai, ajukan upgrade supaya flow tetap lancar."}
            </p>
          </div>
        </div>

        {/* Right: actions */}
        <div className="flex flex-wrap gap-2">
          {!subscriptionForCurrentBusiness.hasCompletedRequiredBackup ? (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => {
                createBackup();
                toast.success("Backup berhasil dibuat", "Snapshot lokal tersimpan.");
              }}
            >
              <CloudUpload className="h-4 w-4" />
              Backup sekarang
            </Button>
          ) : null}
          <LinkButton href={ROUTES.plan(business.slug)} size="sm">
            <WalletCards className="h-4 w-4" />
            Lihat plan
          </LinkButton>
        </div>
      </div>
    </div>
  );
}
