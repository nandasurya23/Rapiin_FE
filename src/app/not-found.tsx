import Link from "next/link";
import { SearchX, ArrowLeft } from "lucide-react";
import { LinkButton } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[var(--color-background)] px-4 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--color-surface-elevated)] border border-[var(--color-border)] shadow-sm mb-6">
        <SearchX className="h-10 w-10 text-[var(--color-text-muted)]" />
      </div>
      
      <h1 className="text-4xl font-black tracking-tight text-[var(--color-text)] sm:text-5xl">
        404
      </h1>
      
      <h2 className="mt-4 text-xl font-bold text-[var(--color-text)]">
        Halaman tidak ditemukan
      </h2>
      
      <p className="mt-2 text-sm max-w-md text-[var(--color-text-secondary)]">
        Maaf, halaman atau rute yang Anda cari tidak tersedia. Mungkin sudah dipindahkan, dihapus, atau Anda salah mengetikkan alamat URL.
      </p>
      
      <div className="mt-8 flex flex-col sm:flex-row gap-3 w-full max-w-xs justify-center">
        <LinkButton href="/" variant="primary" className="font-bold">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali ke Beranda
        </LinkButton>
      </div>
    </main>
  );
}
