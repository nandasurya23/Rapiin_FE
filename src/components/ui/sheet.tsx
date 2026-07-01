import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";

interface SheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  description?: string;
  side?: "right" | "left";
  className?: string;
}

export function Sheet({
  isOpen,
  onClose,
  children,
  title,
  description,
  side = "right",
  className,
}: SheetProps) {
  const [isMounted, setIsMounted] = useState(false);

  // Prevent scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleEscape);
    }
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex pointer-events-none",
        isOpen ? "pointer-events-auto" : "",
        side === "right" ? "justify-end" : "justify-start"
      )}
    >
      {/* Backdrop */}
      <div
        className={cn(
          "absolute inset-0 bg-[var(--color-surface)]/80 backdrop-blur-sm transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className={cn(
          "relative flex h-full w-full max-w-md flex-col bg-[var(--color-surface)] shadow-2xl transition-transform duration-300 ease-in-out sm:max-w-xl border-l border-[var(--color-border)]",
          side === "right"
            ? isOpen
              ? "translate-x-0"
              : "translate-x-full"
            : isOpen
              ? "translate-x-0"
              : "-translate-x-full",
          className
        )}
      >
        {/* Header */}
        <div className="flex flex-col gap-1 border-b border-[var(--color-border)] px-6 py-5">
          <div className="flex items-center justify-between">
            {title && <h2 className="text-xl font-black text-[var(--color-text)] tracking-tight">{title}</h2>}
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-2 text-[var(--color-text-secondary)] bg-[var(--color-surface-elevated)] hover:bg-[var(--color-border)] hover:text-[var(--color-text)] transition-colors focus:outline-none"
            >
              <X className="h-5 w-5" />
              <span className="sr-only">Tutup</span>
            </button>
          </div>
          {description && <p className="text-sm text-[var(--color-text-secondary)]">{description}</p>}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 no-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
}
