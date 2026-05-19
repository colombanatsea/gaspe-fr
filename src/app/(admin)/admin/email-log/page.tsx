"use client";

/**
 * /admin/email-log — Visualiseur des envois Brevo transactionnels.
 *
 * Master admin uniquement (Worker enforce via role === "admin").
 *
 * Sert à diagnostiquer "je ne reçois pas l'email" : on lit la table
 * email_sent_log (migration 0039) qui trace chaque tentative Brevo,
 * y compris les échecs (`error` non null) et les no-op preprod
 * (`error = "no-op (BREVO_API_KEY absent)"`).
 *
 * Types courants : `password_reset`, `registration_pending_admin`,
 * `registration_pending_user`, `registration_approved`,
 * `registration_rejected`, `invitation_team`, `contact_form`,
 * `newsletter_test`, `campaign_opened`, `campaign_due_soon`,
 * `campaign_overdue`.
 */

import { useEffect, useState, startTransition } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { Badge } from "@/components/ui/Badge";
import { apiFetch } from "@/lib/api-client";

interface EmailLogEntry {
  id: number;
  type: string;
  recipient_email: string;
  entity_id: string | null;
  sent_at_day: string;
  brevo_message_id: string | null;
  error: string | null;
  created_at: string;
}

interface ListResponse {
  entries: EmailLogEntry[];
  total: number;
  limit: number;
  offset: number;
  hint?: string;
}

const PAGE_SIZE = 100;

const TYPES = [
  "password_reset",
  "password_reset_no_user",
  "registration_pending_admin",
  "registration_pending_user",
  "registration_welcome_candidat",
  "registration_approved",
  "registration_rejected",
  "invitation_team",
  "contact_form",
  "newsletter_test",
  "campaign_opened",
  "campaign_due_soon",
  "campaign_overdue",
];

export default function EmailLogPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [entries, setEntries] = useState<EmailLogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [filterType, setFilterType] = useState("");
  const [filterRecipient, setFilterRecipient] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      router.push("/connexion");
      return;
    }
    if (user.role !== "admin") {
      router.push("/admin");
    }
  }, [user, router]);

  useEffect(() => {
    if (!user || user.role !== "admin") return;
    startTransition(() => {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({
        limit: String(PAGE_SIZE),
        offset: String(offset),
      });
      if (filterType) params.set("type", filterType);
      if (filterRecipient) params.set("recipient", filterRecipient);
      apiFetch<ListResponse>(`/api/admin/email-sent-log?${params}`)
        .then((res) => {
          setEntries(res.entries);
          setTotal(res.total);
          setHint(res.hint ?? null);
        })
        .catch((err) => setError(err instanceof Error ? err.message : "Erreur de chargement."))
        .finally(() => setLoading(false));
    });
  }, [user, offset, filterType, filterRecipient]);

  if (!user || user.role !== "admin") return null;

  const successCount = entries.filter((e) => !e.error).length;
  const errorCount = entries.length - successCount;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">
          Journal des emails Brevo
        </h1>
        <p className="mt-1 text-sm text-foreground-muted">
          Trace tous les envois transactionnels (réinitialisation, inscription,
          campagnes…). Permet de diagnostiquer un email non reçu côté destinataire.
        </p>
      </div>

      {hint && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          <strong>Info :</strong> {hint}
        </div>
      )}

      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs font-medium text-foreground-muted mb-1">Type</label>
          <select
            value={filterType}
            onChange={(e) => { setOffset(0); setFilterType(e.target.value); }}
            className="rounded-xl border border-[var(--gaspe-neutral-200)] bg-white px-3 py-2 text-sm focus:border-[var(--gaspe-teal-400)] focus:ring-1 focus:ring-[var(--gaspe-teal-400)] focus:outline-none"
          >
            <option value="">Tous les types</option>
            {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-foreground-muted mb-1">Destinataire (email exact)</label>
          <input
            type="email"
            value={filterRecipient}
            onChange={(e) => { setOffset(0); setFilterRecipient(e.target.value); }}
            placeholder="adresse@example.com"
            className="rounded-xl border border-[var(--gaspe-neutral-200)] bg-white px-3 py-2 text-sm focus:border-[var(--gaspe-teal-400)] focus:ring-1 focus:ring-[var(--gaspe-teal-400)] focus:outline-none w-72"
          />
        </div>
      </div>

      <div className="flex gap-4 text-sm">
        <span className="text-foreground">
          <strong>{total}</strong> entrées totales
        </span>
        <span className="text-[var(--gaspe-green-700)]">
          <strong>{successCount}</strong> succès
        </span>
        <span className="text-red-600">
          <strong>{errorCount}</strong> en erreur
        </span>
      </div>

      {error && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-foreground-muted">Chargement…</p>
      ) : entries.length === 0 ? (
        <p className="text-sm text-foreground-muted italic">
          Aucune entrée pour ces filtres. Si vous attendez un email récent, la table peut être absente (migration 0039 non encore appliquée) ou la requête forgot-password a échoué avant d&apos;atteindre Brevo.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-[var(--gaspe-neutral-200)] bg-surface">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--gaspe-neutral-200)] bg-[var(--gaspe-neutral-50)] text-left">
                <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-foreground-muted">Date</th>
                <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-foreground-muted">Type</th>
                <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-foreground-muted">Destinataire</th>
                <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-foreground-muted">Statut</th>
                <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-foreground-muted">Détail</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.id} className="border-b border-[var(--gaspe-neutral-100)] last:border-0 hover:bg-[var(--gaspe-neutral-50)]/50">
                  <td className="px-3 py-2 text-xs text-foreground-muted whitespace-nowrap">{e.created_at}</td>
                  <td className="px-3 py-2 font-mono text-xs text-foreground">{e.type}</td>
                  <td className="px-3 py-2 text-foreground">{e.recipient_email}</td>
                  <td className="px-3 py-2">
                    {e.error ? (
                      <Badge variant="warm">Erreur</Badge>
                    ) : (
                      <Badge variant="green">Envoyé</Badge>
                    )}
                  </td>
                  <td className="px-3 py-2 text-xs text-foreground-muted max-w-md truncate" title={e.error ?? e.brevo_message_id ?? ""}>
                    {e.error ?? e.brevo_message_id ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex items-center justify-between">
        <button
          disabled={offset === 0}
          onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
          className="rounded-xl border border-[var(--gaspe-neutral-200)] px-4 py-2 text-sm font-semibold text-foreground hover:bg-[var(--gaspe-neutral-50)] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          ← Précédent
        </button>
        <span className="text-xs text-foreground-muted">
          {offset + 1}–{Math.min(offset + PAGE_SIZE, total)} sur {total}
        </span>
        <button
          disabled={offset + PAGE_SIZE >= total}
          onClick={() => setOffset(offset + PAGE_SIZE)}
          className="rounded-xl border border-[var(--gaspe-neutral-200)] px-4 py-2 text-sm font-semibold text-foreground hover:bg-[var(--gaspe-neutral-50)] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Suivant →
        </button>
      </div>
    </div>
  );
}
