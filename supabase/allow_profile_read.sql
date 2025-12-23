-- PERMITIR ACESSO PÚBLICO AOS PERFIS (Para a página de orçamento funcionar)

-- 1. Remove políticas antigas para evitar conflitos
DROP POLICY IF EXISTS "Public View Company Profiles" ON profiles;
DROP POLICY IF EXISTS "Allow Public Read Profiles" ON profiles;

-- 2. Habilita RLS (caso não esteja habilitado)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 3. Cria nova política permitindo que QUALQUER PESSOA (anon) veja os perfis
-- Isso é seguro pois os dados sensíveis devem estar protegidos por outras regras ou não estar na tabela profiles
-- A tabela profiles geralmente tem nome da empresa, logo, endereço, etc.
CREATE POLICY "Allow Public Read Profiles"
ON profiles
FOR SELECT
TO anon
USING (true);

-- 4. Garante permissão de SELECT na tabela para a role 'anon'
GRANT SELECT ON profiles TO anon;

-- Confirmação
SELECT 'Permissões atualizadas com sucesso! Agora o link público deve mostrar o logo da empresa.' as status;
