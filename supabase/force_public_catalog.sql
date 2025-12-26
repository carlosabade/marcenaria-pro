-- FORCE PUBLIC READ ACCESS FOR CATALOG
-- Run this to fix "0 patterns" issue on Vercel

-- 1. Fabricantes
ALTER TABLE fabricantes_mdf ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Read Fabricantes" ON fabricantes_mdf;
DROP POLICY IF EXISTS "Enable read access for all users" ON fabricantes_mdf;

CREATE POLICY "Public Read Fabricantes"
ON fabricantes_mdf FOR SELECT
USING (true); -- Anyone can read

-- 2. Padrões (Patterns)
ALTER TABLE padroes_mdf ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Read Padroes" ON padroes_mdf;
DROP POLICY IF EXISTS "Enable read access for all users" ON padroes_mdf;

CREATE POLICY "Public Read Padroes"
ON padroes_mdf FOR SELECT
USING (true); -- Anyone can read

-- 3. Ensure Anon role has access
GRANT SELECT ON fabricantes_mdf TO anon;
GRANT SELECT ON padroes_mdf TO anon;
GRANT SELECT ON fabricantes_mdf TO authenticated;
GRANT SELECT ON padroes_mdf TO authenticated;

-- 4. Verify Data (Debug)
UPDATE padroes_mdf SET disponivel = true WHERE disponivel IS NULL;
