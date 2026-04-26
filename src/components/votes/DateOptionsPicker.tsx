"use client";

import { useState } from "react";

/**
 * Sélecteur de dates pour les votes type `date_selection`.
 * L'admin pique une date via un input date natif puis clique « Ajouter ».
 * Liste affichée en français + bouton supprimer.
 *
 * Stockage : `string[]` au format ISO yyyy-mm-dd (compatibilité avec le
 * Worker qui stocke et renvoie les options en JSON).
 */
export function DateOptionsPicker({
  value,
  onChange,
}: {
  value: string[];
  onChange: (next: string[]) => void;
}) {
  const [pending, setPending] = useState("");
  const today = new Date().toISOString().slice(0, 10);

  function add() {
    const iso = pending.trim();
    if (!iso) return;
    if (value.includes(iso)) {
      setPending("");
      return; // pas de doublon silencieux
    }
    const next = [...value, iso].sort(); // tri chronologique
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
          type="date"
          value={pending}
          min={today}
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
          Ajouter cette date
        </button>
      </div>
      {value.length === 0 ? (
        <p className="text-xs text-foreground-muted italic">Aucune date ajoutée pour le moment.</p>
      ) : (
        <ul className="space-y-1.5">
          {value.map((iso) => (
            <li
              key={iso}
              className="flex items-center justify-between rounded-lg border border-[var(--gaspe-neutral-200)] bg-white px-3 py-2"
            >
              <span className="text-sm text-foreground">
                {new Date(iso).toLocaleDateString("fr-FR", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
              <button
                type="button"
                onClick={() => remove(iso)}
                className="text-xs text-foreground-muted hover:text-red-600"
                aria-label={`Supprimer la date ${iso}`}
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
