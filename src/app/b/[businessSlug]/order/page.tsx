import { PublicOrderForm } from "@/features/public-business/public-order-form";

export default async function BusinessSlugOrderPage({ params }: { params: Promise<{ businessSlug: string }> }) {
  const { businessSlug } = await params;

  return <PublicOrderForm slug={businessSlug} />;
}
