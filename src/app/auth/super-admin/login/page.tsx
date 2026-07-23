import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ROUTES } from "@/lib/routes";
import { AuthPanel } from "@/features/auth/auth-panel";

export default async function SuperAdminLoginPage() {
 const headersList = await headers();
 const host = headersList.get("host") || "";
 const adminUrl = process.env.NEXT_PUBLIC_ADMIN_URL || "";
 
 let adminHost = "";
 try { adminHost = adminUrl ? new URL(adminUrl.startsWith("http") ? adminUrl : `https://${adminUrl}`).host : ""; } catch {}

 // If we are on app domain but accessing super-admin login, redirect to admin domain
 if (adminHost && host !== adminHost) {
  redirect(`${adminUrl}${ROUTES.superAdminLogin}`);
 }

 return <AuthPanel mode="login" roleFilter="SUPER_ADMIN" />;
}
