-- 0046 — Visibilité des réponses + créneaux horaires pour les votes
--
-- Sessions 71 (19/05/2026). Deux flags ALTER ADD idempotents côté admin :
--   show_responses_to_voters : si 1, les votants voient les résultats
--     agrégés (nb réponses par option, option la plus votée) dès qu'ils
--     ont eux-mêmes voté. Si 0 (défaut), seul l'admin voit.
--   include_time : si 1 et type = date_selection, les options sont des
--     datetimes ISO "YYYY-MM-DDTHH:mm" au lieu de dates seules. L'UI
--     adhérent affiche l'heure et l'admin saisit via input datetime-local.
--
-- ALTER ADD COLUMN tolère les re-runs (le runner CI catch via grep
-- "duplicate column name"). Aucun UPDATE de seed nécessaire : DEFAULT 0
-- s'applique aux lignes existantes.

ALTER TABLE votes ADD COLUMN show_responses_to_voters INTEGER NOT NULL DEFAULT 0;
ALTER TABLE votes ADD COLUMN include_time INTEGER NOT NULL DEFAULT 0;
