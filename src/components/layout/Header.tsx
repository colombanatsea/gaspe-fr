"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { mainNavigation } from "@/data/navigation";
import { SITE_NAME } from "@/lib/constants";
import { MobileNav } from "./MobileNav";

export function Header() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-[9999] bg-background/95 backdrop-blur-sm border-b border-border-light">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-md gaspe-gradient">
            <span className="font-heading text-lg font-bold text-white">A</span>
          </div>
          <span className="font-heading text-xl font-bold text-foreground">
            {SITE_NAME}
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-1">
          {mainNavigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "px-3 py-2 rounded-md text-sm font-medium transition-colors",
                item.highlight
                  ? "bg-primary text-white hover:bg-primary-hover"
                  : pathname === item.href
                    ? "text-primary bg-surface-teal"
                    : "text-foreground-muted hover:text-foreground hover:bg-surface",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileOpen(true)}
          className="lg:hidden p-2 rounded-md text-foreground-muted hover:bg-surface"
          aria-label="Ouvrir le menu"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      <MobileNav open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </header>
  );
}
