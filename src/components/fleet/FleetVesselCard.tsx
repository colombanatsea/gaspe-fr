"use client";

import type { FleetVessel } from "@/types";

type Props = {
  vessel: FleetVessel;
  onEdit?: () => void;
  onDelete?: () => void;
  readOnly?: boolean;
};

/** Fiche récapitulative d'un navire (utilisée dans les listings admin + adhérent). */
export function FleetVesselCard({ vessel: v, onEdit, onDelete, readOnly }: Props) {
  const age = v.yearBuilt ? new Date().getFullYear() - v.yearBuilt : undefined;

  return (
    <div className="rounded-2xl border border-[var(--gaspe-neutral-200)] bg-white p-4 hover:border-[var(--gaspe-teal-200)] transition-colors">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--gaspe-teal-50)]">
            <svg className="h-5 w-5 text-[var(--gaspe-teal-600)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 17h1l1-5h14l1 5h1M5 17l-2 4h18l-2-4M12 3v4m-4 0h8" />
            </svg>
          </div>
          <div className="min-w-0">
            <p className="font-heading text-sm font-semibold text-foreground truncate">{v.name}</p>
            {v.type && <p className="text-xs text-foreground-muted">{v.type}</p>}
            {v.operatingLine && <p className="text-xs text-foreground-muted mt-0.5">{v.operatingLine}</p>}
          </div>
        </div>
        {!readOnly && (onEdit || onDelete) && (
          <div className="flex gap-1 shrink-0">
            {onEdit && (
              <button
                onClick={onEdit}
                className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[var(--gaspe-teal-600)] hover:bg-[var(--gaspe-teal-50)] transition-colors"
              >
                Modifier
              </button>
            )}
            {onDelete && (
              <button
                onClick={onDelete}
                className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-foreground-muted hover:bg-red-50 hover:text-red-600 transition-colors"
              >
                Supprimer
              </button>
            )}
          </div>
        )}
      </div>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-foreground-muted">
        {v.imo && (
          <Row label="IMO"><span className="font-mono">{v.imo}</span></Row>
        )}
        {v.yearBuilt && (
          <Row label="Année">{v.yearBuilt}{age !== undefined ? ` · ${age} an${age > 1 ? "s" : ""}` : ""}</Row>
        )}
        {v.length !== undefined && (
          <Row label="Longueur">{v.length} m</Row>
        )}
        {v.beam !== undefined && (
          <Row label="Largeur">{v.beam} m</Row>
        )}
        {v.grossTonnage !== undefined && (
          <Row label="Jauge UMS">{v.grossTonnage}</Row>
        )}
        {v.passengerCapacity !== undefined && (
          <Row label="Passagers">{v.passengerCapacity}</Row>
        )}
        {v.vehicleCapacity !== undefined && v.vehicleCapacity > 0 && (
          <Row label="Véhicules">{v.vehicleCapacity}</Row>
        )}
        {v.freightCapacity !== undefined && v.freightCapacity > 0 && (
          <Row label="Fret">{v.freightCapacity} t</Row>
        )}
        {v.cruiseSpeed !== undefined && (
          <Row label="Vitesse">{v.cruiseSpeed} nds</Row>
        )}
        {v.crewSize && <Row label="Équipage">{v.crewSize}</Row>}
        {v.powerKw && <Row label="Puissance">{v.powerKw}</Row>}
        {v.fuelType && <Row label="Carburant">{v.fuelType}</Row>}
        {v.propulsionType && <Row label="Propulsion">{v.propulsionType}</Row>}
        {v.owner && <Row label="Propriétaire">{v.owner}</Row>}
        {v.shipyard && (
          <Row label="Chantier">{v.shipyard}{v.shipyardCountry ? ` (${v.shipyardCountry})` : ""}</Row>
        )}
        {v.renewalType && (
          <Row label="Renouvellement">{v.renewalType}{v.renewalYear ? ` · ${v.renewalYear}` : ""}</Row>
        )}
        {v.flag && <Row label="Pavillon">{v.flag}</Row>}
        {v.shorePower && <Row label="Quai électrifié">{v.shorePower}</Row>}
        {v.altFuelTests && <Row label="Tests carburants">{v.altFuelTests}</Row>}
        {v.hullTreatment && <Row label="Antifouling">{v.hullTreatment}</Row>}
        {v.emissionReduction && <Row label="Réduction émissions">{v.emissionReduction}</Row>}
        {v.consumptionPerTrip && <Row label="Consommation">{v.consumptionPerTrip}</Row>}
        {v.rotationsPerYear !== undefined && v.rotationsPerYear > 0 && (
          <Row label="Rotations 2024">{v.rotationsPerYear.toLocaleString("fr-FR")}</Row>
        )}
      </dl>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-2 min-w-0">
      <dt className="font-medium">{label}</dt>
      <dd className="text-right truncate text-foreground">{children}</dd>
    </div>
  );
}
