import { redirect } from "next/navigation";

export default async function BusinessSlugOrderPage({ params }: { params: Promise<{ businessSlug: string }> }) {
 const { businessSlug } = await params;
 redirect(`/b/${businessSlug}`);
}
