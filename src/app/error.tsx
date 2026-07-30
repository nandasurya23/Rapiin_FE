"use client";

import { useEffect } from "react";
import { AlertOctagon, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Global app error:", error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[var(--color-background)] px-4 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--color-danger-surface)] border border-[var(--color-danger-border)] shadow-sm mb-6">
        <AlertOctagon className="h-10 w-10 text-[var(--color-danger)]" />
      </div>
      
      <h1 className="text-3xl font-black tracking-tight text-[var(--color-text)] sm:text-4xl">
        Terjadi Kesalahan Sistem
      </h1>
      
      <p className="mt-3 text-sm max-w-md text-[var(--color-text-secondary)]">
        Maaf, aplikasi mengalami masalah yang tidak terduga. Tim kami telah diberitahu dan sedang memperbaikinya.
      </p>
      
      <div className="mt-8 flex gap-3">
        <Button onClick={() => reset()} variant="primary" className="font-bold">
          <RotateCcw className="mr-2 h-4 w-4" />
          Coba Lagi
        </Button>
      </div>
    </main>
  );
}
