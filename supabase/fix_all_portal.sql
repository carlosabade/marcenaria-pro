
-- === SCRIPT DE CORREÇÃO TOTAL (PORTAL DO CLIENTE) ===
-- Rode este script completo no Supabase SQL Editor para garantir que tudo funcione.

-- 1. Garante que a coluna 'data' existe (para salvar os detalhes do projeto)
ALTER TABLE projects ADD COLUMN IF NOT EXISTS data jsonb;

-- 2. Garante as colunas de Token e Status
ALTER TABLE projects ADD COLUMN IF NOT EXISTS public_token uuid DEFAULT gen_random_uuid();
ALTER TABLE projects ADD COLUMN IF NOT EXISTS status text DEFAULT 'active';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS approved_at timestamptz;

-- 3. PERMISSÃO DE LEITURA (Para o cliente ver o projeto)
CREATE POLICY "Public Read Projects"
ON projects FOR SELECT
TO anon
USING (public_token IS NOT NULL);

-- 4. PERMISSÃO DE APROVAÇÃO (Para o cliente aprovar)
CREATE POLICY "Public Update Projects"
ON projects FOR UPDATE
TO anon
USING (public_token IS NOT NULL)
WITH CHECK (public_token IS NOT NULL);

-- 5. PERMISSÃO DE PERFIL (Para ver o logo e nome da empresa)
CREATE POLICY "Public Read Profiles"
ON profiles FOR SELECT
TO anon
USING (true);

-- 6. Garante que o usuário anônimo tem acesso ao Schema
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

-- FIM --
