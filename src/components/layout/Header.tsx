"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { mainNavigation, authNavigation } from "@/data/navigation";
import { SITE_NAME } from "@/lib/constants";
import { MobileNav } from "./MobileNav";
import { useAuth } from "@/lib/auth/AuthContext";
import { Badge } from "@/components/ui/Badge";
import NotificationBell from "@/components/shared/NotificationBell";

const roleBadge = {
  admin: { label: "Admin", variant: "teal" as const },
  adherent: { label: "Adhérent", variant: "blue" as const },
  candidat: { label: "Candidat", variant: "warm" as const },
};

export function Header() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const menuRef = useRef<HTMLDivElement>(null);

  // Close user menu on click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Close menu on route change
  useEffect(() => {
    setUserMenuOpen(false);
  }, [pathname]);

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

          {/* Auth buttons */}
          {isAuthenticated && user ? (
            <>
            <NotificationBell />
            <div className="relative ml-2" ref={menuRef}>
              <button
                onClick={() => setUserMenuOpen((prev) => !prev)}
                className="flex items-center gap-2 rounded-lg border border-border-light px-3 py-1.5 text-sm font-medium text-foreground hover:bg-surface transition-colors"
              >
                <span className="hidden xl:inline">{user.name.split(" ")[0]}</span>
                <Badge variant={roleBadge[user.role].variant}>
                  {roleBadge[user.role].label}
                </Badge>
                <svg className="h-4 w-4 text-foreground-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-1 w-48 rounded-lg bg-background shadow-lg border border-border-light py-1 z-50">
                  <Link
                    href={authNavigation[user.role].href}
                    className="block px-4 py-2 text-sm text-foreground hover:bg-surface transition-colors"
                  >
                    Mon espace
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      setUserMenuOpen(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    Déconnexion
                  </button>
                </div>
              )}
            </div>
            </>
          ) : (
            <Link
              href="/connexion"
              className="ml-2 inline-flex items-center gap-2 rounded-lg border-2 border-primary px-4 py-1.5 text-sm font-heading font-semibold text-primary hover:bg-surface-teal transition-colors"
            >
              Connexion
            </Link>
          )}
        </nav>

        {/* Mobile hamburger */}
        <div className="flex items-center gap-2 lg:hidden">
          {isAuthenticated && user && (
            <>
              <NotificationBell />
              <Badge variant={roleBadge[user.role].variant}>
                {roleBadge[user.role].label}
              </Badge>
            </>
          )}
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2.5 -mr-1 rounded-lg text-foreground-muted hover:bg-surface"
            aria-label="Ouvrir le menu"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      <MobileNav open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </header>
  );
}
