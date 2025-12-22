
-- === CORREÇÃO FINAL DE PERMISSÕES (Rode isto para resolver) ===

-- 1. Garante que RLS está ATIVO
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- 2. Limpa políticas antigas para evitar conflitos
DROP POLICY IF EXISTS "Public Read Projects" ON projects;
DROP POLICY IF EXISTS "Public Update Projects" ON projects;
DROP POLICY IF EXISTS "Public Read Access by Token" ON projects;
DROP POLICY IF EXISTS "Owner Manage Projects" ON projects;
DROP POLICY IF EXISTS "Enable all access for users" ON projects;

-- 3. === POLÍTICA DO DONO (VOCÊ) ===
-- Permite que você FAÇA TUDO nos seus projetos (Ver, Criar, Editar, Apagar)
CREATE POLICY "Owner Manage Projects"
ON projects
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 4. === POLÍTICA DO CLIENTE (PÚBLICO) ===
-- Permite VISUALIZAR se tiver token
CREATE POLICY "Public Read Projects"
ON projects
FOR SELECT
TO anon
USING (public_token IS NOT NULL);

-- Permite APROVAR (Atualizar status) se tiver token
CREATE POLICY "Public Update Projects"
ON projects
FOR UPDATE
TO anon
USING (public_token IS NOT NULL);

-- 5. Garante colunas necessárias
ALTER TABLE projects ADD COLUMN IF NOT EXISTS user_id uuid DEFAULT auth.uid();
ALTER TABLE projects ADD COLUMN IF NOT EXISTS public_token uuid;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS data jsonb;

-- 6. Garante permissões de Schema
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT, UPDATE ON projects TO anon;
GRANT SELECT ON profiles TO anon;
