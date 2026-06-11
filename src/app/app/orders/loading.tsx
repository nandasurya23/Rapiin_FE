import { LoadingBlock } from "@/components/shared/loading";

export default function Loading() {
  return (
    <main className="page-enter space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <section className="grid gap-4 lg:grid-cols-[1.12fr_0.88fr]">
        <div className="rounded-2xl border border-border/80 bg-surface p-5 shadow-soft space-y-4">
          <LoadingBlock className="h-6 w-28" />
          <LoadingBlock className="h-4 w-full max-w-2xl" />
          <LoadingBlock className="h-11 w-full rounded-md" />
          <div className="grid gap-3 md:grid-cols-2">
            <LoadingBlock className="h-11 rounded-md" />
            <LoadingBlock className="h-11 rounded-md" />
          </div>
          <div className="flex flex-wrap gap-2">
            <LoadingBlock className="h-9 w-20" />
            <LoadingBlock className="h-9 w-20" />
            <LoadingBlock className="h-9 w-20" />
            <LoadingBlock className="h-9 w-20" />
          </div>
        </div>
        <div className="rounded-2xl border border-border/80 bg-surface p-5 shadow-soft space-y-4">
          <LoadingBlock className="h-6 w-32" />
          <LoadingBlock className="h-4 w-full" />
          <LoadingBlock className="h-11 w-full rounded-md" />
          <LoadingBlock className="h-11 w-full rounded-md" />
          <LoadingBlock className="h-11 w-full rounded-md" />
          <LoadingBlock className="h-11 w-full rounded-md" />
          <LoadingBlock className="h-11 w-full rounded-md" />
        </div>
      </section>

      <section className="rounded-2xl border border-border/80 bg-surface p-4 shadow-soft">
        <div className="flex items-center justify-between gap-3 px-1 pb-3">
          <LoadingBlock className="h-5 w-32" />
          <LoadingBlock className="h-6 w-20 rounded-full" />
        </div>
        <div className="overflow-x-auto pb-2">
          <div className="grid min-w-[1100px] gap-3 lg:grid-cols-5">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="rounded-lg border border-border/80 bg-muted/20 p-3">
                <LoadingBlock className="h-4 w-24" />
                <div className="mt-3 space-y-3">
                  <LoadingBlock className="h-32 rounded-md" />
                  <LoadingBlock className="h-32 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
