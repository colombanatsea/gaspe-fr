"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { MediaLibrary } from "@/components/admin/MediaLibrary";
import { ContentPreview } from "@/components/admin/ContentPreview";
import { ListEditor } from "@/components/admin/ListEditor";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import {
  PAGE_DEFINITIONS,
  getPageContent,
  savePageContent,
  apiGetPageContent,
  apiSavePageContent,
  type PageContent,
  type PageSection,
  type MediaItem,
  type ApiMediaItem,
} from "@/lib/cms-store";
import { isApiMode } from "@/lib/api-client";
import { getCmsDefault } from "@/data/cms-defaults";

/** Map page id → public preview URL (for iframe). Footer has no public page. */
const PAGE_PREVIEW_URL: Record<string, string | null> = {
  homepage: "/",
  "notre-groupement": "/notre-groupement",
  contact: "/contact",
  agenda: "/agenda",
  documents: "/documents",
  formations: "/formations",
  "nos-adherents": "/nos-adherents",
  "nos-compagnies-recrutent": "/nos-compagnies-recrutent",
  positions: "/positions",
  ssgm: "/ssgm",
  "transition-ecologique": "/transition-ecologique",
  "boite-a-outils": "/boite-a-outils",
  "decouvrir-espace-adherent": "/decouvrir-espace-adherent",
  "mentions-legales": "/mentions-legales",
  confidentialite: "/confidentialite",
  cgu: "/cgu",
  presse: "/presse",
  footer: null,
};

/** Group sections by prefix (text before first "-"). E.g. "hero-title" → "hero". */
function groupSections(sections: (PageSection & { modified?: boolean })[]) {
  const groups = new Map<string, (PageSection & { modified?: boolean })[]>();
  for (const section of sections) {
    const match = section.id.match(/^([^-]+)-/);
    const key = match ? match[1] : "general";
    const list = groups.get(key) || [];
    list.push(section);
    groups.set(key, list);
  }
  return Array.from(groups.entries());
}

/** Human-readable group labels. */
const GROUP_LABELS: Record<string, string> = {
  page: "Header de page",
  hero: "Hero / En-tête",
  stats: "Statistiques",
  news: "Actualités & Positions",
  cta: "Appel à l'action (CTA)",
  adherents: "Adhérents",
  timeline: "Timeline",
  mission: "Mission",
  engagements: "Engagements",
  bureau: "Bureau",
  address: "Adresse",
  email: "Email",
  sidebar: "Encart latéral",
  form: "Formulaire",
  success: "Confirmation",
  error: "Erreur",
  intro: "Introduction",
  key: "Chiffres clés",
  simulator: "Simulateur",
  technologies: "Technologies",
  search: "Recherche",
  empty: "État vide",
  filters: "Filtres",
  quick: "Mini-stats",
  newsletter: "Newsletter",
  social: "Réseaux sociaux",
  contact: "Contact",
  toolkit: "Boîte à outils",
  restricted: "Accès restreint",
  banner: "Bannière",
  adhesion: "Adhésion",
  redirect: "Redirection",
  disclaimer: "Avertissement",
  geoloc: "Géolocalisation",
  titulaires: "Titulaires",
  associes: "Associés",
  positions: "Positions",
  presse: "Presse",
  deadline: "Deadline",
  general: "Autre",
};

export default function AdminPagesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [selectedPageId, setSelectedPageId] = useState(PAGE_DEFINITIONS[0].id);
  const [sections, setSections] = useState<PageSection[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [showMediaLibrary, setShowMediaLibrary] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeEditorInsert, setActiveEditorInsert] = useState<((item: MediaItem) => void) | null>(null);
  const [search, setSearch] = useState("");
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [modifiedIds, setModifiedIds] = useState<Set<string>>(new Set());
  const [previewKey, setPreviewKey] = useState(0);

  useEffect(() => {
    if (!user || user.role !== "admin") {
      router.push("/connexion");
    }
  }, [user, router]);

  useEffect(() => {
    const pageDef = PAGE_DEFINITIONS.find((p) => p.id === selectedPageId);
    if (!pageDef) return;

    const emptySections = pageDef.sections.map((def) => ({
      id: def.id, label: def.label, type: def.type,
      itemFields: def.itemFields,
      content: getCmsDefault(selectedPageId, def.id),
    }));

    function applyStored(stored: PageContent | null) {
      if (stored) {
        const merged = pageDef!.sections.map((def) => {
          const existing = stored.sections.find((s) => s.id === def.id);
          const content = existing?.content?.trim()
            ? existing.content
            : getCmsDefault(selectedPageId, def.id);
          return { id: def.id, label: def.label, type: def.type, itemFields: def.itemFields, content };
        });
        setSections(merged);
      } else {
        setSections(emptySections);
      }
      setSaved(false);
      setModifiedIds(new Set());
      setSearch("");
    }

    if (isApiMode()) {
      apiGetPageContent(selectedPageId).then(applyStored);
    } else {
      applyStored(getPageContent(selectedPageId));
    }
  }, [selectedPageId]);

  function updateSection(id: string, content: string) {
    setSections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, content } : s))
    );
    setSaved(false);
    setModifiedIds((prev) => new Set(prev).add(id));
  }

  async function handleSave() {
    const pageContent: PageContent = {
      pageId: selectedPageId,
      sections,
      updatedAt: new Date().toISOString(),
    };
    if (isApiMode()) {
      await apiSavePageContent(pageContent);
    } else {
      savePageContent(pageContent);
    }
    setSaved(true);
    setModifiedIds(new Set());
    setPreviewKey((k) => k + 1); // refresh iframe
    setTimeout(() => setSaved(false), 3000);
  }

  function resetSection(id: string) {
    const defaultValue = getCmsDefault(selectedPageId, id);
    setSections((prev) => prev.map((s) => (s.id === id ? { ...s, content: defaultValue } : s)));
    setModifiedIds((prev) => new Set(prev).add(id));
  }

  function handleMediaSelect(item: MediaItem | ApiMediaItem) {
    if (activeEditorInsert) {
      if (item.type.startsWith("image/") && "data" in item) {
        navigator.clipboard?.writeText(item.data);
      }
      setActiveEditorInsert(null);
    }
    setShowMediaLibrary(false);
  }

  function toggleGroup(key: string) {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const filteredSections = useMemo(() => {
    if (!search.trim()) return sections;
    const q = search.toLowerCase();
    return sections.filter((s) =>
      s.id.toLowerCase().includes(q) ||
      s.label.toLowerCase().includes(q) ||
      s.content.toLowerCase().includes(q)
    );
  }, [sections, search]);

  const grouped = useMemo(() => groupSections(filteredSections.map((s) => ({ ...s, modified: modifiedIds.has(s.id) }))), [filteredSections, modifiedIds]);
  const previewUrl = PAGE_PREVIEW_URL[selectedPageId] ?? null;
  const modifiedCount = modifiedIds.size;

  if (!user || user.role !== "admin") return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Éditeur de pages</h1>
          <p className="mt-1 text-sm text-foreground-muted">
            Modifiez le contenu de chaque section des pages publiques du site.
            {modifiedCount > 0 && (
              <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-[var(--gaspe-warm-50)] px-2 py-0.5 text-xs font-semibold text-[var(--gaspe-warm-600)]">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--gaspe-warm-500)]" />
                {modifiedCount} modification{modifiedCount > 1 ? "s" : ""} non enregistrée{modifiedCount > 1 ? "s" : ""}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {previewUrl && (
            <button
              onClick={() => setShowPreview(!showPreview)}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
                showPreview
                  ? "bg-[var(--gaspe-teal-50)] text-[var(--gaspe-teal-600)] border border-[var(--gaspe-teal-200)]"
                  : "border border-[var(--gaspe-neutral-200)] text-foreground-muted hover:text-foreground hover:border-[var(--gaspe-neutral-300)]"
              }`}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              </svg>
              {showPreview ? "Masquer l'aperçu" : "Aperçu page"}
            </button>
          )}
          <button
            onClick={() => setShowMediaLibrary(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--gaspe-neutral-200)] px-4 py-2 text-sm font-semibold text-foreground-muted hover:text-foreground hover:border-[var(--gaspe-neutral-300)]"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
            </svg>
            Médias
          </button>
          <button
            onClick={handleSave}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-white hover:bg-primary-hover shadow-sm"
          >
            {saved ? (
              <>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                Enregistré
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" />
                </svg>
                Enregistrer
              </>
            )}
          </button>
        </div>
      </div>

      {/* Page selector */}
      <div className="flex gap-2 flex-wrap">
        {PAGE_DEFINITIONS.map((page) => (
          <button
            key={page.id}
            onClick={() => setSelectedPageId(page.id)}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
              selectedPageId === page.id
                ? "bg-primary text-white shadow-sm"
                : "bg-white border border-[var(--gaspe-neutral-200)] text-foreground-muted hover:border-[var(--gaspe-teal-300)] hover:text-[var(--gaspe-teal-600)]"
            }`}
          >
            {page.label}
          </button>
        ))}
      </div>

      {/* Search box */}
      {sections.length > 8 && (
        <div className="relative">
          <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher une section…"
            className="w-full rounded-xl border border-[var(--gaspe-neutral-200)] bg-white pl-10 pr-4 py-2 text-sm focus:border-[var(--gaspe-teal-400)] focus:ring-1 focus:ring-[var(--gaspe-teal-400)] focus:outline-none"
          />
        </div>
      )}

      {/* Sections + Preview */}
      <div className={showPreview && previewUrl ? "grid grid-cols-1 xl:grid-cols-2 gap-6" : ""}>
        <div className="space-y-6">
          {grouped.map(([groupKey, groupSections]) => {
            const collapsed = collapsedGroups.has(groupKey);
            const groupLabel = GROUP_LABELS[groupKey] ?? groupKey;
            const modifiedInGroup = groupSections.filter((s) => s.modified).length;
            return (
              <div key={groupKey} className="space-y-3">
                <button
                  type="button"
                  onClick={() => toggleGroup(groupKey)}
                  className="flex items-center gap-2 text-sm font-heading font-semibold text-foreground uppercase tracking-wider w-full"
                >
                  <svg className={`h-4 w-4 transition-transform ${collapsed ? "-rotate-90" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                  </svg>
                  <span>{groupLabel}</span>
                  <span className="text-xs text-foreground-muted normal-case tracking-normal">
                    ({groupSections.length} section{groupSections.length > 1 ? "s" : ""})
                  </span>
                  {modifiedInGroup > 0 && (
                    <span className="ml-auto rounded-full bg-[var(--gaspe-warm-50)] px-2 py-0.5 text-[10px] font-semibold text-[var(--gaspe-warm-600)] normal-case tracking-normal">
                      {modifiedInGroup} modifié{modifiedInGroup > 1 ? "s" : ""}
                    </span>
                  )}
                </button>

                {!collapsed && groupSections.map((section) => (
                  <div key={section.id} className={`rounded-2xl bg-white border overflow-hidden transition-colors ${section.modified ? "border-[var(--gaspe-warm-400)]" : "border-[var(--gaspe-neutral-200)]"}`}>
                    <div className="flex items-center justify-between border-b border-[var(--gaspe-neutral-100)] bg-[var(--gaspe-neutral-50)] px-5 py-3">
                      <h3 className="font-heading text-sm font-semibold text-foreground flex items-center gap-2">
                        {section.modified && (
                          <span className="h-2 w-2 rounded-full bg-[var(--gaspe-warm-500)]" title="Modifié non enregistré" />
                        )}
                        {section.label}
                      </h3>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => resetSection(section.id)}
                          title="Réinitialiser au défaut"
                          className="text-xs text-foreground-muted hover:text-[var(--gaspe-teal-600)] underline"
                        >
                          Réinitialiser
                        </button>
                        <span className="rounded-full bg-[var(--gaspe-neutral-200)] px-2.5 py-0.5 text-[10px] font-medium text-foreground-muted uppercase">
                          {section.type}
                        </span>
                      </div>
                    </div>
                    <div className="p-4">
                      {section.type === "richtext" ? (
                        <ErrorBoundary name="RichTextEditor">
                          <RichTextEditor
                            value={section.content}
                            onChange={(html) => updateSection(section.id, html)}
                            minHeight={200}
                            onMediaLibraryOpen={() => setShowMediaLibrary(true)}
                          />
                        </ErrorBoundary>
                      ) : section.type === "list" ? (
                        <ListEditor
                          value={section.content}
                          onChange={(json) => updateSection(section.id, json)}
                          fields={section.itemFields ?? []}
                        />
                      ) : section.type === "image" ? (
                        <div className="space-y-3">
                          <input
                            type="url"
                            value={section.content}
                            onChange={(e) => updateSection(section.id, e.target.value)}
                            placeholder="URL de l'image..."
                            className="w-full rounded-xl border border-[var(--gaspe-neutral-200)] bg-white px-3.5 py-2.5 text-sm focus:border-[var(--gaspe-teal-400)] focus:ring-1 focus:ring-[var(--gaspe-teal-400)] focus:outline-none"
                          />
                          {section.content && (
                            <Image
                              src={section.content}
                              alt="Aperçu image"
                              width={320}
                              height={128}
                              unoptimized
                              loading="lazy"
                              className="max-h-32 w-auto rounded-xl object-contain"
                            />
                          )}
                          <button
                            type="button"
                            onClick={() => setShowMediaLibrary(true)}
                            className="text-sm text-primary hover:text-primary-hover font-medium"
                          >
                            Choisir depuis la bibliothèque
                          </button>
                        </div>
                      ) : (
                        <input
                          type="text"
                          value={section.content}
                          onChange={(e) => updateSection(section.id, e.target.value)}
                          placeholder={`${section.label}...`}
                          className="w-full rounded-xl border border-[var(--gaspe-neutral-200)] bg-white px-3.5 py-2.5 text-sm focus:border-[var(--gaspe-teal-400)] focus:ring-1 focus:ring-[var(--gaspe-teal-400)] focus:outline-none"
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            );
          })}

          {/* Rich text preview fallback when no iframe */}
          {!previewUrl && showPreview && (
            <div className="space-y-4">
              {sections
                .filter((s) => s.type === "richtext" && s.content)
                .map((section) => (
                  <div key={section.id}>
                    <ContentPreview html={section.content} title={section.label} />
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Iframe preview */}
        {showPreview && previewUrl && (
          <div className="space-y-3">
            <div className="sticky top-20 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-foreground-muted">
                  Aperçu de <code className="rounded bg-[var(--gaspe-neutral-100)] px-1.5 py-0.5 text-[11px]">{previewUrl}</code>
                </p>
                <button
                  type="button"
                  onClick={() => setPreviewKey((k) => k + 1)}
                  className="text-xs text-primary hover:underline font-medium"
                >
                  Rafraîchir
                </button>
              </div>
              <div className="rounded-2xl border border-[var(--gaspe-neutral-200)] overflow-hidden bg-white">
                <iframe
                  key={previewKey}
                  src={previewUrl}
                  className="w-full h-[80vh]"
                  title={`Aperçu ${selectedPageId}`}
                />
              </div>
              <p className="text-[11px] text-foreground-muted italic">
                Enregistrez pour voir vos modifications dans l&apos;aperçu.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Media Library Modal */}
      <MediaLibrary
        open={showMediaLibrary}
        onClose={() => setShowMediaLibrary(false)}
        onSelect={handleMediaSelect}
      />
    </div>
  );
}
