import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ROUTES } from "@/lib/routes";
import { AuthPanel } from "@/features/auth/auth-panel";

export default async function LoginPage() {
 const headersList = await headers();
 const host = headersList.get("host") || "";
 const adminUrl = process.env.NEXT_PUBLIC_ADMIN_URL || "";
 const adminHost = adminUrl ? new URL(adminUrl).host : "";

 if (adminHost && host === adminHost) {
  redirect(ROUTES.superAdminLogin);
 }

 return <AuthPanel mode="login" />;
}
