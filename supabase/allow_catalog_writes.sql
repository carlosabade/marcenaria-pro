-- POLICY UPDATE: Allow Authenticated Users to Manage Catalog
-- This script adds RLS policies to allow INSERT, UPDATE, and DELETE operations
-- for authenticated users on the catalog tables.

-- 1. Fabricantes (Brands)
CREATE POLICY "Permitir Gerenciamento Fabricantes" ON fabricantes_mdf
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 2. Coleções
CREATE POLICY "Permitir Gerenciamento Colecoes" ON colecoes_mdf
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 3. Padrões (Patterns)
CREATE POLICY "Permitir Gerenciamento Padroes" ON padroes_mdf
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 4. Combinações
CREATE POLICY "Permitir Gerenciamento Combinacoes" ON combinacoes_padroes
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
