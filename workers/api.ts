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

// J1 — split Worker progressif (cf. docs/WORKER-SPLIT-PLAN.md).
// Domaines extraits dans workers/handlers/ :
import {
  handleCmsListCustomPages,
  handleCmsGetCustomPage,
  handleCmsCreateCustomPage,
  handleCmsUpdateCustomPage,
  handleCmsDeleteCustomPage,
} from "./handlers/cms-custom-pages";
import {
  handleCmsListRevisions,
  handleCmsGetRevision,
  handleCmsRestoreRevision,
} from "./handlers/cms-revisions";
import {
  handleCmsListPages,
  handleCmsGetPage,
  handleCmsUpsertPage,
} from "./handlers/cms-pages";
import {
  handleCmsListAllCustomSections,
  handleCmsCreateCustomSection,
  handleCmsDeleteCustomSection,
  handleCmsReorderCustomSections,
} from "./handlers/cms-custom-sections";
import {
  handleAdminExportAll,
  handleSeedHashesList,
  handleSeedHashesUpsert,
  handleAuditLogList,
} from "./handlers/admin-tools";
import { logAudit, ensureAuditLogTable } from "./lib/audit";
import { sendBrevoTransactional, logBrevoSent, alreadyBrevoSent } from "./lib/brevo";
import { sanitize, sanitizeRichHtml } from "./lib/sanitize";
import { hashPasswordServer, verifyPasswordServer } from "./lib/crypto";
import { extractToken, setTokenCookie, clearTokenCookie } from "./lib/auth";
import { type DbUser, toFrontendUser } from "./lib/users";
import { SITE_URL } from "./lib/constants";
import {
  handleRegister,
  handleLogin,
  handleMe,
  handleListUsers,
  handleUpdateUser,
  handleDeleteUser,
  handlePromoteAdmin,
  handleDemoteAdmin,
  handleTransferMaster,
} from "./handlers/auth";
import { handleForgotPassword, handleResetPassword } from "./handlers/password-reset";
import { handleEmail } from "./handlers/email";
import {
  handleJobsList,
  handleJobGet,
  handleJobCreate,
  handleJobUpdate,
  handleJobDelete,
} from "./handlers/jobs";
import {
  handleMedicalList,
  handleMedicalCreate,
  handleMedicalUpdate,
  handleMedicalDelete,
} from "./handlers/medical-visits";
import {
  handlePositionsList,
  handleGetPosition,
  handleCreatePosition,
  handleUpdatePosition,
  handleDeletePosition,
  ensurePositionsTable,
  toFrontendPosition,
  type DbPosition,
} from "./handlers/positions";
import {
  buildProfileSnapshot,
  buildVesselSnapshot,
  parseValidationItems,
  resolveTargetYear,
  shouldNotifyDueSoon,
  shouldNotifyOverdue,
  ValidationInputError,
  type ValidationCampaignRow,
  type ValidationRequestItem,
} from "./handlers/validation-helpers";

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

// Windows ne reconnaît pas toujours .docx → file.type vide ou octet-stream.
// On retombe sur l'extension pour identifier le type réel (C20 post-launch).
function deriveMimeType(file: File): string {
  const declared = file.type;
  if (declared && declared !== "application/octet-stream") return declared;
  const name = (file.name ?? "").toLowerCase();
  if (name.endsWith(".docx")) return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  if (name.endsWith(".doc")) return "application/msword";
  if (name.endsWith(".pdf")) return "application/pdf";
  if (name.endsWith(".png")) return "image/png";
  if (name.endsWith(".jpg") || name.endsWith(".jpeg")) return "image/jpeg";
  if (name.endsWith(".gif")) return "image/gif";
  if (name.endsWith(".webp")) return "image/webp";
  if (name.endsWith(".svg")) return "image/svg+xml";
  return declared || "application/octet-stream";
}

// ═══════════════════════════════════════════════════════════
//  Main fetch handler
// ═══════════════════════════════════════════════════════════

export default {
  /**
   * Cron trigger handler (session 51). Configure dans wrangler.toml :
   * `[triggers] crons = ["0 9 * * *"]`. Scan quotidien des campagnes ouvertes
   * pour declencher les emails J-14 / J+0 deadline. Idempotent via la table
   * validation_email_sent.
   */
  async scheduled(
    _event: ScheduledEvent,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<void> {
    ctx.waitUntil(runValidationDeadlineCron(env).catch((err) => {
      console.error("[cron] runValidationDeadlineCron failed:", err);
    }));
  },

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
      // C9 — Multi-admin master transferable. Le routage POST sous-spécifique
      // (promote-admin, demote-admin, transfer-master) doit précéder le
      // PATCH générique pour ne pas être absorbé par le matcher.
      if (path.match(/^\/api\/auth\/users\/[^/]+\/promote-admin$/) && request.method === "POST") {
        const userId = path.split("/api/auth/users/")[1].replace("/promote-admin", "");
        return handlePromoteAdmin(request, env, corsHeaders, userId);
      }
      if (path.match(/^\/api\/auth\/users\/[^/]+\/demote-admin$/) && request.method === "POST") {
        const userId = path.split("/api/auth/users/")[1].replace("/demote-admin", "");
        return handleDemoteAdmin(request, env, corsHeaders, userId);
      }
      if (path.match(/^\/api\/auth\/users\/[^/]+\/transfer-master$/) && request.method === "POST") {
        const userId = path.split("/api/auth/users/")[1].replace("/transfer-master", "");
        return handleTransferMaster(request, env, corsHeaders, userId);
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

      // ── Newsletter Categories (refonte session 56b — table dynamique) ──
      if (path === "/api/newsletter/categories" && request.method === "GET") {
        return handleListNewsletterCategoriesPublic(request, env, corsHeaders);
      }
      if (path === "/api/admin/newsletter/categories" && request.method === "GET") {
        return handleListNewsletterCategoriesAdmin(request, env, corsHeaders);
      }
      if (path === "/api/admin/newsletter/categories" && request.method === "POST") {
        return handleCreateNewsletterCategory(request, env, corsHeaders);
      }
      if (path.match(/^\/api\/admin\/newsletter\/categories\/[^/]+$/) && request.method === "PATCH") {
        const key = decodeURIComponent(path.split("/api/admin/newsletter/categories/")[1]);
        return handleUpdateNewsletterCategory(request, env, corsHeaders, key);
      }
      if (path.match(/^\/api\/admin\/newsletter\/categories\/[^/]+$/) && request.method === "DELETE") {
        const key = decodeURIComponent(path.split("/api/admin/newsletter/categories/")[1]);
        return handleArchiveNewsletterCategory(request, env, corsHeaders, key);
      }
      if (path.match(/^\/api\/admin\/newsletter\/categories\/[^/]+\/sync-brevo$/) && request.method === "POST") {
        const key = decodeURIComponent(path.split("/api/admin/newsletter/categories/")[1].split("/sync-brevo")[0]);
        return handleSyncCategoryToBrevo(request, env, corsHeaders, key);
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

      // ── CMS custom sections (Phase 1 hybride C17/C18/C19) ──
      if (path === "/api/cms/custom-sections" && request.method === "GET") {
        return handleCmsListAllCustomSections(env, corsHeaders);
      }
      if (path.match(/^\/api\/cms\/pages\/[^/]+\/custom-sections$/) && request.method === "POST") {
        const pageId = decodeURIComponent(path.replace("/api/cms/pages/", "").replace("/custom-sections", ""));
        return handleCmsCreateCustomSection(request, env, corsHeaders, pageId);
      }
      if (path.match(/^\/api\/cms\/pages\/[^/]+\/custom-sections\/[^/]+$/) && request.method === "DELETE") {
        const parts = path.split("/");
        const pageId = decodeURIComponent(parts[4]);
        const sectionId = decodeURIComponent(parts[6]);
        return handleCmsDeleteCustomSection(request, env, corsHeaders, pageId, sectionId);
      }
      // Phase 2 hybride : réordonnancement des sections custom d'une page
      if (path.match(/^\/api\/cms\/pages\/[^/]+\/custom-sections\/reorder$/) && request.method === "PATCH") {
        const pageId = decodeURIComponent(path.replace("/api/cms/pages/", "").replace("/custom-sections/reorder", ""));
        return handleCmsReorderCustomSections(request, env, corsHeaders, pageId);
      }

      // ── CMS custom pages (Phase 3 hybride) ──
      if (path === "/api/cms/custom-pages" && request.method === "GET") {
        return handleCmsListCustomPages(request, env, corsHeaders);
      }
      if (path === "/api/cms/custom-pages" && request.method === "POST") {
        return handleCmsCreateCustomPage(request, env, corsHeaders);
      }
      if (path.match(/^\/api\/cms\/custom-pages\/[^/]+$/) && request.method === "GET") {
        const slug = decodeURIComponent(path.split("/api/cms/custom-pages/")[1]);
        return handleCmsGetCustomPage(env, corsHeaders, slug);
      }
      if (path.match(/^\/api\/cms\/custom-pages\/[^/]+$/) && request.method === "PUT") {
        const slug = decodeURIComponent(path.split("/api/cms/custom-pages/")[1]);
        return handleCmsUpdateCustomPage(request, env, corsHeaders, slug);
      }
      if (path.match(/^\/api\/cms\/custom-pages\/[^/]+$/) && request.method === "DELETE") {
        const slug = decodeURIComponent(path.split("/api/cms/custom-pages/")[1]);
        return handleCmsDeleteCustomPage(request, env, corsHeaders, slug);
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

      // ── Validation campaigns (session 45, migrations 0027-0029) ──
      if (path === "/api/campaigns" && request.method === "GET") {
        return handleListCampaigns(request, env, corsHeaders);
      }
      if (path === "/api/campaigns" && request.method === "POST") {
        return handleCreateCampaign(request, env, corsHeaders);
      }
      if (path.match(/^\/api\/campaigns\/\d+\/dashboard$/) && request.method === "GET") {
        const campaignId = Number(path.split("/")[3]);
        return handleCampaignDashboard(request, env, corsHeaders, campaignId);
      }
      if (path.match(/^\/api\/campaigns\/\d+$/) && request.method === "PATCH") {
        const campaignId = Number(path.split("/api/campaigns/")[1]);
        return handleUpdateCampaign(request, env, corsHeaders, campaignId);
      }
      if (path.match(/^\/api\/organizations\/[^/]+\/validations$/) && request.method === "GET") {
        const slug = path.replace("/api/organizations/", "").replace("/validations", "");
        return handleListValidations(request, env, corsHeaders, slug);
      }
      if (path.match(/^\/api\/organizations\/[^/]+\/validations$/) && request.method === "POST") {
        const slug = path.replace("/api/organizations/", "").replace("/validations", "");
        return handleSubmitValidations(request, env, corsHeaders, slug);
      }

      // ─── Formations CRUD (P0-1 session 54, migration 0031) ────────────
      if (path === "/api/formations" && request.method === "GET") {
        return handleFormationsList(request, env, corsHeaders);
      }
      if (path === "/api/formations" && request.method === "POST") {
        return handleCreateFormation(request, env, corsHeaders);
      }
      if (path.match(/^\/api\/formations\/[^/]+$/) && request.method === "GET") {
        const slugOrId = path.split("/api/formations/")[1];
        return handleGetFormation(request, env, corsHeaders, slugOrId);
      }
      if (path.match(/^\/api\/formations\/[^/]+$/) && request.method === "PATCH") {
        const id = path.split("/api/formations/")[1];
        return handleUpdateFormation(request, env, corsHeaders, id);
      }
      if (path.match(/^\/api\/formations\/[^/]+$/) && request.method === "DELETE") {
        const id = path.split("/api/formations/")[1];
        return handleDeleteFormation(request, env, corsHeaders, id);
      }
      // Inscription formation par adhérent / candidat (B1 fix session 54+++)
      // Endpoints dédiés qui ne demandent qu'un JWT simple, pas la permission
      // staff `manage_formations` (réservée à l'admin pour CRUD formations).
      if (path.match(/^\/api\/formations\/[^/]+\/register$/) && request.method === "POST") {
        const id = path.replace("/api/formations/", "").replace("/register", "");
        return handleFormationRegister(request, env, corsHeaders, id);
      }
      if (path.match(/^\/api\/formations\/[^/]+\/unregister$/) && request.method === "POST") {
        const id = path.replace("/api/formations/", "").replace("/unregister", "");
        return handleFormationUnregister(request, env, corsHeaders, id);
      }

      // ─── Positions CRUD (P0-2 session 54, migration 0032) ────────────
      if (path === "/api/positions" && request.method === "GET") {
        return handlePositionsList(request, env, corsHeaders);
      }
      if (path === "/api/positions" && request.method === "POST") {
        return handleCreatePosition(request, env, corsHeaders);
      }
      if (path.match(/^\/api\/positions\/[^/]+$/) && request.method === "GET") {
        const slugOrId = path.split("/api/positions/")[1];
        return handleGetPosition(request, env, corsHeaders, slugOrId);
      }
      if (path.match(/^\/api\/positions\/[^/]+$/) && request.method === "PATCH") {
        const id = path.split("/api/positions/")[1];
        return handleUpdatePosition(request, env, corsHeaders, id);
      }
      if (path.match(/^\/api\/positions\/[^/]+$/) && request.method === "DELETE") {
        const id = path.split("/api/positions/")[1];
        return handleDeletePosition(request, env, corsHeaders, id);
      }

      // ─── Admin export-all (G3 / P2-4 session 54) ───────────────────
      if (path === "/api/admin/export-all" && request.method === "GET") {
        return handleAdminExportAll(request, env, corsHeaders);
      }

      // ─── Seed hashes versionning (G3 / P2-1 session 54+) ────────────
      if (path === "/api/admin/seed-hashes" && request.method === "GET") {
        return handleSeedHashesList(request, env, corsHeaders);
      }
      if (path === "/api/admin/seed-hashes" && request.method === "POST") {
        return handleSeedHashesUpsert(request, env, corsHeaders);
      }

      // ─── Audit log lister (G3 / P2-3 UI session 54+++) ──────────────
      if (path === "/api/admin/audit-log" && request.method === "GET") {
        return handleAuditLogList(request, env, corsHeaders);
      }

      // ─── RSS / sitemap dynamiques depuis D1 (P1 SEO session 54+) ────
      if (path === "/api/feed.xml" && request.method === "GET") {
        return handleFeedXml(env, corsHeaders);
      }
      if (path === "/api/sitemap-positions.xml" && request.method === "GET") {
        return handleSitemapPositionsXml(env, corsHeaders);
      }

      return json({ error: "Ressource introuvable" }, corsHeaders, 404);
    } catch (err) {
      console.error("Worker error:", err);
      return json({ error: "Erreur serveur interne" }, corsHeaders, 500);
    }
  },
};

// ═══════════════════════════════════════════════════════════
//  Email sending → Brevo proxy
// ═══════════════════════════════════════════════════════════

// Helpers Brevo core (sendBrevoTransactional, logBrevoSent, alreadyBrevoSent) extraits dans ./lib/brevo (J1 vague 3.0)


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
  // Migration 0038 (B5/C3) — colonnes optionnelles, peuvent être absentes en preprod
  employee_count_navigant?: number | null;
  employee_count_sedentaire?: number | null;
  annual_revenue_eur?: number | null;
  revenue_confidential?: number | null;
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
    employeeCountNavigant: row.employee_count_navigant ?? undefined,
    employeeCountSedentaire: row.employee_count_sedentaire ?? undefined,
    annualRevenueEur: row.annual_revenue_eur ?? undefined,
    revenueConfidential: row.revenue_confidential === 1,
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
    // Session 55 (B5 + C3) : split effectif navigant/sédentaire + CA confidentiel
    employeeCountNavigant: "employee_count_navigant",
    employeeCountSedentaire: "employee_count_sedentaire",
    annualRevenueEur: "annual_revenue_eur",
    revenueConfidential: "revenue_confidential",
    membershipStatus: "membership_status", archived: "archived",
    college: "college", social3228: "social3228",
    // C4 (session 57) : identité (hors slug) modifiable par admin.
    // Le slug reste volontairement absent — il sert de permalien public et
    // n'est pas modifiable post-création pour préserver le SEO.
    name: "name", city: "city", region: "region",
    latitude: "latitude", longitude: "longitude",
    territory: "territory", category: "category",
  };

  const updates: string[] = [];
  const values: unknown[] = [];
  for (const [frontendKey, dbCol] of Object.entries(allowedFields)) {
    if (frontendKey in body) {
      // Champs admin-only : statut, archivage, collège, conv. sociale,
      // et l'ensemble de l'identité hors slug (name, city, region, lat/lng,
      // territory, category). Le slug n'est pas dans allowedFields.
      const adminOnly = new Set([
        "membershipStatus", "archived", "college", "social3228",
        "name", "city", "region", "latitude", "longitude", "territory", "category",
      ]);
      if (adminOnly.has(frontendKey) && payload.role !== "admin") continue;
      updates.push(`${dbCol} = ?`);
      // Booléens (frontend → 0/1 SQLite)
      const boolFields = new Set(["social3228", "revenueConfidential"]);
      const val = boolFields.has(frontendKey) ? (body[frontendKey] ? 1 : 0) : body[frontendKey];
      values.push(val);
    }
  }

  if (updates.length === 0) return json({ error: "Aucun champ à mettre à jour" }, corsHeaders, 400);

  // Snapshot before pour audit
  const before = await env.DB.prepare("SELECT * FROM organizations WHERE id = ?").bind(orgId).first<Record<string, unknown>>();

  updates.push("updated_at = datetime('now')");
  values.push(orgId);

  await env.DB.prepare(`UPDATE organizations SET ${updates.join(", ")} WHERE id = ?`).bind(...values).run();

  // Snapshot after
  const after = await env.DB.prepare("SELECT * FROM organizations WHERE id = ?").bind(orgId).first<Record<string, unknown>>();

  await logAudit(
    env, request,
    { id: payload.sub, email: payload.email ?? null, role: payload.role },
    "organization.update", "organization", orgId, before, after,
  );

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

  // Send invitation email via Brevo (session 56 — helper centralisé)
  const org = await env.DB.prepare("SELECT name FROM organizations WHERE id = ?").bind(orgId).first<{ name: string }>();
  const inviter = await env.DB.prepare("SELECT name FROM users WHERE id = ?").bind(payload.sub).first<{ name: string }>();
  const inviteUrl = `${SITE_URL}/inscription/invitation?token=${inviteToken}`;

  void sendBrevoTransactional(env, {
    to: [{ email: email.trim(), name: name?.trim() ?? email }],
    subject: `Invitation à rejoindre ${org?.name ?? "votre compagnie"} sur GASPE`,
    type: "invitation_team",
    entityId: inviteId,
    htmlContent: `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"></head>
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
  });

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
//  Newsletter Categories (table dynamique migration 0040)
// ═══════════════════════════════════════════════════════════

interface DbNewsletterCategory {
  key: string;
  label: string;
  description: string | null;
  brevo_list_id: number | null;
  audience_filter: string;
  is_public: number;
  is_system: number;
  sort_order: number;
  archived: number;
  created_at: string;
  updated_at: string;
}

function toFrontendCategory(row: DbNewsletterCategory) {
  return {
    key: row.key,
    label: row.label,
    description: row.description ?? undefined,
    brevoListId: row.brevo_list_id ?? undefined,
    audienceFilter: row.audience_filter,
    isPublic: row.is_public === 1,
    isSystem: row.is_system === 1,
    sortOrder: row.sort_order,
    archived: row.archived === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Vérifie qu'un user est éligible à une catégorie selon l'audience_filter.
 * Charge l'organisation si nécessaire (cache implicite : un seul SELECT par appel).
 */
async function userEligibleForCategory(
  env: Env,
  userId: string,
  audienceFilter: string,
): Promise<boolean> {
  if (audienceFilter === "all") return true;

  const u = await env.DB.prepare(
    `SELECT u.role, u.approved, u.organization_id, o.college, o.social3228
     FROM users u
     LEFT JOIN organizations o ON o.id = u.organization_id
     WHERE u.id = ?`,
  ).bind(userId).first<{
    role: string; approved: number; organization_id: string | null;
    college: string | null; social3228: number | null;
  }>();
  if (!u) return false;

  switch (audienceFilter) {
    case "adherent_only":
      return u.role === "adherent" && u.approved === 1;
    case "social_3228":
      return u.role === "adherent" && u.approved === 1 && u.social3228 === 1;
    case "college_a":
      return u.role === "adherent" && u.approved === 1 && u.college === "A";
    case "college_b":
      return u.role === "adherent" && u.approved === 1 && u.college === "B";
    case "college_c":
      return u.role === "adherent" && u.approved === 1 && u.college === "C";
    default:
      // Filtre inconnu → fail closed
      return false;
  }
}

/**
 * GET /api/newsletter/categories — liste publique (auth requise) filtrée
 * selon les catégories visibles à l'utilisateur. Ne renvoie pas les
 * catégories archived ni is_public=0.
 */
async function handleListNewsletterCategoriesPublic(
  request: Request, env: Env, corsHeaders: Record<string, string>,
) {
  const token = extractToken(request);
  if (!token) return json({ error: "Non authentifié" }, corsHeaders, 401);
  const payload = await verifyJwt(token, env.JWT_SECRET);
  if (!payload) return json({ error: "Token invalide" }, corsHeaders, 401);

  let rows: DbNewsletterCategory[] = [];
  try {
    const { results } = await env.DB.prepare(
      `SELECT * FROM newsletter_categories
       WHERE archived = 0 AND is_public = 1
       ORDER BY sort_order ASC, label ASC`,
    ).all<DbNewsletterCategory>();
    rows = results ?? [];
  } catch { /* table absente — preprod */ }

  const eligible: ReturnType<typeof toFrontendCategory>[] = [];
  for (const row of rows) {
    if (await userEligibleForCategory(env, String(payload.sub), row.audience_filter)) {
      eligible.push(toFrontendCategory(row));
    }
  }
  return json({ categories: eligible }, corsHeaders);
}

/**
 * GET /api/admin/newsletter/categories — liste admin (master only),
 * inclut les catégories archived et non-public.
 */
async function handleListNewsletterCategoriesAdmin(
  request: Request, env: Env, corsHeaders: Record<string, string>,
) {
  const token = extractToken(request);
  if (!token) return json({ error: "Non authentifié" }, corsHeaders, 401);
  const payload = await verifyJwt(token, env.JWT_SECRET);
  if (!payload || payload.role !== "admin") {
    return json({ error: "Accès refusé" }, corsHeaders, 403);
  }

  try {
    const { results } = await env.DB.prepare(
      `SELECT * FROM newsletter_categories
       ORDER BY archived ASC, sort_order ASC, label ASC`,
    ).all<DbNewsletterCategory>();
    return json({ categories: (results ?? []).map(toFrontendCategory) }, corsHeaders);
  } catch {
    return json({ categories: [] }, corsHeaders);
  }
}

/**
 * Helpers Brevo Lists API. No-op silencieux si BREVO_API_KEY absent.
 * Préfixe « [SITE] » imposé pour distinguer les listes gérées par le code
 * des listes manuelles GASPE (Médias, Prospects experts, etc.) côté
 * dashboard Brevo.
 */
async function brevoCreateList(env: Env, label: string): Promise<number | null> {
  if (!env.BREVO_API_KEY) return null;
  const name = `[SITE] ${label}`;
  try {
    const res = await fetch("https://api.brevo.com/v3/contacts/lists", {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        "api-key": env.BREVO_API_KEY,
      },
      // folderId 1 = dossier par défaut. À paramétrer si besoin de cloisonner.
      body: JSON.stringify({ name, folderId: 1 }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as { message?: string };
      console.warn(`[brevo] createList échoué : ${err.message ?? res.status}`);
      return null;
    }
    const body = await res.json() as { id?: number };
    return body.id ?? null;
  } catch (err) {
    console.warn("[brevo] createList network error :", err);
    return null;
  }
}

async function brevoUpdateList(env: Env, listId: number, label: string): Promise<boolean> {
  if (!env.BREVO_API_KEY) return false;
  const name = `[SITE] ${label}`;
  try {
    const res = await fetch(`https://api.brevo.com/v3/contacts/lists/${listId}`, {
      method: "PUT",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        "api-key": env.BREVO_API_KEY,
      },
      body: JSON.stringify({ name }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * POST /api/admin/newsletter/categories — création + push Brevo automatique
 * avec préfixe [SITE]. Body : { key, label, description?, audienceFilter?,
 * isPublic?, sortOrder? }.
 */
async function handleCreateNewsletterCategory(
  request: Request, env: Env, corsHeaders: Record<string, string>,
) {
  const token = extractToken(request);
  if (!token) return json({ error: "Non authentifié" }, corsHeaders, 401);
  const payload = await verifyJwt(token, env.JWT_SECRET);
  if (!payload || payload.role !== "admin") {
    return json({ error: "Accès refusé" }, corsHeaders, 403);
  }

  const body = await request.json() as {
    key?: string; label?: string; description?: string;
    audienceFilter?: string; isPublic?: boolean; sortOrder?: number;
    brevoListId?: number; // optionnel : lier à une liste Brevo existante
  };

  const key = (body.key ?? "").trim().toLowerCase().replace(/[^a-z0-9_]/g, "_");
  const label = (body.label ?? "").trim();
  if (!key || !label) {
    return json({ error: "key et label requis" }, corsHeaders, 400);
  }

  const allowedFilters = ["all", "adherent_only", "social_3228", "college_a", "college_b", "college_c"];
  const audienceFilter = body.audienceFilter && allowedFilters.includes(body.audienceFilter)
    ? body.audienceFilter : "all";

  // Si brevoListId fourni → on lie à une liste existante (no création).
  // Sinon on tente de créer la liste côté Brevo avec préfixe [SITE].
  let brevoListId: number | null = body.brevoListId ?? null;
  if (!brevoListId) {
    brevoListId = await brevoCreateList(env, label);
  }

  try {
    await env.DB.prepare(
      `INSERT INTO newsletter_categories
       (key, label, description, brevo_list_id, audience_filter, is_public, is_system, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, 1, ?)`,
    ).bind(
      key, label, body.description ?? null, brevoListId,
      audienceFilter, body.isPublic === false ? 0 : 1,
      body.sortOrder ?? 100,
    ).run();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (/unique constraint/i.test(msg) || /primary key/i.test(msg)) {
      return json({ error: `La clé '${key}' existe déjà` }, corsHeaders, 409);
    }
    return json({ error: msg }, corsHeaders, 500);
  }

  const created = await env.DB.prepare(
    "SELECT * FROM newsletter_categories WHERE key = ?",
  ).bind(key).first<DbNewsletterCategory>();
  return json({ success: true, category: created ? toFrontendCategory(created) : null }, corsHeaders, 201);
}

/**
 * PATCH /api/admin/newsletter/categories/:key — update label/description/
 * audienceFilter/isPublic/sortOrder. Si label change ET la catégorie a un
 * brevoListId, on resync le nom côté Brevo.
 */
async function handleUpdateNewsletterCategory(
  request: Request, env: Env, corsHeaders: Record<string, string>, key: string,
) {
  const token = extractToken(request);
  if (!token) return json({ error: "Non authentifié" }, corsHeaders, 401);
  const payload = await verifyJwt(token, env.JWT_SECRET);
  if (!payload || payload.role !== "admin") {
    return json({ error: "Accès refusé" }, corsHeaders, 403);
  }

  const before = await env.DB.prepare(
    "SELECT * FROM newsletter_categories WHERE key = ?",
  ).bind(key).first<DbNewsletterCategory>();
  if (!before) return json({ error: "Catégorie introuvable" }, corsHeaders, 404);

  const body = await request.json() as {
    label?: string; description?: string;
    audienceFilter?: string; isPublic?: boolean; sortOrder?: number;
    brevoListId?: number | null;
  };

  const updates: string[] = [];
  const values: unknown[] = [];

  if (typeof body.label === "string" && body.label.trim()) {
    updates.push("label = ?");
    values.push(body.label.trim());
  }
  if ("description" in body) {
    updates.push("description = ?");
    values.push(body.description ?? null);
  }
  if (typeof body.audienceFilter === "string") {
    const allowed = ["all", "adherent_only", "social_3228", "college_a", "college_b", "college_c"];
    if (allowed.includes(body.audienceFilter)) {
      updates.push("audience_filter = ?");
      values.push(body.audienceFilter);
    }
  }
  if (typeof body.isPublic === "boolean") {
    updates.push("is_public = ?");
    values.push(body.isPublic ? 1 : 0);
  }
  if (typeof body.sortOrder === "number") {
    updates.push("sort_order = ?");
    values.push(body.sortOrder);
  }
  if ("brevoListId" in body) {
    updates.push("brevo_list_id = ?");
    values.push(body.brevoListId ?? null);
  }

  if (updates.length === 0) return json({ error: "Aucun champ à modifier" }, corsHeaders, 400);

  updates.push("updated_at = datetime('now')");
  values.push(key);

  await env.DB.prepare(
    `UPDATE newsletter_categories SET ${updates.join(", ")} WHERE key = ?`,
  ).bind(...values).run();

  // Sync Brevo : si le label a changé ET qu'on a un list ID ET que la liste
  // est marquée is_system → push le nouveau nom.
  if (typeof body.label === "string" && body.label.trim() !== before.label
      && before.brevo_list_id && before.is_system === 1) {
    void brevoUpdateList(env, before.brevo_list_id, body.label.trim());
  }

  const updated = await env.DB.prepare(
    "SELECT * FROM newsletter_categories WHERE key = ?",
  ).bind(key).first<DbNewsletterCategory>();
  return json({ success: true, category: updated ? toFrontendCategory(updated) : null }, corsHeaders);
}

/**
 * DELETE /api/admin/newsletter/categories/:key — archive (pas DELETE physique).
 * Conserve les abonnements user_newsletter_subscriptions pour audit.
 */
async function handleArchiveNewsletterCategory(
  request: Request, env: Env, corsHeaders: Record<string, string>, key: string,
) {
  const token = extractToken(request);
  if (!token) return json({ error: "Non authentifié" }, corsHeaders, 401);
  const payload = await verifyJwt(token, env.JWT_SECRET);
  if (!payload || payload.role !== "admin") {
    return json({ error: "Accès refusé" }, corsHeaders, 403);
  }

  await env.DB.prepare(
    "UPDATE newsletter_categories SET archived = 1, is_public = 0, updated_at = datetime('now') WHERE key = ?",
  ).bind(key).run();
  return json({ success: true }, corsHeaders);
}

/**
 * POST /api/admin/newsletter/categories/:key/sync-brevo — force resync de
 * tous les abonnés D1 vers la liste Brevo. Utile après création d'une
 * catégorie ou si la liste Brevo a été vidée à la main.
 */
async function handleSyncCategoryToBrevo(
  request: Request, env: Env, corsHeaders: Record<string, string>, key: string,
) {
  const token = extractToken(request);
  if (!token) return json({ error: "Non authentifié" }, corsHeaders, 401);
  const payload = await verifyJwt(token, env.JWT_SECRET);
  if (!payload || payload.role !== "admin") {
    return json({ error: "Accès refusé" }, corsHeaders, 403);
  }

  const cat = await env.DB.prepare(
    "SELECT brevo_list_id FROM newsletter_categories WHERE key = ? AND archived = 0",
  ).bind(key).first<{ brevo_list_id: number | null }>();
  if (!cat?.brevo_list_id) {
    return json({ error: "Catégorie sans brevo_list_id" }, corsHeaders, 400);
  }
  if (!env.BREVO_API_KEY) {
    return json({ error: "BREVO_API_KEY non configuré" }, corsHeaders, 503);
  }

  const { results } = await env.DB.prepare(
    `SELECT u.email FROM user_newsletter_subscriptions s
     INNER JOIN users u ON u.id = s.user_id
     WHERE s.category_key = ? AND u.email IS NOT NULL`,
  ).bind(key).all<{ email: string }>();
  const emails = (results ?? []).map((r) => r.email);

  if (emails.length === 0) return json({ success: true, synced: 0 }, corsHeaders);

  // Brevo /contacts/lists/:id/contacts/add accepte 150 emails par batch
  let synced = 0;
  for (let i = 0; i < emails.length; i += 150) {
    const batch = emails.slice(i, i + 150);
    try {
      const res = await fetch(
        `https://api.brevo.com/v3/contacts/lists/${cat.brevo_list_id}/contacts/add`,
        {
          method: "POST",
          headers: {
            accept: "application/json",
            "content-type": "application/json",
            "api-key": env.BREVO_API_KEY,
          },
          body: JSON.stringify({ emails: batch }),
        },
      );
      if (res.ok) synced += batch.length;
    } catch (err) {
      console.warn("[brevo] syncCategory batch error :", err);
    }
  }
  return json({ success: true, synced, total: emails.length }, corsHeaders);
}

// ═══════════════════════════════════════════════════════════
//  Newsletter Preferences
// ═══════════════════════════════════════════════════════════

// LEGACY (table 0003) — conservé pour rétro-compat dans les colonnes mais
// les lectures/écritures passent désormais par newsletter_categories +
// user_newsletter_subscriptions (migration 0040). Cette constante est
// utilisée uniquement comme fallback de la migration 0040 si elle n'a pas
// encore été appliquée.
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

  // Refonte session 56b : lit la table dynamique. Renvoie un map
  // { category_key: subscribed } limité aux catégories éligibles au user.
  const prefs: Record<string, boolean> = {};
  try {
    const { results: cats } = await env.DB.prepare(
      `SELECT key, audience_filter FROM newsletter_categories
       WHERE archived = 0 AND is_public = 1`,
    ).all<{ key: string; audience_filter: string }>();
    const subs = new Set<string>();
    try {
      const { results: subRows } = await env.DB.prepare(
        "SELECT category_key FROM user_newsletter_subscriptions WHERE user_id = ?",
      ).bind(payload.sub).all<{ category_key: string }>();
      for (const r of subRows ?? []) subs.add(r.category_key);
    } catch { /* table absente — preprod */ }

    for (const cat of cats ?? []) {
      if (await userEligibleForCategory(env, String(payload.sub), cat.audience_filter)) {
        prefs[cat.key] = subs.has(cat.key);
      }
    }
    return json({ preferences: prefs }, corsHeaders);
  } catch {
    // Fallback legacy : table 0040 absente → relit newsletter_preferences
    let row = await env.DB.prepare("SELECT * FROM newsletter_preferences WHERE user_id = ?").bind(payload.sub).first();
    if (!row) {
      await env.DB.prepare("INSERT INTO newsletter_preferences (user_id) VALUES (?)").bind(payload.sub).run();
      row = await env.DB.prepare("SELECT * FROM newsletter_preferences WHERE user_id = ?").bind(payload.sub).first();
    }
    for (const col of NEWSLETTER_COLUMNS) {
      prefs[col] = (row as Record<string, unknown>)?.[col] === 1;
    }
    return json({ preferences: prefs }, corsHeaders);
  }
}

async function handleUpdatePreferences(request: Request, env: Env, corsHeaders: Record<string, string>) {
  const token = extractToken(request);
  if (!token) return json({ error: "Non authentifié" }, corsHeaders, 401);
  const payload = await verifyJwt(token, env.JWT_SECRET);
  if (!payload) return json({ error: "Token invalide" }, corsHeaders, 401);

  const body = await request.json() as Record<string, boolean>;

  // Refonte session 56b : on charge la table dynamique pour valider les keys
  // et les filtres d'audience. Une key inconnue ou non-éligible est ignorée
  // (fail closed côté sécu, pas de 400 pour ne pas bloquer un client legacy).
  let cats: Array<{ key: string; audience_filter: string; brevo_list_id: number | null }> = [];
  try {
    const { results } = await env.DB.prepare(
      `SELECT key, audience_filter, brevo_list_id FROM newsletter_categories
       WHERE archived = 0`,
    ).all<{ key: string; audience_filter: string; brevo_list_id: number | null }>();
    cats = results ?? [];
  } catch { /* table absente — fallback legacy ci-dessous */ }

  if (cats.length > 0) {
    const userIdStr = String(payload.sub);
    let touched = 0;
    for (const cat of cats) {
      if (!(cat.key in body)) continue;
      if (!await userEligibleForCategory(env, userIdStr, cat.audience_filter)) continue;
      const subscribed = !!body[cat.key];
      if (subscribed) {
        await env.DB.prepare(
          `INSERT OR IGNORE INTO user_newsletter_subscriptions
           (user_id, category_key, source) VALUES (?, ?, 'site')`,
        ).bind(userIdStr, cat.key).run();
      } else {
        await env.DB.prepare(
          "DELETE FROM user_newsletter_subscriptions WHERE user_id = ? AND category_key = ?",
        ).bind(userIdStr, cat.key).run();
      }
      touched += 1;
    }
    if (touched === 0) return json({ error: "Aucune préférence valide à modifier" }, corsHeaders, 400);

    // Sync Brevo non-bloquant : push les abonnements à jour
    try {
      const user = await env.DB.prepare(
        "SELECT email, first_name, last_name FROM users WHERE id = ?",
      ).bind(payload.sub).first<{ email: string; first_name?: string; last_name?: string }>();
      if (user?.email) await syncBrevoContact(env, user, userIdStr);
    } catch { /* non-bloquant */ }

    return json({ success: true }, corsHeaders);
  }

  // ─── Fallback legacy (table 0040 absente, pré-migration) ───
  const updates: string[] = [];
  const values: unknown[] = [];
  for (const col of NEWSLETTER_COLUMNS) {
    if (col in body) {
      updates.push(`${col} = ?`);
      values.push(body[col] ? 1 : 0);
    }
  }
  if (updates.length === 0) return json({ error: "Aucune préférence à modifier" }, corsHeaders, 400);
  const existing = await env.DB.prepare("SELECT user_id FROM newsletter_preferences WHERE user_id = ?").bind(payload.sub).first();
  if (!existing) await env.DB.prepare("INSERT INTO newsletter_preferences (user_id) VALUES (?)").bind(payload.sub).run();
  updates.push("updated_at = datetime('now')");
  values.push(payload.sub);
  await env.DB.prepare(`UPDATE newsletter_preferences SET ${updates.join(", ")} WHERE user_id = ?`).bind(...values).run();
  return json({ success: true }, corsHeaders);
}

/**
 * Synchronise un contact Brevo avec ses abonnements D1.
 *
 * Refonte session 56b : lit la table dynamique newsletter_categories +
 * user_newsletter_subscriptions au lieu du mapping CATEGORY_TO_LIST_ENV
 * hard-codé. La signature accepte désormais `userId` directement (le
 * deuxième paramètre `prefs` legacy est ignoré, on relit en DB pour
 * éviter les races).
 *
 * Best-effort : silencieux si BREVO_API_KEY absent. Update
 * `users.brevo_synced_at` à chaque succès.
 */
async function syncBrevoContact(
  env: Env,
  user: { email: string; first_name?: string; last_name?: string },
  userId: string,
): Promise<boolean> {
  if (!env.BREVO_API_KEY) return false;

  // Toutes les catégories actives avec un brevo_list_id, et les
  // abonnements actuels du user. Différence → listIds (ajoute) /
  // unlinkListIds (retire).
  let cats: Array<{ key: string; brevo_list_id: number | null }> = [];
  try {
    const { results } = await env.DB.prepare(
      `SELECT key, brevo_list_id FROM newsletter_categories
       WHERE archived = 0 AND brevo_list_id IS NOT NULL`,
    ).all<{ key: string; brevo_list_id: number | null }>();
    cats = results ?? [];
  } catch { return false; }

  const subscribedKeys = new Set<string>();
  try {
    const { results } = await env.DB.prepare(
      "SELECT category_key FROM user_newsletter_subscriptions WHERE user_id = ?",
    ).bind(userId).all<{ category_key: string }>();
    for (const r of results ?? []) subscribedKeys.add(r.category_key);
  } catch { /* table absente */ }

  const listIds: number[] = [];
  const unlinkListIds: number[] = [];
  for (const cat of cats) {
    if (!cat.brevo_list_id) continue;
    if (subscribedKeys.has(cat.key)) listIds.push(cat.brevo_list_id);
    else unlinkListIds.push(cat.brevo_list_id);
  }
  if (listIds.length === 0 && unlinkListIds.length === 0) return false;

  const payload: Record<string, unknown> = {
    email: user.email,
    attributes: { PRENOM: user.first_name ?? "", NOM: user.last_name ?? "" },
    updateEnabled: true,
  };
  if (listIds.length > 0) payload.listIds = listIds;
  if (unlinkListIds.length > 0) payload.unlinkListIds = unlinkListIds;

  const res = await fetch("https://api.brevo.com/v3/contacts", {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "api-key": env.BREVO_API_KEY,
    },
    body: JSON.stringify(payload),
  });
  const ok = res.ok || res.status === 204;
  if (ok) {
    try {
      await env.DB.prepare("UPDATE users SET brevo_synced_at = datetime('now') WHERE email = ?")
        .bind(user.email).run();
    } catch { /* colonne brevo_synced_at peut être absente (pré-0009) */ }
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

  // Notification interne via le helper centralisé (session 56)
  void sendBrevoTransactional(env, {
    to: [{ email: env.CONTACT_EMAIL || "contact@gaspe.fr", name: "GASPE" }],
    replyTo: { email, name: nom },
    subject: `[Contact GASPE] ${sujet}`,
    type: "contact_form",
    htmlContent: `<h2>Nouveau message de contact</h2>
<p><strong>Nom :</strong> ${sanitize(nom)}</p>
<p><strong>Email :</strong> ${sanitize(email)}</p>
${societe ? `<p><strong>Société :</strong> ${sanitize(societe)}</p>` : ""}
<p><strong>Sujet :</strong> ${sanitize(sujet)}</p>
<hr/>
<p>${sanitize(message).replace(/\n/g, "<br/>")}</p>`,
  });

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

  // Validate MIME type (fallback extension si file.type vide ou octet-stream)
  const effectiveType = deriveMimeType(file);
  const allowed = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];
  if (!allowed.includes(effectiveType)) {
    return json({ error: "Type de fichier non autorisé (PDF, DOC, DOCX uniquement)" }, corsHeaders, 400);
  }

  // Max 10MB
  if (file.size > 10 * 1024 * 1024) {
    return json({ error: "Fichier trop volumineux (max 10 Mo)" }, corsHeaders, 400);
  }

  // Magic bytes validation – read first 4 bytes to verify actual file type
  const buffer = await file.arrayBuffer();
  if (!validateMagicBytes(buffer, effectiveType)) {
    return json(
      { error: "Le contenu du fichier ne correspond pas au type déclaré. Fichier refusé." },
      corsHeaders,
      400,
    );
  }

  const key = `${type || "document"}/${crypto.randomUUID()}-${file.name}`;
  await env.UPLOADS.put(key, buffer, {
    httpMetadata: { contentType: effectiveType },
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
//  CMS pages système — extrait dans ./handlers/cms-pages (J1 vague 1.b)
// ═══════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════
//  CMS custom sections — extrait dans ./handlers/cms-custom-sections (J1 vague 1.c)
// ═══════════════════════════════════════════════════════════

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
  const auth = await requireStaffPermission(request, env, corsHeaders, "manage_cms");
  if ("error" in auth) return auth.error;

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
  const auth = await requireStaffPermission(request, env, corsHeaders, "manage_cms");
  if ("error" in auth) return auth.error;

  const formData = await request.formData();
  const file = formData.get("file") as File;
  const alt = formData.get("alt") as string;

  if (!file) return json({ error: "Aucun fichier fourni" }, corsHeaders, 400);

  // Type effectif (fallback sur extension si file.type vide / octet-stream — Windows DOCX)
  const effectiveType = deriveMimeType(file);

  const allowedTypes = [
    "image/png", "image/jpeg", "image/gif", "image/webp", "image/svg+xml",
    "application/pdf", "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];

  if (!allowedTypes.includes(effectiveType)) {
    return json({ error: "Type de fichier non autorisé" }, corsHeaders, 400);
  }

  if (file.size > 10 * 1024 * 1024) {
    return json({ error: "Fichier trop volumineux (max 10 Mo)" }, corsHeaders, 400);
  }

  const buffer = await file.arrayBuffer();
  if (!validateMediaMagicBytes(buffer, effectiveType)) {
    return json({ error: "Le contenu du fichier ne correspond pas au type déclaré" }, corsHeaders, 400);
  }

  const id = `media-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const r2Key = `media/${crypto.randomUUID()}-${file.name}`;

  await env.UPLOADS.put(r2Key, buffer, {
    httpMetadata: { contentType: effectiveType },
    customMetadata: { originalName: file.name, uploadedAt: new Date().toISOString() },
  });

  await env.DB.prepare(`
    INSERT INTO media_files (id, name, type, r2_key, size, alt, uploaded_by)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).bind(id, file.name, effectiveType, r2Key, file.size, alt || null, auth.userId).run();

  return json({
    success: true,
    item: { id, name: file.name, type: effectiveType, r2Key, size: file.size, alt: alt || undefined, uploadedAt: new Date().toISOString() },
  }, corsHeaders, 201);
}

async function handleMediaDelete(request: Request, env: Env, corsHeaders: Record<string, string>, mediaId: string) {
  const auth = await requireStaffPermission(request, env, corsHeaders, "manage_cms");
  if ("error" in auth) return auth.error;

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
    return new Response("Ressource introuvable", { status: 404, headers: corsHeaders });
  }
  const object = await env.UPLOADS.get(r2Key);
  if (!object) return new Response("Ressource introuvable", { status: 404, headers: corsHeaders });

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

/** Parse JSON staff_permissions column → string[] */
function parseStaffPerms(raw: string | null): string[] | undefined {
  if (!raw) return undefined;
  try {
    const arr = JSON.parse(raw);
    if (Array.isArray(arr)) return arr.filter((p) => typeof p === "string");
  } catch { /* ignore */ }
  return undefined;
}

/**
 * Check that the caller is the master admin OR a staff with the given
 * permission (Lot 9, session 39). Returns `{ userId }` on success or
 * `{ error: Response }` on failure.
 */
async function requireStaffPermission(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>,
  permission: string,
) {
  const token = extractToken(request);
  if (!token) return { error: json({ error: "Non authentifié" }, corsHeaders, 401) };
  const payload = await verifyJwt(token, env.JWT_SECRET);
  if (!payload) return { error: json({ error: "Token invalide" }, corsHeaders, 401) };

  // Master admin bypasses all permission checks
  if (payload.role === "admin") return { userId: String(payload.sub) };

  // Staff : check permission in DB
  if (payload.role === "staff") {
    try {
      const row = await env.DB.prepare("SELECT staff_permissions FROM users WHERE id = ?")
        .bind(payload.sub)
        .first<{ staff_permissions: string | null }>();
      const perms = parseStaffPerms(row?.staff_permissions ?? null);
      if (perms && perms.includes(permission)) return { userId: String(payload.sub) };
    } catch { /* ignore – fail closed below */ }
  }
  return { error: json({ error: "Accès refusé : permission requise" }, corsHeaders, 403) };
}

async function handleNlDraftsList(request: Request, env: Env, corsHeaders: Record<string, string>) {
  const auth = await requireStaffPermission(request, env, corsHeaders, "manage_newsletter");
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
  const auth = await requireStaffPermission(request, env, corsHeaders, "manage_newsletter");
  if ("error" in auth) return auth.error;
  await ensureNlDraftsTable(env);
  const row = await env.DB.prepare("SELECT * FROM nl_drafts WHERE id = ?").bind(id).first<NlDraftRow>();
  return json({ draft: row ?? null }, corsHeaders);
}

async function handleNlDraftsCreate(request: Request, env: Env, corsHeaders: Record<string, string>) {
  const auth = await requireStaffPermission(request, env, corsHeaders, "manage_newsletter");
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
  const auth = await requireStaffPermission(request, env, corsHeaders, "manage_newsletter");
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
  const auth = await requireStaffPermission(request, env, corsHeaders, "manage_newsletter");
  if ("error" in auth) return auth.error;
  await ensureNlDraftsTable(env);
  // Soft-delete (P2-2 session 54+) : preserve les brouillons archivés
  // pour reprise éventuelle.
  try {
    await env.DB.prepare(
      "UPDATE nl_drafts SET is_archived = 1, updated_at = datetime('now') WHERE id = ?",
    ).bind(id).run();
  } catch {
    await env.DB.prepare("DELETE FROM nl_drafts WHERE id = ?").bind(id).run();
  }
  return json({ success: true, archived: true }, corsHeaders);
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
  const auth = await requireStaffPermission(request, env, corsHeaders, "manage_newsletter");
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

  // Session 56 — passe par le helper centralisé. Note : Brevo limite à 99
  // destinataires par appel `/v3/smtp/email`, ici on a max 5 (validé en amont).
  const result = await sendBrevoTransactional(env, {
    to: recipients.map((email) => ({ email })),
    sender: { email: senderEmail, name: senderName },
    replyTo: env.BREVO_REPLY_TO ? { email: env.BREVO_REPLY_TO } : undefined,
    subject: `[TEST] ${draft.subject}`,
    htmlContent: html,
    type: "newsletter_test",
    entityId: draftId,
  });

  if (!result.ok) {
    return json({ error: `Brevo a refusé l'envoi : ${result.error ?? "raison inconnue"}` }, corsHeaders, 502);
  }
  return json({ success: true, sent: recipients.length, brevoMessageId: result.brevoMessageId }, corsHeaders);
}

async function handleNewsletterBulkSend(request: Request, env: Env, corsHeaders: Record<string, string>, draftId: string) {
  const auth = await requireStaffPermission(request, env, corsHeaders, "manage_newsletter");
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
  const auth = await requireStaffPermission(request, env, corsHeaders, "manage_cms");
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
  const auth = await requireStaffPermission(request, env, corsHeaders, "manage_cms");
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
  const auth = await requireStaffPermission(request, env, corsHeaders, "manage_cms");
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
  const auth = await requireStaffPermission(request, env, corsHeaders, "manage_votes");
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
  ).bind(id, title, description, type, audience, optionsJson, closesAt, auth.userId).run();

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
  const auth = await requireStaffPermission(request, env, corsHeaders, "manage_votes");
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
  const auth = await requireStaffPermission(request, env, corsHeaders, "manage_votes");
  if ("error" in auth) return auth.error;

  await ensureVotesTables(env);
  await env.DB.prepare(
    "UPDATE votes SET status = 'closed', closed_at = datetime('now'), closed_by = ? WHERE id = ?"
  ).bind(auth.userId, voteId).run();
  return json({ success: true }, corsHeaders);
}

async function handleDeleteVote(request: Request, env: Env, corsHeaders: Record<string, string>, voteId: string) {
  const auth = await requireStaffPermission(request, env, corsHeaders, "manage_votes");
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

// ═══════════════════════════════════════════════════════════
//  Validation campaigns – validation annuelle (session 45,
//  migrations 0027-0029). Spec : docs/VALIDATION-ANNUELLE-FEATURE.md
// ═══════════════════════════════════════════════════════════

interface DbCampaign {
  id: number;
  target_year: number;
  opened_at: string | null;
  target_date: string | null;
  closed_at: string | null;
  status: "draft" | "open" | "closed";
  created_by: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface DbValidationHistory {
  id: number;
  organization_id: string;
  item_type: "profile" | "vessel";
  item_id: string | null;
  target_year: number;
  validated_at: string;
  validated_by_user_id: string;
  snapshot_json: string;
  is_unchanged: number;
  campaign_id: number | null;
  created_at: string;
}

function toFrontendCampaign(row: DbCampaign) {
  return {
    id: row.id,
    targetYear: row.target_year,
    openedAt: row.opened_at ?? undefined,
    targetDate: row.target_date ?? undefined,
    closedAt: row.closed_at ?? undefined,
    status: row.status,
    createdBy: row.created_by ?? undefined,
    notes: row.notes ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toFrontendValidationHistory(row: DbValidationHistory) {
  let snapshot: unknown = null;
  try { snapshot = JSON.parse(row.snapshot_json); } catch { /* ignore */ }
  return {
    id: row.id,
    organizationId: row.organization_id,
    itemType: row.item_type,
    itemId: row.item_id ?? undefined,
    targetYear: row.target_year,
    validatedAt: row.validated_at,
    validatedByUserId: row.validated_by_user_id,
    snapshot,
    isUnchanged: row.is_unchanged === 1,
    campaignId: row.campaign_id ?? undefined,
    createdAt: row.created_at,
  };
}

/**
 * Cree les tables de validation si absentes (defensif, en cas de
 * deploiement avant migration). Les ALTER ADD COLUMN ne peuvent pas etre
 * repliques ici (SQLite ne supporte pas IF NOT EXISTS sur ALTER), donc les
 * colonnes last_validated_* ne sont pas garanties tant que la migration 0028
 * n'est pas appliquee. On gere les NULL implicitement dans les requetes.
 */
async function ensureValidationTables(env: Env): Promise<void> {
  try {
    await env.DB.prepare(`CREATE TABLE IF NOT EXISTS fleet_validation_campaigns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      target_year INTEGER NOT NULL UNIQUE,
      opened_at TEXT NOT NULL,
      target_date TEXT,
      closed_at TEXT,
      status TEXT NOT NULL DEFAULT 'draft',
      created_by TEXT,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`).run();
    await env.DB.prepare(
      "CREATE INDEX IF NOT EXISTS idx_campaigns_status ON fleet_validation_campaigns(status)"
    ).run();
    await env.DB.prepare(`CREATE TABLE IF NOT EXISTS validation_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      organization_id TEXT NOT NULL,
      item_type TEXT NOT NULL,
      item_id TEXT,
      target_year INTEGER NOT NULL,
      validated_at TEXT NOT NULL,
      validated_by_user_id TEXT NOT NULL,
      snapshot_json TEXT NOT NULL,
      is_unchanged INTEGER NOT NULL DEFAULT 0,
      campaign_id INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`).run();
    await env.DB.prepare(
      "CREATE INDEX IF NOT EXISTS idx_history_org_year ON validation_history(organization_id, target_year)"
    ).run();
    await env.DB.prepare(
      "CREATE INDEX IF NOT EXISTS idx_history_item ON validation_history(item_type, item_id, target_year)"
    ).run();
  } catch { /* tables peuvent exister deja */ }
}

/**
 * Recupere la campagne actuellement ouverte (au plus une car target_year UNIQUE
 * + status='open'). Renvoie null si aucune. Utilise pour POST validations.
 */
async function getOpenCampaign(env: Env): Promise<ValidationCampaignRow | null> {
  const row = await env.DB.prepare(
    "SELECT * FROM fleet_validation_campaigns WHERE status = 'open' ORDER BY target_year DESC LIMIT 1"
  ).first<DbCampaign>();
  if (!row) return null;
  return {
    id: row.id,
    target_year: row.target_year,
    opened_at: row.opened_at,
    target_date: row.target_date,
    closed_at: row.closed_at,
    status: row.status,
    created_by: row.created_by,
    notes: row.notes,
  };
}

/**
 * Verifie qu'un user peut valider pour une organisation : admin OU member de
 * la meme org. Reutilise la meme regle que handleUpsertFleet.
 */
async function canActOnOrg(
  env: Env,
  payload: { sub: string | number; role: string },
  orgId: string,
): Promise<boolean> {
  if (payload.role === "admin") return true;
  // Staff avec permission manage_validations OU manage_organizations passe aussi
  if (payload.role === "staff") {
    try {
      const row = await env.DB.prepare("SELECT staff_permissions FROM users WHERE id = ?")
        .bind(payload.sub).first<{ staff_permissions: string | null }>();
      if (row?.staff_permissions) {
        try {
          const perms = JSON.parse(row.staff_permissions);
          if (Array.isArray(perms) && (perms.includes("manage_validations") || perms.includes("manage_organizations"))) return true;
        } catch { /* ignore */ }
      }
    } catch { /* ignore */ }
  }
  // Adherent : doit etre lie a cette organisation
  const user = await env.DB.prepare(
    "SELECT organization_id FROM users WHERE id = ?"
  ).bind(payload.sub).first<{ organization_id: string | null }>();
  return user?.organization_id === orgId;
}

// ── GET /api/campaigns – admin/staff(validations) : liste + courante ──
async function handleListCampaigns(request: Request, env: Env, corsHeaders: Record<string, string>) {
  const auth = await requireStaffPermission(request, env, corsHeaders, "manage_validations");
  if ("error" in auth) return auth.error;

  await ensureValidationTables(env);
  const { results } = await env.DB.prepare(
    "SELECT * FROM fleet_validation_campaigns ORDER BY target_year DESC"
  ).all<DbCampaign>();
  const campaigns = (results ?? []).map(toFrontendCampaign);
  const current = campaigns.find((c) => c.status === "open") ?? null;
  return json({ campaigns, current }, corsHeaders);
}

// ── POST /api/campaigns – admin/staff(validations) : cree une campagne ──
async function handleCreateCampaign(request: Request, env: Env, corsHeaders: Record<string, string>) {
  const auth = await requireStaffPermission(request, env, corsHeaders, "manage_validations");
  if ("error" in auth) return auth.error;

  await ensureValidationTables(env);
  let body: Record<string, unknown>;
  try { body = (await request.json()) as Record<string, unknown>; }
  catch { return json({ error: "Body JSON invalide" }, corsHeaders, 400); }

  const targetYear = typeof body.targetYear === "number" ? body.targetYear : Number(body.targetYear);
  if (!Number.isInteger(targetYear) || targetYear < 2020 || targetYear > 2100) {
    return json({ error: "targetYear doit etre un entier entre 2020 et 2100" }, corsHeaders, 400);
  }
  const targetDate = typeof body.targetDate === "string" && body.targetDate ? body.targetDate : null;
  const notes = typeof body.notes === "string" ? body.notes.trim() || null : null;
  const status = body.status === "open" ? "open" : "draft";
  const openedAt = status === "open" ? new Date().toISOString() : new Date(0).toISOString();

  // Unique constraint sur target_year : message metier explicite
  const existing = await env.DB.prepare(
    "SELECT id FROM fleet_validation_campaigns WHERE target_year = ?"
  ).bind(targetYear).first<{ id: number }>();
  if (existing) {
    return json({ error: `Une campagne existe deja pour ${targetYear}` }, corsHeaders, 409);
  }

  await env.DB.prepare(
    `INSERT INTO fleet_validation_campaigns
     (target_year, opened_at, target_date, status, created_by, notes)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).bind(targetYear, openedAt, targetDate, status, auth.userId, notes).run();

  const row = await env.DB.prepare(
    "SELECT * FROM fleet_validation_campaigns WHERE target_year = ?"
  ).bind(targetYear).first<DbCampaign>();

  // Side effect : creation directe en 'open' -> notifier les titulaires
  // + reset cotisations à 'due' (C7 du feedback post-launch session 60).
  if (row && row.status === "open") {
    try {
      await resetMembershipsToDue(env, request, auth.userId, row.target_year);
    } catch (err) {
      console.error("[validation] resetMembershipsToDue failed:", err);
    }
    try {
      await notifyCampaignOpened(env, row);
    } catch (err) {
      console.error("[validation] notifyCampaignOpened failed:", err);
    }
  }

  return json({ success: true, campaign: row ? toFrontendCampaign(row) : null }, corsHeaders);
}

/**
 * C7 hybride : au lancement d'une nouvelle campagne validation annuelle,
 * remettre toutes les cotisations à `due` (rythme classique d'un cycle
 * annuel : reset en début d'année, paiement progressif au fur et à
 * mesure). Audit-logué.
 */
async function resetMembershipsToDue(
  env: Env,
  request: Request,
  userId: string,
  targetYear: number,
) {
  // Comptage avant pour le log
  const beforeCounts = await env.DB.prepare(
    "SELECT membership_status, COUNT(*) AS n FROM organizations WHERE archived = 0 GROUP BY membership_status",
  ).all<{ membership_status: string | null; n: number }>();

  const res = await env.DB.prepare(
    `UPDATE organizations
        SET membership_status = 'due', updated_at = datetime('now')
      WHERE archived = 0
        AND (membership_status IS NULL
             OR membership_status NOT IN ('due'))`,
  ).run();

  const affected = res.meta?.changes ?? 0;

  try {
    await logAudit(
      env,
      request,
      { id: userId, email: null, role: "admin" },
      "memberships.reset_due",
      "organizations",
      null,
      { counts: beforeCounts.results ?? [], targetYear },
      { affected, newStatus: "due", targetYear },
    );
  } catch { /* best-effort */ }
}

// ── PATCH /api/campaigns/:id – admin/staff(orgs) : update statut/dates/notes ──
async function handleUpdateCampaign(
  request: Request, env: Env, corsHeaders: Record<string, string>, campaignId: number,
) {
  const auth = await requireStaffPermission(request, env, corsHeaders, "manage_validations");
  if ("error" in auth) return auth.error;

  await ensureValidationTables(env);
  const existing = await env.DB.prepare(
    "SELECT * FROM fleet_validation_campaigns WHERE id = ?"
  ).bind(campaignId).first<DbCampaign>();
  if (!existing) return json({ error: "Campagne introuvable" }, corsHeaders, 404);

  let body: Record<string, unknown>;
  try { body = (await request.json()) as Record<string, unknown>; }
  catch { return json({ error: "Body JSON invalide" }, corsHeaders, 400); }

  const updates: string[] = [];
  const values: unknown[] = [];

  if (typeof body.status === "string") {
    if (!["draft", "open", "closed"].includes(body.status)) {
      return json({ error: "status invalide" }, corsHeaders, 400);
    }
    updates.push("status = ?");
    values.push(body.status);
    // Side effects sur les timestamps
    if (body.status === "open" && existing.status === "draft") {
      updates.push("opened_at = ?");
      values.push(new Date().toISOString());
    }
    if (body.status === "closed" && existing.status !== "closed") {
      updates.push("closed_at = ?");
      values.push(new Date().toISOString());
    }
  }
  if ("targetDate" in body) {
    updates.push("target_date = ?");
    values.push(typeof body.targetDate === "string" && body.targetDate ? body.targetDate : null);
  }
  if ("notes" in body) {
    updates.push("notes = ?");
    values.push(typeof body.notes === "string" ? body.notes.trim() || null : null);
  }

  if (updates.length === 0) {
    return json({ error: "Aucun champ a mettre a jour" }, corsHeaders, 400);
  }
  updates.push("updated_at = datetime('now')");
  values.push(campaignId);

  await env.DB.prepare(
    `UPDATE fleet_validation_campaigns SET ${updates.join(", ")} WHERE id = ?`
  ).bind(...values).run();

  const row = await env.DB.prepare(
    "SELECT * FROM fleet_validation_campaigns WHERE id = ?"
  ).bind(campaignId).first<DbCampaign>();

  // Side effect : si la campagne vient de basculer en 'open', notifier les
  // titulaires actifs par email Brevo (best-effort, no-op si pas de secrets)
  // ET reset cotisations à 'due' (C7 du feedback post-launch session 60).
  const justOpened = row && row.status === "open" && existing.status !== "open";
  if (justOpened && row) {
    try {
      await resetMembershipsToDue(env, request, auth.userId, row.target_year);
    } catch (err) {
      console.error("[validation] resetMembershipsToDue failed:", err);
    }
    // ctx.waitUntil indisponible dans cette signature → on attend mais on
    // capture toute exception pour ne pas faire echouer le PATCH.
    try {
      await notifyCampaignOpened(env, row);
    } catch (err) {
      console.error("[validation] notifyCampaignOpened failed:", err);
    }
  }

  return json({ success: true, campaign: row ? toFrontendCampaign(row) : null }, corsHeaders);
}

// ── GET /api/campaigns/:id/dashboard – admin/staff(orgs) : breakdown par compagnie ──
async function handleCampaignDashboard(
  request: Request, env: Env, corsHeaders: Record<string, string>, campaignId: number,
) {
  const auth = await requireStaffPermission(request, env, corsHeaders, "manage_validations");
  if ("error" in auth) return auth.error;

  await ensureValidationTables(env);
  const campaign = await env.DB.prepare(
    "SELECT * FROM fleet_validation_campaigns WHERE id = ?"
  ).bind(campaignId).first<DbCampaign>();
  if (!campaign) return json({ error: "Campagne introuvable" }, corsHeaders, 404);

  const targetYear = campaign.target_year;

  // Compagnies actives et leurs titulaires
  const { results: orgs } = await env.DB.prepare(
    `SELECT id, name, slug, last_validated_year
     FROM organizations
     WHERE archived = 0
     ORDER BY LOWER(name)`
  ).all<{ id: string; name: string; slug: string; last_validated_year: number | null }>();

  const orgList = orgs ?? [];

  // Titulaires par org (1 query)
  const { results: titulaires } = await env.DB.prepare(
    `SELECT organization_id, email
     FROM users
     WHERE is_primary = 1 AND archived = 0`
  ).all<{ organization_id: string; email: string }>();
  const titulaireByOrg = new Map<string, string>();
  for (const t of titulaires ?? []) titulaireByOrg.set(t.organization_id, t.email);

  // Navires par org avec leur last_validated_year (1 query)
  const { results: vessels } = await env.DB.prepare(
    "SELECT organization_id, last_validated_year FROM organization_vessels"
  ).all<{ organization_id: string; last_validated_year: number | null }>();
  const vesselsByOrg = new Map<string, Array<{ last_validated_year: number | null }>>();
  for (const v of vessels ?? []) {
    const arr = vesselsByOrg.get(v.organization_id) ?? [];
    arr.push({ last_validated_year: v.last_validated_year });
    vesselsByOrg.set(v.organization_id, arr);
  }

  let orgsFullyValidated = 0;
  let totalVessels = 0;
  let validatedVessels = 0;

  const rows = orgList.map((o) => {
    const profileValidated = (o.last_validated_year ?? 0) >= targetYear;
    const orgVessels = vesselsByOrg.get(o.id) ?? [];
    const vTotal = orgVessels.length;
    const vValidated = orgVessels.filter((v) => (v.last_validated_year ?? 0) >= targetYear).length;
    totalVessels += vTotal;
    validatedVessels += vValidated;
    const fullyValidated = profileValidated && (vTotal === 0 || vValidated === vTotal);
    if (fullyValidated) orgsFullyValidated += 1;
    return {
      organizationId: o.id,
      organizationName: o.name,
      slug: o.slug,
      profileValidated,
      vesselsValidated: vValidated,
      vesselsTotal: vTotal,
      fullyValidated,
      titulaireEmail: titulaireByOrg.get(o.id) ?? null,
    };
  });

  return json({
    campaign: toFrontendCampaign(campaign),
    summary: {
      orgsTotal: orgList.length,
      orgsFullyValidated,
      vesselsValidated: validatedVessels,
      vesselsTotal: totalVessels,
    },
    rows,
  }, corsHeaders);
}

// ── GET /api/organizations/:slug/validations – historique compagnie ──
async function handleListValidations(
  request: Request, env: Env, corsHeaders: Record<string, string>, slug: string,
) {
  const token = extractToken(request);
  if (!token) return json({ error: "Non authentifie" }, corsHeaders, 401);
  const payload = await verifyJwt(token, env.JWT_SECRET);
  if (!payload) return json({ error: "Token invalide" }, corsHeaders, 401);

  await ensureValidationTables(env);
  const org = await env.DB.prepare("SELECT id FROM organizations WHERE slug = ?")
    .bind(slug).first<{ id: string }>();
  if (!org) return json({ error: "Organisation introuvable" }, corsHeaders, 404);

  const allowed = await canActOnOrg(env, payload, org.id);
  if (!allowed) return json({ error: "Acces refuse" }, corsHeaders, 403);

  const { results } = await env.DB.prepare(
    `SELECT * FROM validation_history
     WHERE organization_id = ?
     ORDER BY target_year DESC, datetime(validated_at) DESC`
  ).bind(org.id).all<DbValidationHistory>();

  return json({
    organizationId: org.id,
    history: (results ?? []).map(toFrontendValidationHistory),
  }, corsHeaders);
}

// ── POST /api/organizations/:slug/validations – soumet N items atomiquement ──
async function handleSubmitValidations(
  request: Request, env: Env, corsHeaders: Record<string, string>, slug: string,
) {
  const token = extractToken(request);
  if (!token) return json({ error: "Non authentifie" }, corsHeaders, 401);
  const payload = await verifyJwt(token, env.JWT_SECRET);
  if (!payload) return json({ error: "Token invalide" }, corsHeaders, 401);

  await ensureValidationTables(env);
  const org = await env.DB.prepare("SELECT * FROM organizations WHERE slug = ?")
    .bind(slug).first<DbOrganization>();
  if (!org) return json({ error: "Organisation introuvable" }, corsHeaders, 404);

  const allowed = await canActOnOrg(env, payload, org.id);
  if (!allowed) return json({ error: "Acces refuse" }, corsHeaders, 403);

  let body: Record<string, unknown>;
  try { body = (await request.json()) as Record<string, unknown>; }
  catch { return json({ error: "Body JSON invalide" }, corsHeaders, 400); }

  let items: ValidationRequestItem[];
  try { items = parseValidationItems(body.items); }
  catch (err) {
    if (err instanceof ValidationInputError) {
      return json({ error: err.message }, corsHeaders, 400);
    }
    throw err;
  }

  const openCampaign = await getOpenCampaign(env);
  const targetYear = resolveTargetYear(openCampaign);
  const campaignId = openCampaign?.id ?? null;
  const userId = String(payload.sub);
  const validatedAt = new Date().toISOString();

  // Profile updates : applique d'abord les changements sur la table organizations
  // pour que le snapshot reflete l'etat post-validation. Idem pour les navires.
  const stmts: ReturnType<typeof env.DB.prepare>[] = [];

  for (const item of items) {
    if (item.type === "profile") {
      // Si modification, applique les UPDATE sur organizations
      if (!item.unchanged && item.data) {
        const fieldMap: Record<string, string> = {
          email: "email",
          phone: "phone",
          address: "address",
          websiteUrl: "website_url",
          logoUrl: "logo_url",
          description: "description",
          employeeCount: "employee_count",
          shipCount: "ship_count",
        };
        const updates: string[] = [];
        const values: unknown[] = [];
        for (const [k, col] of Object.entries(fieldMap)) {
          if (k in item.data) {
            updates.push(`${col} = ?`);
            values.push(item.data[k] ?? null);
          }
        }
        if (updates.length > 0) {
          updates.push("updated_at = datetime('now')");
          values.push(org.id);
          stmts.push(env.DB.prepare(
            `UPDATE organizations SET ${updates.join(", ")} WHERE id = ?`
          ).bind(...values));
        }
      }
    } else {
      // vessel : id obligatoire (deja valide par parseValidationItems)
      const vesselId = item.id!;
      if (!item.unchanged && item.data) {
        const fieldMap: Record<string, string> = {
          name: "name",
          imo: "imo",
          type: "type",
          flag: "flag",
          imageUrl: "image_url",
          yearBuilt: "year_built",
          length: "length_m",
          beam: "beam_m",
          grossTonnage: "gross_tonnage",
          passengerCapacity: "passenger_capacity",
          vehicleCapacity: "vehicle_capacity",
          freightCapacity: "freight_capacity",
          cruiseSpeed: "cruise_speed",
          rotationsPerYear: "rotations_per_year",
          crewSize: "crew_size",
          powerKw: "power_kw",
          consumptionPerTrip: "consumption_per_trip",
          renewalType: "renewal_type",
          renewalYear: "renewal_year",
          owner: "owner",
          shipyard: "shipyard",
          shipyardCountry: "shipyard_country",
          propulsionType: "propulsion_type",
          fuelType: "fuel_type",
          altFuelTests: "alt_fuel_tests",
          shorePower: "shore_power",
          hullTreatment: "hull_treatment",
          emissionReduction: "emission_reduction",
        };
        const updates: string[] = [];
        const values: unknown[] = [];
        for (const [k, col] of Object.entries(fieldMap)) {
          if (k in item.data) {
            updates.push(`${col} = ?`);
            values.push(item.data[k] ?? null);
          }
        }
        if ("crewByBrevet" in item.data) {
          const cbb = item.data.crewByBrevet;
          let cbbJson: string | null = null;
          if (cbb && typeof cbb === "object" && !Array.isArray(cbb)) {
            const cleaned = Object.fromEntries(
              Object.entries(cbb as Record<string, unknown>)
                .map(([k, v]) => {
                  const n = typeof v === "number" ? v : Number(v);
                  return [k, Number.isFinite(n) && n > 0 ? Math.floor(n) : 0];
                })
                .filter(([, n]) => (n as number) > 0),
            );
            if (Object.keys(cleaned).length > 0) cbbJson = JSON.stringify(cleaned);
          }
          updates.push("crew_by_brevet = ?");
          values.push(cbbJson);
        }
        if (updates.length > 0) {
          updates.push("updated_at = datetime('now')");
          values.push(vesselId, org.id);
          stmts.push(env.DB.prepare(
            `UPDATE organization_vessels SET ${updates.join(", ")} WHERE id = ? AND organization_id = ?`
          ).bind(...values));
        }
      }
    }
  }

  // Apply UPDATEs first so the snapshots can read post-update state
  if (stmts.length > 0) {
    await env.DB.batch(stmts);
  }

  // Re-read post-update org and vessels for snapshots
  const orgPostUpdate = await env.DB.prepare("SELECT * FROM organizations WHERE id = ?")
    .bind(org.id).first<DbOrganization>();

  const vesselIds = items.filter((i) => i.type === "vessel").map((i) => i.id!);
  const vesselsById = new Map<string, DbVessel>();
  if (vesselIds.length > 0) {
    const placeholders = vesselIds.map(() => "?").join(",");
    const { results: vRows } = await env.DB.prepare(
      `SELECT * FROM organization_vessels WHERE organization_id = ? AND id IN (${placeholders})`
    ).bind(org.id, ...vesselIds).all<DbVessel>();
    for (const v of vRows ?? []) vesselsById.set(v.id, v);
  }

  // Build history INSERTs + last_validated_* UPDATEs in a second batch
  const historyStmts: ReturnType<typeof env.DB.prepare>[] = [];
  let validatedCount = 0;

  for (const item of items) {
    if (item.type === "profile") {
      const snapshot = orgPostUpdate ? buildProfileSnapshot(orgPostUpdate) : buildProfileSnapshot({});
      historyStmts.push(env.DB.prepare(
        `INSERT INTO validation_history
         (organization_id, item_type, item_id, target_year, validated_at,
          validated_by_user_id, snapshot_json, is_unchanged, campaign_id)
         VALUES (?, 'profile', NULL, ?, ?, ?, ?, ?, ?)`
      ).bind(
        org.id, targetYear, validatedAt, userId,
        JSON.stringify(snapshot), item.unchanged ? 1 : 0, campaignId,
      ));
      historyStmts.push(env.DB.prepare(
        `UPDATE organizations
         SET last_validated_year = ?, last_validated_at = ?, last_validated_by = ?
         WHERE id = ?`
      ).bind(targetYear, validatedAt, userId, org.id));
      validatedCount += 1;
    } else {
      const vesselRow = vesselsById.get(item.id!);
      if (!vesselRow) continue; // navire introuvable, on skip silencieusement
      const snapshot = buildVesselSnapshot(vesselRow);
      historyStmts.push(env.DB.prepare(
        `INSERT INTO validation_history
         (organization_id, item_type, item_id, target_year, validated_at,
          validated_by_user_id, snapshot_json, is_unchanged, campaign_id)
         VALUES (?, 'vessel', ?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        org.id, item.id!, targetYear, validatedAt, userId,
        JSON.stringify(snapshot), item.unchanged ? 1 : 0, campaignId,
      ));
      historyStmts.push(env.DB.prepare(
        `UPDATE organization_vessels
         SET last_validated_year = ?, last_validated_at = ?, last_validated_by = ?
         WHERE id = ? AND organization_id = ?`
      ).bind(targetYear, validatedAt, userId, item.id!, org.id));
      validatedCount += 1;
    }
  }

  if (historyStmts.length > 0) {
    await env.DB.batch(historyStmts);
  }

  return json({
    success: true,
    validated: validatedCount,
    targetYear,
    campaignId: campaignId ?? undefined,
  }, corsHeaders);
}

/**
 * Best-effort : envoie un email Brevo a chaque titulaire actif (is_primary=1)
 * pour annoncer l'ouverture d'une campagne de validation. Silencieux si
 * `BREVO_API_KEY` absent. Les erreurs reseau / Brevo ne font pas echouer le
 * caller (campaign update / create).
 *
 * Audience : tous les titulaires des organisations actives (archived = 0).
 * Le scope est volontairement large (pas de filtre college / 3228) car la
 * validation annuelle concerne TOUTES les compagnies adherentes.
 *
 * Format : email transactionnel charte GASPE (logo, gradient, CTA teal),
 * lien direct vers /espace-adherent/validation, mention de la deadline si
 * presente.
 */
async function notifyCampaignOpened(
  env: Env,
  campaign: DbCampaign,
): Promise<{ sent: number; skipped: number }> {
  if (!env.BREVO_API_KEY) {
    console.log("[validation] BREVO_API_KEY absent, notifyCampaignOpened skipped");
    return { sent: 0, skipped: 0 };
  }

  // Idempotence (session 51) : si l'email d'ouverture a deja ete envoye pour
  // cette campagne, on no-op. Permet a un PATCH draft->open->draft->open de
  // ne pas spammer les titulaires.
  if (await alreadySent(env, campaign.id, "opened")) {
    console.log(`[validation] notifyCampaignOpened deja envoye pour ${campaign.id}`);
    return { sent: 0, skipped: 0 };
  }

  // Recupere les titulaires actifs avec leur organisation
  const { results } = await env.DB.prepare(
    `SELECT u.id AS user_id, u.email, u.name,
            o.id AS org_id, o.name AS org_name, o.slug AS org_slug
     FROM users u
     JOIN organizations o ON o.id = u.organization_id
     WHERE u.is_primary = 1
       AND u.archived = 0
       AND o.archived = 0
       AND u.email IS NOT NULL
       AND u.email != ''`,
  ).all<{
    user_id: string;
    email: string;
    name: string;
    org_id: string;
    org_name: string;
    org_slug: string;
  }>();
  const recipients = results ?? [];
  if (recipients.length === 0) {
    console.log("[validation] notifyCampaignOpened : aucun destinataire eligible");
    return { sent: 0, skipped: 0 };
  }

  const targetDateStr = campaign.target_date
    ? new Date(campaign.target_date).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  const subject = `Validation annuelle ${campaign.target_year} ouverte – ACF`;

  let sent = 0;
  let skipped = 0;
  // Sequentiel pour limiter le risque de rate-limit Brevo (100 req/sec).
  // En pratique, < 30 destinataires donc cout negligeable.
  for (const r of recipients) {
    const htmlContent = renderCampaignOpenedEmailHtml({
      userName: r.name,
      orgName: r.org_name,
      targetYear: campaign.target_year,
      targetDateStr,
      notes: campaign.notes,
    });
    try {
      const resp = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          accept: "application/json",
          "content-type": "application/json",
          "api-key": env.BREVO_API_KEY,
        },
        body: JSON.stringify({
          sender: { name: "ACF (ex-GASPE)", email: "ne-pas-repondre@gaspe.fr" },
          to: [{ email: r.email, name: r.name }],
          subject,
          htmlContent,
        }),
      });
      if (resp.ok) sent += 1;
      else {
        skipped += 1;
        console.warn(`[validation] Brevo a refuse ${r.email} : ${resp.status}`);
      }
    } catch (err) {
      skipped += 1;
      console.error(`[validation] echec envoi a ${r.email} :`, err);
    }
  }
  console.log(`[validation] notifyCampaignOpened : ${sent} envoyes, ${skipped} echoues`);
  await logEmailSent(env, campaign.id, "opened", sent, skipped);
  return { sent, skipped };
}

/**
 * Genere le HTML inline du mail "Validation annuelle ouverte". Charte GASPE
 * (logo + gradient teal + CTA). Sanitization des champs dynamiques via
 * `sanitize()` (helper existant en haut du fichier).
 */
function renderCampaignOpenedEmailHtml(params: {
  userName: string;
  orgName: string;
  targetYear: number;
  targetDateStr: string | null;
  notes: string | null;
}): string {
  const ctaUrl = `${SITE_URL}/espace-adherent/validation`;
  const deadlineLine = params.targetDateStr
    ? `<p style="margin:0 0 12px;color:#222221;font-size:15px;">Deadline indicative : <strong>${sanitize(params.targetDateStr)}</strong>.</p>`
    : "";
  const notesLine = params.notes
    ? `<p style="margin:0 0 12px;color:#555;font-size:14px;font-style:italic;">${sanitize(params.notes)}</p>`
    : "";
  return `<!DOCTYPE html>
<html lang="fr"><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#F5F3F0;font-family:'DM Sans',Helvetica,sans-serif;">
  <div style="max-width:600px;margin:24px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
    <div style="background:#1B7E8A;padding:24px 32px;text-align:center;">
      <h1 style="margin:0;color:#fff;font-family:'Exo 2',Helvetica,sans-serif;font-size:24px;">ACF (ex-GASPE)</h1>
      <p style="margin:4px 0 0;color:#B2DFE3;font-size:13px;">Localement ancres. Socialement engages.</p>
    </div>
    <div style="padding:32px;">
      <h2 style="margin:0 0 16px;color:#222221;font-family:'Exo 2',Helvetica,sans-serif;font-size:20px;">Validation annuelle ${params.targetYear} ouverte</h2>
      <p style="margin:0 0 12px;color:#222221;font-size:15px;">Bonjour ${sanitize(params.userName)},</p>
      <p style="margin:0 0 12px;color:#222221;font-size:15px;">
        La campagne de validation annuelle <strong>${params.targetYear}</strong> vient d'etre ouverte par l'administration ACF. En tant que titulaire de la compagnie <strong>${sanitize(params.orgName)}</strong>, il vous est demande de confirmer ou de mettre a jour les donnees de votre profil et de votre flotte.
      </p>
      ${deadlineLine}
      ${notesLine}
      <p style="margin:0 0 12px;color:#222221;font-size:15px;">
        Le processus est rapide : pour chaque element (profil + chaque navire), vous pouvez cocher « Inchange depuis l'an dernier » ou modifier les valeurs. La validation se fait en un seul clic.
      </p>
      <div style="text-align:center;margin:24px 0;">
        <a href="${ctaUrl}" style="display:inline-block;background:#1B7E8A;color:#fff;text-decoration:none;padding:14px 28px;border-radius:8px;font-family:'Exo 2',Helvetica,sans-serif;font-size:14px;font-weight:600;">Valider mes donnees ${params.targetYear}</a>
      </div>
      <p style="margin:0 0 8px;color:#777;font-size:12px;">Vous pouvez aussi acceder directement a votre espace adherent puis cliquer sur la banniere « Validation annuelle ».</p>
      <p style="margin:0;color:#777;font-size:12px;">Une question ? Repondez a cet email ou contactez l'equipe ACF.</p>
    </div>
    <div style="background:#F5F3F0;padding:16px 32px;text-align:center;color:#777;font-size:11px;">
      ACF - Armateurs Cotiers Francais (ex-GASPE) - <a href="https://gaspe-fr.pages.dev" style="color:#1B7E8A;text-decoration:none;">gaspe-fr.pages.dev</a>
    </div>
  </div>
</body></html>`;
}

// ═══════════════════════════════════════════════════════════
//  Cron deadline notifications – J-14 / J+0 (session 51)
//  Declenche par scheduled() via Cloudflare Workers Cron Trigger.
//  Idempotent via la table validation_email_sent (UNIQUE par
//  campaign_id + notification_type, migration 0030).
// ═══════════════════════════════════════════════════════════

async function ensureEmailSentTable(env: Env): Promise<void> {
  try {
    await env.DB.prepare(`CREATE TABLE IF NOT EXISTS validation_email_sent (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      campaign_id INTEGER NOT NULL,
      notification_type TEXT NOT NULL,
      sent_at TEXT NOT NULL DEFAULT (datetime('now')),
      recipients_count INTEGER NOT NULL DEFAULT 0,
      recipients_skipped INTEGER NOT NULL DEFAULT 0,
      UNIQUE(campaign_id, notification_type)
    )`).run();
  } catch { /* tables peut exister deja */ }
}

/**
 * Vrai si l'email correspondant a deja ete envoye pour cette campagne et
 * ce type de notification (idempotence cross-runs).
 */
async function alreadySent(
  env: Env,
  campaignId: number,
  type: "opened" | "due_soon" | "overdue",
): Promise<boolean> {
  await ensureEmailSentTable(env);
  const row = await env.DB.prepare(
    "SELECT id FROM validation_email_sent WHERE campaign_id = ? AND notification_type = ?",
  ).bind(campaignId, type).first<{ id: number }>();
  return !!row;
}

async function logEmailSent(
  env: Env,
  campaignId: number,
  type: "opened" | "due_soon" | "overdue",
  sent: number,
  skipped: number,
): Promise<void> {
  try {
    await env.DB.prepare(
      `INSERT OR IGNORE INTO validation_email_sent
       (campaign_id, notification_type, recipients_count, recipients_skipped)
       VALUES (?, ?, ?, ?)`,
    ).bind(campaignId, type, sent, skipped).run();
  } catch (err) {
    console.error("[cron] logEmailSent failed:", err);
  }
}

/**
 * Recupere les organisations qui n'ont pas encore tout valide pour une annee
 * cible, avec leur titulaire actif (is_primary=1, archived=0, email non null).
 * Utilise par les helpers notifyCampaignDueSoon / notifyCampaignOverdue pour
 * cibler les retardataires uniquement.
 */
async function getNonValidatedRecipients(
  env: Env,
  targetYear: number,
): Promise<Array<{
  email: string;
  name: string;
  org_name: string;
  org_slug: string;
}>> {
  // Une org est "non fully validated" si :
  // - profil non valide pour targetYear (organizations.last_validated_year < targetYear OU NULL)
  // - OU au moins 1 navire non valide pour targetYear
  // On capture toutes les orgs et on filtre ensuite via les snapshots.
  const { results } = await env.DB.prepare(
    `SELECT u.email, u.name, o.id AS org_id, o.name AS org_name, o.slug AS org_slug,
            o.last_validated_year AS profile_year
     FROM users u
     JOIN organizations o ON o.id = u.organization_id
     WHERE u.is_primary = 1
       AND u.archived = 0
       AND o.archived = 0
       AND u.email IS NOT NULL
       AND u.email != ''`,
  ).all<{
    email: string;
    name: string;
    org_id: string;
    org_name: string;
    org_slug: string;
    profile_year: number | null;
  }>();
  const orgs = results ?? [];
  if (orgs.length === 0) return [];

  // Pour chaque org, verifier si tous ses navires ont last_validated_year >= targetYear
  const orgIds = orgs.map((o) => o.org_id);
  const placeholders = orgIds.map(() => "?").join(",");
  const { results: vesselRows } = await env.DB.prepare(
    `SELECT organization_id, last_validated_year
     FROM organization_vessels
     WHERE organization_id IN (${placeholders})`,
  ).bind(...orgIds).all<{
    organization_id: string;
    last_validated_year: number | null;
  }>();
  const vesselsByOrg = new Map<string, Array<{ last_validated_year: number | null }>>();
  for (const v of vesselRows ?? []) {
    const arr = vesselsByOrg.get(v.organization_id) ?? [];
    arr.push({ last_validated_year: v.last_validated_year });
    vesselsByOrg.set(v.organization_id, arr);
  }

  return orgs
    .filter((o) => {
      const profileOk = (o.profile_year ?? 0) >= targetYear;
      const vessels = vesselsByOrg.get(o.org_id) ?? [];
      const allVesselsOk = vessels.every((v) => (v.last_validated_year ?? 0) >= targetYear);
      return !profileOk || !allVesselsOk;
    })
    .map(({ email, name, org_name, org_slug }) => ({ email, name, org_name, org_slug }));
}

/**
 * Envoi des emails J-14 deadline approche aux retardataires d'une campagne.
 * Idempotent : no-op si deja envoye pour cette campagne. Best-effort sur Brevo.
 */
async function notifyCampaignDueSoon(env: Env, campaign: DbCampaign): Promise<void> {
  if (!env.BREVO_API_KEY) return;
  if (await alreadySent(env, campaign.id, "due_soon")) {
    console.log(`[cron] due_soon deja envoye pour campagne ${campaign.id}`);
    return;
  }
  const recipients = await getNonValidatedRecipients(env, campaign.target_year);
  if (recipients.length === 0) {
    console.log(`[cron] due_soon : aucun retardataire pour campagne ${campaign.id}`);
    await logEmailSent(env, campaign.id, "due_soon", 0, 0);
    return;
  }
  const targetDateStr = campaign.target_date
    ? new Date(campaign.target_date).toLocaleDateString("fr-FR", {
        day: "numeric", month: "long", year: "numeric",
      })
    : null;
  const subject = `Validation annuelle ${campaign.target_year} – deadline approche`;
  let sent = 0;
  let skipped = 0;
  for (const r of recipients) {
    const html = renderCampaignDeadlineEmailHtml({
      kind: "due_soon",
      userName: r.name,
      orgName: r.org_name,
      targetYear: campaign.target_year,
      targetDateStr,
    });
    try {
      const resp = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          accept: "application/json",
          "content-type": "application/json",
          "api-key": env.BREVO_API_KEY,
        },
        body: JSON.stringify({
          sender: { name: "ACF (ex-GASPE)", email: "ne-pas-repondre@gaspe.fr" },
          to: [{ email: r.email, name: r.name }],
          subject,
          htmlContent: html,
        }),
      });
      if (resp.ok) sent += 1;
      else { skipped += 1; console.warn(`[cron] due_soon Brevo refus ${r.email} : ${resp.status}`); }
    } catch (err) {
      skipped += 1;
      console.error(`[cron] due_soon echec envoi a ${r.email}:`, err);
    }
  }
  console.log(`[cron] due_soon campagne ${campaign.id} : ${sent} envoyes, ${skipped} echoues`);
  await logEmailSent(env, campaign.id, "due_soon", sent, skipped);
}

/**
 * Envoi des emails J+0 deadline atteinte aux retardataires (apres deadline,
 * dans la fenetre de tolerance graceDays definie cote shouldNotifyOverdue).
 */
async function notifyCampaignOverdue(env: Env, campaign: DbCampaign): Promise<void> {
  if (!env.BREVO_API_KEY) return;
  if (await alreadySent(env, campaign.id, "overdue")) {
    console.log(`[cron] overdue deja envoye pour campagne ${campaign.id}`);
    return;
  }
  const recipients = await getNonValidatedRecipients(env, campaign.target_year);
  if (recipients.length === 0) {
    await logEmailSent(env, campaign.id, "overdue", 0, 0);
    return;
  }
  const targetDateStr = campaign.target_date
    ? new Date(campaign.target_date).toLocaleDateString("fr-FR", {
        day: "numeric", month: "long", year: "numeric",
      })
    : null;
  const subject = `Validation annuelle ${campaign.target_year} – deadline atteinte`;
  let sent = 0;
  let skipped = 0;
  for (const r of recipients) {
    const html = renderCampaignDeadlineEmailHtml({
      kind: "overdue",
      userName: r.name,
      orgName: r.org_name,
      targetYear: campaign.target_year,
      targetDateStr,
    });
    try {
      const resp = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          accept: "application/json",
          "content-type": "application/json",
          "api-key": env.BREVO_API_KEY,
        },
        body: JSON.stringify({
          sender: { name: "ACF (ex-GASPE)", email: "ne-pas-repondre@gaspe.fr" },
          to: [{ email: r.email, name: r.name }],
          subject,
          htmlContent: html,
        }),
      });
      if (resp.ok) sent += 1;
      else { skipped += 1; console.warn(`[cron] overdue Brevo refus ${r.email} : ${resp.status}`); }
    } catch (err) {
      skipped += 1;
      console.error(`[cron] overdue echec envoi a ${r.email}:`, err);
    }
  }
  console.log(`[cron] overdue campagne ${campaign.id} : ${sent} envoyes, ${skipped} echoues`);
  await logEmailSent(env, campaign.id, "overdue", sent, skipped);
}

/**
 * Template HTML pour les emails deadline (due_soon / overdue). Charte ACF
 * (gradient teal pour due_soon, rouge soutenu pour overdue), sanitization
 * via le helper `sanitize()` existant.
 */
function renderCampaignDeadlineEmailHtml(params: {
  kind: "due_soon" | "overdue";
  userName: string;
  orgName: string;
  targetYear: number;
  targetDateStr: string | null;
}): string {
  const ctaUrl = `${SITE_URL}/espace-adherent/validation`;
  const isOverdue = params.kind === "overdue";
  const headerColor = isOverdue ? "#B91C1C" : "#1B7E8A";
  const headerBaseline = isOverdue ? "Action requise rapidement" : "Localement ancres. Socialement engages.";
  const title = isOverdue
    ? `Validation annuelle ${params.targetYear} : deadline atteinte`
    : `Validation annuelle ${params.targetYear} : deadline approche`;
  const intro = isOverdue
    ? `La date limite indicative pour valider vos donnees ${params.targetYear} (${params.targetDateStr ?? "?"}) est passee. Votre compagnie <strong>${sanitize(params.orgName)}</strong> n'a pas encore confirme l'integralite de son profil et de sa flotte.`
    : `La date limite indicative pour la validation annuelle ${params.targetYear} approche${params.targetDateStr ? ` (<strong>${sanitize(params.targetDateStr)}</strong>)` : ""}. Votre compagnie <strong>${sanitize(params.orgName)}</strong> n'a pas encore tout confirme.`;
  return `<!DOCTYPE html>
<html lang="fr"><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#F5F3F0;font-family:'DM Sans',Helvetica,sans-serif;">
  <div style="max-width:600px;margin:24px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
    <div style="background:${headerColor};padding:24px 32px;text-align:center;">
      <h1 style="margin:0;color:#fff;font-family:'Exo 2',Helvetica,sans-serif;font-size:24px;">ACF (ex-GASPE)</h1>
      <p style="margin:4px 0 0;color:rgba(255,255,255,0.85);font-size:13px;">${headerBaseline}</p>
    </div>
    <div style="padding:32px;">
      <h2 style="margin:0 0 16px;color:#222221;font-family:'Exo 2',Helvetica,sans-serif;font-size:20px;">${title}</h2>
      <p style="margin:0 0 12px;color:#222221;font-size:15px;">Bonjour ${sanitize(params.userName)},</p>
      <p style="margin:0 0 12px;color:#222221;font-size:15px;">${intro}</p>
      <p style="margin:0 0 12px;color:#222221;font-size:15px;">
        Le processus est rapide : pour chaque element (profil + chaque navire), vous pouvez cocher « Inchange depuis l'an dernier » ou modifier les valeurs. La validation se fait en un seul clic.
      </p>
      <div style="text-align:center;margin:24px 0;">
        <a href="${ctaUrl}" style="display:inline-block;background:${headerColor};color:#fff;text-decoration:none;padding:14px 28px;border-radius:8px;font-family:'Exo 2',Helvetica,sans-serif;font-size:14px;font-weight:600;">Valider mes donnees ${params.targetYear}</a>
      </div>
      <p style="margin:0 0 8px;color:#777;font-size:12px;">Vous pouvez aussi acceder directement a votre espace adherent puis cliquer sur la banniere « Validation annuelle ».</p>
      <p style="margin:0;color:#777;font-size:12px;">Une question ? Repondez a cet email ou contactez l'equipe ACF.</p>
    </div>
    <div style="background:#F5F3F0;padding:16px 32px;text-align:center;color:#777;font-size:11px;">
      ACF - Armateurs Cotiers Francais (ex-GASPE) - <a href="https://gaspe-fr.pages.dev" style="color:${headerColor};text-decoration:none;">gaspe-fr.pages.dev</a>
    </div>
  </div>
</body></html>`;
}

/**
 * Entry point du cron quotidien (scheduled). Scan toutes les campagnes en
 * status='open', pour chaque on calcule shouldNotifyDueSoon / shouldNotifyOverdue
 * et on declenche l'email approprie. Idempotence garantie par la table
 * validation_email_sent (UNIQUE par campagne + type).
 */
async function runValidationDeadlineCron(env: Env): Promise<void> {
  await ensureValidationTables(env);
  await ensureEmailSentTable(env);
  const { results } = await env.DB.prepare(
    "SELECT * FROM fleet_validation_campaigns WHERE status = 'open'",
  ).all<DbCampaign>();
  const openCampaigns = results ?? [];
  console.log(`[cron] ${openCampaigns.length} campagne(s) ouverte(s) a scanner`);
  const nowMs = Date.now();
  for (const c of openCampaigns) {
    const cell: Pick<ValidationCampaignRow, "status" | "target_date"> = {
      status: c.status,
      target_date: c.target_date,
    };
    if (shouldNotifyOverdue(cell, nowMs)) {
      await notifyCampaignOverdue(env, c).catch((err) => {
        console.error(`[cron] notifyCampaignOverdue ${c.id} failed:`, err);
      });
    } else if (shouldNotifyDueSoon(cell, nowMs)) {
      await notifyCampaignDueSoon(env, c).catch((err) => {
        console.error(`[cron] notifyCampaignDueSoon ${c.id} failed:`, err);
      });
    }
  }
}

// ════════════════════════════════════════════════════════════════════
//  Formations – CRUD (session 54, P0-1 PRODUCTION-SAFETY-2026)
//  Migration 0031_formations.sql.
//  Permission staff requise pour POST/PATCH/DELETE : `manage_formations`.
// ════════════════════════════════════════════════════════════════════

interface DbFormation {
  id: string; slug: string | null; title: string;
  description: string | null; content: string | null;
  organizer: string | null;
  start_date: string | null; end_date: string | null;
  location: string | null; duration: string | null;
  capacity: number; enrolled: number;
  target_audience: string | null; prerequisites: string | null;
  price: string | null; contact_email: string | null;
  status: string;
  category: string | null;
  modality: string | null;
  schedule_json: string | null;
  attachments_json: string | null;
  registrations_json: string | null;
  registration_deadline: string | null;
  is_published: number; is_archived: number;
  created_by: string | null;
  created_at: string; updated_at: string;
}

function safeJsonParse<T>(s: string | null | undefined, fallback: T): T {
  if (!s) return fallback;
  try { return JSON.parse(s) as T; } catch { return fallback; }
}

function toFrontendFormation(row: DbFormation) {
  return {
    id: row.id,
    slug: row.slug ?? row.id,
    title: row.title,
    description: row.description ?? "",
    content: row.content ?? "",
    organizer: row.organizer ?? "",
    startDate: row.start_date ?? "",
    endDate: row.end_date ?? "",
    location: row.location ?? "",
    duration: row.duration ?? "",
    capacity: row.capacity ?? 0,
    enrolled: row.enrolled ?? 0,
    targetAudience: row.target_audience ?? "",
    prerequisites: row.prerequisites ?? "",
    price: row.price ?? "",
    contactEmail: row.contact_email ?? "",
    status: row.status ?? "open",
    category: row.category ?? "",
    modality: row.modality ?? undefined,
    schedule: safeJsonParse<unknown[]>(row.schedule_json, []),
    attachments: safeJsonParse<unknown[]>(row.attachments_json, []),
    registrations: safeJsonParse<string[]>(row.registrations_json, []),
    registrationDeadline: row.registration_deadline ?? undefined,
    isPublished: row.is_published === 1,
    isArchived: row.is_archived === 1,
    createdBy: row.created_by ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function ensureFormationsTable(env: Env): Promise<void> {
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS formations (
      id TEXT PRIMARY KEY,
      slug TEXT,
      title TEXT NOT NULL,
      description TEXT,
      content TEXT,
      organizer TEXT,
      start_date TEXT, end_date TEXT,
      location TEXT, duration TEXT,
      capacity INTEGER DEFAULT 0,
      enrolled INTEGER DEFAULT 0,
      target_audience TEXT, prerequisites TEXT,
      price TEXT, contact_email TEXT,
      status TEXT DEFAULT 'open',
      category TEXT,
      modality TEXT,
      schedule_json TEXT,
      attachments_json TEXT,
      registrations_json TEXT,
      registration_deadline TEXT,
      is_published INTEGER DEFAULT 1,
      is_archived INTEGER DEFAULT 0,
      created_by TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `).run();
}

async function handleFormationsList(request: Request, env: Env, corsHeaders: Record<string, string>) {
  await ensureFormationsTable(env);
  // Public : seulement les publiées + non archivées. Admin/staff : tout.
  const token = extractToken(request);
  let isPrivileged = false;
  if (token) {
    const payload = await verifyJwt(token, env.JWT_SECRET);
    if (payload?.role === "admin") isPrivileged = true;
    if (!isPrivileged && payload?.role === "staff") {
      // staff voit tout aussi (consultation)
      isPrivileged = true;
    }
  }
  const query = isPrivileged
    ? "SELECT * FROM formations ORDER BY start_date DESC, created_at DESC"
    : "SELECT * FROM formations WHERE is_published = 1 AND is_archived = 0 ORDER BY start_date DESC, created_at DESC";
  try {
    const { results } = await env.DB.prepare(query).all<DbFormation>();
    return json({ formations: (results ?? []).map(toFrontendFormation) }, corsHeaders);
  } catch {
    return json({ formations: [] }, corsHeaders);
  }
}

async function handleGetFormation(
  request: Request, env: Env, corsHeaders: Record<string, string>, slugOrId: string,
) {
  await ensureFormationsTable(env);
  const row = await env.DB.prepare(
    "SELECT * FROM formations WHERE slug = ? OR id = ?",
  ).bind(slugOrId, slugOrId).first<DbFormation>();
  if (!row) return json({ error: "Formation introuvable" }, corsHeaders, 404);
  // Lecture publique uniquement si publiée et non archivée. Privilégiés : tout.
  if (row.is_published !== 1 || row.is_archived === 1) {
    const token = extractToken(request);
    let isPrivileged = false;
    if (token) {
      const payload = await verifyJwt(token, env.JWT_SECRET);
      if (payload?.role === "admin" || payload?.role === "staff") isPrivileged = true;
    }
    if (!isPrivileged) return json({ error: "Formation introuvable" }, corsHeaders, 404);
  }
  return json({ formation: toFrontendFormation(row) }, corsHeaders);
}

async function handleCreateFormation(request: Request, env: Env, corsHeaders: Record<string, string>) {
  const auth = await requireStaffPermission(request, env, corsHeaders, "manage_formations");
  if ("error" in auth) return auth.error;
  await ensureFormationsTable(env);

  let body: Record<string, unknown>;
  try { body = await request.json() as Record<string, unknown>; }
  catch { return json({ error: "Body JSON invalide" }, corsHeaders, 400); }

  const title = sanitize(String(body.title ?? ""));
  if (!title) return json({ error: "title requis" }, corsHeaders, 400);

  // Slug optionnel : généré depuis title si non fourni.
  const rawSlug = String(body.slug ?? "").trim()
    || title.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
            .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
            .slice(0, 64);
  const slug = sanitize(rawSlug);
  const id = String(body.id ?? `form-${slug}-${Date.now().toString(36)}`);

  const now = new Date().toISOString();
  try {
    await env.DB.prepare(`
      INSERT INTO formations (
        id, slug, title, description, content, organizer,
        start_date, end_date, location, duration,
        capacity, enrolled, target_audience, prerequisites,
        price, contact_email, status, category,
        modality, schedule_json, attachments_json, registrations_json,
        registration_deadline, is_published, is_archived, created_by,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id, slug, title,
      sanitize(String(body.description ?? "")),
      sanitizeRichHtml(String(body.content ?? "")),
      sanitize(String(body.organizer ?? "")),
      String(body.startDate ?? "") || null,
      String(body.endDate ?? "") || null,
      sanitize(String(body.location ?? "")),
      sanitize(String(body.duration ?? "")),
      Number(body.capacity ?? 0),
      Number(body.enrolled ?? 0),
      sanitize(String(body.targetAudience ?? "")),
      sanitize(String(body.prerequisites ?? "")),
      sanitize(String(body.price ?? "")),
      sanitize(String(body.contactEmail ?? "")),
      sanitize(String(body.status ?? "open")),
      sanitize(String(body.category ?? "")),
      body.modality ? sanitize(String(body.modality)) : null,
      Array.isArray(body.schedule) ? JSON.stringify(body.schedule) : null,
      Array.isArray(body.attachments) ? JSON.stringify(body.attachments) : null,
      Array.isArray(body.registrations) ? JSON.stringify(body.registrations) : null,
      String(body.registrationDeadline ?? "") || null,
      body.isPublished === false ? 0 : 1,
      body.isArchived === true ? 1 : 0,
      auth.userId,
      now, now,
    ).run();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("UNIQUE")) return json({ error: "ID/Slug déjà utilisé" }, corsHeaders, 409);
    return json({ error: "Erreur création formation" }, corsHeaders, 500);
  }

  const row = await env.DB.prepare("SELECT * FROM formations WHERE id = ?")
    .bind(id).first<DbFormation>();
  return json({ formation: row ? toFrontendFormation(row) : null }, corsHeaders, 201);
}

async function handleUpdateFormation(
  request: Request, env: Env, corsHeaders: Record<string, string>, id: string,
) {
  const auth = await requireStaffPermission(request, env, corsHeaders, "manage_formations");
  if ("error" in auth) return auth.error;
  await ensureFormationsTable(env);

  const existing = await env.DB.prepare("SELECT * FROM formations WHERE id = ?")
    .bind(id).first<DbFormation>();
  if (!existing) return json({ error: "Formation introuvable" }, corsHeaders, 404);

  let body: Record<string, unknown>;
  try { body = await request.json() as Record<string, unknown>; }
  catch { return json({ error: "Body JSON invalide" }, corsHeaders, 400); }

  // Liste blanche des champs PATCH-ables.
  // - jsonArrayFields : sérialisés en JSON pour les colonnes _json.
  // - boolean : convertis 0/1.
  // - number : Number().
  // - default string : sanitize().
  const fieldMap: Record<string, string> = {
    slug: "slug", title: "title", description: "description",
    content: "content", organizer: "organizer",
    startDate: "start_date", endDate: "end_date",
    location: "location", duration: "duration",
    capacity: "capacity", enrolled: "enrolled",
    targetAudience: "target_audience", prerequisites: "prerequisites",
    price: "price", contactEmail: "contact_email",
    status: "status", category: "category",
    modality: "modality",
    schedule: "schedule_json",
    attachments: "attachments_json",
    registrations: "registrations_json",
    registrationDeadline: "registration_deadline",
    isPublished: "is_published", isArchived: "is_archived",
  };
  const jsonArrayFields = new Set(["schedule_json", "attachments_json", "registrations_json"]);
  const sets: string[] = [];
  const vals: unknown[] = [];
  for (const [key, col] of Object.entries(fieldMap)) {
    if (!(key in body)) continue;
    let v = body[key];
    if (col === "is_published" || col === "is_archived") v = v ? 1 : 0;
    else if (col === "capacity" || col === "enrolled") v = Number(v ?? 0);
    else if (col === "content") v = sanitizeRichHtml(String(v ?? ""));
    else if (jsonArrayFields.has(col)) v = Array.isArray(v) ? JSON.stringify(v) : null;
    else if (typeof v === "string") v = sanitize(v);
    sets.push(`${col} = ?`);
    vals.push(v);
  }
  if (sets.length === 0) return json({ formation: toFrontendFormation(existing) }, corsHeaders);

  sets.push("updated_at = ?");
  vals.push(new Date().toISOString());
  vals.push(id);

  try {
    await env.DB.prepare(`UPDATE formations SET ${sets.join(", ")} WHERE id = ?`)
      .bind(...vals).run();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("UNIQUE")) return json({ error: "Slug déjà utilisé" }, corsHeaders, 409);
    return json({ error: "Erreur mise à jour" }, corsHeaders, 500);
  }

  const row = await env.DB.prepare("SELECT * FROM formations WHERE id = ?")
    .bind(id).first<DbFormation>();
  return json({ formation: row ? toFrontendFormation(row) : null }, corsHeaders);
}

async function handleDeleteFormation(
  request: Request, env: Env, corsHeaders: Record<string, string>, id: string,
) {
  const auth = await requireStaffPermission(request, env, corsHeaders, "manage_formations");
  if ("error" in auth) return auth.error;
  await ensureFormationsTable(env);

  // Snapshot before pour audit log
  const before = await env.DB.prepare("SELECT * FROM formations WHERE id = ?")
    .bind(id).first<DbFormation>();
  if (!before) return json({ error: "Formation introuvable" }, corsHeaders, 404);

  // Soft-delete (preserve traçabilité) : is_archived = 1, is_published = 0
  await env.DB.prepare(
    "UPDATE formations SET is_archived = 1, is_published = 0, updated_at = ? WHERE id = ?",
  ).bind(new Date().toISOString(), id).run();

  await logAudit(
    env, request,
    { id: auth.userId, role: "staff" },
    "formation.delete", "formation", id, before, null,
  );

  return json({ success: true, archived: true }, corsHeaders);
}

// ════════════════════════════════════════════════════════════════════
//  Positions – CRUD : extrait dans ./handlers/positions (J1 vague 5.c)
//  Le module exporte aussi `DbPosition`, `toFrontendPosition` et
//  `ensurePositionsTable`, réutilisés par les handlers feed.xml et
//  sitemap-positions.xml ci-dessous.
// ════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════
//  Admin export-all + audit-log helpers — extrait dans ./handlers/admin-tools et ./lib/audit (J1 vague 2)
// ═══════════════════════════════════════════════════════════

// ════════════════════════════════════════════════════════════════════
//  RSS feed dynamique depuis D1 (P1 SEO session 54+)
//  GET /api/feed.xml — RSS 2.0 régénéré à chaque hit depuis la table
//  positions. Contournement de la limitation static export Next.js
//  (`/feed.xml` Pages reste sur le seed `data/positions.ts` qui est vide).
//
//  Pour un usage prod : adresser le RSS public sur cette URL via les
//  meta tags ou redirection CF Pages → Worker.
// ════════════════════════════════════════════════════════════════════

const SITE_URL_FOR_FEED = "https://gaspe-fr.pages.dev";
const SITE_NAME_FOR_FEED = "GASPE";

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

async function handleFeedXml(env: Env, corsHeaders: Record<string, string>) {
  await ensurePositionsTable(env);
  const { results } = await env.DB.prepare(
    "SELECT * FROM positions WHERE published = 1 AND is_archived = 0 ORDER BY date DESC, created_at DESC LIMIT 50",
  ).all<DbPosition>();

  const positions = (results ?? []).map(toFrontendPosition);
  const lastBuild = positions[0]?.date ?? new Date().toISOString();

  const items = positions
    .map((p) => {
      const url = `${SITE_URL_FOR_FEED}/positions/view?slug=${encodeURIComponent(p.slug)}`;
      const pubDate = (() => {
        try { return new Date(p.date).toUTCString(); } catch { return new Date().toUTCString(); }
      })();
      const description = escapeXml(stripHtml(p.excerpt ?? ""));
      const safeBody = (p.content ?? "").replace(/]]>/g, "]]]]><![CDATA[>");
      return [
        "    <item>",
        `      <title>${escapeXml(p.title)}</title>`,
        `      <link>${url}</link>`,
        `      <guid isPermaLink="true">${url}</guid>`,
        `      <pubDate>${pubDate}</pubDate>`,
        `      <category>${escapeXml(p.category)}</category>`,
        `      <description>${description}</description>`,
        `      <content:encoded><![CDATA[${safeBody}]]></content:encoded>`,
        `      <dc:creator>${escapeXml(SITE_NAME_FOR_FEED)}</dc:creator>`,
        "    </item>",
      ].join("\n");
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
     xmlns:content="http://purl.org/rss/1.0/modules/content/"
     xmlns:dc="http://purl.org/dc/elements/1.1/"
     xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(SITE_NAME_FOR_FEED)} – Positions et actualités</title>
    <link>${SITE_URL_FOR_FEED}/positions</link>
    <description>Positions, communiqués de presse et actualités du GASPE / ACF.</description>
    <language>fr-FR</language>
    <lastBuildDate>${new Date(lastBuild).toUTCString()}</lastBuildDate>
    <atom:link href="${SITE_URL_FOR_FEED}/api/feed.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    status: 200,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=600",
    },
  });
}

async function handleSitemapPositionsXml(env: Env, corsHeaders: Record<string, string>) {
  await ensurePositionsTable(env);
  const { results } = await env.DB.prepare(
    "SELECT slug, date, updated_at FROM positions WHERE published = 1 AND is_archived = 0 ORDER BY date DESC LIMIT 1000",
  ).all<{ slug: string; date: string | null; updated_at: string }>();

  const urls = (results ?? [])
    .map((p) => {
      const loc = `${SITE_URL_FOR_FEED}/positions/view?slug=${encodeURIComponent(p.slug)}`;
      const lastmod = p.updated_at ?? p.date ?? new Date().toISOString();
      return [
        "  <url>",
        `    <loc>${escapeXml(loc)}</loc>`,
        `    <lastmod>${escapeXml(lastmod.slice(0, 10))}</lastmod>`,
        "    <changefreq>monthly</changefreq>",
        "    <priority>0.7</priority>",
        "  </url>",
      ].join("\n");
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

  return new Response(xml, {
    status: 200,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=600, s-maxage=1800",
    },
  });
}

// ═══════════════════════════════════════════════════════════
//  Seed hashes + audit-log list — extrait dans ./handlers/admin-tools (J1 vague 2)
// ═══════════════════════════════════════════════════════════

// ════════════════════════════════════════════════════════════════════
//  Formation register / unregister (B1 fix session 54+++)
//  Endpoints dédiés pour qu'un adhérent / candidat puisse s'inscrire ou
//  se désinscrire d'une formation sans avoir besoin de la permission
//  staff `manage_formations`. Authentification JWT simple suffit.
//
//  POST /api/formations/:id/register
//  POST /api/formations/:id/unregister
// ════════════════════════════════════════════════════════════════════

async function handleFormationRegister(
  request: Request, env: Env, corsHeaders: Record<string, string>, id: string,
) {
  const token = extractToken(request);
  if (!token) return json({ error: "Non authentifié" }, corsHeaders, 401);
  const payload = await verifyJwt(token, env.JWT_SECRET);
  if (!payload) return json({ error: "Token invalide" }, corsHeaders, 401);
  await ensureFormationsTable(env);

  const row = await env.DB.prepare("SELECT * FROM formations WHERE id = ?")
    .bind(id).first<DbFormation>();
  if (!row) return json({ error: "Formation introuvable" }, corsHeaders, 404);
  if (row.is_archived === 1) return json({ error: "Formation archivée" }, corsHeaders, 400);

  // Deadline check (mirror du helper isRegistrationClosed front)
  if (row.registration_deadline) {
    const deadline = new Date(row.registration_deadline);
    if (!isNaN(deadline.getTime()) && new Date() > deadline) {
      return json({ error: "Date limite d'inscription dépassée" }, corsHeaders, 400);
    }
  }

  // Capacity check
  const current = safeJsonParse<string[]>(row.registrations_json, []);
  if (current.length >= row.capacity && !current.includes(payload.sub)) {
    return json({ error: "Formation complète" }, corsHeaders, 400);
  }

  const updated = Array.from(new Set([...current, payload.sub]));
  await env.DB.prepare(
    "UPDATE formations SET registrations_json = ?, updated_at = ? WHERE id = ?",
  ).bind(JSON.stringify(updated), new Date().toISOString(), id).run();

  const fresh = await env.DB.prepare("SELECT * FROM formations WHERE id = ?")
    .bind(id).first<DbFormation>();
  return json({ formation: fresh ? toFrontendFormation(fresh) : null }, corsHeaders);
}

async function handleFormationUnregister(
  request: Request, env: Env, corsHeaders: Record<string, string>, id: string,
) {
  const token = extractToken(request);
  if (!token) return json({ error: "Non authentifié" }, corsHeaders, 401);
  const payload = await verifyJwt(token, env.JWT_SECRET);
  if (!payload) return json({ error: "Token invalide" }, corsHeaders, 401);
  await ensureFormationsTable(env);

  const row = await env.DB.prepare("SELECT * FROM formations WHERE id = ?")
    .bind(id).first<DbFormation>();
  if (!row) return json({ error: "Formation introuvable" }, corsHeaders, 404);

  const current = safeJsonParse<string[]>(row.registrations_json, []);
  const updated = current.filter((uid) => uid !== payload.sub);
  await env.DB.prepare(
    "UPDATE formations SET registrations_json = ?, updated_at = ? WHERE id = ?",
  ).bind(JSON.stringify(updated), new Date().toISOString(), id).run();

  const fresh = await env.DB.prepare("SELECT * FROM formations WHERE id = ?")
    .bind(id).first<DbFormation>();
  return json({ formation: fresh ? toFrontendFormation(fresh) : null }, corsHeaders);
}
