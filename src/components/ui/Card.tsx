import { cn } from "@/lib/utils";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  accent?: boolean;
  topAccent?: boolean;
  hover?: boolean;
}

export function Card({ children, className, accent = true, topAccent = false, hover = true }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl bg-background p-6 shadow-sm border border-[var(--gaspe-neutral-200)]",
        topAccent && "group relative overflow-hidden",
        !topAccent && accent && "border-l-[3px] border-l-primary",
        hover && "gaspe-card-hover hover:border-[var(--gaspe-teal-200)]",
        className,
      )}
    >
      {topAccent && <div className="gaspe-card-top-strip" />}
      {children}
    </div>
  );
}

export function CardTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <h3 className={cn("font-heading text-lg font-semibold text-foreground", className)}>
      {children}
    </h3>
  );
}

export function CardDescription({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={cn("mt-2 text-sm text-foreground-muted leading-relaxed", className)}>
      {children}
    </p>
  );
}
