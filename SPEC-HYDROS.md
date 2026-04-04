# SPEC-HYDROS — Publication automatique des offres d'emploi sur Hydros Alumni

## Contexte

Les adhérents du GASPE publient des offres d'emploi via `/espace-adherent/offres`. Ces offres doivent être **automatiquement relayées sur le jobboard Hydros Alumni** (hydros-alumni.org), le réseau des anciens de l'ENSM (École Nationale Supérieure Maritime).

Hydros Alumni utilise la plateforme **AlumnForce** avec :
- Éditeurs Froala (rich text)
- Dropdowns Chosen.js avec IDs numériques
- PostLinks AJAX pour la soumission
- Authentification par cookie AFSESSID + JWT

### URL de l'offre publiée en test
`https://www.hydros-alumni.org/fr/jobboard/offer/cdi/technicien-naval-bacs-electromecanicien-f-h/518`

---

## 1. Bugs existants à corriger

### 1.1. `applicationUrl` collecté mais jamais sauvegardé

**Fichier** : `src/app/(admin)/admin/offres/new/page.tsx`
**Lignes** : 40 (dans le form state), 274-282 (champ rendu), 62-79 (objet Job créé)

Le formulaire admin collecte `applicationUrl` mais ne l'inclut pas dans l'objet `Job` sauvegardé. Le champ n'existe même pas dans l'interface `Job`.

**Action** : Ajouter `applicationUrl` à l'interface `Job` et l'inclure dans la sauvegarde.

### 1.2. `zone` hardcodée à `'normandie'` dans le formulaire admin

**Fichier** : `src/app/(admin)/admin/offres/new/page.tsx`, ligne 69
**Action** : Ajouter un select `zone` au formulaire admin (comme dans le formulaire adhérent).

### 1.3. Type `contractType` trop restrictif

**Fichier** : `src/data/jobs.ts`, ligne 22
```typescript
contractType: 'CDI' | 'CDD' | 'Saisonnier';
```
Le formulaire admin propose `Stage` et `Alternance` (ligne 15), mais le type ne les accepte pas.

**Action** : Élargir le type.

---

## 2. Champs à ajouter à l'interface `Job`

**Fichier** : `src/data/jobs.ts`, lignes 14-35

### Champs nécessaires pour la publication Hydros Alumni

```typescript
export interface Job {
  // --- Champs existants (inchangés) ---
  id: string;
  slug: string;
  title: string;
  company: string;
  companySlug: string;
  location: string;
  zone: Zone;
  contractType: 'CDI' | 'CDD' | 'Saisonnier' | 'Stage' | 'Alternance' | 'Autres';
  category: string;
  brevet?: string;
  description: string;
  profile: string;
  conditions: string;
  contactEmail: string;
  contactName?: string;
  salaryRange?: string;
  salaryMin?: number;
  publishedAt: string;
  expiresAt?: string;
  published: boolean;

  // --- Nouveaux champs ---
  applicationUrl?: string;        // URL externe de candidature
  reference?: string;             // Référence interne de l'offre (ex: VP-134-26/P08192)
  startDate?: string;             // Date/mois de début (ex: "Immédiat", "Septembre 2026")
  contactFirstName?: string;      // Prénom du contact (séparé pour Hydros)
  contactLastName?: string;       // Nom du contact
  contactPhone?: string;          // Téléphone du contact
  handiAccessible?: boolean;      // Offre handi-accueillante

  // --- Champ de suivi cross-publication ---
  hydrosOfferUrl?: string;        // URL de l'offre publiée sur Hydros (rempli après publication)
  hydrosOfferId?: string;         // ID Hydros Alumni (ex: "518")
}
```

### Champs Hydros Alumni qu'on peut hardcoder (pas besoin de les collecter)

| Champ Hydros | Valeur fixe | Raison |
|---|---|---|
| `sector_id` | `3000381` (Transports) | Toutes nos offres sont dans le transport maritime |
| `remote_id` | `3000432` (Sur site uniquement) | Métiers embarqués = sur site |
| `begin` | `3000409` (Immédiat) par défaut | Sauf si `startDate` renseigné |
| `company_sector_id` | `3000381` (Transports) | Idem |
| `contact_consent` | `true` | Assumé par l'acte de publication |

---

## 3. Champs à ajouter aux formulaires

### 3.1. Formulaire adhérent (`/espace-adherent/offres`)

**Fichier** : `src/app/(public)/espace-adherent/offres/page.tsx`

Ajouter à `JobOffer` (ligne 22) et au form `emptyForm` (ligne 54) :

| Champ | Type input | Label | Obligatoire | Notes |
|---|---|---|---|---|
| `reference` | text | Référence de l'offre | Non | Ex: "RH-2026-042" |
| `applicationUrl` | url | URL de candidature externe | Non | Si vide, on utilise contactEmail |
| `startDate` | select | Début de la mission | Non | Options: Immédiat, Mois (Jan-Déc), Non précisé |
| `expiresAt` | date | Date de fin de publication | Non | Défaut: +45 jours |
| `contactPhone` | tel | Téléphone de contact | Non | |
| `handiAccessible` | checkbox | Offre handi-accueillante | Non | |

**Le `contactEmail` doit être pré-rempli avec l'email de l'adhérent connecté** (`user.email`). C'est déjà le cas (ligne 154 : `contactEmail: form.contactEmail || user.email`).

**Le `contactFirstName` et `contactLastName` doivent être tirés de `user.firstName` / `user.lastName`** (déjà disponibles dans le contexte auth).

### 3.2. Formulaire admin (`/admin/offres/new`)

**Fichier** : `src/app/(admin)/admin/offres/new/page.tsx`

Mêmes champs que le formulaire adhérent + ajouter :
- `zone` (select, actuellement hardcodé)
- Corriger la sauvegarde de `applicationUrl`

### 3.3. Interface `JobOffer` de l'espace adhérent

**Fichier** : `src/app/(public)/espace-adherent/offres/page.tsx`, ligne 22

Aligner `JobOffer` avec `Job` en ajoutant les nouveaux champs. À terme, unifier les deux interfaces.

---

## 4. Description de l'entreprise

Hydros Alumni a un champ `company_description` (Présentation de l'entreprise). 

**Notre source** : `members.ts` → champ `description?: string` de l'interface `Member`.

### Actions :
1. **Enrichir `members.ts`** : S'assurer que chaque membre a une `description` HTML renseignée (actuellement optionnel et souvent absent).
2. **Lors de la publication Hydros** : Utiliser `member.description` comme `company_description`. Si absent, générer un texte par défaut :
   > "{member.name}, compagnie maritime adhérente du GASPE, basée à {member.city} ({member.region})."

---

## 5. Mapping des valeurs vers les IDs Hydros Alumni

Créer un fichier `src/lib/hydros-mapping.ts` :

```typescript
/** Mapping GASPE → Hydros Alumni dropdown IDs */

export const HYDROS_CONTRACT_TYPE: Record<string, string> = {
  'CDI': '3000295',
  'CDD': '3000296',
  'Stage': '3000297',
  'Alternance': '3000297',  // Stage dans Hydros
  'Saisonnier': '3000296',  // CDD dans Hydros
  'Autres': '3000299',
};

export const HYDROS_POSITION: Record<string, string> = {
  'Pont': '3000209',        // Directeur d'exploitation
  'Machine': '3000210',     // Responsable maintenance / logistique
  'Technique': '3000214',   // Ingénieur technique / de production
  'Personnel hôtelier': '3000299', // Autres
  'Personnel à terre': '3000203',  // Directeur d'unité décentralisée
  'Direction': '3000197',   // Directeur (général)
  'Autre': '3000299',       // Autres
};

export const HYDROS_SALARY: Record<string, string> = {
  // Mapping approximatif basé sur les plages textuelles
  // Sera affiné si on structure le salaire en tranches
};

export const HYDROS_BEGIN: Record<string, string> = {
  'Immédiat': '3000409',
  'Non précisé': '3000410',
  'Janvier': '3000411',
  'Février': '3000412',
  'Mars': '3000413',
  'Avril': '3000414',
  'Mai': '3000415',
  'Juin': '3000416',
  'Juillet': '3000417',
  'Août': '3000418',
  'Septembre': '3000419',
  'Octobre': '3000420',
  'Novembre': '3000421',
  'Décembre': '3000422',
};

export const HYDROS_FIXED = {
  SECTOR_TRANSPORTS: '3000381',
  REMOTE_ON_SITE: '3000432',
};
```

---

## 6. Processus de publication automatique

### 6.1. Déclenchement

Quand un adhérent **publie une offre** (clic "Publier" dans `/espace-adherent/offres`), ou quand un admin publie via `/admin/offres/new` :

1. L'offre est sauvegardée localement (existant)
2. **Nouveau** : Appel à un endpoint Worker CF pour publier sur Hydros Alumni
3. Le `hydrosOfferUrl` retourné est stocké dans l'offre

### 6.2. Architecture cible

```
Adhérent publie offre
        │
        ▼
  localStorage (existant)
        │
        ▼
  POST /api/hydros/publish   ◄── Nouveau endpoint CF Worker
        │
        ├── Login Hydros Alumni (email/password ou cookie)
        ├── POST formulaire avec les champs mappés
        ├── Récupère l'URL de l'offre publiée
        │
        ▼
  Retour hydrosOfferUrl au front
        │
        ▼
  Affichage badge "Publié sur Hydros Alumni" + lien
```

### 6.3. Endpoint Worker : `POST /api/hydros/publish`

**Fichier** : `workers/api.ts` (nouveau endpoint)

```typescript
// Payload attendu
interface HydrosPublishPayload {
  // Contenu de l'offre
  title: string;
  description: string;           // HTML
  profile: string;               // HTML
  companyDescription: string;    // HTML
  reference?: string;
  
  // Métadonnées
  contractType: string;          // Clé GASPE (CDI, CDD, etc.)
  category: string;              // Clé GASPE (Pont, Machine, etc.)
  location: string;
  startDate?: string;
  expiresAt?: string;            // Date format jj/mm/aaaa
  handiAccessible?: boolean;
  
  // Contact (adhérent)
  contactFirstName: string;
  contactLastName: string;
  contactEmail: string;
  contactPhone?: string;
  applicationUrl?: string;
}

// Réponse
interface HydrosPublishResponse {
  success: boolean;
  hydrosOfferUrl?: string;       // URL publique de l'offre
  hydrosOfferId?: string;        // ID numérique
  error?: string;
}
```

### 6.4. Credentials Hydros Alumni

Les credentials sont stockés comme **secrets Worker** :
- `HYDROS_EMAIL` : email du compte GASPE sur Hydros Alumni
- `HYDROS_PASSWORD` : mot de passe
- Alternative : `HYDROS_COOKIE` si cookie longue durée disponible

**Le Worker se connecte via l'API login** (`POST /fr/login` avec `Connexion avec email`), récupère le cookie de session, puis effectue la publication.

---

## 7. Affichage côté front

### 7.1. Badge "Publié sur Hydros Alumni"

Dans la liste des offres adhérent (`/espace-adherent/offres`), afficher un badge si `hydrosOfferUrl` est renseigné :

```tsx
{offer.hydrosOfferUrl && (
  <a href={offer.hydrosOfferUrl} target="_blank" rel="noopener noreferrer"
     className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline">
    <span>🔗</span> Publiée sur Hydros Alumni
  </a>
)}
```

### 7.2. Page détail de l'offre publique

Dans `/nos-compagnies-recrutent/[slug]/page.tsx`, ajouter :
- Lien `applicationUrl` si renseigné (bouton "Postuler sur le site de l'entreprise")
- Affichage de `reference` dans les détails
- Affichage de `contactPhone` si renseigné
- Lien vers l'offre Hydros Alumni si disponible

---

## 8. Récapitulatif des fichiers à modifier

| Fichier | Modification |
|---|---|
| `src/data/jobs.ts` | Ajouter champs à `Job`, élargir `contractType` |
| `src/types/index.ts` | Re-export des nouveaux types |
| `src/app/(public)/espace-adherent/offres/page.tsx` | Ajouter champs au form + `JobOffer` + publication Hydros |
| `src/app/(admin)/admin/offres/new/page.tsx` | Fix `applicationUrl`, ajouter `zone`, nouveaux champs |
| `src/app/(public)/nos-compagnies-recrutent/[slug]/page.tsx` | Afficher `applicationUrl`, `reference`, `contactPhone` |
| `src/components/jobs/JobCard.tsx` | Afficher badge Hydros si publié |
| `src/components/jobs/JobDetailActions.tsx` | Bouton "Postuler" vers `applicationUrl` |
| `src/data/members.ts` | Enrichir `description` pour chaque membre |
| `src/lib/hydros-mapping.ts` | **Nouveau** — Mapping IDs Hydros Alumni |
| `workers/api.ts` | **Nouveau endpoint** `POST /api/hydros/publish` |

---

## 9. Options de début de mission (nouveau select)

```typescript
export const START_DATE_OPTIONS = [
  { value: 'Immédiat', label: 'Immédiat' },
  { value: 'Non précisé', label: 'Non précisé' },
  { value: 'Janvier', label: 'Janvier' },
  { value: 'Février', label: 'Février' },
  { value: 'Mars', label: 'Mars' },
  { value: 'Avril', label: 'Avril' },
  { value: 'Mai', label: 'Mai' },
  { value: 'Juin', label: 'Juin' },
  { value: 'Juillet', label: 'Juillet' },
  { value: 'Août', label: 'Août' },
  { value: 'Septembre', label: 'Septembre' },
  { value: 'Octobre', label: 'Octobre' },
  { value: 'Novembre', label: 'Novembre' },
  { value: 'Décembre', label: 'Décembre' },
];
```

---

## 10. Tests à ajouter

| Test | Fichier |
|---|---|
| Mapping contract types GASPE → Hydros IDs | `src/lib/__tests__/hydros-mapping.test.ts` |
| Interface Job accepte les nouveaux champs | `src/data/__tests__/jobs.test.ts` |
| Formulaire adhérent sauvegarde tous les champs | `src/app/(public)/espace-adherent/__tests__/offres.test.ts` |
| Formulaire admin sauvegarde `applicationUrl` | `src/app/(admin)/admin/__tests__/offres-new.test.ts` |

---

## 11. Migration des offres existantes

Les 11 offres statiques dans `src/data/jobs.ts` n'ont pas les nouveaux champs. Ils sont tous optionnels (`?`) donc **pas de migration nécessaire** — les valeurs seront `undefined` et le code doit gérer leur absence.

---

## 12. Priorité d'implémentation

1. **P0 — Bug fixes** : `applicationUrl` perdu, `contractType` trop restrictif
2. **P1 — Nouveaux champs** : Ajouter à `Job`, aux formulaires admin et adhérent
3. **P2 — Hydros mapping** : Fichier de correspondance des IDs
4. **P3 — Worker endpoint** : Publication automatique via API
5. **P4 — Affichage** : Badge Hydros, lien applicationUrl, reference, contactPhone
6. **P5 — Descriptions membres** : Enrichir `members.ts` avec descriptions HTML
