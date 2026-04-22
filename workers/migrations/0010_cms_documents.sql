-- 0010_cms_documents.sql
-- Documents officiels du GASPE (CCN, accords de branche, statuts, rapports…)
-- Géré via /admin/documents (admin only) et affiché sur /documents (public + adhérents)
-- Spec: voir README + refactor session 31

CREATE TABLE IF NOT EXISTS cms_documents (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  -- Categorie kebab-case : 'ccn-accords' | 'institutionnels' | 'reglementaire' | 'rapports'
  category TEXT NOT NULL DEFAULT 'institutionnels',
  file_url TEXT NOT NULL DEFAULT '#',
  file_name TEXT NOT NULL DEFAULT '',
  -- ISO date YYYY-MM-DD (affichage) ; sort fallback sur created_at si absent
  published_at TEXT,
  -- Ordre custom dans la même catégorie (petit = en haut) ; défaut 0
  sort_order INTEGER NOT NULL DEFAULT 0,
  -- 1 = public (visible anonyme), 0 = réservé adhérents connectés
  is_public INTEGER NOT NULL DEFAULT 1,
  -- 1 = publié, 0 = brouillon (non visible côté public)
  published INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  created_by TEXT
);

CREATE INDEX IF NOT EXISTS idx_cms_documents_category ON cms_documents(category);
CREATE INDEX IF NOT EXISTS idx_cms_documents_public ON cms_documents(is_public, published);
CREATE INDEX IF NOT EXISTS idx_cms_documents_published_at ON cms_documents(published_at DESC);

-- Seed initial : les 8 documents historiquement hardcodés dans
-- src/app/(public)/documents/page.tsx. file_url reste vide tant que l'admin
-- n'a pas uploadé le PDF réel via la MediaLibrary ; une fois le PDF uploadé,
-- il suffit à l'admin de coller l'URL /api/media/raw/:key dans le champ.
INSERT OR IGNORE INTO cms_documents
  (id, title, description, category, file_url, file_name, published_at, sort_order, is_public, published)
VALUES
  ('doc-ccn-3228', 'Convention Collective Nationale du personnel navigant des passages d''eau (CCN 3228 / IDCC 3228)', 'Convention collective nationale régissant le personnel navigant des entreprises de passages d''eau (IDCC 3228).', 'ccn-accords', '#', '', '2026-03-01', 0, 1, 1),
  ('doc-accord-salaires', 'Accord de branche sur les salaires', 'Accord NAO de la branche – barèmes salariaux et indemnités.', 'ccn-accords', '#', '', '2026-01-01', 1, 1, 1),
  ('doc-accord-prevoyance', 'Accord de branche sur la prévoyance complémentaire', 'Accord de branche régissant la prévoyance complémentaire maritime.', 'ccn-accords', '#', '', '2025-11-01', 2, 1, 1),
  ('doc-accord-formation', 'Accord de branche sur la formation professionnelle', 'Accord de branche – formation professionnelle continue et apprentissage.', 'ccn-accords', '#', '', '2025-10-01', 3, 1, 1),
  ('doc-avenant-classification', 'Avenant classification et grilles de salaires', 'Avenant relatif aux classifications et grilles de salaires de la branche.', 'ccn-accords', '#', '', '2025-09-01', 4, 1, 1),
  ('doc-statuts', 'Statuts du GASPE', 'Statuts juridiques de l''association GASPE.', 'institutionnels', '#', '', NULL, 0, 1, 1),
  ('doc-reglement-interieur', 'Règlement intérieur', 'Règlement intérieur du Groupement.', 'institutionnels', '#', '', NULL, 1, 1, 1),
  ('doc-rapport-activite-2025', 'Rapport d''activité 2025', 'Rapport annuel d''activité 2025 du GASPE.', 'institutionnels', '#', '', '2026-03-01', 2, 1, 1),
  ('doc-liste-membres', 'Liste des membres', 'Liste à jour des 31 membres adhérents du GASPE.', 'institutionnels', '#', '', '2026-01-01', 3, 1, 1);
