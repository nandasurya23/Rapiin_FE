import { Button, LinkButton } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";

type EmptyStateProps = {
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
};

export function EmptyState({ title, description, actionLabel, actionHref }: EmptyStateProps) {
  return (
    <Card>
      <CardBody className="flex flex-col items-start gap-4 p-5">
        <div>
          <h3 className="text-base font-semibold text-text-primary">{title}</h3>
          <p className="mt-1 text-sm text-text-secondary">{description}</p>
        </div>
        {actionLabel &&
          (actionHref ? (
            <LinkButton href={actionHref}>{actionLabel}</LinkButton>
          ) : (
            <Button disabled>{actionLabel}</Button>
          ))}
      </CardBody>
    </Card>
  );
}
