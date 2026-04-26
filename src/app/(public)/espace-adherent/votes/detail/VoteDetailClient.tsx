"use client";

import { useEffect, useState, useCallback, startTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { getVote, submitVoteResponse } from "@/lib/votes-store";
import { VOTE_TYPE_LABELS } from "@/types";
import type { Vote, VoteResponse, VoteOption } from "@/types";
import { DragRanking } from "@/components/votes/DragRanking";

export default function VoteDetailClient({ id }: { id: string }) {
  const { user } = useAuth();
  const router = useRouter();

  const [vote, setVote] = useState<Vote | null>(null);
  const [myResponse, setMyResponse] = useState<VoteResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Etat de saisie
  const [singleChoice, setSingleChoice] = useState<string>("");
  const [multipleChoice, setMultipleChoice] = useState<string[]>([]);
  const [textResponse, setTextResponse] = useState<string>("");
  const [ranking, setRanking] = useState<string[]>([]);
  const [dateSelection, setDateSelection] = useState<string[]>([]);

  // Re-confirmation : retape email pour valider l'identité avant soumission.
  const [confirmEmail, setConfirmEmail] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!id) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    setLoading(true);
    const res = await getVote(id);
    if (!res.vote) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    setVote(res.vote);
    setMyResponse(res.myResponse);
    if (res.myResponse) {
      const r = res.myResponse.response;
      switch (res.vote.type) {
        case "single_choice":
          setSingleChoice(typeof r === "string" ? r : "");
          break;
        case "multiple_choice":
          setMultipleChoice(Array.isArray(r) ? r : []);
          break;
        case "text":
          setTextResponse(typeof r === "string" ? r : "");
          break;
        case "ranking":
          setRanking(Array.isArray(r) ? r : []);
          break;
        case "date_selection":
          setDateSelection(Array.isArray(r) ? r : []);
          break;
      }
    } else if (res.vote.type === "ranking") {
      setRanking((res.vote.options as VoteOption[]).map((o) => o.id));
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    if (!user || user.role !== "adherent") {
      router.push("/connexion");
      return;
    }
    startTransition(() => { void refresh(); });
  }, [user, router, refresh]);

  if (!user || user.role !== "adherent") return null;

  if (loading) return <div className="container mx-auto px-4 py-8"><p className="text-sm text-foreground-muted">Chargement…</p></div>;
  if (notFound || !vote) return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <Card>
        <p className="py-6 text-center text-sm text-foreground-muted">
          Vote introuvable ou réservé à un collège dont votre compagnie n&apos;est pas membre.
        </p>
        <div className="text-center"><Button href="/espace-adherent/votes">Retour aux votes</Button></div>
      </Card>
    </div>
  );

  const isClosed = vote.status === "closed";
  const closesAt = vote.closesAt ? new Date(vote.closesAt) : null;
  // Note : isPastDeadline calculé sans Date.now() au render → useEffect au montage
  const canVote = !isClosed; // affinée si on a un closesAt côté client
  const hasOptions = vote.type !== "text";
  const options = (vote.options as VoteOption[]).filter((o): o is VoteOption => typeof o === "object" && o !== null && "id" in o);
  const dates = (vote.options as string[]).filter((d): d is string => typeof d === "string");

  function buildResponse(): string | string[] | null {
    if (!vote) return null;
    switch (vote.type) {
      case "single_choice": return singleChoice || null;
      case "multiple_choice": return multipleChoice.length > 0 ? multipleChoice : null;
      case "text": return textResponse.trim() || null;
      case "ranking": return ranking.length === options.length ? ranking : null;
      case "date_selection": return dateSelection.length > 0 ? dateSelection : null;
      default: return null;
    }
  }

  async function handleSubmit() {
    setError(null);
    const response = buildResponse();
    if (response === null) {
      setError("Veuillez fournir une réponse complète avant de confirmer.");
      return;
    }
    if (!showConfirm) {
      setShowConfirm(true);
      return;
    }
    if (confirmEmail.trim().toLowerCase() !== user!.email.toLowerCase()) {
      setError("L'email saisi ne correspond pas à votre compte. Vérifiez et réessayez.");
      return;
    }
    setSubmitting(true);
    try {
      const r = await submitVoteResponse(vote!.id, response);
      if (!r) {
        setError("Erreur lors de la soumission. Veuillez réessayer.");
      } else {
        setMyResponse(r);
        setShowConfirm(false);
        setConfirmEmail("");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <Link href="/espace-adherent/votes" className="text-sm text-foreground-muted hover:text-foreground inline-flex items-center gap-1 mb-4">
        ← Retour aux votes
      </Link>

      <Card topAccent>
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <CardTitle>{vote.title}</CardTitle>
            <div className="flex items-center gap-2 flex-wrap mt-2">
              <Badge variant="neutral">{VOTE_TYPE_LABELS[vote.type]}</Badge>
              <Badge variant={vote.audience === "ag_ab" ? "teal" : "blue"}>
                {vote.audience === "ag_ab" ? "AG / AGE" : "Social 3228 / NAO"}
              </Badge>
              {isClosed && <Badge variant="neutral">Clôturé</Badge>}
            </div>
          </div>
        </div>

        {vote.description && (
          <p className="text-sm text-foreground mb-4 whitespace-pre-wrap">{vote.description}</p>
        )}

        {closesAt && !isClosed && (
          <p className="text-xs text-foreground-muted italic mb-4">
            Clôture automatique le {closesAt.toLocaleDateString("fr-FR")} à {closesAt.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
          </p>
        )}

        {myResponse && (
          <div className="mb-4 rounded-lg bg-[var(--gaspe-green-50)] border border-[var(--gaspe-green-200)] p-3 text-xs">
            <p className="font-semibold text-[var(--gaspe-green-600)]">✓ Votre compagnie a répondu le {new Date(myResponse.submittedAt).toLocaleDateString("fr-FR")}.</p>
            {canVote && <p className="text-foreground-muted mt-0.5">Vous pouvez modifier votre vote tant qu&apos;il n&apos;est pas clôturé. Le titulaire peut écraser le vote du suppléant et inversement.</p>}
          </div>
        )}

        <div className="border-t border-[var(--gaspe-neutral-100)] pt-4">
          <p className="font-heading text-sm font-semibold text-foreground mb-3">Votre réponse</p>

          {vote.type === "single_choice" && hasOptions && (
            <div className="space-y-2">
              {options.map((o) => (
                <label key={o.id} className="flex items-center gap-3 p-3 rounded-lg border border-[var(--gaspe-neutral-200)] hover:bg-[var(--gaspe-neutral-50)] cursor-pointer">
                  <input type="radio" name="single" value={o.id} checked={singleChoice === o.id} onChange={(e) => setSingleChoice(e.target.value)} disabled={!canVote} />
                  <span className="text-sm text-foreground">{o.label}</span>
                </label>
              ))}
            </div>
          )}

          {vote.type === "multiple_choice" && hasOptions && (
            <div className="space-y-2">
              {options.map((o) => (
                <label key={o.id} className="flex items-center gap-3 p-3 rounded-lg border border-[var(--gaspe-neutral-200)] hover:bg-[var(--gaspe-neutral-50)] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={multipleChoice.includes(o.id)}
                    onChange={(e) => {
                      if (e.target.checked) setMultipleChoice([...multipleChoice, o.id]);
                      else setMultipleChoice(multipleChoice.filter((x) => x !== o.id));
                    }}
                    disabled={!canVote}
                  />
                  <span className="text-sm text-foreground">{o.label}</span>
                </label>
              ))}
            </div>
          )}

          {vote.type === "text" && (
            <textarea
              value={textResponse}
              onChange={(e) => setTextResponse(e.target.value)}
              disabled={!canVote}
              rows={5}
              className="w-full rounded-xl border border-[var(--gaspe-neutral-200)] bg-white px-3.5 py-2.5 text-sm focus:border-[var(--gaspe-teal-400)] focus:ring-1 focus:ring-[var(--gaspe-teal-400)] focus:outline-none"
              placeholder="Votre réponse libre…"
            />
          )}

          {vote.type === "ranking" && hasOptions && (
            <DragRanking items={ranking} options={options} onChange={setRanking} disabled={!canVote} />
          )}

          {vote.type === "date_selection" && dates.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-foreground-muted mb-2">Cochez vos disponibilités parmi les dates proposées.</p>
              {dates.map((d) => (
                <label key={d} className="flex items-center gap-3 p-3 rounded-lg border border-[var(--gaspe-neutral-200)] hover:bg-[var(--gaspe-neutral-50)] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={dateSelection.includes(d)}
                    onChange={(e) => {
                      if (e.target.checked) setDateSelection([...dateSelection, d]);
                      else setDateSelection(dateSelection.filter((x) => x !== d));
                    }}
                    disabled={!canVote}
                  />
                  <span className="text-sm text-foreground">{new Date(d).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</span>
                </label>
              ))}
            </div>
          )}

          {canVote && showConfirm && (
            <div className="mt-4 rounded-lg bg-[var(--gaspe-warm-50)] border border-[var(--gaspe-warm-200)] p-4">
              <p className="text-sm font-semibold text-foreground mb-2">Confirmation de votre vote</p>
              <p className="text-xs text-foreground-muted mb-3">
                Pour valider votre vote au nom de votre compagnie, retapez votre email de connexion ci-dessous. Cette étape garantit la traçabilité.
              </p>
              <input
                type="email"
                value={confirmEmail}
                onChange={(e) => setConfirmEmail(e.target.value)}
                className="w-full rounded-xl border border-[var(--gaspe-neutral-200)] bg-white px-3.5 py-2 text-sm focus:border-[var(--gaspe-teal-400)] focus:ring-1 focus:ring-[var(--gaspe-teal-400)] focus:outline-none"
                placeholder="votre.email@domain.fr"
                autoFocus
              />
            </div>
          )}

          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

          {canVote && (
            <div className="flex gap-3 mt-4">
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting ? "Envoi…" : showConfirm ? "Confirmer définitivement" : myResponse ? "Modifier mon vote" : "Voter"}
              </Button>
              {showConfirm && (
                <button onClick={() => { setShowConfirm(false); setConfirmEmail(""); setError(null); }} className="text-sm font-heading font-semibold text-foreground-muted hover:text-foreground">
                  Annuler
                </button>
              )}
            </div>
          )}

          {!canVote && (
            <p className="mt-4 text-sm text-foreground-muted italic">
              Ce vote est clôturé. {myResponse ? "Votre réponse a bien été enregistrée." : "Aucune réponse n'a été enregistrée pour votre compagnie."}
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}
