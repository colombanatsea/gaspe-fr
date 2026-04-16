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
  type: "richtext" | "text" | "image" | "config";
  content: string;
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
  sections: { id: string; label: string; type: PageSection["type"] }[];
}

export const PAGE_DEFINITIONS: PageDefinition[] = [
  {
    id: "homepage",
    label: "Accueil",
    sections: [
      { id: "hero-title", label: "Hero — Titre", type: "text" },
      { id: "hero-subtitle", label: "Hero — Sous-titre", type: "text" },
      { id: "hero-baseline", label: "Hero — Baseline", type: "text" },
      { id: "cta-title", label: "CTA — Titre", type: "text" },
      { id: "cta-description", label: "CTA — Description", type: "richtext" },
    ],
  },
  {
    id: "notre-groupement",
    label: "Notre Groupement",
    sections: [
      { id: "mission", label: "Mission", type: "richtext" },
      { id: "timeline", label: "Timeline / Historique", type: "richtext" },
      { id: "engagements", label: "Engagements", type: "richtext" },
      { id: "bureau", label: "Bureau / Équipe", type: "richtext" },
    ],
  },
  {
    id: "contact",
    label: "Contact",
    sections: [
      { id: "address", label: "Adresse", type: "richtext" },
      { id: "email", label: "Email de contact", type: "text" },
      { id: "phone", label: "Téléphone", type: "text" },
      { id: "sidebar-info", label: "Encart informatif", type: "richtext" },
    ],
  },
  {
    id: "footer",
    label: "Pied de page",
    sections: [
      { id: "newsletter-cta", label: "Texte newsletter", type: "text" },
      { id: "social-linkedin", label: "URL LinkedIn", type: "text" },
      { id: "social-twitter", label: "URL Twitter/X", type: "text" },
    ],
  },
];
