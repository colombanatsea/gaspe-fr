/* ------------------------------------------------------------------ */
/*  CMS Store — localStorage-based content management                  */
/* ------------------------------------------------------------------ */

import { safeParse, mediaArraySchema, pagesRecordSchema, type mediaItemSchema } from "./schemas";
import type { z } from "zod";

const MEDIA_KEY = "gaspe_media_library";
const PAGES_KEY = "gaspe_page_content";

/* ── Media Library ── */

export type MediaItem = z.infer<typeof mediaItemSchema>;

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

export function getPageContent(pageId: string): PageContent | null {
  if (typeof window === "undefined") return null;
  const all = safeParse(pagesRecordSchema, localStorage.getItem(PAGES_KEY), {});
  return all[pageId] ?? null;
}

export function savePageContent(page: PageContent) {
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
