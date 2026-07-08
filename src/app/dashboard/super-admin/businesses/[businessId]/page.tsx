import { SuperAdminBusinessDetailPage } from "@/features/super-admin/business-detail-page";

export default async function AppSuperAdminBusinessDetailPage({
  params,
}: {
  params: Promise<{ businessId: string }>;
}) {
  const { businessId } = await params;
  return <SuperAdminBusinessDetailPage businessId={businessId} />;
}
