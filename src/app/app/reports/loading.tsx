import { LoadingBlock } from "@/components/shared/loading";

export default function Loading() {
  return (
    <main className="page-enter space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <section className="grid gap-4 rounded-2xl border border-border/80 bg-surface p-5 shadow-soft lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4">
          <LoadingBlock className="h-6 w-24" />
          <LoadingBlock className="h-10 w-80 max-w-full" />
          <LoadingBlock className="h-4 w-full max-w-2xl" />
          <div className="flex flex-wrap gap-2">
            <LoadingBlock className="h-11 w-32" />
            <LoadingBlock className="h-11 w-28" />
          </div>
        </div>
        <div className="rounded-2xl border border-border/80 bg-brand-50 p-5 space-y-4">
          <LoadingBlock className="h-5 w-32" />
          <div className="flex flex-wrap gap-2">
            <LoadingBlock className="h-9 w-20 rounded-md" />
            <LoadingBlock className="h-9 w-20 rounded-md" />
            <LoadingBlock className="h-9 w-20 rounded-md" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <LoadingBlock className="h-20 rounded-lg" />
            <LoadingBlock className="h-20 rounded-lg" />
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <LoadingBlock key={index} className="h-28 rounded-lg border border-border/80 bg-surface" />
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_0.95fr]">
        <div className="rounded-2xl border border-border/80 bg-surface p-5 shadow-soft space-y-4">
          <LoadingBlock className="h-5 w-48" />
          {Array.from({ length: 3 }).map((_, index) => (
            <LoadingBlock key={index} className="h-20 rounded-xl" />
          ))}
        </div>
        <div className="rounded-2xl border border-border/80 bg-surface p-5 shadow-soft space-y-4">
          <LoadingBlock className="h-5 w-32" />
          <LoadingBlock className="h-40 rounded-xl" />
          <LoadingBlock className="h-11 w-36" />
        </div>
      </section>
    </main>
  );
}
