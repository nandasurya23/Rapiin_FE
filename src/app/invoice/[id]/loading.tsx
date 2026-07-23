import { LoadingBlock, LoadingSpinner } from "@/components/shared/loading";

export default function Loading() {
 return (
  <main className="page-enter mx-auto min-h-screen max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
   <section className="grid gap-4 rounded-md border border-[var(--color-border)] shimmer p-5 shadow-none lg:grid-cols-[1.05fr_0.95fr]">
    <div className="space-y-4">
     <div className="flex items-center gap-3">
      <div className="flex h-11 w-11 items-center justify-center rounded-md border border-[var(--color-border)] shimmer">
       <LoadingSpinner />
      </div>
      <div className="space-y-2">
       <LoadingBlock className="h-3 w-24" />
       <LoadingBlock className="h-7 w-44" />
      </div>
     </div>
     <LoadingBlock className="h-4 w-full max-w-2xl" />
     <div className="flex flex-wrap gap-2">
      <LoadingBlock className="h-11 w-36" />
      <LoadingBlock className="h-11 w-32" />
     </div>
    </div>

    <div className="rounded-md border border-[var(--color-border)] shimmer p-5">
     <LoadingBlock className="h-5 w-36" />
     <div className="mt-4 space-y-3">
      <LoadingBlock className="h-4 w-32" />
      <LoadingBlock className="h-4 w-28" />
      <LoadingBlock className="h-4 w-40" />
      <LoadingBlock className="h-24 w-full rounded-md" />
     </div>
    </div>
   </section>

   <section className="mt-6 grid gap-6 lg:grid-cols-[1fr_0.9fr]">
    <div className="rounded-md border border-[var(--color-border)] shimmer p-5 shadow-none">
     <div className="space-y-4">
      <LoadingBlock className="h-5 w-28" />
      <LoadingBlock className="h-32 w-full rounded-md" />
      <LoadingBlock className="h-24 w-full rounded-md" />
     </div>
    </div>
    <div className="rounded-md border border-[var(--color-border)] shimmer p-5 shadow-none">
     <div className="space-y-4">
      <LoadingBlock className="h-5 w-32" />
      <LoadingBlock className="h-4 w-56" />
      <LoadingBlock className="h-11 w-full rounded-md" />
      <LoadingBlock className="h-11 w-full rounded-md" />
      <LoadingBlock className="h-11 w-full rounded-md" />
     </div>
    </div>
   </section>
  </main>
 );
}
