"use client";

import { useState } from "react";
import type { VoteOption } from "@/types";

/**
 * Liste réordonnable pour les votes type `ranking`.
 * Drag-and-drop natif HTML5 (pas de dépendance externe) + boutons ↑/↓
 * pour l'accessibilité (navigation clavier, lecteurs d'écran).
 *
 * `items` est un tableau d'IDs d'options (ordre de classement courant).
 * `options` est la table des labels par ID. `onChange` reçoit la nouvelle
 * liste d'IDs après chaque réorganisation.
 */
export function DragRanking({
  items,
  options,
  onChange,
  disabled = false,
}: {
  items: string[];
  options: VoteOption[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
}) {
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);

  function move(fromIdx: number, toIdx: number) {
    if (fromIdx === toIdx) return;
    const next = [...items];
    const [picked] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, picked);
    onChange(next);
  }

  function handleDragStart(e: React.DragEvent<HTMLDivElement>, idx: number) {
    if (disabled) return;
    setDraggedIdx(idx);
    e.dataTransfer.effectAllowed = "move";
    // Firefox a besoin de setData pour activer le drag
    e.dataTransfer.setData("text/plain", String(idx));
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>, idx: number) {
    if (disabled || draggedIdx === null) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (overIdx !== idx) setOverIdx(idx);
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>, toIdx: number) {
    if (disabled || draggedIdx === null) return;
    e.preventDefault();
    move(draggedIdx, toIdx);
    setDraggedIdx(null);
    setOverIdx(null);
  }

  function handleDragEnd() {
    setDraggedIdx(null);
    setOverIdx(null);
  }

  function nudge(idx: number, dir: -1 | 1) {
    const target = idx + dir;
    if (target < 0 || target >= items.length) return;
    move(idx, target);
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-foreground-muted">
        Classez les options de la plus prioritaire (en haut) à la moins prioritaire (en bas). Glissez-déposez ou utilisez les flèches ↑/↓ au clavier.
      </p>
      {items.map((optId, idx) => {
        const opt = options.find((o) => o.id === optId);
        if (!opt) return null;
        const isDragged = draggedIdx === idx;
        const isOver = overIdx === idx && draggedIdx !== idx;
        return (
          <div
            key={optId}
            draggable={!disabled}
            onDragStart={(e) => handleDragStart(e, idx)}
            onDragOver={(e) => handleDragOver(e, idx)}
            onDrop={(e) => handleDrop(e, idx)}
            onDragEnd={handleDragEnd}
            aria-grabbed={isDragged}
            className={[
              "flex items-center gap-2 p-3 rounded-lg border bg-white transition",
              disabled ? "border-[var(--gaspe-neutral-200)] opacity-70" : "border-[var(--gaspe-neutral-200)] cursor-grab active:cursor-grabbing hover:border-[var(--gaspe-teal-400)]",
              isDragged ? "opacity-40" : "",
              isOver ? "ring-2 ring-[var(--gaspe-teal-400)] ring-offset-1" : "",
            ].join(" ")}
          >
            <span aria-hidden="true" className="text-foreground-muted text-base select-none">⋮⋮</span>
            <span className="font-mono text-xs w-5 text-right text-foreground-muted">{idx + 1}.</span>
            <span className="text-sm text-foreground flex-1">{opt.label}</span>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => nudge(idx, -1)}
                disabled={disabled || idx === 0}
                aria-label={`Monter ${opt.label}`}
                className="rounded-md px-2 py-1 text-xs bg-[var(--gaspe-neutral-100)] hover:bg-[var(--gaspe-neutral-200)] disabled:opacity-30"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => nudge(idx, 1)}
                disabled={disabled || idx === items.length - 1}
                aria-label={`Descendre ${opt.label}`}
                className="rounded-md px-2 py-1 text-xs bg-[var(--gaspe-neutral-100)] hover:bg-[var(--gaspe-neutral-200)] disabled:opacity-30"
              >
                ↓
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
