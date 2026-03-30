/* ------------------------------------------------------------------ */
/*  Transactional email service — via CF Worker proxy to Brevo         */
/*  The API key stays server-side. Client sends to /api/email.         */
/* ------------------------------------------------------------------ */

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

function getConfig() {
  const adminEmail = process.env.NEXT_PUBLIC_BREVO_ADMIN_EMAIL ?? "admin@gaspe.fr";
  return { adminEmail };
}

interface SendEmailParams {
  to: { email: string; name?: string }[];
  subject: string;
  htmlContent: string;
  textContent?: string;
}

async function sendEmail(params: SendEmailParams): Promise<{ success: boolean; error?: string }> {
  const endpoint = API_URL ? `${API_URL}/api/email` : "/api/email";

  if (!API_URL) {
    console.warn("[Email] Pas d'API_URL configurée — email non envoyé (mode localStorage)");
    return { success: false, error: "API_URL non configurée" };
  }

  try {
    // Get auth token for the request
    const token = typeof window !== "undefined" ? localStorage.getItem("gaspe_api_token") : null;
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify({
        to: params.to,
        subject: params.subject,
        htmlContent: params.htmlContent,
        textContent: params.textContent,
      }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      const msg = (body as { error?: string }).error ?? `HTTP ${res.status}`;
      console.error("[Email] Erreur envoi:", msg);
      return { success: false, error: msg };
    }

    console.log("[Email] Envoyé avec succès à:", params.to.map(t => t.email).join(", "));
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erreur inconnue";
    console.error("[Email] Erreur réseau:", msg);
    return { success: false, error: msg };
  }
}

/* ------------------------------------------------------------------ */
/*  Email templates                                                    */
/* ------------------------------------------------------------------ */

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://gaspe-fr.pages.dev";

const HEADER = `
  <div style="background:#1B7E8A;padding:24px 32px;text-align:center;">
    <h1 style="margin:0;color:#fff;font-family:'Exo 2',Helvetica,sans-serif;font-size:24px;">GASPE</h1>
    <p style="margin:4px 0 0;color:#B2DFE3;font-family:'DM Sans',Helvetica,sans-serif;font-size:13px;">Localement ancrés. Socialement engagés.</p>
  </div>
`;

const FOOTER = `
  <div style="margin-top:32px;padding:16px 32px;border-top:1px solid #DCD5CC;text-align:center;font-family:'DM Sans',Helvetica,sans-serif;font-size:12px;color:#6B6560;">
    <p style="margin:0;">GASPE — Groupement des Armateurs de Services Publics Maritimes de Passages d'Eau</p>
    <p style="margin:4px 0 0;">Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
  </div>
`;

function emailWrapper(body: string): string {
  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head><meta charset="utf-8"></head>
    <body style="margin:0;padding:0;background:#F5F3F0;font-family:'DM Sans',Helvetica,sans-serif;">
      <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;margin-top:24px;margin-bottom:24px;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        ${HEADER}
        <div style="padding:32px;">
          ${body}
        </div>
        ${FOOTER}
      </div>
    </body>
    </html>
  `;
}

/* ------------------------------------------------------------------ */
/*  Public email functions                                             */
/* ------------------------------------------------------------------ */

/** Notify admin that a new adherent registration is pending approval. */
export async function sendNewAdherentNotification(adherent: {
  name: string;
  email: string;
  company?: string;
}): Promise<{ success: boolean; error?: string }> {
  const { adminEmail } = getConfig();

  return sendEmail({
    to: [{ email: adminEmail, name: "Administrateur GASPE" }],
    subject: `Nouvelle demande d'adhésion — ${adherent.name}`,
    htmlContent: emailWrapper(`
      <h2 style="margin:0 0 16px;color:#222221;font-family:'Exo 2',Helvetica,sans-serif;font-size:20px;">Nouvelle demande d'adhésion</h2>
      <p style="margin:0 0 8px;color:#222221;font-size:15px;">Un nouvel adhérent demande à rejoindre le GASPE :</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;">
        <tr><td style="padding:8px 12px;font-weight:600;color:#6B6560;width:120px;">Nom</td><td style="padding:8px 12px;color:#222221;">${adherent.name}</td></tr>
        <tr style="background:#F5F3F0;"><td style="padding:8px 12px;font-weight:600;color:#6B6560;">Email</td><td style="padding:8px 12px;color:#222221;">${adherent.email}</td></tr>
        ${adherent.company ? `<tr><td style="padding:8px 12px;font-weight:600;color:#6B6560;">Compagnie</td><td style="padding:8px 12px;color:#222221;">${adherent.company}</td></tr>` : ""}
      </table>
      <p style="margin:16px 0 0;">
        <a href="${SITE_URL}/admin/comptes" style="display:inline-block;background:#1B7E8A;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-family:'Exo 2',Helvetica,sans-serif;font-size:14px;">
          Voir les demandes en attente
        </a>
      </p>
    `),
    textContent: `Nouvelle demande d'adhésion de ${adherent.name} (${adherent.email})${adherent.company ? ` — ${adherent.company}` : ""}. Connectez-vous à ${SITE_URL}/admin/comptes pour valider.`,
  });
}

/** Notify an adherent that their account has been approved. */
export async function sendApprovalNotification(adherent: {
  name: string;
  email: string;
}): Promise<{ success: boolean; error?: string }> {
  return sendEmail({
    to: [{ email: adherent.email, name: adherent.name }],
    subject: "Votre compte GASPE a été validé",
    htmlContent: emailWrapper(`
      <h2 style="margin:0 0 16px;color:#222221;font-family:'Exo 2',Helvetica,sans-serif;font-size:20px;">Bienvenue au GASPE !</h2>
      <p style="margin:0 0 12px;color:#222221;font-size:15px;">Bonjour ${adherent.name},</p>
      <p style="margin:0 0 12px;color:#222221;font-size:15px;">Votre demande d'adhésion a été validée par l'administrateur. Vous pouvez désormais accéder à votre espace adhérent.</p>
      <p style="margin:24px 0;">
        <a href="${SITE_URL}/connexion" style="display:inline-block;background:#1B7E8A;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-family:'Exo 2',Helvetica,sans-serif;font-size:14px;">
          Se connecter
        </a>
      </p>
      <p style="margin:0;color:#6B6560;font-size:13px;">Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email.</p>
    `),
    textContent: `Bonjour ${adherent.name}, votre compte GASPE a été validé. Connectez-vous sur ${SITE_URL}/connexion`,
  });
}

/** Notify an adherent that their account has been rejected. */
export async function sendRejectionNotification(adherent: {
  name: string;
  email: string;
}): Promise<{ success: boolean; error?: string }> {
  return sendEmail({
    to: [{ email: adherent.email, name: adherent.name }],
    subject: "Votre demande d'adhésion GASPE",
    htmlContent: emailWrapper(`
      <h2 style="margin:0 0 16px;color:#222221;font-family:'Exo 2',Helvetica,sans-serif;font-size:20px;">Demande d'adhésion non retenue</h2>
      <p style="margin:0 0 12px;color:#222221;font-size:15px;">Bonjour ${adherent.name},</p>
      <p style="margin:0 0 12px;color:#222221;font-size:15px;">Nous avons examiné votre demande d'adhésion au GASPE. Malheureusement, celle-ci n'a pas pu être validée.</p>
      <p style="margin:0 0 12px;color:#222221;font-size:15px;">Pour toute question, n'hésitez pas à nous contacter.</p>
      <p style="margin:24px 0;">
        <a href="${SITE_URL}/contact" style="display:inline-block;background:#1B7E8A;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-family:'Exo 2',Helvetica,sans-serif;font-size:14px;">
          Nous contacter
        </a>
      </p>
    `),
    textContent: `Bonjour ${adherent.name}, votre demande d'adhésion au GASPE n'a pas été retenue. Contactez-nous sur ${SITE_URL}/contact pour plus d'informations.`,
  });
}
