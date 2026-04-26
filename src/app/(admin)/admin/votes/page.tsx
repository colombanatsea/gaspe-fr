"use client";

import { useEffect, useState, useCallback, startTransition } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { listVotes, createVote, deleteVote, closeVote, getVoteResults, type CreateVoteInput } from "@/lib/votes-store";
import { VOTE_TYPE_LABELS, VOTE_AUDIENCE_LABELS, VOTE_AUDIENCE_HINTS } from "@/types";
import type { Vote, VoteType, VoteAudience, VoteResults, VoteOption } from "@/types";

export default function AdminVotesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [votes, setVotes] = useState<Vote[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [activeResults, setActiveResults] = useState<Record<string, VoteResults | null>>({});
  const [openResults, setOpenResults] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    const list = await listVotes();
    setVotes(list);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!user || user.role !== "admin") {
      router.push("/connexion");
      return;
    }
    startTransition(() => { void refresh(); });
  }, [user, router, refresh]);

  if (!user || user.role !== "admin") return null;

  async function handleCreate(input: CreateVoteInput) {
    const created = await createVote(input);
    if (created) {
      setShowForm(false);
      await refresh();
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer ce vote et toutes ses réponses ? (irréversible)")) return;
    await deleteVote(id);
    await refresh();
  }

  async function handleClose(id: string) {
    if (!confirm("Clôturer ce vote ? Les votants ne pourront plus modifier leur réponse.")) return;
    await closeVote(id);
    await refresh();
  }

  async function toggleResults(id: string) {
    if (openResults === id) {
      setOpenResults(null);
      return;
    }
    setOpenResults(id);
    if (!activeResults[id]) {
      const r = await getVoteResults(id);
      setActiveResults((prev) => ({ ...prev, [id]: r }));
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="flex items-baseline justify-between mb-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Votes adhérents</h1>
          <p className="text-sm text-foreground-muted mt-1">AG / AGE (Collèges A+B) ou NAO / mandats sociaux (CCN 3228).</p>
        </div>
        {!showForm && <Button onClick={() => setShowForm(true)}>Nouveau vote</Button>}
      </div>

      {showForm && (
        <div className="mb-6">
          <CreateVoteForm onSubmit={handleCreate} onCancel={() => setShowForm(false)} />
        </div>
      )}

      {loading ? (
        <p className="text-sm text-foreground-muted">Chargement…</p>
      ) : votes.length === 0 ? (
        <Card>
          <div className="py-10 text-center text-sm text-foreground-muted">
            Aucun vote pour le moment. Cliquez « Nouveau vote » pour en créer un.
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {votes.map((v) => (
            <Card key={v.id}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <CardTitle className="text-base">{v.title}</CardTitle>
                    <Badge variant={v.status === "open" ? "green" : v.status === "closed" ? "neutral" : "warm"}>
                      {v.status === "open" ? "Ouvert" : v.status === "closed" ? "Clôturé" : "Brouillon"}
                    </Badge>
                    <Badge variant={v.audience === "ag_ab" ? "teal" : "blue"}>
                      {v.audience === "ag_ab" ? "AG / AGE" : "Social 3228"}
                    </Badge>
                    <Badge variant="neutral">{VOTE_TYPE_LABELS[v.type]}</Badge>
                  </div>
                  {v.description && <p className="text-sm text-foreground-muted">{v.description}</p>}
                  <div className="flex gap-3 text-xs text-foreground-muted mt-2">
                    <span>Créé le {new Date(v.createdAt).toLocaleDateString("fr-FR")}</span>
                    {v.closesAt && <span>· Clôture auto : {new Date(v.closesAt).toLocaleDateString("fr-FR")}</span>}
                  </div>
                </div>
                <div className="flex flex-col gap-1.5 shrink-0">
                  <button onClick={() => toggleResults(v.id)} className="text-xs font-semibold text-primary hover:underline">
                    {openResults === v.id ? "Masquer résultats" : "Voir résultats"}
                  </button>
                  <ShareUrlButton voteId={v.id} />
                  {v.status === "open" && (
                    <button onClick={() => handleClose(v.id)} className="text-xs text-foreground-muted hover:text-foreground">
                      Clôturer
                    </button>
                  )}
                  <button onClick={() => handleDelete(v.id)} className="text-xs text-foreground-muted hover:text-red-600">
                    Supprimer
                  </button>
                </div>
              </div>

              {openResults === v.id && (
                <ResultsPanel results={activeResults[v.id]} vote={v} />
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─────────── Create form ─────────── */

const inputClass =
  "w-full rounded-xl border border-[var(--gaspe-neutral-200)] bg-white px-3.5 py-2.5 text-sm text-foreground focus:border-[var(--gaspe-teal-400)] focus:ring-1 focus:ring-[var(--gaspe-teal-400)] focus:outline-none";

function CreateVoteForm({ onSubmit, onCancel }: { onSubmit: (input: CreateVoteInput) => void; onCancel: () => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<VoteType>("single_choice");
  const [audience, setAudience] = useState<VoteAudience>("ag_ab");
  const [optionsText, setOptionsText] = useState("");
  const [closesAt, setClosesAt] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    let options: VoteOption[] | string[] = [];
    if (type === "single_choice" || type === "multiple_choice" || type === "ranking") {
      const lines = optionsText.split("\n").map((l) => l.trim()).filter(Boolean);
      options = lines.map((label, i) => ({ id: `opt-${i + 1}`, label }));
      if (options.length < 2) {
        alert("Au moins 2 options nécessaires pour ce type de vote.");
        return;
      }
    } else if (type === "date_selection") {
      const lines = optionsText.split("\n").map((l) => l.trim()).filter(Boolean);
      options = lines;
      if (options.length === 0) {
        alert("Au moins 1 date à proposer (format ISO yyyy-mm-dd).");
        return;
      }
    }

    onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      type,
      audience,
      options,
      closesAt: closesAt || undefined,
    });
  }

  const showOptions = type !== "text";
  const optionsLabel = type === "date_selection" ? "Dates proposées (1 par ligne, format yyyy-mm-dd)" : "Options (1 par ligne)";

  return (
    <Card topAccent>
      <CardTitle>Nouveau vote</CardTitle>
      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <div>
          <label className="block text-xs font-medium text-foreground-muted mb-1">Titre *</label>
          <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} placeholder="Approbation des comptes 2025" />
        </div>
        <div>
          <label className="block text-xs font-medium text-foreground-muted mb-1">Description (optionnelle)</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className={inputClass} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-foreground-muted mb-1">Type de vote</label>
            <select value={type} onChange={(e) => setType(e.target.value as VoteType)} className={inputClass}>
              {Object.entries(VOTE_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-foreground-muted mb-1">Audience</label>
            <select value={audience} onChange={(e) => setAudience(e.target.value as VoteAudience)} className={inputClass}>
              {Object.entries(VOTE_AUDIENCE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <p className="text-xs text-foreground-muted italic mt-1">{VOTE_AUDIENCE_HINTS[audience]}</p>
          </div>
        </div>
        {showOptions && (
          <div>
            <label className="block text-xs font-medium text-foreground-muted mb-1">{optionsLabel}</label>
            <textarea value={optionsText} onChange={(e) => setOptionsText(e.target.value)} rows={5} className={inputClass} placeholder={type === "date_selection" ? "2026-05-12\n2026-05-13\n2026-05-14" : "Pour\nContre\nAbstention"} />
          </div>
        )}
        <div>
          <label className="block text-xs font-medium text-foreground-muted mb-1">Clôture automatique (optionnelle)</label>
          <input type="datetime-local" value={closesAt} onChange={(e) => setClosesAt(e.target.value)} className={inputClass} />
          <p className="text-xs text-foreground-muted mt-1">Si renseignée, le vote se ferme automatiquement à cette date et un compteur s&apos;affiche aux votants.</p>
        </div>
        <div className="flex gap-3 pt-2 border-t border-[var(--gaspe-neutral-100)]">
          <Button type="submit">Créer le vote</Button>
          <button type="button" onClick={onCancel} className="text-sm font-heading font-semibold text-foreground-muted hover:text-foreground">
            Annuler
          </button>
        </div>
      </form>
    </Card>
  );
}

/* ─────────── Share URL ─────────── */

function ShareUrlButton({ voteId }: { voteId: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    const url = `${typeof window !== "undefined" ? window.location.origin : ""}/espace-adherent/votes/detail?id=${encodeURIComponent(voteId)}`;
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      void navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  }
  return (
    <button onClick={copy} className="text-xs font-semibold text-primary hover:underline" title="Copier l'URL à partager aux votants">
      {copied ? "✓ Copié" : "Copier l'URL"}
    </button>
  );
}

/* ─────────── Results panel (inline) ─────────── */

function ResultsPanel({ results, vote }: { results: VoteResults | null | undefined; vote: Vote }) {
  if (results === undefined) return <p className="mt-4 text-sm text-foreground-muted">Chargement…</p>;
  if (results === null) return <p className="mt-4 text-sm text-red-600">Impossible de charger les résultats.</p>;

  const respPct = results.totalEligible > 0 ? Math.round((results.totalResponded / results.totalEligible) * 100) : 0;

  // Mailto pour relance non-responders
  const nonRespEmails = results.nonResponders
    .flatMap((nr) => [nr.titulaireEmail, nr.suppleantEmail].filter((e): e is string => !!e));
  const reminderMailto = `mailto:?bcc=${nonRespEmails.join(",")}&subject=${encodeURIComponent(`Relance vote : ${vote.title}`)}&body=${encodeURIComponent(`Bonjour,\n\nUn vote en cours sur la plateforme ACF nécessite votre réponse :\n\n${vote.title}\n\nLien : ${typeof window !== "undefined" ? window.location.origin : ""}/espace-adherent/votes/detail?id=${encodeURIComponent(vote.id)}\n\nCordialement,\nL'équipe ACF`)}`;

  // Mailto pour partage à tous (bcc tous responders+non-responders)
  const allEmails = [
    ...nonRespEmails,
    ...results.responders.map(() => "").filter(Boolean), // we don't have responders' emails in payload, only names — could be improved with API extension
  ].filter(Boolean);
  const shareMailto = `mailto:?bcc=${allEmails.join(",")}&subject=${encodeURIComponent(`Résultats vote : ${vote.title}`)}&body=${encodeURIComponent(`Bonjour,\n\nLes résultats du vote « ${vote.title} » sont disponibles :\n\n${typeof window !== "undefined" ? window.location.origin : ""}/admin/votes (admin) ou consultez l'espace adhérent.\n\nCordialement,\nL'équipe ACF`)}`;

  return (
    <div className="mt-4 pt-4 border-t border-[var(--gaspe-neutral-100)] space-y-4">
      <div>
        <p className="font-heading text-sm font-semibold text-foreground">
          {results.totalResponded} / {results.totalEligible} réponses ({respPct}%)
        </p>
        <div className="mt-2 h-2 rounded-full bg-[var(--gaspe-neutral-100)] overflow-hidden">
          <div className="h-full bg-primary transition-all" style={{ width: `${respPct}%` }} />
        </div>
      </div>

      {/* Action mailto */}
      <div className="flex flex-wrap gap-2">
        {nonRespEmails.length > 0 && (
          <a href={reminderMailto} className="inline-flex items-center gap-1.5 rounded-lg border border-primary text-primary px-3 py-1.5 text-xs font-semibold hover:bg-surface-teal">
            ✉ Relancer non-répondants ({nonRespEmails.length})
          </a>
        )}
        <a href={shareMailto} className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--gaspe-neutral-300)] text-foreground-muted px-3 py-1.5 text-xs font-semibold hover:bg-[var(--gaspe-neutral-50)]">
          ✉ Partager les résultats à tous
        </a>
      </div>

      {/* Agrégation par option */}
      {results.optionCounts && Object.keys(results.optionCounts).length > 0 && (
        <div>
          <p className="text-xs font-heading font-semibold uppercase tracking-wide text-foreground-muted mb-2">Réponses par option</p>
          <ul className="space-y-1.5">
            {Object.entries(results.optionCounts)
              .sort((a, b) => b[1] - a[1])
              .map(([key, count]) => {
                const optionLabel = (Array.isArray(vote.options) && (vote.options as VoteOption[])
                  .find((o) => typeof o === "object" && "id" in o && o.id === key)?.label) ?? key;
                const pct = results.totalResponded > 0 ? Math.round((count / results.totalResponded) * 100) : 0;
                return (
                  <li key={key} className="flex items-center gap-3">
                    <span className="text-xs text-foreground flex-1 min-w-0 truncate">{optionLabel}</span>
                    <div className="w-32 h-1.5 rounded-full bg-[var(--gaspe-neutral-100)] overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs text-foreground-muted w-16 text-right">{count} · {pct}%</span>
                  </li>
                );
              })}
          </ul>
        </div>
      )}

      {/* Réponses textuelles */}
      {results.textResponses && results.textResponses.length > 0 && (
        <div>
          <p className="text-xs font-heading font-semibold uppercase tracking-wide text-foreground-muted mb-2">Réponses libres</p>
          <ul className="space-y-2">
            {results.textResponses.map((tr, i) => (
              <li key={i} className="text-xs">
                <span className="font-medium text-foreground">{tr.organizationName}</span>
                <span className="text-foreground-muted ml-2">· {new Date(tr.submittedAt).toLocaleDateString("fr-FR")}</span>
                <p className="mt-0.5 text-foreground italic">« {tr.response} »</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Tableau des répondants */}
      <div>
        <p className="text-xs font-heading font-semibold uppercase tracking-wide text-foreground-muted mb-2">
          Répondants ({results.responders.length})
        </p>
        {results.responders.length === 0 ? (
          <p className="text-xs text-foreground-muted">Aucune réponse pour le moment.</p>
        ) : (
          <ul className="space-y-1">
            {results.responders.map((r) => (
              <li key={r.organizationId} className="flex justify-between text-xs">
                <span className="text-foreground">{r.organizationName}{r.submittedByName ? ` (${r.submittedByName})` : ""}</span>
                <span className="text-foreground-muted">{new Date(r.submittedAt).toLocaleString("fr-FR")}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Tableau des non-répondants */}
      {results.nonResponders.length > 0 && (
        <div>
          <p className="text-xs font-heading font-semibold uppercase tracking-wide text-foreground-muted mb-2">
            Non-répondants ({results.nonResponders.length})
          </p>
          <ul className="space-y-1">
            {results.nonResponders.map((nr) => (
              <li key={nr.organizationId} className="flex justify-between text-xs">
                <span className="text-foreground">{nr.organizationName}</span>
                <span className="text-foreground-muted">
                  {[nr.titulaireEmail, nr.suppleantEmail].filter(Boolean).join(" · ")}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
