import { LoadingBlock } from "@/components/shared/loading";

export default function Loading() {
  return (
    <main className="page-enter space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-md)] space-y-4">
        <LoadingBlock className="h-6 w-24" />
        <LoadingBlock className="h-4 w-full max-w-xl" />
        <div className="grid gap-3 sm:grid-cols-2">
          <LoadingBlock className="h-11 rounded-md" />
          <LoadingBlock className="h-11 rounded-md" />
          <LoadingBlock className="h-11 rounded-md" />
          <LoadingBlock className="h-11 rounded-md" />
        </div>
        <LoadingBlock className="h-11 w-40 rounded-md" />
      </section>
    </main>
  );
}
