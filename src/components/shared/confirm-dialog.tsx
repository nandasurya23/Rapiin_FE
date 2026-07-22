"use client";

import { AlertTriangle, Info, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "info";
  isLoading?: boolean;
  onConfirm: () => void | Promise<void>;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Konfirmasi",
  cancelLabel = "Batal",
  variant = "danger",
  isLoading = false,
  onConfirm,
}: ConfirmDialogProps) {
  const isDanger = variant === "danger";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                isDanger
                  ? "bg-red-100 text-red-600"
                  : variant === "warning"
                  ? "bg-amber-100 text-amber-600"
                  : "bg-blue-100 text-blue-600"
              }`}
            >
              {isDanger || variant === "warning" ? (
                <AlertTriangle className="h-5 w-5" />
              ) : (
                <Info className="h-5 w-5" />
              )}
            </div>
            <div>
              <DialogTitle>{title}</DialogTitle>
              <DialogDescription className="mt-1 text-sm text-[var(--color-text-muted)]">
                {description}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <DialogFooter className="mt-4 flex gap-2 justify-end">
          <Button
            type="button"
            variant="secondary"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={isDanger ? "danger" : "primary"}
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
