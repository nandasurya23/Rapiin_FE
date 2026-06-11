import type { ButtonHTMLAttributes, AnchorHTMLAttributes, ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

type BaseProps = {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  className?: string;
  isLoading?: boolean;
};

type ButtonProps = BaseProps & ButtonHTMLAttributes<HTMLButtonElement>;
type LinkProps = BaseProps & AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };

const baseStyles =
  "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50";

const variantStyles: Record<NonNullable<BaseProps["variant"]>, string> = {
  primary: "bg-brand-700 text-white hover:bg-brand-800",
  secondary: "bg-surface text-text-primary border border-border hover:bg-muted",
  ghost: "bg-transparent text-text-primary hover:bg-muted/70",
  danger: "bg-status-danger text-white hover:opacity-90",
};

const sizeStyles: Record<NonNullable<BaseProps["size"]>, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-4 text-sm",
  lg: "h-12 px-5 text-base",
};

export function Button({
  children,
  variant = "primary",
  size = "md",
  className,
  isLoading = false,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      {...props}
    >
      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
      {children}
    </button>
  );
}

export function LinkButton({
  children,
  variant = "primary",
  size = "md",
  className,
  href,
  ...props
}: LinkProps) {
  return (
    <a className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)} href={href} {...props}>
      {children}
    </a>
  );
}
