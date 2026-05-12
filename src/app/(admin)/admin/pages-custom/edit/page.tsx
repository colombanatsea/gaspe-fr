"use client";

/**
 * /admin/pages-custom/edit?slug=X — édition d'une page custom Phase 3.
 * Query-param pattern (compat static export).
 */

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { isStaffOrAdmin } from "@/lib/auth/permissions";
import { Badge } from "@/components/ui/Badge";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { MediaLibrary } from "@/components/admin/MediaLibrary";
import { ContentPreview } from "@/components/admin/ContentPreview";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import {
  apiListCustomPages,
  apiUpdateCustomPage,
  type CmsCustomPage,
} from "@/lib/cms-store";

function EditCustomPageContent() {
  const searchParams = useSearchParams();
  const slug = searchParams.get("slug") ?? "";
  const { user } = useAuth();
  const router = useRouter();

  const [page, setPage] = useState<CmsCustomPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [label, setLabel] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [published, setPublished] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showMedia, setShowMedia] = useState(false);

  useEffect(() => {
    if (!user) return;
    if (!isStaffOrAdmin(user)) {
      router.push("/connexion");
      return;
    }
    if (!slug) {
      setError("Aucun slug fourni dans l'URL (?slug=…).");
      setLoading(false);
      return;
    }
    // On charge via apiListCustomPages(true) car le GET single ne
    // retourne pas les brouillons (filtre published=1 côté Worker).
    apiListCustomPages(true)
      .then((list) => {
        const found = list.find((p) => p.slug === slug);
        if (!found) {
          setError("Page introuvable.");
          return;
        }
        setPage(found);
        setLabel(found.label);
        setDescription(found.description);
        setContent(found.content);
        setPublished(found.published);
      })
      .catch(() => setError("Erreur lors du chargement."))
      .finally(() => setLoading(false));
  }, [user, slug, router]);

  async function handleSave() {
    if (!page) return;
    setSaving(true);
    try {
      const ok = await apiUpdateCustomPage(page.slug, {
        label: label.trim(),
        description,
        content,
        published,
      });
      if (!ok) {
        alert("Échec de la sauvegarde.");
        return;
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  }

  if (!user || !isStaffOrAdmin(user)) return null;

  if (loading) {
    return <p className="py-12 text-center text-sm text-foreground-muted">Chargement…</p>;
  }

  if (error || !page) {
    return (
      <div className="mx-auto max-w-2xl py-12 text-center">
        <p className="text-sm text-red-600 mb-4">{error ?? "Page introuvable."}</p>
        <Link href="/admin/pages-custom" className="text-primary underline text-sm">
          ← Retour à la liste
        </Link>
      </div>
    );
  }

  const inputClass =
    "w-full rounded-xl border border-[var(--gaspe-neutral-200)] bg-white px-3.5 py-2.5 text-sm text-foreground focus:border-[var(--gaspe-teal-400)] focus:ring-1 focus:ring-[var(--gaspe-teal-400)] focus:outline-none";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <Link
            href="/admin/pages-custom"
            className="text-xs text-foreground-muted hover:text-foreground underline"
          >
            ← Retour à la liste
          </Link>
          <h1 className="font-heading text-2xl font-bold text-foreground mt-1">
            Éditer la page custom
          </h1>
          <p className="text-sm text-foreground-muted">
            Slug : <code className="font-mono text-xs bg-[var(--gaspe-neutral-100)] px-1.5 py-0.5 rounded">{page.slug}</code>
            {published && (
              <>
                {" · "}
                <a
                  href={`/p?slug=${encodeURIComponent(page.slug)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline"
                >
                  Voir la page publiée →
                </a>
              </>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={published ? "green" : "warm"}>
            {published ? "Publiée" : "Brouillon"}
          </Badge>
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className={`rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
              showPreview
                ? "bg-[var(--gaspe-teal-50)] text-[var(--gaspe-teal-600)]"
                : "text-foreground-muted hover:text-foreground"
            }`}
          >
            {showPreview ? "Masquer l'aperçu" : "Aperçu"}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--gaspe-teal-600)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--gaspe-teal-700)] disabled:opacity-50"
          >
            {saved ? "✓ Enregistré" : saving ? "Sauvegarde…" : "Enregistrer"}
          </button>
        </div>
      </div>

      <div className="space-y-5 rounded-2xl bg-white border border-[var(--gaspe-neutral-200)] p-6">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Titre <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className={inputClass}
            maxLength={120}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Description (méta + sous-titre du header)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className={inputClass}
            placeholder="Court résumé pour le SEO et l'affichage en sous-titre"
            maxLength={300}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Contenu (HTML riche)
          </label>
          <ErrorBoundary name="RichTextEditor (custom page)">
            <RichTextEditor
              value={content}
              onChange={setContent}
              minHeight={400}
              onMediaLibraryOpen={() => setShowMedia(true)}
            />
          </ErrorBoundary>
        </div>

        <div className="flex items-center gap-3 pt-2 border-t border-[var(--gaspe-neutral-100)]">
          <input
            id="published"
            type="checkbox"
            checked={published}
            onChange={(e) => setPublished(e.target.checked)}
            className="h-4 w-4 rounded border-[var(--gaspe-neutral-300)] text-[var(--gaspe-teal-600)]"
          />
          <label htmlFor="published" className="text-sm font-medium text-foreground">
            Publier (rend la page accessible sur /p?slug={page.slug})
          </label>
        </div>
      </div>

      {showPreview && content && (
        <div>
          <h2 className="font-heading text-lg font-semibold text-foreground mb-3">Aperçu</h2>
          <ContentPreview html={content} title={label} />
        </div>
      )}

      <MediaLibrary open={showMedia} onClose={() => setShowMedia(false)} />
    </div>
  );
}

export default function AdminEditCustomPagePage() {
  return (
    <Suspense fallback={<p className="py-12 text-center text-sm text-foreground-muted">Chargement…</p>}>
      <EditCustomPageContent />
    </Suspense>
  );
}
