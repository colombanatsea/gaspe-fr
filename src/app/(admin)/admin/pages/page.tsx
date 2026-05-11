"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { MediaLibrary } from "@/components/admin/MediaLibrary";
import { ContentPreview } from "@/components/admin/ContentPreview";
import { ListEditor } from "@/components/admin/ListEditor";
import { CmsRevisionsModal } from "@/components/admin/CmsRevisionsModal";
import {
  DevicePreviewSwitcher,
  DEVICE_DIMENSIONS,
  type PreviewDevice,
} from "@/components/admin/DevicePreviewSwitcher";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import {
  PAGE_DEFINITIONS,
  getPageContent,
  savePageContent,
  apiGetPageContent,
  apiSavePageContent,
  apiListCustomSections,
  apiCreateCustomSection,
  apiDeleteCustomSection,
  mergePageDefinitions,
  customSectionKey,
  type PageContent,
  type PageSection,
  type MediaItem,
  type ApiMediaItem,
  type CmsCustomSection,
} from "@/lib/cms-store";
import { isApiMode } from "@/lib/api-client";
import { getCmsDefault } from "@/data/cms-defaults";
import { isStaffOrAdmin } from "@/lib/auth/permissions";

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
  const [previewDevice, setPreviewDevice] = useState<PreviewDevice>("desktop");
  const [showRevisions, setShowRevisions] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [saveLabel, setSaveLabel] = useState("");
  // Phase 1 hybride C17/C18/C19 — sections custom mergées au runtime.
  const [customSections, setCustomSections] = useState<CmsCustomSection[]>([]);
  const [showAddSectionModal, setShowAddSectionModal] = useState(false);

  // Définitions fusionnées (système + custom). Source de vérité pour
  // l'éditeur et le sélecteur de page.
  const mergedDefinitions = useMemo(
    () => mergePageDefinitions(PAGE_DEFINITIONS, customSections),
    [customSections],
  );

  // Set des clés (pageId::sectionId) qui sont des sections custom
  // suppressibles. Les sections système ne sont jamais dans ce set.
  const customSectionKeys = useMemo(() => {
    const s = new Set<string>();
    for (const c of customSections) s.add(customSectionKey(c.pageId, c.sectionId));
    return s;
  }, [customSections]);

  useEffect(() => {
    if (!user || !isStaffOrAdmin(user)) {
      router.push("/connexion");
    }
  }, [user, router]);

  // Charge les custom sections une fois (mode API uniquement).
  useEffect(() => {
    void apiListCustomSections().then(setCustomSections);
  }, [reloadKey]);

  useEffect(() => {
    const pageDef = mergedDefinitions.find((p) => p.id === selectedPageId);
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
      setSaveLabel("");
    }

    if (isApiMode()) {
      apiGetPageContent(selectedPageId).then(applyStored);
    } else {
      applyStored(getPageContent(selectedPageId));
    }
  }, [selectedPageId, reloadKey, mergedDefinitions]);

  /** Phase 1 hybride : créer une nouvelle section custom sur la page. */
  async function handleAddCustomSection(payload: { sectionId: string; label: string; type: PageSection["type"] }) {
    const res = await apiCreateCustomSection(selectedPageId, payload);
    if (!res.success) {
      alert(`Impossible d'ajouter la section : ${res.error}`);
      return;
    }
    setShowAddSectionModal(false);
    setReloadKey((k) => k + 1); // recharge custom sections + contenu
  }

  /** Phase 1 hybride : supprimer une section custom (et son contenu). */
  async function handleDeleteCustomSection(sectionId: string) {
    if (!confirm(
      `Supprimer la section « ${sectionId} » ? Le contenu associé sera également effacé.`,
    )) {
      return;
    }
    const ok = await apiDeleteCustomSection(selectedPageId, sectionId);
    if (!ok) {
      alert("Échec de la suppression.");
      return;
    }
    setReloadKey((k) => k + 1);
  }

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
      await apiSavePageContent(pageContent, { label: saveLabel });
    } else {
      savePageContent(pageContent);
    }
    setSaved(true);
    setModifiedIds(new Set());
    setSaveLabel("");
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

  if (!user || !isStaffOrAdmin(user)) return null;

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
          <button
            onClick={() => setShowRevisions(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--gaspe-neutral-200)] px-4 py-2 text-sm font-semibold text-foreground-muted hover:text-foreground hover:border-[var(--gaspe-neutral-300)]"
            title="Voir et restaurer les versions précédentes"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
            Historique
          </button>
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
          <div className="flex items-stretch gap-0 rounded-xl border border-[var(--gaspe-neutral-200)] bg-white shadow-sm overflow-hidden focus-within:border-[var(--gaspe-teal-400)] focus-within:ring-1 focus-within:ring-[var(--gaspe-teal-400)]">
            <input
              type="text"
              value={saveLabel}
              onChange={(e) => setSaveLabel(e.target.value)}
              placeholder="Motif (optionnel, ex. Correction hero)"
              maxLength={120}
              className="w-60 bg-transparent px-3 py-2 text-sm placeholder:text-foreground-muted focus:outline-none"
              aria-label="Motif de la modification (libellé de révision)"
            />
            <button
              onClick={handleSave}
              className="inline-flex items-center gap-2 bg-primary px-5 py-2 text-sm font-semibold text-white hover:bg-primary-hover"
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
      </div>

      {/* Page selector */}
      <div className="flex gap-2 flex-wrap items-center">
        {mergedDefinitions.map((page) => (
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
        {/* Phase 1 hybride : bouton « Ajouter une section » sur la page courante. */}
        {isApiMode() && (
          <button
            onClick={() => setShowAddSectionModal(true)}
            className="ml-auto inline-flex items-center gap-1.5 rounded-xl border border-dashed border-[var(--gaspe-teal-400)] bg-[var(--gaspe-teal-50)] px-3.5 py-2 text-sm font-semibold text-[var(--gaspe-teal-700)] hover:bg-[var(--gaspe-teal-100)] transition-colors"
            title="Ajouter une section custom sur la page sélectionnée"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" />
            </svg>
            Ajouter une section
          </button>
        )}
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

                {!collapsed && groupSections.map((section) => {
                  const isCustom = customSectionKeys.has(customSectionKey(selectedPageId, section.id));
                  return (
                  <div key={section.id} className={`rounded-2xl bg-white border overflow-hidden transition-colors ${section.modified ? "border-[var(--gaspe-warm-400)]" : "border-[var(--gaspe-neutral-200)]"}`}>
                    <div className="flex items-center justify-between border-b border-[var(--gaspe-neutral-100)] bg-[var(--gaspe-neutral-50)] px-5 py-3">
                      <h3 className="font-heading text-sm font-semibold text-foreground flex items-center gap-2">
                        {section.modified && (
                          <span className="h-2 w-2 rounded-full bg-[var(--gaspe-warm-500)]" title="Modifié non enregistré" />
                        )}
                        {section.label}
                        {isCustom && (
                          <span className="rounded-full bg-[var(--gaspe-teal-50)] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[var(--gaspe-teal-700)]">
                            Custom
                          </span>
                        )}
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
                        {isCustom && (
                          <button
                            type="button"
                            onClick={() => handleDeleteCustomSection(section.id)}
                            title="Supprimer cette section custom (le contenu est aussi effacé)"
                            className="text-xs text-foreground-muted hover:text-red-600 underline"
                          >
                            Supprimer
                          </button>
                        )}
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
                            <Image src={section.content} alt="Aperçu image" width={320} height={128} loading="lazy" className="max-h-32 rounded-xl object-contain" unoptimized />
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
                  );
                })}
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
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-foreground-muted">
                  Aperçu de{" "}
                  <code className="rounded bg-[var(--gaspe-neutral-100)] px-1.5 py-0.5 text-[11px]">
                    {previewUrl}
                  </code>
                </p>
                <div className="flex items-center gap-3">
                  <DevicePreviewSwitcher
                    value={previewDevice}
                    onChange={setPreviewDevice}
                  />
                  <button
                    type="button"
                    onClick={() => setPreviewKey((k) => k + 1)}
                    className="text-xs text-primary hover:underline font-medium"
                  >
                    Rafraîchir
                  </button>
                </div>
              </div>
              <div className="flex justify-center overflow-auto rounded-2xl border border-[var(--gaspe-neutral-200)] bg-[var(--gaspe-neutral-100)] p-4">
                <div
                  className="overflow-hidden rounded-xl border border-[var(--gaspe-neutral-200)] bg-white shadow-sm transition-[width,height] duration-200"
                  style={{
                    width: `${DEVICE_DIMENSIONS[previewDevice].width}px`,
                    maxWidth: "100%",
                    height: `${DEVICE_DIMENSIONS[previewDevice].height}px`,
                    maxHeight: "80vh",
                  }}
                >
                  <iframe
                    key={`${previewKey}-${previewDevice}`}
                    src={previewUrl}
                    className="h-full w-full"
                    title={`Aperçu ${selectedPageId} (${previewDevice})`}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between text-[11px] text-foreground-muted italic">
                <span>Enregistrez pour voir vos modifications dans l&apos;aperçu.</span>
                <span className="not-italic font-mono">
                  {DEVICE_DIMENSIONS[previewDevice].width}×
                  {DEVICE_DIMENSIONS[previewDevice].height}
                </span>
              </div>
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

      {/* Revisions history */}
      <CmsRevisionsModal
        pageId={selectedPageId}
        open={showRevisions}
        onClose={() => setShowRevisions(false)}
        onRestored={() => {
          // Force le rechargement du contenu + refresh de l'iframe d'aperçu
          setReloadKey((k) => k + 1);
          setPreviewKey((k) => k + 1);
        }}
      />

      {/* Phase 1 hybride : modale d'ajout d'une section custom */}
      {showAddSectionModal && (
        <AddCustomSectionModal
          pageId={selectedPageId}
          pageLabel={mergedDefinitions.find((p) => p.id === selectedPageId)?.label ?? selectedPageId}
          existingSectionIds={new Set(sections.map((s) => s.id))}
          onCancel={() => setShowAddSectionModal(false)}
          onCreate={handleAddCustomSection}
        />
      )}
    </div>
  );
}

/* ──────────────────────────────────────────────
   Modale d'ajout d'une section custom (Phase 1 hybride).
   ────────────────────────────────────────────── */

const SECTION_TYPE_OPTIONS: { value: PageSection["type"]; label: string; hint: string }[] = [
  { value: "text", label: "Texte court", hint: "Une ligne (titre, libellé, URL courte…)" },
  { value: "richtext", label: "Texte riche", hint: "Paragraphes, listes, gras, liens, images" },
  { value: "image", label: "Image", hint: "URL d'image (avec aperçu)" },
  { value: "config", label: "Valeur de configuration", hint: "Champ technique (couleur, clé, URL longue)" },
  { value: "list", label: "Liste d'éléments", hint: "Array structurée (avancé)" },
];

function slugifySectionId(label: string): string {
  return label
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

function AddCustomSectionModal({
  pageId,
  pageLabel,
  existingSectionIds,
  onCancel,
  onCreate,
}: {
  pageId: string;
  pageLabel: string;
  existingSectionIds: Set<string>;
  onCancel: () => void;
  onCreate: (payload: { sectionId: string; label: string; type: PageSection["type"] }) => void | Promise<void>;
}) {
  const [label, setLabel] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [type, setType] = useState<PageSection["type"]>("text");
  const [autoSlug, setAutoSlug] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const effectiveSectionId = autoSlug ? slugifySectionId(label) : sectionId.trim();
  const collision = existingSectionIds.has(effectiveSectionId);
  const idIsValid = /^[a-z0-9][a-z0-9-]{0,63}$/.test(effectiveSectionId);
  const canSubmit = label.trim().length > 0 && idIsValid && !collision && !submitting;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await onCreate({ sectionId: effectiveSectionId, label: label.trim(), type });
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    "w-full rounded-xl border border-[var(--gaspe-neutral-200)] bg-white px-3.5 py-2 text-sm text-foreground focus:border-[var(--gaspe-teal-400)] focus:outline-none focus:ring-1 focus:ring-[var(--gaspe-teal-400)]";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-2xl border border-[var(--gaspe-neutral-200)] bg-white shadow-xl">
        <div className="flex items-start justify-between border-b border-[var(--gaspe-neutral-200)] px-6 py-4">
          <div>
            <h2 className="font-heading text-lg font-bold text-foreground">Ajouter une section</h2>
            <p className="text-xs text-foreground-muted mt-0.5">
              Sur la page <span className="font-semibold">{pageLabel}</span> ({pageId})
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
        <form onSubmit={handleSubmit} className="flex-1 space-y-5 overflow-y-auto p-6">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Libellé visible <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Ex : Encart partenaires"
              className={inputClass}
              autoFocus
              maxLength={120}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-foreground">
                Identifiant technique
              </label>
              <label className="flex items-center gap-1.5 text-xs text-foreground-muted">
                <input
                  type="checkbox"
                  checked={autoSlug}
                  onChange={(e) => setAutoSlug(e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-[var(--gaspe-neutral-300)] text-[var(--gaspe-teal-600)]"
                />
                Auto (à partir du libellé)
              </label>
            </div>
            <input
              type="text"
              value={effectiveSectionId}
              onChange={(e) => setSectionId(e.target.value)}
              disabled={autoSlug}
              placeholder="ex : encart-partenaires"
              className={`${inputClass} font-mono text-xs disabled:bg-[var(--gaspe-neutral-50)] disabled:text-foreground-muted disabled:cursor-not-allowed`}
              maxLength={64}
            />
            <p className="mt-1 text-[11px] text-foreground-muted">
              a-z, 0-9, tiret. Sert de clé interne, non visible côté public.
            </p>
            {effectiveSectionId && !idIsValid && (
              <p className="mt-1 text-xs text-red-600">Identifiant invalide.</p>
            )}
            {collision && (
              <p className="mt-1 text-xs text-red-600">
                Une section avec cet identifiant existe déjà sur cette page.
              </p>
            )}
          </div>

          <div>
            <p className="block text-sm font-medium text-foreground mb-2">Type de contenu</p>
            <div className="space-y-2">
              {SECTION_TYPE_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 transition-colors ${
                    type === opt.value
                      ? "border-[var(--gaspe-teal-400)] bg-[var(--gaspe-teal-50)]"
                      : "border-[var(--gaspe-neutral-200)] hover:border-[var(--gaspe-neutral-300)]"
                  }`}
                >
                  <input
                    type="radio"
                    name="type"
                    value={opt.value}
                    checked={type === opt.value}
                    onChange={() => setType(opt.value)}
                    className="mt-1"
                  />
                  <div>
                    <p className="text-sm font-semibold text-foreground">{opt.label}</p>
                    <p className="text-xs text-foreground-muted">{opt.hint}</p>
                  </div>
                </label>
              ))}
            </div>
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
              {submitting ? "Création…" : "Créer la section"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
