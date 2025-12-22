
-- Oops! Faltou a coluna principal onde salvamos os dados completos do projeto.
-- O sistema usa uma coluna 'data' do tipo JSONB para guardar tudo (itens, medidas, etc).

ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS data jsonb;

-- Garantir que o usuário anonimo consiga ver essa coluna também
GRANT SELECT ON projects TO anon;
