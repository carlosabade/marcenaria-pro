-- DATA PACK: DURATEX (Popular Patterns)
-- Run this in Supabase SQL Editor to populate common Duratex patterns

-- Ensure Duratex exists and get its ID
DO $$
DECLARE
    fab_id BIGINT;
BEGIN
    -- Find or Create Duratex
    SELECT id INTO fab_id FROM fabricantes_mdf WHERE nome = 'Duratex';
    
    IF fab_id IS NULL THEN
        INSERT INTO fabricantes_mdf (nome, site_oficial, total_padroes, descricao)
        VALUES ('Duratex', 'https://www.duratexmadeira.com.br', 100, 'Tradição, qualidade e inovação em painéis.')
        RETURNING id INTO fab_id;
    END IF;

    -- BULK INSERT PATTERNS
    -- 1. Unicollors (Solid Colors)
    INSERT INTO padroes_mdf (fabricante_id, nome, categoria, cor_base, linha, disponivel) VALUES
    (fab_id, 'Gianduia', 'unicolor', 'Marrom Acinzentado', 'Trama', true),
    (fab_id, 'Titânio', 'unicolor', 'Cinza', 'Trama', true),
    (fab_id, 'Grafite', 'unicolor', 'Cinza Escuro', 'Trama', true),
    (fab_id, 'Carbono', 'unicolor', 'Preto', 'Trama', true),
    (fab_id, 'Branco Diamante', 'unicolor', 'Branco', 'Essencial', true),
    (fab_id, 'Cinza Sagrado', 'unicolor', 'Cinza Claro', 'Essencial', true),
    (fab_id, 'Azul Secreto', 'unicolor', 'Azul Marinho', 'Essencial', true),
    (fab_id, 'Verde Real', 'unicolor', 'Verde Escuro', 'Essencial', true),
    (fab_id, 'Bege', 'unicolor', 'Bege', 'Essencial', true),
    (fab_id, 'Rosa Infinito', 'unicolor', 'Rosa', 'Essencial', true);

    -- 2. Woodgrains (Madeirados)
    INSERT INTO padroes_mdf (fabricante_id, nome, categoria, cor_base, linha, disponivel) VALUES
    (fab_id, 'Carvalho Malva', 'madeirado', 'Madeira Clara', 'Design', true),
    (fab_id, 'Carvalho Hannover', 'madeirado', 'Madeira Mel', 'Design', true),
    (fab_id, 'Freijó Puro', 'madeirado', 'Madeira Média', 'Design', true),
    (fab_id, 'Nogueira Caiena', 'madeirado', 'Madeira Escura', 'Design', true),
    (fab_id, 'Itapuã', 'madeirado', 'Madeira Clara', 'Essencial', true),
    (fab_id, 'Carvalho Munique', 'madeirado', 'Madeira Avermelhada', 'Design', true),
    (fab_id, 'Ipê Amarelo', 'madeirado', 'Madeira Amarela', 'Design', true),
    (fab_id, 'Pau Ferro', 'madeirado', 'Madeira Escura', 'Design', true);

    -- 3. Hybrids/Stones/Fabrics (Híbridos/Outros)
    INSERT INTO padroes_mdf (fabricante_id, nome, categoria, cor_base, linha, disponivel) VALUES
    (fab_id, 'Metrópole', 'pedra', 'Cimento Queimado', 'Design', true),
    (fab_id, 'Lunar', 'pedra', 'Cinza Pedra', 'Design', true),
    (fab_id, 'Tecido', 'tecido', 'Bege Textura', 'Trama', true),
    (fab_id, 'Ouro', 'metalizado', 'Dourado', 'Metal', true);
    
    -- Update stats
    UPDATE fabricantes_mdf SET total_padroes = (SELECT COUNT(*) FROM padroes_mdf WHERE fabricante_id = fab_id) WHERE id = fab_id;

END $$;
