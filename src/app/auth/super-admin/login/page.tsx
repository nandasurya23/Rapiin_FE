import { AuthPanel } from "@/features/auth/auth-panel";

export default function SuperAdminLoginPage() {
  return <AuthPanel mode="login" roleFilter="SUPER_ADMIN" />;
}
