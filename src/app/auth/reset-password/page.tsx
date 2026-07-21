"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AuthPanel } from "@/features/auth/auth-panel";


function ResetPasswordContent() {
 const searchParams = useSearchParams();
 const token = searchParams.get("token") ?? "";
 const email = searchParams.get("email") ?? "";

 return <AuthPanel mode="reset-password" resetToken={token} initialEmail={email} />;
}

export default function ResetPasswordPage() {
 return (
  <Suspense fallback={<div className="min-h-screen flex items-center justify-center" />}>
   <ResetPasswordContent />
  </Suspense>
 );
}
