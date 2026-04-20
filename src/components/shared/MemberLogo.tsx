"use client";

import Image from "next/image";
import { useState } from "react";

interface MemberLogoProps {
  logoUrl?: string;
  name: string;
  size?: "sm" | "md";
  className?: string;
}

export function MemberLogo({ logoUrl, name, size = "md", className }: MemberLogoProps) {
  const [failed, setFailed] = useState(false);
  const dim = size === "sm" ? "h-8 w-8" : "h-10 w-10";
  const textSize = size === "sm" ? "text-xs" : "text-sm";
  const pxSize = size === "sm" ? 32 : 40;

  if (!logoUrl || failed) {
    return (
      <div className={`shrink-0 ${dim} rounded-lg bg-[var(--gaspe-teal-50)] border border-[var(--gaspe-neutral-200)] flex items-center justify-center ${className ?? ""}`}>
        <span className={`${textSize} font-bold text-[var(--gaspe-teal-600)]`}>
          {name.charAt(0)}
        </span>
      </div>
    );
  }

  return (
    <div className={`shrink-0 ${dim} rounded-lg bg-white border border-[var(--gaspe-neutral-200)] flex items-center justify-center overflow-hidden p-0.5 ${className ?? ""}`}>
      <Image
        src={logoUrl}
        alt={name}
        width={pxSize}
        height={pxSize}
        className="max-w-full max-h-full object-contain"
        onError={() => setFailed(true)}
        loading="lazy"
        unoptimized
      />
    </div>
  );
}
