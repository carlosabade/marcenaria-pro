-- PERMISSÃO TOTAL PARA DESENVOLVIMENTO
-- ATENÇÃO: Isso libera escrita para qualquer pessoa (anon/public).
-- Ideal para testar sem precisar configurar login agora.

-- 1. Remover políticas anteriores (para evitar conflitos)
DROP POLICY IF EXISTS "Permitir Gerenciamento Fabricantes" ON fabricantes_mdf;
DROP POLICY IF EXISTS "Permitir Gerenciamento Colecoes" ON colecoes_mdf;
DROP POLICY IF EXISTS "Permitir Gerenciamento Padroes" ON padroes_mdf;
DROP POLICY IF EXISTS "Permitir Gerenciamento Combinacoes" ON combinacoes_padroes;

-- 2. Criar novas políticas públicas (anon + authenticated)

-- Fabricantes
CREATE POLICY "Gerenciamento Publico Fabricantes" ON fabricantes_mdf
FOR ALL
USING (true)
WITH CHECK (true);

-- Coleções
CREATE POLICY "Gerenciamento Publico Colecoes" ON colecoes_mdf
FOR ALL
USING (true)
WITH CHECK (true);

-- Padrões
CREATE POLICY "Gerenciamento Publico Padroes" ON padroes_mdf
FOR ALL
USING (true)
WITH CHECK (true);

-- Combinações
CREATE POLICY "Gerenciamento Publico Combinacoes" ON combinacoes_padroes
FOR ALL
USING (true)
WITH CHECK (true);
