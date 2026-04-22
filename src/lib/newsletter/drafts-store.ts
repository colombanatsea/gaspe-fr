/**
 * Newsletter drafts store – dual-mode (localStorage ↔ D1).
 *
 * In API mode (NEXT_PUBLIC_API_URL set), uses CF Worker + D1 table `nl_drafts`.
 * Otherwise, persists drafts in localStorage for dev/demo.
 */

import { apiFetch, isApiMode } from "../api-client";
import type { NewsletterDraft, NewsletterBlock } from "./types";
import { emptyDraft } from "./types";

const DRAFTS_KEY = "gaspe_nl_drafts";

/* ── localStorage helpers ── */

function getLocalDrafts(): NewsletterDraft[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(DRAFTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setLocalDrafts(drafts: NewsletterDraft[]) {
  localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts));
}

function randomId(): string {
  return `nl-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/* ── API DTO ↔ Draft mapping ── */

interface DraftRow {
  id: string;
  title: string;
  subject: string;
  preheader: string;
  blocks_json: string;
  status: "draft" | "sent" | "archived";
  created_by: string;
  created_at: string;
  updated_at: string;
}

function fromRow(row: DraftRow): NewsletterDraft {
  let blocks: NewsletterBlock[] = [];
  try {
    const parsed = JSON.parse(row.blocks_json);
    if (Array.isArray(parsed)) blocks = parsed;
  } catch { /* ignore */ }
  return {
    id: row.id,
    title: row.title,
    subject: row.subject,
    preheader: row.preheader,
    blocks,
    status: row.status,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/* ── Public API ── */

export async function listDrafts(): Promise<NewsletterDraft[]> {
  if (isApiMode()) {
    try {
      const res = await apiFetch<{ drafts?: DraftRow[] }>("/api/newsletter/drafts");
      return (res.drafts ?? []).map(fromRow);
    } catch { return []; }
  }
  return getLocalDrafts().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getDraft(id: string): Promise<NewsletterDraft | null> {
  if (isApiMode()) {
    try {
      const res = await apiFetch<{ draft: DraftRow | null }>(`/api/newsletter/drafts/${encodeURIComponent(id)}`);
      return res.draft ? fromRow(res.draft) : null;
    } catch { return null; }
  }
  return getLocalDrafts().find((d) => d.id === id) ?? null;
}

export async function createDraft(title: string, createdBy: string): Promise<NewsletterDraft | null> {
  const draft = emptyDraft(randomId(), title || "Nouveau brouillon", createdBy);
  if (isApiMode()) {
    try {
      const res = await apiFetch<{ draft: DraftRow }>(`/api/newsletter/drafts`, {
        method: "POST",
        body: JSON.stringify({
          id: draft.id,
          title: draft.title,
          subject: draft.subject,
          preheader: draft.preheader,
          blocks: draft.blocks,
        }),
      });
      return fromRow(res.draft);
    } catch { return null; }
  }
  const drafts = getLocalDrafts();
  drafts.unshift(draft);
  setLocalDrafts(drafts);
  return draft;
}

export async function saveDraft(draft: NewsletterDraft): Promise<boolean> {
  const updated = { ...draft, updatedAt: new Date().toISOString() };
  if (isApiMode()) {
    try {
      const res = await apiFetch<{ success?: boolean }>(`/api/newsletter/drafts/${encodeURIComponent(draft.id)}`, {
        method: "PUT",
        body: JSON.stringify({
          title: updated.title,
          subject: updated.subject,
          preheader: updated.preheader,
          blocks: updated.blocks,
        }),
      });
      return !!res.success;
    } catch { return false; }
  }
  const drafts = getLocalDrafts();
  const idx = drafts.findIndex((d) => d.id === draft.id);
  if (idx === -1) drafts.unshift(updated);
  else drafts[idx] = updated;
  setLocalDrafts(drafts);
  return true;
}

export async function deleteDraft(id: string): Promise<boolean> {
  if (isApiMode()) {
    try {
      const res = await apiFetch<{ success?: boolean }>(`/api/newsletter/drafts/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      return !!res.success;
    } catch { return false; }
  }
  setLocalDrafts(getLocalDrafts().filter((d) => d.id !== id));
  return true;
}
