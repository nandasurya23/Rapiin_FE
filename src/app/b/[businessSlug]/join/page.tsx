import { redirect } from "next/navigation";

export default async function BusinessJoinPage({
 params,
 searchParams,
}: {
 params: Promise<{ businessSlug: string }>;
 searchParams: Promise<{ token?: string }>;
}) {
 const { businessSlug } = await params;
 const { token } = await searchParams;

 if (token) {
  redirect(`/join?token=${encodeURIComponent(token)}`);
 } else {
  redirect(`/b/${businessSlug}`);
 }
}
