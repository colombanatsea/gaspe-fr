import { cn } from "@/lib/utils";

type BadgeVariant = "teal" | "blue" | "warm" | "green" | "neutral";

const variantStyles: Record<BadgeVariant, string> = {
  teal: "bg-[var(--gaspe-teal-600)] text-white",
  blue: "bg-[var(--gaspe-blue-600)] text-white",
  warm: "bg-[var(--gaspe-warm-300)] text-[var(--gaspe-neutral-900)]",
  green: "bg-[var(--gaspe-green-300)] text-[var(--gaspe-neutral-900)]",
  neutral: "bg-[var(--gaspe-neutral-200)] text-[var(--gaspe-neutral-700)]",
};

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

export function Badge({ children, variant = "teal", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold font-heading",
        variantStyles[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
