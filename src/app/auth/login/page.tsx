import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ROUTES } from "@/lib/routes";
import { AuthPanel } from "@/features/auth/auth-panel";

export default async function LoginPage() {
 const headersList = await headers();
 const host = headersList.get("host") || "";
 const adminUrl = process.env.NEXT_PUBLIC_ADMIN_URL || "";
 const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";
 
 let adminHost = "";
 try { adminHost = adminUrl ? new URL(adminUrl.startsWith("http") ? adminUrl : `https://${adminUrl}`).host : ""; } catch {}
 
 let appHost = "";
 try { appHost = appUrl ? new URL(appUrl.startsWith("http") ? appUrl : `https://${appUrl}`).host : ""; } catch {}

 // Di local, appHost dan adminHost seringkali sama (localhost:3000)
 // Cegah infinite redirect / salah arah jika mereka identik
 if (adminHost && adminHost !== appHost && host === adminHost) {
  redirect(ROUTES.superAdminLogin);
 }

 return <AuthPanel mode="login" />;
}
