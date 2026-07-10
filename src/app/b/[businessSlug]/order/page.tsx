import { PublicOrderForm } from "@/features/public-business/public-order-form";
import { apiFetch } from "@/lib/api-client";
import type { Business } from "@/types/business";

export default async function BusinessSlugOrderPage({ params }: { params: Promise<{ businessSlug: string }> }) {
  const { businessSlug } = await params;

  let business: Business | null = null;
  try {
    business = await apiFetch<Business>(`/api/public/b/${businessSlug}`);
  } catch (err) {
    console.error("Failed to fetch business in Server Component:", err);
  }

  return <PublicOrderForm slug={businessSlug} initialBusiness={business} />;
}
