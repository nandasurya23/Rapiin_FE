import { PublicBusinessPage } from "@/features/public-business/public-business-page";
import { apiFetch } from "@/lib/api-client";
import type { Business } from "@/types/business";

export default async function BusinessSlugPage({ params }: { params: Promise<{ businessSlug: string }> }) {
 const { businessSlug } = await params;

 let business: Business | null = null;
 try {
  business = await apiFetch<Business>(`/api/public/b/${businessSlug}`);
 } catch (err: unknown) {
  if ((err as { status?: number })?.status !== 404) {
   console.error("Failed to fetch business in Server Component:", err);
  }
 }

 return <PublicBusinessPage slug={businessSlug} initialBusiness={business} />;
}
