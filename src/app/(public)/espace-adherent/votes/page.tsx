"use client";

import { useEffect, useState, useCallback, startTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { Card, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { listVotes, getVote } from "@/lib/votes-store";
import { VOTE_TYPE_LABELS } from "@/types";
import type { Vote, VoteResponse } from "@/types";

export default function AdherentVotesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [votes, setVotes] = useState<Vote[]>([]);
  const [myResponses, setMyResponses] = useState<Record<string, VoteResponse>>({});
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const list = await listVotes();
    setVotes(list);
    // Pour chaque vote, fetch ma réponse si elle existe (parallel)
    const detailPromises = list.map((v) => getVote(v.id));
    const details = await Promise.all(detailPromises);
    const map: Record<string, VoteResponse> = {};
    details.forEach((d, i) => {
      if (d.myResponse) map[list[i].id] = d.myResponse;
    });
    setMyResponses(map);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!user || user.role !== "adherent") {
      router.push("/connexion");
      return;
    }
    startTransition(() => { void refresh(); });
  }, [user, router, refresh]);

  if (!user || user.role !== "adherent") return null;

  const openVotes = votes.filter((v) => v.status === "open");
  const closedVotes = votes.filter((v) => v.status === "closed");

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-foreground mb-2">Votes</h1>
        <p className="text-sm text-foreground-muted">
          Votes auxquels votre compagnie peut participer (selon le collège et le statut CCN 3228).
          1 vote par compagnie : titulaire et suppléant peuvent répondre, le titulaire peut écraser le vote du suppléant.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-foreground-muted">Chargement…</p>
      ) : (
        <>
          {/* Votes ouverts */}
          <section className="mb-8">
            <h2 className="font-heading text-lg font-semibold text-foreground mb-3">À voter</h2>
            {openVotes.length === 0 ? (
              <Card>
                <p className="py-6 text-center text-sm text-foreground-muted">
                  Aucun vote en cours. Les nouveaux votes apparaîtront ici dès qu&apos;ils seront ouverts par l&apos;administrateur ACF.
                </p>
              </Card>
            ) : (
              <div className="space-y-3">
                {openVotes.map((v) => <VoteRow key={v.id} vote={v} response={myResponses[v.id]} />)}
              </div>
            )}
          </section>

          {/* Votes clôturés */}
          {closedVotes.length > 0 && (
            <section>
              <h2 className="font-heading text-lg font-semibold text-foreground mb-3">Historique</h2>
              <div className="space-y-3">
                {closedVotes.map((v) => <VoteRow key={v.id} vote={v} response={myResponses[v.id]} />)}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

function useClosingSoon(closesAt: Date | null) {
  const [soon, setSoon] = useState(false);
  useEffect(() => {
    if (!closesAt) return;
    const diff = closesAt.getTime() - Date.now();
    startTransition(() => setSoon(diff > 0 && diff < 1000 * 60 * 60 * 48));
  }, [closesAt]);
  return soon;
}

function VoteRow({ vote, response }: { vote: Vote; response: VoteResponse | undefined }) {
  const hasResponded = !!response;
  const isClosed = vote.status === "closed";
  const closesAt = vote.closesAt ? new Date(vote.closesAt) : null;
  // Note : closingSoon est calculé côté client uniquement (window check via type guard)
  // pour éviter "impure function during render" en SSR.
  const closingSoon = useClosingSoon(closesAt);

  return (
    <Link href={`/espace-adherent/votes/detail?id=${encodeURIComponent(vote.id)}`} className="block group">
      <Card topAccent>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <CardTitle className="text-base group-hover:text-primary transition-colors">{vote.title}</CardTitle>
              <Badge variant="neutral">{VOTE_TYPE_LABELS[vote.type]}</Badge>
              <Badge variant={vote.audience === "ag_ab" ? "teal" : "blue"}>
                {vote.audience === "ag_ab" ? "AG / AGE" : "Social 3228"}
              </Badge>
              {hasResponded && <Badge variant="green">✓ Répondu</Badge>}
              {!hasResponded && !isClosed && <Badge variant="warm">À voter</Badge>}
              {isClosed && <Badge variant="neutral">Clôturé</Badge>}
            </div>
            {vote.description && <p className="text-sm text-foreground-muted line-clamp-2">{vote.description}</p>}
            <div className="flex flex-wrap gap-3 text-xs text-foreground-muted mt-2">
              <span>Ouvert le {new Date(vote.createdAt).toLocaleDateString("fr-FR")}</span>
              {closesAt && (
                <span className={closingSoon ? "text-[var(--gaspe-warm-600)] font-semibold" : ""}>
                  · Clôture {isClosed ? "le" : "auto le"} {closesAt.toLocaleDateString("fr-FR")} à {closesAt.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                  {closingSoon && " ⚠"}
                </span>
              )}
              {response && (
                <span>· Votre vote enregistré le {new Date(response.submittedAt).toLocaleDateString("fr-FR")}</span>
              )}
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
