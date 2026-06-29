import { Card, CardBody } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";

type FeaturePlaceholderProps = {
  title: string;
  description: string;
  nextStep?: string;
};

export function FeaturePlaceholder({ title, description, nextStep }: FeaturePlaceholderProps) {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col">
      <PageHeader title={title} description={description} />
      <main className="page-enter flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <div className="space-y-4">
          <EmptyState
            title={`${title} sedang disiapkan`}
            description={description}
            actionLabel={nextStep}
          />
          <Card>
            <CardBody className="space-y-2">
              <p className="text-sm font-medium text-[var(--color-text)]">Status phase</p>
              <p className="text-sm text-[var(--color-text-secondary)]">
                Struktur halaman sudah ada. Fitur detail akan diisi pada phase berikutnya.
              </p>
            </CardBody>
          </Card>
        </div>
      </main>
    </div>
  );
}
