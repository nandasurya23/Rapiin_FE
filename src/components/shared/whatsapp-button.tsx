"use client";

import { MessageCircleMore } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast-provider";
import { buildWhatsAppUrl, isValidWhatsappNumber } from "@/lib/whatsapp";

type WhatsAppButtonProps = {
  phoneNumber: string;
  message: string;
  label: string;
  className?: string;
};

export function WhatsAppButton({ phoneNumber, message, label, className }: WhatsAppButtonProps) {
  const toast = useToast();
  const valid = isValidWhatsappNumber(phoneNumber);

  function handleClick() {
    if (!valid) {
      toast.error("Nomor WhatsApp belum valid", "Periksa nomor customer sebelum buka chat.");
      return;
    }

    window.open(buildWhatsAppUrl(phoneNumber, message), "_blank", "noopener,noreferrer");
    toast.info("WhatsApp dibuka", "Chat akan terbuka di tab baru.");
  }

  return (
    <Button type="button" variant="secondary" className={className} onClick={handleClick}>
      <MessageCircleMore className="h-4 w-4" />
      {label}
    </Button>
  );
}
