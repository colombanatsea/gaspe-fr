"use client";

/**
 * /admin/audit-log — visualiseur des entrées audit_log (P2-3 UI).
 *
 * Master admin uniquement (le Worker enforce via JWT role === "admin").
 * Affiche les actions sensibles tracées par `logAudit()` côté Worker :
 * organization.update, job.delete, formation.delete, medical_visit.delete,
 * seed_hashes.upsert, etc.
 *
 * Colonnes : date, user, action, entity, ip — avec filtre par action /
 * entity_type et pagination simple.
 */

import { useEffect, useState, startTransition } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { Badge } from "@/components/ui/Badge";
import { apiFetch } from "@/lib/api-client";

interface AuditEntry {
  id: number;
  user_id: string | null;
  user_email: string | null;
  user_role: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  ip: string | null;
  user_agent: string | null;
  created_at: string;
  before_len: number;
  after_len: number;
}

interface ListResponse {
  entries: AuditEntry[];
  total: number;
  limit: number;
  offset: number;
}

const PAGE_SIZE = 50;

function actionVariant(action: string): "teal" | "blue" | "warm" | "green" | "neutral" {
  if (action.endsWith(".delete")) return "warm";
  if (action.endsWith(".update")) return "blue";
  if (action.endsWith(".create")) return "green";
  if (action.includes("seed")) return "teal";
  return "neutral";
}

export default function AuditLogPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [filterAction, setFilterAction] = useState("");
  const [filterEntity, setFilterEntity] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user === undefined) return; // chargement
    if (!user || user.role !== "admin") {
      router.push("/connexion");
    }
  }, [user, router]);

  useEffect(() => {
    if (user?.role !== "admin") return;
    startTransition(() => {
      setLoading(true);
      setError("");
    });
    const params = new URLSearchParams({
      limit: String(PAGE_SIZE),
      offset: String(offset),
    });
    if (filterAction) params.set("action", filterAction);
    if (filterEntity) params.set("entity_type", filterEntity);
    apiFetch<ListResponse>(`/api/admin/audit-log?${params}`)
      .then((res) => {
        startTransition(() => {
          setEntries(res.entries ?? []);
          setTotal(res.total ?? 0);
        });
      })
      .catch((e) => startTransition(() => setError(e instanceof Error ? e.message : "Erreur")))
      .finally(() => startTransition(() => setLoading(false)));
  }, [user, offset, filterAction, filterEntity]);

  if (!user || user.role !== "admin") return null;

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.floor(offset / PAGE_SIZE) + 1;

  return (
    <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8 max-w-6xl mx-auto">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Audit log</h1>
        <p className="mt-1 text-sm text-foreground-muted">
          Trace immuable des actions sensibles sur les ressources (modifications, suppressions, mises à jour de seeds). {total} entrée{total > 1 ? "s" : ""} au total.
        </p>
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-[var(--gaspe-neutral-200)] bg-white p-4">
        <div>
          <label htmlFor="filter-action" className="block text-xs font-medium text-foreground-muted mb-1">
            Action
          </label>
          <select
            id="filter-action"
            value={filterAction}
            onChange={(e) => { setFilterAction(e.target.value); setOffset(0); }}
            className="rounded-lg border border-[var(--gaspe-neutral-200)] bg-surface px-3 py-2 text-sm"
          >
            <option value="">Toutes</option>
            <option value="organization.update">organization.update</option>
            <option value="job.delete">job.delete</option>
            <option value="formation.delete">formation.delete</option>
            <option value="medical_visit.delete">medical_visit.delete</option>
            <option value="seed_hashes.upsert">seed_hashes.upsert</option>
          </select>
        </div>
        <div>
          <label htmlFor="filter-entity" className="block text-xs font-medium text-foreground-muted mb-1">
            Type d&apos;entité
          </label>
          <select
            id="filter-entity"
            value={filterEntity}
            onChange={(e) => { setFilterEntity(e.target.value); setOffset(0); }}
            className="rounded-lg border border-[var(--gaspe-neutral-200)] bg-surface px-3 py-2 text-sm"
          >
            <option value="">Tous</option>
            <option value="organization">organization</option>
            <option value="job">job</option>
            <option value="formation">formation</option>
            <option value="medical_visit">medical_visit</option>
            <option value="seed_hashes">seed_hashes</option>
          </select>
        </div>
        {(filterAction || filterEntity) && (
          <button
            onClick={() => { setFilterAction(""); setFilterEntity(""); setOffset(0); }}
            className="rounded-lg border border-[var(--gaspe-neutral-200)] px-3 py-2 text-sm text-foreground-muted hover:bg-surface"
          >
            Réinitialiser
          </button>
        )}
      </div>

      {/* État chargement / erreur */}
      {loading && <p className="text-sm text-foreground-muted">Chargement …</p>}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          Erreur : {error}
        </div>
      )}

      {/* Tableau */}
      {!loading && entries.length === 0 && (
        <div className="rounded-xl border border-[var(--gaspe-neutral-200)] bg-white p-8 text-center text-sm text-foreground-muted">
          Aucune entrée trouvée. Les actions tracées (modifications, suppressions) apparaîtront ici.
        </div>
      )}

      {!loading && entries.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-[var(--gaspe-neutral-200)] bg-white">
          <table className="w-full text-sm">
            <thead className="bg-[var(--gaspe-neutral-50)] text-left text-xs font-semibold text-foreground-muted">
              <tr>
                <th className="px-4 py-3">Date (UTC)</th>
                <th className="px-4 py-3">Utilisateur</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Entité</th>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3 text-right">Snapshot</th>
                <th className="px-4 py-3">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--gaspe-neutral-100)]">
              {entries.map((e) => (
                <tr key={e.id} className="hover:bg-[var(--gaspe-neutral-50)]/40">
                  <td className="px-4 py-3 text-xs text-foreground-muted whitespace-nowrap font-mono">
                    {e.created_at}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {e.user_email ? (
                      <>
                        <p className="font-medium text-foreground">{e.user_email}</p>
                        {e.user_role && <p className="text-foreground-muted">{e.user_role}</p>}
                      </>
                    ) : (
                      <span className="text-foreground-muted">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={actionVariant(e.action)}>{e.action}</Badge>
                  </td>
                  <td className="px-4 py-3 text-xs text-foreground">{e.entity_type}</td>
                  <td className="px-4 py-3 text-xs text-foreground-muted font-mono">
                    {e.entity_id ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-xs text-right text-foreground-muted whitespace-nowrap">
                    {e.before_len > 0 && <>before: {(e.before_len / 1024).toFixed(1)} KB</>}
                    {e.before_len > 0 && e.after_len > 0 && " · "}
                    {e.after_len > 0 && <>after: {(e.after_len / 1024).toFixed(1)} KB</>}
                    {!e.before_len && !e.after_len && "—"}
                  </td>
                  <td className="px-4 py-3 text-xs text-foreground-muted font-mono">
                    {e.ip ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {!loading && total > PAGE_SIZE && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-foreground-muted">
            Page {currentPage} / {totalPages} — {total} entrée{total > 1 ? "s" : ""}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
              disabled={offset === 0}
              className="rounded-lg border border-[var(--gaspe-neutral-200)] px-3 py-1.5 text-sm disabled:opacity-40 hover:bg-surface"
            >
              ← Précédent
            </button>
            <button
              onClick={() => setOffset(offset + PAGE_SIZE)}
              disabled={offset + PAGE_SIZE >= total}
              className="rounded-lg border border-[var(--gaspe-neutral-200)] px-3 py-1.5 text-sm disabled:opacity-40 hover:bg-surface"
            >
              Suivant →
            </button>
          </div>
        </div>
      )}

      <p className="text-xs text-foreground-muted italic">
        Les snapshots <code className="font-mono">before_json</code> et <code className="font-mono">after_json</code>
        {" "}ne sont pas affichés ici (taille variable, jusqu&apos;à 1 MB). Pour les inspecter :
        {" "}<code className="font-mono">wrangler d1 execute gaspe-db --remote --command &quot;SELECT * FROM audit_log WHERE id = N&quot;</code>
      </p>
    </div>
  );
}
