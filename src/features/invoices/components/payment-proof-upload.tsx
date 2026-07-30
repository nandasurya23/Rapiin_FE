import { useState, useRef } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Upload, X, FileImage, CheckCircle, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/toast-provider";
import { apiFetch } from "@/lib/api-client";
import { Badge } from "@/components/ui/badge";

interface PaymentProofUploadProps {
  invoiceId: string;
  isPro: boolean;
}

export function PaymentProofUpload({ invoiceId, isPro }: PaymentProofUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (!selected.type.startsWith("image/")) {
      toast.error("Hanya file gambar yang diperbolehkan.");
      return;
    }

    if (selected.size > 5 * 1024 * 1024) {
      toast.error("Ukuran file maksimal 5MB.");
      return;
    }

    setFile(selected);
    const objectUrl = URL.createObjectURL(selected);
    setPreviewUrl(objectUrl);
  };

  const handleClear = () => {
    setFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      await apiFetch(`/api/public/invoice/${invoiceId}/payment-proof`, {
        method: "POST",
        body: formData,
      });

      setIsSuccess(true);
      toast.success("Bukti transfer berhasil diunggah.");
    } catch (error: unknown) {
      toast.error("Gagal mengunggah bukti transfer", (error as Error).message || "");
    } finally {
      setIsUploading(false);
    }
  };

  if (!isPro) {
    // Free plan behavior: Don't show OCR upload, just fallback text.
    // The user might be the owner previewing it, so we show a PRO badge.
    return (
      <div className="bg-[var(--color-surface)]/60 backdrop-blur-md p-4 rounded-xl border border-[var(--color-border)] text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Badge tone="info" className="text-[10px]">PRO</Badge>
          <span className="text-sm font-bold">Auto-Verifikasi Bukti Transfer</span>
        </div>
        <p className="text-xs text-[var(--color-text-secondary)] mb-3">
          Fitur cerdas membaca nominal bukti transfer secara otomatis hanya tersedia di Paket Pro.
        </p>
        <p className="text-sm font-medium text-[var(--color-text-secondary)]">
          Silakan kirimkan bukti transfer Anda secara manual melalui tombol WhatsApp di atas.
        </p>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="bg-[var(--color-success-surface)] p-6 rounded-xl border border-[var(--color-success-border)] flex flex-col items-center text-center space-y-3">
        <div className="h-12 w-12 rounded-full bg-[var(--color-success)] flex items-center justify-center text-white">
          <CheckCircle className="h-6 w-6" />
        </div>
        <div>
          <h4 className="text-[var(--color-success-text)] font-bold">Bukti Sedang Diverifikasi</h4>
          <p className="text-xs text-[var(--color-success-text)]/80 mt-1">
            Bukti transfer Anda telah diterima dan sedang diproses. Status pesanan akan otomatis diperbarui setelah admin menyetujui.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[var(--color-surface)]/60 backdrop-blur-md p-5 rounded-xl border border-[var(--color-border)] space-y-4">
      <div>
        <h4 className="font-bold text-[var(--color-text)]">Unggah Bukti Transfer</h4>
        <p className="text-xs text-[var(--color-text-secondary)]">
          Pastikan gambar terlihat jelas, menampilkan nominal dan rekening tujuan.
        </p>
      </div>

      {!file ? (
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-[var(--color-border)] rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-[var(--color-surface-elevated)] transition-colors"
        >
          <Upload className="h-8 w-8 text-[var(--color-text-muted)] mb-3" />
          <p className="text-sm font-medium text-[var(--color-text)]">Klik untuk memilih file</p>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">PNG, JPG, maksimal 5MB</p>
        </div>
      ) : (
        <div className="border border-[var(--color-border)] rounded-xl p-3 flex items-center justify-between bg-[var(--color-surface-elevated)]">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="h-10 w-10 shrink-0 rounded overflow-hidden bg-black/5 flex items-center justify-center relative">
              {previewUrl ? (
                <Image 
                  src={previewUrl} 
                  alt="Preview" 
                  fill
                  className="object-cover" 
                />
              ) : (
                <FileImage className="h-5 w-5 text-[var(--color-text-muted)]" />
              )}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-[var(--color-text)] truncate">{file.name}</p>
              <p className="text-xs text-[var(--color-text-muted)]">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
          </div>
          <Button 
            type="button" 
            variant="ghost" 
            size="icon-md" 
            className="h-8 w-8 text-[var(--color-text-muted)] hover:text-red-500"
            onClick={handleClear}
            disabled={isUploading}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      <input 
        type="file" 
        accept="image/png, image/jpeg, image/jpg" 
        className="hidden" 
        ref={fileInputRef}
        onChange={handleFileChange}
      />

      <Button
        type="button"
        className="w-full font-bold"
        disabled={!file || isUploading}
        onClick={handleUpload}
      >
        {isUploading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Mengunggah...
          </>
        ) : (
          "Kirim Bukti Transfer"
        )}
      </Button>
    </div>
  );
}
