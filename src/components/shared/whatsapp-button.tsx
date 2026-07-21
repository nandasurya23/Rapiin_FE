"use client";

import { useState, useEffect } from "react";
import { MessageCircleMore, X, Copy, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast-provider";
import { buildWhatsAppUrl, isValidWhatsappNumber } from "@/lib/whatsapp";
import { cn } from "@/lib/cn";

type WhatsAppButtonProps = {
 phoneNumber: string;
 message: string;
 label: string;
 className?: string;
};

export function WhatsAppButton({ phoneNumber, message, label, className }: WhatsAppButtonProps) {
 const toast = useToast();
 const [isOpen, setIsOpen] = useState(false);
 const [draftMessage, setDraftMessage] = useState(message);
 const valid = isValidWhatsappNumber(phoneNumber);

 useEffect(() => {
  setDraftMessage(message);
 }, [message]);

 function handleClick() {
  if (!valid) {
   toast.error("Nomor WhatsApp belum valid", "Periksa nomor customer sebelum buka chat.");
   return;
  }
  setIsOpen(true);
 }

 async function handleCopy() {
  try {
   await navigator.clipboard.writeText(draftMessage);
   toast.success("Draf berhasil disalin!");
  } catch {
   toast.error("Gagal menyalin draf.");
  }
 }

 return (
  <>
   <Button type="button" variant="secondary" className={className} onClick={handleClick}>
    <MessageCircleMore className="h-4 w-4" />
    {label}
   </Button>

   {isOpen && (
    /* ── MODAL OVERLAY ───────────────────────────── */
    <div
     className="fixed inset-0 z-50 flex items-center justify-center p-4"
     style={{ background: "rgba(14, 37, 84, 0.45)" }}
     onClick={(e) => {
      if (e.target === e.currentTarget) setIsOpen(false);
     }}
    >
     <div
      className={cn(
       "w-full max-w-lg",
       "rounded-[var(--radius-xl)]",
       "border border-[var(--color-border-strong)]",
       "bg-[var(--color-surface)]",
       "shadow-[var(--shadow-modal)]",
       "animate-scale-in"
      )}
     >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-4">
       <div>
        <h3 className="text-base font-semibold text-[var(--color-text)]">
         Tinjau &amp; Kirim Draf WhatsApp
        </h3>
        <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
         Sesuaikan isi pesan sebelum dikirim ke customer.
        </p>
       </div>
       <button
        type="button"
        onClick={() => setIsOpen(false)}
        className={cn(
         "flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)]",
         "text-[var(--color-text-muted)]",
         "hover:bg-[var(--state-hover-bg)] hover:text-[var(--color-text)]",
         "transition-colors duration-[var(--transition-fast)]"
        )}
       >
        <X className="h-4 w-4" />
       </button>
      </div>

      {/* Body */}
      <div className="space-y-4 p-5">
       {/* Phone number */}
       <div>
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
         Nomor Tujuan
        </p>
        <p className="font-mono text-sm font-medium text-[var(--color-text)]">
         {phoneNumber}
        </p>
       </div>

       {/* Message textarea */}
       <div>
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
         Isi Pesan
        </p>
        <textarea
         value={draftMessage}
         onChange={(e) => setDraftMessage(e.target.value)}
         rows={6}
         className={cn(
          "w-full resize-y px-3.5 py-2.5 text-sm",
          "rounded-[var(--radius-md)]",
          "border border-[var(--color-border)]",
          "bg-[var(--color-surface-elevated)]",
          "text-[var(--color-text)]",
          "placeholder:text-[var(--color-text-muted)]",
          "outline-none",
          "transition-all duration-[var(--transition-fast)]",
          "focus:border-[var(--color-border-focus)] focus:ring-3 focus:ring-[var(--state-focus-ring)]"
         )}
        />
       </div>

       {/* Actions */}
       <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="secondary" onClick={() => void handleCopy()}>
         <Copy className="h-4 w-4" />
         Salin Pesan
        </Button>
        <Button
         type="button"
         onClick={() => {
          window.open(buildWhatsAppUrl(phoneNumber, draftMessage), "_blank", "noopener,noreferrer");
          setIsOpen(false);
         }}
        >
         <ExternalLink className="h-4 w-4" />
         Kirim ke WhatsApp
        </Button>
       </div>
      </div>
     </div>
    </div>
   )}
  </>
 );
}
