"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth, COMPANY_ROLES, type CompanyRole, type Vessel } from "@/lib/auth/AuthContext";
import { Card, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export default function AdherentProfilPage() {
  const { user, updateUser } = useAuth();
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [tab, setTab] = useState<"info" | "vessels">("info");

  // Form state
  const [companyRole, setCompanyRole] = useState<CompanyRole | "">(user?.companyRole ?? "");
  const [companyDescription, setCompanyDescription] = useState(user?.companyDescription ?? "");
  const [companyLogo, setCompanyLogo] = useState(user?.companyLogo ?? "");
  const [companyAddress, setCompanyAddress] = useState(user?.companyAddress ?? "");
  const [companyEmail, setCompanyEmail] = useState(user?.companyEmail ?? "");
  const [companyPhone, setCompanyPhone] = useState(user?.companyPhone ?? "");
  const [companyLinkedinUrl, setCompanyLinkedinUrl] = useState(user?.companyLinkedinUrl ?? "");

  // Vessels state
  const [vessels, setVessels] = useState<Vessel[]>(user?.vessels ?? []);
  const [vesselForm, setVesselForm] = useState({ name: "", imo: "", ums: "", size: "" });
  const [editingVesselId, setEditingVesselId] = useState<string | null>(null);
  const [showVesselForm, setShowVesselForm] = useState(false);

  useEffect(() => {
    if (!user || user.role !== "adherent") {
      router.push("/connexion");
    }
  }, [user, router]);

  const [prevUserId, setPrevUserId] = useState(user?.id);
  if (prevUserId !== user?.id && user) {
    setPrevUserId(user.id);
    setCompanyRole(user.companyRole ?? "");
    setCompanyDescription(user.companyDescription ?? "");
    setCompanyLogo(user.companyLogo ?? "");
    setCompanyAddress(user.companyAddress ?? "");
    setCompanyEmail(user.companyEmail ?? "");
    setCompanyPhone(user.companyPhone ?? "");
    setCompanyLinkedinUrl(user.companyLinkedinUrl ?? "");
    setVessels(user.vessels ?? []);
  }

  if (!user || user.role !== "adherent") return null;

  // Profile completion (weighted)
  const weights = [
    { filled: !!user.name, weight: 10 },
    { filled: !!user.email, weight: 10 },
    { filled: !!user.phone, weight: 5 },
    { filled: !!user.company, weight: 10 },
    { filled: !!user.companyRole, weight: 15 },
    { filled: !!user.companyDescription, weight: 15 },
    { filled: !!user.companyEmail, weight: 5 },
    { filled: !!user.companyPhone, weight: 5 },
    { filled: !!user.companyAddress, weight: 10 },
    { filled: !!user.companyLogo, weight: 5 },
    { filled: (user.vessels ?? []).length > 0, weight: 10 },
  ];
  const totalWeight = weights.reduce((s, w) => s + w.weight, 0);
  const filledWeight = weights.reduce((s, w) => s + (w.filled ? w.weight : 0), 0);
  const completion = Math.round((filledWeight / totalWeight) * 100);

  function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 500_000) {
      alert("L'image ne doit pas dépasser 500 Ko.");
      return;
    }
    // Validate file type (reject SVG for XSS prevention)
    const allowed = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowed.includes(file.type)) {
      alert("Format accepté : JPG, PNG, GIF, WebP uniquement.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setCompanyLogo(reader.result as string);
    reader.readAsDataURL(file);
  }

  function handleSave() {
    if (!user) return;
    updateUser({
      ...user,
      companyRole: companyRole || undefined,
      companyDescription: companyDescription || undefined,
      companyLogo: companyLogo || undefined,
      companyAddress: companyAddress || undefined,
      companyEmail: companyEmail || undefined,
      companyPhone: companyPhone || undefined,
      companyLinkedinUrl: companyLinkedinUrl || undefined,
      vessels,
    });
    setEditing(false);
  }

  function handleVesselSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!vesselForm.name.trim()) return;

    if (editingVesselId) {
      setVessels((prev) =>
        prev.map((v) =>
          v.id === editingVesselId
            ? { ...v, name: vesselForm.name, imo: vesselForm.imo, ums: vesselForm.ums, size: vesselForm.size }
            : v
        )
      );
    } else {
      setVessels((prev) => [
        ...prev,
        { id: `vessel-${Date.now()}`, name: vesselForm.name, imo: vesselForm.imo, ums: vesselForm.ums, size: vesselForm.size },
      ]);
    }
    setVesselForm({ name: "", imo: "", ums: "", size: "" });
    setEditingVesselId(null);
    setShowVesselForm(false);
  }

  function deleteVessel(id: string) {
    setVessels((prev) => prev.filter((v) => v.id !== id));
  }

  function startEditVessel(v: Vessel) {
    setVesselForm({ name: v.name, imo: v.imo ?? "", ums: v.ums ?? "", size: v.size ?? "" });
    setEditingVesselId(v.id);
    setShowVesselForm(true);
  }

  const inputClass =
    "w-full rounded-xl border border-[var(--gaspe-neutral-200)] bg-white px-3.5 py-2.5 text-sm text-foreground focus:border-[var(--gaspe-teal-400)] focus:ring-1 focus:ring-[var(--gaspe-teal-400)] focus:outline-none";

  const roleLabel = COMPANY_ROLES.find((r) => r.value === user.companyRole)?.label;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <Link href="/espace-adherent" className="text-sm text-primary hover:underline mb-1 inline-block">
          &larr; Retour à l&apos;espace adhérent
        </Link>
        <h1 className="font-heading text-2xl font-bold text-foreground">Profil entreprise</h1>
      </div>

      {/* Completion bar */}
      <div className="mb-8 rounded-2xl bg-white border border-[var(--gaspe-neutral-200)] p-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-foreground">Complétion du profil</span>
          <span className="text-sm font-bold text-primary">{completion}%</span>
        </div>
        <div className="h-2 rounded-full bg-[var(--gaspe-neutral-100)] overflow-hidden">
          <div
            className="h-full rounded-full bg-[var(--gaspe-teal-600)] transition-all"
            style={{ width: `${completion}%` }}
          />
        </div>
        {completion < 100 && (
          <p className="mt-2 text-xs text-foreground-muted">
            Complétez votre profil pour apparaître dans l&apos;annuaire des pairs.
          </p>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-[var(--gaspe-neutral-200)]">
        {([
          { id: "info" as const, label: "Informations" },
          { id: "vessels" as const, label: `Navires (${vessels.length})` },
        ]).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 text-sm font-semibold transition-colors border-b-2 -mb-px ${
              tab === t.id
                ? "border-[var(--gaspe-teal-600)] text-[var(--gaspe-teal-600)]"
                : "border-transparent text-foreground-muted hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "info" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main info */}
          <div className="lg:col-span-2 space-y-6">
            {editing ? (
              <Card>
                <CardTitle className="mb-4">Modifier le profil</CardTitle>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Rôle dans la compagnie <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={companyRole}
                      onChange={(e) => setCompanyRole(e.target.value as CompanyRole)}
                      className={inputClass}
                    >
                      <option value="">Sélectionner votre rôle...</option>
                      {COMPANY_ROLES.map((r) => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Description de l&apos;entreprise</label>
                    <textarea
                      value={companyDescription}
                      onChange={(e) => setCompanyDescription(e.target.value)}
                      rows={4}
                      placeholder="Décrivez votre compagnie maritime..."
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Logo entreprise</label>
                    <div className="flex items-center gap-4">
                      {companyLogo && (
                        <Image
                          src={companyLogo}
                          alt="Logo entreprise"
                          width={64}
                          height={64}
                          unoptimized
                          loading="lazy"
                          className="h-16 w-16 rounded-lg object-contain border border-[var(--gaspe-neutral-200)]"
                        />
                      )}
                      <div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          aria-label="Charger le logo de l'entreprise"
                          className="text-sm text-foreground-muted file:mr-3 file:rounded-lg file:border-0 file:bg-[var(--gaspe-teal-50)] file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-[var(--gaspe-teal-600)] hover:file:bg-[var(--gaspe-teal-100)]"
                        />
                        <p className="text-xs text-foreground-muted mt-1">Max 500 Ko, JPG/PNG</p>
                      </div>
                      {companyLogo && (
                        <button
                          type="button"
                          onClick={() => setCompanyLogo("")}
                          className="text-xs text-red-500 hover:underline"
                        >
                          Supprimer
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Email entreprise</label>
                      <input
                        type="email"
                        value={companyEmail}
                        onChange={(e) => setCompanyEmail(e.target.value)}
                        placeholder="contact@compagnie.fr"
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Téléphone entreprise</label>
                      <input
                        type="tel"
                        value={companyPhone}
                        onChange={(e) => setCompanyPhone(e.target.value)}
                        placeholder="01 23 45 67 89"
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Page LinkedIn entreprise</label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <svg className="h-4 w-4 text-foreground-muted" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77Z"/>
                        </svg>
                      </div>
                      <input
                        type="url"
                        value={companyLinkedinUrl}
                        onChange={(e) => setCompanyLinkedinUrl(e.target.value)}
                        placeholder="https://linkedin.com/company/votre-entreprise"
                        className={`${inputClass} pl-9`}
                      />
                    </div>
                    <p className="mt-1 text-xs text-foreground-muted">Sera affiché sur la page publique de votre compagnie</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Adresse postale</label>
                    <textarea
                      value={companyAddress}
                      onChange={(e) => setCompanyAddress(e.target.value)}
                      rows={2}
                      placeholder="Adresse complète de l'entreprise..."
                      className={inputClass}
                    />
                  </div>

                  <div className="flex items-center gap-3 pt-4 border-t border-[var(--gaspe-neutral-100)]">
                    <Button onClick={handleSave}>Enregistrer</Button>
                    <button
                      onClick={() => setEditing(false)}
                      className="rounded-lg px-4 py-2.5 text-sm font-heading font-semibold text-foreground-muted hover:text-foreground transition-colors"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              </Card>
            ) : (
              <Card>
                <div className="flex items-start justify-between mb-4">
                  <CardTitle>Informations entreprise</CardTitle>
                  <button
                    onClick={() => setEditing(true)}
                    className="rounded-lg px-3 py-1.5 text-xs font-semibold text-[var(--gaspe-teal-600)] hover:bg-[var(--gaspe-teal-50)] transition-colors"
                  >
                    Modifier
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Logo + company name */}
                  <div className="flex items-center gap-4">
                    {user.companyLogo ? (
                      <Image
                        src={user.companyLogo}
                        alt={`Logo ${user.company ?? ""}`}
                        width={64}
                        height={64}
                        unoptimized
                        loading="lazy"
                        className="h-16 w-16 rounded-lg object-contain border border-[var(--gaspe-neutral-200)]"
                      />
                    ) : (
                      <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-[var(--gaspe-teal-50)] border border-[var(--gaspe-neutral-200)]">
                        <span className="font-heading text-xl font-bold text-[var(--gaspe-teal-600)]">
                          {(user.company ?? "?").charAt(0)}
                        </span>
                      </div>
                    )}
                    <div>
                      <p className="font-heading text-lg font-bold text-foreground">{user.company ?? "Non renseigné"}</p>
                      {roleLabel && <Badge variant="teal">{roleLabel}</Badge>}
                      {!roleLabel && (
                        <span className="text-xs text-[var(--gaspe-warm-500)]">Rôle non renseigné</span>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <p className="text-xs font-medium text-foreground-muted uppercase tracking-wider mb-1">Description</p>
                    <p className="text-sm text-foreground">
                      {user.companyDescription || <span className="text-foreground-muted italic">Non renseignée</span>}
                    </p>
                  </div>

                  {/* Contact details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-[var(--gaspe-neutral-100)]">
                    <div>
                      <p className="text-xs font-medium text-foreground-muted uppercase tracking-wider mb-1">Contact</p>
                      <p className="text-sm text-foreground">{user.name}</p>
                      <p className="text-sm text-foreground-muted">{user.email}</p>
                      {user.phone && <p className="text-sm text-foreground-muted">{user.phone}</p>}
                    </div>
                    <div>
                      <p className="text-xs font-medium text-foreground-muted uppercase tracking-wider mb-1">Entreprise</p>
                      <p className="text-sm text-foreground">{user.companyEmail || <span className="text-foreground-muted italic">Email non renseigné</span>}</p>
                      <p className="text-sm text-foreground">{user.companyPhone || <span className="text-foreground-muted italic">Tél. non renseigné</span>}</p>
                    </div>
                  </div>

                  {/* Address */}
                  <div className="pt-3 border-t border-[var(--gaspe-neutral-100)]">
                    <p className="text-xs font-medium text-foreground-muted uppercase tracking-wider mb-1">Adresse</p>
                    <p className="text-sm text-foreground whitespace-pre-line">
                      {user.companyAddress || <span className="text-foreground-muted italic">Non renseignée</span>}
                    </p>
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardTitle>Adhésion</CardTitle>
              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-foreground-muted">Statut</span>
                  <Badge variant={
                    user.membershipStatus === "paid" ? "green" :
                    user.membershipStatus === "pending" ? "warm" : "neutral"
                  }>
                    {user.membershipStatus === "paid" ? "Payée" :
                     user.membershipStatus === "pending" ? "En cours" : "Due"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-foreground-muted">Membre depuis</span>
                  <span className="text-sm font-medium text-foreground">
                    {new Date(user.createdAt).toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
                  </span>
                </div>
              </div>
            </Card>

            <Card>
              <CardTitle>Complétion</CardTitle>
              <div className="mt-3 space-y-2">
                {weights.map((w, i) => {
                  const labels = [
                    "Nom", "Email", "Téléphone", "Compagnie", "Rôle",
                    "Description", "Email entreprise", "Tél. entreprise", "Adresse", "Logo", "Navires"
                  ];
                  return (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <span className={`h-2 w-2 rounded-full ${w.filled ? "bg-[var(--gaspe-green-400)]" : "bg-[var(--gaspe-neutral-300)]"}`} />
                      <span className={w.filled ? "text-foreground" : "text-foreground-muted"}>{labels[i]}</span>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        </div>
      )}

      {tab === "vessels" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-foreground-muted">{vessels.length} navire{vessels.length !== 1 ? "s" : ""} enregistré{vessels.length !== 1 ? "s" : ""}</p>
            <Button onClick={() => { setVesselForm({ name: "", imo: "", ums: "", size: "" }); setEditingVesselId(null); setShowVesselForm(true); }}>
              + Ajouter un navire
            </Button>
          </div>

          {showVesselForm && (
            <form onSubmit={handleVesselSubmit} className="rounded-2xl border border-[var(--gaspe-neutral-200)] border-l-[3px] border-l-[var(--gaspe-teal-600)] bg-white p-5 space-y-4">
              <h3 className="font-heading text-base font-semibold text-foreground">
                {editingVesselId ? "Modifier le navire" : "Nouveau navire"}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Nom du navire <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={vesselForm.name}
                    onChange={(e) => setVesselForm((p) => ({ ...p, name: e.target.value }))}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">N IMO</label>
                  <input
                    type="text"
                    value={vesselForm.imo}
                    onChange={(e) => setVesselForm((p) => ({ ...p, imo: e.target.value }))}
                    placeholder="1234567"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">UMS</label>
                  <input
                    type="text"
                    value={vesselForm.ums}
                    onChange={(e) => setVesselForm((p) => ({ ...p, ums: e.target.value }))}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Taille / Jauge</label>
                  <input
                    type="text"
                    value={vesselForm.size}
                    onChange={(e) => setVesselForm((p) => ({ ...p, size: e.target.value }))}
                    placeholder="ex: 24m / 150 UMS"
                    className={inputClass}
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <Button type="submit">{editingVesselId ? "Mettre à jour" : "Ajouter"}</Button>
                <button
                  type="button"
                  onClick={() => { setShowVesselForm(false); setEditingVesselId(null); }}
                  className="rounded-lg px-4 py-2.5 text-sm font-heading font-semibold text-foreground-muted hover:text-foreground transition-colors"
                >
                  Annuler
                </button>
              </div>
            </form>
          )}

          {vessels.length === 0 && !showVesselForm ? (
            <Card>
              <div className="py-8 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--gaspe-teal-50)]">
                  <svg className="h-6 w-6 text-[var(--gaspe-teal-600)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3L4 9l.5 6.5L12 21l7.5-5.5L20 9l-8-6z" />
                  </svg>
                </div>
                <p className="text-sm text-foreground-muted">Aucun navire enregistré.</p>
                <p className="text-xs text-foreground-muted mt-1">Ajoutez vos navires pour compléter votre profil.</p>
              </div>
            </Card>
          ) : (
            <div className="space-y-2">
              {vessels.map((v) => (
                <div key={v.id} className="flex items-center justify-between rounded-2xl border border-[var(--gaspe-neutral-200)] bg-white p-4 hover:border-[var(--gaspe-teal-200)] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--gaspe-teal-50)]">
                      <svg className="h-5 w-5 text-[var(--gaspe-teal-600)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3L4 9l.5 6.5L12 21l7.5-5.5L20 9l-8-6z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-heading text-sm font-semibold text-foreground">{v.name}</p>
                      <div className="flex gap-3 text-xs text-foreground-muted">
                        {v.imo && <span>IMO: {v.imo}</span>}
                        {v.ums && <span>UMS: {v.ums}</span>}
                        {v.size && <span>{v.size}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => startEditVessel(v)}
                      className="rounded-lg px-3 py-1.5 text-xs font-semibold text-[var(--gaspe-teal-600)] hover:bg-[var(--gaspe-teal-50)] transition-colors"
                    >
                      Modifier
                    </button>
                    <button
                      onClick={() => deleteVessel(v.id)}
                      className="rounded-lg px-3 py-1.5 text-xs font-semibold text-foreground-muted hover:bg-red-50 hover:text-red-600 transition-colors"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Save vessels button */}
          {vessels !== (user?.vessels ?? []) && (
            <div className="flex justify-end">
              <Button onClick={handleSave}>Enregistrer les navires</Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
