import { LoadingBlock } from "@/components/shared/loading";

export default function Loading() {
 return (
  <main className="page-enter space-y-6 px-4 py-6 sm:px-6 lg:px-8">
   <section className="grid gap-4 rounded-md border border-[var(--color-border)] shimmer p-5 shadow-none lg:grid-cols-[1.1fr_0.9fr]">
    <div className="space-y-4">
     <LoadingBlock className="h-6 w-24" />
     <LoadingBlock className="h-10 w-80 max-w-full" />
     <LoadingBlock className="h-4 w-full max-w-2xl" />
     <div className="flex flex-wrap gap-2">
      <LoadingBlock className="h-11 w-32" />
      <LoadingBlock className="h-11 w-36" />
     </div>
    </div>
    <div className="rounded-md border border-[var(--color-border)] shimmer p-5 space-y-4">
     <LoadingBlock className="h-5 w-32" />
     <div className="grid grid-cols-2 gap-3">
      <LoadingBlock className="h-20 rounded-md" />
      <LoadingBlock className="h-20 rounded-md" />
     </div>
     <LoadingBlock className="h-20 rounded-md" />
    </div>
   </section>

   <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
    <div className="rounded-md border border-[var(--color-border)] shimmer p-5 shadow-none space-y-4">
     <LoadingBlock className="h-5 w-36" />
     <div className="flex flex-wrap gap-2">
      {Array.from({ length: 5 }).map((_, index) => (
       <LoadingBlock key={index} className="h-9 w-24 rounded-md" />
      ))}
     </div>
     <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, index) => (
       <LoadingBlock key={index} className="h-20 rounded-md" />
      ))}
     </div>
    </div>
    <div className="rounded-md border border-[var(--color-border)] shimmer p-5 shadow-none space-y-4">
     <LoadingBlock className="h-5 w-36" />
     <LoadingBlock className="h-4 w-full" />
     <LoadingBlock className="h-60 rounded-md" />
     <LoadingBlock className="h-44 rounded-md" />
    </div>
   </section>
  </main>
 );
}
