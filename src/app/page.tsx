import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { ROUTES } from "@/lib/routes";

export default async function HomePage() {
 const headersList = await headers();
 const host = headersList.get("host") || "";
 const adminUrl = process.env.NEXT_PUBLIC_ADMIN_URL || "";
 const adminHost = adminUrl ? new URL(adminUrl).host : "";

 if (adminHost && host === adminHost) {
  redirect(ROUTES.superAdminLogin);
 } else {
  redirect(ROUTES.login);
 }
}
