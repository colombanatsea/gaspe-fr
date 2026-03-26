import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes, AnchorHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "tertiary";

const variantStyles: Record<Variant, string> = {
  primary:
    "bg-primary text-white hover:bg-primary-hover focus-visible:ring-primary",
  secondary:
    "border-2 border-primary text-primary hover:bg-surface-teal focus-visible:ring-primary",
  tertiary:
    "text-primary underline underline-offset-4 hover:text-primary-hover",
};

type BaseProps = {
  variant?: Variant;
  className?: string;
  children: React.ReactNode;
};

type AsButton = BaseProps &
  ButtonHTMLAttributes<HTMLButtonElement> & { href?: never };

type AsLink = BaseProps &
  AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };

type ButtonProps = AsButton | AsLink;

export function Button({
  variant = "primary",
  className,
  children,
  ...props
}: ButtonProps) {
  const base = cn(
    "inline-flex items-center justify-center gap-2 rounded-lg px-6 py-3 font-heading font-semibold text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
    variantStyles[variant],
    className,
  );

  if ("href" in props && props.href) {
    return (
      <a className={base} {...(props as AnchorHTMLAttributes<HTMLAnchorElement>)}>
        {children}
      </a>
    );
  }

  return (
    <button className={base} {...(props as ButtonHTMLAttributes<HTMLButtonElement>)}>
      {children}
    </button>
  );
}
