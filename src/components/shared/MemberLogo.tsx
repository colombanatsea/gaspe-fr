"use client";

import Image from "next/image";
import { useState } from "react";

interface MemberLogoProps {
  logoUrl?: string;
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

// Boîte rectangulaire paysage (~8:5) avec padding interne : un logo carré
// (Île d'Arz, Océane) garde sa hauteur, un logo bandeau (Penn Ar Bed) déploie
// sa largeur. Empreinte visuelle homogène entre marques de même série.
const SIZES = {
  sm: { container: "h-9 w-14", textSize: "text-xs", w: 56, h: 36 },
  md: { container: "h-10 w-16", textSize: "text-sm", w: 64, h: 40 },
  lg: { container: "h-14 w-24", textSize: "text-base", w: 96, h: 56 },
} as const;

export function MemberLogo({ logoUrl, name, size = "md", className }: MemberLogoProps) {
  const [failed, setFailed] = useState(false);
  const { container, textSize, w, h } = SIZES[size];

  if (!logoUrl || failed) {
    return (
      <div className={`shrink-0 ${container} rounded-lg bg-[var(--gaspe-teal-50)] border border-[var(--gaspe-neutral-200)] flex items-center justify-center ${className ?? ""}`}>
        <span className={`${textSize} font-bold text-[var(--gaspe-teal-600)]`}>
          {name.charAt(0)}
        </span>
      </div>
    );
  }

  return (
    <div className={`shrink-0 ${container} rounded-lg bg-white border border-[var(--gaspe-neutral-200)] flex items-center justify-center overflow-hidden p-1 ${className ?? ""}`}>
      <Image
        src={logoUrl}
        alt={name}
        width={w}
        height={h}
        className="max-w-full max-h-full object-contain"
        onError={() => setFailed(true)}
        loading="lazy"
        unoptimized
      />
    </div>
  );
}
