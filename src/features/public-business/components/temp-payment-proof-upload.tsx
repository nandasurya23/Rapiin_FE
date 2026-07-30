import { useState, useRef } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Upload, X, FileImage, CheckCircle, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/toast-provider";
import { apiFetch } from "@/lib/api-client";

interface TempPaymentProofUploadProps {
  businessSlug: string;
  onUploadSuccess: (url: string, hash: string) => void;
  onClear: () => void;
}

export function TempPaymentProofUpload({ businessSlug, onUploadSuccess, onClear }: TempPaymentProofUploadProps) {
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
    setIsSuccess(false);
    onClear();
  };

  const handleClear = () => {
    setFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setIsSuccess(false);
    onClear();
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
      const result = await apiFetch<{ tempProofUrl: string, tempProofHash: string }>(
        `/api/public/business/${businessSlug}/payment-proof-temp`, 
        {
          method: "POST",
          body: formData,
        }
      );

      setIsSuccess(true);
      onUploadSuccess(result.tempProofUrl, result.tempProofHash);
      toast.success("Bukti transfer berhasil diunggah.");
    } catch (error: unknown) {
      toast.error("Gagal mengunggah bukti transfer", (error as Error).message || "");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-[var(--color-surface)]/60 backdrop-blur-md p-5 rounded-xl border border-[var(--color-border)] space-y-4">
      <div>
        <h4 className="font-bold text-[var(--color-text)]">Unggah Bukti Transfer</h4>
        <p className="text-xs text-[var(--color-text-secondary)] mt-1">
          Selesaikan pembayaran untuk mengamankan pesanan Anda. Pastikan gambar terlihat jelas, menampilkan nominal dan rekening tujuan.
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
            className="h-8 w-8 text-[var(--color-text-muted)] hover:text-[var(--color-danger)]"
            onClick={handleClear}
            disabled={isUploading || isSuccess}
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

      {file && !isSuccess && (
        <Button
          type="button"
          className="w-full font-bold"
          disabled={isUploading}
          onClick={handleUpload}
        >
          {isUploading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Mengunggah...
            </>
          ) : (
            "Unggah Bukti Sekarang"
          )}
        </Button>
      )}

      {isSuccess && (
        <div className="bg-[var(--color-success-surface)] px-4 py-3 rounded-xl border border-[var(--color-success-border)] flex items-center gap-3">
          <CheckCircle className="h-5 w-5 text-[var(--color-success)] shrink-0" />
          <div>
            <p className="text-sm font-bold text-[var(--color-success-text)]">Bukti Siap Dikirim</p>
            <p className="text-xs text-[var(--color-success-text)]/80">
              Silakan lanjutkan klik tombol Submit di bawah.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
