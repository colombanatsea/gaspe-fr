# GASPE Website — Handoff Session 17

## État actuel : v2.3.0 — Build OK, 94 pages, 0 erreurs TypeScript, 79 tests

### Branch : `main` (merged from `claude/review-project-status-rYy52`)

---

## Résumé session 17

### Chantier 1 — Tests & CI
1. **Vitest** — 79 tests unitaires (hash, matching, sanitize-html, geolocation, utils, Zod schemas, cms-store, members-store)
2. **GitHub Actions CI** — `.github/workflows/ci.yml` : typecheck → lint → test → build
3. **E2E enrichis** — 3 nouveaux specs Playwright (candidate-space, adherent-space, admin-crud)

### Chantier 2 — Fiabilisation
4. **Zod validation** — schemas.ts + safeParse() sur tous les localStorage reads (auth, CMS, members)
5. **ErrorBoundary** — Globe 3D, Leaflet Map, RichTextEditor (fallback gracieux + retry)
6. **AuthContext refactoré** — types.ts (108L) + storage.ts (62L) + auth-store.ts (AuthStore interface) + AuthContext.tsx (165L)
7. **AuthStore abstraction** — interface swappable (LocalStorageAuthStore actuel, prêt pour NextAuth + D1)

### Chantier 3 — Consolidation
8. **Types centralisés** — types/index.ts re-exporte User, Job, Zone, MatchResult, MediaItem, StoredMember
9. **Design system** — 0 hex hardcodée dans les composants, 3 gradient CSS variables ajoutées
10. **Aria-labels** — 4 file inputs corrigés, role="dialog" sur toutes les modales
11. **Perf** — Mapbox supprimé (~500KB), font preload, loading="lazy" systématique

### Chantier 4 — Recrutement ↔ Boîte à outils
12. **10 guides employeur** — apprentissage, aides France Travail, contrat pro, visite médicale, STCW recyclage, OPCO, DUERP, ENIM, prévoyance, transition énergie
13. **Liens contextuels** — espace-adherent/offres, admin/offres, nos-compagnies-recrutent, détail offre

### Chantier 5 — Audit & corrections
14. **Audit sécurité** — XSS fixé (sanitizeHtml sur CMS), session fixation renforcée, CSP documentée
15. **Audit fonctionnel** — validation email inscription, bg-white → bg-surface, metadata SEO ajoutée
16. **Audit a11y** — modales role="dialog", alt text, aria-labels complets

---

## Audit technique — Résultats

### Résolu (session 17)
| Sévérité | Issue | Correction |
|----------|-------|------------|
| CRITICAL | XSS HeroSection/CTASection | sanitizeHtml() ajouté |
| HIGH | Mapbox inutilisé (~500KB) | npm uninstall |
| HIGH | Session connexion sans try/catch | try/catch + optional chaining |
| HIGH | Metadata manquante | layout.tsx créés |
| MEDIUM | bg-white dans formulaires | → bg-surface |
| MEDIUM | Modales sans role="dialog" | role="dialog" aria-modal="true" |
| MEDIUM | Validation email inscription | regex email check |
| MEDIUM | Hex hardcodées | → CSS variables |

### Connu mais non résolvable sans infra
| Sévérité | Issue | Raison |
|----------|-------|--------|
| CRITICAL | Passwords en localStorage | Nécessite backend (NextAuth + D1) |
| CRITICAL | Rôles client-side modifiables | Nécessite server-side auth |
| HIGH | CSP unsafe-inline/eval | Requis par Next.js hydration |
| HIGH | File upload sans magic bytes | Nécessite serveur (R2 Worker) |
| MEDIUM | Pas de CSRF tokens | Nécessite backend stateful |

---

## Tests automatisés

### Unit tests (Vitest) — 79 tests, 8 fichiers
| Fichier | Tests | Couvre |
|---------|-------|-------|
| hash.test.ts | 12 | SHA-256 hashing, vérification, détection plaintext |
| matching.test.ts | 10 | Score matching STCW, supersedes, zone, catégorie |
| sanitize-html.test.ts | 11 | XSS, scripts, event handlers, javascript: URLs |
| geolocation.test.ts | 8 | Haversine, formatDistance |
| utils.test.ts | 8 | slugify, formatDate |
| schemas.test.ts | 18 | Zod schemas User/Media/Page/Member, safeParse |
| cms-store.test.ts | 5 | CRUD media + pages |
| members-store.test.ts | 5 | Seeding, archivage, fallback corrupted data |

### E2E tests (Playwright) — 9 fichiers
| Fichier | Tests | Couvre |
|---------|-------|-------|
| pages.spec.ts | 40+ | Toutes pages publiques, SSG, auth, dark mode, SEO |
| auth.spec.ts | 4 | Login, inscription |
| homepage.spec.ts | 3 | Hero, sections, navigation |
| recruitment.spec.ts | 3 | Filtres, cartes offres |
| contact.spec.ts | 2 | Formulaire, validation |
| formations.spec.ts | 5 | Listing, pages détail |
| candidate-space.spec.ts | 3 | Dashboard, formations, redirect auth |
| adherent-space.spec.ts | 5 | Dashboard, profil, annuaire, documents, offres |
| admin-crud.spec.ts | 11 | Toutes les routes admin |

---

## Tests manuels à effectuer

### Parcours critique
- [ ] **Connexion admin** : admin@gaspe.fr / admin123 → dashboard
- [ ] **Inscription candidat** : formulaire → auto-login → dashboard candidat
- [ ] **Inscription adhérent** : formulaire → message "en attente" → admin approve → login
- [ ] **Publier une offre** (adhérent) : espace-adherent/offres → nouvelle offre → visible sur /nos-compagnies-recrutent
- [ ] **Postuler** (candidat) : détail offre → bouton Postuler → pipeline candidature

### Navigation & UX
- [ ] **Homepage** : globe 3D charge, stats animées, marquee défile, carte preview
- [ ] **Carte adhérents** : markers cliquables, popups, géolocalisation "Autour de moi"
- [ ] **Dark mode** : toggle dans header, toutes les pages restent lisibles
- [ ] **Mobile** : menu hamburger, sidebar admin, formulaires, touch targets
- [ ] **Boîte à outils** : 7 onglets fonctionnels, simulateur salaire, guides employeur (liens externes)

### Sécurité
- [ ] **XSS test** : dans CMS admin/pages, insérer `<script>alert(1)</script>` → doit être strippé à l'affichage
- [ ] **Validation email** : inscription avec "abc" → erreur format
- [ ] **Upload CV** : uploader un .exe → doit être refusé
- [ ] **Rôle admin** : en mode déconnecté, aller sur /admin → doit rediriger vers /connexion

### Performance
- [ ] **Lighthouse** : lancer audit sur / et /nos-compagnies-recrutent (cibles : perf >85, a11y >90, SEO >90)
- [ ] **Offline** : couper le réseau → page offline.html doit s'afficher
- [ ] **Temps de chargement** : première visite < 3s sur 4G

---

## TODO session 18

### P0 — Infrastructure (nécessite Wrangler CLI + CF Dashboard)
| # | Tâche | Détail |
|---|-------|--------|
| 1 | Migrer auth vers serveur | NextAuth + D1 (résout CRITICAL: roles client-side) |
| 2 | Déployer CF Worker | D1 + R2 + Resend (email réel, upload CV, documents) |
| 3 | Domaine gaspe.fr | CF Pages Custom Domain → DNS |

### P1 — Améliorations
| # | Tâche | Détail |
|---|-------|--------|
| 1 | CSP nonce-based | Remplacer unsafe-inline (si possible avec Next.js) |
| 2 | File upload magic bytes | Validation server-side via R2 Worker |
| 3 | Lighthouse 95+ | Audit perf, critical CSS, image optimization |
| 4 | Messagerie in-app | Notifications temps réel entre admin/adhérents |

### P2 — Features
| # | Tâche | Détail |
|---|-------|--------|
| 1 | Analytics dashboard admin | Graphiques visites, candidatures, offres |
| 2 | Blog SEO | Articles avec markdown, catégories, recherche |
| 3 | Chatbot maritime IA | Assistant FAQ basé sur les données CCN/STCW |

---

## Prompt pour lancer la session 18

```
Continue GASPE Website session 18. Voir HANDOFF.md section "TODO session 18" pour les priorités.

Contexte :
- v2.3.0, 94 pages, 0 erreurs TS, 79 tests unitaires, 9 specs E2E
- CI GitHub Actions actif
- AuthStore interface prête pour migration NextAuth
- Zod validation sur tous les localStorage reads
- Audit sécurité + fonctionnel complété, corrections appliquées
- Sessions 1-17 mergées sur main

Priorité P0 : migration auth serveur + déploiement CF Worker
Priorité P1 : CSP, upload validation, Lighthouse
Priorité P2 : analytics, blog, chatbot
```
