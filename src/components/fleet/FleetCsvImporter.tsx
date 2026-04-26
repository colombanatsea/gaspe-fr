"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { downloadFleetTemplate, parseFleetCsv } from "@/lib/fleet-csv";
import { FleetVesselCard } from "@/components/fleet/FleetVesselCard";
import type { FleetVessel } from "@/types";

type Props = {
  /** Callback : remplace toute la flotte par les navires importés. */
  onImport: (vessels: FleetVessel[]) => Promise<void> | void;
  /** Si fourni, affiche dans la preview comparé avec l'existant. */
  existingCount?: number;
};

/**
 * Bouton « Télécharger template » + zone d'upload CSV avec parsing
 * client-side, preview des navires extraits, validation et confirmation
 * avant remplacement de la flotte.
 *
 * Stratégie : pas d'endpoint Worker dédié, on parse le CSV côté client
 * puis on appelle `saveFleet(slug, vessels)` (PUT existant).
 */
export function FleetCsvImporter({ onImport, existingCount }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [parsed, setParsed] = useState<FleetVessel[] | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);
  const [success, setSuccess] = useState(false);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setSuccess(false);
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      const result = parseFleetCsv(text);
      setParsed(result.vessels);
      setErrors(result.errors);
    };
    reader.onerror = () => setErrors(["Erreur de lecture du fichier."]);
    reader.readAsText(file, "utf-8");
  }

  async function handleConfirm() {
    if (!parsed || parsed.length === 0) return;
    if (!confirm(
      `Remplacer la flotte actuelle par ${parsed.length} navire${parsed.length > 1 ? "s" : ""} ? Cette action est irréversible (les navires actuels seront supprimés).`,
    )) return;
    setImporting(true);
    try {
      await onImport(parsed);
      setSuccess(true);
      setParsed(null);
      if (inputRef.current) inputRef.current.value = "";
    } finally {
      setImporting(false);
    }
  }

  function handleCancel() {
    setParsed(null);
    setErrors([]);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="rounded-2xl border border-[var(--gaspe-neutral-200)] bg-white p-5 space-y-4">
      <div>
        <h3 className="font-heading text-base font-semibold text-foreground mb-1">Import CSV de la flotte</h3>
        <p className="text-xs text-foreground-muted">
          Téléchargez le template, remplissez-le avec vos navires, puis importez-le ici. Le fichier remplace l&apos;intégralité de la flotte
          de votre compagnie. Compatible Excel français (séparateur point-virgule, encodage UTF-8 BOM).
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => downloadFleetTemplate()}
          className="inline-flex items-center gap-2 rounded-lg border border-[var(--gaspe-neutral-300)] px-4 py-2 text-sm font-heading font-semibold text-foreground hover:bg-[var(--gaspe-neutral-50)]"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
          </svg>
          Télécharger le template CSV
        </button>

        <label className="inline-flex items-center gap-2 rounded-lg border-2 border-primary text-primary px-4 py-2 text-sm font-heading font-semibold cursor-pointer hover:bg-surface-teal">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M17 8l-5-5-5 5M12 3v12" />
          </svg>
          Importer un CSV
          <input ref={inputRef} type="file" accept=".csv,text/csv" onChange={handleFile} className="hidden" />
        </label>
      </div>

      {success && (
        <div className="rounded-lg bg-[var(--gaspe-green-50)] border border-[var(--gaspe-green-200)] p-3 text-sm text-[var(--gaspe-green-600)]">
          ✓ Flotte importée avec succès. Vous pouvez recharger la page pour voir les navires.
        </div>
      )}

      {errors.length > 0 && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-700">
          <p className="font-semibold mb-1">Avertissements lors de l&apos;import :</p>
          <ul className="list-disc pl-5 space-y-0.5">
            {errors.map((e, i) => <li key={i}>{e}</li>)}
          </ul>
        </div>
      )}

      {parsed && parsed.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground">
              Aperçu : {parsed.length} navire{parsed.length > 1 ? "s" : ""} extraits
              {existingCount !== undefined && (
                <span className="text-foreground-muted font-normal">
                  {" "}(remplacera les {existingCount} navire{existingCount > 1 ? "s" : ""} actuels)
                </span>
              )}
            </p>
            <div className="flex gap-2">
              <Button onClick={handleConfirm} disabled={importing}>
                {importing ? "Import…" : "Confirmer l'import"}
              </Button>
              <button
                type="button"
                onClick={handleCancel}
                className="rounded-lg px-3 py-2 text-sm font-heading font-semibold text-foreground-muted hover:text-foreground"
              >
                Annuler
              </button>
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 max-h-[400px] overflow-auto pr-1">
            {parsed.slice(0, 10).map((v, i) => (
              <FleetVesselCard key={i} vessel={v} readOnly />
            ))}
            {parsed.length > 10 && (
              <p className="text-xs text-foreground-muted italic col-span-full">
                … et {parsed.length - 10} autre{parsed.length - 10 > 1 ? "s" : ""} (preview limitée).
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
