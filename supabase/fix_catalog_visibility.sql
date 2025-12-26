-- 🚨 RUN THIS IN SUPABASE SQL EDITOR 🚨
-- Este script corrige 3 coisas:
-- 1. Permite que QUALQUER pessoa (mesmo sem logar) veja os fabricantes e padrões.
-- 2. Permite que usuários logados vejam tudo.
-- 3. Força todos os itens atuais a ficarem "Disponíveis" para aparecerem na lista.

-- Habilita RLS (segurança) nas tabelas, caso não esteja
ALTER TABLE public.fabricantes_mdf ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.padroes_mdf ENABLE ROW LEVEL SECURITY;

-- === POLÍTICAS DE LEITURA (SELECT) ===

-- Remove políticas antigas (para evitar duplicação/conflito)
DROP POLICY IF EXISTS "Public can view active patterns" ON public.padroes_mdf;
DROP POLICY IF EXISTS "Public can view manufacturers" ON public.fabricantes_mdf;
DROP POLICY IF EXISTS "Admin full access" ON public.padroes_mdf;
DROP POLICY IF EXISTS "Admin full access manufacturers" ON public.fabricantes_mdf;
DROP POLICY IF EXISTS "Allow Read All" ON public.padroes_mdf;
DROP POLICY IF EXISTS "Allow Read All Fabricantes" ON public.fabricantes_mdf;

-- Cria nova política: TODO MUNDO pode ler fabricantes
CREATE POLICY "Allow Read All Fabricantes"
ON public.fabricantes_mdf FOR SELECT
USING (true);

-- Cria nova política: TODO MUNDO pode ler padrões
CREATE POLICY "Allow Read All"
ON public.padroes_mdf FOR SELECT
USING (true);

-- === POLÍTICAS DE ESCRITA (ADMIN ONLY) ===
-- Apenas admins podem criar/editar/excluir (usando a coluna role da tabela profiles)
CREATE POLICY "Admin All Access"
ON public.padroes_mdf FOR ALL
USING (
  exists (
    select 1 from profiles
    where profiles.id = auth.uid() and profiles.role = 'admin'
  )
);

CREATE POLICY "Admin All Access Fabricantes"
ON public.fabricantes_mdf FOR ALL
USING (
  exists (
    select 1 from profiles
    where profiles.id = auth.uid() and profiles.role = 'admin'
  )
);

-- === CORREÇÃO DE DADOS ===
-- Força todos os padrões atuais a ficarem visíveis (disponivel = true)
UPDATE public.padroes_mdf SET disponivel = true;

-- Confere quantos itens existem agora
SELECT count(*) as total_padroes_ativos FROM padroes_mdf WHERE disponivel = true;
