# Validation annuelle des données adhérents – Spécification

**Version** : 1.0 · avril 2026 (session 45 – backend)
**Scope** : Tous les items déclaratifs d'un adhérent ACF (profil organisation + flotte détaillée)
**Statut** : Backend D1 + Worker livrés, frontend reporté en sessions 46+

---

## 1. Vision et principes

### 1.1 Pourquoi cette feature

Les données adhérents (effectifs, flotte, contacts, équipage par brevet) sont
saisies une fois à l'inscription puis rarement mises à jour. Sans un cycle
formel, les chiffres publiés sur `/nos-adherents/[slug]`, dans les annuaires
internes, dans les relances ADF et dans les communications presse vieillissent
silencieusement. La feature « Validation annuelle » :

- **Force un passage** une fois par an sur chaque ligne du profil + chaque navire.
- **Trace** qui a validé quoi et quand, dans une table d'historique permanente
  (utile pour audits, statistiques branche, et back-office GASPE).
- **Permet** à l'adhérent de cocher « inchangé depuis l'an dernier » sans
  retaper toutes les valeurs : la validation s'applique sans modification.
- **Donne** à l'admin GASPE un tableau de bord temps réel des validations en
  attente, avec relance ciblée par mailto.

### 1.2 Principes d'architecture

| Principe | Implémentation |
|----------|----------------|
| **Granularité par item** | Chaque navire et le profil organisation peuvent être validés indépendamment. |
| **Idempotence** | Valider deux fois le même item dans la même `target_year` ne crée pas de doublon visible (mais l'historique conserve les soumissions). |
| **Pas d'auto-fermeture** | Une campagne reste ouverte indéfiniment ; l'admin la clôt manuellement quand elle a recueilli le quorum souhaité. |
| **Validation hors campagne autorisée** | Un adhérent peut valider même sans campagne active : `campaign_id` est NULLable dans `validation_history`. |
| **Snapshots immuables** | Chaque validation enregistre un snapshot JSON de l'état au moment de la validation, indépendant des mises à jour ultérieures. |
| **Réciprocité non requise** | Contrairement à l'annuaire flotte cross-compagnies (PR #52), la validation n'exige pas de seuil de complétude pour être effectuée. |

### 1.3 Hors scope (sessions futures)

- **Validation des contacts/users** (équipe d'une compagnie) : non couvert.
  Les contacts s'auto-gèrent via `/espace-adherent/equipe`.
- **Photos bureau Media Library** : non couvert (volume rare, low-stakes).
- **Validation rétroactive en lot par l'admin** : non couvert. L'admin peut
  valider en override pour le compte d'un adhérent (champ `override_admin`
  prévu en option future), mais le flux courant est l'auto-validation par
  l'adhérent.
- **Diff Y-o-Y avec mise en évidence** : prévu côté frontend session 46+.

---

## 2. Modèle de données (3 migrations)

### 2.1 Migration 0027 – fleet_validation_campaigns

```sql
CREATE TABLE fleet_validation_campaigns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  target_year INTEGER NOT NULL UNIQUE,
  opened_at TEXT NOT NULL,
  target_date TEXT,
  closed_at TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','open','closed')),
  created_by TEXT REFERENCES users(id),
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_campaigns_status ON fleet_validation_campaigns(status);
CREATE INDEX idx_campaigns_year ON fleet_validation_campaigns(target_year);
```

**Champs** :
- `target_year` : année de référence (ex. 2027 pour la campagne lancée en
  février 2027). Contraint UNIQUE → 1 seule campagne par année.
- `opened_at` : ISO timestamp de bascule en `open`. Distinct de `created_at`
  car une campagne peut rester en `draft` plusieurs jours.
- `target_date` : deadline molle (ex. 31 mars). Sert au calcul de l'urgence
  visuelle côté UI (`due-soon`, `overdue`) mais ne ferme pas automatiquement.
- `status` : `draft` (admin prépare) → `open` (visible adhérents) → `closed`
  (admin clôt manuellement, calcule le bilan, archive).
- `created_by` : admin GASPE qui a créé la campagne (FK users).
- `notes` : libre, pour le back-office.

**Cycle de vie** :
1. Admin crée → `status='draft'`, opens_at=null, target_date posé
2. Admin ouvre → `status='open'`, opened_at=now()
3. Adhérents valident pendant la fenêtre ouverte
4. Admin clôt → `status='closed'`, closed_at=now() ; bilan figé

### 2.2 Migration 0028 – ALTER validation status (in-place)

```sql
ALTER TABLE organizations ADD COLUMN last_validated_year INTEGER;
ALTER TABLE organizations ADD COLUMN last_validated_at TEXT;
ALTER TABLE organizations ADD COLUMN last_validated_by TEXT;
ALTER TABLE organization_vessels ADD COLUMN last_validated_year INTEGER;
ALTER TABLE organization_vessels ADD COLUMN last_validated_at TEXT;
ALTER TABLE organization_vessels ADD COLUMN last_validated_by TEXT;
```

**Pourquoi dénormaliser** : la requête « ce navire est-il validé pour 2027 ? »
est dans le chemin chaud (rendu de la fiche `/nos-adherents/[slug]`, dashboard
admin, banner adhérent). Stocker `last_validated_year` directement sur la ligne
évite un LEFT JOIN sur `validation_history` à chaque rendu.

**Source de vérité** : `validation_history` reste la trace canonique.
`last_validated_year` est un cache projeté lors de chaque INSERT history.

### 2.3 Migration 0029 – validation_history

```sql
CREATE TABLE validation_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL CHECK (item_type IN ('profile','vessel')),
  item_id TEXT,
  target_year INTEGER NOT NULL,
  validated_at TEXT NOT NULL,
  validated_by_user_id TEXT NOT NULL REFERENCES users(id),
  snapshot_json TEXT NOT NULL,
  is_unchanged INTEGER NOT NULL DEFAULT 0,
  campaign_id INTEGER REFERENCES fleet_validation_campaigns(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_history_org_year ON validation_history(organization_id, target_year);
CREATE INDEX idx_history_item ON validation_history(item_type, item_id, target_year);
CREATE INDEX idx_history_campaign ON validation_history(campaign_id);
```

**Champs** :
- `item_type` : `'profile'` (organisation entière) ou `'vessel'` (1 navire).
- `item_id` : NULL si `item_type='profile'`, sinon `organization_vessels.id`.
- `target_year` : doublon de campaign.target_year quand campaign_id non null,
  sinon année courante. Permet le filtrage rapide.
- `snapshot_json` : copie sérialisée de l'état au moment de la validation.
  - Pour `profile` : `{ email, phone, address, websiteUrl, logoUrl,
    description, employeeCount, shipCount }`
  - Pour `vessel` : `{ id, name, imo, type, yearBuilt, passengerCapacity,
    vehicleCapacity, flag, crewByBrevet, ... }`
- `is_unchanged` : 1 si l'adhérent a coché « inchangé depuis l'an dernier »
  sans modifier les champs (audit légèrement plus rapide).
- `campaign_id` : NULLable. Renseigné si la validation a eu lieu pendant une
  campagne ouverte (résolu côté Worker au moment du POST).

**Rétention** : pas de purge automatique. Le volume reste faible (30 orgs ×
~5 navires × 1 validation/an = ~180 lignes/an). Données conservées pour audit
et statistiques pluriannuelles.

---

## 3. Permissions

| Action | Master admin | Staff (perm dédiée) | Adhérent (org X) | Adhérent (org Y) | Candidat |
|--------|:---:|:---:|:---:|:---:|:---:|
| Lister campagnes | ✓ | `manage_validations` | ✗ | ✗ | ✗ |
| Créer/PATCH campagne | ✓ | `manage_validations` | ✗ | ✗ | ✗ |
| Voir dashboard campagne | ✓ | `manage_validations` | ✗ | ✗ | ✗ |
| Lire historique org X | ✓ | `manage_validations` ou `manage_organizations` | ✓ (orgX) | ✗ | ✗ |
| Valider items org X | ✓ | `manage_validations` ou `manage_organizations` (override) | ✓ (orgX, tout user) | ✗ | ✗ |

**Note staff** : la permission dédiée `manage_validations` (session 47) couvre
toute la gestion des campagnes (CRUD + dashboard) et la validation cross-org.
La permission plus large `manage_organizations` (session 39, lot 9 RBAC) est
toujours acceptée pour `canActOnOrg` (rétro-compatibilité : un staff qui peut
PATCH une organisation peut aussi soumettre une validation pour son compte).
Master admin bypasse toutes les permissions.

**Note adhérent** : tout utilisateur lié à `organizations.id` peut valider,
pas uniquement le titulaire. Justification : la validation est déclarative et
réversible (l'adhérent peut re-valider plus tard avec de nouvelles valeurs) ;
empêcher les contacts de valider crée un goulot inutile.

---

## 4. Endpoints Worker

| Endpoint | Méthode | Auth | Description |
|----------|:-------:|:----:|-------------|
| `/api/campaigns` | GET | admin/staff(orgs) | Liste toutes les campagnes + flag courante |
| `/api/campaigns` | POST | admin/staff(orgs) | Crée campagne (target_year unique) |
| `/api/campaigns/:id` | PATCH | admin/staff(orgs) | Update statut/dates/notes |
| `/api/campaigns/:id/dashboard` | GET | admin/staff(orgs) | Breakdown par compagnie |
| `/api/organizations/:slug/validations` | GET | admin/staff OU same-org | Historique compagnie |
| `/api/organizations/:slug/validations` | POST | admin/staff OU same-org | Soumet N items atomiquement |

### 4.1 POST /api/organizations/:slug/validations

**Body** :
```json
{
  "items": [
    { "type": "profile", "unchanged": true },
    { "type": "vessel", "id": "v-abc-123", "unchanged": false,
      "data": { "passengerCapacity": 250, "yearBuilt": 2018 } }
  ]
}
```

**Comportement** :
1. Résoudre `target_year` : si campagne `open`, utiliser `campaign.target_year` ;
   sinon `new Date().getUTCFullYear()`.
2. Pour chaque item :
   - Si `unchanged=false` et `data` fourni → mettre à jour la table cible
     (`organizations` ou `organization_vessels`) avec les champs modifiés.
   - Construire le `snapshot_json` à partir de l'état post-update.
   - INSERT dans `validation_history` (1 ligne par item).
   - UPDATE `last_validated_*` sur la ligne cible (cache projeté).
3. Tout dans un `env.DB.batch()` → atomique.
4. Réponse : `{ success: true, validated: N, targetYear, campaignId }`.

**Erreurs** :
- 400 si `items` n'est pas un tableau, vide, ou >200 entries
- 400 si un item `vessel` n'a pas d'`id`
- 403 si l'utilisateur n'a pas accès à cette organisation
- 404 si l'organisation est introuvable

### 4.2 GET /api/campaigns/:id/dashboard

**Réponse** :
```json
{
  "campaign": { "id": 1, "targetYear": 2027, "status": "open", ... },
  "summary": { "orgsTotal": 30, "orgsFullyValidated": 12, "vesselsValidated": 87, "vesselsTotal": 128 },
  "rows": [
    {
      "organizationId": "...",
      "organizationName": "Karu'Ferry",
      "slug": "karu-ferry",
      "profileValidated": true,
      "profileValidatedAt": "2027-02-15T10:23:11Z",
      "vesselsValidated": 1,
      "vesselsTotal": 1,
      "lastActivityAt": "2027-02-15T10:23:11Z",
      "titulaireEmail": "..."
    }
  ]
}
```

L'admin utilise le tableau pour repérer les retardataires et générer un
mailto BCC vers les `titulaireEmail` non validés (pas dans cette session,
prévu côté UI).

---

## 5. Helpers purs extraits

`workers/handlers/validation-helpers.ts` regroupe la logique métier sans
dépendance D1 (testable en isolation). Fonctions exposées :

| Helper | Signature | Rôle |
|--------|-----------|------|
| `isItemValidatedForYear` | `(item, targetYear) → boolean` | Compare `last_validated_year` ≥ targetYear |
| `countValidatedItems` | `(items[], targetYear) → { validated, total, percentage }` | Stat dashboard |
| `deriveCampaignUrgency` | `(campaign, nowMs?, dueSoonDays?) → 'draft'\|'open'\|'due-soon'\|'overdue'\|'closed'` | Niveau visuel |
| `resolveTargetYear` | `(openCampaign \| null, nowDate?) → number` | Année cible à utiliser pour POST |
| `buildProfileSnapshot` | `(orgRow) → OrgProfileSnapshot` | Sérialise profil |
| `buildVesselSnapshot` | `(vesselRow) → VesselSnapshot` | Sérialise navire (parse crew_by_brevet) |
| `parseValidationItems` | `(unknown) → ValidationRequestItem[]` | Valide payload POST |

Les tests unitaires (`workers/handlers/__tests__/validation-helpers.test.ts`)
couvrent : edge cases nullables, dates limites pour urgency, snapshots avec
crew_by_brevet malformé, bornes du payload (vide, trop gros, types invalides),
fallback sans campagne ouverte.

---

## 6. Flux frontend (livré sessions 46-47)

### 6.1 Banner adhérent dynamique

`src/components/validation/ValidationCampaignBanner.tsx` est intégré dans
le dashboard `/espace-adherent` sous le bandeau suppléant. Au mount, le
composant :

1. Appelle `listCampaigns()` → récupère la campagne courante (`status='open'`).
2. Si aucune campagne ouverte → renvoie `null` (silencieux).
3. Sinon, appelle `listValidationsForOrg(slug)` + `getFleet(slug)` en
   parallèle.
4. Calcule `hasPending` : profil non validé pour `targetYear` OU au moins
   1 navire non validé.
5. Si tout est validé → renvoie `null`.
6. Sinon, calcule l'urgence via `deriveUrgency()` (réplique côté front
   du helper Worker testé) et affiche le bandeau coloré :
   - `open` (> J-14 avant `target_date`) → teal neutre, label « Validation
     annuelle ouverte ».
   - `due-soon` (≤ J-14) → warm orange, label « Deadline approche ».
   - `overdue` (> `target_date`) → rouge, label « Validation en retard ».

CTA principal : `Link` vers `/espace-adherent/validation` avec `aria-label`
explicite. Date de deadline formatée en français (`toLocaleDateString("fr-FR")`).

Mode démo : silencieux (le store `validation-store.ts` retombe sur des
listes vides quand `isApiMode()` est false).

Helper exposé : `<ValidationCampaignBannerForUser companyName={user.company} />`
qui résout le slug via `members.find(m => m.name === companyName)` puis
délègue au composant principal. Évite de demander aux pages d'appel de
faire la résolution slug.

### 6.2 Page `/espace-adherent/validation`

`src/app/(public)/espace-adherent/validation/page.tsx`. Au mount :

- `Promise.all` sur `listCampaigns()` + `listValidationsForOrg(slug)` +
  `getFleet(slug)` (catch silencieux pour la flotte si vide).
- Calcule `targetYear` = `current?.targetYear ?? new Date().getUTCFullYear()`
  (autorise validation hors campagne).
- Calcule `profileAlreadyValidated` et `validatedVesselIds` à partir de
  l'historique reçu.

Rendu :

- **Bandeau campagne** (haut de page) : statut campagne ouverte + deadline,
  ou message « validation hors campagne » si pas de campagne ouverte.
- **Bandeau progression** : compteur d'items à traiter / en attente d'envoi,
  avec bouton « Tout marquer Inchangé » qui marque tous les `pending` →
  `unchanged` en un clic.
- **Carte profil organisation** : affiche email/phone/address/effectifs/navires.
  Si déjà validé pour `targetYear` → badge vert « Déjà validé ». Sinon,
  deux boutons :
  - « Inchangé » → toggle `mode: "unchanged"` (pas de payload `data`).
  - « Modifier » → ouvre `<ProfileEditForm>` inline (sub-form local au
    fichier, 8 inputs mappés sur le snapshot profil + données User
    courantes pour email/phone/address car `Member` ne les expose pas).
- **Cartes navires** : une par navire de la flotte. Boutons identiques.
  « Modifier » ouvre `<FleetVesselForm>` (composant existant, 28 champs
  + `<CrewByBrevetEditor>`).
- **Bandeau sticky en bas** (`sticky bottom-4 z-10`) : compteur d'items
  prêts à envoyer + bouton submit « Valider N item(s) » disabled si 0.

Submit : appelle `submitValidations(slug, items)` avec un payload
`ValidationSubmitItem[]`. Sur succès, refetch l'historique pour mettre à
jour les badges « déjà validé », reset le state local des cartes,
affiche un message confirmation `{validated} item(s) validé(s) pour {targetYear}`.

Empty states explicites : pas de mode API, compagnie inconnue, pas de
flotte. Lien `/espace-adherent/flotte` proposé pour ajouter des navires.

### 6.3 Page `/admin/campagnes`

`src/app/(admin)/admin/campagnes/page.tsx`. Liste toutes les campagnes
récupérées via `listCampaigns()`. Permission staff requise :
`manage_validations` (session 48).

**Carte par campagne** :

- Title : « Campagne {targetYear} ».
- Badge urgence : `deriveUrgency()` → `Brouillon` / `Ouverte` / `Deadline
  proche` / `En retard` / `Cloturée`.
- Métadonnées : deadline, date d'ouverture, date de clôture si applicable.
- Notes éditoriales en italique si présentes.
- Boutons d'action contextuels :
  - `draft` → « Ouvrir » (PATCH `status='open'`, side effect `opened_at=now()`).
  - `open` → « Clôturer » (PATCH `status='closed'`, side effect `closed_at=now()`).
  - `open` ou `closed` → « Tableau de bord » (lien vers
    `/admin/campagnes/detail?id=X`).
- Tous les changements de statut passent par `confirm()` (irréversibles
  côté audit).

**Formulaire « Nouvelle campagne »** (toggle `showForm`) :

- `targetYear` (number, défaut année courante UTC, range 2020-2100).
- `targetDate` (date HTML5, défaut `${currentYear}-03-31`).
- `notes` (textarea optionnelle).
- Checkbox « Ouvrir immédiatement » (sinon créée en `draft`, défaut `true`).

Mode démo : bandeau d'avertissement « la création / mise à jour ne sont
pas persistées ». Empty state explicite si aucune campagne n'existe encore.

AdminSidebar : item « Campagnes validation » (icône `ClipboardCheckIcon`)
sous la section Organisation, gardé par `manage_validations`.

### 6.4 Dashboard `/admin/campagnes/detail?id=X`

Route en query param car static export Next.js ne supporte pas
`dynamicParams=true` (pattern aligné sur `/espace-adherent/votes/detail`).

`Suspense` wrapper + `useSearchParams()` → `<CampaignDashboardClient id={id} />`.

Au mount, `getCampaignDashboard(id)` → réponse `CampaignDashboard` avec :
- `campaign` (la campagne complète)
- `summary` : `orgsTotal`, `orgsFullyValidated`, `vesselsValidated`,
  `vesselsTotal`
- `rows[]` : un par compagnie active

**Header** : statut campagne + deadline. Bouton « Relancer N retardataires »
(visible si au moins 1 retardataire a un email titulaire connu) →
`mailto:` BCC pré-rempli avec :
- Sujet : `Validation annuelle ACF {targetYear} - relance`
- Body : explication + lien direct `https://gaspe-fr.pages.dev/espace-adherent/validation`
- Liste BCC dédupliquée des emails titulaires des orgs `!fullyValidated`.

**4 summary cards** colorées (teal / warm / blue / neutral) avec valeur
+ libellé + sous-titre.

**Filtres** : 3 chips (`Toutes` / `En attente` / `Validées`) avec
compteurs dynamiques.

**Tableau** (5 colonnes : Compagnie / Profil / Navires / État / Contact /
Diff Y-o-Y) :
- En-têtes triables (compagnie / navires / état) avec `aria-pressed` +
  `aria-label` français.
- Cellule navires : compteur `validés/total` + barre de progression teal.
- Lien nom compagnie → fiche publique `/nos-adherents/[slug]`.
- Email titulaire → mailto direct.
- Bouton « Voir le diff » par ligne → ouvre `<SnapshotDiffModal>`
  (session 47, voir § 11).

Empty state si aucune compagnie ne matche le filtre courant.

### 6.5 Tab démo `/decouvrir-espace-adherent`

Onglet `validation` avec :
- Bandeau campagne ouverte 2027 (mocked).
- Barre de progression (4 items fictifs : 1 profil validé + 1 navire
  validé + 2 navires pending).
- Cartes par item avec boutons disabled (cohérent avec le pattern
  démo non-interactive du reste de la page).
- CTA adhésion en bas.

---

## 7. Cycle utilisateur type

**Janvier 2027 – création campagne**
1. Admin GASPE va sur `/admin/campagnes`, clique « Nouvelle campagne ».
2. Saisit `target_year=2027`, `target_date=2027-03-31`.
3. Statut `draft` → admin relit, ajoute notes internes.

**1er février 2027 – ouverture**
1. Admin clique « Ouvrir » → `status='open'`, `opened_at=now()`.
2. Tous les adhérents voient une bannière sur leur dashboard.

**Février-mars 2027 – validations**
1. Adhérent X (Karu'Ferry) clique sur la bannière.
2. Page validation : il coche « Inchangé » sur son profil.
3. Pour son navire « Karu Express », il modifie `passengerCapacity: 250 → 280`.
4. Soumet → 2 lignes dans `validation_history`, 2 UPDATEs sur `last_validated_*`.
5. Bannière disparaît du dashboard.

**31 mars 2027 – deadline molle**
1. Bannière des retardataires passe en `overdue` (rouge).
2. Admin va sur `/admin/campagnes/1`, voit que 6 compagnies n'ont pas validé.
3. Clique « Relancer retardataires » → mailto BCC des 6 titulaires.

**15 avril 2027 – clôture**
1. Quorum atteint (28/30 compagnies validées).
2. Admin clique « Clôturer » → `status='closed'`, `closed_at=now()`.
3. Bannière disparaît même pour les 2 retardataires (campagne fermée).
4. Les retardataires peuvent toujours valider hors campagne (sans `campaign_id`)
   mais sans relance UI.

---

## 8. Sécurité et audit

- **Snapshot immuable** : une fois INSERT dans `validation_history`,
  `snapshot_json` ne peut plus être modifié (pas d'endpoint UPDATE).
- **Trace utilisateur** : `validated_by_user_id` cloue qui a soumis.
  En cas de litige (« je n'ai jamais validé ces chiffres »), la trace remonte
  l'utilisateur exact et son timestamp.
- **Permissions doubles** : frontend filtre les routes (gating UX), Worker
  refuse 403 (gating sécurité). Pas de validation cross-org possible.
- **Pas de DELETE adhérent** : seul l'admin peut supprimer une ligne d'historique
  (et c'est non implémenté pour l'instant – à ajouter si jamais nécessaire pour
  RGPD).

---

## 9. Évolutions futures envisagées

**Livré depuis la rédaction initiale** :
- ✅ Permission staff dédiée `manage_validations` (session 48).
- ✅ Diff Y-o-Y entre snapshots N et N-1 (session 47, cf. § 11).
- ✅ Notifications email Brevo `J+0 ouverture campagne` (session 49,
  cf. § 12) — scaffolding posé, déclenché côté Worker au PATCH
  `status: draft → open`. Best-effort, no-op silencieux si
  `BREVO_API_KEY` absent.

**Backlog restant** :

- **Notifications email J-14 / J+0 deadline / J+14 relance manuelle** :
  nécessitent un déclencheur cron (Cloudflare Workers Cron Triggers) car
  ce sont des envois différés sans action utilisateur. La détection se
  fait par scan quotidien des campagnes `open` avec `target_date` dans
  la fenêtre +/- 14 jours. Hors scope court terme.
- **Override admin** : champ `override_admin INTEGER DEFAULT 0` sur
  `validation_history` pour distinguer les validations faites par l'admin
  GASPE pour le compte d'un adhérent absent.
- **Export PDF** du snapshot annuel par compagnie (« attestation de
  validation annuelle ACF 2027 »). Nécessite une lib (jsPDF / pdf-lib /
  @react-pdf) côté front ou un endpoint Worker dédié qui génère le PDF
  serveur-side.
- **Validation partielle d'un item** : actuellement un navire est validé
  en bloc ; dans le futur on pourrait valider section par section
  (capacités, équipage, environnement) si le besoin émerge.
- **Webhook externe** : notifier ADF/UMA quand le quorum NAO est
  validé (compagnies sous CCN 3228 toutes en `fullyValidated`).

---

## 10. Annexe – choix techniques

### Pourquoi un cache `last_validated_*` sur les tables existantes ?

- Évite N requêtes JOIN sur l'historique à chaque rendu de fiche.
- Lecture O(1) pour le banner et le dashboard.
- Mise à jour atomique (même batch que l'INSERT history).
- Tradeoff accepté : duplication de l'info, mais source de vérité reste
  `validation_history`.

### Pourquoi un INTEGER autoincrement pour campaigns.id ?

Les autres tables récentes (votes, vessels) utilisent TEXT généré côté Worker
(`v-${Date.now()}-${random}`). Pour campaigns le volume est minuscule
(1 ligne/an), l'humain les nomme par `target_year`, et un AUTOINCREMENT évite
un round-trip pour générer l'ID. Cohérent avec `validation_history.id` aussi
en INTEGER AUTOINCREMENT (volume forfaitaire, pas de référence externe).

### Pourquoi pas une table `campaign_targets` ?

On pourrait imaginer une table de jonction `campaign_targets` (campaign_id,
organization_id, status) pour matérialiser explicitement quelles orgs sont
attendues par campagne. Choix retenu : on infère dynamiquement depuis
`organizations WHERE archived = 0` au moment du dashboard. Simple, pas de
sync à maintenir, pas de réindexation à faire si on archive une org en
cours de campagne.

### Pourquoi pas un trigger SQL pour synchroniser last_validated_* ?

D1 ne supporte pas les triggers de manière fiable en remote. La synchro est
faite côté Worker dans le même batch que l'INSERT history, ce qui garantit
l'atomicité.

---

## 11. Diff Y-o-Y (session 47)

### 11.1 Vision

L'admin doit pouvoir **comparer rapidement** les données déclarées d'une
compagnie d'une année sur l'autre. Comme chaque validation enregistre un
`snapshot_json` immuable dans `validation_history`, il suffit de :

1. Récupérer la dernière validation de l'année cible `N` pour chaque item
2. Récupérer la dernière validation de l'année `N-1` pour le même item
3. Comparer champ par champ → liste des modifications

Aucun nouveau endpoint ni nouvelle table : la lecture passe par
`GET /api/organizations/:slug/validations` (déjà existant), et tout le calcul
de diff est purement client-side / pur.

### 11.2 Helper pur `diffSnapshots`

Ajouté à `workers/handlers/validation-helpers.ts` (et dupliqué côté front
dans `src/lib/validation-diff.ts` car `workers/` est exclu du tsconfig front,
ce qui empêche un import direct cross-tree).

```ts
diffSnapshots(
  before: Record<string, unknown> | null,
  after: Record<string, unknown> | null,
  options?: { includeUnchanged?: boolean; excludeFields?: readonly string[] }
): DiffEntry[]
```

**Règles** :
- `null` ou `undefined` traités symétriquement (`before` et `after` `null` →
  `unchanged`, ne crée pas de bruit).
- Comparaison structurelle des objets via `JSON.stringify(sortKeys(...))` →
  l'ordre des clés du JSON est ignoré (utile pour `crewByBrevet`).
- `excludeFields` par défaut : `["id"]` (l'identifiant ne change jamais).
- Tri canonique : `modified` > `added` > `removed` > `unchanged`, puis
  ordre alphabétique du nom de champ.

**Tests** (14 dans `workers/handlers/__tests__/validation-helpers.test.ts`,
soit **333 tests verts** au total) :

- snapshots identiques (avec et sans `includeUnchanged`)
- modifié / ajouté (null→value) / retiré (value→null)
- `null` vs `undefined` symétriques
- nested object (`crewByBrevet`) : équivalence et différence
- ordre des clés JSON ignoré
- `excludeFields` custom
- tri canonique multi-statuts + alphabétique
- inputs `null` gracieux
- conservation des valeurs brutes `before` / `after`

### 11.3 Composant `<SnapshotDiffModal>`

`src/components/validation/SnapshotDiffModal.tsx` — overlay z-50 plein écran.

**Props** :
```ts
{ slug: string; organizationName: string; targetYear: number; onClose: () => void }
```

**Comportement** :
- Au mount, fetch `listValidationsForOrg(slug)` (endpoint existant).
- Filtre les entrées sur `targetYear` et `targetYear - 1`.
- Paire les items par `(itemType, itemId)` → un par profil + un par navire.
- Pour chaque paire : `diffSnapshots(before, after)` → liste des changements.
- Rendu en cartes : tableau 4 colonnes (Champ / N-1 / N / État) avec badges
  status colorés (`warm` modifié, `green` ajouté, `neutral` retiré).
- Tri profil > navires alphabétique.
- Empty states explicites : « pas de validation N-1 » (nouvel item),
  « pas de validation N » (item retiré), « aucun changement » (badge vert).
- Fermeture : touche Échap, click backdrop, bouton « Fermer ». A11y :
  `role="dialog"`, `aria-modal="true"`, `aria-labelledby`.

### 11.4 Intégration

Sur `/admin/campagnes/detail?id=X`, le tableau dashboard contient une
colonne supplémentaire **« Diff Y-o-Y »** avec un bouton « Voir le diff »
par ligne. State local `diffOrg` contrôle l'ouverture du modal.

`aria-label` français explicite par bouton :
`"Voir le diff <N-1> -> <N> de <organizationName>"`.

### 11.5 Dictionnaire de libellés FR

`src/lib/validation-diff.ts` exporte `FIELD_LABELS_FR` qui mappe les noms
techniques (`email`, `phone`, `passengerCapacity`, `crewByBrevet`...) à
leurs libellés français pour l'affichage. 15 entrées au total.

Le helper `formatDiffValue(value)` rend une valeur de snapshot en chaîne
lisible : `null/undefined → "—"`, `boolean → "Oui"/"Non"`, `object →
JSON.stringify`, sinon `String(value)`.

---

## 12. Notification email J+0 ouverture campagne (session 49)

### 12.1 Vision

Quand l'admin ACF passe une campagne de `draft` à `open` (ou la crée
directement avec `status='open'`), tous les **titulaires actifs** des
compagnies adhérentes reçoivent un email transactionnel les informant
de l'ouverture, avec :

- Année cible (`target_year`)
- Deadline molle si renseignée
- Notes éditoriales si renseignées
- CTA direct vers `/espace-adherent/validation`

L'envoi est **best-effort** : un échec Brevo (rate-limit, secret
manquant, destinataire bounced) ne fait pas échouer le PATCH /
POST campaign. Les erreurs sont loggées via `console.error`.

### 12.2 Implémentation

`workers/api.ts` expose un helper privé `notifyCampaignOpened(env, campaign)`
appelé depuis :

- `handleCreateCampaign` quand `row.status === "open"` (création directe
  via la checkbox « Ouvrir immédiatement »).
- `handleUpdateCampaign` quand `row.status === "open"` ET
  `existing.status !== "open"` (transition draft → open).

Le helper :

1. Vérifie `env.BREVO_API_KEY` → no-op silencieux si absent (dev local
   ou prod sans secret configuré).
2. Requête D1 : tous les `users` avec `is_primary=1`, `archived=0`,
   `email IS NOT NULL`, joints aux `organizations` actives (`archived=0`).
3. Pour chaque destinataire, appelle `https://api.brevo.com/v3/smtp/email`
   séquentiellement (rate-limit safety, < 30 destinataires en pratique).
4. Compte `sent` / `skipped` et logge le bilan.

### 12.3 Template HTML

`renderCampaignOpenedEmailHtml(params)` génère un email transactionnel
charté ACF (gradient teal, header avec logo texte + baseline, CTA
proéminent, footer institutionnel). Sanitization des champs dynamiques
(`userName`, `orgName`, `targetDateStr`, `notes`) via le helper
`sanitize()` existant.

Sender : `ACF (ex-GASPE) <ne-pas-repondre@gaspe.fr>`.
Sujet : `Validation annuelle {targetYear} ouverte – ACF`.

### 12.4 Audience

Volontairement large : toutes les compagnies actives (pas de filtre
`college` ou `social3228` comme pour les votes). Justification : la
validation annuelle concerne le profil + la flotte qui sont déclarés
par toutes les compagnies adhérentes, indépendamment de leur audience
de gouvernance.

### 12.5 Reste à faire (non livré session 49)

- **J-14 deadline** et **J+0 deadline** : nécessitent un Cloudflare
  Workers Cron Trigger pour scanner quotidiennement les campagnes `open`
  avec `target_date` dans la fenêtre. Hors scope court terme.
- **J+14 relance manuelle** : déjà disponible côté UI via le bouton
  « Relancer N retardataires » du dashboard (mailto BCC), pas besoin
  d'automatisation supplémentaire.

---

**Auteur** : Sessions 45-49 (claude/annual-data-validation-XqYQe)
**Migrations livrées** : 0027, 0028, 0029
**Endpoints livrés** : 6 (campaigns CRUD + dashboard + history + submit)
**Helpers purs** : 8 fonctions (7 session 45 + `diffSnapshots` session 47),
**61 tests unitaires** (47 session 45 + 14 session 47)
**Frontend** : sessions 46-47 (banner adhérent, page validation, admin
campagnes, dashboard, modal diff Y-o-Y, tab démo)
**Notifications email** : session 49 (J+0 ouverture campagne, best-effort
via `notifyCampaignOpened` côté Worker, no-op silencieux si BREVO_API_KEY
absent)
**RBAC** : session 48 (permission staff dédiée `manage_validations`)
