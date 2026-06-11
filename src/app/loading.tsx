import { LoadingBlock, LoadingSpinner } from "@/components/shared/loading";

export default function Loading() {
  return (
    <main className="page-enter flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm rounded-2xl border border-border/80 bg-surface p-6 text-center shadow-soft">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md border border-brand-100 bg-brand-50">
          <LoadingSpinner />
        </div>
        <div className="mt-4 space-y-2">
          <LoadingBlock className="mx-auto h-4 w-24" />
          <LoadingBlock className="mx-auto h-7 w-40" />
          <LoadingBlock className="mx-auto h-4 w-56" />
        </div>
      </div>
    </main>
  );
}
