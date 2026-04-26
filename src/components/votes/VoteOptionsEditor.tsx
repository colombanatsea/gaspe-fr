"use client";

import { useId } from "react";

/**
 * Éditeur d'options pour les votes single_choice / multiple_choice / ranking.
 * Chaque option = un input text. L'admin ajoute / supprime / réordonne les items.
 *
 * Pour ranking, le drag-and-drop n'est pas exposé ici (ranking côté admin
 * n'a pas besoin d'ordre fixe : le seed vient dans l'ordre saisi). Si on
 * voulait un preview, on l'ajouterait plus tard.
 */
export function VoteOptionsEditor({
  value,
  onChange,
  placeholder = "Pour",
  minItems = 2,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  minItems?: number;
}) {
  const fieldId = useId();

  function update(idx: number, label: string) {
    const next = [...value];
    next[idx] = label;
    onChange(next);
  }

  function remove(idx: number) {
    const next = value.filter((_, i) => i !== idx);
    onChange(next);
  }

  function add() {
    onChange([...value, ""]);
  }

  // Toujours afficher au moins minItems lignes (même vides) pour clarifier l'UX
  const displayed = value.length < minItems
    ? [...value, ...Array(minItems - value.length).fill("")]
    : value;

  return (
    <div className="space-y-2">
      {displayed.map((label, idx) => (
        <div key={`${fieldId}-${idx}`} className="flex items-center gap-2">
          <span className="font-mono text-xs w-6 text-right text-foreground-muted">{idx + 1}.</span>
          <input
            type="text"
            value={label}
            onChange={(e) => update(idx, e.target.value)}
            className="flex-1 rounded-xl border border-[var(--gaspe-neutral-200)] bg-white px-3 py-2 text-sm focus:border-[var(--gaspe-teal-400)] focus:ring-1 focus:ring-[var(--gaspe-teal-400)] focus:outline-none"
            placeholder={idx === 0 ? placeholder : `Option ${idx + 1}`}
          />
          <button
            type="button"
            onClick={() => remove(idx)}
            disabled={displayed.length <= minItems}
            className="rounded-md px-2 py-1 text-xs text-foreground-muted hover:text-red-600 disabled:opacity-30 disabled:cursor-not-allowed"
            title={displayed.length <= minItems ? `Au moins ${minItems} options requises` : "Supprimer cette option"}
            aria-label="Supprimer cette option"
          >
            ✕
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
      >
        + Ajouter une option
      </button>
    </div>
  );
}
