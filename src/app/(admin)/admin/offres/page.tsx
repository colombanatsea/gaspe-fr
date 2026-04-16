"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { type Job } from "@/data/jobs";
import { formatDate } from "@/lib/utils";
import { getAllOffers, toggleJobPublished, deleteJob } from "@/lib/jobs-store";

export default function AdminOffresPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [search, setSearch] = useState("");
  const [filterContract, setFilterContract] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  useEffect(() => {
    if (!user || user.role !== "admin") {
      router.push("/connexion");
      return;
    }
    getAllOffers().then(setAllJobs);
  }, [user, router]);

  if (!user || user.role !== "admin") return null;

  const filtered = allJobs.filter((j) => {
    const matchSearch =
      !search ||
      j.title.toLowerCase().includes(search.toLowerCase()) ||
      j.company.toLowerCase().includes(search.toLowerCase()) ||
      j.location.toLowerCase().includes(search.toLowerCase());
    const matchContract = !filterContract || j.contractType === filterContract;
    const matchStatus =
      !filterStatus ||
      (filterStatus === "published" && j.published) ||
      (filterStatus === "draft" && !j.published);
    return matchSearch && matchContract && matchStatus;
  });

  async function handleTogglePublish(id: string) {
    await toggleJobPublished(id);
    const refreshed = await getAllOffers();
    setAllJobs(refreshed);
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer cette offre ?")) return;
    await deleteJob(id);
    const refreshed = await getAllOffers();
    setAllJobs(refreshed);
  }

  const contractTypes = [...new Set(allJobs.map((j) => j.contractType))];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">
            Gestion des offres d&apos;emploi
          </h1>
          <p className="mt-1 text-sm text-foreground-muted">
            {filtered.length} offre{filtered.length !== 1 ? "s" : ""} au total
          </p>
        </div>
        <Button href="/admin/offres/new">
          <PlusIcon className="h-4 w-4" />
          Nouvelle offre
        </Button>
      </div>

      {/* Toolkit quick links */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl bg-[var(--gaspe-teal-600)]/5 border border-[var(--gaspe-teal-400)]/20 px-4 py-3">
        <span className="text-xs font-semibold text-foreground-muted">Boîte à outils :</span>
        <Link href="/boite-a-outils#guides-employeur" className="text-xs font-semibold text-[var(--gaspe-teal-600)] hover:underline">Guides employeur</Link>
        <span className="text-[var(--gaspe-neutral-300)]">·</span>
        <Link href="/boite-a-outils#grilles-salariales" className="text-xs font-semibold text-[var(--gaspe-teal-600)] hover:underline">Grilles salariales</Link>
        <span className="text-[var(--gaspe-neutral-300)]">·</span>
        <Link href="/boite-a-outils#simulateur-salaire" className="text-xs font-semibold text-[var(--gaspe-teal-600)] hover:underline">Simulateur</Link>
        <span className="text-[var(--gaspe-neutral-300)]">·</span>
        <Link href="/boite-a-outils#classifications" className="text-xs font-semibold text-[var(--gaspe-teal-600)] hover:underline">Classifications</Link>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par titre, entreprise, lieu..."
            className="w-full rounded-xl border border-[var(--gaspe-neutral-200)] bg-surface pl-10 pr-4 py-2.5 text-sm focus:border-[var(--gaspe-teal-400)] focus:ring-1 focus:ring-[var(--gaspe-teal-400)] focus:outline-none"
          />
        </div>
        <select
          value={filterContract}
          onChange={(e) => setFilterContract(e.target.value)}
          className="rounded-xl border border-[var(--gaspe-neutral-200)] bg-surface px-3.5 py-2.5 text-sm focus:border-[var(--gaspe-teal-400)] focus:ring-1 focus:ring-[var(--gaspe-teal-400)] focus:outline-none"
        >
          <option value="">Tous les contrats</option>
          {contractTypes.map((ct) => (
            <option key={ct} value={ct}>{ct}</option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-xl border border-[var(--gaspe-neutral-200)] bg-surface px-3.5 py-2.5 text-sm focus:border-[var(--gaspe-teal-400)] focus:ring-1 focus:ring-[var(--gaspe-teal-400)] focus:outline-none"
        >
          <option value="">Tous les statuts</option>
          <option value="published">Publié</option>
          <option value="draft">Brouillon</option>
        </select>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="rounded-lg border border-border-light bg-background p-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-surface-teal">
            <BriefcaseIcon className="h-8 w-8 text-primary" />
          </div>
          <h3 className="font-heading text-lg font-semibold text-foreground">
            Aucune offre trouv&eacute;e
          </h3>
          <p className="mt-2 text-sm text-foreground-muted">
            Modifiez vos filtres ou cr&eacute;ez une nouvelle offre.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-[var(--gaspe-neutral-200)] bg-surface">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--gaspe-neutral-200)] bg-[var(--gaspe-neutral-50)] text-left">
                <th className="px-4 py-3 text-xs font-semibold text-foreground-muted uppercase tracking-wider">Titre</th>
                <th className="px-4 py-3 text-xs font-semibold text-foreground-muted uppercase tracking-wider">Entreprise</th>
                <th className="px-4 py-3 text-xs font-semibold text-foreground-muted uppercase tracking-wider hidden lg:table-cell">Lieu</th>
                <th className="px-4 py-3 text-xs font-semibold text-foreground-muted uppercase tracking-wider">Contrat</th>
                <th className="px-4 py-3 text-xs font-semibold text-foreground-muted uppercase tracking-wider">Statut</th>
                <th className="px-4 py-3 text-xs font-semibold text-foreground-muted uppercase tracking-wider hidden md:table-cell">Date</th>
                <th className="px-4 py-3 text-xs font-semibold text-foreground-muted uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((job) => (
                <tr key={job.id} className="border-b border-[var(--gaspe-neutral-100)] last:border-0 hover:bg-[var(--gaspe-neutral-50)]/50 transition-colors">
                  <td className="px-4 py-3 font-heading text-sm font-semibold text-foreground">{job.title}</td>
                  <td className="px-4 py-3 text-foreground-muted">{job.company}</td>
                  <td className="px-4 py-3 text-foreground-muted hidden lg:table-cell">{job.location}</td>
                  <td className="px-4 py-3">
                    <Badge variant="neutral">{job.contractType}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={job.published ? "green" : "warm"}>
                      {job.published ? "Publié" : "Brouillon"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-foreground-muted hidden md:table-cell">{formatDate(job.publishedAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleTogglePublish(job.id)}
                        className="rounded-lg px-3 py-1.5 text-xs font-semibold text-[var(--gaspe-teal-600)] hover:bg-[var(--gaspe-teal-50)] transition-colors"
                      >
                        {job.published ? "Dépublier" : "Publier"}
                      </button>
                      <button
                        onClick={() => handleDelete(job.id)}
                        className="rounded-lg px-3 py-1.5 text-xs font-semibold text-foreground-muted hover:bg-red-50 hover:text-red-600 transition-colors"
                      >
                        Supprimer
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function BriefcaseIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M16 7V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v3" />
    </svg>
  );
}
