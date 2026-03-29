"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { publishedJobs } from "@/data/jobs";

const FORMATIONS_KEY = "gaspe_formations";
const POSITIONS_KEY = "gaspe_positions";
const AGENDA_KEY = "gaspe_agenda";
const DOCUMENTS_KEY = "gaspe_documents";

function getStorageCount(key: string): number {
  if (typeof window === "undefined") return 0;
  try { return JSON.parse(localStorage.getItem(key) ?? "[]").length; } catch { return 0; }
}

export default function AdminDashboardPage() {
  const { user, getAllUsers } = useAuth();
  const router = useRouter();
  const [counts, setCounts] = useState({
    pending: 0, adherents: 0, candidats: 0, total: 0,
    formations: 0, positions: 0, events: 0, documents: 0,
  });

  useEffect(() => {
    if (!user || user.role !== "admin") { router.push("/connexion"); return; }
    const users = getAllUsers();
    setCounts({
      pending: users.filter((u) => u.role === "adherent" && !u.approved).length,
      adherents: users.filter((u) => u.role === "adherent" && u.approved).length,
      candidats: users.filter((u) => u.role === "candidat").length,
      total: users.length,
      formations: getStorageCount(FORMATIONS_KEY),
      positions: getStorageCount(POSITIONS_KEY),
      events: getStorageCount(AGENDA_KEY),
      documents: getStorageCount(DOCUMENTS_KEY),
    });
  }, [user, router, getAllUsers]);

  if (!user || user.role !== "admin") return null;

  const statCards = [
    {
      label: "En attente",
      value: counts.pending,
      href: "/admin/comptes",
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
      ),
      color: "var(--gaspe-warm-400)",
      bgColor: "var(--gaspe-warm-50)",
      urgent: counts.pending > 0,
    },
    {
      label: "Adhérents",
      value: counts.adherents,
      href: "/admin/comptes",
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
        </svg>
      ),
      color: "var(--gaspe-blue-600)",
      bgColor: "var(--gaspe-blue-50)",
    },
    {
      label: "Candidats",
      value: counts.candidats,
      href: "/admin/comptes",
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
        </svg>
      ),
      color: "var(--gaspe-green-500)",
      bgColor: "var(--gaspe-green-50)",
    },
    {
      label: "Offres actives",
      value: publishedJobs.length,
      href: "/admin/offres",
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0 1 12 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 0 1-.673-.38m0 0A2.18 2.18 0 0 1 3 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m7.5 0V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v.894m7.5 0a48.667 48.667 0 0 0-7.5 0" />
        </svg>
      ),
      color: "var(--gaspe-teal-600)",
      bgColor: "var(--gaspe-teal-50)",
    },
  ];

  const cmsCards = [
    { label: "Formations", count: counts.formations, href: "/admin/formations", action: "Nouvelle formation", actionHref: "/admin/formations/new" },
    { label: "Positions & Presse", count: counts.positions, href: "/admin/positions", action: "Nouveau contenu", actionHref: "/admin/positions/new" },
    { label: "Événements", count: counts.events, href: "/admin/agenda", action: "Gérer l'agenda", actionHref: "/admin/agenda" },
    { label: "Documents", count: counts.documents, href: "/admin/documents", action: "Gérer les docs", actionHref: "/admin/documents" },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">
            Tableau de bord
          </h1>
          <p className="mt-1 text-sm text-foreground-muted">
            Bienvenue, {user.name}. Vue d&apos;ensemble du site GASPE.
          </p>
        </div>
        <Link
          href="/"
          target="_blank"
          className="hidden sm:inline-flex items-center gap-2 rounded-xl border border-[var(--gaspe-neutral-200)] bg-white px-4 py-2.5 text-sm font-medium text-foreground-muted hover:text-foreground hover:border-[var(--gaspe-neutral-300)] transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
          </svg>
          Voir le site
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Link key={stat.label} href={stat.href} className="group">
            <div className={`rounded-2xl bg-white border border-[var(--gaspe-neutral-200)] p-5 gaspe-card-hover ${stat.urgent ? "ring-2 ring-[var(--gaspe-warm-400)]/30" : ""}`}>
              <div className="flex items-center justify-between mb-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl transition-colors"
                  style={{ backgroundColor: stat.bgColor, color: stat.color }}
                >
                  {stat.icon}
                </div>
                {stat.urgent && (
                  <span className="flex h-2.5 w-2.5 rounded-full bg-[var(--gaspe-warm-400)] animate-pulse" />
                )}
              </div>
              <p className="font-heading text-3xl font-bold text-foreground">{stat.value}</p>
              <p className="mt-1 text-xs font-medium text-foreground-muted uppercase tracking-wider">
                {stat.label}
              </p>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* CMS Management */}
        <div className="lg:col-span-2">
          <h2 className="font-heading text-lg font-semibold text-foreground mb-4">
            Gestion du contenu
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {cmsCards.map((card) => (
              <div key={card.label} className="rounded-2xl bg-white border border-[var(--gaspe-neutral-200)] p-5 hover:border-[var(--gaspe-teal-200)] transition-colors">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-heading text-sm font-semibold text-foreground">{card.label}</h3>
                  <span className="text-xs font-bold text-[var(--gaspe-teal-600)] bg-[var(--gaspe-teal-50)] px-2.5 py-1 rounded-lg">
                    {card.count}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Link
                    href={card.href}
                    className="flex-1 rounded-xl bg-[var(--gaspe-neutral-100)] px-3 py-2 text-xs font-medium text-foreground-muted text-center hover:bg-[var(--gaspe-neutral-200)] transition-colors"
                  >
                    Voir tout
                  </Link>
                  <Link
                    href={card.actionHref}
                    className="flex-1 rounded-xl bg-[var(--gaspe-teal-600)] px-3 py-2 text-xs font-medium text-white text-center hover:bg-[var(--gaspe-teal-700)] transition-colors"
                  >
                    {card.action}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick actions sidebar */}
        <div>
          <h2 className="font-heading text-lg font-semibold text-foreground mb-4">
            Actions rapides
          </h2>
          <div className="rounded-2xl bg-white border border-[var(--gaspe-neutral-200)] divide-y divide-[var(--gaspe-neutral-100)]">
            {[
              { label: "Nouvelle offre d\u2019emploi", href: "/admin/offres/new", icon: "+" },
              { label: "Nouvelle formation", href: "/admin/formations/new", icon: "+" },
              { label: "Nouveau contenu", href: "/admin/positions/new", icon: "+" },
              { label: "Gérer les comptes", href: "/admin/comptes", icon: "\u2192" },
              { label: "Paramètres du site", href: "/admin/parametres", icon: "\u2192" },
            ].map((action) => (
              <Link
                key={action.label}
                href={action.href}
                className="flex items-center justify-between px-5 py-3.5 text-sm text-foreground hover:bg-[var(--gaspe-neutral-50)] transition-colors first:rounded-t-2xl last:rounded-b-2xl"
              >
                {action.label}
                <span className="text-[var(--gaspe-teal-600)] font-bold">{action.icon}</span>
              </Link>
            ))}
          </div>

          {/* Site info */}
          <div className="mt-4 rounded-2xl bg-gradient-to-br from-[var(--gaspe-neutral-900)] to-[var(--gaspe-teal-900)] p-5 text-white">
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--gaspe-teal-400)] mb-2">Infos site</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-white/50">Pages</span>
                <span className="font-semibold">46</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">Adhérents</span>
                <span className="font-semibold">31</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">Offres</span>
                <span className="font-semibold">{publishedJobs.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">Comptes</span>
                <span className="font-semibold">{counts.total}</span>
              </div>
              <div className="flex justify-between border-t border-white/10 pt-2 mt-2">
                <span className="text-white/50">Version</span>
                <span className="font-semibold text-[var(--gaspe-teal-400)]">v2.0.0</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
