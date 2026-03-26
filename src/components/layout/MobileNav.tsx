"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { mainNavigation } from "@/data/navigation";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/constants";

interface MobileNavProps {
  open: boolean;
  onClose: () => void;
}

export function MobileNav({ open, onClose }: MobileNavProps) {
  const pathname = usePathname();

  // Close on route change
  useEffect(() => {
    onClose();
  }, [pathname, onClose]);

  // Lock scroll
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-foreground/30 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Slide panel */}
      <div
        className={cn(
          "fixed inset-y-0 right-0 z-50 w-72 bg-background shadow-xl transition-transform duration-300 lg:hidden",
          open ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-border-light px-4">
          <span className="font-heading text-lg font-bold">{SITE_NAME}</span>
          <button
            onClick={onClose}
            className="p-2 rounded-md text-foreground-muted hover:bg-surface"
            aria-label="Fermer le menu"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="flex flex-col gap-1 p-4">
          {mainNavigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-md px-3 py-3 text-sm font-medium transition-colors",
                item.highlight
                  ? "bg-primary text-white"
                  : pathname === item.href
                    ? "text-primary bg-surface-teal"
                    : "text-foreground hover:bg-surface",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 border-t border-border-light p-4">
          <p className="text-xs text-foreground-muted italic">{SITE_TAGLINE}</p>
        </div>
      </div>
    </>
  );
}
