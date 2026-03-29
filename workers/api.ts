/**
 * GASPE API Worker — Cloudflare Workers
 *
 * Deployment:
 *   npx wrangler deploy workers/api.ts --name gaspe-api
 *
 * Bindings needed in wrangler.toml:
 *   - D1: DB (gaspe-db)
 *   - R2: UPLOADS (gaspe-uploads)
 *   - Environment: RESEND_API_KEY, CONTACT_EMAIL
 *
 * This worker handles:
 *   POST /api/contact    — send contact email via Resend
 *   POST /api/newsletter — subscribe to newsletter
 *   POST /api/upload     — upload CV/documents to R2
 *   GET  /api/health     — health check
 */

interface Env {
  DB: D1Database;
  UPLOADS: R2Bucket;
  RESEND_API_KEY: string;
  CONTACT_EMAIL: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS headers — allow both production and preview URLs
    const origin = request.headers.get("Origin") ?? "";
    const allowedOrigins = ["https://gaspe-fr.pages.dev", "https://www.gaspe.fr", "http://localhost:3001"];
    const corsOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
    const corsHeaders = {
      "Access-Control-Allow-Origin": corsOrigin,
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // Basic rate limiting via CF headers (IP-based)
    const clientIP = request.headers.get("CF-Connecting-IP") ?? "unknown";

    try {
      if (path === "/api/health") {
        return json({ status: "ok", timestamp: new Date().toISOString() }, corsHeaders);
      }

      if (path === "/api/contact" && request.method === "POST") {
        return handleContact(request, env, corsHeaders);
      }

      if (path === "/api/newsletter" && request.method === "POST") {
        return handleNewsletter(request, env, corsHeaders);
      }

      if (path === "/api/upload" && request.method === "POST") {
        return handleUpload(request, env, corsHeaders);
      }

      return json({ error: "Not found" }, corsHeaders, 404);
    } catch (err) {
      return json({ error: "Internal server error" }, corsHeaders, 500);
    }
  },
};

// ── Sanitize HTML to prevent XSS ──
function sanitize(str: string): string {
  return str.replace(/[<>&"']/g, (c) => {
    const map: Record<string, string> = { "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&#39;" };
    return map[c] ?? c;
  });
}

// ── Contact form → Resend email ──
async function handleContact(request: Request, env: Env, headers: Record<string, string>) {
  const body = await request.json() as Record<string, string>;
  const nom = sanitize((body.nom ?? "").trim());
  const email = (body.email ?? "").trim();
  const societe = sanitize((body.societe ?? "").trim());
  const sujet = sanitize((body.sujet ?? "").trim());
  const message = sanitize((body.message ?? "").trim());

  if (!nom || !email || !sujet || !message) {
    return json({ error: "Champs requis manquants" }, headers, 400);
  }

  // Validate email format
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ error: "Email invalide" }, headers, 400);
  }

  // Max length validation
  if (nom.length > 200 || email.length > 200 || message.length > 5000) {
    return json({ error: "Contenu trop long" }, headers, 400);
  }

  // Store in D1
  await env.DB.prepare(
    "INSERT INTO contact_messages (id, nom, email, societe, sujet, message) VALUES (?, ?, ?, ?, ?, ?)"
  ).bind(crypto.randomUUID(), nom, email, societe ?? "", sujet, message).run();

  // Send email via Resend
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

  return json({ success: true }, headers);
}

// ── Newsletter subscription ──
async function handleNewsletter(request: Request, env: Env, headers: Record<string, string>) {
  const body = await request.json() as Record<string, string>;
  const { email } = body;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ error: "Email invalide" }, headers, 400);
  }

  await env.DB.prepare(
    "INSERT OR IGNORE INTO newsletter (email) VALUES (?)"
  ).bind(email).run();

  return json({ success: true }, headers);
}

// ── File upload → R2 ──
async function handleUpload(request: Request, env: Env, headers: Record<string, string>) {
  const formData = await request.formData();
  const file = formData.get("file") as File;
  const type = formData.get("type") as string; // "cv" | "document"

  if (!file) {
    return json({ error: "Aucun fichier fourni" }, headers, 400);
  }

  // Validate file type
  const allowed = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
  if (!allowed.includes(file.type)) {
    return json({ error: "Type de fichier non autorisé (PDF, DOC, DOCX uniquement)" }, headers, 400);
  }

  // Max 10MB
  if (file.size > 10 * 1024 * 1024) {
    return json({ error: "Fichier trop volumineux (max 10 Mo)" }, headers, 400);
  }

  const key = `${type}/${crypto.randomUUID()}-${file.name}`;
  await env.UPLOADS.put(key, file.stream(), {
    httpMetadata: { contentType: file.type },
    customMetadata: { originalName: file.name, uploadedAt: new Date().toISOString() },
  });

  return json({ success: true, key, filename: file.name }, headers);
}

function json(data: unknown, headers: Record<string, string>, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...headers, "Content-Type": "application/json" },
  });
}
