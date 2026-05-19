"use client";

import { useState } from "react";

/**
 * Sélecteur de dates pour les votes type `date_selection`.
 *
 * Format stocké : ISO `YYYY-MM-DD` (date seule) ou `YYYY-MM-DDTHH:mm` (avec heure
 * quand `withTime=true`). Le Worker conserve le string brut dans `options` JSON.
 *
 * `withTime` est piloté par le flag `vote.includeTime` (admin paramètre au
 * create du vote). Sert à proposer des créneaux horaires pour les réunions
 * ou plages d'écoute.
 */
export function formatVoteDateOption(iso: string): string {
  // Détection robuste : présence d'un `T` ou d'un `:` → datetime ; sinon date seule.
  const hasTime = iso.includes("T") || iso.length > 10;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  if (hasTime) {
    return date.toLocaleString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  return date.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function DateOptionsPicker({
  value,
  onChange,
  withTime = false,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  withTime?: boolean;
}) {
  const [pending, setPending] = useState("");
  const today = new Date().toISOString().slice(0, 10);
  const nowLocal = new Date().toISOString().slice(0, 16); // "YYYY-MM-DDTHH:mm"

  function add() {
    const iso = pending.trim();
    if (!iso) return;
    if (value.includes(iso)) {
      setPending("");
      return;
    }
    const next = [...value, iso].sort();
    onChange(next);
    setPending("");
  }

  function remove(iso: string) {
    onChange(value.filter((d) => d !== iso));
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <input
          type={withTime ? "datetime-local" : "date"}
          value={pending}
          min={withTime ? nowLocal : today}
          onChange={(e) => setPending(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          className="rounded-xl border border-[var(--gaspe-neutral-200)] bg-white px-3 py-2 text-sm focus:border-[var(--gaspe-teal-400)] focus:ring-1 focus:ring-[var(--gaspe-teal-400)] focus:outline-none"
        />
        <button
          type="button"
          onClick={add}
          disabled={!pending}
          className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--gaspe-teal-700)] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {withTime ? "Ajouter ce créneau" : "Ajouter cette date"}
        </button>
      </div>
      {value.length === 0 ? (
        <p className="text-xs text-foreground-muted italic">
          {withTime ? "Aucun créneau ajouté pour le moment." : "Aucune date ajoutée pour le moment."}
        </p>
      ) : (
        <ul className="space-y-1.5">
          {value.map((iso) => (
            <li
              key={iso}
              className="flex items-center justify-between rounded-lg border border-[var(--gaspe-neutral-200)] bg-white px-3 py-2"
            >
              <span className="text-sm text-foreground">{formatVoteDateOption(iso)}</span>
              <button
                type="button"
                onClick={() => remove(iso)}
                className="text-xs text-foreground-muted hover:text-red-600"
                aria-label={`Supprimer ${iso}`}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
