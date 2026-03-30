/* ------------------------------------------------------------------ */
/*  Brevo (ex-Sendinblue) transactional email service                  */
/*  Uses Brevo SMTP API v3 — called client-side in demo mode,          */
/*  or via CF Worker proxy in production.                               */
/* ------------------------------------------------------------------ */

const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

function getConfig() {
  const apiKey = process.env.NEXT_PUBLIC_BREVO_API_KEY ?? "";
  const senderEmail = process.env.NEXT_PUBLIC_BREVO_SENDER_EMAIL ?? "ne-pas-repondre@gaspe.fr";
  const senderName = process.env.NEXT_PUBLIC_BREVO_SENDER_NAME ?? "GASPE";
  const adminEmail = process.env.NEXT_PUBLIC_BREVO_ADMIN_EMAIL ?? "admin@gaspe.fr";
  return { apiKey, senderEmail, senderName, adminEmail };
}

interface SendEmailParams {
  to: { email: string; name?: string }[];
  subject: string;
  htmlContent: string;
  textContent?: string;
}

async function sendEmail(params: SendEmailParams): Promise<{ success: boolean; error?: string }> {
  const { apiKey, senderEmail, senderName } = getConfig();

  if (!apiKey) {
    console.warn("[Brevo] Pas de clé API configurée — email non envoyé");
    return { success: false, error: "Clé API Brevo non configurée" };
  }

  try {
    const res = await fetch(BREVO_API_URL, {
      method: "POST",
      headers: {
        "accept": "application/json",
        "content-type": "application/json",
        "api-key": apiKey,
      },
      body: JSON.stringify({
        sender: { name: senderName, email: senderEmail },
        to: params.to,
        subject: params.subject,
        htmlContent: params.htmlContent,
        textContent: params.textContent,
      }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      const msg = (body as { message?: string }).message ?? `HTTP ${res.status}`;
      console.error("[Brevo] Erreur envoi email:", msg);
      return { success: false, error: msg };
    }

    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erreur inconnue";
    console.error("[Brevo] Erreur réseau:", msg);
    return { success: false, error: msg };
  }
}

/* ------------------------------------------------------------------ */
/*  Email templates                                                    */
/* ------------------------------------------------------------------ */

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.gaspe.fr";

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
