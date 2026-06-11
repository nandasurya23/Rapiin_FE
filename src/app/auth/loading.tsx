import { LoadingBlock, LoadingSpinner } from "@/components/shared/loading";

export default function Loading() {
  return (
    <main className="page-enter flex min-h-screen items-center px-4 py-10">
      <div className="mx-auto w-full max-w-md rounded-2xl border border-border/80 bg-surface p-6 shadow-soft">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-md border border-brand-100 bg-brand-50">
            <LoadingSpinner />
          </div>
          <div className="space-y-2">
            <LoadingBlock className="h-3 w-20" />
            <LoadingBlock className="h-6 w-40" />
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <LoadingBlock className="h-11 w-full rounded-md" />
          <LoadingBlock className="h-11 w-full rounded-md" />
          <LoadingBlock className="h-11 w-full rounded-md" />
          <LoadingBlock className="h-11 w-full rounded-md" />
          <LoadingBlock className="h-12 w-full rounded-md" />
        </div>

        <div className="mt-5 space-y-2">
          <LoadingBlock className="h-4 w-full" />
          <LoadingBlock className="h-4 w-5/6" />
        </div>
      </div>
    </main>
  );
}
