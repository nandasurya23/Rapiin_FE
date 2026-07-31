import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button, LinkButton } from "@/components/ui/button";
import { ROUTES } from "@/lib/routes";
import { useAppData } from "@/components/providers/app-data-provider";
import { Sparkles, X } from "lucide-react";
import { cn } from "@/lib/cn";

export type UpgradeModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
};

export function UpgradeModal({ isOpen, onClose, title, description }: UpgradeModalProps) {
  const { business } = useAppData();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-[var(--color-surface)] border-[var(--color-border)]">
        <div className="absolute top-4 right-4 z-10">
          <button 
            onClick={onClose}
            className="rounded-full bg-black/10 p-1.5 hover:bg-black/20 text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        
        <div className="relative pt-12 pb-6 px-6 sm:px-8 text-center flex flex-col items-center">
          <div className="absolute inset-0 bg-gradient-to-b from-[var(--color-gold-400)]/10 to-transparent pointer-events-none" />
          
          <div className="relative mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--color-gold-300)] to-[var(--color-gold-500)] shadow-lg">
            <Sparkles className="h-8 w-8 text-[var(--color-navy-900)] animate-pulse" />
            <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/20 pointer-events-none" />
          </div>

          <DialogHeader className="space-y-3 relative z-10">
            <DialogTitle className="text-xl sm:text-2xl font-black tracking-tight text-[var(--color-text)] text-center">
              {title}
            </DialogTitle>
            <DialogDescription className="text-sm sm:text-base leading-relaxed text-[var(--color-text-secondary)] text-center max-w-[280px] mx-auto">
              {description}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="mt-8 w-full sm:justify-center relative z-10 flex flex-col gap-3">
            <LinkButton 
              href={ROUTES.plan(business.slug)}
              onClick={onClose}
              variant="accent" 
              className="w-full text-sm font-bold shadow-md hover:shadow-lg transition-shadow border-none"
            >
              Lihat Pilihan Paket
            </LinkButton>
            <Button 
              variant="ghost" 
              onClick={onClose} 
              className="w-full text-xs font-semibold text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
            >
              Mungkin Nanti
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
