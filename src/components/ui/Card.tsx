import { cn } from "@/lib/utils";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  accent?: boolean;
}

export function Card({ children, className, accent = true }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-lg bg-background p-6 shadow-sm",
        accent && "border-l-[3px] border-l-primary",
        className,
      )}
    >
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
    <p className={cn("mt-1 text-sm text-foreground-muted", className)}>
      {children}
    </p>
  );
}
