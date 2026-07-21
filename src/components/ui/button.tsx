import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/cn";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "accent";
type ButtonSize = "sm" | "md" | "lg" | "icon-sm" | "icon-md";

type BaseProps = {
 children?: ReactNode;
 variant?: ButtonVariant;
 size?: ButtonSize;
 className?: string;
 isLoading?: boolean;
};

type ButtonProps = BaseProps & ButtonHTMLAttributes<HTMLButtonElement>;
type LinkButtonProps = BaseProps & { href: string; className?: string };

/* ============================================================
  VARIANT STYLES — All using brand tokens
  ============================================================ */

const baseStyles = [
 "inline-flex items-center justify-center gap-2 font-medium",
 "rounded-[var(--radius-md)]",
 "transition-all duration-[var(--transition-base)]",
 "focus-visible:outline-none focus-visible:ring-2",
 "focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2",
 "focus-visible:ring-offset-[var(--color-background)]",
 "disabled:pointer-events-none disabled:opacity-[var(--state-disabled-opacity)]",
 "select-none",
].join(" ");

const variantStyles: Record<ButtonVariant, string> = {
 primary: [
  "bg-[var(--color-primary)] text-[var(--color-text-inverse)]",
  "border border-[var(--color-primary)]",
  "hover:bg-[var(--color-primary-hover)] hover:border-[var(--color-primary-hover)]",
  "active:bg-[var(--color-primary-active)]",
  "shadow-[var(--shadow-sm)]",
 ].join(" "),

 secondary: [
  "bg-[var(--color-surface)] text-[var(--color-text)]",
  "border border-[var(--color-border-strong)]",
  "hover:bg-[var(--color-surface-elevated)] hover:border-[var(--color-border-strong)]",
  "hover:text-[var(--color-primary)]",
  "active:bg-[var(--color-surface-inset)]",
  "shadow-[var(--shadow-xs)]",
 ].join(" "),

 ghost: [
  "bg-transparent text-[var(--color-text-secondary)]",
  "border border-transparent",
  "hover:bg-[var(--state-hover-bg)] hover:text-[var(--color-primary)]",
  "active:bg-[var(--state-active-bg)]",
 ].join(" "),

 danger: [
  "bg-[var(--color-danger)] text-[var(--color-text-inverse)]",
  "border border-[var(--color-danger)]",
  "hover:bg-[var(--color-danger-hover)]",
  "active:bg-[var(--color-danger-hover)]",
  "shadow-[var(--shadow-sm)]",
 ].join(" "),

 accent: [
  "bg-[var(--color-accent)] text-[var(--color-accent-text)]",
  "border border-[var(--color-accent)]",
  "hover:bg-[var(--color-accent-hover)] hover:border-[var(--color-accent-hover)]",
  "active:bg-[var(--color-accent-active)]",
  "shadow-[var(--shadow-sm)]",
 ].join(" "),
};

const sizeStyles: Record<ButtonSize, string> = {
 sm:   "h-8 px-3 text-sm",
 md:   "h-10 px-4 text-sm",
 lg:   "h-11 px-5 text-base",
 "icon-sm": "h-8 w-8 p-0",
 "icon-md": "h-10 w-10 p-0",
};

/* ============================================================
  BUTTON COMPONENT
  ============================================================ */

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
   {isLoading ? (
    <Loader2 className="h-4 w-4 animate-spin shrink-0" />
   ) : null}
   {children}
  </button>
 );
}

/* ============================================================
  LINK BUTTON COMPONENT
  ============================================================ */

export function LinkButton({
 children,
 variant = "primary",
 size = "md",
 className,
 href,
 ...props
}: LinkButtonProps) {
 return (
  <Link
   href={href}
   className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
   {...props}
  >
   {children}
  </Link>
 );
}
