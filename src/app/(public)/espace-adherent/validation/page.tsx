"use client";

import { useEffect, useMemo, useState, startTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { Card, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { FleetVesselForm } from "@/components/fleet/FleetVesselForm";
import { listCampaigns, listValidationsForOrg, submitValidations } from "@/lib/validation-store";
import { getFleet } from "@/lib/fleet-store";
import { isApiMode } from "@/lib/api-client";
import { members } from "@/data/members";
import type { FleetVessel } from "@/types";
import type {
  ValidationCampaign,
  ValidationHistoryEntry,
  ValidationSubmitItem,
} from "@/types/validation";

interface ProfileData {
  email?: string;
  phone?: string;
  address?: string;
  websiteUrl?: string;
  description?: string;
  employeeCount?: number;
  shipCount?: number;
}

type ItemMode = "pending" | "unchanged" | "edited";

interface ItemState {
  mode: ItemMode;
  data?: Record<string, unknown>;
}

export default function ValidationPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [campaign, setCampaign] = useState<ValidationCampaign | null>(null);
  const [history, setHistory] = useState<ValidationHistoryEntry[]>([]);
  const [fleet, setFleet] = useState<FleetVessel[]>([]);
  const [profileState, setProfileState] = useState<ItemState>({ mode: "pending" });
  const [vesselStates, setVesselStates] = useState<Record<string, ItemState>>({});
  const [editingProfile, setEditingProfile] = useState(false);
  const [editingVesselId, setEditingVesselId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);

  // Auth gate
  useEffect(() => {
    if (!user || user.role !== "adherent") router.push("/connexion");
  }, [user, router]);

  // Resoudre le slug de la compagnie
  const member = useMemo(
    () => (user?.company ? members.find((m) => m.name === user.company) : undefined),
    [user?.company],
  );

  // Fetch campagne courante + historique + flotte
  useEffect(() => {
    if (!user || !member) return;
    let cancelled = false;
    void (async () => {
      try {
        const [{ current }, { history }, vessels] = await Promise.all([
          listCampaigns(),
          listValidationsForOrg(member.slug),
          getFleet(member.slug).catch(() => [] as FleetVessel[]),
        ]);
        if (cancelled) return;
        startTransition(() => {
          setCampaign(current);
          setHistory(history);
          setFleet(vessels);
          setLoading(false);
        });
      } catch {
        if (!cancelled) {
          startTransition(() => setLoading(false));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, member]);

  if (!user || user.role !== "adherent") return null;

  const targetYear = campaign?.targetYear ?? new Date().getUTCFullYear();

  // Calcule l'etat deja-valide pour cette annee a partir de l'historique
  const profileAlreadyValidated = history.some(
    (h) => h.itemType === "profile" && h.targetYear >= targetYear,
  );
  const validatedVesselIds = new Set(
    history
      .filter((h) => h.itemType === "vessel" && h.targetYear >= targetYear)
      .map((h) => h.itemId)
      .filter(Boolean),
  );

  function setProfileMode(mode: ItemMode) {
    setProfileState({ mode, data: undefined });
    setEditingProfile(mode === "edited");
  }

  function handleProfileEditDone(data: ProfileData) {
    setProfileState({ mode: "edited", data: data as unknown as Record<string, unknown> });
    setEditingProfile(false);
  }

  function setVesselMode(vesselId: string, mode: ItemMode) {
    setVesselStates((prev) => ({ ...prev, [vesselId]: { mode, data: undefined } }));
    setEditingVesselId(mode === "edited" ? vesselId : null);
  }

  function handleVesselEditDone(vesselId: string, vessel: FleetVessel) {
    setVesselStates((prev) => ({
      ...prev,
      [vesselId]: { mode: "edited", data: vessel as unknown as Record<string, unknown> },
    }));
    setEditingVesselId(null);
  }

  /** Marque tous les items "pending" comme "unchanged" en un clic. */
  function markAllUnchanged() {
    if (!profileAlreadyValidated && profileState.mode === "pending") {
      setProfileState({ mode: "unchanged" });
    }
    setVesselStates((prev) => {
      const next = { ...prev };
      for (const v of fleet) {
        if (!v.id) continue;
        if (validatedVesselIds.has(v.id)) continue;
        if (!next[v.id] || next[v.id].mode === "pending") {
          next[v.id] = { mode: "unchanged" };
        }
      }
      return next;
    });
  }

  async function handleSubmit() {
    if (!member) return;
    const items: ValidationSubmitItem[] = [];

    if (!profileAlreadyValidated && profileState.mode !== "pending") {
      items.push({
        type: "profile",
        unchanged: profileState.mode === "unchanged",
        data: profileState.mode === "edited" ? profileState.data : undefined,
      });
    }
    for (const v of fleet) {
      if (!v.id) continue;
      if (validatedVesselIds.has(v.id)) continue;
      const st = vesselStates[v.id];
      if (!st || st.mode === "pending") continue;
      items.push({
        type: "vessel",
        id: v.id,
        unchanged: st.mode === "unchanged",
        data: st.mode === "edited" ? st.data : undefined,
      });
    }

    if (items.length === 0) {
      setSubmitMessage("Aucun item selectionne. Cochez « Inchange » ou modifiez au moins un item.");
      return;
    }

    setSubmitting(true);
    setSubmitMessage(null);
    try {
      const result = await submitValidations(member.slug, items);
      if (result.success) {
        setSubmitMessage(
          `${result.validated} item${result.validated > 1 ? "s" : ""} valide${result.validated > 1 ? "s" : ""} pour ${result.targetYear}.`,
        );
        // Refresh historique pour reflecter les nouveaux validates
        const { history } = await listValidationsForOrg(member.slug);
        startTransition(() => setHistory(history));
        // Reset l'etat local
        setProfileState({ mode: "pending" });
        setVesselStates({});
      } else {
        setSubmitMessage("Une erreur est survenue lors de l'envoi.");
      }
    } catch {
      setSubmitMessage("Erreur reseau. Reessayez dans un instant.");
    } finally {
      setSubmitting(false);
    }
  }

  // Compteurs
  const pendingProfile = !profileAlreadyValidated;
  const pendingVessels = fleet.filter((v) => v.id && !validatedVesselIds.has(v.id));
  const totalPending = (pendingProfile ? 1 : 0) + pendingVessels.length;
  const queuedCount =
    (profileState.mode !== "pending" && pendingProfile ? 1 : 0) +
    pendingVessels.filter((v) => v.id && vesselStates[v.id]?.mode && vesselStates[v.id].mode !== "pending").length;

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <p className="text-sm text-foreground-muted">Chargement...</p>
      </div>
    );
  }

  if (!isApiMode()) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="font-heading text-2xl font-bold text-foreground mb-2">
          Validation annuelle
        </h1>
        <Card>
          <p className="py-4 text-sm text-foreground-muted">
            La validation annuelle necessite une connexion a la base de donnees ACF.
            Cette page est disponible en production. En mode demo, consultez la tab
            « Validation annuelle » de la page{" "}
            <Link href="/decouvrir-espace-adherent" className="text-primary hover:underline">
              Decouvrir l&apos;espace adherent
            </Link>
            .
          </p>
        </Card>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="font-heading text-2xl font-bold text-foreground mb-2">
          Validation annuelle
        </h1>
        <Card>
          <p className="py-4 text-sm text-foreground-muted">
            Votre compagnie n&apos;est pas reconnue. Contactez l&apos;administrateur ACF.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <Link href="/espace-adherent" className="text-sm text-foreground-muted hover:text-primary">
          ← Retour au tableau de bord
        </Link>
        <h1 className="mt-2 font-heading text-2xl font-bold text-foreground">
          Validation annuelle {targetYear}
        </h1>
        <p className="mt-1 text-sm text-foreground-muted">
          {campaign && campaign.status === "open" ? (
            <>Campagne en cours{campaign.targetDate && ` – deadline ${new Date(campaign.targetDate).toLocaleDateString("fr-FR")}`}.</>
          ) : (
            <>Aucune campagne en cours. Vous pouvez valider hors campagne, vos donnees seront tracees pour {targetYear}.</>
          )}{" "}
          Confirmez chaque item « Inchange » ou modifiez-le, puis envoyez le tout en un seul clic.
        </p>
      </div>

      {/* Bandeau progression */}
      <div className="mb-6 rounded-xl bg-[var(--gaspe-teal-50)] border border-[var(--gaspe-teal-200)] p-4">
        <p className="text-sm text-foreground">
          <span className="font-semibold">{totalPending - queuedCount}</span> item
          {totalPending - queuedCount !== 1 ? "s" : ""} a traiter ·{" "}
          <span className="font-semibold text-[var(--gaspe-teal-700)]">{queuedCount}</span> en attente d&apos;envoi
          {totalPending === 0 && " · tout est deja valide pour cette annee"}
        </p>
        {totalPending > 0 && (
          <button
            type="button"
            onClick={markAllUnchanged}
            className="mt-2 text-xs font-semibold text-[var(--gaspe-teal-700)] hover:text-[var(--gaspe-teal-600)] underline underline-offset-2"
          >
            Tout marquer « Inchange depuis l&apos;an dernier »
          </button>
        )}
      </div>

      {/* Carte profil organisation */}
      <section className="mb-6">
        <h2 className="font-heading text-lg font-semibold text-foreground mb-3">
          Profil de la compagnie
        </h2>
        <Card>
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="min-w-0 flex-1">
              <CardTitle className="text-base">{member.name}</CardTitle>
              <div className="mt-1 flex flex-wrap gap-2">
                {profileAlreadyValidated && <Badge variant="green">Deja valide pour {targetYear}</Badge>}
                {profileState.mode === "unchanged" && <Badge variant="teal">Inchange</Badge>}
                {profileState.mode === "edited" && <Badge variant="warm">Modifie</Badge>}
              </div>
              <ul className="mt-3 space-y-1 text-sm text-foreground-muted">
                <li>Email : {user.companyEmail ?? "non renseigne"}</li>
                <li>Telephone : {user.companyPhone ?? "non renseigne"}</li>
                <li>Adresse : {user.companyAddress ?? "non renseignee"}</li>
                <li>
                  Effectifs : {member.employeeCount ?? "?"} - Navires : {member.shipCount ?? "?"}
                </li>
              </ul>
            </div>
            {!profileAlreadyValidated && (
              <div className="flex gap-2 shrink-0">
                <Button
                  variant={profileState.mode === "unchanged" ? "primary" : "secondary"}
                  className="!px-3 !py-2 !text-xs"
                  onClick={() => setProfileMode(profileState.mode === "unchanged" ? "pending" : "unchanged")}
                >
                  {profileState.mode === "unchanged" ? "✓ Inchange" : "Inchange"}
                </Button>
                <Button
                  variant={profileState.mode === "edited" ? "primary" : "secondary"}
                  className="!px-3 !py-2 !text-xs"
                  onClick={() => setProfileMode("edited")}
                >
                  Modifier
                </Button>
              </div>
            )}
          </div>
          {editingProfile && (
            <ProfileEditForm
              initial={{
                email: user.companyEmail,
                phone: user.companyPhone,
                address: user.companyAddress,
                websiteUrl: member.websiteUrl,
                description: member.description,
                employeeCount: member.employeeCount,
                shipCount: member.shipCount,
              }}
              onSubmit={handleProfileEditDone}
              onCancel={() => {
                setEditingProfile(false);
                setProfileState({ mode: "pending" });
              }}
            />
          )}
        </Card>
      </section>

      {/* Cartes navires */}
      <section className="mb-6">
        <h2 className="font-heading text-lg font-semibold text-foreground mb-3">
          Flotte ({fleet.length} navire{fleet.length !== 1 ? "s" : ""})
        </h2>
        {fleet.length === 0 ? (
          <Card>
            <p className="py-4 text-sm text-foreground-muted">
              Aucun navire enregistre dans votre flotte.{" "}
              <Link href="/espace-adherent/flotte" className="text-primary hover:underline">
                Ajouter des navires
              </Link>
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {fleet.map((v) => {
              if (!v.id) return null;
              const alreadyValidated = validatedVesselIds.has(v.id);
              const st = vesselStates[v.id]?.mode ?? "pending";
              const isEditingThis = editingVesselId === v.id;
              return (
                <Card key={v.id}>
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-base">{v.name}</CardTitle>
                      <div className="mt-1 flex flex-wrap gap-2">
                        {alreadyValidated && <Badge variant="green">Deja valide pour {targetYear}</Badge>}
                        {st === "unchanged" && <Badge variant="teal">Inchange</Badge>}
                        {st === "edited" && <Badge variant="warm">Modifie</Badge>}
                        {v.imo && <Badge variant="neutral">IMO {v.imo}</Badge>}
                        {v.type && <Badge variant="neutral">{v.type}</Badge>}
                      </div>
                      <p className="mt-2 text-xs text-foreground-muted">
                        {v.yearBuilt && `Construit ${v.yearBuilt} · `}
                        {v.passengerCapacity && `${v.passengerCapacity} pax · `}
                        {v.vehicleCapacity && `${v.vehicleCapacity} veh · `}
                        {v.flag && `Pavillon ${v.flag}`}
                      </p>
                    </div>
                    {!alreadyValidated && !isEditingThis && (
                      <div className="flex gap-2 shrink-0">
                        <Button
                          variant={st === "unchanged" ? "primary" : "secondary"}
                          className="!px-3 !py-2 !text-xs"
                          onClick={() => setVesselMode(v.id!, st === "unchanged" ? "pending" : "unchanged")}
                        >
                          {st === "unchanged" ? "✓ Inchange" : "Inchange"}
                        </Button>
                        <Button
                          variant={st === "edited" ? "primary" : "secondary"}
                          className="!px-3 !py-2 !text-xs"
                          onClick={() => setVesselMode(v.id!, "edited")}
                        >
                          Modifier
                        </Button>
                      </div>
                    )}
                  </div>
                  {isEditingThis && (
                    <div className="mt-4 border-t border-[var(--gaspe-neutral-200)] pt-4">
                      <FleetVesselForm
                        initial={v}
                        onSubmit={(updated) => handleVesselEditDone(v.id!, updated)}
                        onCancel={() => setVesselMode(v.id!, "pending")}
                        submitLabel="Valider la modification"
                      />
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* Submit */}
      <div className="sticky bottom-4 z-10">
        <Card className="!p-4 shadow-lg">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="text-sm text-foreground-muted">
              {queuedCount > 0 ? (
                <>
                  <span className="font-semibold text-foreground">{queuedCount}</span> item
                  {queuedCount > 1 ? "s" : ""} pret{queuedCount > 1 ? "s" : ""} a envoyer
                </>
              ) : (
                <>Cochez « Inchange » ou modifiez au moins un item</>
              )}
            </div>
            <Button
              variant="primary"
              onClick={handleSubmit}
              disabled={queuedCount === 0 || submitting}
            >
              {submitting ? "Envoi..." : `Valider ${queuedCount} item${queuedCount > 1 ? "s" : ""}`}
            </Button>
          </div>
          {submitMessage && (
            <p className="mt-3 text-sm text-foreground" role="status">
              {submitMessage}
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}

interface ProfileEditFormProps {
  initial: ProfileData;
  onSubmit: (data: ProfileData) => void;
  onCancel: () => void;
}

function ProfileEditForm({ initial, onSubmit, onCancel }: ProfileEditFormProps) {
  const [data, setData] = useState<ProfileData>(initial);
  const inputClass =
    "w-full rounded-xl border border-[var(--gaspe-neutral-200)] bg-white px-3.5 py-2.5 text-sm text-foreground focus:border-[var(--gaspe-teal-400)] focus:ring-1 focus:ring-[var(--gaspe-teal-400)] focus:outline-none";
  const labelClass = "block text-xs font-medium text-foreground-muted mb-1";

  return (
    <form
      className="mt-4 border-t border-[var(--gaspe-neutral-200)] pt-4 grid grid-cols-1 sm:grid-cols-2 gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(data);
      }}
    >
      <div>
        <label className={labelClass} htmlFor="profile-email">Email</label>
        <input
          id="profile-email"
          type="email"
          autoComplete="email"
          className={inputClass}
          value={data.email ?? ""}
          onChange={(e) => setData({ ...data, email: e.target.value })}
        />
      </div>
      <div>
        <label className={labelClass} htmlFor="profile-phone">Telephone</label>
        <input
          id="profile-phone"
          type="tel"
          autoComplete="tel"
          className={inputClass}
          value={data.phone ?? ""}
          onChange={(e) => setData({ ...data, phone: e.target.value })}
        />
      </div>
      <div className="sm:col-span-2">
        <label className={labelClass} htmlFor="profile-address">Adresse</label>
        <input
          id="profile-address"
          type="text"
          autoComplete="street-address"
          className={inputClass}
          value={data.address ?? ""}
          onChange={(e) => setData({ ...data, address: e.target.value })}
        />
      </div>
      <div className="sm:col-span-2">
        <label className={labelClass} htmlFor="profile-website">Site web</label>
        <input
          id="profile-website"
          type="url"
          autoComplete="url"
          className={inputClass}
          value={data.websiteUrl ?? ""}
          onChange={(e) => setData({ ...data, websiteUrl: e.target.value })}
        />
      </div>
      <div>
        <label className={labelClass} htmlFor="profile-employees">Effectifs</label>
        <input
          id="profile-employees"
          type="number"
          min={0}
          className={inputClass}
          value={data.employeeCount ?? ""}
          onChange={(e) =>
            setData({
              ...data,
              employeeCount: e.target.value ? Number(e.target.value) : undefined,
            })
          }
        />
      </div>
      <div>
        <label className={labelClass} htmlFor="profile-ships">Nombre de navires</label>
        <input
          id="profile-ships"
          type="number"
          min={0}
          className={inputClass}
          value={data.shipCount ?? ""}
          onChange={(e) =>
            setData({
              ...data,
              shipCount: e.target.value ? Number(e.target.value) : undefined,
            })
          }
        />
      </div>
      <div className="sm:col-span-2">
        <label className={labelClass} htmlFor="profile-description">Description publique</label>
        <textarea
          id="profile-description"
          className={inputClass}
          rows={3}
          value={data.description ?? ""}
          onChange={(e) => setData({ ...data, description: e.target.value })}
        />
      </div>
      <div className="sm:col-span-2 flex items-center justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit" variant="primary">
          Valider la modification
        </Button>
      </div>
    </form>
  );
}
