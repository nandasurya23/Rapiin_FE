import { LoadingBlock } from "@/components/shared/loading";

export default function Loading() {
  return (
    <main className="page-enter space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-md)] space-y-4">
          <LoadingBlock className="h-6 w-24" />
          <LoadingBlock className="h-4 w-full max-w-xl" />
          <LoadingBlock className="h-11 w-full rounded-md" />
          <div className="flex flex-wrap gap-2">
            <LoadingBlock className="h-9 w-20" />
            <LoadingBlock className="h-9 w-20" />
            <LoadingBlock className="h-9 w-20" />
          </div>
        </div>
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-md)] space-y-4">
          <LoadingBlock className="h-6 w-32" />
          <LoadingBlock className="h-4 w-full" />
          <LoadingBlock className="h-11 w-full rounded-md" />
          <LoadingBlock className="h-11 w-full rounded-md" />
          <LoadingBlock className="h-11 w-full rounded-md" />
          <LoadingBlock className="h-24 w-full rounded-xl" />
        </div>
      </section>

      <section className="space-y-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-md)]">
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-2">
                <LoadingBlock className="h-5 w-40" />
                <LoadingBlock className="h-4 w-56" />
              </div>
              <LoadingBlock className="h-8 w-24 rounded-full" />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <LoadingBlock className="h-9 w-24" />
              <LoadingBlock className="h-9 w-24" />
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}
