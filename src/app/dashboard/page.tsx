"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppData } from "@/components/providers/app-data-provider";

export default function DashboardRootPage() {
 const router = useRouter();
 const { business, hydrated } = useAppData();

 useEffect(() => {
  if (hydrated && business?.slug) {
   router.replace(`/dashboard/${business.slug}`);
  }
 }, [hydrated, business, router]);

 return (
  <div className="flex min-h-[60vh] items-center justify-center">
   <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--color-primary)] border-t-transparent" />
  </div>
 );
}
