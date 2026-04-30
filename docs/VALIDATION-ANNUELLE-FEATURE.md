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
| Lister campagnes | ✓ | `manage_organizations` | ✗ | ✗ | ✗ |
| Créer/PATCH campagne | ✓ | `manage_organizations` | ✗ | ✗ | ✗ |
| Voir dashboard campagne | ✓ | `manage_organizations` | ✗ | ✗ | ✗ |
| Lire historique org X | ✓ | `manage_organizations` | ✓ (orgX) | ✗ | ✗ |
| Valider items org X | ✓ | `manage_organizations` (override) | ✓ (orgX, tout user) | ✗ | ✗ |

**Note staff** : la permission `manage_organizations` (lot 9 session 39)
englobe toutes les actions admin sur orgs et flottes. On la réutilise plutôt
que d'inventer `manage_validations`. Si besoin de finesse plus tard, ajouter
`manage_validations` en migration future.

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

## 6. Flux frontend (session 46+)

### 6.1 Banner adhérent

Sur `/espace-adherent` (dashboard), si une campagne est `open` ET que l'org
a au moins 1 item non validé pour `target_year` → afficher une bannière en
haut de page :
- État `due-soon` (J-14 avant `target_date`) → couleur orange
- État `overdue` (après `target_date`) → couleur rouge
- État `open` (avant J-14) → couleur teal neutre

CTA : « Valider mes données 2027 » → `/espace-adherent/validation`.

### 6.2 Page `/espace-adherent/validation`

- Récupère `GET /api/organizations/:slug/validations` pour pré-remplir l'état.
- Affiche : 1 carte « Profil organisation » + N cartes « Navire X ».
- Chaque carte propose deux boutons :
  - « Inchangé depuis l'an dernier » → soumet `unchanged: true` sans data
  - « Modifier » → ouvre éditeur inline (réutilise `<FleetVesselForm>` pour
    les navires, formulaire profil pour l'org)
- Bouton final « Tout valider d'un coup » : envoie tous les items `unchanged`
  en une seule requête POST.

### 6.3 Page admin `/admin/campagnes`

- Liste toutes les campagnes (carte par campagne avec status, target_year,
  target_date, opened_at).
- Bouton « Nouvelle campagne » → modal avec target_year + target_date.
- Bouton « Ouvrir » sur draft → bascule status='open'.
- Bouton « Clôturer » sur open → bascule status='closed'.
- Bouton « Voir le dashboard » → ouvre `/admin/campagnes/:id`.

### 6.4 Dashboard admin `/admin/campagnes/:id`

- Tableau (compagnie, profil, navires, dernière activité, mailto)
- Bouton « Relancer retardataires » → génère mailto BCC avec les emails des
  titulaires des orgs `vesselsValidated < vesselsTotal OR profileValidated=false`.
- Vue alternative « Y-o-Y diff » : compare snapshot 2026 vs snapshot 2027 sur
  les 8 champs profil et les 30 colonnes navire.

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

- **Override admin** : champ `override_admin INTEGER DEFAULT 0` sur
  `validation_history` pour distinguer les validations faites par l'admin
  GASPE pour le compte d'un adhérent absent.
- **Notifications email** : déclencher un email Brevo à J+0 ouverture campagne,
  J-14 deadline, J+0 deadline, J+14 relance manuelle.
- **Export PDF** du snapshot annuel par compagnie (« attestation de validation
  annuelle ACF 2027 »).
- **Validation partielle d'un item** : actuellement un navire est validé en
  bloc ; dans le futur on pourrait valider section par section (capacités,
  équipage, environnement) si le besoin émerge.
- **Webhook externe** : notifier ADF/UMA quand le quorum NAO est validé.

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

**Auteur** : Session 45 (claude/annual-data-validation-XqYQe)
**Migrations livrées** : 0027, 0028, 0029
**Endpoints livrés** : 6 (campaigns CRUD + dashboard + history + submit)
**Helpers purs** : 7 fonctions, ~30 tests unitaires
**Frontend** : reporté en sessions 46+
