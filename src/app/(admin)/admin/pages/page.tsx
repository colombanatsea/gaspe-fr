"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { MediaLibrary } from "@/components/admin/MediaLibrary";
import { ContentPreview } from "@/components/admin/ContentPreview";
import {
  PAGE_DEFINITIONS,
  getPageContent,
  savePageContent,
  type PageContent,
  type PageSection,
  type MediaItem,
} from "@/lib/cms-store";

export default function AdminPagesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [selectedPageId, setSelectedPageId] = useState(PAGE_DEFINITIONS[0].id);
  const [sections, setSections] = useState<PageSection[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [previewSection, setPreviewSection] = useState<string | null>(null);
  const [showMediaLibrary, setShowMediaLibrary] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeEditorInsert, setActiveEditorInsert] = useState<((item: MediaItem) => void) | null>(null);

  useEffect(() => {
    if (!user || user.role !== "admin") {
      router.push("/connexion");
    }
  }, [user, router]);

  // Load content when page selection changes
  useEffect(() => {
    const pageDef = PAGE_DEFINITIONS.find((p) => p.id === selectedPageId);
    if (!pageDef) return;

    const stored = getPageContent(selectedPageId);
    if (stored) {
      // Merge stored sections with definition (in case new sections were added)
      const merged = pageDef.sections.map((def) => {
        const existing = stored.sections.find((s) => s.id === def.id);
        return existing ?? { id: def.id, label: def.label, type: def.type, content: "" };
      });
      setSections(merged);
    } else {
      setSections(
        pageDef.sections.map((def) => ({
          id: def.id,
          label: def.label,
          type: def.type,
          content: "",
        }))
      );
    }
    setSaved(false);
  }, [selectedPageId]);

  function updateSection(id: string, content: string) {
    setSections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, content } : s))
    );
    setSaved(false);
  }

  function handleSave() {
    const pageContent: PageContent = {
      pageId: selectedPageId,
      sections,
      updatedAt: new Date().toISOString(),
    };
    savePageContent(pageContent);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  function handleMediaSelect(item: MediaItem) {
    if (activeEditorInsert) {
      // Insert image URL into the active editor via a callback
      // For simplicity, copy URL to clipboard and notify user
      if (item.type.startsWith("image/")) {
        navigator.clipboard?.writeText(item.data);
      }
      setActiveEditorInsert(null);
    }
    setShowMediaLibrary(false);
  }

  const currentPageDef = PAGE_DEFINITIONS.find((p) => p.id === selectedPageId);

  if (!user || user.role !== "admin") return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Éditeur de pages</h1>
          <p className="mt-1 text-sm text-foreground-muted">
            Modifiez le contenu de chaque section des pages publiques du site.
          </p>
        </div>
        <div className="flex items-center gap-3">
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
            {showPreview ? "Masquer l'aperçu" : "Aperçu"}
          </button>
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

      {/* Sections */}
      <div className={showPreview ? "grid grid-cols-1 xl:grid-cols-2 gap-6" : ""}>
        <div className="space-y-6">
          {sections.map((section) => (
            <div key={section.id} className="rounded-2xl bg-white border border-[var(--gaspe-neutral-200)] overflow-hidden">
              <div className="flex items-center justify-between border-b border-[var(--gaspe-neutral-100)] bg-[var(--gaspe-neutral-50)] px-5 py-3">
                <h3 className="font-heading text-sm font-semibold text-foreground">{section.label}</h3>
                <span className="rounded-full bg-[var(--gaspe-neutral-200)] px-2.5 py-0.5 text-[10px] font-medium text-foreground-muted uppercase">
                  {section.type}
                </span>
              </div>
              <div className="p-4">
                {section.type === "richtext" ? (
                  <RichTextEditor
                    value={section.content}
                    onChange={(html) => updateSection(section.id, html)}
                    minHeight={200}
                    onMediaLibraryOpen={() => setShowMediaLibrary(true)}
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
                      <img src={section.content} alt="Aperçu image" loading="lazy" className="max-h-32 rounded-xl object-contain" />
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

        {/* Preview panel */}
        {showPreview && (
          <div className="space-y-4">
            <div className="sticky top-20">
              {sections
                .filter((s) => s.type === "richtext" && s.content)
                .map((section) => (
                  <div key={section.id} className="mb-4">
                    <ContentPreview html={section.content} title={section.label} />
                  </div>
                ))}
              {sections.filter((s) => s.type === "richtext" && s.content).length === 0 && (
                <div className="rounded-2xl border border-dashed border-[var(--gaspe-neutral-300)] p-12 text-center text-sm text-foreground-muted">
                  Commencez à écrire du contenu rich text pour voir l&apos;aperçu ici.
                </div>
              )}
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
