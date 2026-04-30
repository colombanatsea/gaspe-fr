"use client";

import { useEffect, useState, startTransition } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { Button } from "@/components/ui/Button";
import { isStaffOrAdmin } from "@/lib/auth/permissions";
import { listValidationsForOrg } from "@/lib/validation-store";
import { FIELD_LABELS_FR, formatDiffValue } from "@/lib/validation-diff";
import { members } from "@/data/members";
import type { ValidationHistoryEntry } from "@/types/validation";

interface AttestationData {
  organizationName: string;
  history: ValidationHistoryEntry[];
}

export default function AttestationClient({
  slug,
  year,
}: {
  slug: string;
  year: number;
}) {
  const { user } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<AttestationData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !isStaffOrAdmin(user)) {
      router.push("/connexion");
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const { history } = await listValidationsForOrg(slug);
        if (cancelled) return;
        const member = members.find((m) => m.slug === slug);
        startTransition(() => {
          setData({
            organizationName: member?.name ?? slug,
            history,
          });
          setLoading(false);
        });
      } catch {
        if (!cancelled) startTransition(() => setLoading(false));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, router, slug]);

  if (!user || !isStaffOrAdmin(user)) return null;

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <p className="text-sm text-foreground-muted">Chargement...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <p className="text-sm text-foreground-muted">
          Donnees indisponibles pour {slug} / {year}.
        </p>
      </div>
    );
  }

  // Filtre l'historique sur l'annee cible. Pour chaque (itemType, itemId),
  // on garde la derniere validation pour cette annee.
  const itemKeys = new Map<string, ValidationHistoryEntry>();
  for (const h of data.history) {
    if (h.targetYear !== year) continue;
    const key = `${h.itemType}::${h.itemId ?? ""}`;
    if (!itemKeys.has(key)) itemKeys.set(key, h);
  }
  const items = Array.from(itemKeys.values());

  // Tri profil > navires alphabetiquement
  items.sort((a, b) => {
    if (a.itemType !== b.itemType) return a.itemType === "profile" ? -1 : 1;
    const nameA =
      (a.snapshot as Record<string, unknown> | null)?.name as string | undefined;
    const nameB =
      (b.snapshot as Record<string, unknown> | null)?.name as string | undefined;
    return (nameA ?? "").localeCompare(nameB ?? "", "fr");
  });

  const generatedAt = new Date().toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  function handlePrint() {
    if (typeof window !== "undefined") window.print();
  }

  return (
    <div className="attestation-page mx-auto max-w-3xl px-6 py-8 print:p-8">
      {/* Toolbar (cachee a l'impression) */}
      <div className="print:hidden mb-6 flex items-center justify-between gap-3 flex-wrap">
        <button
          type="button"
          onClick={() => router.back()}
          className="text-sm text-foreground-muted hover:text-primary"
        >
          ← Retour
        </button>
        <Button variant="primary" onClick={handlePrint}>
          Telecharger l&apos;attestation (PDF)
        </Button>
      </div>

      {/* En-tete */}
      <header className="mb-8 border-b-2 border-[var(--gaspe-teal-600)] pb-4">
        <p className="text-xs uppercase tracking-wider text-[var(--gaspe-teal-700)] font-heading font-semibold">
          ACF (ex-GASPE) – Armateurs Cotiers Francais
        </p>
        <h1 className="mt-2 font-heading text-2xl font-bold text-foreground print:text-black">
          Attestation de validation annuelle des donnees
        </h1>
        <p className="mt-1 text-sm text-foreground-muted">
          Annee de reference : <strong>{year}</strong>
        </p>
      </header>

      {/* Bloc compagnie */}
      <section className="mb-6">
        <h2 className="font-heading text-lg font-semibold text-foreground mb-2">
          Compagnie
        </h2>
        <p className="text-base text-foreground">{data.organizationName}</p>
        <p className="text-xs text-foreground-muted mt-1">Slug : {slug}</p>
      </section>

      {/* Bloc items */}
      <section className="mb-6">
        <h2 className="font-heading text-lg font-semibold text-foreground mb-3">
          Donnees validees pour {year}
        </h2>
        {items.length === 0 ? (
          <p className="text-sm text-foreground-muted">
            Aucune validation enregistree pour cette annee.
          </p>
        ) : (
          <div className="space-y-4">
            {items.map((item, i) => (
              <ItemBlock key={i} item={item} />
            ))}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="mt-12 pt-6 border-t border-[var(--gaspe-neutral-300)] text-xs text-foreground-muted">
        <p>
          Document genere le {generatedAt}. Source : table{" "}
          <code>validation_history</code> (Cloudflare D1, snapshots immuables).
        </p>
        <p className="mt-1">
          {items.length} item{items.length > 1 ? "s" : ""} valide{items.length > 1 ? "s" : ""} pour {year}.
        </p>
      </footer>

      <style jsx global>{`
        @media print {
          body {
            background: white;
          }
          .attestation-page {
            color: #222221;
          }
          /* Cache la sidebar admin et le header layout pendant l'impression */
          aside,
          nav,
          header[class*="admin"],
          .admin-sidebar {
            display: none !important;
          }
          @page {
            size: A4;
            margin: 1.5cm;
          }
        }
      `}</style>
    </div>
  );
}

function ItemBlock({ item }: { item: ValidationHistoryEntry }) {
  const snapshot = (item.snapshot ?? {}) as Record<string, unknown>;
  const name =
    item.itemType === "profile"
      ? "Profil de la compagnie"
      : (snapshot.name as string | undefined) ?? "Navire";
  const validatedAt = new Date(item.validatedAt).toLocaleDateString("fr-FR");
  const fields = Object.entries(snapshot).filter(([k]) => k !== "id");

  return (
    <div className="rounded-lg border border-[var(--gaspe-neutral-200)] p-4 print:break-inside-avoid">
      <div className="flex items-baseline justify-between gap-2 mb-2">
        <h3 className="font-heading text-base font-semibold text-foreground">
          {name}
        </h3>
        <p className="text-xs text-foreground-muted">
          Valide le {validatedAt}
          {item.isUnchanged && " (inchange)"}
        </p>
      </div>
      <table className="w-full text-xs">
        <tbody>
          {fields.map(([key, value]) => (
            <tr
              key={key}
              className="border-t border-[var(--gaspe-neutral-100)]"
            >
              <td className="px-2 py-1 font-medium text-foreground w-1/3">
                {FIELD_LABELS_FR[key] ?? key}
              </td>
              <td className="px-2 py-1 text-foreground-muted font-mono break-words">
                {formatDiffValue(value)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
