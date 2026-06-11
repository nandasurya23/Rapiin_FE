import { LoadingBlock, LoadingSpinner } from "@/components/shared/loading";

export default function Loading() {
  return (
    <main className="page-enter space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <section className="grid gap-4 rounded-2xl border border-border/80 bg-surface px-5 py-6 shadow-soft lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-md border border-brand-100 bg-brand-50">
              <LoadingSpinner />
            </div>
            <div className="space-y-2">
              <LoadingBlock className="h-3 w-24" />
              <LoadingBlock className="h-7 w-64" />
            </div>
          </div>
          <LoadingBlock className="h-4 w-full max-w-2xl" />
          <LoadingBlock className="h-4 w-5/6 max-w-xl" />
          <div className="flex flex-wrap gap-3">
            <LoadingBlock className="h-11 w-32" />
            <LoadingBlock className="h-11 w-36" />
            <LoadingBlock className="h-11 w-32" />
          </div>
        </div>

        <div className="rounded-2xl border border-border/80 bg-brand-50 p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="space-y-2">
              <LoadingBlock className="h-4 w-28" />
              <LoadingBlock className="h-3 w-44" />
            </div>
            <LoadingBlock className="h-6 w-6 rounded-full" />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <LoadingBlock className="h-24 rounded-lg" />
            <LoadingBlock className="h-24 rounded-lg" />
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="rounded-lg border border-border/80 bg-surface p-5 shadow-none">
            <div className="flex items-start gap-4">
              <LoadingBlock className="h-11 w-11 rounded-lg" />
              <div className="flex-1 space-y-2">
                <LoadingBlock className="h-4 w-24" />
                <LoadingBlock className="h-8 w-28" />
                <LoadingBlock className="h-4 w-36" />
              </div>
            </div>
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="rounded-2xl border border-border/80 bg-surface p-5 shadow-soft">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-2">
                <LoadingBlock className="h-5 w-40" />
                <LoadingBlock className="h-4 w-64" />
              </div>
              <LoadingBlock className="h-6 w-16 rounded-full" />
            </div>
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="rounded-xl border border-border/80 bg-surface p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="space-y-2">
                      <LoadingBlock className="h-4 w-32" />
                      <LoadingBlock className="h-3 w-56" />
                    </div>
                    <LoadingBlock className="h-6 w-24 rounded-full" />
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <LoadingBlock className="h-9 w-24" />
                    <LoadingBlock className="h-9 w-28" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-border/80 bg-surface p-5 shadow-soft">
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="space-y-2">
                  <LoadingBlock className="h-5 w-32" />
                  <LoadingBlock className="h-4 w-48" />
                </div>
                <LoadingBlock className="h-5 w-5 rounded-full" />
              </div>
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <LoadingBlock key={index} className="h-20 rounded-xl" />
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border/80 bg-surface p-5 shadow-soft">
            <div className="space-y-4">
              <LoadingBlock className="h-5 w-32" />
              <div className="space-y-2">
                <LoadingBlock className="h-11 w-full rounded-md" />
                <LoadingBlock className="h-11 w-full rounded-md" />
                <LoadingBlock className="h-11 w-full rounded-md" />
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
