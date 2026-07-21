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
  // Redirect to global join page, keeping the token inside parameters
  redirect(`/join?token=${encodeURIComponent(token)}`);
 } else {
  redirect(`/b/${businessSlug}`);
 }
}
