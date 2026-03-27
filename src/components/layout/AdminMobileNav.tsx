"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth/AuthContext";

interface AdminMobileNavProps {
  open: boolean;
  onClose: () => void;
}

const navItems = [
  {
    section: "Général",
    items: [
      { label: "Tableau de bord", href: "/admin", icon: "M3 3h7v9H3zm11-0h7v5h-7zm0 9h7v9h-7zM3 16h7v5H3z" },
      { label: "Comptes", href: "/admin/comptes", icon: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" },
    ],
  },
  {
    section: "Contenu",
    items: [
      { label: "Offres d\u2019emploi", href: "/admin/offres", icon: "M2 7h20v14H2zM16 7V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v3" },
      { label: "Formations", href: "/admin/formations", icon: "M22 10v6M2 10l10-5 10 5-10 5zM6 12v5c0 2 4 3 6 3s6-1 6-3v-5" },
      { label: "Positions & Presse", href: "/admin/positions", icon: "M4 22h16a2 2 0 002-2V4a2 2 0 00-2-2H8a2 2 0 00-2 2v16a2 2 0 01-2 2zm0 0a2 2 0 01-2-2v-9c0-1.1.9-2 2-2h2" },
    ],
  },
  {
    section: "Organisation",
    items: [
      { label: "Agenda", href: "/admin/agenda", icon: "M3 4h18v18H3zM16 2v4M8 2v4M3 10h18" },
      { label: "Documents", href: "/admin/documents", icon: "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" },
      { label: "Paramètres", href: "/admin/parametres", icon: "M12 15a3 3 0 100-6 3 3 0 000 6z" },
    ],
  },
];

export function AdminMobileNav({ open, onClose }: AdminMobileNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  // Close on route change
  useEffect(() => {
    onClose();
  }, [pathname, onClose]);

  // Lock body scroll
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300 lg:hidden",
          open ? "opacity-100" : "opacity-0 pointer-events-none",
        )}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={cn(
          "fixed left-0 top-0 z-50 flex h-full w-72 flex-col bg-[var(--gaspe-neutral-900)] text-white transition-transform duration-300 ease-out lg:hidden",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl gaspe-gradient">
              <span className="font-heading text-sm font-bold text-white">G</span>
            </div>
            <div>
              <span className="font-heading text-sm font-bold block leading-tight">GASPE</span>
              <span className="text-[10px] font-medium uppercase tracking-widest text-[var(--gaspe-teal-400)]">
                Console Admin
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-[var(--gaspe-neutral-400)] hover:bg-white/10 hover:text-white transition-colors"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          {navItems.map((group) => (
            <div key={group.section}>
              <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-[var(--gaspe-neutral-500)]">
                {group.section}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive =
                    item.href === "/admin"
                      ? pathname === "/admin"
                      : pathname.startsWith(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-[var(--gaspe-teal-600)] text-white"
                          : "text-[var(--gaspe-neutral-400)] hover:bg-white/5 hover:text-white",
                      )}
                    >
                      <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                        <path d={item.icon} />
                      </svg>
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-white/5 px-3 py-4 space-y-2">
          {user && (
            <div className="px-3 mb-2">
              <p className="text-xs font-semibold text-white truncate">{user.name}</p>
              <p className="text-[10px] text-[var(--gaspe-neutral-500)] truncate">{user.email}</p>
            </div>
          )}
          <Link
            href="/"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-[var(--gaspe-neutral-500)] hover:text-[var(--gaspe-teal-400)] transition-colors"
          >
            <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
            </svg>
            Voir le site
          </Link>
          <button
            onClick={() => { logout(); router.push("/connexion"); }}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-[var(--gaspe-neutral-500)] hover:bg-red-500/10 hover:text-red-400 transition-colors"
          >
            <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
            </svg>
            Se déconnecter
          </button>
        </div>
      </div>
    </>
  );
}
