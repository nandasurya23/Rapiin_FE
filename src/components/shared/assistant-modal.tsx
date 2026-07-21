"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X, Sparkles } from "lucide-react";
import { useAppData } from "@/components/providers/app-data-provider";
import { cn } from "@/lib/cn";

type AssistantModalProps = {
 isOpen: boolean;
 onClose: () => void;
};

export function AssistantModal({ isOpen, onClose }: AssistantModalProps) {
 const { subscriptionForCurrentBusiness } = useAppData();
 const planCode = subscriptionForCurrentBusiness?.planCode || "FREE_TRIAL";
 const modalRef = useRef<HTMLDivElement>(null);

 // Close on ESC key
 useEffect(() => {
  function handleKeyDown(e: KeyboardEvent) {
   if (e.key === "Escape") {
    onClose();
   }
  }
  window.addEventListener("keydown", handleKeyDown);
  return () => window.removeEventListener("keydown", handleKeyDown);
 }, [onClose]);

 if (!isOpen) return null;
 if (planCode !== "PREMIUM") return null;

 const modalContent = (
  <div
   className="fixed inset-0 z-[9999] flex items-start justify-center p-4 pt-16 sm:pt-24 bg-slate-950/80 backdrop-blur-md transition-all animate-in fade-in duration-200"
   onClick={(e) => {
    if (e.target === e.currentTarget) onClose();
   }}
  >
   <div
    ref={modalRef}
    className={cn(
     "w-full max-w-md overflow-hidden flex flex-col rounded-2xl relative animate-in zoom-in-95 duration-200",
     "bg-gradient-to-br from-[#0c1d3b] via-[#122a57] to-[#09152b] text-white",
     "border border-white/[0.08] shadow-[var(--shadow-modal)]"
    )}
   >
    <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600" />
    
    {/* Header with Close */}
    <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.06]">
     <div className="flex items-center gap-2">
      <Sparkles className="h-4.5 w-4.5 text-amber-400 animate-pulse" />
      <span className="text-xs font-black uppercase tracking-wider text-amber-300">Asisten Pintar</span>
     </div>
     <button
      onClick={onClose}
      className="p-1.5 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition"
     >
      <X className="h-4.5 w-4.5" />
     </button>
    </div>

    {/* Coming Soon Content */}
    <div className="p-8 text-center space-y-5">
     <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/25">
      <Sparkles className="h-7 w-7 text-amber-400 animate-pulse" />
     </div>
     
     <div className="space-y-1.5">
      <h3 className="text-xl font-black tracking-tight">Coming Soon</h3>
      <p className="text-xs font-bold text-amber-400 uppercase tracking-widest">Premium Plan Exclusive</p>
     </div>
     
     <p className="text-xs text-white/70 leading-relaxed max-w-xs mx-auto">
      Fitur <strong>Asisten Pintar (Assistant Manager)</strong> sedang dalam pengembangan dan akan segera hadir secara eksklusif untuk pengguna paket <strong>Premium</strong>.
     </p>
     
     <div className="pt-2">
      <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.05] px-3.5 py-1.5 text-[10px] font-medium text-white/50 border border-white/[0.08]">
       <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-ping" />
       Sedang disempurnakan oleh tim Rapiin
      </span>
     </div>
    </div>
   </div>
  </div>
 );

 return createPortal(modalContent, document.body);
}
