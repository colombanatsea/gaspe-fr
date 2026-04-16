/**
 * GASPE API Worker — Cloudflare Workers
 *
 * Deployment:
 *   npx wrangler deploy --config workers/wrangler.toml
 *
 * Bindings needed in wrangler.toml:
 *   - D1: DB (gaspe-db)
 *   - R2: UPLOADS (gaspe-uploads)
 *   - Environment: BREVO_API_KEY, CONTACT_EMAIL, JWT_SECRET
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
 *   GET  /api/organizations       — list all organizations
 *   GET  /api/organizations/:id   — org details + contacts
 *   PATCH /api/organizations/:id  — update org (primary/admin)
 *   POST /api/organizations/:id/invite — invite contact (primary/admin)
 *   GET  /api/organizations/:id/invitations — list invitations
 *   POST /api/invitations/:token/accept — accept invitation
 *   GET  /api/preferences         — get newsletter preferences
 *   PATCH /api/preferences        — update newsletter preferences
 *   POST /api/contact          — send contact email via Brevo
 *   POST /api/newsletter       — subscribe to newsletter
 *   POST /api/newsletter/send  — admin: bulk send newsletter by category
 *   POST /api/hydros/publish   — publish offer to Hydros Alumni (JWT auth)
 *   POST /api/upload           — upload CV/documents to R2
 *   GET  /api/health           — health check
 */

import { signJwt, verifyJwt } from "./jwt";

interface Env {
  DB: D1Database;
  UPLOADS: R2Bucket;
  HYDROS_EMAIL?: string;
  HYDROS_PASSWORD?: string;
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
  organization_id: string | null;
  is_primary: number;
  invited_by: string | null;
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
    organizationId: row.organization_id ?? undefined,
    isPrimary: row.is_primary === 1,
    invitedBy: row.invited_by ?? undefined,
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

      // ── Organizations ──
      if (path === "/api/organizations" && request.method === "GET") {
        return handleListOrganizations(env, corsHeaders);
      }
      if (path.match(/^\/api\/organizations\/[^/]+$/) && request.method === "GET") {
        const orgId = path.split("/api/organizations/")[1];
        return handleGetOrganization(request, env, corsHeaders, orgId);
      }
      if (path.match(/^\/api\/organizations\/[^/]+$/) && request.method === "PATCH") {
        const orgId = path.split("/api/organizations/")[1];
        return handleUpdateOrganization(request, env, corsHeaders, orgId);
      }
      if (path.match(/^\/api\/organizations\/[^/]+\/invite$/) && request.method === "POST") {
        const orgId = path.replace("/api/organizations/", "").replace("/invite", "");
        return handleInviteContact(request, env, corsHeaders, orgId);
      }
      if (path.match(/^\/api\/organizations\/[^/]+\/invitations$/) && request.method === "GET") {
        const orgId = path.replace("/api/organizations/", "").replace("/invitations", "");
        return handleListInvitations(request, env, corsHeaders, orgId);
      }
      if (path.match(/^\/api\/invitations\/[^/]+\/accept$/) && request.method === "POST") {
        const token = path.replace("/api/invitations/", "").replace("/accept", "");
        return handleAcceptInvitation(request, env, corsHeaders, token);
      }

      // ── Newsletter Preferences ──
      if (path === "/api/preferences" && request.method === "GET") {
        return handleGetPreferences(request, env, corsHeaders);
      }
      if (path === "/api/preferences" && request.method === "PATCH") {
        return handleUpdatePreferences(request, env, corsHeaders);
      }

      // ── Contact ──
      if (path === "/api/contact" && request.method === "POST") {
        return handleContact(request, env, corsHeaders);
      }

      // ── Newsletter ──
      if (path === "/api/newsletter" && request.method === "POST") {
        return handleNewsletter(request, env, corsHeaders);
      }
      if (path === "/api/newsletter/send" && request.method === "POST") {
        return handleNewsletterSend(request, env, corsHeaders);
      }

      // ── Hydros Alumni cross-publication ──
      if (path === "/api/hydros/publish" && request.method === "POST") {
        return handleHydrosPublish(request, env, corsHeaders);
      }

      // ── Upload ──
      if (path === "/api/upload" && request.method === "POST") {
        return handleUpload(request, env, corsHeaders);
      }

      // ── CMS Pages ──
      if (path === "/api/cms/pages" && request.method === "GET") {
        return handleCmsGetPages(env, corsHeaders);
      }
      if (path === "/api/cms/pages" && request.method === "PUT") {
        return handleCmsSavePage(request, env, corsHeaders);
      }

      // ── Job Offers (admin/adherent CRUD) ──
      if (path === "/api/jobs" && request.method === "GET") {
        return handleListJobs(env, corsHeaders);
      }
      if (path === "/api/jobs" && request.method === "POST") {
        return handleCreateJob(request, env, corsHeaders);
      }
      if (path.match(/^\/api\/jobs\/[^/]+$/) && request.method === "PATCH") {
        const jobId = path.split("/api/jobs/")[1];
        return handleUpdateJob(request, env, corsHeaders, jobId);
      }
      if (path.match(/^\/api\/jobs\/[^/]+$/) && request.method === "DELETE") {
        const jobId = path.split("/api/jobs/")[1];
        return handleDeleteJob(request, env, corsHeaders, jobId);
      }

      // ── Medical Visits ──
      if (path === "/api/medical-visits" && request.method === "GET") {
        return handleListMedicalVisits(request, env, corsHeaders);
      }
      if (path === "/api/medical-visits" && request.method === "POST") {
        return handleCreateMedicalVisit(request, env, corsHeaders);
      }
      if (path.match(/^\/api\/medical-visits\/[^/]+$/) && request.method === "PATCH") {
        const visitId = path.split("/api/medical-visits/")[1];
        return handleUpdateMedicalVisit(request, env, corsHeaders, visitId);
      }
      if (path.match(/^\/api\/medical-visits\/[^/]+$/) && request.method === "DELETE") {
        const visitId = path.split("/api/medical-visits/")[1];
        return handleDeleteMedicalVisit(request, env, corsHeaders, visitId);
      }

      // ── Media Library ──
      if (path === "/api/media" && request.method === "GET") {
        return handleListMedia(request, env, corsHeaders);
      }
      if (path === "/api/media" && request.method === "POST") {
        return handleUploadMedia(request, env, corsHeaders);
      }
      if (path.match(/^\/api\/media\/[^/]+$/) && request.method === "DELETE") {
        const mediaId = path.split("/api/media/")[1];
        return handleDeleteMedia(request, env, corsHeaders, mediaId);
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

  // For adherents: link to organization and detect if first contact (becomes primary/responsable)
  let organizationId: string | null = null;
  let isPrimary = 0;
  if (role === "adherent" && company?.trim()) {
    const org = await env.DB.prepare("SELECT id FROM organizations WHERE name = ? COLLATE NOCASE").bind(company.trim()).first<{ id: string }>();
    if (org) {
      organizationId = org.id;
      // Check if this org already has an approved primary contact
      const existingPrimary = await env.DB.prepare(
        "SELECT id FROM users WHERE organization_id = ? AND is_primary = 1 AND archived = 0"
      ).bind(org.id).first();
      if (!existingPrimary) {
        isPrimary = 1; // First contact becomes responsable
      }
    }
  }

  // Insert user
  await env.DB.prepare(`
    INSERT INTO users (id, email, name, role, phone, company, approved, organization_id, is_primary, current_position, desired_position, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `).bind(
    id, email.trim(), sanitize(name.trim()), role,
    phone?.trim() ?? null, company?.trim() ?? null, approved,
    organizationId, isPrimary,
    currentPosition?.trim() ?? null, desiredPosition?.trim() ?? null,
  ).run();

  // Insert password
  await env.DB.prepare("INSERT INTO auth (user_id, password_hash) VALUES (?, ?)").bind(id, passwordHash).run();

  // Create default newsletter preferences
  await env.DB.prepare("INSERT INTO newsletter_preferences (user_id) VALUES (?)").bind(id).run();

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
  // Require authentication to prevent open relay abuse
  const token = extractToken(request);
  if (!token) return json({ error: "Non authentifié" }, corsHeaders, 401);
  const payload = await verifyJwt(token, env.JWT_SECRET);
  if (!payload) return json({ error: "Token invalide" }, corsHeaders, 401);

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
//  Organizations
// ═══════════════════════════════════════════════════════════

interface DbOrganization {
  id: string; slug: string; name: string; category: string;
  territory: string | null; region: string | null; city: string | null;
  latitude: number | null; longitude: number | null;
  logo_url: string | null; website_url: string | null;
  address: string | null; email: string | null; phone: string | null;
  description: string | null;
  employee_count: number | null; ship_count: number | null;
  membership_status: string | null;
  created_at: string; updated_at: string;
}

function toFrontendOrg(row: DbOrganization) {
  return {
    id: row.id, slug: row.slug, name: row.name, category: row.category,
    territory: row.territory ?? undefined, region: row.region ?? undefined,
    city: row.city ?? undefined,
    latitude: row.latitude ?? undefined, longitude: row.longitude ?? undefined,
    logoUrl: row.logo_url ?? undefined, websiteUrl: row.website_url ?? undefined,
    address: row.address ?? undefined, email: row.email ?? undefined,
    phone: row.phone ?? undefined, description: row.description ?? undefined,
    employeeCount: row.employee_count ?? undefined, shipCount: row.ship_count ?? undefined,
    membershipStatus: row.membership_status ?? undefined,
    createdAt: row.created_at, updatedAt: row.updated_at,
  };
}

async function handleListOrganizations(env: Env, corsHeaders: Record<string, string>) {
  const { results } = await env.DB.prepare("SELECT * FROM organizations ORDER BY name").all<DbOrganization>();
  return json({ organizations: (results ?? []).map(toFrontendOrg) }, corsHeaders);
}

async function handleGetOrganization(request: Request, env: Env, corsHeaders: Record<string, string>, orgId: string) {
  const token = extractToken(request);
  if (!token) return json({ error: "Non authentifié" }, corsHeaders, 401);
  const payload = await verifyJwt(token, env.JWT_SECRET);
  if (!payload) return json({ error: "Token invalide" }, corsHeaders, 401);

  const org = await env.DB.prepare("SELECT * FROM organizations WHERE id = ?").bind(orgId).first<DbOrganization>();
  if (!org) return json({ error: "Organisation introuvable" }, corsHeaders, 404);

  const { results } = await env.DB.prepare(
    "SELECT * FROM users WHERE organization_id = ? AND archived = 0 ORDER BY is_primary DESC, name"
  ).bind(orgId).all<DbUser>();

  return json({
    organization: toFrontendOrg(org),
    contacts: (results ?? []).map(toFrontendUser),
  }, corsHeaders);
}

async function handleUpdateOrganization(request: Request, env: Env, corsHeaders: Record<string, string>, orgId: string) {
  const token = extractToken(request);
  if (!token) return json({ error: "Non authentifié" }, corsHeaders, 401);
  const payload = await verifyJwt(token, env.JWT_SECRET);
  if (!payload) return json({ error: "Token invalide" }, corsHeaders, 401);

  // Only admin or primary contact of this org can update
  if (payload.role !== "admin") {
    const user = await env.DB.prepare("SELECT is_primary, organization_id FROM users WHERE id = ?").bind(payload.sub).first<{ is_primary: number; organization_id: string | null }>();
    if (!user || user.organization_id !== orgId || user.is_primary !== 1) {
      return json({ error: "Accès refusé" }, corsHeaders, 403);
    }
  }

  const body = await request.json() as Record<string, unknown>;
  const allowedFields: Record<string, string> = {
    logoUrl: "logo_url", websiteUrl: "website_url", address: "address",
    email: "email", phone: "phone", description: "description",
    employeeCount: "employee_count", shipCount: "ship_count",
    membershipStatus: "membership_status",
  };

  const updates: string[] = [];
  const values: unknown[] = [];
  for (const [frontendKey, dbCol] of Object.entries(allowedFields)) {
    if (frontendKey in body) {
      // membershipStatus can only be changed by admin
      if (frontendKey === "membershipStatus" && payload.role !== "admin") continue;
      updates.push(`${dbCol} = ?`);
      values.push(body[frontendKey]);
    }
  }

  if (updates.length === 0) return json({ error: "Aucun champ à mettre à jour" }, corsHeaders, 400);
  updates.push("updated_at = datetime('now')");
  values.push(orgId);

  await env.DB.prepare(`UPDATE organizations SET ${updates.join(", ")} WHERE id = ?`).bind(...values).run();
  return json({ success: true }, corsHeaders);
}

// ═══════════════════════════════════════════════════════════
//  Invitations
// ═══════════════════════════════════════════════════════════

async function handleInviteContact(request: Request, env: Env, corsHeaders: Record<string, string>, orgId: string) {
  const token = extractToken(request);
  if (!token) return json({ error: "Non authentifié" }, corsHeaders, 401);
  const payload = await verifyJwt(token, env.JWT_SECRET);
  if (!payload) return json({ error: "Token invalide" }, corsHeaders, 401);

  // Only primary contact or admin can invite
  if (payload.role !== "admin") {
    const user = await env.DB.prepare("SELECT is_primary, organization_id FROM users WHERE id = ?").bind(payload.sub).first<{ is_primary: number; organization_id: string | null }>();
    if (!user || user.organization_id !== orgId || user.is_primary !== 1) {
      return json({ error: "Seul le responsable de la compagnie peut inviter" }, corsHeaders, 403);
    }
  }

  const body = await request.json() as Record<string, string>;
  const { email, name, orgRole } = body;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ error: "Email invalide" }, corsHeaders, 400);
  }

  // Check if email is already registered
  const existing = await env.DB.prepare("SELECT id FROM users WHERE email = ? COLLATE NOCASE").bind(email.trim()).first();
  if (existing) {
    return json({ error: "Un compte existe déjà avec cet email" }, corsHeaders, 409);
  }

  // Check if invitation already pending
  const pendingInvite = await env.DB.prepare(
    "SELECT id FROM invitations WHERE email = ? COLLATE NOCASE AND organization_id = ? AND accepted = 0 AND expires_at > datetime('now')"
  ).bind(email.trim(), orgId).first();
  if (pendingInvite) {
    return json({ error: "Une invitation est déjà en cours pour cet email" }, corsHeaders, 409);
  }

  // Generate invitation token
  const tokenBytes = crypto.getRandomValues(new Uint8Array(32));
  const inviteToken = Array.from(tokenBytes).map((b) => b.toString(16).padStart(2, "0")).join("");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days
  const inviteId = `invite-${Date.now()}`;

  await env.DB.prepare(
    "INSERT INTO invitations (id, organization_id, invited_by, email, name, org_role, token, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
  ).bind(inviteId, orgId, payload.sub, email.trim(), name?.trim() ?? null, orgRole ?? null, inviteToken, expiresAt).run();

  // Send invitation email via Brevo
  if (env.BREVO_API_KEY) {
    const org = await env.DB.prepare("SELECT name FROM organizations WHERE id = ?").bind(orgId).first<{ name: string }>();
    const inviter = await env.DB.prepare("SELECT name FROM users WHERE id = ?").bind(payload.sub).first<{ name: string }>();
    const inviteUrl = `${SITE_URL}/inscription/invitation?token=${inviteToken}`;

    await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { "accept": "application/json", "content-type": "application/json", "api-key": env.BREVO_API_KEY },
      body: JSON.stringify({
        sender: { name: "GASPE", email: "ne-pas-repondre@gaspe.fr" },
        to: [{ email: email.trim(), name: name?.trim() ?? email }],
        subject: `Invitation à rejoindre ${org?.name ?? "votre compagnie"} sur GASPE`,
        htmlContent: `
          <!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"></head>
          <body style="margin:0;padding:0;background:#F5F3F0;font-family:'DM Sans',Helvetica,sans-serif;">
          <div style="max-width:600px;margin:24px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
            <div style="background:#1B7E8A;padding:24px 32px;text-align:center;">
              <h1 style="margin:0;color:#fff;font-family:'Exo 2',Helvetica,sans-serif;font-size:24px;">GASPE</h1>
            </div>
            <div style="padding:32px;">
              <h2 style="margin:0 0 16px;color:#222221;font-size:20px;">Vous êtes invité(e)</h2>
              <p style="color:#222221;font-size:15px;">${sanitize(inviter?.name ?? "Un responsable")} vous invite à rejoindre l'espace <strong>${sanitize(org?.name ?? "")}</strong> sur la plateforme GASPE.</p>
              <p style="margin:24px 0;"><a href="${inviteUrl}" style="display:inline-block;background:#1B7E8A;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">Accepter l'invitation</a></p>
              <p style="color:#6B6560;font-size:13px;">Ce lien est valide pendant 7 jours.</p>
            </div>
          </div></body></html>`,
        textContent: `Vous êtes invité(e) à rejoindre ${org?.name ?? ""} sur GASPE. Acceptez l'invitation : ${inviteUrl}`,
      }),
    });
  }

  return json({ success: true }, corsHeaders);
}

async function handleListInvitations(request: Request, env: Env, corsHeaders: Record<string, string>, orgId: string) {
  const token = extractToken(request);
  if (!token) return json({ error: "Non authentifié" }, corsHeaders, 401);
  const payload = await verifyJwt(token, env.JWT_SECRET);
  if (!payload) return json({ error: "Token invalide" }, corsHeaders, 401);

  const { results } = await env.DB.prepare(
    "SELECT * FROM invitations WHERE organization_id = ? ORDER BY created_at DESC"
  ).bind(orgId).all();

  return json({ invitations: results ?? [] }, corsHeaders);
}

async function handleAcceptInvitation(request: Request, env: Env, corsHeaders: Record<string, string>, inviteToken: string) {
  const invite = await env.DB.prepare(
    "SELECT * FROM invitations WHERE token = ? AND accepted = 0"
  ).bind(inviteToken).first<{ id: string; organization_id: string; email: string; name: string | null; org_role: string | null; expires_at: string }>();

  if (!invite) return json({ error: "Invitation invalide ou déjà utilisée" }, corsHeaders, 400);
  if (new Date(invite.expires_at) < new Date()) return json({ error: "Cette invitation a expiré" }, corsHeaders, 400);

  const body = await request.json() as Record<string, string>;
  const { name, password, phone } = body;

  if (!name?.trim() || !password || password.length < 6) {
    return json({ error: "Nom et mot de passe (6+ caractères) requis" }, corsHeaders, 400);
  }

  // Check email not already registered
  const existing = await env.DB.prepare("SELECT id FROM users WHERE email = ? COLLATE NOCASE").bind(invite.email).first();
  if (existing) return json({ error: "Un compte existe déjà avec cet email" }, corsHeaders, 409);

  const userId = `adherent-${Date.now()}`;
  const passwordHash = await hashPasswordServer(password);

  // Create user, pre-approved and linked to organization
  await env.DB.prepare(`
    INSERT INTO users (id, email, name, role, phone, company, approved, organization_id, is_primary, invited_by, company_role, created_at, updated_at)
    VALUES (?, ?, ?, 'adherent', ?, (SELECT name FROM organizations WHERE id = ?), 1, ?, 0, ?, ?, datetime('now'), datetime('now'))
  `).bind(
    userId, invite.email, sanitize(name.trim()), phone?.trim() ?? null,
    invite.organization_id, invite.organization_id, invite.id, invite.org_role ?? null,
  ).run();

  await env.DB.prepare("INSERT INTO auth (user_id, password_hash) VALUES (?, ?)").bind(userId, passwordHash).run();

  // Create default newsletter preferences
  await env.DB.prepare("INSERT INTO newsletter_preferences (user_id) VALUES (?)").bind(userId).run();

  // Mark invitation as accepted
  await env.DB.prepare("UPDATE invitations SET accepted = 1 WHERE id = ?").bind(invite.id).run();

  // Auto-login
  const jwtToken = await signJwt({ sub: userId, email: invite.email, role: "adherent" }, env.JWT_SECRET);
  const userRow = await env.DB.prepare("SELECT * FROM users WHERE id = ?").bind(userId).first<DbUser>();

  return json(
    { success: true, token: jwtToken, user: userRow ? toFrontendUser(userRow) : null },
    setTokenCookie(jwtToken, corsHeaders),
  );
}

// ═══════════════════════════════════════════════════════════
//  Newsletter Preferences
// ═══════════════════════════════════════════════════════════

const NEWSLETTER_COLUMNS = [
  "info_generales", "ag", "emploi", "formation_opco",
  "veille_juridique", "veille_sociale", "veille_surete",
  "veille_environnement", "communication_marque", "actualites_gaspe",
] as const;

async function handleGetPreferences(request: Request, env: Env, corsHeaders: Record<string, string>) {
  const token = extractToken(request);
  if (!token) return json({ error: "Non authentifié" }, corsHeaders, 401);
  const payload = await verifyJwt(token, env.JWT_SECRET);
  if (!payload) return json({ error: "Token invalide" }, corsHeaders, 401);

  let row = await env.DB.prepare("SELECT * FROM newsletter_preferences WHERE user_id = ?").bind(payload.sub).first();
  if (!row) {
    // Create default preferences
    await env.DB.prepare("INSERT INTO newsletter_preferences (user_id) VALUES (?)").bind(payload.sub).run();
    row = await env.DB.prepare("SELECT * FROM newsletter_preferences WHERE user_id = ?").bind(payload.sub).first();
  }

  const prefs: Record<string, boolean> = {};
  for (const col of NEWSLETTER_COLUMNS) {
    prefs[col] = (row as Record<string, unknown>)?.[col] === 1;
  }

  return json({ preferences: prefs }, corsHeaders);
}

async function handleUpdatePreferences(request: Request, env: Env, corsHeaders: Record<string, string>) {
  const token = extractToken(request);
  if (!token) return json({ error: "Non authentifié" }, corsHeaders, 401);
  const payload = await verifyJwt(token, env.JWT_SECRET);
  if (!payload) return json({ error: "Token invalide" }, corsHeaders, 401);

  const body = await request.json() as Record<string, boolean>;
  const updates: string[] = [];
  const values: unknown[] = [];

  for (const col of NEWSLETTER_COLUMNS) {
    if (col in body) {
      updates.push(`${col} = ?`);
      values.push(body[col] ? 1 : 0);
    }
  }

  if (updates.length === 0) return json({ error: "Aucune préférence à modifier" }, corsHeaders, 400);

  // Ensure row exists
  const existing = await env.DB.prepare("SELECT user_id FROM newsletter_preferences WHERE user_id = ?").bind(payload.sub).first();
  if (!existing) {
    await env.DB.prepare("INSERT INTO newsletter_preferences (user_id) VALUES (?)").bind(payload.sub).run();
  }

  updates.push("updated_at = datetime('now')");
  values.push(payload.sub);

  await env.DB.prepare(`UPDATE newsletter_preferences SET ${updates.join(", ")} WHERE user_id = ?`).bind(...values).run();
  return json({ success: true }, corsHeaders);
}

// ═══════════════════════════════════════════════════════════
//  Contact form → Brevo email
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

  if (env.BREVO_API_KEY) {
    await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "accept": "application/json",
        "content-type": "application/json",
        "api-key": env.BREVO_API_KEY,
      },
      body: JSON.stringify({
        sender: { name: "GASPE", email: "ne-pas-repondre@gaspe.fr" },
        to: [{ email: env.CONTACT_EMAIL || "contact@gaspe.fr", name: "GASPE" }],
        replyTo: { email, name: nom },
        subject: `[Contact GASPE] ${sujet}`,
        htmlContent: `
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
//  Newsletter send → Brevo bulk email
// ═══════════════════════════════════════════════════════════

async function handleNewsletterSend(request: Request, env: Env, corsHeaders: Record<string, string>) {
  // Admin only
  const token = extractToken(request);
  if (!token) return json({ error: "Non authentifié" }, corsHeaders, 401);
  const payload = await verifyJwt(token, env.JWT_SECRET);
  if (!payload) return json({ error: "Token invalide" }, corsHeaders, 401);

  const admin = await env.DB.prepare("SELECT role FROM users WHERE id = ?").bind(payload.sub).first<{ role: string }>();
  if (!admin || admin.role !== "admin") {
    return json({ error: "Accès réservé aux administrateurs" }, corsHeaders, 403);
  }

  if (!env.BREVO_API_KEY) {
    return json({ error: "Clé API Brevo non configurée" }, corsHeaders, 500);
  }

  const body = await request.json() as { category: string; subject: string; htmlContent: string };

  if (!body.category || !body.subject?.trim() || !body.htmlContent?.trim()) {
    return json({ error: "Champs requis: category, subject, htmlContent" }, corsHeaders, 400);
  }

  // Validate category
  if (!NEWSLETTER_COLUMNS.includes(body.category as typeof NEWSLETTER_COLUMNS[number])) {
    return json({ error: `Catégorie invalide: ${body.category}` }, corsHeaders, 400);
  }

  // Find subscribed users: join users + newsletter_preferences where category = true
  const query = `
    SELECT u.email, u.name
    FROM users u
    INNER JOIN newsletter_preferences np ON np.user_id = u.id
    WHERE np.${body.category} = 1
      AND u.approved = 1
      AND u.archived = 0
  `;
  const { results } = await env.DB.prepare(query).all<{ email: string; name: string }>();
  const recipients = results ?? [];

  if (recipients.length === 0) {
    return json({ error: "Aucun abonné pour cette catégorie" }, corsHeaders, 400);
  }

  // Send via Brevo in batches of 50 (Brevo limit for transactional)
  const BATCH_SIZE = 50;
  let sentCount = 0;
  const errors: string[] = [];

  for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
    const batch = recipients.slice(i, i + BATCH_SIZE);

    try {
      const brevoRes = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "accept": "application/json",
          "content-type": "application/json",
          "api-key": env.BREVO_API_KEY,
        },
        body: JSON.stringify({
          sender: { name: "GASPE", email: "ne-pas-repondre@gaspe.fr" },
          to: batch.map((r) => ({ email: r.email, name: r.name })),
          subject: body.subject,
          htmlContent: body.htmlContent,
        }),
      });

      if (brevoRes.ok) {
        sentCount += batch.length;
      } else {
        const err = await brevoRes.json().catch(() => ({})) as { message?: string };
        errors.push(err.message ?? `Brevo HTTP ${brevoRes.status}`);
      }
    } catch (err) {
      errors.push(`Erreur réseau batch ${i / BATCH_SIZE + 1}`);
    }
  }

  return json({
    success: errors.length === 0,
    sent: sentCount,
    total: recipients.length,
    errors: errors.length > 0 ? errors : undefined,
  }, corsHeaders);
}

// ═══════════════════════════════════════════════════════════
//  Hydros Alumni — Cross-publication
// ═══════════════════════════════════════════════════════════

async function handleHydrosPublish(request: Request, env: Env, corsHeaders: Record<string, string>) {
  // Require authentication
  const token = extractToken(request);
  if (!token) return json({ error: "Non authentifié" }, corsHeaders, 401);
  const payload = await verifyJwt(token, env.JWT_SECRET);
  if (!payload) return json({ error: "Token invalide" }, corsHeaders, 401);

  if (!env.HYDROS_EMAIL || !env.HYDROS_PASSWORD) {
    return json({ error: "Credentials Hydros Alumni non configurés" }, corsHeaders, 500);
  }

  const body = await request.json() as {
    title: string;
    description: string;
    profile?: string;
    conditions?: string;
    companyName: string;
    companyDescription?: string;
    location: string;
    reference?: string;
    contractTypeId: string;
    positionId: string;
    beginId: string;
    sectorId: string;
    remoteId: string;
    expiresAt?: string;
    handiAccessible?: boolean;
    contactFirstName?: string;
    contactLastName?: string;
    contactEmail: string;
    contactPhone?: string;
    applicationUrl?: string;
  };

  if (!body.title || !body.description || !body.contactEmail) {
    return json({ error: "Champs requis: title, description, contactEmail" }, corsHeaders, 400);
  }

  try {
    // Step 1: Login to Hydros Alumni
    const loginRes = await fetch("https://www.hydros-alumni.org/fr/login", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        email: env.HYDROS_EMAIL,
        password: env.HYDROS_PASSWORD,
        _action: "login",
      }),
      redirect: "manual",
    });

    // Extract session cookie
    const cookies = loginRes.headers.getAll("set-cookie");
    const sessionCookie = cookies
      .map((c) => c.split(";")[0])
      .filter((c) => c.startsWith("AFSESSID=") || c.startsWith("PHPSESSID="))
      .join("; ");

    if (!sessionCookie) {
      return json({ error: "Échec de connexion à Hydros Alumni" }, corsHeaders, 502);
    }

    // Step 2: Build form data for offer creation
    const fullDescription = [
      body.description,
      body.profile ? `<h3>Profil recherché</h3>${body.profile}` : "",
      body.conditions ? `<h3>Conditions et avantages</h3>${body.conditions}` : "",
    ].filter(Boolean).join("\n");

    const formData = new URLSearchParams({
      "offer[title]": body.title,
      "offer[description]": fullDescription,
      "offer[company_name]": body.companyName,
      "offer[company_description]": body.companyDescription || `${body.companyName}, compagnie maritime adhérente du GASPE.`,
      "offer[company_sector_id]": body.sectorId,
      "offer[contract_type_id]": body.contractTypeId,
      "offer[position_id]": body.positionId,
      "offer[sector_id]": body.sectorId,
      "offer[remote_id]": body.remoteId,
      "offer[begin_id]": body.beginId,
      "offer[location]": body.location,
      "offer[contact_email]": body.contactEmail,
      "offer[contact_consent]": "1",
    });

    if (body.reference) formData.set("offer[reference]", body.reference);
    if (body.expiresAt) formData.set("offer[end_date]", body.expiresAt);
    if (body.contactFirstName) formData.set("offer[contact_first_name]", body.contactFirstName);
    if (body.contactLastName) formData.set("offer[contact_last_name]", body.contactLastName);
    if (body.contactPhone) formData.set("offer[contact_phone]", body.contactPhone);
    if (body.applicationUrl) formData.set("offer[application_url]", body.applicationUrl);
    if (body.handiAccessible) formData.set("offer[handicap]", "1");

    // Step 3: Submit the offer
    const submitRes = await fetch("https://www.hydros-alumni.org/fr/jobboard/offer/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Cookie": sessionCookie,
      },
      body: formData,
      redirect: "manual",
    });

    // Check for redirect to the new offer page
    const redirectUrl = submitRes.headers.get("location") ?? "";

    if (submitRes.status >= 300 && submitRes.status < 400 && redirectUrl.includes("/jobboard/offer/")) {
      // Extract offer ID from URL like /fr/jobboard/offer/cdi/titre/518
      const parts = redirectUrl.split("/");
      const hydrosOfferId = parts[parts.length - 1];
      const hydrosOfferUrl = redirectUrl.startsWith("http")
        ? redirectUrl
        : `https://www.hydros-alumni.org${redirectUrl}`;

      return json({ success: true, hydrosOfferUrl, hydrosOfferId }, corsHeaders);
    }

    // Try to get the response body for error info
    const responseText = await submitRes.text().catch(() => "");
    console.error("[Hydros] Submit failed:", submitRes.status, responseText.slice(0, 500));
    return json({
      error: `Publication échouée (HTTP ${submitRes.status}). Vérifiez les credentials Hydros.`,
      success: false,
    }, corsHeaders, 502);
  } catch (err) {
    console.error("[Hydros] Error:", err);
    return json({ error: "Erreur de connexion à Hydros Alumni" }, corsHeaders, 502);
  }
}

// ═══════════════════════════════════════════════════════════
//  File upload → R2 with magic bytes validation
// ═══════════════════════════════════════════════════════════

async function handleUpload(request: Request, env: Env, corsHeaders: Record<string, string>) {
  // Require authentication
  const token = extractToken(request);
  if (!token) return json({ error: "Non authentifié" }, corsHeaders, 401);
  const payload = await verifyJwt(token, env.JWT_SECRET);
  if (!payload) return json({ error: "Token invalide" }, corsHeaders, 401);

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

// ═══════════════════════════════════════════════════════════
//  CMS Pages — D1 backed content management
// ═══════════════════════════════════════════════════════════

async function handleCmsGetPages(env: Env, corsHeaders: Record<string, string>) {
  const rows = await env.DB.prepare(
    "SELECT page_id, section_id, section_label, section_type, content, updated_at FROM cms_pages ORDER BY page_id, section_id"
  ).all();

  // Group by page_id
  const pages: Record<string, { pageId: string; sections: unknown[]; updatedAt: string }> = {};
  for (const row of rows.results) {
    const r = row as Record<string, string>;
    if (!pages[r.page_id]) {
      pages[r.page_id] = { pageId: r.page_id, sections: [], updatedAt: r.updated_at };
    }
    pages[r.page_id].sections.push({
      id: r.section_id,
      label: r.section_label,
      type: r.section_type,
      content: r.content,
    });
    if (r.updated_at > pages[r.page_id].updatedAt) {
      pages[r.page_id].updatedAt = r.updated_at;
    }
  }

  return json(pages, corsHeaders);
}

async function handleCmsSavePage(request: Request, env: Env, corsHeaders: Record<string, string>) {
  const token = extractToken(request);
  if (!token) return json({ error: "Non authentifié" }, corsHeaders, 401);
  const payload = await verifyJwt(token, env.JWT_SECRET);
  if (!payload) return json({ error: "Token invalide" }, corsHeaders, 401);

  // Admin only
  const user = await env.DB.prepare("SELECT role FROM users WHERE id = ?").bind(payload.sub).first();
  if (!user || user.role !== "admin") return json({ error: "Accès refusé" }, corsHeaders, 403);

  const body = await request.json() as { pageId: string; sections: { id: string; label: string; type: string; content: string }[] };
  if (!body.pageId || !body.sections) return json({ error: "Données invalides" }, corsHeaders, 400);

  const stmt = env.DB.prepare(
    "INSERT OR REPLACE INTO cms_pages (page_id, section_id, section_label, section_type, content, updated_at, updated_by) VALUES (?, ?, ?, ?, ?, datetime('now'), ?)"
  );
  const batch = body.sections.map(s =>
    stmt.bind(body.pageId, s.id, s.label, s.type, s.content, payload.sub)
  );
  await env.DB.batch(batch);

  return json({ success: true }, corsHeaders);
}

// ═══════════════════════════════════════════════════════════
//  Job Offers — D1 backed CRUD
// ═══════════════════════════════════════════════════════════

async function handleListJobs(env: Env, corsHeaders: Record<string, string>) {
  const rows = await env.DB.prepare(
    "SELECT * FROM job_offers ORDER BY created_at DESC"
  ).all();
  return json(rows.results, corsHeaders);
}

async function handleCreateJob(request: Request, env: Env, corsHeaders: Record<string, string>) {
  const token = extractToken(request);
  if (!token) return json({ error: "Non authentifié" }, corsHeaders, 401);
  const payload = await verifyJwt(token, env.JWT_SECRET);
  if (!payload) return json({ error: "Token invalide" }, corsHeaders, 401);

  const user = await env.DB.prepare("SELECT id, role FROM users WHERE id = ?").bind(payload.sub).first();
  if (!user || (user.role !== "admin" && user.role !== "adherent")) {
    return json({ error: "Accès refusé" }, corsHeaders, 403);
  }

  const body = await request.json() as Record<string, unknown>;
  const id = crypto.randomUUID();
  const slug = (body.slug as string) || `${(body.title as string || "offre").toLowerCase().replace(/\s+/g, "-")}-${id.slice(0, 8)}`;

  await env.DB.prepare(`
    INSERT INTO job_offers (id, title, company, company_slug, location, contract_type, category, zone, brevet, description, requirements, salary_range, salary_min, slug, published, published_at, application_url, reference, start_date, contact_phone, handi_accessible, created_by, created_by_role, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id,
    body.title || "", body.company || "", body.companySlug || "",
    body.location || "", body.contractType || "CDI", body.category || "pont",
    body.zone || "normandie", body.brevet || null,
    body.description || "", body.requirements || null,
    body.salaryRange || null, body.salaryMin || null,
    slug,
    body.published ? 1 : 0,
    body.published ? new Date().toISOString() : null,
    body.applicationUrl || null, body.reference || null,
    body.startDate || null, body.contactPhone || null,
    body.handiAccessible ? 1 : 0,
    payload.sub, user.role as string, body.status || "draft"
  ).run();

  return json({ success: true, id, slug }, corsHeaders, 201);
}

async function handleUpdateJob(request: Request, env: Env, corsHeaders: Record<string, string>, jobId: string) {
  const token = extractToken(request);
  if (!token) return json({ error: "Non authentifié" }, corsHeaders, 401);
  const payload = await verifyJwt(token, env.JWT_SECRET);
  if (!payload) return json({ error: "Token invalide" }, corsHeaders, 401);

  const user = await env.DB.prepare("SELECT id, role FROM users WHERE id = ?").bind(payload.sub).first();
  if (!user) return json({ error: "Accès refusé" }, corsHeaders, 403);

  // Check ownership or admin
  const job = await env.DB.prepare("SELECT created_by FROM job_offers WHERE id = ?").bind(jobId).first();
  if (!job) return json({ error: "Offre non trouvée" }, corsHeaders, 404);
  if (user.role !== "admin" && job.created_by !== payload.sub) {
    return json({ error: "Accès refusé" }, corsHeaders, 403);
  }

  const body = await request.json() as Record<string, unknown>;
  const sets: string[] = [];
  const values: unknown[] = [];

  const fields: Record<string, string> = {
    title: "title", company: "company", location: "location",
    contractType: "contract_type", category: "category", zone: "zone",
    description: "description", requirements: "requirements",
    salaryRange: "salary_range", salaryMin: "salary_min",
    published: "published", status: "status",
    applicationUrl: "application_url", reference: "reference",
    startDate: "start_date", contactPhone: "contact_phone",
    handiAccessible: "handi_accessible",
  };

  for (const [jsKey, dbKey] of Object.entries(fields)) {
    if (jsKey in body) {
      sets.push(`${dbKey} = ?`);
      values.push(body[jsKey]);
    }
  }

  if (sets.length === 0) return json({ error: "Aucune modification" }, corsHeaders, 400);

  sets.push("updated_at = datetime('now')");
  values.push(jobId);

  await env.DB.prepare(`UPDATE job_offers SET ${sets.join(", ")} WHERE id = ?`).bind(...values).run();
  return json({ success: true }, corsHeaders);
}

async function handleDeleteJob(request: Request, env: Env, corsHeaders: Record<string, string>, jobId: string) {
  const token = extractToken(request);
  if (!token) return json({ error: "Non authentifié" }, corsHeaders, 401);
  const payload = await verifyJwt(token, env.JWT_SECRET);
  if (!payload) return json({ error: "Token invalide" }, corsHeaders, 401);

  const user = await env.DB.prepare("SELECT role FROM users WHERE id = ?").bind(payload.sub).first();
  if (!user || user.role !== "admin") return json({ error: "Accès refusé" }, corsHeaders, 403);

  await env.DB.prepare("DELETE FROM job_offers WHERE id = ?").bind(jobId).run();
  return json({ success: true }, corsHeaders);
}

// ═══════════════════════════════════════════════════════════
//  Medical Visits — D1 backed crew aptitude tracking
// ═══════════════════════════════════════════════════════════

async function handleListMedicalVisits(request: Request, env: Env, corsHeaders: Record<string, string>) {
  const token = extractToken(request);
  if (!token) return json({ error: "Non authentifié" }, corsHeaders, 401);
  const payload = await verifyJwt(token, env.JWT_SECRET);
  if (!payload) return json({ error: "Token invalide" }, corsHeaders, 401);

  const user = await env.DB.prepare("SELECT id, role, organization_id FROM users WHERE id = ?").bind(payload.sub).first();
  if (!user) return json({ error: "Accès refusé" }, corsHeaders, 403);

  let rows;
  if (user.role === "admin") {
    rows = await env.DB.prepare("SELECT * FROM medical_visits ORDER BY visit_date DESC").all();
  } else {
    rows = await env.DB.prepare(
      "SELECT * FROM medical_visits WHERE user_id = ? OR organization_id = ? ORDER BY visit_date DESC"
    ).bind(payload.sub, user.organization_id || "").all();
  }

  return json(rows.results, corsHeaders);
}

async function handleCreateMedicalVisit(request: Request, env: Env, corsHeaders: Record<string, string>) {
  const token = extractToken(request);
  if (!token) return json({ error: "Non authentifié" }, corsHeaders, 401);
  const payload = await verifyJwt(token, env.JWT_SECRET);
  if (!payload) return json({ error: "Token invalide" }, corsHeaders, 401);

  const user = await env.DB.prepare("SELECT id, role, organization_id FROM users WHERE id = ?").bind(payload.sub).first();
  if (!user || user.role === "candidat") return json({ error: "Accès refusé" }, corsHeaders, 403);

  const body = await request.json() as Record<string, unknown>;
  const id = crypto.randomUUID();

  await env.DB.prepare(`
    INSERT INTO medical_visits (id, user_id, organization_id, crew_member_name, crew_member_role, visit_type, visit_date, expiry_date, result, doctor_name, center_id, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id, payload.sub, user.organization_id || null,
    body.crewMemberName || "", body.crewMemberRole || null,
    body.visitType || "aptitude", body.visitDate || "",
    body.expiryDate || null, body.result || "pending",
    body.doctorName || null, body.centerId || null, body.notes || null
  ).run();

  return json({ success: true, id }, corsHeaders, 201);
}

async function handleUpdateMedicalVisit(request: Request, env: Env, corsHeaders: Record<string, string>, visitId: string) {
  const token = extractToken(request);
  if (!token) return json({ error: "Non authentifié" }, corsHeaders, 401);
  const payload = await verifyJwt(token, env.JWT_SECRET);
  if (!payload) return json({ error: "Token invalide" }, corsHeaders, 401);

  const visit = await env.DB.prepare("SELECT user_id FROM medical_visits WHERE id = ?").bind(visitId).first();
  if (!visit) return json({ error: "Visite non trouvée" }, corsHeaders, 404);

  const user = await env.DB.prepare("SELECT role FROM users WHERE id = ?").bind(payload.sub).first();
  if (!user) return json({ error: "Accès refusé" }, corsHeaders, 403);
  if (user.role !== "admin" && visit.user_id !== payload.sub) {
    return json({ error: "Accès refusé" }, corsHeaders, 403);
  }

  const body = await request.json() as Record<string, unknown>;
  const sets: string[] = [];
  const values: unknown[] = [];

  const fields: Record<string, string> = {
    crewMemberName: "crew_member_name", crewMemberRole: "crew_member_role",
    visitType: "visit_type", visitDate: "visit_date", expiryDate: "expiry_date",
    result: "result", doctorName: "doctor_name", centerId: "center_id", notes: "notes",
  };

  for (const [jsKey, dbKey] of Object.entries(fields)) {
    if (jsKey in body) {
      sets.push(`${dbKey} = ?`);
      values.push(body[jsKey]);
    }
  }

  if (sets.length === 0) return json({ error: "Aucune modification" }, corsHeaders, 400);

  sets.push("updated_at = datetime('now')");
  values.push(visitId);

  await env.DB.prepare(`UPDATE medical_visits SET ${sets.join(", ")} WHERE id = ?`).bind(...values).run();
  return json({ success: true }, corsHeaders);
}

async function handleDeleteMedicalVisit(request: Request, env: Env, corsHeaders: Record<string, string>, visitId: string) {
  const token = extractToken(request);
  if (!token) return json({ error: "Non authentifié" }, corsHeaders, 401);
  const payload = await verifyJwt(token, env.JWT_SECRET);
  if (!payload) return json({ error: "Token invalide" }, corsHeaders, 401);

  const user = await env.DB.prepare("SELECT role FROM users WHERE id = ?").bind(payload.sub).first();
  if (!user || (user.role !== "admin" && user.role !== "adherent")) {
    return json({ error: "Accès refusé" }, corsHeaders, 403);
  }

  await env.DB.prepare("DELETE FROM medical_visits WHERE id = ?").bind(visitId).run();
  return json({ success: true }, corsHeaders);
}

// ═══════════════════════════════════════════════════════════
//  Media Library — R2 storage + D1 metadata
// ═══════════════════════════════════════════════════════════

async function handleListMedia(request: Request, env: Env, corsHeaders: Record<string, string>) {
  const token = extractToken(request);
  if (!token) return json({ error: "Non authentifié" }, corsHeaders, 401);
  const payload = await verifyJwt(token, env.JWT_SECRET);
  if (!payload) return json({ error: "Token invalide" }, corsHeaders, 401);

  const rows = await env.DB.prepare(
    "SELECT * FROM media_library ORDER BY created_at DESC"
  ).all();

  return json(rows.results, corsHeaders);
}

async function handleUploadMedia(request: Request, env: Env, corsHeaders: Record<string, string>) {
  const token = extractToken(request);
  if (!token) return json({ error: "Non authentifié" }, corsHeaders, 401);
  const payload = await verifyJwt(token, env.JWT_SECRET);
  if (!payload) return json({ error: "Token invalide" }, corsHeaders, 401);

  const user = await env.DB.prepare("SELECT role FROM users WHERE id = ?").bind(payload.sub).first();
  if (!user || user.role !== "admin") return json({ error: "Accès refusé" }, corsHeaders, 403);

  const formData = await request.formData();
  const file = formData.get("file") as File;
  if (!file) return json({ error: "Aucun fichier fourni" }, corsHeaders, 400);

  // Allow images + PDF for media library
  const allowed = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml", "application/pdf"];
  if (!allowed.includes(file.type)) {
    return json({ error: "Type de fichier non autorisé" }, corsHeaders, 400);
  }

  // Max 5MB for media
  if (file.size > 5 * 1024 * 1024) {
    return json({ error: "Fichier trop volumineux (max 5 Mo)" }, corsHeaders, 400);
  }

  const id = crypto.randomUUID();
  const ext = file.name.split(".").pop() || "bin";
  const r2Key = `media/${id}.${ext}`;

  const buffer = await file.arrayBuffer();
  await env.UPLOADS.put(r2Key, buffer, {
    httpMetadata: { contentType: file.type },
    customMetadata: { originalName: file.name },
  });

  await env.DB.prepare(`
    INSERT INTO media_library (id, filename, content_type, size, r2_key, uploaded_by)
    VALUES (?, ?, ?, ?, ?, ?)
  `).bind(id, file.name, file.type, file.size, r2Key, payload.sub).run();

  return json({ success: true, id, r2Key, filename: file.name }, corsHeaders, 201);
}

async function handleDeleteMedia(request: Request, env: Env, corsHeaders: Record<string, string>, mediaId: string) {
  const token = extractToken(request);
  if (!token) return json({ error: "Non authentifié" }, corsHeaders, 401);
  const payload = await verifyJwt(token, env.JWT_SECRET);
  if (!payload) return json({ error: "Token invalide" }, corsHeaders, 401);

  const user = await env.DB.prepare("SELECT role FROM users WHERE id = ?").bind(payload.sub).first();
  if (!user || user.role !== "admin") return json({ error: "Accès refusé" }, corsHeaders, 403);

  const media = await env.DB.prepare("SELECT r2_key FROM media_library WHERE id = ?").bind(mediaId).first();
  if (!media) return json({ error: "Média non trouvé" }, corsHeaders, 404);

  // Delete from R2 and D1
  await env.UPLOADS.delete(media.r2_key as string);
  await env.DB.prepare("DELETE FROM media_library WHERE id = ?").bind(mediaId).run();

  return json({ success: true }, corsHeaders);
}
