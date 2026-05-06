/* ------------------------------------------------------------------ */
/*  Positions Store – dual-mode (localStorage demo / API D1 prod)      */
/*  Session 54 — P0-2 du rapport docs/PRODUCTION-SAFETY-2026.md.       */
/*                                                                     */
/*  Avant : localStorage `gaspe_positions` isolé par navigateur.       */
/*  Après : table D1 `positions` (migration 0032) partagée.            */
/*                                                                     */
/*  Le seed src/data/positions.ts (vide depuis session 33d) sert de    */
/*  fallback éditorial uniquement quand la D1 est vide ET qu'aucune    */
/*  position n'a été saisie en localStorage.                           */
/* ------------------------------------------------------------------ */

import { positions as seedPositions, type PositionItem } from "@/data/positions";
import { apiFetch, isApiMode } from "./api-client";

const STORAGE_KEY = "gaspe_positions";

export interface StoredPosition {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: "Position" | "Communiqué de presse" | "Actualité";
  date: string;
  coverImageUrl: string;
  attachmentUrl?: string;
  tags: string[];
  published: boolean;
  isArchived?: boolean;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

/* ── localStorage helpers (mode démo) ── */

export function readLocalPositions(): StoredPosition[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function writeLocalPositions(list: StoredPosition[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    /* quota / refus storage : silencieux */
  }
}

/** Convertit le seed `PositionItem` (statique) en `StoredPosition`. */
function fromSeedItem(item: PositionItem): StoredPosition {
  return {
    id: item.slug,
    slug: item.slug,
    title: item.title,
    excerpt: item.excerpt ?? "",
    content: item.body ?? "",
    category: (item.tag === "Presse" ? "Communiqué de presse" : item.tag) as StoredPosition["category"],
    date: item.publishedAt,
    coverImageUrl: "",
    tags: [],
    published: true,
  };
}

/* ── Public API ── */

/**
 * Liste toutes les positions visibles publiquement (publiées + non archivées).
 *
 * En mode API : appelle GET /api/positions (filtre côté Worker).
 * En mode demo : merge localStorage + seed (localStorage en priorité).
 */
export async function listPositions(): Promise<StoredPosition[]> {
  if (isApiMode()) {
    try {
      const res = await apiFetch<{ positions?: StoredPosition[] }>("/api/positions");
      return res.positions ?? [];
    } catch {
      return [];
    }
  }
  const local = readLocalPositions().filter((p) => p.published && !p.isArchived);
  if (local.length > 0) return local;
  return seedPositions.map(fromSeedItem);
}

/**
 * Liste tout y compris archives + brouillons (admin/staff). Worker enforce
 * via JWT.
 */
export async function listAllPositions(): Promise<StoredPosition[]> {
  if (isApiMode()) {
    try {
      const res = await apiFetch<{ positions?: StoredPosition[] }>("/api/positions");
      return res.positions ?? [];
    } catch {
      return [];
    }
  }
  return readLocalPositions();
}

/** Récupère une position par slug ou id. */
export async function getPosition(slugOrId: string): Promise<StoredPosition | null> {
  if (isApiMode()) {
    try {
      const res = await apiFetch<{ position?: StoredPosition }>(
        `/api/positions/${encodeURIComponent(slugOrId)}`,
      );
      return res.position ?? null;
    } catch {
      return null;
    }
  }
  const local = readLocalPositions().find((p) => p.slug === slugOrId || p.id === slugOrId);
  if (local) return local;
  const fromSeed = seedPositions.find((p) => p.slug === slugOrId);
  return fromSeed ? fromSeedItem(fromSeed) : null;
}

/** Crée une position (admin/staff manage_positions côté Worker). */
export async function createPosition(
  payload: Partial<StoredPosition>,
): Promise<StoredPosition | null> {
  if (isApiMode()) {
    try {
      const res = await apiFetch<{ position?: StoredPosition }>("/api/positions", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      return res.position ?? null;
    } catch {
      return null;
    }
  }
  const list = readLocalPositions();
  const id = payload.id ?? `pos-${Date.now().toString(36)}`;
  const created: StoredPosition = {
    id,
    slug: payload.slug ?? id,
    title: payload.title ?? "Nouvelle position",
    excerpt: payload.excerpt ?? "",
    content: payload.content ?? "",
    category: payload.category ?? "Position",
    date: payload.date ?? new Date().toISOString().slice(0, 10),
    coverImageUrl: payload.coverImageUrl ?? "",
    attachmentUrl: payload.attachmentUrl,
    tags: payload.tags ?? [],
    published: payload.published ?? false,
    isArchived: payload.isArchived ?? false,
  };
  list.push(created);
  writeLocalPositions(list);
  return created;
}

/** Met à jour une position. */
export async function updatePosition(
  id: string,
  patch: Partial<StoredPosition>,
): Promise<StoredPosition | null> {
  if (isApiMode()) {
    try {
      const res = await apiFetch<{ position?: StoredPosition }>(
        `/api/positions/${encodeURIComponent(id)}`,
        { method: "PATCH", body: JSON.stringify(patch) },
      );
      return res.position ?? null;
    } catch {
      return null;
    }
  }
  const list = readLocalPositions();
  const idx = list.findIndex((p) => p.id === id);
  if (idx === -1) return null;
  list[idx] = { ...list[idx], ...patch };
  writeLocalPositions(list);
  return list[idx];
}

/** Soft-delete (is_archived=1, published=0). */
export async function deletePosition(id: string): Promise<boolean> {
  if (isApiMode()) {
    try {
      await apiFetch<{ success?: boolean }>(
        `/api/positions/${encodeURIComponent(id)}`,
        { method: "DELETE" },
      );
      return true;
    } catch {
      return false;
    }
  }
  const list = readLocalPositions().filter((p) => p.id !== id);
  writeLocalPositions(list);
  return true;
}
