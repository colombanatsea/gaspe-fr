/**
 * GASPE API Worker – Cloudflare Workers
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
 *   POST /api/auth/register    – create account
 *   POST /api/auth/login       – authenticate → JWT cookie
 *   POST /api/auth/logout      – clear session
 *   GET  /api/auth/me          – current user from JWT
 *   GET  /api/auth/users       – admin: list all users
 *   PATCH /api/auth/users/:id  – admin: update/approve user
 *   DELETE /api/auth/users/:id – admin: reject/delete user
 *   POST /api/auth/forgot-password – request password reset email
 *   POST /api/auth/reset-password  – reset password with token
 *   GET  /api/organizations       – list all organizations
 *   GET  /api/organizations/:id   – org details + contacts
 *   PATCH /api/organizations/:id  – update org (primary/admin)
 *   POST /api/organizations/:id/invite – invite contact (primary/admin)
 *   GET  /api/organizations/:id/invitations – list invitations
 *   POST /api/invitations/:token/accept – accept invitation
 *   GET  /api/preferences         – get newsletter preferences
 *   PATCH /api/preferences        – update newsletter preferences
 *   POST /api/contact          – send contact email via Brevo
 *   POST /api/newsletter       – subscribe to newsletter
 *   POST /api/newsletter/send  – admin: bulk send newsletter by category
 *   POST /api/hydros/publish   – publish offer to Hydros Alumni (JWT auth)
 *   POST /api/enm/import       – import data from Espace Numérique Maritime
 *   POST /api/upload           – upload CV/documents to R2
 *   GET  /api/health           – health check
 *
 *   CMS pages:
 *   GET  /api/cms/pages           – list all CMS page content
 *   GET  /api/cms/pages/:pageId   – get single page content
 *   PUT  /api/cms/pages/:pageId   – upsert page sections
 *
 *   Jobs:
 *   GET    /api/jobs              – list all jobs (public: published only)
 *   GET    /api/jobs/:id          – get single job
 *   POST   /api/jobs              – create job (admin/adherent)
 *   PATCH  /api/jobs/:id          – update job (admin/owner)
 *   DELETE /api/jobs/:id          – delete job (admin/owner)
 *
 *   Medical visits:
 *   GET    /api/medical-visits       – list user's medical visits (JWT)
 *   POST   /api/medical-visits       – create medical visit (JWT)
 *   PATCH  /api/medical-visits/:id   – update medical visit (JWT)
 *   DELETE /api/medical-visits/:id   – delete medical visit (JWT)
 *
 *   Media files:
 *   GET    /api/media             – list media files (admin)
 *   POST   /api/media             – upload media file to R2 (admin)
 *   DELETE /api/media/:id         – delete media file + R2 object (admin)
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
  // Newsletter v2 – ces vars sont optionnelles tant que Brevo n'est pas configuré.
  // Quand elles sont définies, les endpoints send/webhook/unsub deviennent actifs.
  BREVO_SENDER_EMAIL?: string;
  BREVO_SENDER_NAME?: string;
  BREVO_REPLY_TO?: string;
  BREVO_WEBHOOK_SECRET?: string;
  NEWSLETTER_UNSUB_SECRET?: string;
  // 10 list IDs Brevo (une par catégorie D1) – à configurer via `wrangler secret put`.
  // Les noms correspondent aux colonnes de `newsletter_preferences` (migration 0003).
  BREVO_LIST_INFO_GENERALES?: string;
  BREVO_LIST_AG?: string;
  BREVO_LIST_EMPLOI?: string;
  BREVO_LIST_FORMATION_OPCO?: string;
  BREVO_LIST_VEILLE_JURIDIQUE?: string;
  BREVO_LIST_VEILLE_SOCIALE?: string;
  BREVO_LIST_VEILLE_SURETE?: string;
  BREVO_LIST_VEILLE_DATA?: string;
  BREVO_LIST_VEILLE_ENVIRONNEMENT?: string;
  BREVO_LIST_ACTUALITES_GASPE?: string;
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
  profile_photo: string | null;
  linkedin_url: string | null;
  company_linkedin_url: string | null;
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
    profilePhoto: row.profile_photo ?? undefined,
    linkedinUrl: row.linkedin_url ?? undefined,
    companyLinkedinUrl: row.company_linkedin_url ?? undefined,
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
  // Handle legacy SHA-256 hashes (64 hex chars) – always accept for migration
  if (/^[a-f0-9]{64}$/.test(stored)) {
    // Legacy client-side hash – can't verify without email salt, reject
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
        return handleListOrganizations(request, env, corsHeaders);
      }
      // Fleet – must match BEFORE the generic :id route so "fleet" isn't
      // interpreted as an organization id.
      if (path === "/api/organizations/fleet" && request.method === "GET") {
        return handleListAllFleets(request, env, corsHeaders);
      }
      if (path.match(/^\/api\/organizations\/[^/]+\/fleet$/) && request.method === "GET") {
        const slug = path.replace("/api/organizations/", "").replace("/fleet", "");
        return handleGetFleet(request, env, corsHeaders, slug);
      }
      if (path.match(/^\/api\/organizations\/[^/]+\/fleet$/) && request.method === "PUT") {
        const slug = path.replace("/api/organizations/", "").replace("/fleet", "");
        return handleUpsertFleet(request, env, corsHeaders, slug);
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

      // ── ENM (Espace Numérique Maritime) import ──
      if (path === "/api/enm/import" && request.method === "POST") {
        return handleEnmImport(request, env, corsHeaders);
      }

      // ── Upload ──
      if (path === "/api/upload" && request.method === "POST") {
        return handleUpload(request, env, corsHeaders);
      }

      // ── CMS Pages ──
      if (path === "/api/cms/pages" && request.method === "GET") {
        return handleCmsListPages(env, corsHeaders);
      }
      if (path.match(/^\/api\/cms\/pages\/[^/]+\/revisions$/) && request.method === "GET") {
        const pageId = decodeURIComponent(path.replace("/api/cms/pages/", "").replace("/revisions", ""));
        return handleCmsListRevisions(request, env, corsHeaders, pageId);
      }
      if (path.match(/^\/api\/cms\/pages\/[^/]+\/revisions\/\d+$/) && request.method === "GET") {
        const parts = path.split("/");
        const pageId = decodeURIComponent(parts[4]);
        const revisionId = Number(parts[6]);
        return handleCmsGetRevision(request, env, corsHeaders, pageId, revisionId);
      }
      if (path.match(/^\/api\/cms\/pages\/[^/]+\/revisions\/\d+\/restore$/) && request.method === "POST") {
        const parts = path.split("/");
        const pageId = decodeURIComponent(parts[4]);
        const revisionId = Number(parts[6]);
        return handleCmsRestoreRevision(request, env, corsHeaders, pageId, revisionId);
      }
      if (path.match(/^\/api\/cms\/pages\/[^/]+$/) && request.method === "GET") {
        const pageId = path.split("/api/cms/pages/")[1];
        return handleCmsGetPage(env, corsHeaders, pageId);
      }
      if (path.match(/^\/api\/cms\/pages\/[^/]+$/) && request.method === "PUT") {
        const pageId = path.split("/api/cms/pages/")[1];
        return handleCmsUpsertPage(request, env, corsHeaders, pageId);
      }

      // ── Jobs ──
      if (path === "/api/jobs" && request.method === "GET") {
        return handleJobsList(request, env, corsHeaders);
      }
      if (path === "/api/jobs" && request.method === "POST") {
        return handleJobCreate(request, env, corsHeaders);
      }
      if (path.match(/^\/api\/jobs\/[^/]+$/) && request.method === "GET") {
        const jobId = path.split("/api/jobs/")[1];
        return handleJobGet(env, corsHeaders, jobId);
      }
      if (path.match(/^\/api\/jobs\/[^/]+$/) && request.method === "PATCH") {
        const jobId = path.split("/api/jobs/")[1];
        return handleJobUpdate(request, env, corsHeaders, jobId);
      }
      if (path.match(/^\/api\/jobs\/[^/]+$/) && request.method === "DELETE") {
        const jobId = path.split("/api/jobs/")[1];
        return handleJobDelete(request, env, corsHeaders, jobId);
      }

      // ── Medical Visits ──
      if (path === "/api/medical-visits" && request.method === "GET") {
        return handleMedicalList(request, env, corsHeaders);
      }
      if (path === "/api/medical-visits" && request.method === "POST") {
        return handleMedicalCreate(request, env, corsHeaders);
      }
      if (path.match(/^\/api\/medical-visits\/[^/]+$/) && request.method === "PATCH") {
        const visitId = path.split("/api/medical-visits/")[1];
        return handleMedicalUpdate(request, env, corsHeaders, visitId);
      }
      if (path.match(/^\/api\/medical-visits\/[^/]+$/) && request.method === "DELETE") {
        const visitId = path.split("/api/medical-visits/")[1];
        return handleMedicalDelete(request, env, corsHeaders, visitId);
      }

      // ── Newsletter drafts ──
      if (path === "/api/newsletter/drafts" && request.method === "GET") {
        return handleNlDraftsList(request, env, corsHeaders);
      }
      if (path === "/api/newsletter/drafts" && request.method === "POST") {
        return handleNlDraftsCreate(request, env, corsHeaders);
      }
      if (path.match(/^\/api\/newsletter\/drafts\/[^/]+$/) && request.method === "GET") {
        const id = path.split("/api/newsletter/drafts/")[1];
        return handleNlDraftsGet(request, env, corsHeaders, decodeURIComponent(id));
      }
      if (path.match(/^\/api\/newsletter\/drafts\/[^/]+$/) && request.method === "PUT") {
        const id = path.split("/api/newsletter/drafts/")[1];
        return handleNlDraftsUpdate(request, env, corsHeaders, decodeURIComponent(id));
      }
      if (path.match(/^\/api\/newsletter\/drafts\/[^/]+$/) && request.method === "DELETE") {
        const id = path.split("/api/newsletter/drafts/")[1];
        return handleNlDraftsDelete(request, env, corsHeaders, decodeURIComponent(id));
      }

      // ── Newsletter subscribers (admin) ──
      if (path === "/api/newsletter/subscribers" && request.method === "GET") {
        return handleNewsletterSubscribers(request, env, corsHeaders);
      }

      // ── Newsletter v2 – envois (test-send / bulk-send) ──
      if (path.match(/^\/api\/newsletter\/drafts\/[^/]+\/test-send$/) && request.method === "POST") {
        const draftId = path.split("/")[4];
        return handleNewsletterTestSend(request, env, corsHeaders, draftId);
      }
      if (path.match(/^\/api\/newsletter\/drafts\/[^/]+\/send$/) && request.method === "POST") {
        const draftId = path.split("/")[4];
        return handleNewsletterBulkSend(request, env, corsHeaders, draftId);
      }

      // ── Newsletter – webhook Brevo (tracking open/click/bounce/unsubscribe) ──
      if (path === "/api/newsletter/brevo/webhook" && request.method === "POST") {
        return handleBrevoWebhook(request, env, corsHeaders);
      }

      // ── Newsletter – désinscription publique tokenisée ──
      if (path === "/api/newsletter/unsubscribe" && request.method === "POST") {
        return handleNewsletterUnsubscribe(request, env, corsHeaders);
      }

      // ── Media Files ──
      // Public raw fetch : sert un blob R2 directement (pour afficher photos bureau, etc.).
      // Le key R2 peut contenir des slashes (ex: "media/uuid-file.jpg") donc on prend tout ce qui suit.
      if (path.startsWith("/api/media/raw/") && request.method === "GET") {
        const r2Key = decodeURIComponent(path.slice("/api/media/raw/".length));
        return handleMediaRaw(env, corsHeaders, r2Key);
      }
      if (path === "/api/media" && request.method === "GET") {
        return handleMediaList(request, env, corsHeaders);
      }
      if (path === "/api/media" && request.method === "POST") {
        return handleMediaUpload(request, env, corsHeaders);
      }
      if (path.match(/^\/api\/media\/[^/]+$/) && request.method === "DELETE") {
        const mediaId = path.split("/api/media/")[1];
        return handleMediaDelete(request, env, corsHeaders, mediaId);
      }

      // ── CMS Documents ──
      if (path === "/api/cms/documents" && request.method === "GET") {
        return handleDocumentsList(request, env, corsHeaders, url.searchParams);
      }
      if (path === "/api/cms/documents" && request.method === "POST") {
        return handleDocumentCreate(request, env, corsHeaders);
      }
      if (path.match(/^\/api\/cms\/documents\/[^/]+$/) && request.method === "GET") {
        const docId = decodeURIComponent(path.split("/api/cms/documents/")[1]);
        return handleDocumentGet(request, env, corsHeaders, docId);
      }
      if (path.match(/^\/api\/cms\/documents\/[^/]+$/) && request.method === "PUT") {
        const docId = decodeURIComponent(path.split("/api/cms/documents/")[1]);
        return handleDocumentUpdate(request, env, corsHeaders, docId);
      }
      if (path.match(/^\/api\/cms\/documents\/[^/]+$/) && request.method === "DELETE") {
        const docId = decodeURIComponent(path.split("/api/cms/documents/")[1]);
        return handleDocumentDelete(request, env, corsHeaders, docId);
      }

      // ── Votes (session 38) ────────────────────────────────────────
      if (path === "/api/votes" && request.method === "GET") {
        return handleListVotes(request, env, corsHeaders);
      }
      if (path === "/api/votes" && request.method === "POST") {
        return handleCreateVote(request, env, corsHeaders);
      }
      if (path.match(/^\/api\/votes\/[^/]+$/) && request.method === "GET") {
        const voteId = path.split("/api/votes/")[1];
        return handleGetVote(request, env, corsHeaders, voteId);
      }
      if (path.match(/^\/api\/votes\/[^/]+\/response$/) && request.method === "POST") {
        const voteId = path.split("/api/votes/")[1].split("/response")[0];
        return handleSubmitVoteResponse(request, env, corsHeaders, voteId);
      }
      if (path.match(/^\/api\/votes\/[^/]+\/results$/) && request.method === "GET") {
        const voteId = path.split("/api/votes/")[1].split("/results")[0];
        return handleVoteResults(request, env, corsHeaders, voteId);
      }
      if (path.match(/^\/api\/votes\/[^/]+\/close$/) && request.method === "POST") {
        const voteId = path.split("/api/votes/")[1].split("/close")[0];
        return handleCloseVote(request, env, corsHeaders, voteId);
      }
      if (path.match(/^\/api\/votes\/[^/]+$/) && request.method === "DELETE") {
        const voteId = path.split("/api/votes/")[1];
        return handleDeleteVote(request, env, corsHeaders, voteId);
      }
      if (path === "/api/users/me/suppleant" && request.method === "GET") {
        return handleGetMySuppleant(request, env, corsHeaders);
      }
      if (path === "/api/users/me/suppleant" && request.method === "PATCH") {
        return handleSetMySuppleant(request, env, corsHeaders);
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
    companyLinkedinUrl: "company_linkedin_url",
    currentPosition: "current_position", desiredPosition: "desired_position",
    preferredZone: "preferred_zone", experience: "experience",
    certifications: "certifications", cvFilename: "cv_filename",
    profilePhoto: "profile_photo", linkedinUrl: "linkedin_url",
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
                <p style="margin:0;">GASPE – Groupement des Armateurs de Services Publics Maritimes de Passages d'Eau</p>
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
  college: string | null; social3228: number | null;
  territory: string | null; region: string | null; city: string | null;
  latitude: number | null; longitude: number | null;
  logo_url: string | null; website_url: string | null;
  address: string | null; email: string | null; phone: string | null;
  description: string | null;
  employee_count: number | null; ship_count: number | null;
  membership_status: string | null;
  archived: number | null;
  created_at: string; updated_at: string;
}

function toFrontendOrg(row: DbOrganization) {
  return {
    id: row.id, slug: row.slug, name: row.name, category: row.category,
    college: (row.college as "A" | "B" | "C" | null) ?? undefined,
    social3228: row.social3228 === 1 ? true : row.social3228 === 0 ? false : undefined,
    territory: row.territory ?? undefined, region: row.region ?? undefined,
    city: row.city ?? undefined,
    latitude: row.latitude ?? undefined, longitude: row.longitude ?? undefined,
    logoUrl: row.logo_url ?? undefined, websiteUrl: row.website_url ?? undefined,
    address: row.address ?? undefined, email: row.email ?? undefined,
    phone: row.phone ?? undefined, description: row.description ?? undefined,
    employeeCount: row.employee_count ?? undefined, shipCount: row.ship_count ?? undefined,
    membershipStatus: row.membership_status ?? undefined,
    archived: row.archived === 1,
    createdAt: row.created_at, updatedAt: row.updated_at,
  };
}

async function handleListOrganizations(request: Request, env: Env, corsHeaders: Record<string, string>) {
  const url = new URL(request.url);
  const includeArchived = url.searchParams.get("include_archived") === "1";
  // Fetch all then filter in JS – resilient to missing archived column (pre-migration 0007)
  const { results } = await env.DB.prepare("SELECT * FROM organizations ORDER BY name").all<DbOrganization>();
  const rows = results ?? [];
  const filtered = includeArchived ? rows : rows.filter((r) => r.archived !== 1);
  return json({ organizations: filtered.map(toFrontendOrg) }, corsHeaders);
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
    membershipStatus: "membership_status", archived: "archived",
    college: "college", social3228: "social3228",
  };

  const updates: string[] = [];
  const values: unknown[] = [];
  for (const [frontendKey, dbCol] of Object.entries(allowedFields)) {
    if (frontendKey in body) {
      // Champs admin-only : membershipStatus, archived, college, social3228
      const adminOnly = new Set(["membershipStatus", "archived", "college", "social3228"]);
      if (adminOnly.has(frontendKey) && payload.role !== "admin") continue;
      updates.push(`${dbCol} = ?`);
      // social3228 : booléen frontend → 0/1 SQLite
      const val = frontendKey === "social3228" ? (body[frontendKey] ? 1 : 0) : body[frontendKey];
      values.push(val);
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

// Canoniques : matchent les colonnes `newsletter_preferences` (migration 0003)
// et les keys de NEWSLETTER_CATEGORIES côté frontend.
const NEWSLETTER_COLUMNS = [
  "info_generales", "ag", "emploi", "formation_opco",
  "veille_juridique", "veille_sociale", "veille_surete",
  "veille_data", "veille_environnement", "actualites_gaspe",
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

  // Sync Brevo contact (non-bloquant – si Brevo non configuré ou erreur, on ignore).
  // Les préférences à jour sont relues depuis la DB pour éviter une race avec l'UPDATE.
  try {
    const prefs = await env.DB.prepare(
      `SELECT ${NEWSLETTER_COLUMNS.join(", ")} FROM newsletter_preferences WHERE user_id = ?`
    ).bind(payload.sub).first<Record<string, number>>();
    const user = await env.DB.prepare(
      "SELECT email, first_name, last_name FROM users WHERE id = ?"
    ).bind(payload.sub).first<{ email: string; first_name?: string; last_name?: string }>();
    if (prefs && user?.email) {
      await syncBrevoContact(env, user, prefs);
    }
  } catch { /* non bloquant */ }

  return json({ success: true }, corsHeaders);
}

/**
 * Synchronise un contact Brevo avec ses préférences D1 : ajoute le contact
 * aux listes des catégories activées, retire des autres. Nécessite que
 * BREVO_API_KEY + les list IDs soient provisionnés. Silencieux si manquant.
 * Met à jour `users.brevo_synced_at` après succès pour exposer le statut
 * côté admin (`/admin/newsletter/abonnes`).
 */
async function syncBrevoContact(
  env: Env,
  user: { email: string; first_name?: string; last_name?: string },
  prefs: Record<string, number>,
): Promise<boolean> {
  if (!env.BREVO_API_KEY) return false;

  const listIds: number[] = [];
  const unlinkListIds: number[] = [];
  for (const [category, envKey] of Object.entries(CATEGORY_TO_LIST_ENV)) {
    const listId = env[envKey] as string | undefined;
    if (!listId) continue;
    const numericId = Number(listId);
    if (!Number.isFinite(numericId)) continue;
    if (prefs[category] === 1) listIds.push(numericId);
    else unlinkListIds.push(numericId);
  }
  if (listIds.length === 0 && unlinkListIds.length === 0) return false;

  const payload: Record<string, unknown> = {
    email: user.email,
    attributes: {
      PRENOM: user.first_name ?? "",
      NOM: user.last_name ?? "",
    },
    updateEnabled: true,
  };
  if (listIds.length > 0) payload.listIds = listIds;
  if (unlinkListIds.length > 0) payload.unlinkListIds = unlinkListIds;

  const res = await fetch("https://api.brevo.com/v3/contacts", {
    method: "POST",
    headers: {
      "accept": "application/json",
      "content-type": "application/json",
      "api-key": env.BREVO_API_KEY,
    },
    body: JSON.stringify(payload),
  });

  // Brevo renvoie 201 (create) ou 204 (update) ou 400 avec "Contact already exist"
  // qui est en fait un update réussi quand updateEnabled=true. On considère OK si <400
  // ou si le code err est "duplicate_parameter".
  const ok = res.ok || res.status === 204;
  if (ok) {
    try {
      await env.DB.prepare("UPDATE users SET brevo_synced_at = datetime('now') WHERE email = ?")
        .bind(user.email).run();
    } catch { /* colonne peut ne pas encore exister si migration 0009 non appliquée */ }
  }
  return ok;
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

/**
 * Admin only – renvoie la liste complète des abonnés newsletter avec
 *   - le détail par catégorie (10 booleans de `newsletter_preferences`)
 *   - les inscrits "legacy" (email seul, table `newsletter`) ajoutés via le formulaire public
 *
 * Utilisé par `/admin/newsletter/abonnes` pour permettre à la GASPE de voir
 * dynamiquement qui est abonné à quelle catégorie, avec filtrage et export CSV.
 */
async function handleNewsletterSubscribers(request: Request, env: Env, corsHeaders: Record<string, string>) {
  const token = extractToken(request);
  if (!token) return json({ error: "Non authentifié" }, corsHeaders, 401);
  const payload = await verifyJwt(token, env.JWT_SECRET);
  if (!payload) return json({ error: "Token invalide" }, corsHeaders, 401);
  const admin = await env.DB.prepare("SELECT role FROM users WHERE id = ?").bind(payload.sub).first<{ role: string }>();
  if (!admin || admin.role !== "admin") return json({ error: "Accès refusé" }, corsHeaders, 403);

  // Users + préférences jointes (null si l'utilisateur n'a jamais configuré ses préférences).
  // Colonnes canoniques : cf. `newsletter_preferences` migration 0003.
  let users: Array<Record<string, unknown>> = [];
  try {
    const { results } = await env.DB.prepare(`
      SELECT u.id, u.email, u.first_name, u.last_name, u.role, u.status,
             u.brevo_synced_at,
             p.info_generales, p.ag, p.emploi, p.formation_opco, p.veille_juridique,
             p.veille_sociale, p.veille_surete, p.veille_data,
             p.veille_environnement, p.actualites_gaspe,
             p.updated_at AS preferences_updated_at
      FROM users u
      LEFT JOIN newsletter_preferences p ON p.user_id = u.id
      WHERE u.status = 'approved'
      ORDER BY u.created_at DESC
    `).all();
    users = results ?? [];
  } catch { /* tables may not exist in fresh deployment */ }

  let legacy: Array<{ email: string; subscribed_at?: string }> = [];
  try {
    const { results } = await env.DB.prepare(
      "SELECT email, subscribed_at FROM newsletter ORDER BY subscribed_at DESC"
    ).all<{ email: string; subscribed_at?: string }>();
    legacy = results ?? [];
  } catch { /* legacy table may be empty */ }

  // Comptage par catégorie pour donner un aperçu rapide côté UI
  const counts: Record<string, number> = {};
  for (const key of ALL_NEWSLETTER_CATEGORIES) {
    counts[key] = users.filter((u) => u[key] === 1).length;
  }

  return json({
    users,
    legacy,
    counts,
    totalUsers: users.length,
    totalLegacy: legacy.length,
  }, corsHeaders);
}

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
//  Hydros Alumni – Cross-publication
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

  // Magic bytes validation – read first 4 bytes to verify actual file type
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
//  ENM – Espace Numérique Maritime import
//  Login + scrape sea service, certificates, medical aptitude
// ═══════════════════════════════════════════════════════════

const ENM_BASE = "https://enm.mes-services.mer.gouv.fr";

async function handleEnmImport(request: Request, env: Env, corsHeaders: Record<string, string>) {
  // Require GASPE authentication
  const token = extractToken(request);
  if (!token) return json({ error: "Non authentifié" }, corsHeaders, 401);
  const payload = await verifyJwt(token, env.JWT_SECRET);
  if (!payload) return json({ error: "Token invalide" }, corsHeaders, 401);

  const body = await request.json() as { email: string; password: string };
  if (!body.email?.trim() || !body.password) {
    return json({ error: "Identifiants ENM requis" }, corsHeaders, 400);
  }

  try {
    // Step 1: Get login page to extract CSRF token
    const loginPageRes = await fetch(`${ENM_BASE}/fr/login`, {
      headers: { "User-Agent": "GASPE-Import/1.0" },
      redirect: "manual",
    });
    const loginPageHtml = await loginPageRes.text();

    // Extract CSRF token (hidden input _csrf_token or similar)
    const csrfMatch = loginPageHtml.match(/name="_csrf_token"\s+value="([^"]+)"/);
    const csrfToken = csrfMatch?.[1] ?? "";

    // Extract session cookies from login page
    const initCookies = loginPageRes.headers.getAll("set-cookie")
      .map((c) => c.split(";")[0])
      .join("; ");

    // Step 2: Submit login form
    const loginFormData = new URLSearchParams({
      _username: body.email.trim(),
      _password: body.password,
      ...(csrfToken ? { _csrf_token: csrfToken } : {}),
    });

    const loginRes = await fetch(`${ENM_BASE}/fr/login_check`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Cookie": initCookies,
        "User-Agent": "GASPE-Import/1.0",
      },
      body: loginFormData,
      redirect: "manual",
    });

    // Collect session cookies
    const allCookies = [
      ...initCookies.split("; "),
      ...loginRes.headers.getAll("set-cookie").map((c) => c.split(";")[0]),
    ].filter(Boolean);
    const sessionCookie = [...new Set(allCookies)].join("; ");

    // Check login success: should redirect to dashboard, not back to login
    const redirectUrl = loginRes.headers.get("location") ?? "";
    if (redirectUrl.includes("/login") || loginRes.status === 200) {
      return json({ error: "Identifiants ENM incorrects" }, corsHeaders, 401);
    }

    // Step 3: Fetch data pages in parallel
    const fetchPage = async (path: string): Promise<string> => {
      const res = await fetch(`${ENM_BASE}${path}`, {
        headers: { "Cookie": sessionCookie, "User-Agent": "GASPE-Import/1.0" },
        redirect: "follow",
      });
      return res.text();
    };

    const [seaServiceHtml, medicalHtml, titresHtml] = await Promise.all([
      fetchPage("/fr/univers-marin/pmr/lignes-de-service"),
      fetchPage("/fr/univers-marin/pmr/aptitude-medicale"),
      fetchPage("/fr/univers-marin/pmr/mes-titres"),
    ]);

    // Step 4: Parse sea service lines
    const seaService = parseEnmSeaService(seaServiceHtml);
    const certificates = parseEnmCertificates(titresHtml);
    const medical = parseEnmMedical(medicalHtml);

    // Extract marin ID from page header (n° XXXXXXXX)
    const marinIdMatch = seaServiceHtml.match(/(\d{7,8})\s*$/m) ?? medicalHtml.match(/(\d{7,8})/);
    const enmMarinId = marinIdMatch?.[1] ?? undefined;

    return json({
      success: true,
      data: { seaService, certificates, medical, enmMarinId },
    }, corsHeaders);
  } catch (err) {
    console.error("[ENM] Import error:", err);
    return json({ error: "Erreur de connexion au portail ENM" }, corsHeaders, 502);
  }
}

// ── ENM HTML parsers ──

function parseEnmSeaService(html: string): {
  id: string; vesselName: string; vesselImo: string; rank: string;
  category: string; startDate: string; endDate: string;
}[] {
  const results: ReturnType<typeof parseEnmSeaService> = [];
  // Match table rows with service line data
  // Pattern: dates | vessel - IMO | rank | category | status
  const rowRegex = /(\d{2}\/\d{2}\/\d{4})\s*-\s*(\d{2}\/\d{2}\/\d{4})[^<]*<[^>]*>[^<]*<[^>]*>\s*([^<]+?)\s*-\s*(\d+)[^<]*<[^>]*>[^<]*<[^>]*>\s*([A-Z\s]+?)\s*<[^>]*>[^<]*Cat\.:\s*(\d+)/g;
  let match;
  while ((match = rowRegex.exec(html)) !== null) {
    results.push({
      id: `enm-${Date.now()}-${results.length}`,
      startDate: parseFrenchDate(match[1]),
      endDate: parseFrenchDate(match[2]),
      vesselName: match[3].trim(),
      vesselImo: match[4].trim(),
      rank: match[5].trim(),
      category: match[6].trim(),
    });
  }

  // Fallback: simpler pattern matching for table cells
  if (results.length === 0) {
    const datePattern = /(\d{2}\/\d{2}\/\d{4})\s*-\s*(\d{2}\/\d{2}\/\d{4})/g;
    const vesselPattern = /([A-Z][A-Z\s]+\d*[A-Z]*)\s*-\s*(\d{4,})/g;
    const rankPattern = /(?:CAPITAINE|LIEUTENANT|MATELOT|CHEF MECANICIEN|OFFICIER[A-Z\s]*|BOSCO|MAITRE)/g;

    const dates = [...html.matchAll(datePattern)];
    const vessels = [...html.matchAll(vesselPattern)];
    const ranks = [...html.matchAll(rankPattern)];
    const catPattern = /Cat\.:\s*(\d+)/g;
    const cats = [...html.matchAll(catPattern)];

    const count = Math.min(dates.length, vessels.length, ranks.length);
    for (let i = 0; i < count; i++) {
      results.push({
        id: `enm-${Date.now()}-${i}`,
        startDate: parseFrenchDate(dates[i][1]),
        endDate: parseFrenchDate(dates[i][2]),
        vesselName: vessels[i][1].trim(),
        vesselImo: vessels[i][2].trim(),
        rank: ranks[i][0].trim(),
        category: cats[i]?.[1] ?? "",
      });
    }
  }

  return results;
}

function parseEnmCertificates(html: string): {
  certId: string; title: string; enmReference: string;
  status: "valid" | "expired"; expiryDate?: string;
}[] {
  const results: ReturnType<typeof parseEnmCertificates> = [];
  // Match certificate blocks: title, n° reference, status, expiry
  // Look for title text followed by n° XXXX and Valide/Expiré
  const titleBlocks = html.split(/n°\s*/);
  for (let i = 1; i < titleBlocks.length; i++) {
    const block = titleBlocks[i];
    const refMatch = block.match(/^(\d+)/);
    if (!refMatch) continue;

    const reference = refMatch[1];
    // Get title from previous block's last text content
    const prevBlock = titleBlocks[i - 1];
    const titleMatch = prevBlock.match(/([A-ZÀ-Üa-zà-ü'\s()]+(?:STCW\d*)?)\s*$/);
    const title = titleMatch?.[1]?.trim() ?? `Titre n°${reference}`;

    const isValid = block.includes("Valide") && !block.includes("Expiré");
    const expiryMatch = block.match(/(?:Expiré depuis le|depuis le)\s*(\d{2}\/\d{2}\/\d{4})/);

    results.push({
      certId: `enm-cert-${reference}`,
      title: cleanHtmlText(title),
      enmReference: reference,
      status: isValid ? "valid" : "expired",
      expiryDate: expiryMatch ? parseFrenchDate(expiryMatch[1]) : undefined,
    });
  }
  return results;
}

function parseEnmMedical(html: string): {
  visitType?: string; lastVisitDate?: string; expiryDate?: string;
  decision?: string; duration?: string; restrictions: string[];
} {
  const result: ReturnType<typeof parseEnmMedical> = { restrictions: [] };

  // Visit type
  const typeMatch = html.match(/Type de visite\s*-\s*([^<]+)/);
  if (typeMatch) result.visitType = typeMatch[1].trim();

  // Last visit date
  const lastVisitMatch = html.match(/Date de dernière visite[^<]*<[^>]*>\s*(\d{2}\/\d{2}\/\d{4})/);
  if (lastVisitMatch) result.lastVisitDate = parseFrenchDate(lastVisitMatch[1]);

  // Validity date
  const validityMatch = html.match(/Date de fin de validité[^<]*<[^>]*>\s*(\d{2}\/\d{2}\/\d{4})/);
  if (validityMatch) result.expiryDate = parseFrenchDate(validityMatch[1]);

  // Decision
  const decisionMatch = html.match(/Décision médicale[^<]*<[^>]*>\s*([^<]+)/);
  if (decisionMatch) result.decision = decisionMatch[1].trim();

  // Duration
  const durationMatch = html.match(/Durée de l'aptitude[^<]*<[^>]*>\s*([^<]+)/);
  if (durationMatch) result.duration = durationMatch[1].trim();

  // Restrictions (list items)
  const restrictionMatches = html.matchAll(/<li[^>]*>\s*([^<]+)\s*<\/li>/g);
  for (const m of restrictionMatches) {
    const text = m[1].trim();
    if (text && !text.includes("Accueil") && !text.includes("Mon compte")) {
      result.restrictions.push(text);
    }
  }

  return result;
}

function parseFrenchDate(ddmmyyyy: string): string {
  const [d, m, y] = ddmmyyyy.split("/");
  return `${y}-${m}-${d}`;
}

function cleanHtmlText(text: string): string {
  return text.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

// ═══════════════════════════════════════════════════════════
//  CMS Pages – CRUD for page content
// ═══════════════════════════════════════════════════════════

async function handleCmsListPages(env: Env, corsHeaders: Record<string, string>) {
  let results: { page_id: string; section_id: string; label: string; type: string; content: string; updated_at: string }[] | undefined;
  try {
    ({ results } = await env.DB.prepare(
      "SELECT * FROM cms_pages ORDER BY page_id, section_id"
    ).all<{ page_id: string; section_id: string; label: string; type: string; content: string; updated_at: string }>());
  } catch {
    return json({ pages: {} }, corsHeaders);
  }

  // Group by page_id
  const pages: Record<string, { pageId: string; sections: { id: string; label: string; type: string; content: string }[]; updatedAt: string }> = {};
  for (const row of results ?? []) {
    if (!pages[row.page_id]) {
      pages[row.page_id] = { pageId: row.page_id, sections: [], updatedAt: row.updated_at };
    }
    pages[row.page_id].sections.push({
      id: row.section_id,
      label: row.label,
      type: row.type,
      content: row.content,
    });
    if (row.updated_at > pages[row.page_id].updatedAt) {
      pages[row.page_id].updatedAt = row.updated_at;
    }
  }

  return json({ pages }, corsHeaders);
}

async function handleCmsGetPage(env: Env, corsHeaders: Record<string, string>, pageId: string) {
  let results: { page_id: string; section_id: string; label: string; type: string; content: string; updated_at: string }[] | undefined;
  try {
    ({ results } = await env.DB.prepare(
      "SELECT * FROM cms_pages WHERE page_id = ? ORDER BY section_id"
    ).bind(pageId).all<{ page_id: string; section_id: string; label: string; type: string; content: string; updated_at: string }>());
  } catch {
    return json({ page: null }, corsHeaders);
  }

  if (!results || results.length === 0) {
    return json({ page: null }, corsHeaders);
  }

  const page = {
    pageId,
    sections: results.map((r) => ({ id: r.section_id, label: r.label, type: r.type, content: r.content })),
    updatedAt: results.reduce((max, r) => r.updated_at > max ? r.updated_at : max, results[0].updated_at),
  };

  return json({ page }, corsHeaders);
}

async function handleCmsUpsertPage(request: Request, env: Env, corsHeaders: Record<string, string>, pageId: string) {
  const token = extractToken(request);
  if (!token) return json({ error: "Non authentifié" }, corsHeaders, 401);
  const payload = await verifyJwt(token, env.JWT_SECRET);
  if (!payload || payload.role !== "admin") {
    return json({ error: "Accès refusé" }, corsHeaders, 403);
  }

  const body = await request.json() as {
    sections: { id: string; label: string; type: string; content: string }[];
    label?: string;
  };

  if (!body.sections?.length) {
    return json({ error: "Au moins une section requise" }, corsHeaders, 400);
  }

  const now = new Date().toISOString();

  // Auto-create tables if migrations not yet applied
  try {
    await env.DB.prepare(`CREATE TABLE IF NOT EXISTS cms_pages (
      page_id TEXT NOT NULL, section_id TEXT NOT NULL, label TEXT NOT NULL DEFAULT '',
      type TEXT NOT NULL DEFAULT 'text', content TEXT NOT NULL DEFAULT '',
      updated_at TEXT NOT NULL DEFAULT (datetime('now')), PRIMARY KEY (page_id, section_id)
    )`).run();
  } catch { /* already exists */ }

  // Snapshot de l'état ACTUEL avant écrasement (migration 0011).
  // Silencieux si la table cms_revisions n'existe pas encore.
  try {
    const { results: existing } = await env.DB.prepare(
      "SELECT section_id, label, type, content FROM cms_pages WHERE page_id = ?",
    ).bind(pageId).all<{ section_id: string; label: string; type: string; content: string }>();

    if (existing && existing.length > 0) {
      const snapshot = JSON.stringify(existing);
      await env.DB.prepare(`
        INSERT INTO cms_revisions (page_id, snapshot_json, created_by, label)
        VALUES (?, ?, ?, ?)
      `).bind(pageId, snapshot, payload.sub, body.label ?? null).run();

      // Rétention : on garde les 30 révisions les plus récentes par page.
      // Les plus anciennes au-delà sont purgées pour éviter une explosion du volume.
      await env.DB.prepare(`
        DELETE FROM cms_revisions
        WHERE page_id = ?
          AND id NOT IN (
            SELECT id FROM cms_revisions
            WHERE page_id = ?
            ORDER BY created_at DESC
            LIMIT 30
          )
      `).bind(pageId, pageId).run();
    }
  } catch {
    /* migration 0011 pas encore appliquée – versioning silencieusement désactivé */
  }

  for (const section of body.sections) {
    await env.DB.prepare(`
      INSERT INTO cms_pages (page_id, section_id, label, type, content, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(page_id, section_id) DO UPDATE SET
        label = excluded.label,
        type = excluded.type,
        content = excluded.content,
        updated_at = excluded.updated_at
    `).bind(pageId, section.id, section.label, section.type, section.content, now).run();
  }

  return json({ success: true }, corsHeaders);
}

// ═══════════════════════════════════════════════════════════
//  CMS revisions – migration 0011
//  Rétention 30 snapshots par page. Restore écrase l'état courant
//  mais crée AUSSI un nouveau snapshot au préalable (versionning complet).
// ═══════════════════════════════════════════════════════════

interface DbCmsRevision {
  id: number;
  page_id: string;
  snapshot_json: string;
  created_by: string | null;
  label: string | null;
  created_at: string;
}

async function handleCmsListRevisions(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>,
  pageId: string,
) {
  const auth = await requireAdmin(request, env, corsHeaders);
  if ("error" in auth) return auth.error;

  try {
    // LEFT JOIN pour ramener l'email de l'auteur – un utilisateur peut avoir
    // été supprimé, donc on tolère le NULL.
    const { results } = await env.DB.prepare(
      `SELECT r.id, r.page_id, r.snapshot_json, r.created_by, r.label, r.created_at,
              u.email AS created_by_email
         FROM cms_revisions r
         LEFT JOIN users u ON u.id = r.created_by
        WHERE r.page_id = ?
        ORDER BY r.created_at DESC
        LIMIT 30`,
    ).bind(pageId).all<DbCmsRevision & { created_by_email: string | null }>();

    return json(
      {
        revisions: (results ?? []).map((r) => ({
          id: r.id,
          pageId: r.page_id,
          createdBy: r.created_by,
          createdByEmail: r.created_by_email,
          label: r.label,
          createdAt: r.created_at,
          sectionsCount: (() => {
            try {
              return (JSON.parse(r.snapshot_json) as unknown[]).length;
            } catch {
              return 0;
            }
          })(),
        })),
      },
      corsHeaders,
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (/no such table/i.test(msg)) {
      return json({ revisions: [] }, corsHeaders);
    }
    throw err;
  }
}

/**
 * GET /api/cms/pages/:pageId/revisions/:id
 * Retourne le snapshot complet (sections désérialisées) pour affichage dans
 * la vue diff. JWT+admin. Utilise un LEFT JOIN pour ramener l'email de l'auteur.
 */
async function handleCmsGetRevision(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>,
  pageId: string,
  revisionId: number,
) {
  const auth = await requireAdmin(request, env, corsHeaders);
  if ("error" in auth) return auth.error;

  try {
    const row = await env.DB.prepare(
      `SELECT r.id, r.page_id, r.snapshot_json, r.created_by, r.label, r.created_at,
              u.email AS created_by_email
         FROM cms_revisions r
         LEFT JOIN users u ON u.id = r.created_by
        WHERE r.id = ? AND r.page_id = ?`,
    ).bind(revisionId, pageId).first<DbCmsRevision & { created_by_email: string | null }>();

    if (!row) return json({ error: "Révision introuvable" }, corsHeaders, 404);

    let sections: Array<{ section_id: string; label: string; type: string; content: string }> = [];
    try {
      const parsed = JSON.parse(row.snapshot_json);
      if (Array.isArray(parsed)) sections = parsed;
    } catch {
      return json({ error: "Snapshot corrompu" }, corsHeaders, 500);
    }

    return json(
      {
        revision: {
          id: row.id,
          pageId: row.page_id,
          createdBy: row.created_by,
          createdByEmail: row.created_by_email,
          label: row.label,
          createdAt: row.created_at,
          sections: sections.map((s) => ({
            id: s.section_id,
            label: s.label,
            type: s.type,
            content: s.content,
          })),
        },
      },
      corsHeaders,
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (/no such table/i.test(msg)) {
      return json({ error: "Révision introuvable" }, corsHeaders, 404);
    }
    throw err;
  }
}

async function handleCmsRestoreRevision(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>,
  pageId: string,
  revisionId: number,
) {
  const auth = await requireAdmin(request, env, corsHeaders);
  if ("error" in auth) return auth.error;

  const row = await env.DB.prepare(
    "SELECT snapshot_json FROM cms_revisions WHERE id = ? AND page_id = ?",
  ).bind(revisionId, pageId).first<{ snapshot_json: string }>();
  if (!row) return json({ error: "Révision introuvable" }, corsHeaders, 404);

  let sections: { section_id: string; label: string; type: string; content: string }[];
  try {
    sections = JSON.parse(row.snapshot_json);
    if (!Array.isArray(sections)) throw new Error("snapshot invalide");
  } catch {
    return json({ error: "Snapshot corrompu" }, corsHeaders, 500);
  }

  // Avant d'écraser, on snapshot l'état courant (pour pouvoir rollback du rollback).
  try {
    const { results: existing } = await env.DB.prepare(
      "SELECT section_id, label, type, content FROM cms_pages WHERE page_id = ?",
    ).bind(pageId).all<{ section_id: string; label: string; type: string; content: string }>();

    if (existing && existing.length > 0) {
      await env.DB.prepare(`
        INSERT INTO cms_revisions (page_id, snapshot_json, created_by, label)
        VALUES (?, ?, ?, ?)
      `).bind(
        pageId,
        JSON.stringify(existing),
        auth.userId,
        `Avant restauration de la révision #${revisionId}`,
      ).run();
    }
  } catch {
    /* best-effort */
  }

  // On remplace toutes les sections de la page par celles du snapshot.
  const now = new Date().toISOString();
  await env.DB.prepare("DELETE FROM cms_pages WHERE page_id = ?").bind(pageId).run();
  for (const s of sections) {
    await env.DB.prepare(`
      INSERT INTO cms_pages (page_id, section_id, label, type, content, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(pageId, s.section_id, s.label, s.type, s.content, now).run();
  }

  return json({ success: true, restoredRevisionId: revisionId }, corsHeaders);
}

// ═══════════════════════════════════════════════════════════
//  Jobs – CRUD for job offers
// ═══════════════════════════════════════════════════════════

interface DbJob {
  id: string; slug: string; title: string; company: string; company_slug: string;
  location: string; zone: string; contract_type: string; category: string;
  brevet: string | null; description: string; profile: string | null;
  conditions: string | null; contact_email: string | null; contact_name: string | null;
  contact_phone: string | null; application_url: string | null; reference: string | null;
  start_date: string | null; salary_range: string | null; salary_min: number | null;
  handi_accessible: number; published: number; published_at: string;
  expires_at: string | null; source: string; created_by: string | null;
  hydros_offer_url: string | null; hydros_offer_id: string | null;
  created_at: string; updated_at: string;
}

function toFrontendJob(row: DbJob) {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    company: row.company,
    companySlug: row.company_slug,
    location: row.location,
    zone: row.zone,
    contractType: row.contract_type,
    category: row.category,
    brevet: row.brevet ?? undefined,
    description: row.description,
    profile: row.profile ?? "",
    conditions: row.conditions ?? "",
    contactEmail: row.contact_email ?? "",
    contactName: row.contact_name ?? undefined,
    contactPhone: row.contact_phone ?? undefined,
    applicationUrl: row.application_url ?? undefined,
    reference: row.reference ?? undefined,
    startDate: row.start_date ?? undefined,
    salaryRange: row.salary_range ?? undefined,
    salaryMin: row.salary_min ?? undefined,
    handiAccessible: row.handi_accessible === 1 ? true : undefined,
    published: row.published === 1,
    publishedAt: row.published_at,
    expiresAt: row.expires_at ?? undefined,
    source: row.source,
    createdBy: row.created_by ?? undefined,
    hydrosOfferUrl: row.hydros_offer_url ?? undefined,
    hydrosOfferId: row.hydros_offer_id ?? undefined,
  };
}

async function handleJobsList(request: Request, env: Env, corsHeaders: Record<string, string>) {
  // Public: only published jobs. Admin: all jobs.
  const token = extractToken(request);
  let isAdmin = false;
  if (token) {
    const payload = await verifyJwt(token, env.JWT_SECRET);
    if (payload?.role === "admin") isAdmin = true;
  }

  const query = isAdmin
    ? "SELECT * FROM jobs ORDER BY published_at DESC"
    : "SELECT * FROM jobs WHERE published = 1 ORDER BY published_at DESC";

  const { results } = await env.DB.prepare(query).all<DbJob>();
  return json({ jobs: (results ?? []).map(toFrontendJob) }, corsHeaders);
}

async function handleJobGet(env: Env, corsHeaders: Record<string, string>, jobId: string) {
  const row = await env.DB.prepare("SELECT * FROM jobs WHERE id = ? OR slug = ?").bind(jobId, jobId).first<DbJob>();
  if (!row) return json({ error: "Offre introuvable" }, corsHeaders, 404);
  return json({ job: toFrontendJob(row) }, corsHeaders);
}

async function handleJobCreate(request: Request, env: Env, corsHeaders: Record<string, string>) {
  const token = extractToken(request);
  if (!token) return json({ error: "Non authentifié" }, corsHeaders, 401);
  const payload = await verifyJwt(token, env.JWT_SECRET);
  if (!payload) return json({ error: "Token invalide" }, corsHeaders, 401);

  // Only admin or adherent can create jobs
  if (payload.role !== "admin" && payload.role !== "adherent") {
    return json({ error: "Accès refusé" }, corsHeaders, 403);
  }

  const body = await request.json() as Record<string, unknown>;
  const title = body.title as string;
  const company = body.company as string;

  if (!title?.trim() || !company?.trim()) {
    return json({ error: "Titre et entreprise requis" }, corsHeaders, 400);
  }

  const id = body.id as string || `${payload.role === "admin" ? "admin" : "adherent"}-${Date.now()}`;
  const slug = (body.slug as string) || title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  await env.DB.prepare(`
    INSERT INTO jobs (id, slug, title, company, company_slug, location, zone, contract_type, category,
      brevet, description, profile, conditions, contact_email, contact_name, contact_phone,
      application_url, reference, start_date, salary_range, salary_min, handi_accessible,
      published, published_at, expires_at, source, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id, slug, sanitize(title.trim()), sanitize(company.trim()),
    (body.companySlug as string) || company.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    sanitize((body.location as string) || ""),
    (body.zone as string) || "normandie",
    (body.contractType as string) || "CDI",
    (body.category as string) || "Autre",
    (body.brevet as string) || null,
    (body.description as string) || "",
    (body.profile as string) || null,
    (body.conditions as string) || null,
    (body.contactEmail as string) || null,
    (body.contactName as string) || null,
    (body.contactPhone as string) || null,
    (body.applicationUrl as string) || null,
    (body.reference as string) || null,
    (body.startDate as string) || null,
    (body.salaryRange as string) || null,
    (body.salaryMin as number) || null,
    body.handiAccessible ? 1 : 0,
    body.published !== false ? 1 : 0,
    (body.publishedAt as string) || new Date().toISOString().split("T")[0],
    (body.expiresAt as string) || null,
    payload.role === "admin" ? "admin" : "adherent",
    payload.sub,
  ).run();

  const row = await env.DB.prepare("SELECT * FROM jobs WHERE id = ?").bind(id).first<DbJob>();
  return json({ success: true, job: row ? toFrontendJob(row) : null }, corsHeaders, 201);
}

async function handleJobUpdate(request: Request, env: Env, corsHeaders: Record<string, string>, jobId: string) {
  const token = extractToken(request);
  if (!token) return json({ error: "Non authentifié" }, corsHeaders, 401);
  const payload = await verifyJwt(token, env.JWT_SECRET);
  if (!payload) return json({ error: "Token invalide" }, corsHeaders, 401);

  // Check ownership or admin
  const existing = await env.DB.prepare("SELECT created_by FROM jobs WHERE id = ?").bind(jobId).first<{ created_by: string | null }>();
  if (!existing) return json({ error: "Offre introuvable" }, corsHeaders, 404);
  if (payload.role !== "admin" && existing.created_by !== payload.sub) {
    return json({ error: "Accès refusé" }, corsHeaders, 403);
  }

  const body = await request.json() as Record<string, unknown>;
  const fieldMap: Record<string, string> = {
    title: "title", slug: "slug", company: "company", companySlug: "company_slug",
    location: "location", zone: "zone", contractType: "contract_type",
    category: "category", brevet: "brevet", description: "description",
    profile: "profile", conditions: "conditions", contactEmail: "contact_email",
    contactName: "contact_name", contactPhone: "contact_phone",
    applicationUrl: "application_url", reference: "reference", startDate: "start_date",
    salaryRange: "salary_range", salaryMin: "salary_min",
    handiAccessible: "handi_accessible", published: "published",
    publishedAt: "published_at", expiresAt: "expires_at",
    hydrosOfferUrl: "hydros_offer_url", hydrosOfferId: "hydros_offer_id",
  };

  const updates: string[] = [];
  const values: unknown[] = [];
  for (const [fKey, dbCol] of Object.entries(fieldMap)) {
    if (fKey in body) {
      updates.push(`${dbCol} = ?`);
      const val = body[fKey];
      values.push(typeof val === "boolean" ? (val ? 1 : 0) : val);
    }
  }

  if (updates.length === 0) return json({ error: "Aucun champ à mettre à jour" }, corsHeaders, 400);
  updates.push("updated_at = datetime('now')");
  values.push(jobId);

  await env.DB.prepare(`UPDATE jobs SET ${updates.join(", ")} WHERE id = ?`).bind(...values).run();
  const row = await env.DB.prepare("SELECT * FROM jobs WHERE id = ?").bind(jobId).first<DbJob>();
  return json({ success: true, job: row ? toFrontendJob(row) : null }, corsHeaders);
}

async function handleJobDelete(request: Request, env: Env, corsHeaders: Record<string, string>, jobId: string) {
  const token = extractToken(request);
  if (!token) return json({ error: "Non authentifié" }, corsHeaders, 401);
  const payload = await verifyJwt(token, env.JWT_SECRET);
  if (!payload) return json({ error: "Token invalide" }, corsHeaders, 401);

  const existing = await env.DB.prepare("SELECT created_by FROM jobs WHERE id = ?").bind(jobId).first<{ created_by: string | null }>();
  if (!existing) return json({ error: "Offre introuvable" }, corsHeaders, 404);
  if (payload.role !== "admin" && existing.created_by !== payload.sub) {
    return json({ error: "Accès refusé" }, corsHeaders, 403);
  }

  await env.DB.prepare("DELETE FROM jobs WHERE id = ?").bind(jobId).run();
  return json({ success: true }, corsHeaders);
}

// ═══════════════════════════════════════════════════════════
//  Medical Visits – CRUD for sailor medical visits
// ═══════════════════════════════════════════════════════════

interface DbMedicalVisit {
  id: string; user_id: string; sailor_name: string; sailor_role: string | null;
  type: string; date: string; expiry_date: string | null;
  center_id: string | null; doctor_id: string | null; doctor_name: string | null;
  certificate_ref: string | null; notes: string | null; status: string;
  created_at: string; updated_at: string;
}

function toFrontendVisit(row: DbMedicalVisit) {
  return {
    id: row.id,
    sailorName: row.sailor_name,
    sailorRole: row.sailor_role ?? undefined,
    type: row.type,
    date: row.date,
    expiryDate: row.expiry_date ?? undefined,
    centerId: row.center_id ?? undefined,
    doctorId: row.doctor_id ?? undefined,
    doctorName: row.doctor_name ?? undefined,
    certificateRef: row.certificate_ref ?? undefined,
    notes: row.notes ?? undefined,
    status: row.status,
  };
}

async function handleMedicalList(request: Request, env: Env, corsHeaders: Record<string, string>) {
  const token = extractToken(request);
  if (!token) return json({ error: "Non authentifié" }, corsHeaders, 401);
  const payload = await verifyJwt(token, env.JWT_SECRET);
  if (!payload) return json({ error: "Token invalide" }, corsHeaders, 401);

  const { results } = await env.DB.prepare(
    "SELECT * FROM medical_visits WHERE user_id = ? ORDER BY date DESC"
  ).bind(payload.sub).all<DbMedicalVisit>();

  return json({ visits: (results ?? []).map(toFrontendVisit) }, corsHeaders);
}

async function handleMedicalCreate(request: Request, env: Env, corsHeaders: Record<string, string>) {
  const token = extractToken(request);
  if (!token) return json({ error: "Non authentifié" }, corsHeaders, 401);
  const payload = await verifyJwt(token, env.JWT_SECRET);
  if (!payload) return json({ error: "Token invalide" }, corsHeaders, 401);

  const body = await request.json() as Record<string, unknown>;
  const sailorName = body.sailorName as string;
  const visitDate = body.date as string;
  const visitType = body.type as string;

  if (!sailorName?.trim() || !visitDate || !visitType) {
    return json({ error: "Nom du marin, date et type requis" }, corsHeaders, 400);
  }

  const id = (body.id as string) || crypto.randomUUID();

  await env.DB.prepare(`
    INSERT INTO medical_visits (id, user_id, sailor_name, sailor_role, type, date, expiry_date,
      center_id, doctor_id, doctor_name, certificate_ref, notes, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id, payload.sub, sanitize(sailorName.trim()),
    (body.sailorRole as string)?.trim() || null,
    visitType, visitDate,
    (body.expiryDate as string) || null,
    (body.centerId as string) || null,
    (body.doctorId as string) || null,
    (body.doctorName as string) || null,
    (body.certificateRef as string) || null,
    (body.notes as string) || null,
    (body.status as string) || "scheduled",
  ).run();

  const row = await env.DB.prepare("SELECT * FROM medical_visits WHERE id = ?").bind(id).first<DbMedicalVisit>();
  return json({ success: true, visit: row ? toFrontendVisit(row) : null }, corsHeaders, 201);
}

async function handleMedicalUpdate(request: Request, env: Env, corsHeaders: Record<string, string>, visitId: string) {
  const token = extractToken(request);
  if (!token) return json({ error: "Non authentifié" }, corsHeaders, 401);
  const payload = await verifyJwt(token, env.JWT_SECRET);
  if (!payload) return json({ error: "Token invalide" }, corsHeaders, 401);

  // Ensure visit belongs to user
  const existing = await env.DB.prepare("SELECT user_id FROM medical_visits WHERE id = ?").bind(visitId).first<{ user_id: string }>();
  if (!existing) return json({ error: "Visite introuvable" }, corsHeaders, 404);
  if (existing.user_id !== payload.sub && payload.role !== "admin") {
    return json({ error: "Accès refusé" }, corsHeaders, 403);
  }

  const body = await request.json() as Record<string, unknown>;
  const fieldMap: Record<string, string> = {
    sailorName: "sailor_name", sailorRole: "sailor_role", type: "type",
    date: "date", expiryDate: "expiry_date", centerId: "center_id",
    doctorId: "doctor_id", doctorName: "doctor_name",
    certificateRef: "certificate_ref", notes: "notes", status: "status",
  };

  const updates: string[] = [];
  const values: unknown[] = [];
  for (const [fKey, dbCol] of Object.entries(fieldMap)) {
    if (fKey in body) {
      updates.push(`${dbCol} = ?`);
      values.push(body[fKey]);
    }
  }

  if (updates.length === 0) return json({ error: "Aucun champ à mettre à jour" }, corsHeaders, 400);
  updates.push("updated_at = datetime('now')");
  values.push(visitId);

  await env.DB.prepare(`UPDATE medical_visits SET ${updates.join(", ")} WHERE id = ?`).bind(...values).run();
  const row = await env.DB.prepare("SELECT * FROM medical_visits WHERE id = ?").bind(visitId).first<DbMedicalVisit>();
  return json({ success: true, visit: row ? toFrontendVisit(row) : null }, corsHeaders);
}

async function handleMedicalDelete(request: Request, env: Env, corsHeaders: Record<string, string>, visitId: string) {
  const token = extractToken(request);
  if (!token) return json({ error: "Non authentifié" }, corsHeaders, 401);
  const payload = await verifyJwt(token, env.JWT_SECRET);
  if (!payload) return json({ error: "Token invalide" }, corsHeaders, 401);

  const existing = await env.DB.prepare("SELECT user_id FROM medical_visits WHERE id = ?").bind(visitId).first<{ user_id: string }>();
  if (!existing) return json({ error: "Visite introuvable" }, corsHeaders, 404);
  if (existing.user_id !== payload.sub && payload.role !== "admin") {
    return json({ error: "Accès refusé" }, corsHeaders, 403);
  }

  await env.DB.prepare("DELETE FROM medical_visits WHERE id = ?").bind(visitId).run();
  return json({ success: true }, corsHeaders);
}

// ═══════════════════════════════════════════════════════════
//  Media Files – Upload/list/delete with R2 storage
// ═══════════════════════════════════════════════════════════

// Image magic bytes for media uploads (extends document magic bytes)
const IMAGE_MAGIC_BYTES: Record<string, Uint8Array[]> = {
  "image/png": [new Uint8Array([0x89, 0x50, 0x4e, 0x47])],
  "image/jpeg": [new Uint8Array([0xff, 0xd8, 0xff])],
  "image/gif": [new Uint8Array([0x47, 0x49, 0x46, 0x38])],
  "image/webp": [new Uint8Array([0x52, 0x49, 0x46, 0x46])],
};

function validateMediaMagicBytes(buffer: ArrayBuffer, declaredType: string): boolean {
  // SVG is text-based, skip magic bytes
  if (declaredType === "image/svg+xml") return true;
  const signatures = IMAGE_MAGIC_BYTES[declaredType] ?? MAGIC_BYTES[declaredType];
  if (!signatures) return false;
  const header = new Uint8Array(buffer.slice(0, 4));
  return signatures.some((sig) => sig.every((byte, i) => header[i] === byte));
}

async function handleMediaList(request: Request, env: Env, corsHeaders: Record<string, string>) {
  const token = extractToken(request);
  if (!token) return json({ error: "Non authentifié" }, corsHeaders, 401);
  const payload = await verifyJwt(token, env.JWT_SECRET);
  if (!payload || payload.role !== "admin") {
    return json({ error: "Accès refusé" }, corsHeaders, 403);
  }

  const { results } = await env.DB.prepare(
    "SELECT * FROM media_files ORDER BY created_at DESC"
  ).all<{ id: string; name: string; type: string; r2_key: string; size: number; alt: string | null; uploaded_by: string | null; created_at: string }>();

  return json({
    items: (results ?? []).map((r) => ({
      id: r.id,
      name: r.name,
      type: r.type,
      r2Key: r.r2_key,
      size: r.size,
      alt: r.alt ?? undefined,
      uploadedBy: r.uploaded_by ?? undefined,
      uploadedAt: r.created_at,
    })),
  }, corsHeaders);
}

async function handleMediaUpload(request: Request, env: Env, corsHeaders: Record<string, string>) {
  const token = extractToken(request);
  if (!token) return json({ error: "Non authentifié" }, corsHeaders, 401);
  const payload = await verifyJwt(token, env.JWT_SECRET);
  if (!payload || payload.role !== "admin") {
    return json({ error: "Accès refusé" }, corsHeaders, 403);
  }

  const formData = await request.formData();
  const file = formData.get("file") as File;
  const alt = formData.get("alt") as string;

  if (!file) return json({ error: "Aucun fichier fourni" }, corsHeaders, 400);

  const allowedTypes = [
    "image/png", "image/jpeg", "image/gif", "image/webp", "image/svg+xml",
    "application/pdf", "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];

  if (!allowedTypes.includes(file.type)) {
    return json({ error: "Type de fichier non autorisé" }, corsHeaders, 400);
  }

  if (file.size > 10 * 1024 * 1024) {
    return json({ error: "Fichier trop volumineux (max 10 Mo)" }, corsHeaders, 400);
  }

  const buffer = await file.arrayBuffer();
  if (!validateMediaMagicBytes(buffer, file.type)) {
    return json({ error: "Le contenu du fichier ne correspond pas au type déclaré" }, corsHeaders, 400);
  }

  const id = `media-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const r2Key = `media/${crypto.randomUUID()}-${file.name}`;

  await env.UPLOADS.put(r2Key, buffer, {
    httpMetadata: { contentType: file.type },
    customMetadata: { originalName: file.name, uploadedAt: new Date().toISOString() },
  });

  await env.DB.prepare(`
    INSERT INTO media_files (id, name, type, r2_key, size, alt, uploaded_by)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).bind(id, file.name, file.type, r2Key, file.size, alt || null, payload.sub).run();

  return json({
    success: true,
    item: { id, name: file.name, type: file.type, r2Key, size: file.size, alt: alt || undefined, uploadedAt: new Date().toISOString() },
  }, corsHeaders, 201);
}

async function handleMediaDelete(request: Request, env: Env, corsHeaders: Record<string, string>, mediaId: string) {
  const token = extractToken(request);
  if (!token) return json({ error: "Non authentifié" }, corsHeaders, 401);
  const payload = await verifyJwt(token, env.JWT_SECRET);
  if (!payload || payload.role !== "admin") {
    return json({ error: "Accès refusé" }, corsHeaders, 403);
  }

  const row = await env.DB.prepare("SELECT r2_key FROM media_files WHERE id = ?").bind(mediaId).first<{ r2_key: string }>();
  if (!row) return json({ error: "Fichier introuvable" }, corsHeaders, 404);

  // Delete from R2
  await env.UPLOADS.delete(row.r2_key);
  // Delete metadata
  await env.DB.prepare("DELETE FROM media_files WHERE id = ?").bind(mediaId).run();

  return json({ success: true }, corsHeaders);
}

/**
 * Public raw media serving – GET /api/media/raw/:r2Key
 * Pas d'auth : les images uploadées via CMS sont destinées à être affichées
 * publiquement (photos bureau, illustrations de pages, etc.).
 * Clé R2 nettoyée pour n'accepter que les préfixes connus.
 */
async function handleMediaRaw(env: Env, corsHeaders: Record<string, string>, r2Key: string) {
  // Seules les clés sous "media/" sont exposées publiquement (le reste R2 est privé).
  if (!r2Key.startsWith("media/") || r2Key.includes("..")) {
    return new Response("Not found", { status: 404, headers: corsHeaders });
  }
  const object = await env.UPLOADS.get(r2Key);
  if (!object) return new Response("Not found", { status: 404, headers: corsHeaders });

  const headers = new Headers(corsHeaders);
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("cache-control", "public, max-age=86400, immutable");
  return new Response(object.body, { headers });
}

// ═══════════════════════════════════════════════════════════
//  Newsletter drafts – CRUD (Phase 1 foundation)
//  Sending endpoints live separately once Brevo list IDs are configured.
// ═══════════════════════════════════════════════════════════

interface NlDraftRow {
  id: string;
  title: string;
  subject: string;
  preheader: string;
  blocks_json: string;
  status: "draft" | "sent" | "archived";
  created_by: string;
  created_at: string;
  updated_at: string;
}

async function ensureNlDraftsTable(env: Env) {
  try {
    await env.DB.prepare(`CREATE TABLE IF NOT EXISTS nl_drafts (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      subject TEXT NOT NULL DEFAULT '',
      preheader TEXT NOT NULL DEFAULT '',
      blocks_json TEXT NOT NULL DEFAULT '[]',
      status TEXT NOT NULL DEFAULT 'draft',
      created_by TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`).run();
  } catch { /* table may exist with different schema – ignore */ }
}

async function requireAdmin(request: Request, env: Env, corsHeaders: Record<string, string>) {
  const token = extractToken(request);
  if (!token) return { error: json({ error: "Non authentifié" }, corsHeaders, 401) };
  const payload = await verifyJwt(token, env.JWT_SECRET);
  if (!payload || payload.role !== "admin") {
    return { error: json({ error: "Accès refusé" }, corsHeaders, 403) };
  }
  return { userId: String(payload.sub) };
}

async function handleNlDraftsList(request: Request, env: Env, corsHeaders: Record<string, string>) {
  const auth = await requireAdmin(request, env, corsHeaders);
  if ("error" in auth) return auth.error;
  await ensureNlDraftsTable(env);
  try {
    const { results } = await env.DB.prepare(
      "SELECT * FROM nl_drafts ORDER BY updated_at DESC"
    ).all<NlDraftRow>();
    return json({ drafts: results ?? [] }, corsHeaders);
  } catch {
    return json({ drafts: [] }, corsHeaders);
  }
}

async function handleNlDraftsGet(request: Request, env: Env, corsHeaders: Record<string, string>, id: string) {
  const auth = await requireAdmin(request, env, corsHeaders);
  if ("error" in auth) return auth.error;
  await ensureNlDraftsTable(env);
  const row = await env.DB.prepare("SELECT * FROM nl_drafts WHERE id = ?").bind(id).first<NlDraftRow>();
  return json({ draft: row ?? null }, corsHeaders);
}

async function handleNlDraftsCreate(request: Request, env: Env, corsHeaders: Record<string, string>) {
  const auth = await requireAdmin(request, env, corsHeaders);
  if ("error" in auth) return auth.error;
  await ensureNlDraftsTable(env);

  const body = await request.json() as {
    id?: string;
    title: string;
    subject?: string;
    preheader?: string;
    blocks?: unknown[];
  };

  if (!body.title || !body.title.trim()) {
    return json({ error: "Titre requis" }, corsHeaders, 400);
  }

  const id = body.id || `nl-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const now = new Date().toISOString();
  const blocksJson = JSON.stringify(body.blocks ?? []);

  await env.DB.prepare(
    `INSERT INTO nl_drafts (id, title, subject, preheader, blocks_json, status, created_by, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, 'draft', ?, ?, ?)`
  ).bind(id, body.title.trim(), body.subject ?? "", body.preheader ?? "", blocksJson, auth.userId, now, now).run();

  const row = await env.DB.prepare("SELECT * FROM nl_drafts WHERE id = ?").bind(id).first<NlDraftRow>();
  return json({ draft: row }, corsHeaders);
}

async function handleNlDraftsUpdate(request: Request, env: Env, corsHeaders: Record<string, string>, id: string) {
  const auth = await requireAdmin(request, env, corsHeaders);
  if ("error" in auth) return auth.error;
  await ensureNlDraftsTable(env);

  const body = await request.json() as {
    title?: string;
    subject?: string;
    preheader?: string;
    blocks?: unknown[];
  };

  const existing = await env.DB.prepare("SELECT * FROM nl_drafts WHERE id = ?").bind(id).first<NlDraftRow>();
  if (!existing) return json({ error: "Brouillon introuvable" }, corsHeaders, 404);

  const now = new Date().toISOString();
  const title = body.title?.trim() ?? existing.title;
  const subject = body.subject ?? existing.subject;
  const preheader = body.preheader ?? existing.preheader;
  const blocksJson = body.blocks ? JSON.stringify(body.blocks) : existing.blocks_json;

  await env.DB.prepare(
    `UPDATE nl_drafts SET title = ?, subject = ?, preheader = ?, blocks_json = ?, updated_at = ? WHERE id = ?`
  ).bind(title, subject, preheader, blocksJson, now, id).run();

  return json({ success: true }, corsHeaders);
}

async function handleNlDraftsDelete(request: Request, env: Env, corsHeaders: Record<string, string>, id: string) {
  const auth = await requireAdmin(request, env, corsHeaders);
  if ("error" in auth) return auth.error;
  await ensureNlDraftsTable(env);
  await env.DB.prepare("DELETE FROM nl_drafts WHERE id = ?").bind(id).run();
  return json({ success: true }, corsHeaders);
}

// ═══════════════════════════════════════════════════════════════════
// Newsletter v2 – Phase 3/4/6 : test-send, bulk-send, webhook, unsub
// Bloqué par config Brevo (list IDs + webhook secret). Les endpoints
// existent pour permettre l'intégration complète dès que les secrets
// sont provisionnés via `wrangler secret put …`.
// ═══════════════════════════════════════════════════════════════════

interface NlBlock {
  id: string;
  type: string;
  [key: string]: unknown;
}

/**
 * Mapping catégorie D1 (colonne `newsletter_preferences`) → env var du list ID Brevo.
 * Les clés correspondent exactement aux colonnes de la table (migration 0003) et à
 * `NEWSLETTER_CATEGORIES` côté frontend (`src/lib/auth/types.ts`).
 */
const CATEGORY_TO_LIST_ENV: Record<string, keyof Env> = {
  info_generales: "BREVO_LIST_INFO_GENERALES",
  ag: "BREVO_LIST_AG",
  emploi: "BREVO_LIST_EMPLOI",
  formation_opco: "BREVO_LIST_FORMATION_OPCO",
  veille_juridique: "BREVO_LIST_VEILLE_JURIDIQUE",
  veille_sociale: "BREVO_LIST_VEILLE_SOCIALE",
  veille_surete: "BREVO_LIST_VEILLE_SURETE",
  veille_data: "BREVO_LIST_VEILLE_DATA",
  veille_environnement: "BREVO_LIST_VEILLE_ENVIRONNEMENT",
  actualites_gaspe: "BREVO_LIST_ACTUALITES_GASPE",
};

const ALL_NEWSLETTER_CATEGORIES = Object.keys(CATEGORY_TO_LIST_ENV);

/**
 * Rendu HTML minimal côté Worker – la charte complète reste dans le renderer
 * frontend. Pour le POC, on envoie le HTML pré-rendu par le client (champ
 * `htmlContent` dans le body de l'envoi). Plus tard : récupérer les blocs
 * JSON et rerender côté Worker pour garantir intégrité charte.
 */
function simpleHtmlFromBlocks(blocks: NlBlock[]): string {
  const parts = blocks.map((b) => {
    const type = b.type;
    if (type === "heading") return `<h2 style="font-family:Exo 2,sans-serif;color:#1B7E8A">${String(b.text ?? "")}</h2>`;
    if (type === "paragraph") return `<p style="font-family:DM Sans,sans-serif;color:#222">${String(b.text ?? "")}</p>`;
    if (type === "button") return `<p><a href="${String(b.url ?? "#")}" style="background:#1B7E8A;color:#fff;padding:12px 24px;border-radius:12px;text-decoration:none">${String(b.label ?? "En savoir plus")}</a></p>`;
    return "";
  });
  return `<!DOCTYPE html><html><body style="background:#F5F3F0;padding:24px">${parts.join("")}</body></html>`;
}

async function loadDraftOrError(env: Env, id: string) {
  const row = await env.DB.prepare("SELECT * FROM nl_drafts WHERE id = ?").bind(id).first<NlDraftRow>();
  return row;
}

async function handleNewsletterTestSend(request: Request, env: Env, corsHeaders: Record<string, string>, draftId: string) {
  const auth = await requireAdmin(request, env, corsHeaders);
  if ("error" in auth) return auth.error;

  if (!env.BREVO_API_KEY) {
    return json({ error: "BREVO_API_KEY non configurée sur le Worker" }, corsHeaders, 503);
  }

  const body = await request.json().catch(() => ({})) as { recipients?: string[] };
  const recipients = (body.recipients ?? []).filter((e) => typeof e === "string" && /@/.test(e));
  if (recipients.length === 0 || recipients.length > 5) {
    return json({ error: "Fournir 1 à 5 emails de test" }, corsHeaders, 400);
  }

  await ensureNlDraftsTable(env);
  const draft = await loadDraftOrError(env, draftId);
  if (!draft) return json({ error: "Brouillon introuvable" }, corsHeaders, 404);

  let blocks: NlBlock[] = [];
  try { blocks = JSON.parse(draft.blocks_json) as NlBlock[]; } catch { /* empty */ }
  const html = simpleHtmlFromBlocks(blocks);

  const senderEmail = env.BREVO_SENDER_EMAIL ?? env.CONTACT_EMAIL ?? "contact@gaspe.fr";
  const senderName = env.BREVO_SENDER_NAME ?? "GASPE";

  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "accept": "application/json", "content-type": "application/json", "api-key": env.BREVO_API_KEY },
    body: JSON.stringify({
      sender: { email: senderEmail, name: senderName },
      to: recipients.map((email) => ({ email })),
      replyTo: env.BREVO_REPLY_TO ? { email: env.BREVO_REPLY_TO } : undefined,
      subject: `[TEST] ${draft.subject}`,
      htmlContent: html,
      headers: { "X-GASPE-Test": "true" },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    return json({ error: `Brevo a refusé l'envoi (${res.status})`, details: text.slice(0, 200) }, corsHeaders, 502);
  }
  return json({ success: true, sent: recipients.length }, corsHeaders);
}

async function handleNewsletterBulkSend(request: Request, env: Env, corsHeaders: Record<string, string>, draftId: string) {
  const auth = await requireAdmin(request, env, corsHeaders);
  if ("error" in auth) return auth.error;

  const body = await request.json().catch(() => ({})) as { category?: string };
  const category = body.category ?? "";
  const listEnvKey = CATEGORY_TO_LIST_ENV[category];
  if (!listEnvKey) return json({ error: "Catégorie invalide" }, corsHeaders, 400);

  const listId = env[listEnvKey] as string | undefined;
  if (!env.BREVO_API_KEY || !listId) {
    return json({
      error: "Envoi production non configuré",
      missing: !env.BREVO_API_KEY ? ["BREVO_API_KEY"] : [listEnvKey],
      hint: "Configurer via `wrangler secret put` puis redéployer.",
    }, corsHeaders, 503);
  }

  await ensureNlDraftsTable(env);
  const draft = await loadDraftOrError(env, draftId);
  if (!draft) return json({ error: "Brouillon introuvable" }, corsHeaders, 404);

  let blocks: NlBlock[] = [];
  try { blocks = JSON.parse(draft.blocks_json) as NlBlock[]; } catch { /* empty */ }
  const html = simpleHtmlFromBlocks(blocks);

  const senderEmail = env.BREVO_SENDER_EMAIL ?? env.CONTACT_EMAIL ?? "contact@gaspe.fr";
  const senderName = env.BREVO_SENDER_NAME ?? "GASPE";

  // Campagne Brevo classique via "email campaigns" – plus scalable que SMTP direct.
  const res = await fetch("https://api.brevo.com/v3/emailCampaigns", {
    method: "POST",
    headers: { "accept": "application/json", "content-type": "application/json", "api-key": env.BREVO_API_KEY },
    body: JSON.stringify({
      name: `GASPE – ${draft.title} [${category}]`,
      subject: draft.subject,
      sender: { email: senderEmail, name: senderName },
      replyTo: env.BREVO_REPLY_TO ?? senderEmail,
      htmlContent: html,
      recipients: { listIds: [Number(listId)] },
    }),
  });

  const campaignResp = await res.json().catch(() => ({})) as { id?: number; message?: string };
  if (!res.ok) {
    return json({ error: `Brevo erreur ${res.status}`, details: campaignResp }, corsHeaders, 502);
  }

  // Déclenchement immédiat de la campagne
  if (campaignResp.id) {
    await fetch(`https://api.brevo.com/v3/emailCampaigns/${campaignResp.id}/sendNow`, {
      method: "POST",
      headers: { "api-key": env.BREVO_API_KEY },
    });
  }

  // Trace l'envoi dans nl_sends pour suivi admin
  try {
    await env.DB.prepare(`CREATE TABLE IF NOT EXISTS nl_sends (
      id TEXT PRIMARY KEY, draft_id TEXT NOT NULL, category TEXT, brevo_campaign_id TEXT,
      sent_at TEXT NOT NULL, recipients_count INTEGER DEFAULT 0
    )`).run();
    const sendId = `send-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    await env.DB.prepare(
      "INSERT INTO nl_sends (id, draft_id, category, brevo_campaign_id, sent_at) VALUES (?, ?, ?, ?, ?)"
    ).bind(sendId, draftId, category, String(campaignResp.id ?? ""), new Date().toISOString()).run();
    // Marque le draft comme "sent"
    await env.DB.prepare("UPDATE nl_drafts SET status = 'sent', updated_at = ? WHERE id = ?")
      .bind(new Date().toISOString(), draftId).run();
  } catch { /* non bloquant */ }

  return json({ success: true, campaignId: campaignResp.id }, corsHeaders);
}

/**
 * Webhook Brevo – reçoit les événements (open, click, bounce, unsubscribe).
 * Signature HMAC-SHA256 vérifiée avec BREVO_WEBHOOK_SECRET si configuré.
 * Les events sont persistés dans nl_events pour analyse admin.
 */
async function handleBrevoWebhook(request: Request, env: Env, corsHeaders: Record<string, string>) {
  if (env.BREVO_WEBHOOK_SECRET) {
    // Brevo envoie un header `x-brevo-signature` (HMAC-SHA256 sur le body).
    const signature = request.headers.get("x-brevo-signature") ?? "";
    const raw = await request.clone().text();
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw", encoder.encode(env.BREVO_WEBHOOK_SECRET),
      { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
    );
    const mac = await crypto.subtle.sign("HMAC", key, encoder.encode(raw));
    const expected = Array.from(new Uint8Array(mac)).map((b) => b.toString(16).padStart(2, "0")).join("");
    if (signature !== expected) return json({ error: "Signature invalide" }, corsHeaders, 401);
  }

  const body = await request.json().catch(() => null) as null | {
    event?: string;
    email?: string;
    "message-id"?: string;
    date?: string;
    subject?: string;
  };
  if (!body || !body.event || !body.email) return json({ error: "Payload invalide" }, corsHeaders, 400);

  try {
    await env.DB.prepare(`CREATE TABLE IF NOT EXISTS nl_events (
      id TEXT PRIMARY KEY, event TEXT, email TEXT, message_id TEXT, subject TEXT, occurred_at TEXT
    )`).run();
    const id = `evt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    await env.DB.prepare(
      "INSERT INTO nl_events (id, event, email, message_id, subject, occurred_at) VALUES (?, ?, ?, ?, ?, ?)"
    ).bind(id, body.event, body.email, body["message-id"] ?? null, body.subject ?? null, body.date ?? new Date().toISOString()).run();

    // Si désinscription ou bounce hard → désabonner de toutes les catégories.
    if (body.event === "unsubscribed" || body.event === "hard_bounce") {
      const setClause = ALL_NEWSLETTER_CATEGORIES.map((c) => `${c} = 0`).join(", ");
      await env.DB.prepare(`
        UPDATE newsletter_preferences SET ${setClause}
        WHERE user_id IN (SELECT id FROM users WHERE email = ?)
      `).bind(body.email).run();
    }
  } catch { /* swallow */ }

  return json({ success: true }, corsHeaders);
}

/**
 * Désinscription publique – la page `/newsletter/unsubscribe?token=…` appelle
 * ce endpoint avec un token HMAC signé par NEWSLETTER_UNSUB_SECRET.
 * Le token est de la forme `<email-base64>.<hmac-hex>`.
 */
async function handleNewsletterUnsubscribe(request: Request, env: Env, corsHeaders: Record<string, string>) {
  const body = await request.json().catch(() => ({})) as { token?: string; categories?: string[] };
  const token = body.token ?? "";
  if (!token || !env.NEWSLETTER_UNSUB_SECRET) {
    return json({ error: "Token manquant ou secret non configuré" }, corsHeaders, 400);
  }

  const [emailB64, sig] = token.split(".");
  if (!emailB64 || !sig) return json({ error: "Token malformé" }, corsHeaders, 400);

  const email = atob(emailB64);
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw", encoder.encode(env.NEWSLETTER_UNSUB_SECRET),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  );
  const mac = await crypto.subtle.sign("HMAC", key, encoder.encode(email));
  const expected = Array.from(new Uint8Array(mac)).map((b) => b.toString(16).padStart(2, "0")).join("");
  if (sig !== expected) return json({ error: "Signature invalide" }, corsHeaders, 401);

  // Désinscrit des catégories demandées (ou toutes si vide).
  const cats = (body.categories && body.categories.length > 0)
    ? body.categories.filter((c) => ALL_NEWSLETTER_CATEGORIES.includes(c))
    : ALL_NEWSLETTER_CATEGORIES;
  const setClause = cats.map((c) => `${c} = 0`).join(", ");

  await env.DB.prepare(`
    UPDATE newsletter_preferences SET ${setClause}
    WHERE user_id IN (SELECT id FROM users WHERE email = ?)
  `).bind(email).run();

  // Pour les inscrits legacy (table newsletter)
  await env.DB.prepare("DELETE FROM newsletter WHERE email = ?").bind(email).run();

  return json({ success: true, email, categoriesDisabled: cats }, corsHeaders);
}

// ═══════════════════════════════════════════════════════════
//  CMS Documents – migration 0010_cms_documents.sql
//  Gère la page publique /documents + l'admin /admin/documents.
// ═══════════════════════════════════════════════════════════

interface DbDocument {
  id: string;
  title: string;
  description: string;
  category: string;
  file_url: string;
  file_name: string;
  published_at: string | null;
  sort_order: number;
  is_public: number;
  published: number;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

function toFrontendDocument(row: DbDocument) {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? "",
    category: row.category,
    fileUrl: row.file_url,
    fileName: row.file_name ?? "",
    publishedAt: row.published_at,
    sortOrder: row.sort_order ?? 0,
    isPublic: row.is_public === 1,
    published: row.published === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function handleDocumentsList(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>,
  params: URLSearchParams,
) {
  // `?all=1` : adherent/admin authentifié voit privés + brouillons
  const wantAll = params.get("all") === "1";
  const token = extractToken(request);
  let canSeeAll = false;
  if (wantAll && token) {
    const payload = await verifyJwt(token, env.JWT_SECRET);
    if (payload) {
      canSeeAll = payload.role === "admin" || payload.role === "adherent";
    }
  }

  const query = canSeeAll
    ? "SELECT * FROM cms_documents ORDER BY category ASC, sort_order ASC, published_at DESC"
    : "SELECT * FROM cms_documents WHERE published = 1 AND is_public = 1 ORDER BY category ASC, sort_order ASC, published_at DESC";

  try {
    const { results } = await env.DB.prepare(query).all<DbDocument>();
    return json(
      { documents: (results ?? []).map(toFrontendDocument) },
      corsHeaders,
    );
  } catch (err) {
    // Table inexistante (migration pas encore appliquée) → réponse vide plutôt qu'une 500
    const msg = err instanceof Error ? err.message : String(err);
    if (/no such table/i.test(msg)) {
      return json({ documents: [] }, corsHeaders);
    }
    throw err;
  }
}

async function handleDocumentGet(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>,
  docId: string,
) {
  try {
    const row = await env.DB.prepare("SELECT * FROM cms_documents WHERE id = ?")
      .bind(docId)
      .first<DbDocument>();
    if (!row) return json({ error: "Document introuvable" }, corsHeaders, 404);

    // Si privé ou brouillon : exige JWT adherent/admin
    if (row.is_public !== 1 || row.published !== 1) {
      const token = extractToken(request);
      const payload = token ? await verifyJwt(token, env.JWT_SECRET) : null;
      if (!payload || (payload.role !== "admin" && payload.role !== "adherent")) {
        return json({ error: "Accès refusé" }, corsHeaders, 403);
      }
    }

    return json({ document: toFrontendDocument(row) }, corsHeaders);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (/no such table/i.test(msg)) {
      return json({ error: "Document introuvable" }, corsHeaders, 404);
    }
    throw err;
  }
}

async function handleDocumentCreate(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>,
) {
  const auth = await requireAdmin(request, env, corsHeaders);
  if ("error" in auth) return auth.error;

  const body = (await request.json()) as Record<string, unknown>;
  const title = (body.title as string)?.trim();
  const category = (body.category as string) || "institutionnels";

  if (!title) return json({ error: "Titre requis" }, corsHeaders, 400);

  const id =
    (body.id as string) ||
    `doc-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 40)}-${Date.now().toString(36)}`;

  const description = sanitize(((body.description as string) ?? "").trim());
  const fileUrl = ((body.fileUrl as string) ?? "#").trim() || "#";
  const fileName = sanitize(((body.fileName as string) ?? "").trim());
  const publishedAt = (body.publishedAt as string) ?? null;
  const sortOrder = Number.isFinite(body.sortOrder as number)
    ? (body.sortOrder as number)
    : 0;
  const isPublic = body.isPublic === false ? 0 : 1;
  const published = body.published === false ? 0 : 1;

  await env.DB.prepare(
    `INSERT INTO cms_documents
       (id, title, description, category, file_url, file_name, published_at,
        sort_order, is_public, published, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      id,
      sanitize(title),
      description,
      category,
      fileUrl,
      fileName,
      publishedAt,
      sortOrder,
      isPublic,
      published,
      auth.userId,
    )
    .run();

  const row = await env.DB.prepare("SELECT * FROM cms_documents WHERE id = ?")
    .bind(id)
    .first<DbDocument>();
  return json(
    { success: true, document: row ? toFrontendDocument(row) : null },
    corsHeaders,
    201,
  );
}

async function handleDocumentUpdate(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>,
  docId: string,
) {
  const auth = await requireAdmin(request, env, corsHeaders);
  if ("error" in auth) return auth.error;

  const existing = await env.DB.prepare("SELECT id FROM cms_documents WHERE id = ?")
    .bind(docId)
    .first<{ id: string }>();
  if (!existing) return json({ error: "Document introuvable" }, corsHeaders, 404);

  const body = (await request.json()) as Record<string, unknown>;
  const fieldMap: Record<string, string> = {
    title: "title",
    description: "description",
    category: "category",
    fileUrl: "file_url",
    fileName: "file_name",
    publishedAt: "published_at",
    sortOrder: "sort_order",
    isPublic: "is_public",
    published: "published",
  };

  const updates: string[] = [];
  const values: unknown[] = [];
  for (const [fKey, dbCol] of Object.entries(fieldMap)) {
    if (fKey in body) {
      updates.push(`${dbCol} = ?`);
      const val = body[fKey];
      if (typeof val === "boolean") values.push(val ? 1 : 0);
      else if (typeof val === "string") values.push(sanitize(val));
      else values.push(val);
    }
  }

  if (updates.length === 0) {
    return json({ error: "Aucun champ à mettre à jour" }, corsHeaders, 400);
  }

  updates.push("updated_at = datetime('now')");
  values.push(docId);

  await env.DB.prepare(
    `UPDATE cms_documents SET ${updates.join(", ")} WHERE id = ?`,
  )
    .bind(...values)
    .run();

  const row = await env.DB.prepare("SELECT * FROM cms_documents WHERE id = ?")
    .bind(docId)
    .first<DbDocument>();
  return json(
    { success: true, document: row ? toFrontendDocument(row) : null },
    corsHeaders,
  );
}

async function handleDocumentDelete(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>,
  docId: string,
) {
  const auth = await requireAdmin(request, env, corsHeaders);
  if ("error" in auth) return auth.error;

  const existing = await env.DB.prepare("SELECT id FROM cms_documents WHERE id = ?")
    .bind(docId)
    .first<{ id: string }>();
  if (!existing) return json({ error: "Document introuvable" }, corsHeaders, 404);

  await env.DB.prepare("DELETE FROM cms_documents WHERE id = ?").bind(docId).run();
  return json({ success: true }, corsHeaders);
}

// ═══════════════════════════════════════════════════════════
//  Organization Vessels – per-organization fleet
//  (migration 0012_organization_vessels.sql)
// ═══════════════════════════════════════════════════════════

interface DbVessel {
  id: string;
  organization_id: string;
  name: string;
  imo: string | null;
  type: string | null;
  operating_line: string | null;
  flag: string | null;
  image_url: string | null;
  year_built: number | null;
  length_m: number | null;
  beam_m: number | null;
  gross_tonnage: number | null;
  passenger_capacity: number | null;
  vehicle_capacity: number | null;
  freight_capacity: number | null;
  cruise_speed: number | null;
  rotations_per_year: number | null;
  crew_size: string | null;
  power_kw: string | null;
  consumption_per_trip: string | null;
  renewal_type: string | null;
  renewal_year: string | null;
  owner: string | null;
  shipyard: string | null;
  shipyard_country: string | null;
  propulsion_type: string | null;
  fuel_type: string | null;
  alt_fuel_tests: string | null;
  shore_power: string | null;
  hull_treatment: string | null;
  emission_reduction: string | null;
  crew_by_brevet: string | null;
}

function toFrontendVessel(row: DbVessel) {
  let crewByBrevet: Record<string, number> | undefined;
  if (row.crew_by_brevet) {
    try {
      const parsed = JSON.parse(row.crew_by_brevet);
      if (parsed && typeof parsed === "object") {
        crewByBrevet = Object.fromEntries(
          Object.entries(parsed)
            .filter(([, v]) => typeof v === "number" && Number.isFinite(v) && v > 0)
            .map(([k, v]) => [k, Math.floor(v as number)]),
        );
        if (Object.keys(crewByBrevet).length === 0) crewByBrevet = undefined;
      }
    } catch { /* malformed JSON – ignore */ }
  }
  return {
    id: row.id,
    name: row.name,
    imo: row.imo ?? undefined,
    type: row.type ?? undefined,
    operatingLine: row.operating_line ?? undefined,
    flag: row.flag ?? undefined,
    imageUrl: row.image_url ?? undefined,
    yearBuilt: row.year_built ?? undefined,
    length: row.length_m ?? undefined,
    beam: row.beam_m ?? undefined,
    grossTonnage: row.gross_tonnage ?? undefined,
    passengerCapacity: row.passenger_capacity ?? undefined,
    vehicleCapacity: row.vehicle_capacity ?? undefined,
    freightCapacity: row.freight_capacity ?? undefined,
    cruiseSpeed: row.cruise_speed ?? undefined,
    rotationsPerYear: row.rotations_per_year ?? undefined,
    crewSize: row.crew_size ?? undefined,
    powerKw: row.power_kw ?? undefined,
    consumptionPerTrip: row.consumption_per_trip ?? undefined,
    renewalType: row.renewal_type ?? undefined,
    renewalYear: row.renewal_year ?? undefined,
    owner: row.owner ?? undefined,
    shipyard: row.shipyard ?? undefined,
    shipyardCountry: row.shipyard_country ?? undefined,
    propulsionType: row.propulsion_type ?? undefined,
    fuelType: row.fuel_type ?? undefined,
    altFuelTests: row.alt_fuel_tests ?? undefined,
    shorePower: row.shore_power ?? undefined,
    hullTreatment: row.hull_treatment ?? undefined,
    emissionReduction: row.emission_reduction ?? undefined,
    crewByBrevet,
  };
}

/** Ensure the vessels table exists (defensive, in case migration lags). */
async function ensureVesselsTable(env: Env): Promise<void> {
  try {
    await env.DB.prepare(`CREATE TABLE IF NOT EXISTS organization_vessels (
      id TEXT PRIMARY KEY,
      organization_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      imo TEXT, type TEXT, operating_line TEXT, flag TEXT, image_url TEXT,
      year_built INTEGER, length_m REAL, beam_m REAL, gross_tonnage REAL,
      passenger_capacity INTEGER, vehicle_capacity INTEGER, freight_capacity INTEGER,
      cruise_speed REAL, rotations_per_year INTEGER,
      crew_size TEXT, power_kw TEXT, consumption_per_trip TEXT,
      renewal_type TEXT, renewal_year TEXT,
      owner TEXT, shipyard TEXT, shipyard_country TEXT,
      propulsion_type TEXT, fuel_type TEXT,
      alt_fuel_tests TEXT, shore_power TEXT, hull_treatment TEXT, emission_reduction TEXT,
      crew_by_brevet TEXT,
      created_by TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`).run();
    await env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_org_vessels_org ON organization_vessels(organization_id)").run();
  } catch {
    /* ignore – table may already exist */
  }
}

/** GET /api/organizations/:slug/fleet – public. */
async function handleGetFleet(
  _request: Request,
  env: Env,
  corsHeaders: Record<string, string>,
  slug: string,
) {
  await ensureVesselsTable(env);
  const org = await env.DB.prepare("SELECT id FROM organizations WHERE slug = ?")
    .bind(slug)
    .first<{ id: string }>();
  if (!org) return json({ error: "Organisation introuvable" }, corsHeaders, 404);

  const { results } = await env.DB.prepare(
    "SELECT * FROM organization_vessels WHERE organization_id = ? ORDER BY LOWER(name)"
  ).bind(org.id).all<DbVessel>();

  return json({ vessels: (results ?? []).map(toFrontendVessel) }, corsHeaders);
}

/**
 * GET /api/organizations/fleet
 * Vue agrégée de toutes les flottes par compagnie.
 * Auth : tout adhérent authentifié (le gating "completeness 100%" est
 * appliqué côté frontend via /espace-adherent/annuaire-flotte). L'admin
 * peut aussi appeler. Le candidat ou l'utilisateur non authentifié ne
 * peut pas accéder.
 */
async function handleListAllFleets(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>,
) {
  const token = extractToken(request);
  if (!token) return json({ error: "Non authentifié" }, corsHeaders, 401);
  const payload = await verifyJwt(token, env.JWT_SECRET);
  if (!payload) return json({ error: "Token invalide" }, corsHeaders, 401);
  if (payload.role !== "admin" && payload.role !== "adherent") {
    return json({ error: "Accès refusé" }, corsHeaders, 403);
  }

  await ensureVesselsTable(env);
  const { results } = await env.DB.prepare(
    `SELECT v.*, o.slug AS org_slug
     FROM organization_vessels v
     JOIN organizations o ON o.id = v.organization_id
     ORDER BY o.slug, LOWER(v.name)`
  ).all<DbVessel & { org_slug: string }>();

  const fleets: Record<string, ReturnType<typeof toFrontendVessel>[]> = {};
  for (const row of results ?? []) {
    const bucket = fleets[row.org_slug] ?? (fleets[row.org_slug] = []);
    bucket.push(toFrontendVessel(row));
  }
  return json({ fleets }, corsHeaders);
}

/**
 * PUT /api/organizations/:slug/fleet
 * Body : { vessels: FleetVessel[] }
 * Auth : admin OR user.organization_id === org.id
 * Comportement : remplace atomiquement la flotte complète de l'organisation.
 */
async function handleUpsertFleet(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>,
  slug: string,
) {
  const token = extractToken(request);
  if (!token) return json({ error: "Non authentifié" }, corsHeaders, 401);
  const payload = await verifyJwt(token, env.JWT_SECRET);
  if (!payload) return json({ error: "Token invalide" }, corsHeaders, 401);

  await ensureVesselsTable(env);
  const org = await env.DB.prepare("SELECT id FROM organizations WHERE slug = ?")
    .bind(slug)
    .first<{ id: string }>();
  if (!org) return json({ error: "Organisation introuvable" }, corsHeaders, 404);

  // Ownership : admin OR member of the same organization
  if (payload.role !== "admin") {
    const user = await env.DB.prepare("SELECT organization_id FROM users WHERE id = ?")
      .bind(payload.sub)
      .first<{ organization_id: string | null }>();
    if (!user || user.organization_id !== org.id) {
      return json({ error: "Accès refusé" }, corsHeaders, 403);
    }
  }

  let body: { vessels?: unknown };
  try {
    body = (await request.json()) as { vessels?: unknown };
  } catch {
    return json({ error: "Body JSON invalide" }, corsHeaders, 400);
  }
  if (!Array.isArray(body.vessels)) {
    return json({ error: "Champ 'vessels' manquant ou invalide" }, corsHeaders, 400);
  }
  const vessels = body.vessels as Array<Record<string, unknown>>;

  // Atomic replace : delete existing vessels + insert new list.
  const stmts = [
    env.DB.prepare("DELETE FROM organization_vessels WHERE organization_id = ?").bind(org.id),
  ];
  for (const v of vessels) {
    const name = typeof v.name === "string" ? v.name.trim() : "";
    if (!name) continue; // skip unnamed entries
    const id = typeof v.id === "string" && v.id.length > 0
      ? v.id
      : `v-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

    const numOrNull = (val: unknown): number | null => {
      if (val === null || val === undefined || val === "") return null;
      const n = typeof val === "number" ? val : Number(String(val).replace(",", "."));
      return Number.isFinite(n) ? n : null;
    };
    const strOrNull = (val: unknown): string | null => {
      if (val === null || val === undefined) return null;
      const s = String(val).trim();
      return s ? s : null;
    };

    // Sérialisation JSON propre de crewByBrevet (ne stocke que les paires > 0)
    let crewByBrevetJson: string | null = null;
    if (v.crewByBrevet && typeof v.crewByBrevet === "object") {
      const cleaned = Object.fromEntries(
        Object.entries(v.crewByBrevet as Record<string, unknown>)
          .map(([k, val]) => {
            const n = typeof val === "number" ? val : Number(val);
            return [k, Number.isFinite(n) && n > 0 ? Math.floor(n) : 0];
          })
          .filter(([, n]) => (n as number) > 0),
      );
      if (Object.keys(cleaned).length > 0) crewByBrevetJson = JSON.stringify(cleaned);
    }

    stmts.push(
      env.DB.prepare(
        `INSERT INTO organization_vessels (
          id, organization_id, name, imo, type, operating_line, flag, image_url,
          year_built, length_m, beam_m, gross_tonnage,
          passenger_capacity, vehicle_capacity, freight_capacity,
          cruise_speed, rotations_per_year,
          crew_size, power_kw, consumption_per_trip,
          renewal_type, renewal_year, owner, shipyard, shipyard_country,
          propulsion_type, fuel_type,
          alt_fuel_tests, shore_power, hull_treatment, emission_reduction,
          crew_by_brevet,
          created_by, updated_at
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?,
          ?, ?, ?,
          ?, ?,
          ?, ?, ?,
          ?, ?, ?, ?, ?,
          ?, ?,
          ?, ?, ?, ?,
          ?,
          ?, datetime('now')
        )`,
      ).bind(
        id,
        org.id,
        name,
        strOrNull(v.imo),
        strOrNull(v.type),
        strOrNull(v.operatingLine),
        strOrNull(v.flag),
        strOrNull(v.imageUrl),
        numOrNull(v.yearBuilt),
        numOrNull(v.length),
        numOrNull(v.beam),
        numOrNull(v.grossTonnage),
        numOrNull(v.passengerCapacity),
        numOrNull(v.vehicleCapacity),
        numOrNull(v.freightCapacity),
        numOrNull(v.cruiseSpeed),
        numOrNull(v.rotationsPerYear),
        strOrNull(v.crewSize),
        strOrNull(v.powerKw),
        strOrNull(v.consumptionPerTrip),
        strOrNull(v.renewalType),
        strOrNull(v.renewalYear),
        strOrNull(v.owner),
        strOrNull(v.shipyard),
        strOrNull(v.shipyardCountry),
        strOrNull(v.propulsionType),
        strOrNull(v.fuelType),
        strOrNull(v.altFuelTests),
        strOrNull(v.shorePower),
        strOrNull(v.hullTreatment),
        strOrNull(v.emissionReduction),
        crewByBrevetJson,
        String(payload.sub),
      ),
    );
  }

  await env.DB.batch(stmts);

  const { results } = await env.DB.prepare(
    "SELECT * FROM organization_vessels WHERE organization_id = ? ORDER BY LOWER(name)"
  ).bind(org.id).all<DbVessel>();

  return json({ success: true, vessels: (results ?? []).map(toFrontendVessel) }, corsHeaders);
}

// ═══════════════════════════════════════════════════════════
//  Votes – AG/AGE + NAO/social (session 38, migrations 0018-0019)
// ═══════════════════════════════════════════════════════════

interface DbVote {
  id: string;
  title: string;
  description: string | null;
  type: string;
  audience: string;
  options_json: string | null;
  status: string;
  closes_at: string | null;
  created_by: string;
  created_at: string;
  closed_at: string | null;
  closed_by: string | null;
}

interface DbVoteResponse {
  id: string;
  vote_id: string;
  organization_id: number;
  submitted_by: string;
  response_json: string;
  submitted_at: string;
}

function toFrontendVote(row: DbVote) {
  let options: unknown[] = [];
  if (row.options_json) {
    try {
      const parsed = JSON.parse(row.options_json);
      if (Array.isArray(parsed)) options = parsed;
    } catch { /* malformed, ignore */ }
  }
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? undefined,
    type: row.type,
    audience: row.audience,
    options,
    status: row.status,
    closesAt: row.closes_at ?? undefined,
    createdBy: row.created_by,
    createdAt: row.created_at,
    closedAt: row.closed_at ?? undefined,
    closedBy: row.closed_by ?? undefined,
  };
}

function toFrontendVoteResponse(row: DbVoteResponse) {
  let response: unknown = "";
  try {
    response = JSON.parse(row.response_json);
  } catch { /* ignore */ }
  return {
    id: row.id,
    voteId: row.vote_id,
    organizationId: String(row.organization_id),
    submittedBy: row.submitted_by,
    response,
    submittedAt: row.submitted_at,
  };
}

/**
 * Crée les tables votes/vote_responses si absentes (défensif, en cas de
 * déploiement avant migration). Réplique 0018_votes.sql.
 */
async function ensureVotesTables(env: Env): Promise<void> {
  try {
    await env.DB.prepare(`CREATE TABLE IF NOT EXISTS votes (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      type TEXT NOT NULL,
      audience TEXT NOT NULL,
      options_json TEXT,
      status TEXT NOT NULL DEFAULT 'open',
      closes_at TEXT,
      created_by TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      closed_at TEXT,
      closed_by TEXT
    )`).run();
    await env.DB.prepare(`CREATE TABLE IF NOT EXISTS vote_responses (
      id TEXT PRIMARY KEY,
      vote_id TEXT NOT NULL,
      organization_id INTEGER NOT NULL,
      submitted_by TEXT NOT NULL,
      response_json TEXT NOT NULL,
      submitted_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(vote_id, organization_id)
    )`).run();
  } catch { /* ignore – tables may already exist */ }
}

/** Vrai si le payload role peut voir les détails d'un vote (admin, ou adhérent dont l'org est éligible). */
function canSeeVote(role: string): boolean {
  return role === "admin" || role === "adherent";
}

/** Détermine si une organisation est éligible pour un vote selon son audience. */
function isOrgEligible(audience: string, college: string | null, social3228: number | null): boolean {
  if (audience === "ag_ab") return college === "A" || college === "B";
  if (audience === "social_3228") return social3228 === 1;
  return false;
}

async function handleListVotes(request: Request, env: Env, corsHeaders: Record<string, string>) {
  const token = extractToken(request);
  if (!token) return json({ error: "Non authentifié" }, corsHeaders, 401);
  const payload = await verifyJwt(token, env.JWT_SECRET);
  if (!payload || !canSeeVote(payload.role)) {
    return json({ error: "Accès refusé" }, corsHeaders, 403);
  }

  await ensureVotesTables(env);
  const { results } = await env.DB.prepare(
    "SELECT * FROM votes ORDER BY datetime(created_at) DESC"
  ).all<DbVote>();
  const allVotes = (results ?? []).map(toFrontendVote);

  // Pour les adhérents, filtrer aux votes auxquels leur organisation peut répondre
  if (payload.role === "adherent") {
    const user = await env.DB.prepare(
      "SELECT u.organization_id, o.college, o.social3228 FROM users u LEFT JOIN organizations o ON o.id = u.organization_id WHERE u.id = ?"
    ).bind(payload.sub).first<{ organization_id: string | null; college: string | null; social3228: number | null }>();
    if (!user || !user.organization_id) {
      return json({ votes: [] }, corsHeaders);
    }
    const eligible = allVotes.filter((v) => isOrgEligible(v.audience, user.college, user.social3228));
    return json({ votes: eligible, organizationId: user.organization_id }, corsHeaders);
  }

  return json({ votes: allVotes }, corsHeaders);
}

async function handleCreateVote(request: Request, env: Env, corsHeaders: Record<string, string>) {
  const auth = await requireAdmin(request, env, corsHeaders);
  if ("error" in auth) return auth.error;

  await ensureVotesTables(env);
  const body = await request.json() as Record<string, unknown>;
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const type = typeof body.type === "string" ? body.type : "";
  const audience = typeof body.audience === "string" ? body.audience : "";
  if (!title || !["single_choice", "multiple_choice", "text", "ranking", "date_selection"].includes(type)) {
    return json({ error: "Champs invalides : title et type requis" }, corsHeaders, 400);
  }
  if (!["ag_ab", "social_3228"].includes(audience)) {
    return json({ error: "Audience invalide" }, corsHeaders, 400);
  }

  const description = typeof body.description === "string" ? body.description.trim() || null : null;
  const closesAt = typeof body.closesAt === "string" && body.closesAt ? body.closesAt : null;
  const optionsJson = body.options !== undefined ? JSON.stringify(body.options) : null;

  const id = `vote-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  await env.DB.prepare(
    `INSERT INTO votes (id, title, description, type, audience, options_json, status, closes_at, created_by)
     VALUES (?, ?, ?, ?, ?, ?, 'open', ?, ?)`
  ).bind(id, title, description, type, audience, optionsJson, closesAt, String(auth.payload.sub)).run();

  const row = await env.DB.prepare("SELECT * FROM votes WHERE id = ?").bind(id).first<DbVote>();
  return json({ success: true, vote: row ? toFrontendVote(row) : null }, corsHeaders);
}

async function handleGetVote(request: Request, env: Env, corsHeaders: Record<string, string>, voteId: string) {
  const token = extractToken(request);
  if (!token) return json({ error: "Non authentifié" }, corsHeaders, 401);
  const payload = await verifyJwt(token, env.JWT_SECRET);
  if (!payload || !canSeeVote(payload.role)) {
    return json({ error: "Accès refusé" }, corsHeaders, 403);
  }

  await ensureVotesTables(env);
  const row = await env.DB.prepare("SELECT * FROM votes WHERE id = ?").bind(voteId).first<DbVote>();
  if (!row) return json({ error: "Vote introuvable" }, corsHeaders, 404);

  // Auto-close si dépassé
  if (row.status === "open" && row.closes_at && new Date(row.closes_at).getTime() < Date.now()) {
    await env.DB.prepare("UPDATE votes SET status = 'closed', closed_at = datetime('now') WHERE id = ?")
      .bind(voteId).run();
    row.status = "closed";
    row.closed_at = new Date().toISOString();
  }

  const vote = toFrontendVote(row);

  // Récupère la réponse de mon organisation (s'il y en a une)
  let myResponse: ReturnType<typeof toFrontendVoteResponse> | null = null;
  if (payload.role === "adherent") {
    const user = await env.DB.prepare(
      "SELECT organization_id FROM users WHERE id = ?"
    ).bind(payload.sub).first<{ organization_id: string | null }>();
    if (user?.organization_id) {
      const respRow = await env.DB.prepare(
        "SELECT * FROM vote_responses WHERE vote_id = ? AND organization_id = ?"
      ).bind(voteId, user.organization_id).first<DbVoteResponse>();
      if (respRow) myResponse = toFrontendVoteResponse(respRow);
    }
  }

  return json({ vote, myResponse }, corsHeaders);
}

async function handleSubmitVoteResponse(request: Request, env: Env, corsHeaders: Record<string, string>, voteId: string) {
  const token = extractToken(request);
  if (!token) return json({ error: "Non authentifié" }, corsHeaders, 401);
  const payload = await verifyJwt(token, env.JWT_SECRET);
  if (!payload || payload.role !== "adherent") {
    return json({ error: "Réservé aux adhérents" }, corsHeaders, 403);
  }

  await ensureVotesTables(env);
  const vote = await env.DB.prepare("SELECT * FROM votes WHERE id = ?").bind(voteId).first<DbVote>();
  if (!vote) return json({ error: "Vote introuvable" }, corsHeaders, 404);
  if (vote.status !== "open") return json({ error: "Vote clôturé" }, corsHeaders, 409);
  if (vote.closes_at && new Date(vote.closes_at).getTime() < Date.now()) {
    return json({ error: "Vote clôturé (date dépassée)" }, corsHeaders, 409);
  }

  const user = await env.DB.prepare(
    "SELECT u.organization_id, u.is_primary, u.suppleant_user_id, o.college, o.social3228 FROM users u LEFT JOIN organizations o ON o.id = u.organization_id WHERE u.id = ?"
  ).bind(payload.sub).first<{ organization_id: string | null; is_primary: number; suppleant_user_id: string | null; college: string | null; social3228: number | null }>();
  if (!user || !user.organization_id) {
    return json({ error: "Utilisateur sans organisation" }, corsHeaders, 403);
  }
  if (!isOrgEligible(vote.audience, user.college, user.social3228)) {
    return json({ error: "Votre organisation n'est pas éligible pour ce vote" }, corsHeaders, 403);
  }

  // Vérifie que le user est titulaire OU suppléant de cette organisation
  // Suppléant = user dont l'id apparaît comme `suppleant_user_id` chez le titulaire de la même org
  let canVote = user.is_primary === 1; // titulaire
  if (!canVote) {
    const titulaire = await env.DB.prepare(
      "SELECT id FROM users WHERE organization_id = ? AND is_primary = 1 AND suppleant_user_id = ?"
    ).bind(user.organization_id, payload.sub).first<{ id: string }>();
    canVote = !!titulaire;
  }
  if (!canVote) {
    return json({ error: "Seuls le titulaire et le suppléant peuvent voter" }, corsHeaders, 403);
  }

  const body = await request.json() as Record<string, unknown>;
  const response = body.response;
  if (response === undefined || response === null) {
    return json({ error: "Champ 'response' manquant" }, corsHeaders, 400);
  }

  const responseJson = JSON.stringify(response);
  const respId = `resp-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  // INSERT OR REPLACE permet au titulaire de réécraser la réponse du suppléant et inversement.
  await env.DB.prepare(
    `INSERT INTO vote_responses (id, vote_id, organization_id, submitted_by, response_json, submitted_at)
     VALUES (?, ?, ?, ?, ?, datetime('now'))
     ON CONFLICT(vote_id, organization_id)
     DO UPDATE SET submitted_by = excluded.submitted_by, response_json = excluded.response_json, submitted_at = datetime('now')`
  ).bind(respId, voteId, user.organization_id, String(payload.sub), responseJson).run();

  const row = await env.DB.prepare(
    "SELECT * FROM vote_responses WHERE vote_id = ? AND organization_id = ?"
  ).bind(voteId, user.organization_id).first<DbVoteResponse>();

  return json({ success: true, response: row ? toFrontendVoteResponse(row) : null }, corsHeaders);
}

async function handleVoteResults(request: Request, env: Env, corsHeaders: Record<string, string>, voteId: string) {
  const auth = await requireAdmin(request, env, corsHeaders);
  if ("error" in auth) return auth.error;

  await ensureVotesTables(env);
  const vote = await env.DB.prepare("SELECT * FROM votes WHERE id = ?").bind(voteId).first<DbVote>();
  if (!vote) return json({ error: "Vote introuvable" }, corsHeaders, 404);

  // Organisations éligibles
  let orgFilterClause = "";
  if (vote.audience === "ag_ab") orgFilterClause = "WHERE college IN ('A', 'B') AND archived = 0";
  else if (vote.audience === "social_3228") orgFilterClause = "WHERE social3228 = 1 AND archived = 0";
  else orgFilterClause = "WHERE archived = 0";

  const { results: orgs } = await env.DB.prepare(
    `SELECT id, name FROM organizations ${orgFilterClause}`
  ).all<{ id: string; name: string }>();
  const orgList = orgs ?? [];

  // Réponses
  const { results: responses } = await env.DB.prepare(
    `SELECT vr.*, u.name AS submitted_by_name, o.name AS organization_name
     FROM vote_responses vr
     LEFT JOIN users u ON u.id = vr.submitted_by
     LEFT JOIN organizations o ON o.id = vr.organization_id
     WHERE vr.vote_id = ?`
  ).bind(voteId).all<DbVoteResponse & { submitted_by_name: string | null; organization_name: string | null }>();
  const respList = responses ?? [];

  const respondedOrgIds = new Set(respList.map((r) => String(r.organization_id)));

  // Agrégation par option (pour single/multiple/ranking)
  const optionCounts: Record<string, number> = {};
  const textResponses: Array<{ organizationName: string; response: string; submittedAt: string }> = [];
  for (const r of respList) {
    let parsed: unknown = "";
    try { parsed = JSON.parse(r.response_json); } catch { /* ignore */ }
    if (vote.type === "text") {
      textResponses.push({
        organizationName: r.organization_name ?? "Compagnie",
        response: typeof parsed === "string" ? parsed : JSON.stringify(parsed),
        submittedAt: r.submitted_at,
      });
    } else if (Array.isArray(parsed)) {
      for (const opt of parsed) {
        if (typeof opt === "string") optionCounts[opt] = (optionCounts[opt] ?? 0) + 1;
      }
    } else if (typeof parsed === "string") {
      optionCounts[parsed] = (optionCounts[parsed] ?? 0) + 1;
    }
  }

  // Récupère emails des titulaires/suppléants pour mailto relance
  const nonRespOrgIds = orgList.filter((o) => !respondedOrgIds.has(o.id)).map((o) => o.id);
  const nonResponders: Array<{ organizationId: string; organizationName: string; titulaireEmail?: string; suppleantEmail?: string }> = [];
  if (nonRespOrgIds.length > 0) {
    const placeholders = nonRespOrgIds.map(() => "?").join(",");
    const { results: nonRespUsers } = await env.DB.prepare(
      `SELECT organization_id, email, is_primary, suppleant_user_id, id FROM users WHERE organization_id IN (${placeholders}) AND archived = 0`
    ).bind(...nonRespOrgIds).all<{ organization_id: string; email: string; is_primary: number; suppleant_user_id: string | null; id: string }>();
    const usersByOrg = new Map<string, typeof nonRespUsers>();
    for (const u of nonRespUsers ?? []) {
      const arr = usersByOrg.get(u.organization_id) ?? [];
      arr.push(u);
      usersByOrg.set(u.organization_id, arr);
    }
    for (const orgId of nonRespOrgIds) {
      const orgName = orgList.find((o) => o.id === orgId)?.name ?? "Compagnie";
      const users = usersByOrg.get(orgId) ?? [];
      const titulaire = users.find((u) => u.is_primary === 1);
      const suppleantId = titulaire?.suppleant_user_id;
      const suppleant = suppleantId ? users.find((u) => u.id === suppleantId) : undefined;
      nonResponders.push({
        organizationId: orgId,
        organizationName: orgName,
        titulaireEmail: titulaire?.email,
        suppleantEmail: suppleant?.email,
      });
    }
  }

  return json({
    voteId,
    totalEligible: orgList.length,
    totalResponded: respondedOrgIds.size,
    optionCounts: vote.type === "text" ? undefined : optionCounts,
    textResponses: vote.type === "text" ? textResponses : undefined,
    responders: respList.map((r) => ({
      organizationId: String(r.organization_id),
      organizationName: r.organization_name ?? "Compagnie",
      submittedAt: r.submitted_at,
      submittedByName: r.submitted_by_name ?? undefined,
    })),
    nonResponders,
  }, corsHeaders);
}

async function handleCloseVote(request: Request, env: Env, corsHeaders: Record<string, string>, voteId: string) {
  const auth = await requireAdmin(request, env, corsHeaders);
  if ("error" in auth) return auth.error;

  await ensureVotesTables(env);
  await env.DB.prepare(
    "UPDATE votes SET status = 'closed', closed_at = datetime('now'), closed_by = ? WHERE id = ?"
  ).bind(String(auth.payload.sub), voteId).run();
  return json({ success: true }, corsHeaders);
}

async function handleDeleteVote(request: Request, env: Env, corsHeaders: Record<string, string>, voteId: string) {
  const auth = await requireAdmin(request, env, corsHeaders);
  if ("error" in auth) return auth.error;

  await ensureVotesTables(env);
  await env.DB.prepare("DELETE FROM vote_responses WHERE vote_id = ?").bind(voteId).run();
  await env.DB.prepare("DELETE FROM votes WHERE id = ?").bind(voteId).run();
  return json({ success: true }, corsHeaders);
}

async function handleGetMySuppleant(request: Request, env: Env, corsHeaders: Record<string, string>) {
  const token = extractToken(request);
  if (!token) return json({ error: "Non authentifié" }, corsHeaders, 401);
  const payload = await verifyJwt(token, env.JWT_SECRET);
  if (!payload) return json({ error: "Token invalide" }, corsHeaders, 401);

  const me = await env.DB.prepare(
    "SELECT id, organization_id, is_primary, suppleant_user_id FROM users WHERE id = ?"
  ).bind(payload.sub).first<{ id: string; organization_id: string | null; is_primary: number; suppleant_user_id: string | null }>();
  if (!me) return json({ error: "Utilisateur introuvable" }, corsHeaders, 404);

  let suppleant: { id: string; name: string; email: string } | null = null;
  if (me.suppleant_user_id) {
    const sup = await env.DB.prepare(
      "SELECT id, name, email FROM users WHERE id = ?"
    ).bind(me.suppleant_user_id).first<{ id: string; name: string; email: string }>();
    if (sup) suppleant = sup;
  }

  // Liste des candidats potentiels suppléants (autres users de la même org)
  let candidates: Array<{ id: string; name: string; email: string }> = [];
  if (me.organization_id && me.is_primary === 1) {
    const { results } = await env.DB.prepare(
      "SELECT id, name, email FROM users WHERE organization_id = ? AND id != ? AND archived = 0 ORDER BY name"
    ).bind(me.organization_id, me.id).all<{ id: string; name: string; email: string }>();
    candidates = results ?? [];
  }

  return json({
    isPrimary: me.is_primary === 1,
    suppleant,
    candidates,
  }, corsHeaders);
}

async function handleSetMySuppleant(request: Request, env: Env, corsHeaders: Record<string, string>) {
  const token = extractToken(request);
  if (!token) return json({ error: "Non authentifié" }, corsHeaders, 401);
  const payload = await verifyJwt(token, env.JWT_SECRET);
  if (!payload) return json({ error: "Token invalide" }, corsHeaders, 401);

  const me = await env.DB.prepare(
    "SELECT organization_id, is_primary FROM users WHERE id = ?"
  ).bind(payload.sub).first<{ organization_id: string | null; is_primary: number }>();
  if (!me || me.is_primary !== 1) {
    return json({ error: "Seul le titulaire peut désigner un suppléant" }, corsHeaders, 403);
  }
  if (!me.organization_id) {
    return json({ error: "Utilisateur sans organisation" }, corsHeaders, 400);
  }

  const body = await request.json() as Record<string, unknown>;
  const supId = body.suppleantUserId;
  if (supId === null || supId === undefined || supId === "") {
    // Désigne null = retire le suppléant
    await env.DB.prepare("UPDATE users SET suppleant_user_id = NULL WHERE id = ?").bind(payload.sub).run();
    return json({ success: true, suppleant: null }, corsHeaders);
  }
  if (typeof supId !== "string") {
    return json({ error: "suppleantUserId invalide" }, corsHeaders, 400);
  }

  // Vérifie que le candidat existe ET appartient à la même organisation
  const cand = await env.DB.prepare(
    "SELECT id, name, email FROM users WHERE id = ? AND organization_id = ? AND archived = 0"
  ).bind(supId, me.organization_id).first<{ id: string; name: string; email: string }>();
  if (!cand) {
    return json({ error: "Candidat suppléant introuvable dans votre organisation" }, corsHeaders, 400);
  }

  await env.DB.prepare("UPDATE users SET suppleant_user_id = ? WHERE id = ?").bind(supId, payload.sub).run();
  return json({ success: true, suppleant: cand }, corsHeaders);
}
