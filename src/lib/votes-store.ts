/**
 * Store dual-mode pour le système de votes (session 38).
 * - localStorage en dev : `gaspe_votes` + `gaspe_vote_responses`
 * - API mode : appels Worker `/api/votes/*` et `/api/users/me/suppleant`
 *
 * Note : en mode localStorage, les fonctionnalités multi-org (votes
 * partagés, suppléant cross-user) sont simulées avec des données minimales.
 * L'usage réel se fait via l'API en prod.
 */

import { apiFetch, isApiMode } from "@/lib/api-client";
import type { Vote, VoteResponse, VoteResults, VoteOption } from "@/types";

const VOTES_KEY = "gaspe_votes";
const RESPONSES_KEY = "gaspe_vote_responses";

interface SuppleantInfo {
  isPrimary: boolean;
  suppleant: { id: string; name: string; email: string } | null;
  candidates: Array<{ id: string; name: string; email: string }>;
}

/* ── localStorage helpers ── */

function readLocalVotes(): Vote[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(VOTES_KEY) ?? "[]"); } catch { return []; }
}

function writeLocalVotes(votes: Vote[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(VOTES_KEY, JSON.stringify(votes));
}

function readLocalResponses(): VoteResponse[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(RESPONSES_KEY) ?? "[]"); } catch { return []; }
}

function writeLocalResponses(responses: VoteResponse[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(RESPONSES_KEY, JSON.stringify(responses));
}

/* ── Public API ── */

export async function listVotes(): Promise<Vote[]> {
  if (isApiMode()) {
    try {
      const res = await apiFetch<{ votes?: Vote[] }>("/api/votes");
      return res.votes ?? [];
    } catch { /* fall through */ }
  }
  return readLocalVotes();
}

export async function getVote(id: string): Promise<{ vote: Vote | null; myResponse: VoteResponse | null }> {
  if (isApiMode()) {
    try {
      const res = await apiFetch<{ vote: Vote; myResponse: VoteResponse | null }>(`/api/votes/${id}`);
      return { vote: res.vote, myResponse: res.myResponse };
    } catch { /* fall through */ }
  }
  const vote = readLocalVotes().find((v) => v.id === id) ?? null;
  const myResponse = readLocalResponses().find((r) => r.voteId === id) ?? null;
  return { vote, myResponse };
}

export interface CreateVoteInput {
  title: string;
  description?: string;
  type: Vote["type"];
  audience: Vote["audience"];
  options: VoteOption[] | string[];
  closesAt?: string;
}

export async function createVote(input: CreateVoteInput): Promise<Vote | null> {
  if (isApiMode()) {
    try {
      const res = await apiFetch<{ vote: Vote }>("/api/votes", {
        method: "POST",
        body: JSON.stringify(input),
      });
      return res.vote;
    } catch { return null; }
  }
  const newVote: Vote = {
    id: `vote-${Date.now()}`,
    ...input,
    status: "open",
    createdBy: "local-admin",
    createdAt: new Date().toISOString(),
  };
  const votes = readLocalVotes();
  votes.unshift(newVote);
  writeLocalVotes(votes);
  return newVote;
}

export async function deleteVote(id: string): Promise<boolean> {
  if (isApiMode()) {
    try {
      await apiFetch(`/api/votes/${id}`, { method: "DELETE" });
      return true;
    } catch { return false; }
  }
  writeLocalVotes(readLocalVotes().filter((v) => v.id !== id));
  writeLocalResponses(readLocalResponses().filter((r) => r.voteId !== id));
  return true;
}

export async function closeVote(id: string): Promise<boolean> {
  if (isApiMode()) {
    try {
      await apiFetch(`/api/votes/${id}/close`, { method: "POST" });
      return true;
    } catch { return false; }
  }
  const votes = readLocalVotes();
  const idx = votes.findIndex((v) => v.id === id);
  if (idx >= 0) {
    votes[idx].status = "closed";
    votes[idx].closedAt = new Date().toISOString();
    writeLocalVotes(votes);
  }
  return true;
}

export async function submitVoteResponse(voteId: string, response: string | string[]): Promise<VoteResponse | null> {
  if (isApiMode()) {
    try {
      const res = await apiFetch<{ response: VoteResponse }>(`/api/votes/${voteId}/response`, {
        method: "POST",
        body: JSON.stringify({ response }),
      });
      return res.response;
    } catch { return null; }
  }
  const newResp: VoteResponse = {
    id: `resp-${Date.now()}`,
    voteId,
    organizationId: "local-org",
    submittedBy: "local-user",
    response,
    submittedAt: new Date().toISOString(),
  };
  const responses = readLocalResponses().filter((r) => r.voteId !== voteId);
  responses.push(newResp);
  writeLocalResponses(responses);
  return newResp;
}

export async function getVoteResults(voteId: string): Promise<VoteResults | null> {
  if (isApiMode()) {
    try {
      return await apiFetch<VoteResults>(`/api/votes/${voteId}/results`);
    } catch { return null; }
  }
  // En localStorage on n'agrège pas (pas d'autres orgs)
  return null;
}

export async function getMySuppleant(): Promise<SuppleantInfo | null> {
  if (isApiMode()) {
    try {
      return await apiFetch<SuppleantInfo>("/api/users/me/suppleant");
    } catch { return null; }
  }
  return { isPrimary: true, suppleant: null, candidates: [] };
}

export async function setMySuppleant(suppleantUserId: string | null): Promise<boolean> {
  if (isApiMode()) {
    try {
      await apiFetch("/api/users/me/suppleant", {
        method: "PATCH",
        body: JSON.stringify({ suppleantUserId }),
      });
      return true;
    } catch { return false; }
  }
  return true;
}
