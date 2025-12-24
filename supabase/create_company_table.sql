-- CRIAÇÃO DA TABELA COMPANY E PERMISSÕES (Solução Completa)

-- 1. Cria a tabela se não existir
CREATE TABLE IF NOT EXISTS company (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Habilita Segurança (RLS)
ALTER TABLE company ENABLE ROW LEVEL SECURITY;

-- 3. Limpa políticas antigas para evitar erros de duplicidade
DROP POLICY IF EXISTS "Allow Public Read Company" ON company;
DROP POLICY IF EXISTS "Allow Individual Insert" ON company;
DROP POLICY IF EXISTS "Allow Individual Update" ON company;

-- 4. Cria política: TODO MUNDO pode LER (para o portal funcionar)
CREATE POLICY "Allow Public Read Company"
ON company
FOR SELECT
TO anon, authenticated
USING (true);

-- 5. Cria política: DONO pode INSERIR/ATUALIZAR (pelo email)
CREATE POLICY "Allow Individual Insert"
ON company
FOR INSERT
TO authenticated
WITH CHECK (auth.email() = email);

CREATE POLICY "Allow Individual Update"
ON company
FOR UPDATE
TO authenticated
USING (auth.email() = email);

-- 6. Garante permissão de SELECT
GRANT SELECT ON company TO anon;
GRANT ALL ON company TO authenticated;
GRANT USAGE ON SEQUENCE company_id_seq TO authenticated; -- Se houver sequence (opcional)

-- Confirmação
SELECT 'Tabela COMPANY criada e permissões configuradas com sucesso!' as status;
