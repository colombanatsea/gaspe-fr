"use client";

/**
 * /admin/pages-custom — gestion des pages custom Phase 3 hybride.
 * Liste, crée, archive. L'édition du contenu se fait sur la route
 * /admin/pages-custom/edit?slug=X (pattern query-string pour compat
 * static export).
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { isStaffOrAdmin } from "@/lib/auth/permissions";
import { Badge } from "@/components/ui/Badge";
import {
  apiListCustomPages,
  apiCreateCustomPage,
  apiDeleteCustomPage,
  type CmsCustomPage,
} from "@/lib/cms-store";
import { isApiMode } from "@/lib/api-client";
import { formatDate } from "@/lib/utils";

function slugify(label: string): string {
  return label
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export default function AdminCustomPagesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [pages, setPages] = useState<CmsCustomPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!user || !isStaffOrAdmin(user)) {
      router.push("/connexion");
    }
  }, [user, router]);

  useEffect(() => {
    if (!user || !isStaffOrAdmin(user)) return;
    if (!isApiMode()) {
      setLoading(false);
      return;
    }
    setLoading(true);
    apiListCustomPages(true)
      .then((list) => setPages(list))
      .finally(() => setLoading(false));
  }, [user, reloadKey]);

  async function handleCreate(payload: { slug: string; label: string }) {
    const res = await apiCreateCustomPage(payload);
    if (!res.success) {
      alert(`Création impossible : ${res.error}`);
      return;
    }
    setShowCreateModal(false);
    router.push(`/admin/pages-custom/edit?slug=${encodeURIComponent(res.slug)}`);
  }

  async function handleArchive(slug: string, label: string) {
    if (!confirm(`Archiver la page « ${label} » ? Elle disparaîtra du site public.`)) return;
    const ok = await apiDeleteCustomPage(slug);
    if (!ok) {
      alert("Échec de l'archivage.");
      return;
    }
    setReloadKey((k) => k + 1);
  }

  if (!user || !isStaffOrAdmin(user)) return null;

  const visiblePages = pages.filter((p) => !p.isArchived);
  const archivedPages = pages.filter((p) => p.isArchived);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Pages custom</h1>
          <p className="mt-1 text-sm text-foreground-muted">
            Pages libres créées par l&apos;admin (différentes des pages système éditables via{" "}
            <Link href="/admin/pages" className="text-primary underline">/admin/pages</Link>).
            Publiées sous{" "}
            <code className="font-mono text-xs bg-[var(--gaspe-neutral-100)] px-1.5 py-0.5 rounded">/p?slug=…</code>.
          </p>
        </div>
        {isApiMode() && (
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--gaspe-teal-600)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--gaspe-teal-700)] transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" />
            </svg>
            Nouvelle page custom
          </button>
        )}
      </div>

      {!isApiMode() && (
        <div className="rounded-2xl border border-[var(--gaspe-warm-300)] bg-[var(--gaspe-warm-50)] p-5">
          <p className="text-sm font-semibold text-foreground">Mode démo (localStorage)</p>
          <p className="mt-1 text-xs text-foreground-muted">
            Les pages custom nécessitent le mode API (configurer{" "}
            <code className="font-mono">NEXT_PUBLIC_API_URL</code>).
          </p>
        </div>
      )}

      {loading && isApiMode() && (
        <p className="py-12 text-center text-sm text-foreground-muted">Chargement…</p>
      )}

      {!loading && isApiMode() && visiblePages.length === 0 && archivedPages.length === 0 && (
        <div className="rounded-2xl border border-dashed border-[var(--gaspe-neutral-200)] bg-white p-12 text-center">
          <h3 className="font-heading text-lg font-semibold text-foreground">Aucune page custom</h3>
          <p className="mt-2 text-sm text-foreground-muted">
            Créez votre première page entièrement libre depuis le bouton ci-dessus.
          </p>
        </div>
      )}

      {visiblePages.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border border-[var(--gaspe-neutral-200)] bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--gaspe-neutral-200)] bg-[var(--gaspe-neutral-50)] text-left">
                <th className="px-4 py-3 text-xs font-semibold text-foreground-muted uppercase tracking-wider">Titre</th>
                <th className="px-4 py-3 text-xs font-semibold text-foreground-muted uppercase tracking-wider">Slug</th>
                <th className="px-4 py-3 text-xs font-semibold text-foreground-muted uppercase tracking-wider">Statut</th>
                <th className="px-4 py-3 text-xs font-semibold text-foreground-muted uppercase tracking-wider">Mise à jour</th>
                <th className="px-4 py-3 text-xs font-semibold text-foreground-muted uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visiblePages.map((p) => (
                <tr key={p.slug} className="border-b border-[var(--gaspe-neutral-100)] last:border-0 hover:bg-[var(--gaspe-neutral-50)]/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground">{p.label}</td>
                  <td className="px-4 py-3 font-mono text-xs text-foreground-muted">{p.slug}</td>
                  <td className="px-4 py-3">
                    <Badge variant={p.published ? "green" : "warm"}>
                      {p.published ? "Publiée" : "Brouillon"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-foreground-muted">{formatDate(p.updatedAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/pages-custom/edit?slug=${encodeURIComponent(p.slug)}`}
                        className="rounded-lg px-3 py-1.5 text-xs font-semibold text-[var(--gaspe-teal-600)] hover:bg-[var(--gaspe-teal-50)] transition-colors"
                      >
                        Éditer
                      </Link>
                      {p.published && (
                        <Link
                          href={`/p?slug=${encodeURIComponent(p.slug)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-lg px-3 py-1.5 text-xs font-semibold text-foreground-muted hover:bg-[var(--gaspe-neutral-100)] transition-colors"
                        >
                          Voir →
                        </Link>
                      )}
                      <button
                        type="button"
                        onClick={() => handleArchive(p.slug, p.label)}
                        className="rounded-lg px-3 py-1.5 text-xs font-semibold text-foreground-muted hover:bg-red-50 hover:text-red-600 transition-colors"
                      >
                        Archiver
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {archivedPages.length > 0 && (
        <details className="rounded-2xl border border-[var(--gaspe-neutral-200)] bg-white p-5">
          <summary className="cursor-pointer text-sm font-semibold text-foreground-muted">
            Pages archivées ({archivedPages.length})
          </summary>
          <ul className="mt-3 space-y-1 text-sm text-foreground-muted">
            {archivedPages.map((p) => (
              <li key={p.slug} className="flex items-center gap-2 font-mono text-xs">
                <span className="line-through">{p.label}</span>
                <span className="opacity-50">({p.slug})</span>
              </li>
            ))}
          </ul>
        </details>
      )}

      {showCreateModal && (
        <CreateCustomPageModal
          onCancel={() => setShowCreateModal(false)}
          onCreate={handleCreate}
          existingSlugs={new Set(pages.map((p) => p.slug))}
        />
      )}
    </div>
  );
}

function CreateCustomPageModal({
  onCancel,
  onCreate,
  existingSlugs,
}: {
  onCancel: () => void;
  onCreate: (payload: { slug: string; label: string }) => void | Promise<void>;
  existingSlugs: Set<string>;
}) {
  const [label, setLabel] = useState("");
  const [slug, setSlug] = useState("");
  const [autoSlug, setAutoSlug] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const effectiveSlug = autoSlug ? slugify(label) : slug.trim();
  const slugCollision = existingSlugs.has(effectiveSlug);
  const slugValid = /^[a-z0-9][a-z0-9-]{0,79}$/.test(effectiveSlug);
  const canSubmit = label.trim().length > 0 && slugValid && !slugCollision && !submitting;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await onCreate({ slug: effectiveSlug, label: label.trim() });
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    "w-full rounded-xl border border-[var(--gaspe-neutral-200)] bg-white px-3.5 py-2 text-sm text-foreground focus:border-[var(--gaspe-teal-400)] focus:outline-none focus:ring-1 focus:ring-[var(--gaspe-teal-400)]";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="flex w-full max-w-lg flex-col rounded-2xl border border-[var(--gaspe-neutral-200)] bg-white shadow-xl">
        <div className="flex items-start justify-between border-b border-[var(--gaspe-neutral-200)] px-6 py-4">
          <div>
            <h2 className="font-heading text-lg font-bold text-foreground">Nouvelle page custom</h2>
            <p className="text-xs text-foreground-muted mt-0.5">
              Sera publiée sous <code className="font-mono">/p?slug={effectiveSlug || "…"}</code>
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Fermer"
            className="rounded-lg p-2 text-foreground-muted transition-colors hover:bg-[var(--gaspe-neutral-100)]"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Titre de la page <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Ex : Conférence économie bleue 2026"
              className={inputClass}
              autoFocus
              maxLength={120}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-foreground">Slug (permalien)</label>
              <label className="flex items-center gap-1.5 text-xs text-foreground-muted">
                <input
                  type="checkbox"
                  checked={autoSlug}
                  onChange={(e) => setAutoSlug(e.target.checked)}
                  className="h-3.5 w-3.5"
                />
                Auto (depuis le titre)
              </label>
            </div>
            <input
              type="text"
              value={effectiveSlug}
              onChange={(e) => setSlug(e.target.value)}
              disabled={autoSlug}
              placeholder="ex : conference-economie-bleue-2026"
              className={`${inputClass} font-mono text-xs disabled:bg-[var(--gaspe-neutral-50)] disabled:text-foreground-muted disabled:cursor-not-allowed`}
              maxLength={80}
            />
            <p className="mt-1 text-[11px] text-foreground-muted">
              a-z, 0-9, tiret. Non modifiable après création (préserve les permaliens).
            </p>
            {effectiveSlug && !slugValid && (
              <p className="mt-1 text-xs text-red-600">Slug invalide.</p>
            )}
            {slugCollision && (
              <p className="mt-1 text-xs text-red-600">
                Une page avec ce slug existe déjà.
              </p>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-[var(--gaspe-neutral-100)] pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-xl px-4 py-2 text-sm font-medium text-foreground-muted hover:bg-[var(--gaspe-neutral-100)]"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="rounded-xl bg-[var(--gaspe-teal-600)] px-5 py-2 text-sm font-semibold text-white hover:bg-[var(--gaspe-teal-700)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "Création…" : "Créer la page"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
