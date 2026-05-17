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
} from "./handlers/positions";
import {
  handleFeedXml,
  handleSitemapPositionsXml,
} from "./handlers/feed-rss";
import { handleUpload } from "./handlers/upload";
import { handleHydrosPublish } from "./handlers/hydros-cross-publication";
import { handleEnmImport } from "./handlers/enm-import";
import {
  handleListNewsletterCategoriesPublic,
  handleListNewsletterCategoriesAdmin,
  handleCreateNewsletterCategory,
  handleUpdateNewsletterCategory,
  handleArchiveNewsletterCategory,
  handleSyncCategoryToBrevo,
  handleGetPreferences,
  handleUpdatePreferences,
  handleContact,
  handleNewsletterSubscribers,
  handleNewsletter,
  handleNewsletterSend,
  handleNlDraftsList,
  handleNlDraftsGet,
  handleNlDraftsCreate,
  handleNlDraftsUpdate,
  handleNlDraftsDelete,
  handleNewsletterTestSend,
  handleNewsletterBulkSend,
  handleBrevoWebhook,
  handleNewsletterUnsubscribe,
} from "./handlers/newsletter";
import {
  handleFormationsList,
  handleGetFormation,
  handleCreateFormation,
  handleUpdateFormation,
  handleDeleteFormation,
  handleFormationRegister,
  handleFormationUnregister,
} from "./handlers/formations";
import {
  handleDocumentsList,
  handleDocumentGet,
  handleDocumentCreate,
  handleDocumentUpdate,
  handleDocumentDelete,
} from "./handlers/documents";
import {
  handleMediaList,
  handleMediaUpload,
  handleMediaDelete,
  handleMediaRaw,
} from "./handlers/media";
import {
  handleListOrganizations,
  handleGetOrganization,
  handleUpdateOrganization,
  toFrontendOrg,
  type DbOrganization,
} from "./handlers/organizations";
import {
  handleInviteContact,
  handleListInvitations,
  handleAcceptInvitation,
} from "./handlers/invitations";
import {
  handleGetFleet,
  handleListAllFleets,
  handleUpsertFleet,
  ensureVesselsTable,
  toFrontendVessel,
  type DbVessel,
} from "./handlers/organization-vessels";
import {
  handleListVotes,
  handleCreateVote,
  handleGetVote,
  handleSubmitVoteResponse,
  handleVoteResults,
  handleCloseVote,
  handleDeleteVote,
  handleGetMySuppleant,
  handleSetMySuppleant,
} from "./handlers/votes";
import {
  handleListCampaigns,
  handleCreateCampaign,
  handleUpdateCampaign,
  handleCampaignDashboard,
  handleListValidations,
  handleSubmitValidations,
  runValidationDeadlineCron,
} from "./handlers/validation-campaigns";
import {
  MAGIC_BYTES,
  validateMagicBytes,
  deriveMimeType,
} from "./lib/uploads";
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

// MAGIC_BYTES, validateMagicBytes, deriveMimeType : extraits dans
// ./lib/uploads (J1 vague 5.f). Réutilisés par /api/upload + /api/media.

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
//  Organizations — extrait dans ./handlers/organizations (J1 vague 6.a)
//  Le module exporte DbOrganization + toFrontendOrg réutilisés ailleurs.
// ═══════════════════════════════════════════════════════════


// ═══════════════════════════════════════════════════════════
//  Invitations — extrait dans ./handlers/invitations (J1 vague 6.c)
// ═══════════════════════════════════════════════════════════


// ═══════════════════════════════════════════════════════════
//  Newsletter (categories + preferences + contact + subscription + send v2 + drafts + brevo webhook + unsubscribe)
//  Extrait dans ./handlers/newsletter (J1 vague 4.b)
// ═══════════════════════════════════════════════════════════


// ═══════════════════════════════════════════════════════════
//  CMS Documents – extrait dans ./handlers/documents (J1 vague 5.e)
// ═══════════════════════════════════════════════════════════


// ═══════════════════════════════════════════════════════════
//  Organization Vessels — extrait dans ./handlers/organization-vessels (J1 vague 6.b)
//  Le module exporte DbVessel + toFrontendVessel + ensureVesselsTable
//  réutilisés par validation-campaigns.
// ═══════════════════════════════════════════════════════════


// ═══════════════════════════════════════════════════════════
//  Votes — extrait dans ./handlers/votes (J1 vague 6.d)
//  Inclut les endpoints suppléant /api/users/me/suppleant (le pattern
//  désignation suppléant sert exclusivement au flow vote).
// ═══════════════════════════════════════════════════════════


// ═══════════════════════════════════════════════════════════
//  Validation campaigns + cron deadline — extrait dans ./handlers/validation-campaigns (J1 vague 6.e)
// ═══════════════════════════════════════════════════════════


// ════════════════════════════════════════════════════════════════════
//  Formations – CRUD + register/unregister : extrait dans
//  ./handlers/formations (J1 vague 5.d)
// ════════════════════════════════════════════════════════════════════

// Bloc historique retiré : interface DbFormation, helpers
// safeJsonParse / toFrontendFormation / ensureFormationsTable, et
// handlers list/get/create/update/delete (register/unregister extraits
// dans le même module).


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
//  RSS feed + sitemap — extrait dans ./handlers/feed-rss (J1 vague 7.a)
// ════════════════════════════════════════════════════════════════════


// ═══════════════════════════════════════════════════════════
//  Seed hashes + audit-log list — extrait dans ./handlers/admin-tools (J1 vague 2)
// ═══════════════════════════════════════════════════════════

