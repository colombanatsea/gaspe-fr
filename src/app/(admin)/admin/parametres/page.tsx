"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

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
  tagline: "Localement ancr\u00e9s. Socialement engag\u00e9s.",
  contactEmail: "contact@gaspe.fr",
  address: "44 rue de Clichy, 75009 Paris",
};

export default function AdminParametresPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);
  const [settingsSaved, setSettingsSaved] = useState(false);

  const [passwordForm, setPasswordForm] = useState({
    current: "",
    newPassword: "",
    confirm: "",
  });
  const [passwordMsg, setPasswordMsg] = useState("");

  useEffect(() => {
    if (!user || user.role !== "admin") {
      router.push("/connexion");
      return;
    }
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      setSettings(JSON.parse(raw));
    }
  }, [user, router]);

  if (!user || user.role !== "admin") return null;

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

  function changePassword(e: React.FormEvent) {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirm) {
      setPasswordMsg("Les mots de passe ne correspondent pas.");
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      setPasswordMsg("Le mot de passe doit faire au moins 6 caract\u00e8res.");
      return;
    }

    const raw = localStorage.getItem(PASSWORDS_KEY);
    const passwords: Record<string, string> = raw ? JSON.parse(raw) : {};

    if (!user || passwords[user.id] !== passwordForm.current) {
      setPasswordMsg("Mot de passe actuel incorrect.");
      return;
    }

    passwords[user!.id] = passwordForm.newPassword;
    localStorage.setItem(PASSWORDS_KEY, JSON.stringify(passwords));
    setPasswordForm({ current: "", newPassword: "", confirm: "" });
    setPasswordMsg("Mot de passe modifi\u00e9 avec succ\u00e8s.");
  }

  const inputClass =
    "w-full rounded-lg border border-border-light bg-surface px-3 py-2 text-sm text-foreground placeholder:text-foreground-muted/50 focus:border-primary focus:ring-1 focus:ring-primary";

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Param&egrave;tres</h1>
        <p className="mt-1 text-sm text-foreground-muted">
          Configuration g&eacute;n&eacute;rale du site et du compte administrateur.
        </p>
      </div>

      {/* Admin user info */}
      <Card>
        <h2 className="font-heading text-lg font-semibold text-foreground mb-4">Compte administrateur</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 text-sm">
          <div>
            <span className="text-foreground-muted">Nom :</span>
            <span className="ml-2 font-medium text-foreground">{user.name}</span>
          </div>
          <div>
            <span className="text-foreground-muted">Email :</span>
            <span className="ml-2 font-medium text-foreground">{user.email}</span>
          </div>
          <div>
            <span className="text-foreground-muted">R&ocirc;le :</span>
            <span className="ml-2 font-medium text-foreground capitalize">{user.role}</span>
          </div>
          <div>
            <span className="text-foreground-muted">Cr&eacute;&eacute; le :</span>
            <span className="ml-2 font-medium text-foreground">
              {new Date(user.createdAt).toLocaleDateString("fr-FR")}
            </span>
          </div>
        </div>
      </Card>

      {/* Site settings */}
      <Card>
        <h2 className="font-heading text-lg font-semibold text-foreground mb-4">Param&egrave;tres du site</h2>
        <form onSubmit={saveSettings} className="space-y-4">
          <div>
            <label htmlFor="siteName" className="block text-sm font-medium text-foreground mb-1">Nom du site</label>
            <input id="siteName" name="siteName" type="text" value={settings.siteName} onChange={handleSettingsChange} className={inputClass} />
          </div>
          <div>
            <label htmlFor="tagline" className="block text-sm font-medium text-foreground mb-1">Slogan</label>
            <input id="tagline" name="tagline" type="text" value={settings.tagline} onChange={handleSettingsChange} className={inputClass} />
          </div>
          <div>
            <label htmlFor="contactEmail" className="block text-sm font-medium text-foreground mb-1">Email de contact</label>
            <input id="contactEmail" name="contactEmail" type="email" value={settings.contactEmail} onChange={handleSettingsChange} className={inputClass} />
          </div>
          <div>
            <label htmlFor="address" className="block text-sm font-medium text-foreground mb-1">Adresse</label>
            <input id="address" name="address" type="text" value={settings.address} onChange={handleSettingsChange} className={inputClass} />
          </div>
          <div className="flex items-center gap-3">
            <Button type="submit">Enregistrer</Button>
            {settingsSaved && (
              <span className="text-sm text-green-600 font-medium">Enregistr&eacute; !</span>
            )}
          </div>
        </form>
      </Card>

      {/* Change password */}
      <Card>
        <h2 className="font-heading text-lg font-semibold text-foreground mb-4">Changer le mot de passe</h2>
        <form onSubmit={changePassword} className="space-y-4">
          <div>
            <label htmlFor="current" className="block text-sm font-medium text-foreground mb-1">Mot de passe actuel</label>
            <input id="current" name="current" type="password" required value={passwordForm.current} onChange={handlePasswordChange} className={inputClass} />
          </div>
          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-foreground mb-1">Nouveau mot de passe</label>
            <input id="newPassword" name="newPassword" type="password" required value={passwordForm.newPassword} onChange={handlePasswordChange} className={inputClass} />
          </div>
          <div>
            <label htmlFor="confirm" className="block text-sm font-medium text-foreground mb-1">Confirmer</label>
            <input id="confirm" name="confirm" type="password" required value={passwordForm.confirm} onChange={handlePasswordChange} className={inputClass} />
          </div>
          {passwordMsg && (
            <p className={`text-sm font-medium ${passwordMsg.includes("succ") ? "text-green-600" : "text-red-600"}`}>
              {passwordMsg}
            </p>
          )}
          <Button type="submit">Modifier le mot de passe</Button>
        </form>
      </Card>
    </div>
  );
}
