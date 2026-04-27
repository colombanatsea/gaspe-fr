"use client";

import { useState, useCallback } from "react";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { AdminMobileNav } from "@/components/layout/AdminMobileNav";
import { GaspeLogoWhite } from "@/components/shared/GaspeLogo";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const handleClose = useCallback(() => setMobileOpen(false), []);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <AdminSidebar />
      </div>

      {/* Mobile drawer */}
      <AdminMobileNav open={mobileOpen} onClose={handleClose} />

      {/* Main content */}
      <main id="main-content" className="flex-1 overflow-y-auto bg-surface">
        {/* Mobile top bar */}
        <div className="sticky top-0 z-30 flex items-center gap-3 border-b border-[var(--gaspe-neutral-200)] bg-white px-4 py-3 lg:hidden">
          <button
            onClick={() => setMobileOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-foreground-muted hover:bg-[var(--gaspe-neutral-100)] transition-colors"
            aria-label="Menu admin"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg gaspe-gradient">
              <GaspeLogoWhite size={18} />
            </div>
            <span className="font-heading text-sm font-bold text-foreground">Admin</span>
          </div>
        </div>

        <div className="p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
