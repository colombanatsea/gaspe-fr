/**
 * GASPE API Worker — Cloudflare Workers
 *
 * Deployment:
 *   npx wrangler deploy --config workers/wrangler.toml
 *
 * Bindings needed in wrangler.toml:
 *   - D1: DB (gaspe-db)
 *   - R2: UPLOADS (gaspe-uploads)
 *   - Environment: RESEND_API_KEY, CONTACT_EMAIL, JWT_SECRET
 *
 * Endpoints:
 *   POST /api/auth/register    — create account
 *   POST /api/auth/login       — authenticate → JWT cookie
 *   POST /api/auth/logout      — clear session
 *   GET  /api/auth/me          — current user from JWT
 *   GET  /api/auth/users       — admin: list all users
 *   PATCH /api/auth/users/:id  — admin: update/approve user
 *   DELETE /api/auth/users/:id — admin: reject/delete user
 *   POST /api/auth/forgot-password — request password reset email
 *   POST /api/auth/reset-password  — reset password with token
 *   POST /api/contact          — send contact email via Resend
 *   POST /api/newsletter       — subscribe to newsletter
 *   POST /api/upload           — upload CV/documents to R2
 *   GET  /api/health           — health check
 */

import { signJwt, verifyJwt } from "./jwt";

interface Env {
  DB: D1Database;
  UPLOADS: R2Bucket;
  RESEND_API_KEY: string;
  BREVO_API_KEY: string;
  CONTACT_EMAIL: string;
  JWT_SECRET: string;
}

// ── User type matching frontend User interface ──
interface DbUser {
  id: string;
  email: string;
  name: string;
  role: "admin" | "adherent" | "candidat";
  company: string | null;
  phone: string | null;
  approved: number;
  archived: number;
  company_role: string | null;
  company_description: string | null;
  company_logo: string | null;
  company_address: string | null;
  company_email: string | null;
  company_phone: string | null;
  current_position: string | null;
  desired_position: string | null;
  preferred_zone: string | null;
  experience: string | null;
  certifications: string | null;
  cv_filename: string | null;
  membership_status: string | null;
  created_at: string;
  updated_at: string;
}

/** Convert DB row → frontend User shape */
function toFrontendUser(row: DbUser) {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    company: row.company ?? undefined,
    phone: row.phone ?? undefined,
    approved: row.approved === 1,
    archived: row.archived === 1,
    companyRole: row.company_role ?? undefined,
    companyDescription: row.company_description ?? undefined,
    companyLogo: row.company_logo ?? undefined,
    companyAddress: row.company_address ?? undefined,
    companyEmail: row.company_email ?? undefined,
    companyPhone: row.company_phone ?? undefined,
    currentPosition: row.current_position ?? undefined,
    desiredPosition: row.desired_position ?? undefined,
    preferredZone: row.preferred_zone ?? undefined,
    experience: row.experience ?? undefined,
    certifications: row.certifications ?? undefined,
    cvFilename: row.cv_filename ?? undefined,
    membershipStatus: row.membership_status ?? undefined,
    createdAt: row.created_at,
  };
}

// ── CORS ──
function getCorsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get("Origin") ?? "";
  const allowedOrigins = [
    "https://gaspe-fr.pages.dev",
    "https://www.gaspe.fr",
    "https://gaspe.fr",
    "http://localhost:3001",
    "http://localhost:3000",
  ];
  const corsOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
  return {
    "Access-Control-Allow-Origin": corsOrigin,
    "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Credentials": "true",
  };
}

function json(data: unknown, headers: Record<string, string>, status = 200, extraHeaders?: Record<string, string>) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...headers, ...extraHeaders, "Content-Type": "application/json" },
  });
}

// ── Sanitize HTML to prevent XSS ──
function sanitize(str: string): string {
  return str.replace(/[<>&"']/g, (c) => {
    const map: Record<string, string> = { "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&#39;" };
    return map[c] ?? c;
  });
}

// ── bcrypt-compatible password hashing (Web Crypto) ──
// Uses PBKDF2 with 100k iterations for CF Worker compatibility
// (bcryptjs not available in Workers runtime)
async function hashPasswordServer(password: string): Promise<string> {
  const enc = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  const hash = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: 100_000, hash: "SHA-256" },
    keyMaterial,
    256,
  );
  // Store as: pbkdf2$iterations$salt_hex$hash_hex
  const saltHex = Array.from(salt).map((b) => b.toString(16).padStart(2, "0")).join("");
  const hashHex = Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
  return `pbkdf2$100000$${saltHex}$${hashHex}`;
}

async function verifyPasswordServer(password: string, stored: string): Promise<boolean> {
  // Handle legacy SHA-256 hashes (64 hex chars) — always accept for migration
  if (/^[a-f0-9]{64}$/.test(stored)) {
    // Legacy client-side hash — can't verify without email salt, reject
    // Users with legacy hashes should reset password
    return false;
  }

  const parts = stored.split("$");
  if (parts.length !== 4 || parts[0] !== "pbkdf2") return false;

  const iterations = parseInt(parts[1], 10);
  const saltHex = parts[2];
  const expectedHash = parts[3];

  const enc = new TextEncoder();
  const salt = new Uint8Array(saltHex.match(/.{2}/g)!.map((h) => parseInt(h, 16)));
  const keyMaterial = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  const hash = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations, hash: "SHA-256" },
    keyMaterial,
    256,
  );
  const hashHex = Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
  return hashHex === expectedHash;
}

// ── JWT from cookie or Authorization header ──
function extractToken(request: Request): string | null {
  // Try Authorization header first
  const authHeader = request.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }
  // Try cookie
  const cookie = request.headers.get("Cookie") ?? "";
  const match = cookie.match(/gaspe_token=([^;]+)/);
  return match?.[1] ?? null;
}

function setTokenCookie(token: string, corsHeaders: Record<string, string>): Record<string, string> {
  return {
    ...corsHeaders,
    "Set-Cookie": `gaspe_token=${token}; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=${7 * 24 * 3600}`,
  };
}

function clearTokenCookie(corsHeaders: Record<string, string>): Record<string, string> {
  return {
    ...corsHeaders,
    "Set-Cookie": "gaspe_token=; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=0",
  };
}

// ── Magic bytes validation for file uploads ──
const MAGIC_BYTES: Record<string, Uint8Array[]> = {
  "application/pdf": [new Uint8Array([0x25, 0x50, 0x44, 0x46])], // %PDF
  "application/msword": [new Uint8Array([0xd0, 0xcf, 0x11, 0xe0])], // OLE2
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
    new Uint8Array([0x50, 0x4b, 0x03, 0x04]), // PK (ZIP)
  ],
};

function validateMagicBytes(buffer: ArrayBuffer, declaredType: string): boolean {
  const signatures = MAGIC_BYTES[declaredType];
  if (!signatures) return false;
  const header = new Uint8Array(buffer.slice(0, 4));
  return signatures.some((sig) => sig.every((byte, i) => header[i] === byte));
}

// ═══════════════════════════════════════════════════════════
//  Main fetch handler
// ═══════════════════════════════════════════════════════════

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const corsHeaders = getCorsHeaders(request);

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // ── Health ──
      if (path === "/api/health") {
        return json({ status: "ok", timestamp: new Date().toISOString() }, corsHeaders);
      }

      // ── Auth routes ──
      if (path === "/api/auth/register" && request.method === "POST") {
        return handleRegister(request, env, corsHeaders);
      }
      if (path === "/api/auth/login" && request.method === "POST") {
        return handleLogin(request, env, corsHeaders);
      }
      if (path === "/api/auth/logout" && request.method === "POST") {
        return json({ success: true }, clearTokenCookie(corsHeaders));
      }
      if (path === "/api/auth/me" && request.method === "GET") {
        return handleMe(request, env, corsHeaders);
      }
      if (path === "/api/auth/users" && request.method === "GET") {
        return handleListUsers(request, env, corsHeaders);
      }
      if (path.startsWith("/api/auth/users/") && request.method === "PATCH") {
        const userId = path.split("/api/auth/users/")[1];
        return handleUpdateUser(request, env, corsHeaders, userId);
      }
      if (path.startsWith("/api/auth/users/") && request.method === "DELETE") {
        const userId = path.split("/api/auth/users/")[1];
        return handleDeleteUser(request, env, corsHeaders, userId);
      }

      // ── Password reset ──
      if (path === "/api/auth/forgot-password" && request.method === "POST") {
        return handleForgotPassword(request, env, corsHeaders);
      }
      if (path === "/api/auth/reset-password" && request.method === "POST") {
        return handleResetPassword(request, env, corsHeaders);
      }

      // ── Email (Brevo proxy) ──
      if (path === "/api/email" && request.method === "POST") {
        return handleEmail(request, env, corsHeaders);
      }

      // ── Contact ──
      if (path === "/api/contact" && request.method === "POST") {
        return handleContact(request, env, corsHeaders);
      }

      // ── Newsletter ──
      if (path === "/api/newsletter" && request.method === "POST") {
        return handleNewsletter(request, env, corsHeaders);
      }

      // ── Upload ──
      if (path === "/api/upload" && request.method === "POST") {
        return handleUpload(request, env, corsHeaders);
      }

      return json({ error: "Not found" }, corsHeaders, 404);
    } catch (err) {
      console.error("Worker error:", err);
      return json({ error: "Internal server error" }, corsHeaders, 500);
    }
  },
};

// ═══════════════════════════════════════════════════════════
//  Auth handlers
// ═══════════════════════════════════════════════════════════

async function handleRegister(request: Request, env: Env, corsHeaders: Record<string, string>) {
  const body = await request.json() as Record<string, string>;
  const { name, email, password, phone, role, company, currentPosition, desiredPosition } = body;

  // Validate required fields
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

  if (role === "adherent" && !company?.trim()) {
    return json({ error: "La compagnie est requise pour les adhérents" }, corsHeaders, 400);
  }

  // Check existing email
  const existing = await env.DB.prepare("SELECT id FROM users WHERE email = ? COLLATE NOCASE").bind(email.trim()).first();
  if (existing) {
    return json({ error: "Un compte existe déjà avec cet email" }, corsHeaders, 409);
  }

  const id = `${role}-${Date.now()}`;
  const approved = role === "candidat" ? 1 : 0;
  const passwordHash = await hashPasswordServer(password);

  // Insert user
  await env.DB.prepare(`
    INSERT INTO users (id, email, name, role, phone, company, approved, current_position, desired_position, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `).bind(
    id, email.trim(), sanitize(name.trim()), role,
    phone?.trim() ?? null, company?.trim() ?? null, approved,
    currentPosition?.trim() ?? null, desiredPosition?.trim() ?? null,
  ).run();

  // Insert password
  await env.DB.prepare("INSERT INTO auth (user_id, password_hash) VALUES (?, ?)").bind(id, passwordHash).run();

  // Auto-login for candidats
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

async function handleLogin(request: Request, env: Env, corsHeaders: Record<string, string>) {
  const body = await request.json() as Record<string, string>;
  const { email, password } = body;

  if (!email?.trim() || !password) {
    return json({ error: "Email et mot de passe requis" }, corsHeaders, 400);
  }

  const userRow = await env.DB.prepare("SELECT * FROM users WHERE email = ? COLLATE NOCASE").bind(email.trim()).first<DbUser>();
  if (!userRow) {
    return json({ error: "Aucun compte trouvé avec cet email." }, corsHeaders, 401);
  }

  const authRow = await env.DB.prepare("SELECT password_hash FROM auth WHERE user_id = ?").bind(userRow.id).first<{ password_hash: string }>();
  if (!authRow) {
    return json({ error: "Mot de passe incorrect." }, corsHeaders, 401);
  }

  const valid = await verifyPasswordServer(password, authRow.password_hash);
  if (!valid) {
    return json({ error: "Mot de passe incorrect." }, corsHeaders, 401);
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

async function handleMe(request: Request, env: Env, corsHeaders: Record<string, string>) {
  const token = extractToken(request);
  if (!token) {
    return json({ user: null }, corsHeaders, 401);
  }

  const payload = await verifyJwt(token, env.JWT_SECRET);
  if (!payload) {
    return json({ user: null }, clearTokenCookie(corsHeaders), 401);
  }

  const userRow = await env.DB.prepare("SELECT * FROM users WHERE id = ?").bind(payload.sub).first<DbUser>();
  if (!userRow) {
    return json({ user: null }, clearTokenCookie(corsHeaders), 401);
  }

  return json({ user: toFrontendUser(userRow) }, corsHeaders);
}

async function handleListUsers(request: Request, env: Env, corsHeaders: Record<string, string>) {
  const token = extractToken(request);
  if (!token) return json({ error: "Non authentifié" }, corsHeaders, 401);

  const payload = await verifyJwt(token, env.JWT_SECRET);
  if (!payload || payload.role !== "admin") {
    return json({ error: "Accès refusé" }, corsHeaders, 403);
  }

  const { results } = await env.DB.prepare("SELECT * FROM users ORDER BY created_at DESC").all<DbUser>();
  return json({ users: (results ?? []).map(toFrontendUser) }, corsHeaders);
}

async function handleUpdateUser(request: Request, env: Env, corsHeaders: Record<string, string>, userId: string) {
  const token = extractToken(request);
  if (!token) return json({ error: "Non authentifié" }, corsHeaders, 401);

  const payload = await verifyJwt(token, env.JWT_SECRET);
  if (!payload) return json({ error: "Token invalide" }, corsHeaders, 401);

  // Admin can update any user, users can only update themselves
  if (payload.role !== "admin" && payload.sub !== userId) {
    return json({ error: "Accès refusé" }, corsHeaders, 403);
  }

  const body = await request.json() as Record<string, unknown>;

  // Build dynamic update
  const updates: string[] = [];
  const values: unknown[] = [];

  const allowedFields: Record<string, string> = {
    name: "name", phone: "phone", company: "company",
    approved: "approved", archived: "archived",
    companyRole: "company_role", companyDescription: "company_description",
    companyLogo: "company_logo", companyAddress: "company_address",
    companyEmail: "company_email", companyPhone: "company_phone",
    currentPosition: "current_position", desiredPosition: "desired_position",
    preferredZone: "preferred_zone", experience: "experience",
    certifications: "certifications", cvFilename: "cv_filename",
    membershipStatus: "membership_status",
  };

  // Non-admin users can't change role, approved, archived
  const adminOnly = ["approved", "archived", "role"];

  for (const [frontendKey, dbCol] of Object.entries(allowedFields)) {
    if (frontendKey in body) {
      if (adminOnly.includes(frontendKey) && payload.role !== "admin") continue;
      updates.push(`${dbCol} = ?`);
      // Convert booleans to integers for SQLite
      const val = body[frontendKey];
      values.push(typeof val === "boolean" ? (val ? 1 : 0) : val);
    }
  }

  if (updates.length === 0) {
    return json({ error: "Aucun champ à mettre à jour" }, corsHeaders, 400);
  }

  updates.push("updated_at = datetime('now')");
  values.push(userId);

  await env.DB.prepare(`UPDATE users SET ${updates.join(", ")} WHERE id = ?`).bind(...values).run();

  const userRow = await env.DB.prepare("SELECT * FROM users WHERE id = ?").bind(userId).first<DbUser>();
  return json({ success: true, user: userRow ? toFrontendUser(userRow) : null }, corsHeaders);
}

async function handleDeleteUser(request: Request, env: Env, corsHeaders: Record<string, string>, userId: string) {
  const token = extractToken(request);
  if (!token) return json({ error: "Non authentifié" }, corsHeaders, 401);

  const payload = await verifyJwt(token, env.JWT_SECRET);
  if (!payload || payload.role !== "admin") {
    return json({ error: "Accès refusé" }, corsHeaders, 403);
  }

  // Prevent deleting self
  if (payload.sub === userId) {
    return json({ error: "Impossible de supprimer votre propre compte" }, corsHeaders, 400);
  }

  await env.DB.prepare("DELETE FROM auth WHERE user_id = ?").bind(userId).run();
  await env.DB.prepare("DELETE FROM users WHERE id = ?").bind(userId).run();

  return json({ success: true }, corsHeaders);
}

// ═══════════════════════════════════════════════════════════
//  Password reset
// ═══════════════════════════════════════════════════════════

const SITE_URL = "https://gaspe-fr.pages.dev";

async function handleForgotPassword(request: Request, env: Env, corsHeaders: Record<string, string>) {
  const body = await request.json() as Record<string, string>;
  const email = body.email?.trim();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ error: "Email invalide" }, corsHeaders, 400);
  }

  const userRow = await env.DB.prepare("SELECT id, name, email FROM users WHERE email = ? COLLATE NOCASE").bind(email).first<{ id: string; name: string; email: string }>();

  // Always return success to prevent email enumeration
  if (!userRow) {
    return json({ success: true }, corsHeaders);
  }

  // Delete any existing tokens for this user
  await env.DB.prepare("DELETE FROM password_reset_tokens WHERE user_id = ?").bind(userRow.id).run();

  // Generate secure token (32 bytes → 64 hex chars)
  const tokenBytes = crypto.getRandomValues(new Uint8Array(32));
  const token = Array.from(tokenBytes).map((b) => b.toString(16).padStart(2, "0")).join("");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

  await env.DB.prepare(
    "INSERT INTO password_reset_tokens (token, user_id, expires_at) VALUES (?, ?, ?)",
  ).bind(token, userRow.id, expiresAt).run();

  // Send reset email via Brevo
  if (env.BREVO_API_KEY) {
    const resetUrl = `${SITE_URL}/reinitialiser-mot-de-passe?token=${token}`;
    await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "accept": "application/json",
        "content-type": "application/json",
        "api-key": env.BREVO_API_KEY,
      },
      body: JSON.stringify({
        sender: { name: "GASPE", email: "ne-pas-repondre@gaspe.fr" },
        to: [{ email: userRow.email, name: userRow.name }],
        subject: "Réinitialisation de votre mot de passe GASPE",
        htmlContent: `
          <!DOCTYPE html>
          <html lang="fr">
          <head><meta charset="utf-8"></head>
          <body style="margin:0;padding:0;background:#F5F3F0;font-family:'DM Sans',Helvetica,sans-serif;">
            <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;margin-top:24px;margin-bottom:24px;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
              <div style="background:#1B7E8A;padding:24px 32px;text-align:center;">
                <h1 style="margin:0;color:#fff;font-family:'Exo 2',Helvetica,sans-serif;font-size:24px;">GASPE</h1>
                <p style="margin:4px 0 0;color:#B2DFE3;font-family:'DM Sans',Helvetica,sans-serif;font-size:13px;">Localement ancrés. Socialement engagés.</p>
              </div>
              <div style="padding:32px;">
                <h2 style="margin:0 0 16px;color:#222221;font-family:'Exo 2',Helvetica,sans-serif;font-size:20px;">Réinitialisation du mot de passe</h2>
                <p style="margin:0 0 12px;color:#222221;font-size:15px;">Bonjour ${sanitize(userRow.name)},</p>
                <p style="margin:0 0 12px;color:#222221;font-size:15px;">Vous avez demandé la réinitialisation de votre mot de passe. Cliquez sur le bouton ci-dessous pour en choisir un nouveau :</p>
                <p style="margin:24px 0;">
                  <a href="${resetUrl}" style="display:inline-block;background:#1B7E8A;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-family:'Exo 2',Helvetica,sans-serif;font-size:14px;">
                    Réinitialiser mon mot de passe
                  </a>
                </p>
                <p style="margin:0 0 8px;color:#6B6560;font-size:13px;">Ce lien est valide pendant 1 heure.</p>
                <p style="margin:0;color:#6B6560;font-size:13px;">Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>
              </div>
              <div style="margin-top:32px;padding:16px 32px;border-top:1px solid #DCD5CC;text-align:center;font-family:'DM Sans',Helvetica,sans-serif;font-size:12px;color:#6B6560;">
                <p style="margin:0;">GASPE — Groupement des Armateurs de Services Publics Maritimes de Passages d'Eau</p>
              </div>
            </div>
          </body>
          </html>
        `,
        textContent: `Bonjour ${userRow.name}, réinitialisez votre mot de passe GASPE : ${resetUrl} (lien valide 1 heure).`,
      }),
    });
  }

  return json({ success: true }, corsHeaders);
}

async function handleResetPassword(request: Request, env: Env, corsHeaders: Record<string, string>) {
  const body = await request.json() as Record<string, string>;
  const { token, password } = body;

  if (!token || !password) {
    return json({ error: "Token et mot de passe requis" }, corsHeaders, 400);
  }

  if (password.length < 6) {
    return json({ error: "Le mot de passe doit contenir au moins 6 caractères" }, corsHeaders, 400);
  }

  // Find valid, unused token
  const resetRow = await env.DB.prepare(
    "SELECT token, user_id, expires_at, used FROM password_reset_tokens WHERE token = ?",
  ).bind(token).first<{ token: string; user_id: string; expires_at: string; used: number }>();

  if (!resetRow) {
    return json({ error: "Lien de réinitialisation invalide ou expiré" }, corsHeaders, 400);
  }

  if (resetRow.used === 1) {
    return json({ error: "Ce lien a déjà été utilisé" }, corsHeaders, 400);
  }

  if (new Date(resetRow.expires_at) < new Date()) {
    return json({ error: "Ce lien a expiré. Veuillez en demander un nouveau." }, corsHeaders, 400);
  }

  // Hash new password and update
  const passwordHash = await hashPasswordServer(password);
  await env.DB.prepare("UPDATE auth SET password_hash = ? WHERE user_id = ?").bind(passwordHash, resetRow.user_id).run();

  // Mark token as used
  await env.DB.prepare("UPDATE password_reset_tokens SET used = 1 WHERE token = ?").bind(token).run();

  // Clean up expired tokens
  await env.DB.prepare("DELETE FROM password_reset_tokens WHERE expires_at < datetime('now')").run();

  return json({ success: true }, corsHeaders);
}

// ═══════════════════════════════════════════════════════════
//  Email sending → Brevo proxy
// ═══════════════════════════════════════════════════════════

async function handleEmail(request: Request, env: Env, corsHeaders: Record<string, string>) {
  if (!env.BREVO_API_KEY) {
    return json({ error: "Clé API Brevo non configurée sur le serveur" }, corsHeaders, 500);
  }

  const body = await request.json() as {
    to: { email: string; name?: string }[];
    subject: string;
    htmlContent: string;
    textContent?: string;
    sender?: { name: string; email: string };
  };

  if (!body.to?.length || !body.subject || !body.htmlContent) {
    return json({ error: "Champs requis: to, subject, htmlContent" }, corsHeaders, 400);
  }

  // Validate email addresses
  for (const recipient of body.to) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient.email)) {
      return json({ error: `Email invalide: ${recipient.email}` }, corsHeaders, 400);
    }
  }

  const sender = body.sender ?? { name: "GASPE", email: "ne-pas-repondre@gaspe.fr" };

  try {
    const brevoRes = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "accept": "application/json",
        "content-type": "application/json",
        "api-key": env.BREVO_API_KEY,
      },
      body: JSON.stringify({
        sender,
        to: body.to,
        subject: body.subject,
        htmlContent: body.htmlContent,
        textContent: body.textContent,
      }),
    });

    if (!brevoRes.ok) {
      const err = await brevoRes.json().catch(() => ({})) as { message?: string };
      console.error("[Brevo] Error:", err);
      return json({ error: err.message ?? `Brevo HTTP ${brevoRes.status}` }, corsHeaders, 502);
    }

    return json({ success: true }, corsHeaders);
  } catch (err) {
    console.error("[Brevo] Network error:", err);
    return json({ error: "Erreur de connexion à Brevo" }, corsHeaders, 502);
  }
}

// ═══════════════════════════════════════════════════════════
//  Contact form → Resend email
// ═══════════════════════════════════════════════════════════

async function handleContact(request: Request, env: Env, corsHeaders: Record<string, string>) {
  const body = await request.json() as Record<string, string>;
  const nom = sanitize((body.nom ?? "").trim());
  const email = (body.email ?? "").trim();
  const societe = sanitize((body.societe ?? "").trim());
  const sujet = sanitize((body.sujet ?? "").trim());
  const message = sanitize((body.message ?? "").trim());

  if (!nom || !email || !sujet || !message) {
    return json({ error: "Champs requis manquants" }, corsHeaders, 400);
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ error: "Email invalide" }, corsHeaders, 400);
  }

  if (nom.length > 200 || email.length > 200 || message.length > 5000) {
    return json({ error: "Contenu trop long" }, corsHeaders, 400);
  }

  await env.DB.prepare(
    "INSERT INTO contact_messages (id, nom, email, societe, sujet, message) VALUES (?, ?, ?, ?, ?, ?)",
  ).bind(crypto.randomUUID(), nom, email, societe ?? "", sujet, message).run();

  if (env.RESEND_API_KEY) {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "GASPE <noreply@gaspe.fr>",
        to: env.CONTACT_EMAIL || "contact@gaspe.fr",
        reply_to: email,
        subject: `[Contact GASPE] ${sujet}`,
        html: `
          <h2>Nouveau message de contact</h2>
          <p><strong>Nom :</strong> ${nom}</p>
          <p><strong>Email :</strong> ${sanitize(email)}</p>
          ${societe ? `<p><strong>Société :</strong> ${societe}</p>` : ""}
          <p><strong>Sujet :</strong> ${sujet}</p>
          <hr/>
          <p>${message.replace(/\n/g, "<br/>")}</p>
        `,
      }),
    });
  }

  return json({ success: true }, corsHeaders);
}

// ═══════════════════════════════════════════════════════════
//  Newsletter subscription
// ═══════════════════════════════════════════════════════════

async function handleNewsletter(request: Request, env: Env, corsHeaders: Record<string, string>) {
  const body = await request.json() as Record<string, string>;
  const { email } = body;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ error: "Email invalide" }, corsHeaders, 400);
  }

  await env.DB.prepare("INSERT OR IGNORE INTO newsletter (email) VALUES (?)").bind(email).run();

  return json({ success: true }, corsHeaders);
}

// ═══════════════════════════════════════════════════════════
//  File upload → R2 with magic bytes validation
// ═══════════════════════════════════════════════════════════

async function handleUpload(request: Request, env: Env, corsHeaders: Record<string, string>) {
  const formData = await request.formData();
  const file = formData.get("file") as File;
  const type = formData.get("type") as string; // "cv" | "document"

  if (!file) {
    return json({ error: "Aucun fichier fourni" }, corsHeaders, 400);
  }

  // Validate MIME type
  const allowed = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];
  if (!allowed.includes(file.type)) {
    return json({ error: "Type de fichier non autorisé (PDF, DOC, DOCX uniquement)" }, corsHeaders, 400);
  }

  // Max 10MB
  if (file.size > 10 * 1024 * 1024) {
    return json({ error: "Fichier trop volumineux (max 10 Mo)" }, corsHeaders, 400);
  }

  // Magic bytes validation — read first 4 bytes to verify actual file type
  const buffer = await file.arrayBuffer();
  if (!validateMagicBytes(buffer, file.type)) {
    return json(
      { error: "Le contenu du fichier ne correspond pas au type déclaré. Fichier refusé." },
      corsHeaders,
      400,
    );
  }

  const key = `${type || "document"}/${crypto.randomUUID()}-${file.name}`;
  await env.UPLOADS.put(key, buffer, {
    httpMetadata: { contentType: file.type },
    customMetadata: { originalName: file.name, uploadedAt: new Date().toISOString() },
  });

  return json({ success: true, key, filename: file.name }, corsHeaders);
}
