/* ------------------------------------------------------------------ */
/*  Documents store – dual-mode (localStorage ↔ D1 via Worker)          */
/*                                                                     */
/*  Pattern identique à jobs-store / medical-store / members-store.    */
/* ------------------------------------------------------------------ */

import {
  DOCUMENTS_SEED,
  type GaspeDocument,
  type DocumentCategory,
} from "@/data/documents-seed";
import { apiFetch, isApiMode } from "./api-client";
import { decodeHtmlEntities } from "./text-preview";

// Tiptap (RichTextEditor) sérialise l'apostrophe `'` en `&#39;`. Quand on
// re-rend le texte via JSX, React échappe `&` en `&amp;` -> affichage
// `&#39;` visible. On décode une fois au sortir du store sur les champs
// rendus en texte brut (titre, description). `fileUrl` et `fileName` ne
// sont jamais des saisies riches, on ne touche pas.
function decodeDoc(d: GaspeDocument): GaspeDocument {
  return {
    ...d,
    title: decodeHtmlEntities(d.title ?? ""),
    description: decodeHtmlEntities(d.description ?? ""),
  };
}

const DOCUMENTS_KEY = "gaspe_documents";

/* ── localStorage helpers ─────────────────────────────────────────── */

function readLocal(): GaspeDocument[] {
  if (typeof window === "undefined") return DOCUMENTS_SEED;
  try {
    const raw = localStorage.getItem(DOCUMENTS_KEY);
    if (!raw) {
      localStorage.setItem(DOCUMENTS_KEY, JSON.stringify(DOCUMENTS_SEED));
      return DOCUMENTS_SEED;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return DOCUMENTS_SEED;
    return parsed as GaspeDocument[];
  } catch {
    return DOCUMENTS_SEED;
  }
}

function writeLocal(docs: GaspeDocument[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(DOCUMENTS_KEY, JSON.stringify(docs));
  } catch {
    /* quota exceeded – silently ignore */
  }
}

/* ── Sorting ──────────────────────────────────────────────────────── */

function sortDocs(docs: GaspeDocument[]): GaspeDocument[] {
  return [...docs].sort((a, b) => {
    // Par catégorie d'abord (alphabétique)
    if (a.category !== b.category) return a.category.localeCompare(b.category);
    // Puis par sortOrder (asc, petit = en haut)
    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
    // Puis par publishedAt décroissant (plus récent en haut)
    const ad = a.publishedAt ? Date.parse(a.publishedAt) : 0;
    const bd = b.publishedAt ? Date.parse(b.publishedAt) : 0;
    if (ad !== bd) return bd - ad;
    // Tie-break stable : par id
    return a.id.localeCompare(b.id);
  });
}

/* ── Public API ───────────────────────────────────────────────────── */

/**
 * Liste les documents visibles pour l'utilisateur courant.
 * @param includePrivate – si true, inclut les documents réservés adhérents (et brouillons si admin)
 */
export async function listDocuments(
  includePrivate = false,
): Promise<GaspeDocument[]> {
  if (isApiMode()) {
    try {
      const res = await apiFetch<{ documents?: GaspeDocument[] }>(
        `/api/cms/documents${includePrivate ? "?all=1" : ""}`,
      );
      const apiDocs = (res.documents ?? []).map(decodeDoc);
      return sortDocs(apiDocs);
    } catch {
      /* fallback localStorage */
    }
  }

  const docs = readLocal();
  const filtered = includePrivate
    ? docs
    : docs.filter((d) => d.published && d.isPublic);
  return sortDocs(filtered).map(decodeDoc);
}

/** Charge un document par id (admin / preview). */
export async function getDocument(id: string): Promise<GaspeDocument | null> {
  if (isApiMode()) {
    try {
      const res = await apiFetch<{ document?: GaspeDocument }>(
        `/api/cms/documents/${encodeURIComponent(id)}`,
      );
      return res.document ? decodeDoc(res.document) : null;
    } catch {
      /* fallback */
    }
  }
  const found = readLocal().find((d) => d.id === id);
  return found ? decodeDoc(found) : null;
}

/**
 * Crée ou met à jour un document (admin only).
 * Si `doc.id` existe → update ; sinon → create (id auto-généré si vide).
 */
export async function saveDocument(
  doc: GaspeDocument,
): Promise<GaspeDocument> {
  const now = new Date().toISOString();
  const withTimestamps: GaspeDocument = {
    ...doc,
    id: doc.id || `doc-${Date.now()}`,
    updatedAt: now,
    createdAt: doc.createdAt || now,
  };

  if (isApiMode()) {
    // Ne PAS swallow l'erreur API : si PUT/POST plante (401, 403, 5xx, réseau),
    // l'admin doit voir le message. Sinon la "sauvegarde" retombe silencieusement
    // en localStorage côté admin alors que la D1 prod ne reçoit rien.
    const existing = await getDocument(withTimestamps.id).catch(() => null);
    if (existing) {
      const res = await apiFetch<{ document: GaspeDocument }>(
        `/api/cms/documents/${encodeURIComponent(withTimestamps.id)}`,
        { method: "PUT", body: JSON.stringify(withTimestamps) },
      );
      return res.document;
    }
    const res = await apiFetch<{ document: GaspeDocument }>(
      `/api/cms/documents`,
      { method: "POST", body: JSON.stringify(withTimestamps) },
    );
    return res.document;
  }

  const docs = readLocal();
  const idx = docs.findIndex((d) => d.id === withTimestamps.id);
  if (idx >= 0) {
    docs[idx] = withTimestamps;
  } else {
    docs.push(withTimestamps);
  }
  writeLocal(docs);
  return withTimestamps;
}

/** Supprime un document (admin only). */
export async function deleteDocument(id: string): Promise<void> {
  if (isApiMode()) {
    // Propage l'erreur API au call site pour qu'elle soit affichée.
    await apiFetch(`/api/cms/documents/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    return;
  }

  const docs = readLocal().filter((d) => d.id !== id);
  writeLocal(docs);
}

/** Récupère les documents groupés par catégorie (visibles uniquement). */
export async function listDocumentsGrouped(
  includePrivate = false,
): Promise<Record<DocumentCategory, GaspeDocument[]>> {
  const all = await listDocuments(includePrivate);
  const grouped: Record<DocumentCategory, GaspeDocument[]> = {
    "ccn-accords": [],
    institutionnels: [],
    reglementaire: [],
    rapports: [],
  };
  for (const doc of all) {
    grouped[doc.category].push(doc);
  }
  return grouped;
}
