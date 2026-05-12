/* ------------------------------------------------------------------ */
/*  CMS Store – dual-mode content management                          */
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
  itemFields?: { id: string; label: string; type: "text" | "richtext" | "url" | "image" }[];
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

export async function apiSavePageContent(
  page: PageContent,
  options?: { label?: string },
): Promise<boolean> {
  try {
    const body: { sections: PageSection[]; label?: string } = { sections: page.sections };
    if (options?.label?.trim()) body.label = options.label.trim();
    const res = await apiFetch<{ success?: boolean }>(`/api/cms/pages/${page.pageId}`, {
      method: "PUT",
      body: JSON.stringify(body),
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
      { id: "map-eyebrow", label: "Territoire – Libellé haut", type: "text" },
      { id: "map-title", label: "Territoire – Titre", type: "text" },
      { id: "map-subtitle-template", label: "Territoire – Sous-titre (template)", type: "text" },
      { id: "hero-eyebrow", label: "Hero – Libellé haut", type: "text" },
      { id: "hero-title", label: "Hero – Titre (HTML autorisé)", type: "richtext" },
      { id: "hero-subtitle", label: "Hero – Sous-titre", type: "text" },
      { id: "hero-baseline", label: "Hero – Baseline italique", type: "text" },
      { id: "hero-cta1-label", label: "Hero – CTA principal (libellé)", type: "text" },
      { id: "hero-cta1-link", label: "Hero – CTA principal (URL)", type: "config" },
      { id: "hero-cta2-label", label: "Hero – CTA secondaire (libellé)", type: "text" },
      { id: "hero-cta2-link", label: "Hero – CTA secondaire (URL)", type: "config" },
      { id: "hero-quick-stats", label: "Hero – Mini-stats (3 cartes)", type: "list",
        itemFields: [
          { id: "value", label: "Valeur", type: "text" },
          { id: "label", label: "Libellé", type: "text" },
        ],
      },
      { id: "stats-eyebrow", label: "§ Stats – Libellé haut", type: "text" },
      { id: "stats-title", label: "§ Stats – Titre", type: "text" },
      { id: "stats-subtitle", label: "§ Stats – Sous-titre", type: "text" },
      { id: "stats-items", label: "§ Stats – Cartes (6)", type: "list",
        itemFields: [
          { id: "value", label: "Valeur", type: "text" },
          { id: "label", label: "Libellé", type: "text" },
          { id: "iconKey", label: "Icône (ship/users/anchor/passengers/car/euro)", type: "text" },
        ],
      },
      { id: "news-eyebrow", label: "§ Positions – Libellé haut", type: "text" },
      { id: "news-title", label: "§ Positions – Titre", type: "text" },
      { id: "news-description", label: "§ Positions – Description", type: "text" },
      { id: "news-items", label: "§ Positions – Cartes (3)", type: "list",
        itemFields: [
          { id: "title", label: "Titre", type: "text" },
          { id: "excerpt", label: "Extrait", type: "text" },
          { id: "category", label: "Catégorie (ex: Position)", type: "text" },
          { id: "date", label: "Date (ex: Février 2026)", type: "text" },
          { id: "iconKey", label: "Icône (sun/users/map/document/ship)", type: "text" },
          { id: "colorKey", label: "Couleur (teal/green/blue/warm)", type: "text" },
        ],
      },
      { id: "cta-title", label: "CTA – Titre", type: "text" },
      { id: "cta-description", label: "CTA – Description", type: "richtext" },
    ],
  },
  {
    id: "notre-groupement",
    label: "Notre Groupement",
    sections: [
      { id: "page-header-title", label: "Header – Titre", type: "text" },
      { id: "page-header-description", label: "Header – Description", type: "text" },
      { id: "adherents-eyebrow", label: "§ Adhérents – Libellé haut", type: "text" },
      { id: "adherents-title", label: "§ Adhérents – Titre (après \"X compagnies\")", type: "text" },
      { id: "adherents-subtitle-template", label: "§ Adhérents – Sous-titre template", type: "text" },
      { id: "timeline-badge", label: "§ Timeline – Badge", type: "text" },
      { id: "timeline-title", label: "§ Timeline – Titre", type: "text" },
      { id: "timeline-intro", label: "§ Timeline – Introduction", type: "richtext" },
      { id: "mission-eyebrow", label: "§ Mission – Libellé haut", type: "text" },
      { id: "mission-title", label: "§ Mission – Titre", type: "text" },
      { id: "mission-description", label: "§ Mission – Description", type: "richtext" },
      { id: "mission-bullets", label: "§ Mission – Liste de points", type: "richtext" },
      { id: "mission-stat-years", label: "§ Mission – Chiffre mis en avant", type: "text" },
      { id: "mission-stat-label", label: "§ Mission – Légende du chiffre", type: "text" },
      { id: "mission-stat-description", label: "§ Mission – Texte encart", type: "richtext" },
      { id: "engagements-eyebrow", label: "§ Engagements – Libellé haut", type: "text" },
      { id: "engagements-title", label: "§ Engagements – Titre", type: "text" },
      { id: "bureau-eyebrow", label: "§ Bureau – Libellé haut", type: "text" },
      { id: "bureau-title", label: "§ Bureau – Titre", type: "text" },
      { id: "bureau-subtitle", label: "§ Bureau – Sous-titre", type: "text" },
      { id: "timeline-items", label: "§ Timeline – Éléments", type: "list",
        itemFields: [
          { id: "year", label: "Année", type: "text" },
          { id: "title", label: "Titre", type: "text" },
          { id: "description", label: "Description", type: "richtext" },
        ],
      },
      { id: "engagements-items", label: "§ Engagements – Cartes", type: "list",
        itemFields: [
          { id: "title", label: "Titre", type: "text" },
          { id: "description", label: "Description", type: "text" },
          { id: "color", label: "Couleur (teal/green/blue/warm)", type: "text" },
        ],
      },
      { id: "bureau-members", label: "§ Bureau – Membres", type: "list",
        itemFields: [
          { id: "name", label: "Nom", type: "text" },
          { id: "role", label: "Rôle", type: "text" },
          { id: "company", label: "Compagnie", type: "text" },
          { id: "href", label: "URL LinkedIn / profil", type: "url" },
          { id: "photoUrl", label: "Photo (URL ou upload)", type: "image" },
        ],
      },
    ],
  },
  {
    id: "contact",
    label: "Contact",
    sections: [
      { id: "page-header-title", label: "Header – Titre", type: "text" },
      { id: "page-header-description", label: "Header – Description", type: "text" },
      { id: "address", label: "Bloc adresse (HTML)", type: "richtext" },
      { id: "email", label: "Email de contact", type: "text" },
      { id: "sidebar-info", label: "Encart \"Engagé depuis 1951\"", type: "richtext" },
      { id: "form-subjects", label: "Formulaire – Sujets du dropdown", type: "list",
        itemFields: [
          { id: "value", label: "Valeur technique", type: "text" },
          { id: "label", label: "Libellé affiché", type: "text" },
        ],
      },
      { id: "success-message", label: "Formulaire – Message de succès", type: "text" },
      { id: "error-message", label: "Formulaire – Message d'erreur", type: "text" },
    ],
  },
  {
    id: "agenda",
    label: "Agenda",
    sections: [
      { id: "page-header-title", label: "Header – Titre", type: "text" },
      { id: "page-header-description", label: "Header – Description", type: "text" },
      { id: "empty-state-message", label: "Message \"aucun événement\"", type: "text" },
      { id: "restricted-notice", label: "Message \"connectez-vous\"", type: "text" },
    ],
  },
  {
    id: "documents",
    label: "Documents",
    sections: [
      { id: "page-header-title", label: "Header – Titre", type: "text" },
      { id: "page-header-description", label: "Header – Description", type: "text" },
      { id: "toolkit-cta-title", label: "Boîte à outils – Titre", type: "text" },
      { id: "toolkit-cta-description", label: "Boîte à outils – Description", type: "text" },
      { id: "toolkit-cta-button", label: "Boîte à outils – Bouton", type: "text" },
      { id: "search-placeholder", label: "Recherche – Placeholder", type: "text" },
      { id: "empty-state", label: "Message \"aucun document\"", type: "text" },
    ],
  },
  {
    id: "formations",
    label: "Formations",
    sections: [
      { id: "page-header-title", label: "Header – Titre", type: "text" },
      { id: "page-header-description", label: "Header – Description", type: "text" },
    ],
  },
  {
    id: "nos-adherents",
    label: "Nos Adhérents",
    sections: [
      { id: "page-header-title", label: "Header – Titre", type: "text" },
      { id: "page-header-description", label: "Header – Description", type: "text" },
      { id: "geoloc-button-label", label: "Bouton géolocalisation", type: "text" },
      { id: "titulaires-heading", label: "Titre – Membres titulaires", type: "text" },
      { id: "associes-heading", label: "Titre – Membres associés", type: "text" },
      { id: "empty-state", label: "Message \"aucun adhérent\"", type: "text" },
    ],
  },
  {
    id: "nos-compagnies-recrutent",
    label: "Nos Compagnies Recrutent",
    sections: [
      { id: "page-header-title", label: "Header – Titre", type: "text" },
      { id: "page-header-description", label: "Header – Description", type: "text" },
      { id: "hero-eyebrow", label: "Hero – Libellé haut", type: "text" },
      { id: "hero-title-before", label: "Hero – Titre (avant highlight)", type: "text" },
      { id: "hero-title-highlight", label: "Hero – Mot mis en avant", type: "text" },
      { id: "hero-subtitle", label: "Hero – Sous-titre", type: "text" },
      { id: "filters-heading", label: "Filtres – Titre", type: "text" },
      { id: "quick-stats", label: "Mini-stats (3 cartes)", type: "list",
        itemFields: [
          { id: "value", label: "Valeur (placeholders : {adherents}, {navires}, {compagnies}…)", type: "text" },
          { id: "label", label: "Libellé", type: "text" },
        ],
      },
    ],
  },
  {
    id: "positions",
    label: "Positions",
    sections: [
      { id: "page-header-title", label: "Header – Titre", type: "text" },
      { id: "page-header-description", label: "Header – Description", type: "text" },
      { id: "search-placeholder", label: "Recherche – Placeholder", type: "text" },
      { id: "positions-section-title", label: "§ Positions – Titre", type: "text" },
      { id: "presse-section-title", label: "§ Presse – Titre", type: "text" },
      { id: "presse-description", label: "§ Presse – Description", type: "richtext" },
    ],
  },
  {
    id: "actualites",
    label: "Actualités",
    sections: [
      { id: "page-header-title", label: "Header – Titre", type: "text" },
      { id: "page-header-description", label: "Header – Description", type: "text" },
      { id: "intro-paragraph", label: "Paragraphe d'introduction", type: "text" },
      { id: "empty-state", label: "Message « aucune actualité »", type: "text" },
    ],
  },
  {
    id: "recherche",
    label: "Recherche",
    sections: [
      { id: "page-header-title", label: "Header – Titre", type: "text" },
      { id: "page-header-description", label: "Header – Description", type: "text" },
    ],
  },
  {
    id: "ssgm",
    label: "SSGM",
    sections: [
      { id: "page-header-title", label: "Header – Titre", type: "text" },
      { id: "page-header-description", label: "Header – Description", type: "text" },
      { id: "intro-title", label: "Intro – Titre", type: "text" },
      { id: "intro-paragraph1", label: "Intro – Paragraphe 1", type: "richtext" },
      { id: "intro-paragraph2", label: "Intro – Paragraphe 2", type: "richtext" },
      { id: "empty-state", label: "Message \"aucun résultat\"", type: "text" },
    ],
  },
  {
    id: "transition-ecologique",
    label: "Transition Écologique",
    sections: [
      { id: "page-header-title", label: "Header – Titre", type: "text" },
      { id: "page-header-description", label: "Header – Description", type: "text" },
      { id: "intro-badge", label: "Intro – Badge", type: "text" },
      { id: "intro-title", label: "Intro – Titre", type: "text" },
      { id: "intro-description", label: "Intro – Description", type: "richtext" },
      { id: "deadline-text", label: "Intro – Texte deadline", type: "text" },
      { id: "key-figures", label: "Chiffres clés (4 cartes)", type: "list",
        itemFields: [
          { id: "value", label: "Valeur", type: "text" },
          { id: "suffix", label: "Suffixe (M, %, etc.)", type: "text" },
          { id: "label", label: "Libellé", type: "text" },
        ],
      },
      { id: "simulator-title", label: "Simulateur – Titre", type: "text" },
      { id: "simulator-description", label: "Simulateur – Description", type: "text" },
      { id: "simulator-disclaimer", label: "Simulateur – Mention légale", type: "text" },
      { id: "technologies-title", label: "Technologies – Titre", type: "text" },
      { id: "technologies-items", label: "Technologies (6 cartes)", type: "list",
        itemFields: [
          { id: "name", label: "Nom", type: "text" },
          { id: "gain", label: "Gain CO2", type: "text" },
          { id: "trl", label: "TRL", type: "text" },
          { id: "desc", label: "Description", type: "text" },
        ],
      },
    ],
  },
  {
    id: "boite-a-outils",
    label: "Boîte à outils",
    sections: [
      { id: "page-header-title", label: "Header – Titre", type: "text" },
      { id: "page-header-description", label: "Header – Description", type: "text" },
      { id: "disclaimer", label: "Bandeau d'avertissement", type: "richtext" },
    ],
  },
  {
    id: "decouvrir-espace-adherent",
    label: "Découvrir Espace Adhérent",
    sections: [
      { id: "page-header-title", label: "Header – Titre", type: "text" },
      { id: "page-header-description", label: "Header – Description", type: "text" },
      { id: "banner-title", label: "Bannière démo – Titre", type: "text" },
      { id: "banner-description", label: "Bannière démo – Description", type: "text" },
      { id: "adhesion-cta-title", label: "CTA adhésion – Titre", type: "text" },
      { id: "adhesion-cta-description", label: "CTA adhésion – Description", type: "text" },
      { id: "adhesion-cta-button", label: "CTA adhésion – Bouton", type: "text" },
    ],
  },
  {
    id: "mentions-legales",
    label: "Mentions légales",
    sections: [
      { id: "page-header-title", label: "Header – Titre", type: "text" },
      { id: "page-header-description", label: "Header – Description", type: "text" },
    ],
  },
  {
    id: "confidentialite",
    label: "Politique de confidentialité",
    sections: [
      { id: "page-header-title", label: "Header – Titre", type: "text" },
      { id: "page-header-description", label: "Header – Description", type: "text" },
    ],
  },
  {
    id: "cgu",
    label: "Conditions générales",
    sections: [
      { id: "page-header-title", label: "Header – Titre", type: "text" },
      { id: "page-header-description", label: "Header – Description", type: "text" },
    ],
  },
  {
    id: "presse",
    label: "Presse (redirection)",
    sections: [
      { id: "page-header-title", label: "Titre de la page", type: "text" },
      { id: "redirect-title", label: "Message principal", type: "text" },
      { id: "redirect-description", label: "Description", type: "richtext" },
      { id: "redirect-cta", label: "Libellé du bouton", type: "text" },
    ],
  },
  {
    id: "footer",
    label: "Pied de page",
    sections: [
      { id: "newsletter-title", label: "Newsletter – Titre", type: "text" },
      { id: "newsletter-cta", label: "Newsletter – Description", type: "text" },
      { id: "social-linkedin", label: "URL LinkedIn", type: "text" },
      { id: "contact-email", label: "Email de contact affiché", type: "text" },
    ],
  },
  {
    id: "newsletter-charte",
    label: "Charte newsletter",
    sections: [
      { id: "sender-name", label: "Expéditeur – Nom affiché", type: "text" },
      { id: "sender-email", label: "Expéditeur – Email", type: "text" },
      { id: "reply-to", label: "Email de réponse", type: "text" },
      { id: "logo-url", label: "Logo (URL ou upload)", type: "image" },
      { id: "primary-color", label: "Couleur primaire (hex)", type: "text" },
      { id: "accent-color", label: "Couleur accent (hex)", type: "text" },
      { id: "text-color", label: "Couleur texte (hex)", type: "text" },
      { id: "background-color", label: "Couleur fond (hex)", type: "text" },
      { id: "tagline", label: "Baseline en header", type: "text" },
      { id: "footer-html", label: "Footer (HTML : mentions, adresse…)", type: "richtext" },
      { id: "unsubscribe-label", label: "Libellé lien désinscription", type: "text" },
      { id: "webversion-label", label: "Libellé lien version web", type: "text" },
      { id: "preheader-default", label: "Preheader par défaut", type: "text" },
    ],
  },
];

/* ── Custom sections – Phase 1 hybride C17/C18/C19 (migration 0042) ─── */

export interface CmsCustomSection {
  id: number;
  pageId: string;
  sectionId: string;
  label: string;
  type: PageSection["type"];
  itemFields?: PageSection["itemFields"];
  sortOrder: number;
  createdBy: string | null;
  createdAt: string;
}

/**
 * Liste publique de toutes les custom sections (utilisée côté admin
 * pour driver l'éditeur, et côté public via les hooks `useCmsContent`).
 *
 * En mode demo (localStorage), pas de custom sections — la feature
 * n'existe qu'en mode API. Retourne tableau vide silencieusement.
 */
export async function apiListCustomSections(): Promise<CmsCustomSection[]> {
  if (!isApiMode()) return [];
  try {
    const res = await apiFetch<{ sections?: CmsCustomSection[] }>("/api/cms/custom-sections");
    return res.sections ?? [];
  } catch {
    return [];
  }
}

export async function apiCreateCustomSection(
  pageId: string,
  body: { sectionId: string; label: string; type: PageSection["type"]; itemFields?: PageSection["itemFields"] },
): Promise<{ success: true } | { success: false; error: string }> {
  if (!isApiMode()) {
    return { success: false, error: "Mode local : les sections custom nécessitent l'API." };
  }
  try {
    const res = await apiFetch<{ success?: boolean; error?: string }>(
      `/api/cms/pages/${encodeURIComponent(pageId)}/custom-sections`,
      { method: "POST", body: JSON.stringify(body) },
    );
    if (res.success) return { success: true };
    return { success: false, error: res.error ?? "Erreur inconnue" };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Erreur réseau" };
  }
}

export async function apiDeleteCustomSection(
  pageId: string,
  sectionId: string,
): Promise<boolean> {
  if (!isApiMode()) return false;
  try {
    const res = await apiFetch<{ success?: boolean }>(
      `/api/cms/pages/${encodeURIComponent(pageId)}/custom-sections/${encodeURIComponent(sectionId)}`,
      { method: "DELETE" },
    );
    return !!res.success;
  } catch {
    return false;
  }
}

/**
 * Phase 2 hybride : réordonner les sections custom d'une page. La liste
 * `orderedSectionIds` doit contenir tous les sectionId custom de la
 * page, dans le nouvel ordre voulu. Sort_order est réécrit côté D1
 * en 1..N.
 */
export async function apiReorderCustomSections(
  pageId: string,
  orderedSectionIds: string[],
): Promise<boolean> {
  if (!isApiMode()) return false;
  try {
    const res = await apiFetch<{ success?: boolean }>(
      `/api/cms/pages/${encodeURIComponent(pageId)}/custom-sections/reorder`,
      { method: "PATCH", body: JSON.stringify({ orderedSectionIds }) },
    );
    return !!res.success;
  } catch {
    return false;
  }
}

/**
 * Fusionne PAGE_DEFINITIONS (système) avec les custom sections.
 * Les sections custom sont ajoutées à la fin de chaque page (sort_order
 * croissant). En cas de page totalement nouvelle (pas dans
 * PAGE_DEFINITIONS), elle est ignorée pour la Phase 1 — c'est le scope
 * de la Phase 3.
 */
export function mergePageDefinitions(
  builtin: PageDefinition[],
  customSections: CmsCustomSection[],
): PageDefinition[] {
  if (customSections.length === 0) return builtin;
  const byPage = new Map<string, CmsCustomSection[]>();
  for (const s of customSections) {
    const list = byPage.get(s.pageId) ?? [];
    list.push(s);
    byPage.set(s.pageId, list);
  }
  return builtin.map((def) => {
    const customs = byPage.get(def.id);
    if (!customs || customs.length === 0) return def;
    const sorted = [...customs].sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);
    return {
      ...def,
      sections: [
        ...def.sections,
        ...sorted.map((s) => ({
          id: s.sectionId,
          label: s.label,
          type: s.type,
          itemFields: s.itemFields,
        })),
      ],
    };
  });
}

/** Set des IDs (page+section) qui sont des sections custom (suppressibles). */
export function customSectionKey(pageId: string, sectionId: string): string {
  return `${pageId}::${sectionId}`;
}

/* ── Custom pages — Phase 3 hybride C17 (migration 0043) ──
 *
 * Pages entièrement custom (slug, label, description, content HTML
 * riche), publiées sous /p?slug=X. Distinctes des pages système
 * (templates dédiés) et des sections custom Phase 1 (ajoutées à des
 * pages système existantes).
 */

export interface CmsCustomPage {
  id: number;
  slug: string;
  label: string;
  description: string;
  content: string;
  published: boolean;
  isArchived: boolean;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function apiListCustomPages(includeAll = false): Promise<CmsCustomPage[]> {
  if (!isApiMode()) return [];
  try {
    const url = includeAll ? "/api/cms/custom-pages?all=1" : "/api/cms/custom-pages";
    const res = await apiFetch<{ pages?: CmsCustomPage[] }>(url);
    return res.pages ?? [];
  } catch {
    return [];
  }
}

export async function apiGetCustomPage(slug: string): Promise<CmsCustomPage | null> {
  if (!isApiMode()) return null;
  try {
    const res = await apiFetch<{ page?: CmsCustomPage }>(
      `/api/cms/custom-pages/${encodeURIComponent(slug)}`,
    );
    return res.page ?? null;
  } catch {
    return null;
  }
}

export async function apiCreateCustomPage(
  body: { slug: string; label: string; description?: string; content?: string; published?: boolean },
): Promise<{ success: true; slug: string } | { success: false; error: string }> {
  if (!isApiMode()) {
    return { success: false, error: "Mode local : les pages custom nécessitent l'API." };
  }
  try {
    const res = await apiFetch<{ success?: boolean; slug?: string; error?: string }>(
      "/api/cms/custom-pages",
      { method: "POST", body: JSON.stringify(body) },
    );
    if (res.success && res.slug) return { success: true, slug: res.slug };
    return { success: false, error: res.error ?? "Erreur inconnue" };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Erreur réseau" };
  }
}

export async function apiUpdateCustomPage(
  slug: string,
  body: { label?: string; description?: string; content?: string; published?: boolean },
): Promise<boolean> {
  if (!isApiMode()) return false;
  try {
    const res = await apiFetch<{ success?: boolean }>(
      `/api/cms/custom-pages/${encodeURIComponent(slug)}`,
      { method: "PUT", body: JSON.stringify(body) },
    );
    return !!res.success;
  } catch {
    return false;
  }
}

export async function apiDeleteCustomPage(slug: string): Promise<boolean> {
  if (!isApiMode()) return false;
  try {
    const res = await apiFetch<{ success?: boolean }>(
      `/api/cms/custom-pages/${encodeURIComponent(slug)}`,
      { method: "DELETE" },
    );
    return !!res.success;
  } catch {
    return false;
  }
}
