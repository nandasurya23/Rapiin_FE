import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { ROUTES } from "@/lib/routes";

export default async function HomePage() {
 const headersList = await headers();
 const host = headersList.get("host") || "";
 const adminUrl = process.env.NEXT_PUBLIC_ADMIN_URL || "";
 const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";
 
 let adminHost = "";
 try { adminHost = adminUrl ? new URL(adminUrl.startsWith("http") ? adminUrl : `https://${adminUrl}`).host : ""; } catch {}
 
 let appHost = "";
 try { appHost = appUrl ? new URL(appUrl.startsWith("http") ? appUrl : `https://${appUrl}`).host : ""; } catch {}

 if (adminHost && adminHost !== appHost && host === adminHost) {
  redirect(ROUTES.superAdminLogin);
 } else {
  redirect(ROUTES.login);
 }
}
