-- PERMITIR ACESSO PÚBLICO À TABELA COMPANY (Para o portal do cliente pegar a cor/logo)

-- 1. Remove políticas antigas
DROP POLICY IF EXISTS "Allow Public Read Company" ON company;

-- 2. Habilita RLS
ALTER TABLE company ENABLE ROW LEVEL SECURITY;

-- 3. Cria política de leitura pública
CREATE POLICY "Allow Public Read Company"
ON company
FOR SELECT
TO anon
USING (true);

-- 4. Garante permissão de SELECT
GRANT SELECT ON company TO anon;

-- Confirmação
SELECT 'Permissões da tabela COMPANY atualizadas com sucesso!' as status;
