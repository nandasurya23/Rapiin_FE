import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type PageHeaderProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  variant?: "default" | "hero";
  badge?: ReactNode;
  statsCard?: ReactNode;
};

export function PageHeader({
  title,
  description,
  action,
  className,
  variant = "default",
  badge,
  statsCard,
}: PageHeaderProps) {
  if (variant === "hero") {
    return (
      <div className={cn(
        "relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0c1d3b] via-[#122a57] to-[#09152b] border border-white/[0.08] shadow-[var(--shadow-lg)] px-6 py-6 sm:px-8 sm:py-8 text-white animate-fade-up",
        className
      )}>
        <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-amber-500/20 blur-3xl pointer-events-none" />
        <div className="absolute -left-10 -bottom-10 h-32 w-32 rounded-full bg-indigo-400/10 blur-3xl pointer-events-none" />

        <div className="relative flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="space-y-3">
            {badge}
            <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl text-white">
              {title}
            </h1>
            {description ? (
              <p className="max-w-xl text-sm text-white/70 leading-relaxed">
                {description}
              </p>
            ) : null}
          </div>
          {statsCard || action ? (
            <div className="flex flex-wrap items-center gap-3 xl:shrink-0">
              {statsCard}
              {action}
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-4 border-b border-[var(--color-border)] bg-[var(--color-surface)]/86 px-4 py-4 backdrop-blur sm:px-6 lg:px-8", className)}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          {badge}
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-text)]">{title}</h1>
          {description ? <p className="mt-1 max-w-2xl text-sm text-[var(--color-text-secondary)]">{description}</p> : null}
        </div>
        {action ? <div>{action}</div> : null}
      </div>
    </div>
  );
}

