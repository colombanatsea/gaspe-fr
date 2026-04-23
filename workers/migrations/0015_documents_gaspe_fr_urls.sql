-- 0015_documents_gaspe_fr_urls.sql
-- Session 36 : remontée des documents téléchargeables depuis gaspe.fr
-- (WordPress media library) dans la table D1 `cms_documents`.
--
-- Opérations (toutes idempotentes) :
--  1. UPDATE des 9 docs seedés par 0010 pour pointer vers les URLs gaspe.fr
--     quand elles existent, et corriger la description stale de doc-liste-membres
--     (31 membres → 30 adhérents depuis session 34).
--  2. Renommage logique : doc-accord-salaires → accord NAO 2025 (mise à jour titre
--     + description + fileUrl) ; doc-accord-prevoyance retiré (non publié sur
--     gaspe.fr) et remplacé par doc-accord-retraites-supp (nouvel id).
--  3. INSERT OR IGNORE des nouveaux documents présents sur gaspe.fr : rapport
--     extension NAO, accord égalité pro, accord retraites supp, 3 documents
--     d'adhésion, 2 kits média, 2 rapports financiers.
--
-- Les UPDATE n'écrasent que les lignes dont file_url est encore '#' (inchangé
-- par l'admin via /admin/documents) → safe si un admin a déjà uploadé un PDF
-- dans la MediaLibrary et renseigné une URL custom.

-- ============================================================
-- 1. UPDATE des docs existants pour pointer vers gaspe.fr
-- ============================================================

-- CCN 3228
UPDATE cms_documents
SET file_url = 'https://www.gaspe.fr/wp-content/uploads/2025/10/CCN-GASPE.pdf',
    file_name = 'CCN-GASPE.pdf',
    published_at = '2025-10-01',
    updated_at = datetime('now')
WHERE id = 'doc-ccn-3228' AND file_url = '#';

-- Accord salaires → renommé en Accord NAO 2025 (réutilise l'id pour préserver les liens externes)
UPDATE cms_documents
SET title = 'Accord NAO 2025 – salaires et indemnités',
    description = 'Accord de branche signé issu de la négociation annuelle obligatoire (NAO) 2025 – barèmes salariaux et indemnités applicables à la CCN 3228.',
    file_url = 'https://www.gaspe.fr/wp-content/uploads/2025/12/Accord-NAO-2025-signe.pdf',
    file_name = 'Accord-NAO-2025-signe.pdf',
    published_at = '2025-12-01',
    updated_at = datetime('now')
WHERE id = 'doc-accord-salaires' AND file_url = '#';

-- Correction description stale liste membres (31 → 30)
UPDATE cms_documents
SET description = 'Liste à jour des 30 adhérents du GASPE (26 compagnies + 4 experts).',
    updated_at = datetime('now')
WHERE id = 'doc-liste-membres' AND description LIKE '%31 membres%';

-- ============================================================
-- 2. INSERT des nouveaux documents gaspe.fr
-- ============================================================

INSERT OR IGNORE INTO cms_documents
  (id, title, description, category, file_url, file_name, published_at, sort_order, is_public, published)
VALUES
  -- Accords de branche (suite)
  ('doc-rapport-extension-nao',
   'Rapport sur l''extension de l''accord NAO',
   'Rapport motivant la demande d''extension de l''accord NAO auprès du ministère du Travail pour une application à l''ensemble de la branche.',
   'ccn-accords',
   'https://www.gaspe.fr/wp-content/uploads/2025/12/Rapport-extension-accord-NAO-GASPE.pdf',
   'Rapport-extension-accord-NAO-GASPE.pdf',
   '2025-12-15', 2, 1, 1),

  ('doc-accord-egalite-pro',
   'Accord de branche sur l''égalité professionnelle',
   'Accord signé relatif à l''égalité professionnelle entre les femmes et les hommes dans la branche maritime côtière.',
   'ccn-accords',
   'https://www.gaspe.fr/wp-content/uploads/2025/12/Accord-egalite-professionnelle-signe.pdf',
   'Accord-egalite-professionnelle-signe.pdf',
   '2025-12-01', 3, 1, 1),

  ('doc-accord-retraites-supp',
   'Accord retraites supplémentaires CCN 3228',
   'Accord de branche du 26 janvier 2026 instaurant les retraites supplémentaires pour les salariés relevant de la CCN 3228.',
   'ccn-accords',
   'https://www.gaspe.fr/wp-content/uploads/2026/02/20260126-Accord-Retraites-Supplementaires-CCN-3228.pdf',
   '20260126-Accord-Retraites-Supplementaires-CCN-3228.pdf',
   '2026-01-26', 4, 1, 1),

  -- Institutionnels (formulaires adhésion + kit média)
  ('doc-formulaire-adhesion',
   'Formulaire de demande d''adhésion',
   'Formulaire à compléter pour toute demande d''adhésion au GASPE (compagnies maritimes et experts).',
   'institutionnels',
   'https://www.gaspe.fr/wp-content/uploads/2026/01/Formulaire-demande-adhesion-1.pdf',
   'Formulaire-demande-adhesion.pdf',
   '2026-01-01', 4, 1, 1),

  ('doc-candidature-titulaire-associe',
   'Candidature Membre Titulaire ou Associé',
   'Dossier de candidature pour les compagnies maritimes de proximité souhaitant devenir membre titulaire ou associé du GASPE (format Word).',
   'institutionnels',
   'https://www.gaspe.fr/wp-content/uploads/2026/01/Candidature-Compagnie-Maritime-de-Proximite.docx',
   'Candidature-Compagnie-Maritime-de-Proximite.docx',
   '2026-01-01', 5, 1, 1),

  ('doc-candidature-expert',
   'Candidature Membre Expert',
   'Dossier de candidature pour les experts (avocats, courtiers, syndicats professionnels) souhaitant rejoindre le GASPE en qualité d''expert (format Word).',
   'institutionnels',
   'https://www.gaspe.fr/wp-content/uploads/2026/01/Candidature-Expert-Maritime-de-Proximite-1.docx',
   'Candidature-Expert-Maritime-de-Proximite.docx',
   '2026-01-01', 6, 1, 1),

  ('doc-kit-logo',
   'Logo GASPE – kit média',
   'Logos officiels du GASPE (PNG, SVG, JPG, formats horizontal et vertical). Archive ZIP destinée à la presse et aux partenaires.',
   'institutionnels',
   'https://www.gaspe.fr/wp-content/uploads/2025/07/Logo-GASPE.zip',
   'Logo-GASPE.zip',
   '2025-07-01', 7, 1, 1),

  ('doc-kit-couleurs',
   'Charte couleurs GASPE',
   'Palette de couleurs officielle GASPE (teal #1B7E8A et déclinaisons). Kit média pour usages presse et partenaires.',
   'institutionnels',
   'https://www.gaspe.fr/wp-content/uploads/2025/07/Couleurs-GASPE.pdf',
   'Couleurs-GASPE.pdf',
   '2025-07-01', 8, 1, 1),

  -- Rapports financiers
  ('doc-rapport-comptes-2024',
   'Rapport sur les comptes annuels – exercice clos au 30 juin 2024',
   'Rapport du commissaire aux comptes sur les comptes annuels de l''exercice clos au 30 juin 2024.',
   'rapports',
   'https://www.gaspe.fr/wp-content/uploads/2024/12/001-20240630-Rapport-sur-les-comptes-annuels-1.pdf',
   'Rapport-comptes-annuels-30-06-2024.pdf',
   '2024-12-01', 0, 1, 1),

  ('doc-rapport-conventions',
   'Rapport spécial sur les conventions réglementées – 2024',
   'Rapport spécial du commissaire aux comptes sur les conventions réglementées de l''exercice clos au 30 juin 2024.',
   'rapports',
   'https://www.gaspe.fr/wp-content/uploads/2024/12/001-20240630-Rapport-special-sur-les-conventions-1.pdf',
   'Rapport-conventions-reglementees-30-06-2024.pdf',
   '2024-12-01', 1, 1, 1);
