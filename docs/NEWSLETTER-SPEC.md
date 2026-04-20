# GASPE Newsletter — Specification technique et fonctionnelle

**Version** : 1.0 · avril 2026
**Scope** : Système complet de newsletter éditoriale avec templates chartés GASPE, envoi via Brevo API, gestion contacts, désinscriptions, tracking
**Objectif** : Permettre à l'équipe GASPE d'envoyer des newsletters professionnelles chartées sans toucher au code

---

## 1. Vision

### 1.1 Objectifs

- **Autonomie éditoriale** : créer, prévisualiser et envoyer des newsletters sans développeur
- **Identité graphique** : charte GASPE respectée (logo, couleurs, typographie)
- **Fiabilité délivrance** : >98% emails remis en boîte principale
- **Conformité RGPD** : désinscription fonctionnelle, données stockées en UE
- **Analytics minimaux** : taux d'ouverture, clics, désabonnements par envoi

### 1.2 Pourquoi conserver Brevo

| Besoin | Impossible sans fournisseur SMTP | Brevo |
|--------|-----------------------------------|-------|
| SPF/DKIM/DMARC | Infra réseau | ✅ géré |
| IP warming | Réputation 3-6 mois | ✅ IPs chaudes |
| Bounce processing | Protocole SMTP | ✅ API webhooks |
| CF Workers SMTP | Pas de socket TCP arbitraire | API REST Brevo ✅ |
| Volume 10k+/mois | Quota | ✅ plan Business |

**Conclusion** : Brevo reste le **transport** (carton postal), mais **tout le contenu et la charte** sont construits dans notre stack.

---

## 2. Architecture

### 2.1 Vue d'ensemble

```
┌─────────────────────────────────────────────────────────┐
│ Admin UI : /admin/newsletter                            │
│  ├─ Éditeur blocs (drag-drop)                           │
│  ├─ Aperçu desktop + mobile                             │
│  ├─ Test envoi                                          │
│  └─ Programmation                                       │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│ Worker API : /api/newsletter/*                          │
│  ├─ POST /drafts       → sauvegarde brouillon           │
│  ├─ POST /preview      → génère HTML                     │
│  ├─ POST /test-send    → envoi test (1 destinataire)    │
│  ├─ POST /send         → envoi production               │
│  └─ POST /brevo/webhook → ingestion events              │
└─────────────────────────────────────────────────────────┘
                          │
              ┌───────────┴────────────┐
              ▼                        ▼
┌──────────────────────┐     ┌──────────────────────────┐
│ D1 Tables            │     │ Brevo API                │
│  ├─ nl_drafts        │     │  ├─ POST /smtp/email     │
│  ├─ nl_sends         │     │  ├─ POST /contacts       │
│  ├─ nl_events        │     │  ├─ GET /lists           │
│  └─ nl_templates     │     │  └─ Webhook ingest       │
└──────────────────────┘     └──────────────────────────┘
```

### 2.2 Migration D1 (0008_newsletter.sql)

```sql
-- Brouillons de newsletters
CREATE TABLE nl_drafts (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  subject TEXT NOT NULL,
  preheader TEXT,
  blocks_json TEXT NOT NULL,  -- array de blocs [{type, content}]
  status TEXT NOT NULL DEFAULT 'draft',  -- draft | sent | archived
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Envois réalisés (historique)
CREATE TABLE nl_sends (
  id TEXT PRIMARY KEY,
  draft_id TEXT NOT NULL,
  category TEXT NOT NULL,      -- info_generales | ag | emploi | ...
  subject TEXT NOT NULL,
  html TEXT NOT NULL,           -- HTML final rendu
  recipients_count INTEGER NOT NULL DEFAULT 0,
  sent_at TEXT NOT NULL DEFAULT (datetime('now')),
  sent_by TEXT NOT NULL,
  FOREIGN KEY (draft_id) REFERENCES nl_drafts(id),
  FOREIGN KEY (sent_by) REFERENCES users(id)
);

-- Events Brevo (ouvertures, clics, bounces, désabonnements)
CREATE TABLE nl_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  send_id TEXT NOT NULL,
  email TEXT NOT NULL,
  event_type TEXT NOT NULL,    -- delivered | opened | clicked | bounced | unsubscribed | complaint
  event_at TEXT NOT NULL,
  payload_json TEXT,
  FOREIGN KEY (send_id) REFERENCES nl_sends(id)
);
CREATE INDEX idx_nl_events_send ON nl_events(send_id);
CREATE INDEX idx_nl_events_email ON nl_events(email);

-- Templates préenregistrés (pas v1)
CREATE TABLE nl_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  blocks_json TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

### 2.3 Modèle de données — Blocs newsletter

Un brouillon est une liste ordonnée de **blocs**. Chaque bloc a un `type` et des `content` :

```typescript
type NewsletterBlock =
  | { type: "header"; logoVariant: "white" | "color"; subtitle?: string }
  | { type: "heading"; text: string; level: 1 | 2 | 3; align: "left" | "center" }
  | { type: "paragraph"; html: string }
  | { type: "image"; url: string; alt: string; width: "full" | "half"; link?: string }
  | { type: "button"; label: string; url: string; color: "teal" | "neutral" }
  | { type: "divider"; style: "solid" | "dashed" | "gradient" }
  | { type: "columns"; items: { html: string; image?: string }[] }  // max 2 col
  | { type: "spacer"; height: number }
  | { type: "footer"; showUnsub: boolean; showContactAddress: boolean };
```

### 2.4 Rendu HTML

Les blocs sont convertis en HTML email par `src/lib/newsletter/render.ts` :
- Tables-based layout (compatibilité Outlook)
- Inline CSS (via Juice ou manuel)
- Variables GASPE : `{{firstname}}`, `{{unsubscribe_url}}`, `{{webversion_url}}`
- Charte graphique : logo SVG encodé, couleurs teal `#1B7E8A`, fonts web-safe (Arial/Helvetica) + fallback Exo 2

**Exemple de header rendu** :
```html
<table role="presentation" width="100%" style="background:linear-gradient(135deg,#1B7E8A 0%,#6DAAAC 100%);">
  <tr>
    <td align="center" style="padding:32px 24px;">
      <img src="https://cdn.gaspe.fr/logo-white.png" alt="GASPE" width="120" style="display:block;">
      <p style="color:rgba(255,255,255,0.8);font-family:Arial,sans-serif;font-size:12px;margin:12px 0 0;">
        Localement ancrés. Socialement engagés.
      </p>
    </td>
  </tr>
</table>
```

---

## 3. Interface admin

### 3.1 `/admin/newsletter` — Liste

- Table des brouillons (titre, sujet, dernière modif, statut)
- Bouton "Nouveau brouillon" → sélecteur template ou vierge
- Historique des envois (avec stats : ouvertures, clics)

### 3.2 `/admin/newsletter/:id/edit` — Éditeur

**Layout 3 colonnes** :

```
┌──────────┬────────────────────┬──────────────┐
│ Blocs    │ Zone édition       │ Aperçu live  │
│ (drag)   │ (blocs actuels)    │ (iframe)     │
│          │                    │              │
│ + Header │ ┌──────────────┐   │ [Desktop]    │
│ + Heading│ │ Header GASPE │   │ [Mobile]     │
│ + Para   │ └──────────────┘   │              │
│ + Image  │ ┌──────────────┐   │ ┌──────────┐ │
│ + Button │ │ Heading      │   │ │ (email)  │ │
│ + Colum  │ └──────────────┘   │ │          │ │
│ + Divid  │ ┌──────────────┐   │ │          │ │
│ + Footer │ │ Paragraph    │   │ └──────────┘ │
│          │ └──────────────┘   │              │
└──────────┴────────────────────┴──────────────┘
```

**Fonctionnalités** :
- Drag & drop pour ajouter/réorganiser les blocs
- Clic sur un bloc → panel édition à droite (remplace l'aperçu)
- Aperçu live (regen 500ms après édition)
- Boutons : **Sauvegarder**, **Tester** (envoi à soi), **Envoyer** (production)

### 3.3 Paramètres d'envoi

Modal avant envoi final :

| Champ | Type | Valeurs |
|-------|------|---------|
| Catégorie ciblée | Select | Les 10 catégories newsletter |
| Expéditeur | Select | GASPE, Admin GASPE, Custom |
| Nom expéditeur | Text | "GASPE - Groupement des Armateurs" |
| Email reply-to | Email | contact@gaspe.fr |
| Sujet | Text | 50 char max |
| Preheader | Text | 100 char max (texte d'aperçu) |
| Envoi immédiat / programmé | Radio | Now / Date |
| Estimation destinataires | Readonly | `SELECT COUNT(*) FROM users...` |

### 3.4 Charte graphique configurable

Section dédiée `/admin/newsletter/charte` :

| Paramètre | Type | Défaut |
|-----------|------|--------|
| Logo URL | image | `/assets/logo-white.png` |
| Logo variant | select | Blanc sur gradient / Couleur sur blanc |
| Couleur primaire | color | `#1B7E8A` |
| Couleur accent | color | `#6DAAAC` |
| Footer signature | richtext | "© GASPE 2026..." |
| Adresse postale (RGPD) | richtext | "Maison de la Mer..." |
| Liens réseaux sociaux | list | LinkedIn URL |

Stockées dans D1 via CMS (page_id = "newsletter-charte").

---

## 4. Flux d'envoi

### 4.1 Test send (envoi à un destinataire)

```
POST /api/newsletter/:draftId/test-send
  body: { email: "test@gaspe.fr" }
  auth: JWT admin

  ├─ render(blocks) → HTML
  ├─ Brevo API: POST /smtp/email
  │    { to: [{email}], subject, htmlContent, sender: {...} }
  ├─ Log: nl_events (type=test_send)
  └─ Return: { success, brevoMessageId }
```

### 4.2 Production send

```
POST /api/newsletter/:draftId/send
  body: { category, sender, subjectLine, preheader }
  auth: JWT admin

  ├─ Validate draft + auth
  ├─ Query D1: users + preferences WHERE category=1 AND archived=0
  ├─ Batch recipients by 50 (Brevo limit)
  ├─ For each batch:
  │   ├─ Personalize HTML per recipient (firstname, unsub token)
  │   ├─ Brevo API: POST /smtp/email (batch messageVersions)
  │   └─ Log each send in nl_events
  ├─ Insert nl_sends row
  ├─ Mark draft as 'sent'
  └─ Return: { sendId, recipientsCount }
```

### 4.3 Désinscription

URL envoyée dans chaque email : `https://gaspe.fr/newsletter/unsubscribe?token=<jwt>`

Le token JWT encode : `{ email, category, issuedAt, expiresAt }`

Page publique `/newsletter/unsubscribe` :
- Valide le token
- Affiche : "Vous allez vous désabonner de [catégorie]"
- Bouton confirmer → `POST /api/newsletter/unsubscribe`
  - Update `newsletter_preferences` SET [category]=0 WHERE user_id=...
  - Sync avec Brevo (retire de la liste)
- Confirmation : "Vous êtes désabonné. Merci de votre écoute."
- Lien : "Gérer toutes mes préférences" → redirige espace adhérent/candidat

### 4.4 Webhooks Brevo

Endpoint : `POST /api/newsletter/brevo/webhook`

Brevo notifie les events : `delivered`, `opened`, `click`, `bounce`, `unsubscribed`, `complaint`, `blocked`.

Payload traité :
```json
{
  "event": "opened",
  "email": "user@example.com",
  "date": "2026-04-18T14:32:00Z",
  "message-id": "abc123",
  "tag": "nl_send_<id>"
}
```

Handler :
1. Parse tag → retrouve `send_id`
2. INSERT dans `nl_events`
3. Si `bounce` ou `complaint` → flag user (`newsletter_blocked=1`)
4. Si `unsubscribed` → update `newsletter_preferences` (toutes catégories)

---

## 5. Synchronisation contacts Brevo

### 5.1 Inscription newsletter publique (actuellement cassée)

**Problème actuel** : les emails inscrits via `/api/newsletter` sont stockés en D1 mais **pas remontés vers Brevo**.

**Fix** :
```typescript
async function handleNewsletterSubscribe(email: string, env: Env) {
  // 1. Insert en D1 (existant)
  await env.DB.prepare("INSERT INTO newsletter ...").run();

  // 2. NEW : sync Brevo
  await fetch("https://api.brevo.com/v3/contacts", {
    method: "POST",
    headers: {
      "api-key": env.BREVO_API_KEY,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      email,
      listIds: [PUBLIC_LIST_ID],  // liste Brevo "Newsletter publique"
      attributes: { SOURCE: "public-form" },
    }),
  });
}
```

### 5.2 Mise à jour des préférences

Quand un user modifie ses préférences dans `/espace-adherent/preferences` ou `/espace-candidat/preferences` :
1. Update D1 `newsletter_preferences`
2. Update Brevo contact attributes : `{ NL_EMPLOI: 1, NL_FORMATION: 0, ... }`
3. Update Brevo lists : ajoute/retire de chaque liste catégorie

### 5.3 Listes Brevo à créer

Dans le dashboard Brevo, créer 10 listes alignées sur les catégories D1 :
- `GASPE - Informations Générales`
- `GASPE - AG`
- `GASPE - Emploi`
- `GASPE - Formation & OPCO`
- `GASPE - Veille Juridique ADF`
- `GASPE - Veille Sociale ADF`
- `GASPE - Veille Sûreté ADF`
- `GASPE - Veille Data ADF`
- `GASPE - Veille Environnement ADF`
- `GASPE - Actualités GASPE`

Mapper les IDs Brevo dans `workers/wrangler.toml` :
```toml
[vars]
BREVO_LIST_PUBLIC = "1"
BREVO_LIST_INFO_GENERALES = "2"
BREVO_LIST_EMPLOI = "3"
# ...
```

---

## 6. Statistiques et reporting

### 6.1 Dashboard `/admin/newsletter/:sendId/stats`

Affichage des métriques d'un envoi :
- Destinataires, délivrés, ouverts, cliqués, désinscrits, bounces
- Taux : délivrabilité, ouverture, clic, désabonnement
- Top 5 liens cliqués
- Heatmap des heures d'ouverture (optionnel)
- Graphique temporel (nouveau jour = nouvelle barre)

Queries SQL :
```sql
SELECT
  COUNT(CASE WHEN event_type = 'delivered' THEN 1 END) AS delivered,
  COUNT(CASE WHEN event_type = 'opened' THEN 1 END) AS opened,
  COUNT(CASE WHEN event_type = 'click' THEN 1 END) AS clicked,
  COUNT(CASE WHEN event_type = 'bounce' THEN 1 END) AS bounced,
  COUNT(CASE WHEN event_type = 'unsubscribed' THEN 1 END) AS unsubs
FROM nl_events
WHERE send_id = ?;
```

### 6.2 Export CSV

Bouton "Exporter" → télécharge CSV : `email, event_type, event_at, ...`

---

## 7. Sécurité & RGPD

### 7.1 Données stockées

- **D1 `nl_events`** : email + event_type + timestamp (→ données personnelles RGPD)
- **D1 `nl_sends`** : HTML final envoyé (archivage)
- **Brevo** : gère les contacts dans l'UE (Francfort) — compatibilité RGPD

### 7.2 Conservation

- `nl_events` : 2 ans (purge auto via cron CF Worker)
- `nl_sends` : 5 ans (archivage légal)
- `nl_drafts` : illimité (workspace admin)

### 7.3 Droit à l'oubli

Endpoint `DELETE /api/auth/users/:id` doit :
1. Supprimer l'user de D1
2. Anonymiser ses events : UPDATE `nl_events` SET email = 'anonymized' WHERE email = ?
3. Retirer de toutes les listes Brevo

### 7.4 Authentification admin

- JWT avec `role=admin` vérifié à chaque endpoint
- Audit log dans D1 : `admin_audit` (user_id, action, target, timestamp)

---

## 8. Roadmap d'implémentation

### Phase 1 : Foundation (3h) — ✅ **DONE (session 26)**
- [x] Migration `workers/migrations/0008_newsletter.sql` (nl_drafts, nl_sends, nl_events, nl_templates)
- [x] Renderer HTML charté GASPE (`src/lib/newsletter/render.ts`, table-based, inline CSS, Outlook-safe)
- [x] 9 types de blocs : header, heading, paragraph, image, button, divider, columns, spacer, footer
- [x] HTML sanitization (strip script/style/iframe, on* handlers, javascript: URLs)
- [x] Variables `{{firstname}}` / `{{unsubscribe_url}}` / `{{webversion_url}}`
- [x] Endpoints Worker drafts : `GET/POST /api/newsletter/drafts`, `GET/PUT/DELETE /api/newsletter/drafts/:id` (JWT+admin)
- [x] Store dual-mode `src/lib/newsletter/drafts-store.ts` (localStorage ↔ D1)
- [x] 12 tests renderer dans `src/lib/__tests__/newsletter-render.test.ts`

### Phase 2 : Éditeur admin (5h) — ✅ **DONE (session 26)**
- [x] Page `/admin/newsletter/drafts` (liste + CRUD brouillons)
- [x] Page `/admin/newsletter/edit?id=…` (éditeur 3 colonnes + aperçu live)
- [x] Composant `NewsletterBlockEditor` : add/reorder/remove/edit par type
- [x] Aperçu iframe live desktop/mobile
- [x] Sélecteur variables (`{{firstname}}`, etc.)

### Phase 3 : Envoi production (3h) — ⏸ bloqué par config Brevo
- [ ] Endpoint `POST /api/newsletter/:id/test-send`
- [ ] Endpoint `POST /api/newsletter/:id/send`
- [ ] Personnalisation par destinataire
- [ ] Batch 50 avec rate limiting
- [ ] Page `/admin/newsletter/:id/confirm-send` (modal récap)

### Phase 4 : Tracking & reporting (2h)
- [ ] Endpoint `POST /api/newsletter/brevo/webhook`
- [ ] Configuration webhook dans Brevo dashboard
- [ ] Page `/admin/newsletter/:sendId/stats` (dashboard)
- [ ] Export CSV

### Phase 5 : Sync contacts Brevo (2h) — partiellement done session 29-30
- [ ] Création 11 listes Brevo dans le dashboard + configuration des env vars (`BREVO_LIST_INFO_GENERALES`, `BREVO_LIST_AG`, `BREVO_LIST_EMPLOI`, `BREVO_LIST_FORMATION_OPCO`, `BREVO_LIST_VEILLE_JURIDIQUE`, `BREVO_LIST_VEILLE_SOCIALE`, `BREVO_LIST_VEILLE_SURETE`, `BREVO_LIST_VEILLE_DATA`, `BREVO_LIST_VEILLE_ENVIRONNEMENT`, `BREVO_LIST_ACTUALITES_GASPE`, `BREVO_LIST_PUBLIC`) via `wrangler secret put`
- [x] **Sync inscription publique** (`POST /api/newsletter`) → Brevo liste `BREVO_LIST_PUBLIC` avec attribut `SOURCE=public-form` (session 30, `syncBrevoPublicContact`). Silencieux si `BREVO_API_KEY` ou `BREVO_LIST_PUBLIC` absent.
- [x] **Sync préférences** → Brevo contact + attributs PRENOM/NOM (session 29, `syncBrevoContact` dans `workers/api.ts`). Silencieux si list IDs non configurés. Met à jour `users.brevo_synced_at`.
- [x] Colonnes canonicalisées DB ↔ frontend ↔ Brevo (session 29) : `info_generales, ag, emploi, formation_opco, veille_juridique, veille_sociale, veille_surete, veille_data, veille_environnement, actualites_gaspe`
- [x] Dashboard `/admin/newsletter/abonnes` affiche statut sync par user (synced / out-of-sync / pending) avec export CSV (session 29)
- [x] **Sync désinscription publique** (`POST /api/newsletter/unsubscribe`) → Brevo + D1 (session 30) : `handleNewsletterUnsubscribe` appelle `syncBrevoContact` pour les users authentifiés (re-sync complet avec prefs mis à jour) et `unlinkBrevoPublicContact` pour les emails legacy (retire de `BREVO_LIST_PUBLIC`).

### Phase 6 : Désinscription publique (1h) — ✅ done session 28 + 30
- [x] Page `/newsletter/unsubscribe?token=` (session 28)
- [x] Endpoint `POST /api/newsletter/unsubscribe` (session 28)
- [x] Sync Brevo côté worker (session 30) : `syncBrevoContact` si user, `unlinkBrevoPublicContact` si legacy
- [ ] Email template mise à jour (footer avec lien unsub tokenisé) — lien déjà envoyé, template charte configurable déjà géré phase 7

### Phase 7 : Charte configurable (1h) — ✅ done session 28
- [x] Page `/admin/newsletter/charte` (CMS dédié)
- [x] Storage D1 via `cms_pages` (page_id = "newsletter-charte")
- [x] Injection des variables dans le renderer HTML

### Phase 8 : UX polish (2h)
- [ ] Templates pré-configurés ("Newsletter mensuelle", "Bulletin d'information", etc.)
- [ ] Historique des versions d'un brouillon
- [ ] Compactage d'images à l'upload
- [ ] Vérification antispam (score SpamAssassin ou équivalent)

**Total estimé : ~19h**

---

## 9. Limites connues (v1)

- Pas de **A/B testing** (possible en v2 via Brevo A/B)
- Pas de **segmentation dynamique** fine (filtres simples sur les 10 catégories uniquement)
- Pas de **workflows automatisés** (welcome series, anniversaires) — possible en v2 via Brevo Automations
- Pas d'**éditeur visuel drag-drop WYSIWYG riche** (pas de Tiptap dans un email) — blocs préconfigurés uniquement
- **Un seul expéditeur par défaut** (GASPE) — possibilité de choisir manuellement dans le modal d'envoi

---

## 10. Variables d'environnement requises

```toml
# workers/wrangler.toml (ou via `wrangler secret put` pour les secrets)
[vars]
BREVO_SENDER_NAME = "GASPE"
BREVO_SENDER_EMAIL = "contact@gaspe.fr"
BREVO_REPLY_TO = "contact@gaspe.fr"

# 10 list IDs Brevo (alignés sur les colonnes newsletter_preferences migration 0003)
BREVO_LIST_INFO_GENERALES = "2"
BREVO_LIST_AG = "3"
BREVO_LIST_EMPLOI = "4"
BREVO_LIST_FORMATION_OPCO = "5"
BREVO_LIST_VEILLE_JURIDIQUE = "6"
BREVO_LIST_VEILLE_SOCIALE = "7"
BREVO_LIST_VEILLE_SURETE = "8"
BREVO_LIST_VEILLE_DATA = "9"
BREVO_LIST_VEILLE_ENVIRONNEMENT = "10"
BREVO_LIST_ACTUALITES_GASPE = "11"
BREVO_LIST_PUBLIC = "12"           # liste "Newsletter publique" (footer / form contact)

# Secrets (wrangler secret put)
BREVO_API_KEY = "xkeysib-..."       # déjà configuré
BREVO_WEBHOOK_SECRET = "..."        # NOUVEAU, à générer (HMAC-SHA256 Brevo webhook)
NEWSLETTER_UNSUB_SECRET = "..."     # NOUVEAU, pour signer les tokens désinscription
```

**Commandes pour provisionner en production** :
```bash
# Secrets (non visibles ensuite)
wrangler secret put BREVO_WEBHOOK_SECRET --name gaspe-api
wrangler secret put NEWSLETTER_UNSUB_SECRET --name gaspe-api

# Variables (visibles — les list IDs ne sont pas sensibles)
wrangler secret put BREVO_LIST_INFO_GENERALES --name gaspe-api
wrangler secret put BREVO_LIST_AG --name gaspe-api
wrangler secret put BREVO_LIST_EMPLOI --name gaspe-api
wrangler secret put BREVO_LIST_FORMATION_OPCO --name gaspe-api
wrangler secret put BREVO_LIST_VEILLE_JURIDIQUE --name gaspe-api
wrangler secret put BREVO_LIST_VEILLE_SOCIALE --name gaspe-api
wrangler secret put BREVO_LIST_VEILLE_SURETE --name gaspe-api
wrangler secret put BREVO_LIST_VEILLE_DATA --name gaspe-api
wrangler secret put BREVO_LIST_VEILLE_ENVIRONNEMENT --name gaspe-api
wrangler secret put BREVO_LIST_ACTUALITES_GASPE --name gaspe-api
wrangler secret put BREVO_LIST_PUBLIC --name gaspe-api          # NOUVEAU session 30
wrangler secret put BREVO_SENDER_EMAIL --name gaspe-api
wrangler secret put BREVO_SENDER_NAME --name gaspe-api
wrangler secret put BREVO_REPLY_TO --name gaspe-api
```

**Configuration du webhook Brevo** (dashboard Brevo → Transactional → Webhooks) :
- URL : `https://gaspe-api.hello-0d0.workers.dev/api/newsletter/brevo/webhook`
- Méthode : `POST`
- Events : `delivered`, `opened`, `clicked`, `hard_bounce`, `soft_bounce`, `unsubscribed`, `spam`
- Signature : HMAC-SHA256 du body avec `BREVO_WEBHOOK_SECRET`

---

## 11. Estimation volume / coût Brevo

- **Destinataires actuels** : ~500 adhérents + ~200 candidats = **700 contacts**
- **Fréquence** : 1 newsletter/mois par catégorie × 10 catégories × 700 = **7000 envois/mois max**
- **Plan Brevo** :
  - Free : 300 emails/jour → **insuffisant**
  - Lite (19€/mois) : 20k emails/mois → **suffisant v1**
  - Business (49€/mois) : 100k emails/mois + automations + A/B → **v2**

Vérifier le plan actuel du compte GASPE.
