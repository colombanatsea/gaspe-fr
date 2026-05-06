"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { hashPassword, verifyPassword } from "@/lib/auth/hash";
import { Badge } from "@/components/ui/Badge";
import { isStaffOrAdmin } from "@/lib/auth/permissions";

const SETTINGS_KEY = "gaspe_settings";
const PASSWORDS_KEY = "gaspe_passwords";

interface SiteSettings {
  siteName: string;
  tagline: string;
  contactEmail: string;
  address: string;
}

const DEFAULT_SETTINGS: SiteSettings = {
  siteName: "GASPE",
  tagline: "Localement ancrés. Socialement engagés.",
  contactEmail: "contact@gaspe.fr",
  address: "44 rue de Clichy, 75009 Paris",
};

export default function AdminParametresPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);
  const [settingsSaved, setSettingsSaved] = useState(false);

  const [passwordForm, setPasswordForm] = useState({ current: "", newPassword: "", confirm: "" });
  const [passwordMsg, setPasswordMsg] = useState("");

  useEffect(() => {
    if (!user || !isStaffOrAdmin(user)) router.push("/connexion");
  }, [user, router]);

  const [initialized, setInitialized] = useState(false);
  if (!initialized && user?.role === "admin") {
    setInitialized(true);
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) setSettings(JSON.parse(raw));
  }

  if (!user || !isStaffOrAdmin(user)) return null;

  function handleSettingsChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSettings((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setSettingsSaved(false);
  }

  function saveSettings(e: React.FormEvent) {
    e.preventDefault();
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 3000);
  }

  function handlePasswordChange(e: React.ChangeEvent<HTMLInputElement>) {
    setPasswordForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setPasswordMsg("");
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirm) {
      setPasswordMsg("Les mots de passe ne correspondent pas."); return;
    }
    if (passwordForm.newPassword.length < 6) {
      setPasswordMsg("Le mot de passe doit faire au moins 6 caractères."); return;
    }
    const raw = localStorage.getItem(PASSWORDS_KEY);
    const passwords: Record<string, string> = raw ? JSON.parse(raw) : {};
    if (!user) { setPasswordMsg("Utilisateur non connecté."); return; }
    const isValid = await verifyPassword(passwordForm.current, user.email, passwords[user.id] ?? "");
    if (!isValid) {
      setPasswordMsg("Mot de passe actuel incorrect."); return;
    }
    passwords[user.id] = await hashPassword(passwordForm.newPassword, user.email);
    localStorage.setItem(PASSWORDS_KEY, JSON.stringify(passwords));
    setPasswordForm({ current: "", newPassword: "", confirm: "" });
    setPasswordMsg("Mot de passe modifié avec succès.");
  }

  const inputClass =
    "w-full rounded-xl border border-[var(--gaspe-neutral-200)] bg-white px-3.5 py-2.5 text-sm text-foreground focus:border-[var(--gaspe-teal-400)] focus:ring-1 focus:ring-[var(--gaspe-teal-400)] focus:outline-none transition-colors";

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Paramètres</h1>
        <p className="mt-1 text-sm text-foreground-muted">
          Configuration générale du site et du compte administrateur.
        </p>
      </div>

      {/* Admin user info */}
      <div className="rounded-2xl bg-white border border-[var(--gaspe-neutral-200)] p-6">
        <div className="flex items-center gap-4 mb-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--gaspe-teal-50)]">
            <svg className="h-6 w-6 text-[var(--gaspe-teal-600)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
            </svg>
          </div>
          <div>
            <h2 className="font-heading text-lg font-semibold text-foreground">Compte administrateur</h2>
            <Badge variant="teal">Admin</Badge>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {[
            { label: "Nom", value: user.name },
            { label: "Email", value: user.email },
            { label: "Rôle", value: "Administrateur" },
            { label: "Créé le", value: new Date(user.createdAt).toLocaleDateString("fr-FR") },
          ].map((item) => (
            <div key={item.label} className="rounded-xl bg-[var(--gaspe-neutral-50)] p-3">
              <p className="text-[10px] font-semibold text-foreground-muted uppercase tracking-wider mb-1">{item.label}</p>
              <p className="text-sm font-medium text-foreground">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Site settings */}
      <div className="rounded-2xl bg-white border border-[var(--gaspe-neutral-200)] p-6">
        <h2 className="font-heading text-lg font-semibold text-foreground mb-5 flex items-center gap-2">
          <svg className="h-5 w-5 text-[var(--gaspe-teal-600)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582" />
          </svg>
          Paramètres du site
        </h2>
        <form onSubmit={saveSettings} className="space-y-4">
          <div>
            <label htmlFor="siteName" className="block text-sm font-medium text-foreground mb-1.5">Nom du site</label>
            <input id="siteName" name="siteName" type="text" value={settings.siteName} onChange={handleSettingsChange} className={inputClass} />
          </div>
          <div>
            <label htmlFor="tagline" className="block text-sm font-medium text-foreground mb-1.5">Slogan</label>
            <input id="tagline" name="tagline" type="text" value={settings.tagline} onChange={handleSettingsChange} className={inputClass} />
          </div>
          <div>
            <label htmlFor="contactEmail" className="block text-sm font-medium text-foreground mb-1.5">Email de contact</label>
            <input id="contactEmail" name="contactEmail" type="email" value={settings.contactEmail} onChange={handleSettingsChange} className={inputClass} />
          </div>
          <div>
            <label htmlFor="address" className="block text-sm font-medium text-foreground mb-1.5">Adresse</label>
            <input id="address" name="address" type="text" value={settings.address} onChange={handleSettingsChange} className={inputClass} />
          </div>
          <div className="flex items-center gap-3 pt-2">
            <button type="submit" className="rounded-xl bg-[var(--gaspe-teal-600)] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[var(--gaspe-teal-700)] transition-colors">
              Enregistrer
            </button>
            {settingsSaved && (
              <span className="text-sm text-[var(--gaspe-green-500)] font-semibold flex items-center gap-1">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                Enregistré
              </span>
            )}
          </div>
        </form>
      </div>

      {/* Change password */}
      <div className="rounded-2xl bg-white border border-[var(--gaspe-neutral-200)] p-6">
        <h2 className="font-heading text-lg font-semibold text-foreground mb-5 flex items-center gap-2">
          <svg className="h-5 w-5 text-[var(--gaspe-teal-600)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
          </svg>
          Changer le mot de passe
        </h2>
        <form onSubmit={changePassword} className="space-y-4">
          <div>
            <label htmlFor="current" className="block text-sm font-medium text-foreground mb-1.5">Mot de passe actuel</label>
            <input id="current" name="current" type="password" required value={passwordForm.current} onChange={handlePasswordChange} className={inputClass} />
          </div>
          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-foreground mb-1.5">Nouveau mot de passe</label>
            <input id="newPassword" name="newPassword" type="password" required value={passwordForm.newPassword} onChange={handlePasswordChange} className={inputClass} />
          </div>
          <div>
            <label htmlFor="confirm" className="block text-sm font-medium text-foreground mb-1.5">Confirmer</label>
            <input id="confirm" name="confirm" type="password" required value={passwordForm.confirm} onChange={handlePasswordChange} className={inputClass} />
          </div>
          {passwordMsg && (
            <p className={`text-sm font-semibold flex items-center gap-1 ${passwordMsg.includes("succ") ? "text-[var(--gaspe-green-500)]" : "text-red-500"}`}>
              {passwordMsg}
            </p>
          )}
          <button type="submit" className="rounded-xl border-2 border-[var(--gaspe-teal-600)] px-6 py-2.5 text-sm font-semibold text-[var(--gaspe-teal-600)] hover:bg-[var(--gaspe-teal-50)] transition-colors">
            Modifier le mot de passe
          </button>
        </form>
      </div>

      {user.role === "admin" && <AdminTools />}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────
 *  AdminTools — outils backoffice admin uniquement (session 54+++)
 *  Boutons : exporter D1 (P2-4), vérifier hashes seeds (P2-1).
 *  Réservé au master admin (role === "admin").
 * ──────────────────────────────────────────────────────────────────── */
function AdminTools() {
  const [seedHashes, setSeedHashes] = useState<Array<{ seed_name: string; sha256: string; recorded_at: string }> | null>(null);
  const [seedsLoading, setSeedsLoading] = useState(false);
  const [seedsError, setSeedsError] = useState("");

  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "";

  const handleExport = () => {
    if (!apiBase) {
      alert("NEXT_PUBLIC_API_URL n'est pas configuré (mode demo).");
      return;
    }
    // Le cookie JWT httpOnly est envoyé automatiquement par le navigateur.
    // On ouvre dans un nouvel onglet pour déclencher le download.
    window.open(`${apiBase}/api/admin/export-all`, "_blank", "noopener,noreferrer");
  };

  const handleCheckHashes = async () => {
    if (!apiBase) {
      alert("NEXT_PUBLIC_API_URL n'est pas configuré (mode demo).");
      return;
    }
    setSeedsLoading(true);
    setSeedsError("");
    try {
      const res = await fetch(`${apiBase}/api/admin/seed-hashes`, { credentials: "include" });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json() as { hashes?: Array<{ seed_name: string; sha256: string; recorded_at: string }> };
      setSeedHashes(data.hashes ?? []);
    } catch (e) {
      setSeedsError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setSeedsLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-[var(--gaspe-neutral-200)] bg-white p-6">
      <h2 className="font-heading text-lg font-bold text-foreground mb-1">
        Outils administrateur
      </h2>
      <p className="text-sm text-foreground-muted mb-5">
        Réservés au master admin. Manipulez avec prudence (export complet D1, audit hashes seeds).
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Export D1 */}
        <div className="rounded-xl border border-[var(--gaspe-neutral-200)] p-4">
          <h3 className="font-heading text-sm font-semibold text-foreground">Export complet D1</h3>
          <p className="mt-1 text-xs text-foreground-muted">
            Télécharge un JSON exhaustif des 23 tables principales (sans password_hash ni tokens). Pour audit DGCCRF, RGPD article 20, transfert légal.
          </p>
          <button
            type="button"
            onClick={handleExport}
            className="mt-3 inline-flex items-center gap-2 rounded-xl bg-[var(--gaspe-teal-600)] hover:bg-[var(--gaspe-teal-700)] text-white px-4 py-2 text-sm font-medium transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Exporter (JSON)
          </button>
        </div>

        {/* Hashes seeds */}
        <div className="rounded-xl border border-[var(--gaspe-neutral-200)] p-4">
          <h3 className="font-heading text-sm font-semibold text-foreground">Hashes seeds enregistrés</h3>
          <p className="mt-1 text-xs text-foreground-muted">
            Liste des SHA-256 des fichiers de seed (members, fleet, ccn3228, …) tels qu&apos;enregistrés en D1. Pour mettre à jour : <code className="font-mono">npx tsx scripts/compute-seed-hashes.ts --post</code>
          </p>
          <button
            type="button"
            onClick={handleCheckHashes}
            disabled={seedsLoading}
            className="mt-3 inline-flex items-center gap-2 rounded-xl border border-[var(--gaspe-teal-600)] text-[var(--gaspe-teal-600)] hover:bg-[var(--gaspe-teal-50)] px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50"
          >
            {seedsLoading ? "Chargement…" : "Vérifier les hashes"}
          </button>

          {seedsError && (
            <p className="mt-2 text-xs text-red-600">{seedsError}</p>
          )}
          {seedHashes && (
            <div className="mt-3 max-h-60 overflow-y-auto rounded-lg border border-[var(--gaspe-neutral-100)] bg-[var(--gaspe-neutral-50)] p-2 text-xs font-mono">
              {seedHashes.length === 0 ? (
                <p className="text-foreground-muted italic">Aucun hash enregistré. Lancez <code>compute-seed-hashes --post</code> pour initialiser.</p>
              ) : (
                <ul className="space-y-1">
                  {seedHashes.map((h) => (
                    <li key={h.seed_name} className="flex flex-col">
                      <span className="font-semibold">{h.seed_name}</span>
                      <span className="text-foreground-muted truncate">{h.sha256}</span>
                      <span className="text-foreground-muted/70">{h.recorded_at}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
