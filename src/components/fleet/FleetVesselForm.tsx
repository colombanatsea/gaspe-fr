"use client";

import { useState } from "react";
import type { FleetVessel } from "@/types";
import { Button } from "@/components/ui/Button";

const inputClass =
  "w-full rounded-xl border border-[var(--gaspe-neutral-200)] bg-white px-3.5 py-2.5 text-sm text-foreground focus:border-[var(--gaspe-teal-400)] focus:ring-1 focus:ring-[var(--gaspe-teal-400)] focus:outline-none";

const labelClass = "block text-xs font-medium text-foreground-muted mb-1";

type Props = {
  initial?: FleetVessel;
  onSubmit: (vessel: FleetVessel) => void;
  onCancel: () => void;
  submitLabel?: string;
};

/**
 * Formulaire d'édition (ou création) d'un navire. Couvre tous les
 * champs du tableur adhérents. Les champs "libres" (puissance, consommation,
 * équipage, année de renouvellement) sont des inputs texte pour tolérer les
 * formats mixtes ("2 x 2300 CV", "70 L/h", "2/3", "2032-2034").
 *
 * Sections : Identité, Caractéristiques, Capacités, Exploitation,
 * Propulsion, Renouvellement, Environnement.
 */
export function FleetVesselForm({ initial, onSubmit, onCancel, submitLabel = "Enregistrer" }: Props) {
  const [v, setV] = useState<FleetVessel>(initial ?? { name: "" });

  function set<K extends keyof FleetVessel>(key: K, value: FleetVessel[K]) {
    setV((prev) => ({ ...prev, [key]: value }));
  }

  function numOrUndef(str: string): number | undefined {
    if (!str.trim()) return undefined;
    const n = Number(str.replace(",", "."));
    return Number.isFinite(n) ? n : undefined;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!v.name.trim()) return;
    // Trim all string fields to avoid leaking leading/trailing whitespace.
    const cleaned: FleetVessel = Object.fromEntries(
      Object.entries(v).map(([k, val]) => [k, typeof val === "string" ? val.trim() || undefined : val]),
    ) as FleetVessel;
    if (!cleaned.name) return;
    onSubmit(cleaned);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-[var(--gaspe-neutral-200)] border-l-[3px] border-l-[var(--gaspe-teal-600)] bg-white p-5">
      {/* Identité */}
      <fieldset className="space-y-3">
        <legend className="font-heading text-sm font-semibold text-foreground mb-1">Identité</legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Nom du navire *</label>
            <input type="text" required value={v.name} onChange={(e) => set("name", e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>N° IMO</label>
            <input type="text" value={v.imo ?? ""} onChange={(e) => set("imo", e.target.value)} placeholder="1234567" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Type de navire</label>
            <input type="text" value={v.type ?? ""} onChange={(e) => set("type", e.target.value)} placeholder="Bac, catamaran, ferry…" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Pavillon</label>
            <input type="text" value={v.flag ?? ""} onChange={(e) => set("flag", e.target.value)} placeholder="Premier registre, RIF…" className={inputClass} />
          </div>
        </div>
      </fieldset>

      {/* Caractéristiques */}
      <fieldset className="space-y-3">
        <legend className="font-heading text-sm font-semibold text-foreground mb-1">Caractéristiques</legend>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className={labelClass}>Année de livraison</label>
            <input type="number" value={v.yearBuilt ?? ""} onChange={(e) => set("yearBuilt", numOrUndef(e.target.value))} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Longueur (m)</label>
            <input type="text" inputMode="decimal" value={v.length ?? ""} onChange={(e) => set("length", numOrUndef(e.target.value))} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Largeur (m)</label>
            <input type="text" inputMode="decimal" value={v.beam ?? ""} onChange={(e) => set("beam", numOrUndef(e.target.value))} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Tonnage UMS</label>
            <input type="text" inputMode="decimal" value={v.grossTonnage ?? ""} onChange={(e) => set("grossTonnage", numOrUndef(e.target.value))} className={inputClass} />
          </div>
        </div>
      </fieldset>

      {/* Capacités */}
      <fieldset className="space-y-3">
        <legend className="font-heading text-sm font-semibold text-foreground mb-1">Capacités</legend>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className={labelClass}>Passagers</label>
            <input type="number" value={v.passengerCapacity ?? ""} onChange={(e) => set("passengerCapacity", numOrUndef(e.target.value))} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Véhicules</label>
            <input type="number" value={v.vehicleCapacity ?? ""} onChange={(e) => set("vehicleCapacity", numOrUndef(e.target.value))} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Fret (tonnes)</label>
            <input type="number" value={v.freightCapacity ?? ""} onChange={(e) => set("freightCapacity", numOrUndef(e.target.value))} className={inputClass} />
          </div>
        </div>
      </fieldset>

      {/* Exploitation */}
      <fieldset className="space-y-3">
        <legend className="font-heading text-sm font-semibold text-foreground mb-1">Exploitation</legend>
        <div>
          <label className={labelClass}>Ligne d&apos;exploitation</label>
          <input type="text" value={v.operatingLine ?? ""} onChange={(e) => set("operatingLine", e.target.value)} placeholder="Le Conquet – Molène – Ouessant" className={inputClass} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className={labelClass}>Rotations / an (2024)</label>
            <input type="number" value={v.rotationsPerYear ?? ""} onChange={(e) => set("rotationsPerYear", numOrUndef(e.target.value))} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Équipage</label>
            <input type="text" value={v.crewSize ?? ""} onChange={(e) => set("crewSize", e.target.value)} placeholder="8, 2/3, 4 ou 3 sur PA…" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Vitesse (nœuds)</label>
            <input type="text" inputMode="decimal" value={v.cruiseSpeed ?? ""} onChange={(e) => set("cruiseSpeed", numOrUndef(e.target.value))} className={inputClass} />
          </div>
        </div>
      </fieldset>

      {/* Propulsion & énergie */}
      <fieldset className="space-y-3">
        <legend className="font-heading text-sm font-semibold text-foreground mb-1">Propulsion & énergie</legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Type de propulsion</label>
            <input type="text" value={v.propulsionType ?? ""} onChange={(e) => set("propulsionType", e.target.value)} placeholder="Voith, Schottel, hydrojet…" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Carburant principal</label>
            <input type="text" value={v.fuelType ?? ""} onChange={(e) => set("fuelType", e.target.value)} placeholder="GO, MGO, MDO, électrique…" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Puissance (kW)</label>
            <input type="text" value={v.powerKw ?? ""} onChange={(e) => set("powerKw", e.target.value)} placeholder="5592, 2 x 2300 CV…" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Consommation / trajet</label>
            <input type="text" value={v.consumptionPerTrip ?? ""} onChange={(e) => set("consumptionPerTrip", e.target.value)} placeholder="1400, 70 L/h, 900 L/jour…" className={inputClass} />
          </div>
        </div>
      </fieldset>

      {/* Renouvellement */}
      <fieldset className="space-y-3">
        <legend className="font-heading text-sm font-semibold text-foreground mb-1">Renouvellement</legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Type de renouvellement</label>
            <input type="text" value={v.renewalType ?? ""} onChange={(e) => set("renewalType", e.target.value)} placeholder="Achat neuf, Refit, Rétrofit hybride…" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Année souhaitée</label>
            <input type="text" value={v.renewalYear ?? ""} onChange={(e) => set("renewalYear", e.target.value)} placeholder="2028, 2032-2034, entre 2026 et 2030…" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Propriétaire</label>
            <input type="text" value={v.owner ?? ""} onChange={(e) => set("owner", e.target.value)} placeholder="CD Gironde, Région Bretagne…" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Chantier</label>
            <input type="text" value={v.shipyard ?? ""} onChange={(e) => set("shipyard", e.target.value)} placeholder="Piriou, Socarenam…" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Pays du chantier</label>
            <input type="text" value={v.shipyardCountry ?? ""} onChange={(e) => set("shipyardCountry", e.target.value)} className={inputClass} />
          </div>
        </div>
      </fieldset>

      {/* Environnement */}
      <fieldset className="space-y-3">
        <legend className="font-heading text-sm font-semibold text-foreground mb-1">Environnement & transition</legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Tests combustibles alternatifs</label>
            <input type="text" value={v.altFuelTests ?? ""} onChange={(e) => set("altFuelTests", e.target.value)} placeholder="Effectués / Souhaités / Non envisagés" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Connexion à quai</label>
            <input type="text" value={v.shorePower ?? ""} onChange={(e) => set("shorePower", e.target.value)} placeholder="Effective / Souhaitée / Non envisagée" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Traitement de coque</label>
            <input type="text" value={v.hullTreatment ?? ""} onChange={(e) => set("hullTreatment", e.target.value)} placeholder="Peinture antifouling…" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Dispositifs de réduction d&apos;émissions</label>
            <input type="text" value={v.emissionReduction ?? ""} onChange={(e) => set("emissionReduction", e.target.value)} className={inputClass} />
          </div>
        </div>
      </fieldset>

      {/* Photo */}
      <fieldset className="space-y-3">
        <legend className="font-heading text-sm font-semibold text-foreground mb-1">Média</legend>
        <div>
          <label className={labelClass}>URL de photo</label>
          <input type="url" value={v.imageUrl ?? ""} onChange={(e) => set("imageUrl", e.target.value)} placeholder="https://…" className={inputClass} />
        </div>
      </fieldset>

      <div className="flex gap-3 pt-2 border-t border-[var(--gaspe-neutral-100)]">
        <Button type="submit">{submitLabel}</Button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg px-4 py-2.5 text-sm font-heading font-semibold text-foreground-muted hover:text-foreground transition-colors"
        >
          Annuler
        </button>
      </div>
    </form>
  );
}
