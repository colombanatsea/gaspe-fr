# Migrations manuelles (UPDATE / DELETE sur seed)

Ce dossier contient les migrations qui **ne sont pas rejouées automatiquement
à chaque push sur `main`**.

Ce sont des migrations qui pourraient **écraser des données utilisateur** :
typiquement des `UPDATE` ou `INSERT OR REPLACE` qui réinitialisent des champs
modifiables via l'interface admin (collège A/B/C, slug, archive).

## Pourquoi cette séparation ?

Cf. `docs/PRODUCTION-SAFETY-2026.md` § C.1 et § E.

Avant la session 54, le workflow `.github/workflows/deploy-worker.yml`
ré-appliquait **toutes** les migrations à chaque push `main`. En prod, dès
qu'un admin éditait via `/admin/adherents` un champ comme `college` ou un
`slug`, le push suivant écrasait silencieusement l'édition.

À partir de la session 54 (P0-5 du rapport), ces migrations sont déplacées
ici et ne sont rejouées qu'**explicitement** via `workflow_dispatch` avec
l'input `apply_manual_migrations=true`.

## Convention de nommage

Les fichiers gardent leur numérotation d'origine pour respecter l'ordre
chronologique. Le dossier `_manual/` suffit à les exclure de la phase 1
auto du workflow.

## Exécution manuelle

### Option A — via GitHub Actions

1. Aller dans **Actions** → **Deploy Worker** → bouton **Run workflow**.
2. Cocher la case **« Apply manual migrations »**.
3. Lancer.

### Option B — via wrangler local (recommandé pour audit)

```bash
# 1. Backup D1 explicite (toujours faire avant)
wrangler d1 export gaspe-db --remote --output backup-$(date -u +%Y%m%d-%H%M%S).sql

# 2. Exécuter la migration ciblée
wrangler d1 execute gaspe-db --remote \
  --file workers/migrations/_manual/0014_archive_keolis_bordeaux.sql \
  --config workers/wrangler.toml

# 3. Vérifier
wrangler d1 execute gaspe-db --remote \
  --command "SELECT slug, archived FROM organizations WHERE slug='keolis-bordeaux-metropole'"
```

## Liste des migrations actuellement dans `_manual/`

| Fichier | Effet | Risque si re-joué |
|---------|-------|-------------------|
| `0014_archive_keolis_bordeaux.sql` | `UPDATE archived = 1 WHERE slug='keolis-bordeaux-metropole'` | Si admin a réintégré Kéolis depuis, le re-archive |
| `0016_organization_college.sql` | `UPDATE college, social3228 WHERE slug IN (…)` × 3 (A/B/C) | Écrase les promotions/rétrogradations admin via UI |
| `0025_repair_data.sql` | revert slug TMC + UPDATE college + INSERT OR IGNORE seed | Revert un slug renommé via UI + ré-écrit les colleges |

## Checklist avant exécution manuelle

- [ ] Backup D1 fait (`wrangler d1 export`)
- [ ] Diff connu (vérifier ce que la migration va changer en lecture)
- [ ] Validation équipe (slack / mail)
- [ ] Smoke test prod préparé (`bash scripts/smoke-test-prod.sh`)
- [ ] Plan de rollback documenté (restore depuis backup)
