import { cn } from "@/lib/cn";

/* ============================================================
   LOADING COMPONENTS — Brand design system consistent
   ============================================================ */

export function LoadingSpinner({ className }: { className?: string }) {
  return (
    <svg
      className={cn("h-5 w-5 animate-spin text-[var(--color-primary)]", className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

/* ── Skeleton Blocks ──────────────────────────────────── */

export function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-sm)] shimmer",
        className
      )}
      aria-hidden
    />
  );
}

export function SkeletonText({ lines = 1, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn("space-y-2", className)} aria-hidden>
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonBlock
          key={i}
          className={cn(
            "h-3.5",
            i === lines - 1 && lines > 1 ? "w-3/4" : "w-full"
          )}
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-lg)] border border-[var(--color-border)]",
        "bg-[var(--color-surface)] p-5",
        "space-y-3",
        className
      )}
      aria-hidden
    >
      <div className="flex items-center gap-3">
        <SkeletonBlock className="h-8 w-8 rounded-full" />
        <div className="flex-1 space-y-2">
          <SkeletonBlock className="h-3.5 w-1/2" />
          <SkeletonBlock className="h-3 w-1/3" />
        </div>
      </div>
      <SkeletonText lines={2} />
      <SkeletonBlock className="h-8 w-24 rounded-[var(--radius-md)]" />
    </div>
  );
}

/* ── Legacy aliases ───────────────────────────────────── */

export function LoadingBlock({ className }: { className?: string }) {
  return <SkeletonBlock className={className} />;
}

export function LoadingDotRow() {
  return (
    <div className="flex items-center gap-2" aria-hidden>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="h-2 w-2 rounded-full bg-[var(--color-primary)]"
          style={{
            animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
            opacity: 0.6,
          }}
        />
      ))}
    </div>
  );
}
