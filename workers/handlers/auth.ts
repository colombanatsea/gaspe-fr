/**
 * Handlers d'authentification : register / login / me / users CRUD +
 * gouvernance multi-admin (master transferable, migration 0044).
 *
 * Extrait de `workers/api.ts` en J1 vague 3.
 */

import { signJwt, verifyJwt } from "../jwt";
import { json } from "../lib/json";
import { extractToken, setTokenCookie } from "../lib/auth";
import { sanitize } from "../lib/sanitize";
import { hashPasswordServer, verifyPasswordServer } from "../lib/crypto";
import { sendBrevoTransactional } from "../lib/brevo";
import { renderEmailLayout, renderEmailButton, renderEmailParagraph } from "../lib/brevo-templates";
import { logAudit } from "../lib/audit";
import { type DbUser, toFrontendUser } from "../lib/users";
import { SITE_URL } from "../lib/constants";
import type { Env } from "../lib/env";

export async function handleRegister(request: Request, env: Env, corsHeaders: Record<string, string>) {
  const body = (await request.json()) as Record<string, string>;
  const { name, email, password, phone, role, company, currentPosition, desiredPosition } = body;

  if (!name?.trim() || !email?.trim() || !password || !role) {
    return json({ error: "Champs requis manquants" }, corsHeaders, 400);
  }

  if (!["adherent", "candidat"].includes(role)) {
    return json({ error: "Rôle invalide" }, corsHeaders, 400);
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ error: "Email invalide" }, corsHeaders, 400);
  }

  if (password.length < 6) {
    return json({ error: "Le mot de passe doit contenir au moins 6 caractères" }, corsHeaders, 400);
  }

  // Téléphone obligatoire pour tous les comptes (validé contre le front).
  const phoneDigits = (phone ?? "").replace(/\D/g, "");
  if (phoneDigits.length < 8) {
    return json({ error: "Un numéro de téléphone valide est obligatoire (8 chiffres minimum)" }, corsHeaders, 400);
  }

  // Le nom doit comporter au moins un prénom et un nom (espace au milieu).
  if (!/\S\s+\S/.test(name.trim())) {
    return json({ error: "Prénom et nom obligatoires (séparés par un espace)" }, corsHeaders, 400);
  }

  if (role === "adherent" && !company?.trim()) {
    return json({ error: "La compagnie est requise pour les adhérents" }, corsHeaders, 400);
  }

  const existing = await env.DB.prepare("SELECT id FROM users WHERE email = ? COLLATE NOCASE").bind(email.trim()).first();
  if (existing) {
    return json({ error: "Un compte existe déjà avec cet email" }, corsHeaders, 409);
  }

  const id = `${role}-${Date.now()}`;
  const approved = role === "candidat" ? 1 : 0;
  const passwordHash = await hashPasswordServer(password);

  let organizationId: string | null = null;
  let isPrimary = 0;
  if (role === "adherent" && company?.trim()) {
    const org = await env.DB.prepare("SELECT id FROM organizations WHERE name = ? COLLATE NOCASE").bind(company.trim()).first<{ id: string }>();
    if (org) {
      organizationId = org.id;
      const existingPrimary = await env.DB.prepare(
        "SELECT id FROM users WHERE organization_id = ? AND is_primary = 1 AND archived = 0",
      ).bind(org.id).first();
      if (!existingPrimary) {
        isPrimary = 1;
      }
    }
  }

  await env.DB.prepare(`
    INSERT INTO users (id, email, name, role, phone, company, approved, organization_id, is_primary, current_position, desired_position, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `).bind(
    id, email.trim(), sanitize(name.trim()), role,
    phone?.trim() ?? null, company?.trim() ?? null, approved,
    organizationId, isPrimary,
    currentPosition?.trim() ?? null, desiredPosition?.trim() ?? null,
  ).run();

  await env.DB.prepare("INSERT INTO auth (user_id, password_hash) VALUES (?, ?)").bind(id, passwordHash).run();
  await env.DB.prepare("INSERT INTO newsletter_preferences (user_id) VALUES (?)").bind(id).run();

  // (1) Notif admin pour chaque nouvelle demande.
  void sendBrevoTransactional(env, {
    to: [{ email: env.CONTACT_EMAIL || "colomban@gaspe.fr", name: "Admin GASPE" }],
    subject: role === "adherent"
      ? `[GASPE] Nouvelle demande de compte adhérent — ${sanitize(name.trim())} (${sanitize(company?.trim() ?? "")})`
      : `[GASPE] Nouveau compte candidat — ${sanitize(name.trim())}`,
    type: "registration_pending_admin",
    entityId: id,
    htmlContent: `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#F5F3F0;font-family:'DM Sans',Helvetica,sans-serif;">
<div style="max-width:600px;margin:24px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
  <div style="background:#1B7E8A;padding:24px 32px;text-align:center;">
    <h1 style="margin:0;color:#fff;font-family:'Exo 2',Helvetica,sans-serif;font-size:22px;">${role === "adherent" ? "Nouvelle demande de compte adhérent" : "Nouveau compte candidat"}</h1>
  </div>
  <div style="padding:32px;">
    <p style="margin:0 0 12px;color:#222221;font-size:15px;"><strong>Nom :</strong> ${sanitize(name.trim())}</p>
    <p style="margin:0 0 12px;color:#222221;font-size:15px;"><strong>Email :</strong> ${sanitize(email.trim())}</p>
    ${phone ? `<p style="margin:0 0 12px;color:#222221;font-size:15px;"><strong>Téléphone :</strong> ${sanitize(phone)}</p>` : ""}
    ${company ? `<p style="margin:0 0 12px;color:#222221;font-size:15px;"><strong>Compagnie :</strong> ${sanitize(company.trim())}</p>` : ""}
    ${role === "adherent" ? `<p style="margin:24px 0;"><a href="${SITE_URL}/admin/utilisateurs" style="display:inline-block;background:#1B7E8A;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">Approuver / refuser dans l'admin</a></p>` : ""}
  </div>
</div></body></html>`,
  });

  // (2) Bienvenue côté utilisateur.
  void sendBrevoTransactional(env, {
    to: [{ email: email.trim(), name: name.trim() }],
    subject: role === "adherent" ? "Votre demande a bien été reçue — GASPE" : "Bienvenue sur GASPE",
    type: role === "adherent" ? "registration_pending_user" : "registration_welcome_candidat",
    entityId: id,
    htmlContent: `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#F5F3F0;font-family:'DM Sans',Helvetica,sans-serif;">
<div style="max-width:600px;margin:24px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
  <div style="background:#1B7E8A;padding:24px 32px;text-align:center;">
    <h1 style="margin:0;color:#fff;font-family:'Exo 2',Helvetica,sans-serif;font-size:22px;">GASPE</h1>
    <p style="margin:4px 0 0;color:#B2DFE3;font-size:13px;">Localement ancrés. Socialement engagés.</p>
  </div>
  <div style="padding:32px;">
    <p style="margin:0 0 12px;color:#222221;font-size:15px;">Bonjour ${sanitize(name.trim())},</p>
    ${role === "adherent"
      ? `<p style="margin:0 0 12px;color:#222221;font-size:15px;">Votre demande de compte adhérent pour la compagnie <strong>${sanitize(company?.trim() ?? "")}</strong> a bien été enregistrée. Elle sera examinée par l'équipe GASPE sous 48h ouvrées. Vous recevrez un email dès la validation.</p>
         <p style="margin:0 0 12px;color:#6B6560;font-size:13px;">Aucune action n'est requise de votre part pour l'instant.</p>`
      : `<p style="margin:0 0 12px;color:#222221;font-size:15px;">Votre compte candidat est actif. Vous pouvez dès à présent compléter votre profil et postuler aux offres de nos compagnies adhérentes.</p>
         <p style="margin:24px 0;"><a href="${SITE_URL}/espace-candidat" style="display:inline-block;background:#1B7E8A;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">Accéder à mon espace</a></p>`}
  </div>
</div></body></html>`,
  });

  if (role === "candidat") {
    const token = await signJwt({ sub: id, email: email.trim(), role }, env.JWT_SECRET);
    const userRow = await env.DB.prepare("SELECT * FROM users WHERE id = ?").bind(id).first<DbUser>();
    return json(
      { success: true, token, user: userRow ? toFrontendUser(userRow) : null },
      setTokenCookie(token, corsHeaders),
    );
  }

  return json({ success: true, message: "Compte créé. En attente de validation par l'administrateur." }, corsHeaders);
}

export async function handleLogin(request: Request, env: Env, corsHeaders: Record<string, string>) {
  const body = (await request.json()) as Record<string, string>;
  const { email, password } = body;

  if (!email?.trim() || !password) {
    return json({ error: "Email et mot de passe requis" }, corsHeaders, 400);
  }

  const loginError = { error: "Email ou mot de passe incorrect." };

  const userRow = await env.DB.prepare("SELECT * FROM users WHERE email = ? COLLATE NOCASE").bind(email.trim()).first<DbUser>();
  if (!userRow) {
    return json(loginError, corsHeaders, 401);
  }

  const authRow = await env.DB.prepare("SELECT password_hash FROM auth WHERE user_id = ?").bind(userRow.id).first<{ password_hash: string }>();
  if (!authRow) {
    return json(loginError, corsHeaders, 401);
  }

  const valid = await verifyPasswordServer(password, authRow.password_hash);
  if (!valid) {
    return json(loginError, corsHeaders, 401);
  }

  if (userRow.role === "adherent" && userRow.approved !== 1) {
    return json({ error: "Votre compte est en attente de validation par l'administrateur." }, corsHeaders, 403);
  }

  const token = await signJwt({ sub: userRow.id, email: userRow.email, role: userRow.role }, env.JWT_SECRET);
  return json(
    { success: true, token, user: toFrontendUser(userRow) },
    setTokenCookie(token, corsHeaders),
  );
}

export async function handleMe(request: Request, env: Env, corsHeaders: Record<string, string>) {
  const token = extractToken(request);
  if (!token) {
    return json({ user: null }, corsHeaders, 401);
  }

  const payload = await verifyJwt(token, env.JWT_SECRET);
  if (!payload) {
    return json({ user: null }, corsHeaders, 401);
  }

  const userRow = await env.DB.prepare("SELECT * FROM users WHERE id = ?").bind(payload.sub).first<DbUser>();
  if (!userRow) {
    return json({ user: null }, corsHeaders, 401);
  }

  return json({ user: toFrontendUser(userRow) }, corsHeaders);
}

export async function handleListUsers(request: Request, env: Env, corsHeaders: Record<string, string>) {
  const token = extractToken(request);
  if (!token) return json({ error: "Non authentifié" }, corsHeaders, 401);

  const payload = await verifyJwt(token, env.JWT_SECRET);
  if (!payload || payload.role !== "admin") {
    return json({ error: "Accès refusé" }, corsHeaders, 403);
  }

  const { results } = await env.DB.prepare("SELECT * FROM users ORDER BY created_at DESC").all<DbUser>();
  return json({ users: (results ?? []).map(toFrontendUser) }, corsHeaders);
}

export async function handleUpdateUser(request: Request, env: Env, corsHeaders: Record<string, string>, userId: string) {
  const token = extractToken(request);
  if (!token) return json({ error: "Non authentifié" }, corsHeaders, 401);

  const payload = await verifyJwt(token, env.JWT_SECRET);
  if (!payload) return json({ error: "Token invalide" }, corsHeaders, 401);

  if (payload.role !== "admin" && payload.sub !== userId) {
    return json({ error: "Accès refusé" }, corsHeaders, 403);
  }

  const body = (await request.json()) as Record<string, unknown>;

  const updates: string[] = [];
  const values: unknown[] = [];

  const allowedFields: Record<string, string> = {
    name: "name", email: "email", phone: "phone", company: "company",
    approved: "approved", archived: "archived",
    role: "role", staffPermissions: "staff_permissions",
    companyRole: "company_role", companyDescription: "company_description",
    companyLogo: "company_logo", companyAddress: "company_address",
    companyEmail: "company_email", companyPhone: "company_phone",
    companyLinkedinUrl: "company_linkedin_url",
    currentPosition: "current_position", desiredPosition: "desired_position",
    preferredZone: "preferred_zone", experience: "experience",
    certifications: "certifications", cvFilename: "cv_filename",
    profilePhoto: "profile_photo", linkedinUrl: "linkedin_url",
    membershipStatus: "membership_status",
  };

  // Champs réservés admin : email modifiable uniquement par admin (correction
  // de typo, fusion comptes). Le user lui-même ne peut pas changer son email
  // via cet endpoint pour eviter de bypasser un eventuel flow de verification.
  const adminOnly = ["email", "approved", "archived", "role", "staffPermissions"];

  for (const [frontendKey, dbCol] of Object.entries(allowedFields)) {
    if (frontendKey in body) {
      if (adminOnly.includes(frontendKey) && payload.role !== "admin") continue;
      const val = body[frontendKey];
      // Validation email : format + pas de doublon. Refuse l'update sinon.
      if (frontendKey === "email") {
        const newEmail = typeof val === "string" ? val.trim() : "";
        if (!newEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
          return json({ error: "Email invalide" }, corsHeaders, 400);
        }
        const existing = await env.DB.prepare(
          "SELECT id FROM users WHERE email = ? COLLATE NOCASE AND id != ?",
        ).bind(newEmail, userId).first<{ id: string }>();
        if (existing) {
          return json({ error: "Un autre compte utilise déjà cet email." }, corsHeaders, 409);
        }
        updates.push(`${dbCol} = ?`);
        values.push(newEmail);
        continue;
      }
      updates.push(`${dbCol} = ?`);
      if (typeof val === "boolean") values.push(val ? 1 : 0);
      else if (frontendKey === "staffPermissions" && Array.isArray(val)) values.push(JSON.stringify(val));
      else values.push(val);
    }
  }

  if (updates.length === 0) {
    return json({ error: "Aucun champ à mettre à jour" }, corsHeaders, 400);
  }

  const before = payload.role === "admin"
    ? await env.DB.prepare("SELECT email, name, approved, archived, role FROM users WHERE id = ?")
        .bind(userId).first<{ email: string; name: string; approved: number; archived: number; role: string }>()
    : null;

  updates.push("updated_at = datetime('now')");
  values.push(userId);

  await env.DB.prepare(`UPDATE users SET ${updates.join(", ")} WHERE id = ?`).bind(...values).run();

  const userRow = await env.DB.prepare("SELECT * FROM users WHERE id = ?").bind(userId).first<DbUser>();

  if (before && userRow && payload.role === "admin") {
    // Approbation : approved 0 → 1 sur un adhérent
    if (before.approved === 0 && userRow.approved === 1 && userRow.role === "adherent") {
      void sendBrevoTransactional(env, {
        to: [{ email: userRow.email, name: userRow.name }],
        subject: "Votre compte adhérent GASPE a été approuvé",
        type: "registration_approved",
        entityId: userId,
        htmlContent: `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#F5F3F0;font-family:'DM Sans',Helvetica,sans-serif;">
<div style="max-width:600px;margin:24px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
  <div style="background:#1B7E8A;padding:24px 32px;text-align:center;">
    <h1 style="margin:0;color:#fff;font-family:'Exo 2',Helvetica,sans-serif;font-size:22px;">GASPE</h1>
  </div>
  <div style="padding:32px;">
    <h2 style="margin:0 0 16px;color:#222221;font-size:20px;">Bienvenue !</h2>
    <p style="margin:0 0 12px;color:#222221;font-size:15px;">Bonjour ${sanitize(userRow.name)},</p>
    <p style="margin:0 0 12px;color:#222221;font-size:15px;">Votre compte adhérent vient d'être approuvé. Vous pouvez désormais accéder à l'intégralité de l'espace adhérent GASPE.</p>
    <p style="margin:24px 0;"><a href="${SITE_URL}/espace-adherent" style="display:inline-block;background:#1B7E8A;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">Accéder à mon espace</a></p>
  </div>
</div></body></html>`,
      });
    }
    // Refus : archived 0 → 1 sur un adhérent encore non approuvé
    if (before.archived === 0 && userRow.archived && before.approved === 0 && userRow.role === "adherent") {
      void sendBrevoTransactional(env, {
        to: [{ email: userRow.email, name: userRow.name }],
        subject: "Suite à votre demande de compte adhérent GASPE",
        type: "registration_rejected",
        entityId: userId,
        htmlContent: `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#F5F3F0;font-family:'DM Sans',Helvetica,sans-serif;">
<div style="max-width:600px;margin:24px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
  <div style="background:#1B7E8A;padding:24px 32px;text-align:center;">
    <h1 style="margin:0;color:#fff;font-family:'Exo 2',Helvetica,sans-serif;font-size:22px;">GASPE</h1>
  </div>
  <div style="padding:32px;">
    <p style="margin:0 0 12px;color:#222221;font-size:15px;">Bonjour ${sanitize(userRow.name)},</p>
    <p style="margin:0 0 12px;color:#222221;font-size:15px;">Suite à l'examen de votre demande de compte adhérent GASPE, nous ne sommes pas en mesure de la valider à ce stade.</p>
    <p style="margin:0 0 12px;color:#222221;font-size:15px;">Pour échanger sur ce point, contactez-nous à <a href="mailto:contact@gaspe.fr" style="color:#1B7E8A;">contact@gaspe.fr</a>.</p>
  </div>
</div></body></html>`,
      });
    }
  }

  return json({ success: true, user: userRow ? toFrontendUser(userRow) : null }, corsHeaders);
}

/**
 * Création de compte par l'admin maître. Pas de password fourni : on stocke
 * un hash aléatoire 64 hex caractères dans `auth` (impossible à retrouver),
 * l'utilisateur cree devra passer par "mot de passe oublie" pour se
 * connecter la premiere fois. Email de bienvenue Brevo avec lien direct.
 *
 * Body attendu : { name, email, role, organizationId?, isPrimary?,
 *                  companyRole?, phone?, approved? }
 *
 * - role: "adherent" | "candidat" | "staff" (pas "admin" — promotion separee)
 * - organizationId : requis pour adherent et staff lies a une compagnie
 * - approved : default 1 (admin valide directement, sinon il aurait
 *   utilise le flow d'invitation /api/organizations/:id/invite)
 */
export async function handleAdminCreateUser(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>,
) {
  const token = extractToken(request);
  if (!token) return json({ error: "Non authentifié" }, corsHeaders, 401);
  const payload = await verifyJwt(token, env.JWT_SECRET);
  if (!payload || payload.role !== "admin") {
    return json({ error: "Accès refusé : admin requis" }, corsHeaders, 403);
  }

  const body = (await request.json()) as Record<string, unknown>;
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const role = typeof body.role === "string" ? body.role : "";
  const organizationId = typeof body.organizationId === "string" ? body.organizationId.trim() : null;
  const isPrimary = body.isPrimary === true;
  const companyRole = typeof body.companyRole === "string" ? body.companyRole.trim() : null;
  const phone = typeof body.phone === "string" ? body.phone.trim() : null;

  if (!name || !email || !role) {
    return json({ error: "Nom, email et rôle requis" }, corsHeaders, 400);
  }
  if (!/\S\s+\S/.test(name)) {
    return json({ error: "Prénom et nom obligatoires (séparés par un espace)" }, corsHeaders, 400);
  }
  if (!["adherent", "candidat", "staff"].includes(role)) {
    return json({ error: "Rôle invalide (adherent / candidat / staff seulement)" }, corsHeaders, 400);
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ error: "Email invalide" }, corsHeaders, 400);
  }
  const phoneDigits = (phone ?? "").replace(/\D/g, "");
  if (phoneDigits.length < 8) {
    return json({ error: "Un numéro de téléphone valide est obligatoire (8 chiffres minimum)" }, corsHeaders, 400);
  }

  const existing = await env.DB.prepare("SELECT id FROM users WHERE email = ? COLLATE NOCASE").bind(email).first();
  if (existing) {
    return json({ error: "Un compte existe déjà avec cet email" }, corsHeaders, 409);
  }

  let resolvedOrgId: string | null = null;
  let companyName: string | null = null;
  if (organizationId) {
    const org = await env.DB.prepare("SELECT id, name FROM organizations WHERE id = ?").bind(organizationId).first<{ id: string; name: string }>();
    if (!org) {
      return json({ error: "Organisation introuvable" }, corsHeaders, 404);
    }
    resolvedOrgId = org.id;
    companyName = org.name;
  } else if (role === "adherent") {
    return json({ error: "organizationId requis pour un adhérent" }, corsHeaders, 400);
  }

  // Si is_primary demandé : verifie qu'aucun autre primary actif n'existe
  // sur cette org (le titulaire est unique). Sinon on stocke 0 et l'admin
  // fera la bascule via /admin/utilisateurs si necessaire.
  let primaryFlag = 0;
  if (isPrimary && resolvedOrgId) {
    const otherPrimary = await env.DB.prepare(
      "SELECT id FROM users WHERE organization_id = ? AND is_primary = 1 AND archived = 0",
    ).bind(resolvedOrgId).first();
    if (otherPrimary) {
      return json({
        error: "Cette compagnie a déjà un titulaire actif. Désigner d'abord un autre titulaire ou décocher la case.",
      }, corsHeaders, 409);
    }
    primaryFlag = 1;
  }

  const id = `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  // Password hash aléatoire : le user ne peut pas se connecter jusqu'a
  // ce qu'il fasse "mot de passe oublie".
  const randomBytes = crypto.getRandomValues(new Uint8Array(32));
  const randomPassword = Array.from(randomBytes).map((b) => b.toString(16).padStart(2, "0")).join("");
  const passwordHash = await hashPasswordServer(randomPassword);

  await env.DB.prepare(`
    INSERT INTO users (id, email, name, role, phone, company, approved, organization_id, is_primary, company_role, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `).bind(
    id, email, sanitize(name), role,
    phone, companyName,
    body.approved === false ? 0 : 1,
    resolvedOrgId, primaryFlag, companyRole,
  ).run();

  await env.DB.prepare("INSERT INTO auth (user_id, password_hash) VALUES (?, ?)").bind(id, passwordHash).run();
  await env.DB.prepare("INSERT OR IGNORE INTO newsletter_preferences (user_id) VALUES (?)").bind(id).run();

  await logAudit(env, payload.sub, "admin", "user.create_by_admin", "user", id, null, {
    email, role, organizationId: resolvedOrgId, isPrimary: primaryFlag === 1,
  }, request);

  // Genere un token reset password 1h pour que le user puisse se
  // connecter sans password. Email de bienvenue avec lien direct.
  await env.DB.prepare("DELETE FROM password_reset_tokens WHERE user_id = ?").bind(id).run();
  const tokenBytes = crypto.getRandomValues(new Uint8Array(32));
  const resetToken = Array.from(tokenBytes).map((b) => b.toString(16).padStart(2, "0")).join("");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
  await env.DB.prepare(
    "INSERT INTO password_reset_tokens (token, user_id, expires_at) VALUES (?, ?, ?)",
  ).bind(resetToken, id, expiresAt).run();

  const setPasswordUrl = `${SITE_URL}/reinitialiser-mot-de-passe?token=${resetToken}&first=1`;
  const loginUrl = `${SITE_URL}/connexion`;
  const roleLabel = role === "adherent" ? "adhérent" : role === "staff" ? "collaborateur GASPE" : "candidat";
  const espaceLabel = role === "adherent"
    ? "l'espace adhérent (carte de la flotte, votes, formations, documents)"
    : role === "staff"
      ? "la console d'administration GASPE selon les permissions accordées"
      : "l'espace candidat (offres d'emploi, formations, profil ENM)";

  void sendBrevoTransactional(env, {
    to: [{ email, name }],
    subject: "Votre compte GASPE a été créé — choisissez votre mot de passe",
    type: "admin_create_user",
    entityId: id,
    htmlContent: renderEmailLayout({
      headerTitle: "GASPE",
      headerSubtitle: "Localement ancrés. Socialement engagés.",
      body: [
        `<h2 style="margin:0 0 16px;color:#222221;font-size:20px;">Bienvenue sur la plateforme GASPE</h2>`,
        renderEmailParagraph(`Bonjour ${sanitize(name)},`),
        renderEmailParagraph(
          `L'administrateur GASPE a créé pour vous un compte <strong>${roleLabel}</strong>${
            companyName ? ` rattaché à la compagnie <strong>${sanitize(companyName)}</strong>` : ""
          }.`,
        ),
        renderEmailParagraph(
          `Pour finaliser votre première connexion, choisissez le mot de passe de votre choix en cliquant ci-dessous. Vous accéderez ensuite à ${espaceLabel}.`,
        ),
        renderEmailButton(setPasswordUrl, "Choisir mon mot de passe"),
        renderEmailParagraph(
          `Ce lien personnel est valide pendant 1 heure. Une fois votre mot de passe défini, vous pourrez vous connecter à tout moment depuis <a href="${loginUrl}" style="color:#1B7E8A;text-decoration:underline;">la page de connexion</a>.`,
          { muted: true },
        ),
        renderEmailParagraph(
          `Si le lien a expiré, demandez simplement « Mot de passe oublié » depuis la page de connexion, un nouveau lien vous sera renvoyé sur cette adresse.`,
          { muted: true },
        ),
      ].join("\n      "),
    }),
    textContent:
      `Bonjour ${name},\n\n` +
      `L'administrateur GASPE a créé un compte ${roleLabel} pour vous` +
      `${companyName ? ` (compagnie : ${companyName})` : ""}.\n\n` +
      `Choisissez votre mot de passe lors de la première connexion : ${setPasswordUrl}\n` +
      `(lien valide 1 heure)\n\n` +
      `Une fois votre mot de passe défini, connectez-vous sur ${loginUrl}.\n\n` +
      `Cordialement,\nL'équipe GASPE`,
  });

  const userRow = await env.DB.prepare("SELECT * FROM users WHERE id = ?").bind(id).first<DbUser>();
  return json({ success: true, user: userRow ? toFrontendUser(userRow) : null }, corsHeaders, 201);
}

export async function handleDeleteUser(request: Request, env: Env, corsHeaders: Record<string, string>, userId: string) {
  const token = extractToken(request);
  if (!token) return json({ error: "Non authentifié" }, corsHeaders, 401);

  const payload = await verifyJwt(token, env.JWT_SECRET);
  if (!payload || payload.role !== "admin") {
    return json({ error: "Accès refusé" }, corsHeaders, 403);
  }

  if (payload.sub === userId) {
    return json({ error: "Impossible de supprimer votre propre compte" }, corsHeaders, 400);
  }

  await env.DB.prepare("DELETE FROM auth WHERE user_id = ?").bind(userId).run();
  await env.DB.prepare("DELETE FROM users WHERE id = ?").bind(userId).run();

  return json({ success: true }, corsHeaders);
}

// ═══════════════════════════════════════════════════════════
//  Multi-admin avec master admin transferable (C9, migration 0044)
//  Modèle : un seul master admin à la fois (contrainte applicative).
//  Lui seul peut promouvoir / rétrograder d'autres admins. Il peut
//  transférer son rôle master (action irréversible).
// ═══════════════════════════════════════════════════════════

async function requireMasterAdmin(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>,
): Promise<{ userId: string } | { error: Response }> {
  const token = extractToken(request);
  if (!token) return { error: json({ error: "Non authentifié" }, corsHeaders, 401) };
  const payload = await verifyJwt(token, env.JWT_SECRET);
  if (!payload || payload.role !== "admin") {
    return { error: json({ error: "Accès refusé : admin requis" }, corsHeaders, 403) };
  }
  try {
    const row = await env.DB
      .prepare("SELECT is_master_admin FROM users WHERE id = ?")
      .bind(payload.sub)
      .first<{ is_master_admin: number | null }>();
    if (row?.is_master_admin === 1) {
      return { userId: String(payload.sub) };
    }
  } catch { /* migration non appliquée → fail closed */ }
  return { error: json({ error: "Accès refusé : master admin requis" }, corsHeaders, 403) };
}

export async function handlePromoteAdmin(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>,
  userId: string,
) {
  const auth = await requireMasterAdmin(request, env, corsHeaders);
  if ("error" in auth) return auth.error;

  if (auth.userId === userId) {
    return json({ error: "Vous êtes déjà admin maître" }, corsHeaders, 400);
  }

  const target = await env.DB
    .prepare("SELECT id, role FROM users WHERE id = ? AND archived = 0")
    .bind(userId)
    .first<{ id: string; role: string }>();
  if (!target) return json({ error: "Utilisateur introuvable" }, corsHeaders, 404);
  if (target.role === "admin") {
    return json({ error: "Cet utilisateur est déjà admin" }, corsHeaders, 400);
  }

  await env.DB.prepare(
    "UPDATE users SET role = 'admin', approved = 1, is_master_admin = 0, updated_at = datetime('now') WHERE id = ?",
  ).bind(userId).run();

  try {
    await logAudit(
      env, request,
      { id: auth.userId, email: null, role: "admin" },
      "user.promote_admin",
      "users",
      userId,
      { role: target.role },
      { role: "admin", isMasterAdmin: false },
    );
  } catch { /* best-effort */ }

  return json({ success: true }, corsHeaders);
}

export async function handleDemoteAdmin(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>,
  userId: string,
) {
  const auth = await requireMasterAdmin(request, env, corsHeaders);
  if ("error" in auth) return auth.error;

  if (auth.userId === userId) {
    return json(
      { error: "Le master ne peut pas se rétrograder lui-même. Transférez d'abord le rôle master." },
      corsHeaders,
      400,
    );
  }

  const target = await env.DB
    .prepare("SELECT id, role, is_master_admin FROM users WHERE id = ? AND archived = 0")
    .bind(userId)
    .first<{ id: string; role: string; is_master_admin: number | null }>();
  if (!target) return json({ error: "Utilisateur introuvable" }, corsHeaders, 404);
  if (target.role !== "admin") {
    return json({ error: "Cet utilisateur n'est pas admin" }, corsHeaders, 400);
  }
  if (target.is_master_admin === 1) {
    return json(
      { error: "Cet utilisateur est l'admin maître, utilisez « transférer le rôle » d'abord" },
      corsHeaders,
      400,
    );
  }

  await env.DB.prepare(
    "UPDATE users SET role = 'staff', staff_permissions = NULL, is_master_admin = 0, updated_at = datetime('now') WHERE id = ?",
  ).bind(userId).run();

  try {
    await logAudit(
      env, request,
      { id: auth.userId, email: null, role: "admin" },
      "user.demote_admin",
      "users",
      userId,
      { role: "admin" },
      { role: "staff" },
    );
  } catch { /* best-effort */ }

  return json({ success: true }, corsHeaders);
}

export async function handleTransferMaster(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>,
  userId: string,
) {
  const auth = await requireMasterAdmin(request, env, corsHeaders);
  if ("error" in auth) return auth.error;

  if (auth.userId === userId) {
    return json({ error: "Vous êtes déjà le master admin" }, corsHeaders, 400);
  }

  const target = await env.DB
    .prepare("SELECT id, role FROM users WHERE id = ? AND archived = 0")
    .bind(userId)
    .first<{ id: string; role: string }>();
  if (!target) return json({ error: "Utilisateur introuvable" }, corsHeaders, 404);
  if (target.role !== "admin") {
    return json(
      { error: "La cible doit être admin secondaire avant le transfert" },
      corsHeaders,
      400,
    );
  }

  await env.DB.prepare(
    "UPDATE users SET is_master_admin = 0, updated_at = datetime('now') WHERE id = ?",
  ).bind(auth.userId).run();
  const res = await env.DB.prepare(
    "UPDATE users SET is_master_admin = 1, updated_at = datetime('now') WHERE id = ?",
  ).bind(userId).run();

  if (!res.success || (res.meta?.changes ?? 0) === 0) {
    await env.DB.prepare(
      "UPDATE users SET is_master_admin = 1 WHERE id = ?",
    ).bind(auth.userId).run();
    return json({ error: "Échec du transfert (rollback effectué)" }, corsHeaders, 500);
  }

  try {
    await logAudit(
      env, request,
      { id: auth.userId, email: null, role: "admin" },
      "user.transfer_master",
      "users",
      userId,
      { fromUserId: auth.userId },
      { toUserId: userId },
    );
  } catch { /* best-effort */ }

  return json({ success: true }, corsHeaders);
}
