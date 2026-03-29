"use client";

import { useScrollReveal } from "@/lib/useScrollReveal";

export function ScrollRevealWrapper({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useScrollReveal();
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
