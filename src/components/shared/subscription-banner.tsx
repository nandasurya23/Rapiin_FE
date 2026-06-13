"use client";

import { AlertTriangle, CloudUpload, WalletCards } from "lucide-react";
import { Button, LinkButton } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast-provider";
import { ROUTES } from "@/lib/routes";
import { PLAN_LABELS } from "@/lib/constants/subscription";
import { getDaysUntilExpiry, isTrialWarningActive } from "@/lib/subscription";
import { useAppData } from "@/components/providers/app-data-provider";

export function SubscriptionBanner() {
  const toast = useToast();
  const { isSuperAdmin, subscriptionForCurrentBusiness, currentBusinessUsage, createBackup, readOnlyReason } = useAppData();

  if (isSuperAdmin || !subscriptionForCurrentBusiness) {
    return null;
  }

  const daysLeft = getDaysUntilExpiry(subscriptionForCurrentBusiness);
  const showWarning = isTrialWarningActive(subscriptionForCurrentBusiness);

  if (!readOnlyReason && !showWarning && currentBusinessUsage.used < Math.max(currentBusinessUsage.limit - 20, 0) && subscriptionForCurrentBusiness.hasCompletedRequiredBackup) {
    return null;
  }

  return (
    <div className="border-b border-amber-200 bg-amber-50/90 px-4 py-3 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-700" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-amber-900">
              {readOnlyReason
                ? readOnlyReason
                : showWarning
                  ? `Trial ${PLAN_LABELS[subscriptionForCurrentBusiness.planCode]} tersisa ${daysLeft} hari`
                  : `Customer hampir penuh: ${currentBusinessUsage.used}/${currentBusinessUsage.limit}`}
            </p>
            <p className="text-xs text-amber-800">
              {!subscriptionForCurrentBusiness.hasCompletedRequiredBackup
                ? "Backup data dulu supaya data bisnis tetap aman sebelum masa trial selesai."
                : "Kalau bisnis sudah rutin dipakai, ajukan upgrade supaya flow tetap lancar."}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {!subscriptionForCurrentBusiness.hasCompletedRequiredBackup ? (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => {
                createBackup();
                toast.success("Backup berhasil dibuat", "Snapshot lokal tersimpan untuk jaga data trial.");
              }}
            >
              <CloudUpload className="h-4 w-4" />
              Backup sekarang
            </Button>
          ) : null}
          <LinkButton href={ROUTES.plan} size="sm">
            <WalletCards className="h-4 w-4" />
            Lihat plan
          </LinkButton>
        </div>
      </div>
    </div>
  );
}
