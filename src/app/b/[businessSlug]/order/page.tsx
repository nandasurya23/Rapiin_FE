import { PublicOrderForm } from "@/features/public-business/public-order-form";
import { apiFetch } from "@/lib/api-client";
import type { Business } from "@/types/business";

export default async function BusinessSlugOrderPage({ params }: { params: Promise<{ businessSlug: string }> }) {
 const { businessSlug } = await params;

 let business: Business | null = null;
 try {
  business = await apiFetch<Business>(`/api/public/b/${businessSlug}`);
 } catch (err: unknown) {
  if ((err as { status?: number })?.status !== 404) {
   console.error(`[DEBUG] Failed to fetch business for slug '${businessSlug}' in Server Component:`, err);
  } else {
   console.warn(`[DEBUG] 404 returned for slug '${businessSlug}'`);
  }
 }

 return <PublicOrderForm slug={businessSlug} initialBusiness={business} />;
}
