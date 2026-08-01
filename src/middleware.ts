import { NextResponse, type NextRequest } from "next/server";

const PROTECTED_PREFIXES = ["/dashboard", "/onboarding"];

export function middleware(request: NextRequest) {
 const { pathname } = request.nextUrl;

 const isProtected = PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
 if (!isProtected) {
  return NextResponse.next();
 }

 const hasSession = request.cookies.has("rapiin_token") || request.cookies.has("rapiin_admin_token");
 if (hasSession) {
  return NextResponse.next();
 }

 const isSuperAdminPath = pathname.startsWith("/dashboard/super-admin");
 const loginPath = isSuperAdminPath ? "/auth/super-admin/login" : "/auth/login";

 const redirectUrl = request.nextUrl.clone();
 redirectUrl.pathname = loginPath;
 redirectUrl.search = "";
 return NextResponse.redirect(redirectUrl);
}

export const config = {
 matcher: ["/dashboard/:path*", "/onboarding"],
};
