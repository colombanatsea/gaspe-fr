-- 0038_organizations_b5_split_revenue.sql
-- Session 55 — B5 + C3 du test utilisateur post-launch
-- (docs/POST-LAUNCH-FEEDBACK-2026.md).
--
-- 4 nouveaux champs sur la table organizations :
--   - employee_count_navigant (INTEGER) : effectif personnel navigant
--   - employee_count_sedentaire (INTEGER) : effectif personnel sédentaire
--     (split du legacy `employee_count` qui restait pertinent comme total
--     mais ne distinguait pas les 2 catégories — feedback C3).
--   - annual_revenue_eur (INTEGER) : chiffre d'affaires annuel en euros
--     (entier pour éviter les arrondis, libellé « M€ » côté UI).
--   - revenue_confidential (INTEGER 0/1, default 0) : flag confidentialité
--     CA. Si vrai, l'UI affiche un cadenas et masque le montant en
--     lecture publique.
--
-- ALTER ADD COLUMN safe (idempotent via le workflow phase 1 qui catch
-- duplicate column en `::warning::`).

ALTER TABLE organizations ADD COLUMN employee_count_navigant INTEGER;
ALTER TABLE organizations ADD COLUMN employee_count_sedentaire INTEGER;
ALTER TABLE organizations ADD COLUMN annual_revenue_eur INTEGER;
ALTER TABLE organizations ADD COLUMN revenue_confidential INTEGER DEFAULT 0;
