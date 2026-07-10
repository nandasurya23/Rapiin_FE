"use client";

import { AlertTriangle, CloudUpload, WalletCards, X } from "lucide-react";
import { Button, LinkButton } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast-provider";
import { ROUTES } from "@/lib/routes";
import { PLAN_LABELS } from "@/lib/constants/subscription";
import { getDaysUntilExpiry, isTrialWarningActive } from "@/lib/subscription";
import { useAppData } from "@/components/providers/app-data-provider";
import { cn } from "@/lib/cn";
import { useState, useEffect } from "react";

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

  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (business?.id) {
      const isDismissed = window.localStorage.getItem(`rapiin-dismiss-limit-warning-${business.id}`) === "true";
      setDismissed(isDismissed);
    }
  }, [business?.id]);

  if (isSuperAdmin || !subscriptionForCurrentBusiness) {
    return null;
  }

  const daysLeft = getDaysUntilExpiry(subscriptionForCurrentBusiness);
  const showWarning = isTrialWarningActive(subscriptionForCurrentBusiness);
  const isReadOnly = Boolean(readOnlyReason);

  // Trigger warning only if customer count is at 90% or more of the plan limit
  const isAlmostFull = currentBusinessUsage.limit > 0 && 
    currentBusinessUsage.used > 0 &&
    currentBusinessUsage.used >= Math.floor(currentBusinessUsage.limit * 0.9);

  // If there's no reason to show the banner at all
  if (
    !isReadOnly &&
    !showWarning &&
    !isAlmostFull &&
    subscriptionForCurrentBusiness.hasCompletedRequiredBackup
  ) {
    return null;
  }

  // If the owner dismissed the warning and it's not a read-only hard block, don't show it
  if (dismissed && !isReadOnly) {
    return null;
  }

  const handleDismiss = () => {
    if (business?.id) {
      window.localStorage.setItem(`rapiin-dismiss-limit-warning-${business.id}`, "true");
      setDismissed(true);
    }
  };

  return (
    <div
      className={cn(
        "border-b px-4 py-3 sm:px-6 lg:px-8 relative",
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
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between pr-8">
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
                "text-sm font-bold",
                isReadOnly ? "text-[var(--color-danger-text)]" : "text-[var(--color-warning-text)]"
              )}
            >
              {readOnlyReason
                ? readOnlyReason
                : showWarning
                  ? `Trial ${PLAN_LABELS[subscriptionForCurrentBusiness.planCode]} tersisa ${daysLeft} hari`
                  : `Kuota pelanggan hampir penuh: ${currentBusinessUsage.used}/${currentBusinessUsage.limit}`}
            </p>
            <p
              className={cn(
                "text-xs leading-relaxed",
                isReadOnly ? "text-[var(--color-danger-text)]/70" : "text-[var(--color-warning-text)]/70"
              )}
            >
              {!subscriptionForCurrentBusiness.hasCompletedRequiredBackup
                ? "Lakukan backup database untuk mengamankan data Anda sebelum melanjutkan upgrade."
                : "Silakan ajukan upgrade plan untuk meningkatkan limit dan menjaga kelancaran operasional bisnis."}
            </p>
          </div>
        </div>

        {/* Right: actions */}
        <div className="flex flex-wrap items-center gap-2">
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
              Backup Sekarang
            </Button>
          ) : null}
          <LinkButton href={ROUTES.plan(business.slug)} size="sm">
            <WalletCards className="h-4 w-4" />
            Upgrade Plan
          </LinkButton>
        </div>
      </div>

      {/* Dismiss Button (only show for non-critical warnings) */}
      {!isReadOnly && (
        <button
          type="button"
          onClick={handleDismiss}
          className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-lg text-[var(--color-text-muted)] hover:bg-black/5 hover:text-[var(--color-text)] transition-colors"
          title="Tutup peringatan"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
