import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

export function LoadingSpinner({ className }: { className?: string }) {
  return <Loader2 className={cn("h-5 w-5 animate-spin text-brand-700", className)} />;
}

export function LoadingBlock({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-border/50", className)} />;
}

export function LoadingDotRow() {
  return (
    <div className="flex items-center gap-2">
      <LoadingBlock className="h-3 w-3 rounded-full" />
      <LoadingBlock className="h-3 w-3 rounded-full" />
      <LoadingBlock className="h-3 w-3 rounded-full" />
    </div>
  );
}
