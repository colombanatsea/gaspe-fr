"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { Card } from "@/components/ui/Card";

export default function AdminDashboardPage() {
  const { user, getAllUsers } = useAuth();
  const router = useRouter();
  const [counts, setCounts] = useState({ pending: 0, adherents: 0, candidats: 0, total: 0 });

  useEffect(() => {
    if (!user || user.role !== "admin") {
      router.push("/connexion");
      return;
    }
    const users = getAllUsers();
    setCounts({
      pending: users.filter((u) => u.role === "adherent" && !u.approved).length,
      adherents: users.filter((u) => u.role === "adherent" && u.approved).length,
      candidats: users.filter((u) => u.role === "candidat").length,
      total: users.length,
    });
  }, [user, router, getAllUsers]);

  if (!user || user.role !== "admin") return null;

  const stats = [
    { label: "Comptes en attente", value: String(counts.pending), href: "/admin/comptes", color: "border-l-[var(--gaspe-warm-400)]" },
    { label: "Adhérents actifs", value: String(counts.adherents), href: "/admin/comptes", color: "border-l-[var(--gaspe-blue-600)]" },
    { label: "Candidats", value: String(counts.candidats), href: "/admin/comptes", color: "border-l-[var(--gaspe-green-400)]" },
    { label: "Comptes total", value: String(counts.total), href: "/admin/comptes", color: "border-l-primary" },
  ];

  const quickActions = [
    { label: "G\u00e9rer les comptes", href: "/admin/comptes" },
    { label: "Offres d\u2019emploi", href: "/admin/offres" },
    { label: "Positions & Presse", href: "/admin/positions" },
    { label: "Formations", href: "/admin/formations" },
    { label: "Agenda", href: "/admin/agenda" },
    { label: "Documents", href: "/admin/documents" },
    { label: "Voir le site", href: "/", external: true },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">
          Tableau de bord
        </h1>
        <p className="mt-1 text-sm text-foreground-muted">
          Vue d&apos;ensemble de l&apos;administration du site GASPE.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <Card className={`${stat.color} hover:shadow-md transition-shadow`}>
              <p className="text-sm font-medium text-foreground-muted">
                {stat.label}
              </p>
              <p className="mt-2 font-heading text-3xl font-bold text-foreground">
                {stat.value}
              </p>
            </Card>
          </Link>
        ))}
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="font-heading text-lg font-semibold text-foreground mb-3">
          Actions rapides
        </h2>
        <div className="flex flex-wrap gap-3">
          {quickActions.map((action) => (
            <Link
              key={action.label}
              href={action.href}
              {...(action.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              className="inline-flex items-center gap-2 rounded-lg border-2 border-primary px-4 py-2 text-sm font-heading font-semibold text-primary hover:bg-surface-teal transition-colors"
            >
              {action.label}
              {action.external && (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14 21 3" />
                </svg>
              )}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
