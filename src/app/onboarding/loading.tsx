import { LoadingBlock, LoadingSpinner } from "@/components/shared/loading";

export default function Loading() {
  return (
    <main className="page-enter mx-auto flex min-h-screen max-w-5xl items-center px-4 py-10 sm:px-6 lg:px-8">
      <div className="w-full rounded-2xl border border-border/80 bg-surface p-6 shadow-soft">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-md border border-brand-100 bg-brand-50">
            <LoadingSpinner />
          </div>
          <div className="space-y-2">
            <LoadingBlock className="h-3 w-24" />
            <LoadingBlock className="h-7 w-56" />
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_0.9fr]">
          <div className="space-y-4">
            <LoadingBlock className="h-4 w-full max-w-xl" />
            <LoadingBlock className="h-4 w-5/6 max-w-lg" />
            <div className="grid gap-3 sm:grid-cols-2">
              <LoadingBlock className="h-12 rounded-md" />
              <LoadingBlock className="h-12 rounded-md" />
              <LoadingBlock className="h-12 rounded-md sm:col-span-2" />
              <LoadingBlock className="h-12 rounded-md sm:col-span-2" />
            </div>
          </div>
          <div className="rounded-2xl border border-border/80 bg-brand-50 p-5">
            <LoadingBlock className="h-5 w-32" />
            <div className="mt-4 space-y-3">
              <LoadingBlock className="h-24 rounded-xl" />
              <LoadingBlock className="h-24 rounded-xl" />
              <LoadingBlock className="h-24 rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
