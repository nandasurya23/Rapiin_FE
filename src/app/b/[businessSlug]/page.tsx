import { PublicBusinessPage } from "@/features/public-business/public-business-page";

export default async function BusinessSlugPage({ params }: { params: Promise<{ businessSlug: string }> }) {
  const { businessSlug } = await params;

  return <PublicBusinessPage slug={businessSlug} />;
}
