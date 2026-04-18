/* ------------------------------------------------------------------ */
/*  CMS Store — dual-mode content management                          */
/*  localStorage (demo) ↔ API/D1 (production)                         */
/* ------------------------------------------------------------------ */

import { safeParse, mediaArraySchema, pagesRecordSchema, type mediaItemSchema } from "./schemas";
import { apiFetch, isApiMode } from "./api-client";
import type { z } from "zod";

const MEDIA_KEY = "gaspe_media_library";
const PAGES_KEY = "gaspe_page_content";

/* ── Media Library ── */

export type MediaItem = z.infer<typeof mediaItemSchema>;

/** Media item from API (R2-backed, no base64 data) */
export interface ApiMediaItem {
  id: string;
  name: string;
  type: string;
  r2Key: string;
  size: number;
  alt?: string;
  uploadedBy?: string;
  uploadedAt: string;
}

export function getMedia(): MediaItem[] {
  if (typeof window === "undefined") return [];
  return safeParse(mediaArraySchema, localStorage.getItem(MEDIA_KEY), []);
}

export function saveMedia(items: MediaItem[]) {
  localStorage.setItem(MEDIA_KEY, JSON.stringify(items));
}

export function addMedia(item: MediaItem) {
  const all = getMedia();
  all.unshift(item);
  saveMedia(all);
}

export function deleteMedia(id: string) {
  saveMedia(getMedia().filter((m) => m.id !== id));
}

/* ── API Media (R2-backed) ── */

export async function apiGetMedia(): Promise<ApiMediaItem[]> {
  try {
    const res = await apiFetch<{ items?: ApiMediaItem[] }>("/api/media");
    return res.items ?? [];
  } catch { return []; }
}

export async function apiUploadMedia(file: File, alt?: string): Promise<ApiMediaItem | null> {
  try {
    const formData = new FormData();
    formData.append("file", file);
    if (alt) formData.append("alt", alt);
    const res = await apiFetch<{ success?: boolean; item?: ApiMediaItem }>("/api/media", {
      method: "POST",
      body: formData,
    });
    return res.item ?? null;
  } catch { return null; }
}

export async function apiDeleteMedia(id: string): Promise<boolean> {
  try {
    const res = await apiFetch<{ success?: boolean }>(`/api/media/${id}`, { method: "DELETE" });
    return !!res.success;
  } catch { return false; }
}

/* ── Page Content ── */

export interface PageSection {
  id: string;
  label: string;
  type: "richtext" | "text" | "image" | "config" | "list";
  content: string;
  /** For "list" type: schema of item fields (stored as JSON array of objects) */
  itemFields?: { id: string; label: string; type: "text" | "richtext" | "url" }[];
}

export interface PageContent {
  pageId: string;
  sections: PageSection[];
  updatedAt: string;
}

// ── localStorage implementation ──

export function getPageContent(pageId: string): PageContent | null {
  if (typeof window === "undefined") return null;
  if (isApiMode()) return null; // Caller should use apiGetPageContent
  const all = safeParse(pagesRecordSchema, localStorage.getItem(PAGES_KEY), {});
  return all[pageId] ?? null;
}

export function savePageContent(page: PageContent) {
  if (isApiMode()) return; // Caller should use apiSavePageContent
  try {
    const all = safeParse(pagesRecordSchema, localStorage.getItem(PAGES_KEY), {});
    all[page.pageId] = { ...page, updatedAt: new Date().toISOString() };
    localStorage.setItem(PAGES_KEY, JSON.stringify(all));
  } catch { /* storage full */ }
}

export function getAllPageContent(): Record<string, PageContent> {
  if (typeof window === "undefined") return {};
  return safeParse(pagesRecordSchema, localStorage.getItem(PAGES_KEY), {});
}

// ── API implementation ──

export async function apiGetPageContent(pageId: string): Promise<PageContent | null> {
  try {
    const res = await apiFetch<{ page: PageContent | null }>(`/api/cms/pages/${pageId}`);
    return res.page;
  } catch { return null; }
}

export async function apiGetAllPageContent(): Promise<Record<string, PageContent>> {
  try {
    const res = await apiFetch<{ pages: Record<string, PageContent> }>("/api/cms/pages");
    return res.pages ?? {};
  } catch { return {}; }
}

export async function apiSavePageContent(page: PageContent): Promise<boolean> {
  try {
    const res = await apiFetch<{ success?: boolean }>(`/api/cms/pages/${page.pageId}`, {
      method: "PUT",
      body: JSON.stringify({ sections: page.sections }),
    });
    return !!res.success;
  } catch { return false; }
}

/* ── Page definitions (what's editable per page) ── */

export interface PageDefinition {
  id: string;
  label: string;
  sections: {
    id: string;
    label: string;
    type: PageSection["type"];
    itemFields?: PageSection["itemFields"];
  }[];
}

export const PAGE_DEFINITIONS: PageDefinition[] = [
  {
    id: "homepage",
    label: "Accueil",
    sections: [
      { id: "hero-eyebrow", label: "Hero — Libellé haut", type: "text" },
      { id: "hero-title", label: "Hero — Titre (HTML autorisé)", type: "richtext" },
      { id: "hero-subtitle", label: "Hero — Sous-titre", type: "text" },
      { id: "hero-baseline", label: "Hero — Baseline italique", type: "text" },
      { id: "cta-title", label: "CTA — Titre", type: "text" },
      { id: "cta-description", label: "CTA — Description", type: "richtext" },
    ],
  },
  {
    id: "notre-groupement",
    label: "Notre Groupement",
    sections: [
      { id: "adherents-eyebrow", label: "§ Adhérents — Libellé haut", type: "text" },
      { id: "adherents-title", label: "§ Adhérents — Titre (après \"X compagnies\")", type: "text" },
      { id: "adherents-subtitle-template", label: "§ Adhérents — Sous-titre template", type: "text" },
      { id: "timeline-badge", label: "§ Timeline — Badge", type: "text" },
      { id: "timeline-title", label: "§ Timeline — Titre", type: "text" },
      { id: "timeline-intro", label: "§ Timeline — Introduction", type: "richtext" },
      { id: "mission-eyebrow", label: "§ Mission — Libellé haut", type: "text" },
      { id: "mission-title", label: "§ Mission — Titre", type: "text" },
      { id: "mission-description", label: "§ Mission — Description", type: "richtext" },
      { id: "mission-bullets", label: "§ Mission — Liste de points", type: "richtext" },
      { id: "mission-stat-years", label: "§ Mission — Chiffre mis en avant", type: "text" },
      { id: "mission-stat-label", label: "§ Mission — Légende du chiffre", type: "text" },
      { id: "mission-stat-description", label: "§ Mission — Texte encart", type: "richtext" },
      { id: "engagements-eyebrow", label: "§ Engagements — Libellé haut", type: "text" },
      { id: "engagements-title", label: "§ Engagements — Titre", type: "text" },
      { id: "bureau-eyebrow", label: "§ Bureau — Libellé haut", type: "text" },
      { id: "bureau-title", label: "§ Bureau — Titre", type: "text" },
      { id: "bureau-subtitle", label: "§ Bureau — Sous-titre", type: "text" },
      { id: "timeline-items", label: "§ Timeline — Éléments", type: "list",
        itemFields: [
          { id: "year", label: "Année", type: "text" },
          { id: "title", label: "Titre", type: "text" },
          { id: "description", label: "Description", type: "richtext" },
        ],
      },
      { id: "engagements-items", label: "§ Engagements — Cartes", type: "list",
        itemFields: [
          { id: "title", label: "Titre", type: "text" },
          { id: "description", label: "Description", type: "text" },
          { id: "color", label: "Couleur (teal/green/blue/warm)", type: "text" },
        ],
      },
      { id: "bureau-members", label: "§ Bureau — Membres", type: "list",
        itemFields: [
          { id: "name", label: "Nom", type: "text" },
          { id: "role", label: "Rôle", type: "text" },
          { id: "company", label: "Compagnie", type: "text" },
          { id: "href", label: "URL LinkedIn / profil", type: "url" },
        ],
      },
    ],
  },
  {
    id: "contact",
    label: "Contact",
    sections: [
      { id: "address", label: "Bloc adresse (HTML)", type: "richtext" },
      { id: "email", label: "Email de contact", type: "text" },
      { id: "sidebar-info", label: "Encart \"Engagé depuis 1951\"", type: "richtext" },
    ],
  },
  {
    id: "footer",
    label: "Pied de page",
    sections: [
      { id: "newsletter-title", label: "Newsletter — Titre", type: "text" },
      { id: "newsletter-cta", label: "Newsletter — Description", type: "text" },
      { id: "social-linkedin", label: "URL LinkedIn", type: "text" },
      { id: "contact-email", label: "Email de contact affiché", type: "text" },
    ],
  },
];
