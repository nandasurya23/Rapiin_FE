"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AuthPanel } from "@/features/auth/auth-panel";

/**
 * Inner component that reads the ?token= query param.
 * Must be wrapped in Suspense for useSearchParams() to work in Next.js App Router.
 */
function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  return <AuthPanel mode="reset-password" resetToken={token} />;
}

/**
 * /auth/reset-password?token=<raw_token>
 *
 * Step 2 dari forgot-password flow.
 * User mendapat link ini via email (atau dari BE console di dev mode).
 * Token di URL otomatis diisi ke form field.
 */
export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center" />}>
      <ResetPasswordContent />
    </Suspense>
  );
}
