import { useState } from "react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, AlertTriangle, FileImage, ExternalLink, Loader2, Star, Sparkles } from "lucide-react";
import { useToast } from "@/components/ui/toast-provider";
import { apiFetch } from "@/lib/api-client";
import { formatCurrency, formatDate } from "@/lib/format";
import type { Payment, OCRResult } from "@/types/order";

interface PaymentVerificationPanelProps {
  payment: Payment;
  invoiceAmount: number;
  onVerifySuccess: () => void;
}

export function PaymentVerificationPanel({ payment, invoiceAmount, onVerifySuccess }: PaymentVerificationPanelProps) {
  const [isVerifying, setIsVerifying] = useState(false);
  const toast = useToast();
  const ocrResult = payment.proof?.ocrResult;

  const handleVerify = async (action: "APPROVE" | "REJECT") => {
    setIsVerifying(true);
    try {
      await apiFetch(`/api/payments/${payment.id}/verify`, {
        method: "POST",
        body: JSON.stringify({ action }),
      });
      toast.success(action === "APPROVE" ? "Pembayaran disetujui" : "Pembayaran ditolak");
      onVerifySuccess();
    } catch (err: unknown) {
      toast.error("Gagal memverifikasi pembayaran", (err as Error).message || "");
    } finally {
      setIsVerifying(false);
    }
  };

  const getMatchBadge = (status?: OCRResult["matchStatus"]) => {
    switch (status) {
      case "MATCH":
        return <Badge tone="success" className="text-[10px]">COCOK</Badge>;
      case "PARTIAL_MATCH":
        return <Badge tone="warning" className="text-[10px]">COCOK SEBAGIAN</Badge>;
      case "MISMATCH":
        return <Badge tone="danger" className="text-[10px]">TIDAK COCOK</Badge>;
      default:
        return <Badge tone="neutral" className="text-[10px]">BELUM DICEK</Badge>;
    }
  };

  const metadata = ocrResult?.metadata as Record<string, string> | undefined;
  const rating = ocrResult?.recommendationRating;

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden">
      <div className="bg-[var(--color-surface-elevated)] p-4 border-b border-[var(--color-border)] flex items-center justify-between">
        <div>
          <h3 className="font-bold text-sm text-[var(--color-text)]">Verifikasi Bukti Transfer</h3>
          <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
            Diunggah pada: {formatDate(payment.createdAt)}
          </p>
        </div>
        {payment.status === "PENDING" && <Badge tone="warning">MENUNGGU VERIFIKASI</Badge>}
        {payment.status === "VERIFIED" && <Badge tone="success">DISETUJUI</Badge>}
        {payment.status === "REJECTED" && <Badge tone="danger">DITOLAK</Badge>}
      </div>

      <div className="p-4 grid md:grid-cols-2 gap-6">
        {/* Kolom Kiri: Gambar Bukti Transfer */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">Gambar Asli</span>
            {payment.proof?.fileUrl && (
              <a href={payment.proof.fileUrl} target="_blank" rel="noreferrer" className="text-xs text-[var(--color-primary)] font-medium hover:underline inline-flex items-center gap-1">
                Buka Penuh <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
          
          <div className="aspect-[3/4] rounded-lg border border-[var(--color-border)] overflow-hidden bg-black/5 flex items-center justify-center relative">
            {payment.proof?.fileUrl ? (
              <Image 
                src={payment.proof.fileUrl} 
                alt="Bukti Transfer" 
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            ) : (
              <div className="text-center text-[var(--color-text-muted)]">
                <FileImage className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Gambar tidak tersedia</p>
              </div>
            )}
          </div>
        </div>

        {/* Kolom Kanan: Hasil OCR & Aksi */}
        <div className="flex flex-col h-full">
          <div className="space-y-4 flex-grow">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">Hasil Ekstraksi OCR</span>
            
            {!ocrResult ? (
              <div className="bg-[var(--color-surface-elevated)] rounded-lg p-6 text-center border border-[var(--color-border)]">
                <Loader2 className="h-8 w-8 text-[var(--color-text-muted)] mx-auto animate-spin mb-2" />
                <p className="text-sm text-[var(--color-text-secondary)]">Sedang memproses gambar...</p>
              </div>
            ) : (
              <div className="space-y-3 bg-[var(--color-surface-elevated)] p-4 rounded-lg border border-[var(--color-border)]">
                <div className="flex justify-between items-center pb-3 border-b border-[var(--color-border)]">
                  <div>
                    <span className="block text-[10px] text-[var(--color-text-secondary)]">Status Kecocokan</span>
                    {getMatchBadge(ocrResult.matchStatus)}
                  </div>
                  <div className="text-right">
                    <span className="block text-[10px] text-[var(--color-text-secondary)]">Skor Kepercayaan</span>
                    <span className="text-xs font-bold font-mono">{(ocrResult.confidenceScore * 100).toFixed(1)}%</span>
                  </div>
                </div>

                {rating ? (
                  <div className="flex items-center gap-2 p-2 bg-[var(--color-primary)]/10 rounded border border-[var(--color-primary)]/20 mb-2">
                    <Sparkles className="h-4 w-4 text-[var(--color-primary)]" />
                    <div className="flex-1">
                      <span className="text-[10px] block text-[var(--color-primary)] font-bold uppercase">Smart Recommendation</span>
                      <div className="flex items-center gap-1 mt-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star 
                            key={star} 
                            className={`h-3 w-3 ${star <= rating ? "fill-yellow-400 text-yellow-400" : "text-[var(--color-border)]"}`} 
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                ) : null}

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="block text-[10px] text-[var(--color-text-secondary)]">Nominal Invoice</span>
                    <span className="font-bold text-[var(--color-text)]">Rp {formatCurrency(invoiceAmount)}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-[var(--color-text-secondary)]">Nominal Terbaca OCR</span>
                    {ocrResult.extractedAmount ? (
                      <span className={`font-bold ${ocrResult.extractedAmount === invoiceAmount ? "text-[var(--color-success)]" : "text-[var(--color-danger)]"}`}>
                        Rp {formatCurrency(ocrResult.extractedAmount)}
                      </span>
                    ) : (
                      <span className="text-[var(--color-text-muted)] italic">Tidak terdeteksi</span>
                    )}
                  </div>
                  
                  <div className="col-span-1">
                    <span className="block text-[10px] text-[var(--color-text-secondary)]">Tanggal Transfer</span>
                    <span className="font-medium">{ocrResult.transferDate || <span className="text-[var(--color-text-muted)] italic">Tidak terdeteksi</span>}</span>
                  </div>

                  <div className="col-span-1">
                    <span className="block text-[10px] text-[var(--color-text-secondary)]">Metode/Bank</span>
                    <span className="font-medium">{metadata?.paymentType || ocrResult.bankName || <span className="text-[var(--color-text-muted)] italic">Tidak terdeteksi</span>}</span>
                  </div>

                  {metadata?.transactionStatus && (
                    <div className="col-span-2">
                      <span className="block text-[10px] text-[var(--color-text-secondary)]">Status Ekstraksi (Dari Gambar)</span>
                      <Badge tone="neutral" className="text-[10px] mt-0.5">{metadata.transactionStatus}</Badge>
                    </div>
                  )}
                </div>
              </div>
            )}

            {payment.status === "PENDING" && ocrResult && ocrResult.matchStatus === "MISMATCH" && (
              <div className="flex items-start gap-2 bg-[var(--color-warning-surface)] text-[var(--color-warning-text)] p-3 rounded-lg border border-[var(--color-warning-border)] text-xs mt-4">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <p>Nominal yang terbaca tidak sama dengan tagihan. Mohon periksa gambar secara manual sebelum menyetujui.</p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          {payment.status === "PENDING" && (
            <div className="grid grid-cols-2 gap-3 mt-6 pt-4 border-t border-[var(--color-border)]">
              <Button 
                variant="danger" 
                className="w-full font-bold"
                onClick={() => handleVerify("REJECT")}
                disabled={isVerifying}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Tolak
              </Button>
              <Button 
                variant="primary"
                className="w-full font-bold bg-[var(--color-success)] hover:bg-[var(--color-success)]/90 text-white"
                onClick={() => handleVerify("APPROVE")}
                disabled={isVerifying}
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Setujui
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
