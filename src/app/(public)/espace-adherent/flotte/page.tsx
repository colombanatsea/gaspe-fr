"use client";

import { useState, useEffect, useCallback, startTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { getStoredMembers, type StoredMember } from "@/lib/members-store";
import {
  getFleet,
  addVessel,
  updateVessel,
  deleteVessel,
} from "@/lib/fleet-store";
import { FleetVesselForm } from "@/components/fleet/FleetVesselForm";
import { FleetVesselCard } from "@/components/fleet/FleetVesselCard";
import { FleetCsvImporter } from "@/components/fleet/FleetCsvImporter";
import { saveFleet } from "@/lib/fleet-store";
import type { FleetVessel } from "@/types";

/**
 * Espace adhérent – édition de la flotte de SA propre compagnie.
 * Le slug est résolu depuis `user.company` (nom affiché) en regardant dans
 * le store membres. En mode API, le Worker re-vérifie `organization_id` du
 * JWT avant d'accepter PUT/POST/DELETE.
 */
export default function AdherentFlottePage() {
  const { user } = useAuth();
  const router = useRouter();

  const [myMember, setMyMember] = useState<StoredMember | null>(null);
  const [vessels, setVessels] = useState<FleetVessel[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingVessel, setEditingVessel] = useState<FleetVessel | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const resolve = useCallback(async () => {
    if (!user || user.role !== "adherent") return;
    const all = await getStoredMembers();
    // Match par nom exact (`user.company`), insensible à la casse/accents.
    const target = user.company?.trim().toLowerCase();
    const found =
      all.find((m) => m.name.trim().toLowerCase() === target) ??
      all.find((m) => target && m.slug.includes(target.replace(/[^a-z0-9]+/g, "-"))) ??
      null;
    if (!found) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    setMyMember(found);
    const fleet = await getFleet(found.slug);
    setVessels(fleet);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!user || user.role !== "adherent") {
      router.push("/connexion");
      return;
    }
    startTransition(() => {
      void resolve();
    });
  }, [user, router, resolve]);

  if (!user || user.role !== "adherent") return null;

  async function handleAdd(vessel: FleetVessel) {
    if (!myMember) return;
    const next = await addVessel(myMember.slug, vessel);
    setVessels(next);
    setShowForm(false);
    setEditingVessel(null);
  }

  async function handleUpdate(vessel: FleetVessel) {
    if (!myMember || !editingVessel?.id) return;
    const next = await updateVessel(myMember.slug, editingVessel.id, vessel);
    setVessels(next);
    setShowForm(false);
    setEditingVessel(null);
  }

  async function handleDelete(id: string) {
    if (!myMember) return;
    if (!confirm("Supprimer ce navire ?")) return;
    const next = await deleteVessel(myMember.slug, id);
    setVessels(next);
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <Link href="/espace-adherent" className="text-sm text-primary hover:underline mb-1 inline-block">
          &larr; Retour à l&apos;espace adhérent
        </Link>
        <h1 className="font-heading text-2xl font-bold text-foreground">Ma flotte</h1>
        {myMember && (
          <p className="mt-1 text-sm text-foreground-muted">
            {myMember.name} – {vessels.length} navire{vessels.length !== 1 ? "s" : ""} enregistré
            {vessels.length !== 1 ? "s" : ""}. Ces données s&apos;affichent sur votre fiche
            publique <Link href={`/nos-adherents/${myMember.slug}`} className="text-primary hover:underline">/nos-adherents/{myMember.slug}</Link>.
          </p>
        )}
      </div>

      {loading ? (
        <Card>
          <p className="py-8 text-center text-sm text-foreground-muted">Chargement…</p>
        </Card>
      ) : notFound ? (
        <Card>
          <CardTitle>Compagnie introuvable</CardTitle>
          <p className="mt-3 text-sm text-foreground-muted">
            Nous n&apos;avons pas pu associer votre compte à une compagnie adhérente.
            Contactez l&apos;équipe GASPE pour lier votre compte à votre organisation.
          </p>
        </Card>
      ) : myMember ? (
        <>
          <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
            <p className="text-sm text-foreground-muted">
              Seuls les responsables et contacts de votre compagnie peuvent modifier ces données.
            </p>
            <Button
              onClick={() => {
                setEditingVessel(null);
                setShowForm(true);
              }}
            >
              + Ajouter un navire
            </Button>
          </div>

          {!showForm && (
            <div className="mb-4">
              <FleetCsvImporter
                existingCount={vessels.length}
                onImport={async (newVessels) => {
                  if (!myMember) return;
                  await saveFleet(myMember.slug, newVessels);
                  setVessels(newVessels);
                }}
              />
            </div>
          )}

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

          {vessels.length === 0 && !showForm ? (
            <Card>
              <div className="py-12 text-center">
                <p className="text-sm text-foreground-muted">Aucun navire enregistré.</p>
                <p className="text-xs text-foreground-muted mt-1">
                  Ajoutez vos navires pour enrichir votre fiche publique et nos statistiques flotte.
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
      ) : null}
    </div>
  );
}
