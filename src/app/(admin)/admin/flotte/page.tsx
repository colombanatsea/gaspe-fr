"use client";

import { useState, useEffect, useCallback, startTransition } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardTitle } from "@/components/ui/Card";
import { getStoredMembers, type StoredMember } from "@/lib/members-store";
import {
  getFleet,
  addVessel,
  updateVessel,
  deleteVessel,
  resetFleetToSeed,
  saveFleet,
} from "@/lib/fleet-store";
import { FLEET_SEED } from "@/data/fleet-seed";
import { FleetVesselForm } from "@/components/fleet/FleetVesselForm";
import { FleetVesselCard } from "@/components/fleet/FleetVesselCard";
import { FleetCsvImporter } from "@/components/fleet/FleetCsvImporter";
import type { FleetVessel } from "@/types";
import { isStaffOrAdmin } from "@/lib/auth/permissions";

/**
 * Admin – Gestion de la flotte de TOUS les adhérents.
 * Sélecteur d'organisation à gauche, listing + éditeur à droite.
 * Peut réinitialiser une compagnie à la donnée seed éditoriale.
 */
export default function AdminFlottePage() {
  const { user } = useAuth();
  const router = useRouter();

  const [members, setMembers] = useState<StoredMember[]>([]);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [vessels, setVessels] = useState<FleetVessel[]>([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingVessel, setEditingVessel] = useState<FleetVessel | null>(null);
  const [loadingFleet, setLoadingFleet] = useState(false);

  const refreshMembers = useCallback(async () => {
    const all = await getStoredMembers();
    // On ne gère la flotte que pour les compagnies (pas les experts).
    const compagnies = all.filter((m) => !m.archived && m.memberType !== "expert");
    setMembers(compagnies);
  }, []);

  useEffect(() => {
    if (!user || !isStaffOrAdmin(user)) {
      router.push("/connexion");
      return;
    }
    startTransition(() => {
      void refreshMembers();
    });
  }, [user, router, refreshMembers]);

  const refreshFleet = useCallback(async (slug: string) => {
    setLoadingFleet(true);
    try {
      const list = await getFleet(slug);
      setVessels(list);
    } finally {
      setLoadingFleet(false);
    }
  }, []);

  useEffect(() => {
    if (selectedSlug) void refreshFleet(selectedSlug);
    else setVessels([]);
  }, [selectedSlug, refreshFleet]);

  if (!user || !isStaffOrAdmin(user)) return null;

  const filteredMembers = members.filter((m) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return m.name.toLowerCase().includes(s) || (m.city ?? "").toLowerCase().includes(s);
  });

  async function handleAdd(vessel: FleetVessel) {
    if (!selectedSlug) return;
    const next = await addVessel(selectedSlug, vessel);
    setVessels(next);
    setShowForm(false);
    setEditingVessel(null);
  }

  async function handleUpdate(vessel: FleetVessel) {
    if (!selectedSlug || !editingVessel?.id) return;
    const next = await updateVessel(selectedSlug, editingVessel.id, vessel);
    setVessels(next);
    setShowForm(false);
    setEditingVessel(null);
  }

  async function handleDelete(id: string) {
    if (!selectedSlug) return;
    if (!confirm("Supprimer ce navire ?")) return;
    const next = await deleteVessel(selectedSlug, id);
    setVessels(next);
  }

  async function handleReset() {
    if (!selectedSlug) return;
    if (!confirm("Réinitialiser la flotte à la donnée éditoriale (seed) ? Les modifications locales seront écrasées.")) return;
    const next = await resetFleetToSeed(selectedSlug);
    setVessels(next);
  }

  const selectedMember = selectedSlug ? members.find((m) => m.slug === selectedSlug) : null;
  const hasSeed = selectedSlug ? (FLEET_SEED[selectedSlug]?.length ?? 0) > 0 : false;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-foreground">Flotte des adhérents</h1>
        <p className="mt-1 text-sm text-foreground-muted">
          Admin – consulte et édite la flotte détaillée de toutes les compagnies adhérentes.
          Les adhérents connectés ne voient et éditent que leur propre flotte.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        {/* Liste des compagnies */}
        <aside>
          <Card>
            <CardTitle>Compagnies ({members.length})</CardTitle>
            <input
              type="search"
              placeholder="Rechercher…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="mt-3 w-full rounded-xl border border-[var(--gaspe-neutral-200)] bg-white px-3 py-2 text-sm focus:border-[var(--gaspe-teal-400)] focus:ring-1 focus:ring-[var(--gaspe-teal-400)] focus:outline-none"
            />
            <ul className="mt-3 space-y-1 max-h-[70vh] overflow-y-auto">
              {filteredMembers.map((m) => {
                const seedCount = FLEET_SEED[m.slug]?.length ?? 0;
                const isActive = m.slug === selectedSlug;
                return (
                  <li key={m.slug}>
                    <button
                      onClick={() => {
                        setSelectedSlug(m.slug);
                        setShowForm(false);
                        setEditingVessel(null);
                      }}
                      className={`w-full flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                        isActive
                          ? "bg-[var(--gaspe-teal-50)] text-[var(--gaspe-teal-700)] font-semibold"
                          : "hover:bg-[var(--gaspe-neutral-100)] text-foreground"
                      }`}
                    >
                      <span className="truncate">{m.name}</span>
                      {seedCount > 0 && (
                        <Badge variant={isActive ? "teal" : "neutral"}>{seedCount}</Badge>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </Card>
        </aside>

        {/* Panneau d'édition */}
        <section>
          {!selectedMember ? (
            <Card>
              <div className="py-16 text-center">
                <p className="text-foreground-muted">Sélectionnez une compagnie pour consulter ou éditer sa flotte.</p>
              </div>
            </Card>
          ) : (
            <>
              <div className="flex items-start justify-between mb-4 gap-3 flex-wrap">
                <div>
                  <h2 className="font-heading text-xl font-bold text-foreground">{selectedMember.name}</h2>
                  <p className="text-sm text-foreground-muted">
                    {vessels.length} navire{vessels.length !== 1 ? "s" : ""}
                    {hasSeed && ` · ${FLEET_SEED[selectedSlug!].length} dans le seed éditorial`}
                  </p>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    onClick={() => {
                      setEditingVessel(null);
                      setShowForm(true);
                    }}
                  >
                    + Ajouter un navire
                  </Button>
                  {hasSeed && (
                    <button
                      onClick={handleReset}
                      className="rounded-xl border border-[var(--gaspe-neutral-200)] px-4 py-2.5 text-sm font-heading font-semibold text-foreground-muted hover:bg-[var(--gaspe-neutral-100)] transition-colors"
                    >
                      Réinitialiser au seed
                    </button>
                  )}
                </div>
              </div>

              {showForm && (
                <div className="mb-4">
                  <FleetVesselForm
                    initial={editingVessel ?? undefined}
                    submitLabel={editingVessel ? "Mettre à jour" : "Ajouter"}
                    onSubmit={editingVessel ? handleUpdate : handleAdd}
                    onCancel={() => {
                      setShowForm(false);
                      setEditingVessel(null);
                    }}
                  />
                </div>
              )}

              {!showForm && selectedMember && (
                <div className="mb-4">
                  <FleetCsvImporter
                    existingCount={vessels.length}
                    onImport={async (newVessels) => {
                      await saveFleet(selectedMember.slug, newVessels);
                      setVessels(newVessels);
                    }}
                  />
                </div>
              )}

              {loadingFleet ? (
                <Card>
                  <p className="py-8 text-center text-sm text-foreground-muted">Chargement…</p>
                </Card>
              ) : vessels.length === 0 && !showForm ? (
                <Card>
                  <div className="py-12 text-center">
                    <p className="text-sm text-foreground-muted">Aucun navire enregistré pour cette compagnie.</p>
                    <p className="text-xs text-foreground-muted mt-1">
                      {hasSeed
                        ? "Cliquez sur “Réinitialiser au seed” pour importer la donnée éditoriale."
                        : "Ajoutez le premier navire via le bouton ci-dessus."}
                    </p>
                  </div>
                </Card>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {vessels.map((v) => (
                    <FleetVesselCard
                      key={v.id ?? v.name}
                      vessel={v}
                      onEdit={() => {
                        setEditingVessel(v);
                        setShowForm(true);
                      }}
                      onDelete={() => v.id && void handleDelete(v.id)}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
