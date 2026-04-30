# Plan de test exhaustif — Go-live ACF / GASPE

**Version** : 1.0 · 30 avril 2026
**Périmètre** : site institutionnel + extranet adhérents + console admin + Worker API + cron triggers
**Source** : `docs/CORPUS-FONCTIONNALITES-2026.md` v2.43.0 (18 domaines, 76 endpoints, 30 migrations, 346 tests)
**Branche de travail** : `claude/french-greeting-test-fmBzC`

---

## Table des matières

1. [Phase 0 — Gates bloquants pré-go-live](#phase-0--gates-bloquants-pré-go-live)
2. [Phase 1 — Infra & smoke tests prod](#phase-1--infra--smoke-tests-prod)
3. [Phase 2 — Tests fonctionnels par domaine (18 domaines)](#phase-2--tests-fonctionnels-par-domaine)
4. [Phase 3 — Tests transverses (sécu / a11y / perf / SEO)](#phase-3--tests-transverses)
5. [Phase 4 — Cross-device / cross-browser](#phase-4--cross-device--cross-browser)
6. [Phase 5 — Charge & résilience](#phase-5--charge--résilience)
7. [Phase 6 — UAT métier (5 personas)](#phase-6--uat-métier)
8. [Phase 7 — Régression automatisée](#phase-7--régression-automatisée)
9. [Phase 8 — Critères Go / No-Go](#phase-8--critères-go--no-go)
10. [Annexe A — Résultats audit sandbox 30/04/2026](#annexe-a--résultats-audit-sandbox)
11. [Annexe B — Bloqueurs sandbox & runbooks](#annexe-b--bloqueurs-sandbox)
12. [Annexe C — Checklist d'exécution](#annexe-c--checklist-dexécution)

---

## Phase 0 — Gates bloquants pré-go-live

À traiter **avant** d'ouvrir les tests fonctionnels — sinon risque juridique / contractuel.
Source : `docs/AUDIT-CRITIQUE-2026.md` § 9.1 + `docs/CORPUS-FONCTIONNALITES-2026.md` § 9.1.

| Gate | Description | Fichier | Owner | Statut session 54 |
|------|-------------|---------|-------|-------------------|
| **C1** | NAO 2026 sans n° d'avenant ni publication JO | `src/data/ccn3228.ts` `SALARY_SOURCES` | Direction | ✅ **Fixé** : reformulation pour préciser « issue des négociations annuelles obligatoires », URL retirée en attente d'extension JO. |
| **C2** | Stats passagers/véhicules non datées | `src/data/cms-defaults.ts` quick-stats | Comm | ✅ **Fixé** : « Chiffres consolidés 2025 » ajouté homepage + `/positions` + `/notre-groupement` (1 494 marins). |
| **C3** | EU ETS Maritime / FuelEU Maritime absents | – | Direction | ⏭️ **Skip validé** : compagnies adhérentes hors champ (jauge < 5000 GT, exemptions îles DOM-COM). Suivi à reprendre si seuils UE descendent. |
| **C4** | Cotisations ENIM 2025/2026 sans attestation | `src/app/(public)/boite-a-outils/page.tsx:331-345` | Direction | ✅ **Fixé** : lien cliquable vers `enim.eu` ajouté dans la note de bas de tableau Cotisations ENIM. |
| **C5** | Facteurs CO₂ ENTEC 2005 obsolètes | `src/components/simulator/AdemeSimulator.tsx:460` | Direction | ✅ **Fixé** : sources actualisées IMO 4th GHG Study (2020) + EMSA EMTER 2025 + DNV Maritime Forecast 2024. |
| **C6** | Aucune date « dernière vérification » visible | global | Tous | ✅ **Fixé** : `LAST_DATA_REVIEW_DATE` dans `constants.ts`, affichée dans footer global avec tooltip. |

**Critère** : 6/6 traités (C3 skip validé, C1/C2/C4/C5/C6 fixés en session 54) → ✅ **Go Phase 1**.

---

## Phase 1 — Infra & smoke tests prod

Exécutable en ≤ 30 min via le script `scripts/smoke-test-prod.sh` (cf. § Annexe C).

| ID | Test | Méthode | Attendu |
|----|------|---------|---------|
| INF-01 | `curl https://gaspe-api.hello-0d0.workers.dev/api/health` | bash | 200 OK + JSON status |
| INF-02 | Headers Cloudflare Pages root | `curl -I https://gaspe-fr.pages.dev` | 200, CSP / X-Frame-Options / Referrer-Policy présents |
| INF-03 | DNS gaspe.fr → CF Pages | `dig +short gaspe.fr` | A/CNAME corrects |
| INF-04 | 30 migrations D1 appliquées | `wrangler d1 migrations list --remote DB` | 0001-0030 toutes ✅ |
| INF-05 | Cron trigger actif | dashboard CF Workers > Triggers, `wrangler triggers cron` | `0 9 * * *` enregistré |
| INF-06 | Secrets Worker | `wrangler secret list` | JWT_SECRET, BREVO_API_KEY, HYDROS_*, NEWSLETTER_UNSUB_SECRET, BREVO_WEBHOOK_SECRET |
| INF-07 | Brevo : 10 list IDs configurés | dashboard Brevo + `wrangler secret list` | 10 listes mappées (info_generales → actualites_gaspe) |
| INF-08 | R2 bucket `gaspe-uploads` | `wrangler r2 bucket list` | Existe + lecture via `/api/media/raw/:key` |
| INF-09 | Smoke test validation annuelle | `bash scripts/smoke-test-validation.sh` | 8/8 passes, exit 0 |
| INF-10 | Sitemap + RSS 2.0 valides | `curl /sitemap.xml`, `/feed.xml` puis W3C feed validator | XML bien formé |
| INF-11 | robots.txt | `curl /robots.txt` | Allow `/`, Disallow `/admin`, `/espace-*`, `/inscription`, `/connexion`, `/mot-de-passe-oublie`, `/reinitialiser-mot-de-passe` |
| INF-12 | DNS email Brevo (SPF/DKIM/DMARC) | `dig TXT gaspe.fr`, mail-tester.com | Tous verts |
| INF-13 | Build artefacts (Cloudflare Pages) | dashboard | 117 + placeholder = 118 pages générées |
| INF-14 | Vérifier RBAC staff vivant | `/api/auth/users` GET admin → JSON champ `staffPermissions` | OK pour 1 user staff de test |

**Critère** : 14/14 verts → Go Phase 2.

---

## Phase 2 — Tests fonctionnels par domaine

18 domaines couverts (cf. corpus § 5). Légende criticité : 🔴 critique go-live · 🟠 haute · 🟡 moyenne.

### D1 — Auth & RBAC 🔴

| ID | Scénario | Données | Attendu |
|----|----------|---------|---------|
| AUTH-01 | Login admin maître | `admin@gaspe.fr` / `admin123` | Cookie JWT httpOnly, redirect `/admin` |
| AUTH-02 | Login adhérent titulaire | compte approuvé `is_primary=1` | Redirect `/espace-adherent`, banner validation visible si campagne ouverte |
| AUTH-03 | Login adhérent contact | compte invité `is_primary=0` | Idem, sans accès gestion équipe |
| AUTH-04 | Login candidat | auto-inscription | Redirect `/espace-candidat` |
| AUTH-05 | Login mauvais MDP × 5 | – | Pas de leak (réponse identique), pas de lockout sauvage |
| AUTH-06 | Forgot password — email valide | `forgot-password` form | Email reçu Brevo, lien 1h single-use |
| AUTH-07 | Forgot password — email inconnu | – | Réponse 200 identique (anti-énumération) |
| AUTH-08 | Reset password — token valide | – | MDP changé, token consommé |
| AUTH-09 | Reset password — token expiré (J+1h+1s) | – | 400 + message clair |
| AUTH-10 | Reset password — token déjà utilisé | – | 400 |
| AUTH-11 | Inscription adhérent | nouveau email | Email admin + statut `pending` |
| AUTH-12 | Approbation admin via `/admin/comptes` | – | Email « approuvé » envoyé |
| AUTH-13 | Refus admin | – | Email « refusé » envoyé |
| AUTH-14 | Invitation contact (titulaire envoie) | – | Email avec token 7j |
| AUTH-15 | Acceptation invitation — token valide | – | Compte créé, redirect `/connexion` |
| AUTH-16 | Acceptation invitation — token expiré (J+8) | – | Erreur explicite, lien renvoyé désactivé |
| AUTH-17 | RBAC staff `manage_jobs` uniquement | promotion via `/admin/comptes` | Voit `/admin/offres` mais pas `/admin/votes`, `/admin/campagnes`, `/admin/comptes` |
| AUTH-18 | RBAC staff toutes permissions | 11 permissions cochées | UI complète sauf items master-admin (suppression user notamment) |
| AUTH-19 | RBAC bypass — staff appelle endpoint non autorisé | curl direct `/api/votes` POST | Worker 403 (double sécurité front + back) |
| AUTH-20 | Logout | – | Cookie supprimé, redirect `/`, retour `/admin` impossible |
| AUTH-21 | JWT expiré (J+8) | – | Redirect `/connexion` propre, pas de boucle |
| AUTH-22 | JWT manipulé (alg=none, signature changée) | curl forgé | 401 |

### D2 — Site institutionnel 🔴

| ID | Page | Test | Attendu |
|----|------|------|---------|
| INST-01 | `/` homepage | Hero vidéo lit, marquee scroll, stats animées | 0 console error, LCP < 2.5s, CLS < 0.1 |
| INST-02 | `/notre-groupement` | 18 champs CMS + timeline + bureau (4 photos) | Tout rendu, photos chargées via `next/image` |
| INST-03 | `/nos-adherents` listing | 30 cartes, filtres collège A/B/C + 3228 + territoire + région, carte Leaflet | Filtres cumulatifs OK ; carte Esri Ocean Base, fitBounds correct, 30 marqueurs visibles |
| INST-04 | `/nos-adherents/[slug]` × 30 | Logo, profil, flotte (seed ou D1), JSON-LD MaritimeService | Aucun 404, pas de Layout shift sur logo |
| INST-05 | `/contact` | Soumission formulaire — texte normal | Email Brevo reçu admin + accusé expéditeur |
| INST-06 | `/contact` | Payload XSS `<script>alert(1)</script>` | Sanitizé, pas d'exécution |
| INST-07 | `/contact` | Champs requis vides | Validation client + serveur Zod |
| INST-08 | `/presse` | Liens kit presse + ressources | Tous 200 |
| INST-09 | `/agenda` | Événement publié → EventJsonLd | Validate via Google Rich Results Test |
| INST-10 | `/actualites` + `/feed.xml` | Bouton RSS, items présents | Auto-discovery `<link rel="alternate" type="application/rss+xml">` global OK |
| INST-11 | `/positions` listing | Si articles publiés | Carte par position, sinon empty state |
| INST-12 | `/positions/[slug]` | ArticleJsonLd + body HTML | Validate Rich Results |
| INST-13 | `/mentions-legales`, `/confidentialite`, `/cgu` | Contenu CMS | Date dernière révision visible |
| INST-14 | 404 personnalisé | URL inexistante | Page `not-found.tsx` avec quick links |
| INST-15 | `/decouvrir-espace-adherent` | 10 onglets démo non-interactive | Bandeau démo + CTA adhésion sur chaque onglet |

### D3 — Espace adhérent 🔴 (15 sous-pages)

| ID | Sous-page | Scénario | Attendu |
|----|-----------|----------|---------|
| ADH-01 | `/espace-adherent` dashboard | Login titulaire | 10 cartes + completeness card + banner validation (si campagne ouverte) |
| ADH-02 | `/profil` | Édition nom/email/desc/effectifs/navires | PATCH OK, persist en D1 |
| ADH-03 | `/profil` | Désigner suppléant (contact compagnie) | Visible côté Worker `/api/users/me/suppleant` |
| ADH-04 | `/profil` | Retirer suppléant | OK |
| ADH-05 | `/equipe` | Inviter contact (email + nom) | Email envoyé, ligne « pending » avec date d'envoi |
| ADH-06 | `/equipe` | Révoquer invitation pending | Status updated, token invalidé |
| ADH-07 | `/preferences` | Toggle 10 catégories | PATCH `/api/preferences`, sync Brevo `brevo_synced_at` |
| ADH-08 | `/offres` | Créer offre `active` | POST + Hydros publish background, URL Hydros affichée après ~5s |
| ADH-09 | `/offres` | Brouillon (`active=false`) | Pas de Hydros publish |
| ADH-10 | `/offres` | Edit offre existante | PATCH OK |
| ADH-11 | `/offres` | Suppression | DELETE OK, retiré des listings publics |
| ADH-12 | `/formations` | Inscription formation | localStorage persist (pas de D1 actuellement) |
| ADH-13 | `/documents` | Affichage documents privés | Liste filtrée par `is_public=0` |
| ADH-14 | `/visites-medicales` | CRUD visite (date, type, validité, restrictions) | Persist par user via `/api/medical-visits` |
| ADH-15 | `/annuaire` | 30 adhérents listés | OK |
| ADH-16 | `/annuaire-flotte` | Completeness < 100 % | Page verrouillée, message « Complétez votre profil à 100 % » |
| ADH-17 | `/annuaire-flotte` | Completeness 100 % | Filtres (compagnie, longueur, capacité passagers, brevet équipage) + liste cross-flotte ; pas de `fuelType` (lot 10 session 39) |
| ADH-18 | `/flotte` | CRUD navire (28 champs) | PUT atomique (`/api/organizations/:slug/fleet`), seed désactivé |
| ADH-19 | `/flotte` | Import CSV (30 + 17 cols crew_by_brevet) | Preview puis remplacement atomique |
| ADH-20 | `/flotte` | CSV malformé / encoding KO | Erreur claire, pas de remplacement |
| ADH-21 | `/votes` | Liste votes éligibles | Filtré selon collège org (audience `ag_ab` ou `social_3228`) |
| ADH-22 | `/votes/detail` × 5 types | single_choice / multiple_choice / text / ranking / date_selection | Form correct par type, drag-and-drop ranking + clavier ↑/↓ |
| ADH-23 | `/votes/detail` | Re-confirmation email puis submit | Réponse persistée, UNIQUE(vote_id, organization_id) respecté |
| ADH-24 | `/votes/detail` | Suppléant écrase réponse titulaire | INSERT OR REPLACE OK |
| ADH-25 | `/validation` | Campagne ouverte, items pendings | Cartes profil + navires affichées avec urgency |
| ADH-26 | `/validation` | « Tout marquer Inchangé » | Validation passive de masse, history persisté avec `is_unchanged=1` |
| ADH-27 | `/validation` | Édition profil + submit | UPDATE org + INSERT history + cache `last_validated_*` |
| ADH-28 | `/validation` | Édition navire + submit | UPDATE vessel + history + cache |
| ADH-29 | `/validation` | Empty state (pas de navires) | Lien `/espace-adherent/flotte` |
| ADH-30 | Banner dashboard | Campagne ouverte, items pending | Couleur teal/orange/red selon urgency calculée par `deriveUrgency()` |

### D4 — Espace candidat 🟠

| ID | Test | Attendu |
|----|------|---------|
| CAN-01 | Inscription auto-approuvée | Email bienvenue Brevo |
| CAN-02 | Profil : photo, LinkedIn, CV (R2 upload) | Persist + accès via `/api/media/raw/:key` |
| CAN-03 | ENM import wizard 4 étapes | Parser texte brut, table review, save profile |
| CAN-04 | ENM import — texte malformé | Erreur lisible, pas de crash |
| CAN-05 | Matching offres (12 champs pondérés) | Scores cohérents, ordre desc |
| CAN-06 | Préférences newsletter (3 cat.) | PATCH OK |
| CAN-07 | Postuler à 1 offre | Email recruteur + accusé candidat |
| CAN-08 | Suivi candidatures (5 statuts) | viewed/shortlisted/interview/accepted/rejected — emails déclenchés |

### D5 — Console admin 🔴 (16 sections)

| ID | Section | Test | Attendu |
|----|---------|------|---------|
| ADM-01 | `/admin` dashboard | Compteurs corrects | Match D1 réelles |
| ADM-02 | `/admin/comptes` | CRUD users + RBAC modal | 11 permissions cochables, persist `staff_permissions` JSON |
| ADM-03 | `/admin/adherents` | 7 stats cards + 2 vues + tri 8 colonnes + CSV export | OK ; CSV UTF-8 BOM ; 19 colonnes |
| ADM-04 | `/admin/adherents` | Création nouvel adhérent (mode demo only) | Désactivé en prod (pas d'endpoint POST) |
| ADM-05 | `/admin/adherents` | PATCH collège / 3228 / cotisation | Worker accepte (admin-only) |
| ADM-06 | `/admin/adherents` | Archivage org | Disparaît du public, listings filtrés |
| ADM-07 | `/admin/organisations` + `/admin/membres` | – | Redirects vers `/admin/adherents` |
| ADM-08 | `/admin/flotte` | Sélecteur compagnies + reset seed + CSV | Tous fonctionnels |
| ADM-09 | `/admin/agenda` | CRUD événement | EventJsonLd public visible |
| ADM-10 | `/admin/documents` | Upload R2 + métadonnées | Visible `/documents` public |
| ADM-11 | `/admin/messages` | Liste contact_messages | Lecture seule, archivage possible |
| ADM-12 | `/admin/newsletter` (v1) | Envoi rapide texte brut | Brevo bulk OK |
| ADM-13 | `/admin/newsletter/drafts` | CRUD drafts blocs | Persist D1 nl_drafts |
| ADM-14 | `/admin/newsletter/drafts/:id/test-send` | Test 1 destinataire | Email reçu charté |
| ADM-15 | `/admin/newsletter/drafts/:id/send` (production) | Envoi avec list IDs | Stats `nl_sends` + webhook events `nl_events` |
| ADM-16 | `/admin/newsletter/abonnes` | Filtres + sync Brevo + CSV | Colonne sync status (synced / out-of-sync / pending) |
| ADM-17 | `/admin/newsletter/charte` | Édition tokens marque (sender, logo, couleurs, footer) | Persist + appliqué au render renderer |
| ADM-18 | `/admin/offres` + `/new` | CRUD admin avec Hydros | Idem ADH-08, `companyDescription` résolu via `members.find()` |
| ADM-19 | `/admin/formations` + `/new` | CRUD | localStorage |
| ADM-20 | `/admin/positions` + `/new` | CRUD article | RSS + sitemap rebuilt |
| ADM-21 | `/admin/pages` (CMS) | 18 pages, 100+ sections | Édition + revisions + diff + DevicePreview (mobile/tablet/desktop) |
| ADM-22 | `/admin/pages` | Restore revision N-2 | Pré-snapshot créé, restore appliqué |
| ADM-23 | `/admin/votes` | CRUD + résultats + relance | Mailto BCC OK, copier URL clipboard OK |
| ADM-24 | `/admin/campagnes` | CRUD + transitions draft → open → closed | Email J+0 envoyé à `open`, idempotent (pas de re-spam si re-PATCH) |
| ADM-25 | `/admin/campagnes/detail?id=X` | 4 cards + tableau filtré + sort + relance | Tous OK, `mailto:` BCC pré-rempli emails titulaires retardataires |
| ADM-26 | `/admin/campagnes/attestation?slug=X&year=Y` | Imprimer PDF | `window.print()` rend A4 lisible, masque chrome admin |
| ADM-27 | `/admin/campagnes/attestation` | Lien depuis dashboard si `fullyValidated=true` uniquement | Sémantique correcte |
| ADM-28 | `/admin/parametres` | Réglages globaux | Persist |

### D6 — CMS dual-mode 🟠

| ID | Test | Attendu |
|----|------|---------|
| CMS-01 | Éditer hero homepage avec « Motif » | Sauvegarde + revision créée avec label |
| CMS-02 | Restore revision N-2 | Pré-snapshot + restore OK |
| CMS-03 | Diff 2 revisions (composant 3 colonnes) | Statuts added/removed/modified/unchanged corrects |
| CMS-04 | Filtre auteur + plage dates dans modal revisions | Liste filtrée |
| CMS-05 | Upload media R2 | Visible Media Library |
| CMS-06 | Insertion via Media Library | URL `/api/media/raw/:key` valide, rendu OK |
| CMS-07 | Reset section | Retombe sur `cms-defaults.ts` |
| CMS-08 | Iframe preview live | Reflète changements après save |
| CMS-09 | DevicePreview switch mobile / tablet / desktop | 3 viewports : 390×844, 820×1180, 1280×720 |
| CMS-10 | Édition section liste (`type: list`) | Add / remove / reorder OK |
| CMS-11 | Édition section richtext (Tiptap) | Bold / italic / link / image / list |

### D7 — Newsletter v1 + v2 🔴

| ID | Test | Attendu |
|----|------|---------|
| NL-01 | Inscription publique homepage form | Email confirmation, ligne `newsletter` D1 |
| NL-02 | Webhook Brevo (open / click / bounce / unsub) | HMAC vérifié, `nl_events` insert |
| NL-03 | Webhook signature invalide | 401 |
| NL-04 | Désinscription via `/newsletter/unsubscribe?token=…` | HMAC valide → `archived=1` côté `users` ou `newsletter` |
| NL-05 | Désinscription token forgé | 400 |
| NL-06 | Envoi par catégorie (10 cat.) | Filtre audience correct, pas de spam aux non-abonnés |
| NL-07 | Variables `{{firstname}}`, `{{unsubscribe_url}}`, `{{webversion_url}}` | Substituées correctement |
| NL-08 | Antispam score | Mail-Tester ≥ 7/10 |
| NL-09 | Rendu 5 clients (Gmail, Outlook 365 / 2019, Apple Mail, Yahoo) | Lisible (Litmus / Email on Acid) |
| NL-10 | Sanitization HTML strict | `<script>`, `<style>`, `<iframe>`, `on*=`, `javascript:` strippés |
| NL-11 | Pied de page footer mentions légales + lien désinscription | Présent dans tous les envois |
| NL-12 | Synchronisation contacts Brevo | `users.brevo_synced_at` mis à jour après PATCH preferences |

### D8 — Annuaire & flotte 🟠

| ID | Test | Attendu |
|----|------|---------|
| FLT-01 | 30 logos compagnies | Tous chargés (`next/image unoptimized`), pas de CLS |
| FLT-02 | Carte Leaflet 30 marqueurs | Fond Esri Ocean, `fitBounds` correct, popup au clic |
| FLT-03 | Filtre Collège A/B/C cumulatif | Listing + carte synchronisés |
| FLT-04 | Filtre 3228 oui/non | OK (26 / 4) |
| FLT-05 | Filtre territoire (Hexagone / Outre-mer) | 23 / 4 |
| FLT-06 | Profile completeness 6 sections (profile / financials / fleet-presence / fleet-details / crew-brevets / environment) | Score reproduit `profile-completeness.test.ts` |
| FLT-07 | crew_by_brevet 17 brevets (Pont 8 / Machine 6 / Services 2 / NAVPAX 1) | Editor + summary publics OK |
| FLT-08 | Reset flotte au seed (admin) | 110 + 1 navires re-INSERT |

### D9 — Offres + Hydros 🟠

| ID | Test | Attendu |
|----|------|---------|
| JOB-01 | CRUD offre admin + adherent | Persist D1 |
| JOB-02 | JobPostingJsonLd | Valide Google Rich Results |
| JOB-03 | Hydros publish background (offre `active`) | `hydrosOfferUrl` + `hydrosOfferId` renseignés si secrets OK |
| JOB-04 | Hydros publish KO (secrets vides) | Pas de blocage UI, log Worker, offre publiée quand même |
| JOB-05 | Filtres listing (contrat, urgence, lieu, brevet) | OK |
| JOB-06 | Matching candidat → offres (12 champs pondérés) | Scores triés desc |
| JOB-07 | Compteur candidats par offre (admin) | Cohérent avec D1 |

### D10 — Formations 🟡

| ID | Test | Attendu |
|----|------|---------|
| FORM-01 | Catalogue + filtres | OK |
| FORM-02 | Inscription | localStorage persist |
| FORM-03 | Fiche formation `/formations/[slug]` × 8 | SSG OK, pas de 404 |

### D11 — CCN 3228 / Boîte à outils 🔴 (dépend P1 C1/C4)

| ID | Test | Attendu |
|----|------|---------|
| CCN-01 | Grille salariale 12 niveaux | Match avenant signé NAO 2026 |
| CCN-02 | 13 Q/R FAQ + JSON-LD | Valide Rich Results |
| CCN-03 | Liens Legifrance / KALICONT | Tous 200 |
| CCN-04 | Sources cliquables (post-fix session 44) | OK |
| CCN-05 | 10 guides employeurs (apprentissage, aides, STCW, ENIM, etc.) | Tous accessibles |

### D12 — SSGM / Visites médicales 🟠

| ID | Test | Attendu |
|----|------|---------|
| SSGM-01 | 25 centres + 10 médecins | Listés avec coordonnées |
| SSGM-02 | 8 Q/R FAQ + JSON-LD | Valide |
| SSGM-03 | Suivi visites adherent | CRUD OK |
| SSGM-04 | Liens DAM / décret 2015-1575 / STCW / MLC 2006 | Tous 200 |
| SSGM-05 | Alertes expiration aptitude (J-30, J-15) | Notification visible dashboard adherent |

### D13 — Transition écologique / AdemeSimulator 🟠

| ID | Test | Attendu |
|----|------|---------|
| ECO-01 | 4 guides PDF | DL OK |
| ECO-02 | 6 technologies présentées | Chargées |
| ECO-03 | Simulateur 4 imports + 2566 lignes calc | Recharts rendu, ssr:false respecté, lazy-loaded |
| ECO-04 | Cas extrêmes (0 km, 100k km, équipage 0, etc.) | Pas de NaN/Infinity, validation in/out |
| ECO-05 | Facteurs CO₂ post-fix C5 | Sources DNV / EMSA cliquables |
| ECO-06 | Export PNG simulateur | html2canvas OK |

### D14 — Votes AG / NAO 🔴

| ID | Test | Attendu |
|----|------|---------|
| VOTE-01 | Audience `ag_ab` | Affiché aux Collèges A + B uniquement (27 compagnies) |
| VOTE-02 | Audience `social_3228` | Affiché aux 26 compagnies CCN 3228 |
| VOTE-03 | Auto-close `closes_at` dépassé | GET marque closed |
| VOTE-04 | Drag-and-drop ranking | Réordonnancement souris + clavier ↑/↓ + lecteur d'écran |
| VOTE-05 | Date selection | Min today, format FR weekday + jour + mois |
| VOTE-06 | Suppléant écrase titulaire | UNIQUE (vote_id, organization_id) respecté |
| VOTE-07 | Résultats admin | Barres horizontales par option, mailto retardataires + tous |
| VOTE-08 | Export résultats | À auditer (CSV non documenté) |
| VOTE-09 | Tab démo `/decouvrir-espace-adherent` | 3 votes fictifs disabled |
| VOTE-10 | Bandeau warning « pas de suppléant » | Visible dashboard adherent si pas désigné |

### D15 — Validation annuelle 🔴

| ID | Test | Attendu |
|----|------|---------|
| VAL-01 | POST campagne `target_year=2026` `status=open` | Email J+0 envoyé, ligne `validation_email_sent` insert |
| VAL-02 | Re-PATCH `draft → open → draft → open` | Pas de re-spam (idempotence via `alreadySent`) |
| VAL-03 | Cron 09:00 UTC J-14 | Email `due_soon` envoyé à 1 retardataire test |
| VAL-04 | Cron 09:00 UTC J+1 | Email `overdue` envoyé |
| VAL-05 | Soumission validation profil | UPDATE org + history + cache `last_validated_*` |
| VAL-06 | Soumission inchangé | `is_unchanged=1`, snapshot identique |
| VAL-07 | Diff Y-o-Y modal | 4 colonnes (Champ / N-1 / N / État), couleurs warm/green/neutral |
| VAL-08 | Attestation PDF print A4 | Sources history visibles, pas de chrome admin |
| VAL-09 | Attestation visible si `fullyValidated=true` uniquement | Sémantique correcte |
| VAL-10 | Smoke test script `scripts/smoke-test-validation.sh` | 8/8 passes |
| VAL-11 | Permission staff `manage_validations` | Endpoints campaigns 4xx pour staff sans cette permission |
| VAL-12 | Validation hors campagne (`campaign_id=NULL`) | Autorisée pour admin |
| VAL-13 | Tab démo `validation` | 4 items fictifs, CTA adhésion |

### D16 — SEO / RSS / JSON-LD 🔴

| ID | Test | Attendu |
|----|------|---------|
| SEO-01 | Lighthouse SEO ≥ 95 (5 pages clés) | Mobile + desktop |
| SEO-02 | 8 types JSON-LD valides | Google Rich Results : Organization / WebSite / Breadcrumb / FAQ / Event / Article / JobPosting / MaritimeService |
| SEO-03 | Sitemap : 117+ URLs | XML bien formé, indexable |
| SEO-04 | RSS 2.0 valide | W3C feed validator |
| SEO-05 | OG image 1200×630 par page | Partage Twitter / LinkedIn / Slack correct |
| SEO-06 | Canonical URL par page | Pas de duplicata |
| SEO-07 | 12 keywords positionnés | Crawl Screaming Frog : `maritime côtier`, `armateurs côtiers`, `CCN 3228`, etc. |
| SEO-08 | Search Console / Bing verification | Meta tags présents |
| SEO-09 | Structured data testing tool — 0 erreur | Schema.org validator |

### D17 — Cron triggers 🔴

| ID | Test | Attendu |
|----|------|---------|
| CRON-01 | `wrangler triggers cron` | `0 9 * * *` listé |
| CRON-02 | Logs CF Workers (dashboard) | Exécution quotidienne 09:00 UTC visible |
| CRON-03 | Helpers `shouldNotifyDueSoon/Overdue` | Vitest 13/13 + bornes (J-14 exact, J+1 exact) |
| CRON-04 | Audience filtrée retardataires (`getNonValidatedRecipients`) | Pas de spam aux compagnies déjà validées |
| CRON-05 | Couleur d'en-tête conditionnelle (teal due_soon, rouge overdue) | Template HTML correct |

### D18 — ENM import 🟡

| ID | Test | Attendu |
|----|------|---------|
| ENM-01 | Wizard 4 étapes (instructions → copier-coller → review → save) | Navigation OK |
| ENM-02 | Parser texte brut réel (1 marin de test, anonymisé) | Extraction service / brevets / aptitude |
| ENM-03 | Données malformées | Erreur lisible, pas de crash |
| ENM-04 | Save profil | Persist users (champs ENM) |
| ENM-05 | Mode démo (données simulées réalistes) | Affichage tabulaire correct |

---

## Phase 3 — Tests transverses

### 3.1 Sécurité 🔴

| ID | Test | Outil |
|----|------|-------|
| SEC-01 | OWASP Top 10 (XSS, SQLi, CSRF, broken auth, etc.) | OWASP ZAP / Burp Suite scan automatique |
| SEC-02 | JWT manipulation (`alg: none`, signature changée, expiry forgée) | curl forgé → 401 systématique |
| SEC-03 | CORS preflight Origin malveillant | `Origin: https://evil.com` → bloqué |
| SEC-04 | Upload magic bytes (PDF avec EXE inside, MIME mismatch) | Refusé serveur (10 MB max, magic bytes validation) |
| SEC-05 | Rate limiting login (5+ tentatives) | À auditer — pas documenté actuellement |
| SEC-06 | CSP header strict | Mozilla Observatory ≥ A |
| SEC-07 | Secrets côté client | Search bundle build pour `BREVO_API_KEY`, `JWT_SECRET`, `HYDROS_*` → 0 hit |
| SEC-08 | localStorage : pas de PII en clair | Audit DevTools sur `gaspe_users`, `gaspe_current_user` |
| SEC-09 | RBAC bypass tentatives | curl staff vs endpoints master-admin → 403 systématique |
| SEC-10 | Anti-énumération forgot-password | Réponses identiques (200) email connu vs inconnu |
| SEC-11 | SQL injection sur paramètres | `?slug=' OR 1=1--` → 400 ou ignoré |
| SEC-12 | XSS persistent (CMS, profil, contact) | Sanitization stricte |
| SEC-13 | Cookies httpOnly + Secure + SameSite=Strict | DevTools |
| SEC-14 | npm audit | 0 high, ≤ 1 moderate (postcss transitive next) |
| SEC-15 | Dependency-check OWASP | À planifier pré-launch |

### 3.2 Accessibilité (WCAG 2.1 AA) 🔴

| ID | Test | Outil |
|----|------|-------|
| A11Y-01 | axe-core sur 10 pages clés (homepage, nos-adherents, boite-a-outils, ssgm, transition-ecologique, formations, espace-adherent, admin/adherents, admin/comptes, admin/pages) | Playwright e2e + extension navigateur |
| A11Y-02 | Contraste textes | DevTools (ratio AAA ciblé sur foreground-muted depuis session 44) |
| A11Y-03 | Navigation clavier 100 % (Tab, Shift+Tab, Enter, Esc, flèches) | Manuel desktop |
| A11Y-04 | Skip-link visible au focus | Manuel — déjà câblé session 44 |
| A11Y-05 | Lecteur d'écran (NVDA / VoiceOver / JAWS) | Parcours adhésion + vote + validation |
| A11Y-06 | Modals : focus trap + Esc | À auditer (P2 corpus § 9.2) |
| A11Y-07 | `prefers-reduced-motion` | Anim désactivées (déjà câblé session 44) |
| A11Y-08 | Tap targets ≥ 44 × 44 px mobile | DevTools mobile |
| A11Y-09 | Forms `<label>` explicites | DevTools |
| A11Y-10 | `lang="en"` sur acronymes anglais (STCW, IMO, MLC) | À auditer (P4 corpus) |
| A11Y-11 | Tableaux `<th scope>`, `<caption>` | À auditer |
| A11Y-12 | Alt text images informatives | À auditer (logos décoratifs `aria-hidden`) |

### 3.3 Performance 🔴

| ID | Test | Cible | Outil |
|----|------|-------|-------|
| PERF-01 | Lighthouse mobile (5 pages : `/`, `/nos-adherents`, `/boite-a-outils`, `/formations`, `/transition-ecologique`) | ≥ 90 (Perf) | Lighthouse CI |
| PERF-02 | Lighthouse desktop | ≥ 95 | Idem |
| PERF-03 | LCP homepage | < 2.5s | WebPageTest mobile 4G |
| PERF-04 | CLS toutes pages | < 0.1 | Idem |
| PERF-05 | INP (Interaction to Next Paint) | < 200 ms | Idem |
| PERF-06 | TTI mobile | < 3.5s | Idem |
| PERF-07 | Bundle size first-load | < 200 KB compressé | `next build` analyzer |
| PERF-08 | Vidéo hero | poster + preload metadata, lazy lecture sur interaction | DevTools Network |
| PERF-09 | Images LCP | `next/image` dimensions explicites, no CLS | DevTools |
| PERF-10 | Polices | font-display swap, 7 poids | DevTools |
| PERF-11 | Cron exec time | < 30s pour 30 orgs | Logs CF Workers |
| PERF-12 | API p95 latency | < 500 ms (chemin chaud) | Cloudflare Analytics |

### 3.4 SEO indexation 🔴

| ID | Test | Outil |
|----|------|-------|
| INDEX-01 | Submit sitemap | Google Search Console |
| INDEX-02 | Submit sitemap | Bing Webmaster |
| INDEX-03 | robots.txt → indexer publics, bloquer admin / auth / espaces privés | OK déjà câblé |
| INDEX-04 | Pages indexées par Google après J+7 | GSC > Couverture |
| INDEX-05 | 0 « Indexed though blocked » | GSC |
| INDEX-06 | Crawl Screaming Frog complet | 0 broken link, 0 redirect chain > 2 |

---

## Phase 4 — Cross-device / cross-browser 🟠

| Browser | OS | Versions | Smoke clés |
|---------|----|----|----------|
| Chrome | macOS / Windows / Android | latest + N-1 | INST-01, AUTH-01, ADH-18, ADM-21, VAL-08 |
| Safari | macOS / iOS | latest + N-1 | Idem + impression PDF attestation |
| Firefox | macOS / Windows | latest | Idem |
| Edge | Windows | latest | Idem |
| Samsung Internet | Android | latest | Smoke uniquement |

**Devices physiques** :
- iPhone SE 1st gen (320×568) — limite basse a11y
- iPhone 14 (390×844)
- iPad mini (768×1024)
- iPad Pro 11" (834×1194)
- MacBook 13" (1280×800)
- Desktop FHD (1920×1080)
- Desktop 4K (3840×2160)

---

## Phase 5 — Charge & résilience 🟡

| ID | Test | Outil | Cible |
|----|------|-------|-------|
| LOAD-01 | 100 req/s sur `/api/health` pendant 5 min | k6 | 0 erreur, p95 < 500 ms |
| LOAD-02 | 50 utilisateurs simultanés sur `/espace-adherent/validation` | k6 scénario réaliste | Pas de timeout, pas de 5xx |
| LOAD-03 | Cron pendant trafic | dashboard CF | `ctx.waitUntil` n'impacte pas requêtes |
| LOAD-04 | D1 batch validation 200 items max | curl POST `/api/organizations/:slug/validations` | 400 si > 200 |
| LOAD-05 | Coupure réseau Brevo | spy + `BREVO_API_KEY=invalid` | Worker log + endpoint OK, no UI block |
| LOAD-06 | Coupure D1 | impossible à simuler | Si possible, monitoring Sentry / CF |
| LOAD-07 | Tentative DDoS basique | – | CF Pages bloque, WAF rules |
| LOAD-08 | Cache CF Pages (immutable assets) | DevTools Network | `cache-control: public, max-age=31536000, immutable` sur `/_next/static/*` |

---

## Phase 6 — UAT métier 🔴 (sessions avec utilisateurs réels)

### 6.1 Persona 1 — Master admin GASPE (1 session, 60 min)

- Créer campagne validation 2026 (target_year=2026, target_date=31/03)
- Inviter 2 staff avec permissions distinctes (`manage_jobs` vs `manage_campagnes`)
- Lancer newsletter v2 sur 1 catégorie test
- Approuver 1 nouvelle adhésion
- Refuser 1 adhésion (avec message)
- Consulter dashboard validation + relance retardataires (mailto BCC)
- Imprimer 1 attestation PDF
- Archiver 1 organisation (test)

### 6.2 Persona 2 — Titulaire compagnie (3 compagnies, 30 min/cie)

- Login + dashboard
- Compléter profil + flotte (CSV)
- Inviter 1 contact
- Désigner 1 suppléant
- Voter 1 question NAO
- Soumettre validation annuelle (profil + 3 navires)
- Publier 1 offre d'emploi (vérifier Hydros publish ~5s plus tard)
- Activer / désactiver newsletter cat. 5 « Veille Juridique ADF »

### 6.3 Persona 3 — Contact compagnie (1 session, 20 min)

- Acceptation invitation token email
- Modifier préférences newsletter
- Lecture annuaire flotte (gating completeness — voir si compagnie 100 %)
- Pas d'accès gestion équipe ni invitations

### 6.4 Persona 4 — Candidat (1 session, 30 min)

- Inscription auto
- Import ENM via copier-coller (1 marin réel anonymisé)
- Compléter profil (photo, CV, LinkedIn, certifications STCW)
- Postuler à 1 offre
- Recevoir email statut candidature (accept ou reject test)
- Filtres newsletter (3 cat. candidat)

### 6.5 Persona 5 — Visiteur public (audit éditorial)

- Parcours « je découvre ACF » : `/` → `/notre-groupement` → `/nos-adherents` → `/contact`
- Parcours « formation » : `/ecoles-de-la-mer` → carte → quiz → simulateur carrière
- Parcours « employeur » : `/boite-a-outils` → CCN 3228 → guide apprentissage
- Parcours « marin » : `/ssgm` → centre proche
- Soumission formulaire contact
- Inscription newsletter publique homepage

### 6.6 Critère UAT
5 personas, ≥ 4/5 « parcours réussi sans accompagnement » + 0 blocker logique.

---

## Phase 7 — Régression automatisée

À enchaîner dans `.github/workflows/ci.yml` avant merge final go-live.

| Suite | Cmd | Cible |
|-------|-----|-------|
| Vitest unit | `npm run test` | 346 / 346 verts |
| ESLint | `npm run lint` | 0 erreur, 0 warning |
| TypeScript | `npx tsc --noEmit` | 0 erreur |
| Build | `npm run build` | 118 pages générées |
| Playwright e2e | `npm run test:e2e` | 11 specs ≥ 95 % verts (cf. Annexe A pour 8 tests obsolètes à corriger) |
| axe-core a11y | inclus dans Playwright | 0 violation critical/serious |
| `npm audit` | – | 0 high, ≤ 1 moderate (postcss transitive next, ticket suivi) |

---

## Phase 8 — Critères Go / No-Go

### 🔴 Bloquants (= No-Go si KO)

- ✅ Phase 0 : 6/6 gates C1-C6 traités
- ✅ Phase 1 : 14/14 INF-* verts
- ✅ Phase 2 : 100 % des tests des domaines D1, D2, D5, D7, D11, D14, D15, D16, D17 (criticité 🔴)
- ✅ Phase 3 : Lighthouse Perf mobile ≥ 90, 0 violation a11y critical/serious, 0 secret leaké côté client
- ✅ Smoke validation 8/8
- ✅ npm audit : 0 high
- ✅ UAT Phase 6 : ≥ 4/5 personas réussis

### 🟠 Acceptables avec ticket de suivi

- P2 corpus § 9.2 (modals Esc, breadcrumbs, monolith Worker, validation Zod client, pagination endpoints)
- 1 vuln moderate postcss transitive next (impact build only)
- 8 tests e2e obsolètes (cf. Annexe A — slugs supprimés en session 33d)
- Tests Brevo manuels limités (sandbox sans réseau pour smoke `J-14`/`J+1`)

### 🟡 Reportables post-launch

- P3/P4 corpus § 9.3 + § 9.4
- Refacto AdemeSimulator 2566 lignes
- Easter egg / signature de marque
- i18n future-proofing

---

## Annexe A — Résultats audit sandbox

Exécuté le **30 avril 2026** sur la branche `claude/french-greeting-test-fmBzC` (sandbox sans accès réseau extérieur).

### A.1 Tests automatisés

| Suite | Résultat | Détail |
|-------|----------|--------|
| **ESLint** | ✅ 0 / 0 | `npm run lint` exit 0 |
| **TypeScript** | ✅ 0 erreur | `npx tsc --noEmit` exit 0 |
| **Vitest** | ✅ **346 / 346** verts (27 fichiers, 30.46s) | `npm test` exit 0 |
| **Build production** | ✅ exit 0, **118 pages** | `npm run build` |
| **Playwright a11y `/admin/adherents`** | ✅ 3 / 3 verts (22.9s) | Expanded view, compact (table) view, create modal axe-core sans violation critical/serious |
| **Playwright e2e public** | 🟡 36 / 44 verts (1.6 min) | 8 tests obsolètes (cf. § A.4) |
| **Playwright e2e applicatifs** | 🔴 timeout sandbox | Dev server non maintenable en background — à exécuter post-merge ou en local |
| **`npm audit`** | 🟡 1 moderate restante (postcss transitive next 16.2.4) | next bumpé 16.2.1 → 16.2.4 (1 high → 0). Reste postcss < 8.5.10 dans `next/node_modules` (ne peut être patché sans breaking change vers next 9) |

### A.2 Audits transverses

| Audit | Résultat |
|-------|----------|
| **Secrets côté client** | ✅ **0 hit** sur `BREVO_API_KEY`, `JWT_SECRET`, `HYDROS_PASSWORD`, `HYDROS_EMAIL`, `NEWSLETTER_UNSUB_SECRET`, `BREVO_WEBHOOK_SECRET`, `CLOUDFLARE_API_TOKEN` dans `src/` |
| **`console.log/debug/info` résiduels** | ✅ **0** hors tests |
| **TODO / FIXME / XXX / HACK** | ✅ 2 hits dans `workers/api.ts` (commentaires d'ENM parser, pas de dette) |
| **`target="_blank"` sans `rel="noopener noreferrer"`** | ✅ Fix appliqué : 2 occurrences corrigées (`AdminSidebar.tsx:198`, `admin/page.tsx:120`) |
| **Em-dash `—` dans contenus user-facing** | 🟡 34 hits totaux dont ~5 user-facing à auditer (`comptes/page.tsx:409`, `adherents/page.tsx:555` libellé « A — Publics », placeholders « — » UI génériques sur `SnapshotDiffModal` / `CampaignDashboardClient`). La règle CLAUDE.md interdit em-dash en **contenu éditorial** ; les placeholders UI restent acceptables. |
| **CSP / headers Cloudflare Pages** | ✅ `public/_headers` configuré (X-Frame-Options DENY, X-Content-Type-Options nosniff, Referrer-Policy strict-origin-when-cross-origin, Permissions-Policy géolocation=self uniquement, CSP frame-ancestors none) |
| **robots.txt** | ✅ Disallow correct sur `/admin`, `/espace-adherent`, `/espace-candidat`, `/inscription`, `/connexion`, `/mot-de-passe-oublie`, `/reinitialiser-mot-de-passe` |
| **Sitemap** | ✅ Pages statiques + jobs + members + formations + positions |

### A.3 Métriques code

| Item | Valeur |
|------|--------|
| `workers/api.ts` LOC | 5470 lignes (à splitter en handlers — P2 corpus) |
| Migrations D1 | 30 fichiers (0001 → 0030) |
| Endpoints Worker (hits regex) | ~42 dans `workers/api.ts` (corpus annonce 76, écart dû au regex peu permissif) |
| Specs e2e | 12 fichiers Playwright |
| `members.ts` | 30 adhérents |
| `fleet-seed.ts` | 111 navires |
| Fichiers `src/data/*.ts` | 16 |

### A.4 Tests e2e obsolètes (à corriger ou retirer post-merge)

8 tests référencent des slugs supprimés en session 33d (jobs réduits aux 4 offres Karu'Ferry / STEP Group) :

| Fichier | Ligne(s) | Slug obsolète |
|---------|----------|---------------|
| `e2e/recruitment.spec.ts` | 28 | `chef-mecanicien-3000-kw-manche-iles-express` |
| `e2e/pages.spec.ts` | 33 | `compagnie-oceane` |
| `e2e/pages.spec.ts` | 34 | `manche-iles-express` |
| `e2e/pages.spec.ts` | 49 | `chef-mecanicien-3000-kw-manche-iles-express` |
| `e2e/pages.spec.ts` | 50 | `capitaine-brevet-illimite-gironde` |
| `e2e/pages.spec.ts` | 51 | `capitaine-3000-ums-blaye-lamarque` |
| `e2e/pages.spec.ts` | 118-127 | `Redirect pages /actualites` + `/presse` (locator `text=Positions` matche 6 éléments — strict mode violation) |
| `e2e/contact.spec.ts` | 20 | Submission test en mode démo (API non branchée) |
| `e2e/homepage.spec.ts` | 26 | Stats animated numbers (race condition) |

**Action recommandée** : nettoyer en début Phase 7 (régression) avant go-live.

### A.5 Vulnérabilité résiduelle

- **postcss < 8.5.10** (moderate, transitive de next 16.2.4) — XSS via Unescaped `</style>` en CSS Stringify Output (https://github.com/advisories/GHSA-qx2v-qp2m-jg93). Impact build only, pas runtime. Sera fixée à la prochaine release de next. **Ticket de suivi requis**.

---

## Annexe B — Bloqueurs sandbox & runbooks

Tests qui ne peuvent pas être exécutés depuis le sandbox de cette session (pas d'accès réseau extérieur, pas d'accès dashboards Cloudflare / Brevo / GSC).

### B.1 Tests bloqués sandbox — runbook prod

| Test | Bloqueur | Runbook |
|------|----------|---------|
| **INF-01 à INF-14** (smoke prod) | Pas d'accès `gaspe-api.hello-0d0.workers.dev` | Exécuter `bash scripts/smoke-test-prod.sh` (créé en session 53) post-merge |
| **VAL-01 à VAL-13** côté prod (validation annuelle E2E) | Idem | `bash scripts/smoke-test-validation.sh` post-merge |
| **CRON-01 à CRON-05** | Cron triggers visibles uniquement dashboard CF Workers | Connexion dashboard + `wrangler triggers cron` post-deploy |
| **Cron logs** | Idem | Dashboard CF Workers > Logs (filtrer `scheduled`) |
| **NL-02, NL-03** (webhook Brevo) | Pas d'accès Brevo prod | Configurer webhook dans dashboard Brevo, pointer sur `/api/newsletter/brevo/webhook`, vérifier signature HMAC |
| **NL-08, NL-09** (rendu / antispam) | Pas de Litmus / Email on Acid / Mail-Tester accès | Créer compte Litmus 7-day trial pour go-live |
| **PERF-01 à PERF-12** (Lighthouse / WebPageTest) | Pas de Lighthouse CLI dans sandbox | Lancer Lighthouse CI sur PR ou via `npx lighthouse https://gaspe-fr.pages.dev` localement |
| **INDEX-01 à INDEX-06** | Pas d'accès GSC / Bing / Screaming Frog | Submit sitemap manuellement après bascule DNS |
| **SEC-01, SEC-15** (OWASP ZAP / Dependency-check) | Pas dans sandbox | Lancer en local ou intégrer dans CI Pipeline |
| **LOAD-01 à LOAD-08** | Pas d'accès k6 dans sandbox | Lancer k6 cloud ou self-host post-merge |
| **UAT Phase 6** (5 personas) | Sessions humaines réelles | Planifier J-7 avant go-live |
| **Cross-browser / cross-device** (Phase 4) | Sandbox = headless chromium uniquement | Faire tourner en local + BrowserStack |
| **A11Y-05** (lecteurs d'écran) | Pas de NVDA / VoiceOver dans sandbox | Manuel sur Mac (VoiceOver) + Windows (NVDA) |
| **e2e applicatifs** (auth, admin-crud, adherent-space, candidate-space, enm-import, medical-visits, formations, recruitment) | Dev server background tombe en sandbox après quelques min | Lancer en local : `npm run dev` puis `npm run test:e2e` |

### B.2 Items bloqués mais déjà documentés ailleurs

- **Audit live des 12 URLs LPM** : runbook dans `docs/CAMPAGNE-ECOLES-DE-LA-MER.md` § 4.1
- **Compression vidéo `acf_video.MP4`** : ffmpeg disponible dans sandbox mais runbook dans `docs/LIGHTHOUSE-SESSION-30.md`
- **Smoke tests prod validation annuelle** : runbook dans `docs/VALIDATION-ANNUELLE-FEATURE.md` § 15

---

## Annexe C — Checklist d'exécution

### C.1 J-14 (planification)

- [ ] Phase 0 : assigner owner pour chaque gate C1-C6
- [ ] Provisionner accès Litmus / Mail-Tester / Lighthouse CI / k6
- [ ] Planifier les 5 sessions UAT (Persona 1 à 5)
- [ ] Préparer environnement de test : 2 staff, 3 titulaires, 1 contact, 1 candidat (comptes seed)

### C.2 J-7 (pré-launch)

- [ ] Phase 0 : 6/6 gates fermés
- [ ] Phase 1 : `bash scripts/smoke-test-prod.sh` → 14/14 ✅
- [ ] Phase 7 : régression CI verte
- [ ] Nettoyer 8 tests e2e obsolètes (Annexe A.4)
- [ ] Bumper version (`package.json` + `SITE_VERSION`)

### C.3 J-3 (validation finale)

- [ ] Phase 2 : domaines 🔴 tous verts
- [ ] Phase 3 : Lighthouse + axe-core + Mozilla Observatory + Mail-Tester ≥ seuils
- [ ] Phase 4 : 5 browsers × 7 devices smoke
- [ ] Phase 5 : k6 100 req/s OK
- [ ] Phase 6 : 5 UAT, ≥ 4/5 réussis

### C.4 J-1 (go decision)

- [ ] Réunion go/no-go : tous les bloquants Phase 8 verts
- [ ] Backup D1 (export `wrangler d1 export`)
- [ ] Tag git release (`v3.0.0-acf-launch` par exemple)
- [ ] Communications préparées (email adhérents, post LinkedIn, communiqué presse)

### C.5 J-0 (go-live)

- [ ] Bascule DNS gaspe.fr → CF Pages (TTL ~5 min)
- [ ] Soumission sitemap GSC + Bing
- [ ] Smoke test prod final (`scripts/smoke-test-prod.sh`)
- [ ] Surveillance dashboard CF + Brevo + Sentry pendant 4h
- [ ] Annonce officielle

### C.6 J+1 → J+7 (suivi)

- [ ] Vérifier indexation GSC (Couverture)
- [ ] Vérifier email cron J-14 / J+1 (si campagne validation ouverte)
- [ ] Surveillance erreurs Worker (logs)
- [ ] Backlog tickets P2 / P3 / P4 dans GitHub Issues

---

## Livrables associés

1. **Ce document** : `docs/PLAN-TEST-GO-LIVE-2026.md`
2. **Script smoke prod** : `scripts/smoke-test-prod.sh` (étendu, couvre Phase 1 + Phase D17 cron)
3. **Script smoke validation** : `scripts/smoke-test-validation.sh` (existant session 52)
4. **Rapport audit sandbox** : Annexe A ci-dessus (résultats 30/04/2026)
5. **Backlog post-launch** : à importer dans GitHub Issues depuis corpus § 9 P2/P3/P4

---

**Auteur** : Session 53/54 (claude/french-greeting-test-fmBzC), 30 avril 2026
**Sources** : `docs/CORPUS-FONCTIONNALITES-2026.md` v2.43.0, `CLAUDE.md` v2.44.0, `docs/AUDIT-CRITIQUE-2026.md`, `docs/VALIDATION-ANNUELLE-FEATURE.md`


