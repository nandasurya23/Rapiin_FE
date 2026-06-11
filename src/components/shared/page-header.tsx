import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type PageHeaderProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
};

export function PageHeader({ title, description, action, className }: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col gap-4 border-b border-border/80 bg-surface/86 px-4 py-4 backdrop-blur sm:px-6 lg:px-8", className)}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-text-primary">{title}</h1>
          {description ? <p className="mt-1 max-w-2xl text-sm text-text-secondary">{description}</p> : null}
        </div>
        {action ? <div>{action}</div> : null}
      </div>
    </div>
  );
}
